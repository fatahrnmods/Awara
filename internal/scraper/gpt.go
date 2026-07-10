package scraper

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatResult struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
}

type GPTScraper struct {
	client *http.Client
}

func NewGPTScraper() *GPTScraper {
	return &GPTScraper{
		client: &http.Client{Timeout: 60 * time.Second},
	}
}

func (g *GPTScraper) Chat(prompt string, messages []Message, model string) (ChatResult, error) {
	if prompt == "" {
		return ChatResult{}, errors.New("prompt cannot be empty")
	}

	// Ambil system message
	var systemMsg string
	for _, m := range messages {
		if m.Role == "system" {
			systemMsg = m.Content
			break
		}
	}

	// Bangun messages untuk API
	var msgs []map[string]string
	if systemMsg != "" {
		msgs = append(msgs, map[string]string{
			"role":    "system",
			"content": systemMsg,
		})
	}

	// Tambah history (skip system)
	for _, m := range messages {
		if m.Role != "system" {
			msgs = append(msgs, map[string]string{
				"role":    m.Role,
				"content": m.Content,
			})
		}
	}

	msgs = append(msgs, map[string]string{
		"role":    "user",
		"content": prompt,
	})

	body, _ := json.Marshal(map[string]interface{}{
		"messages": msgs,
		"model":    "openai",
		"jsonMode": false,
		"seed":     42,
	})

	var resp *http.Response
	var err error
	for attempt := 0; attempt < 3; attempt++ {
		resp, err = g.client.Post(
			"https://text.pollinations.ai/",
			"application/json",
			bytes.NewBuffer(body),
		)
		if err == nil {
			break
		}
		if attempt < 2 {
			body, _ = json.Marshal(map[string]interface{}{
				"messages": msgs,
				"model":    "openai",
				"jsonMode": false,
				"seed":     42,
			})
			time.Sleep(2 * time.Second)
		}
	}
	if err != nil {
		return ChatResult{}, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return ChatResult{}, fmt.Errorf("API returned status: %d", resp.StatusCode)
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return ChatResult{}, fmt.Errorf("failed to read response: %w", err)
	}

	return ChatResult{
		Status:  true,
		Message: strings.TrimSpace(string(respBody)),
	}, nil
}
