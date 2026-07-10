package bot

import (
	"bufio"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/moo-d/AwaraBot/internal/scraper"
	"go.mau.fi/whatsmeow"
	waProto "go.mau.fi/whatsmeow/binary/proto"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	"google.golang.org/protobuf/proto"
)

func (b *Bot) startSTDINListener() {
	reader := bufio.NewReader(os.Stdin)

	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				b.Log.Warnf("EOF received, stopping STDIN listener")
				return
			}
			b.Log.Errorf("Read error: %v", err)
			continue
		}

		msg := strings.TrimSpace(line)
		if msg == "" {
			continue
		}

		if strings.Contains(msg, "MESSAGE_END") {
			parts := strings.SplitN(msg, "MESSAGE_END", 2)
			b.processMessage(parts[0])

			if len(parts) > 1 && parts[1] != "" {
				msg = parts[1]
				continue
			}
		}
	}
}

func (b *Bot) processMessage(msg string) {
	switch {
	case strings.HasPrefix(msg, "GROUP_INFO:"):
		b.handleGroupInfo(msg)
	case strings.HasPrefix(msg, "GROUP_ACTION:"):
		b.handleGroupAction(msg)
	case strings.HasPrefix(msg, "HIDETAG:"):
		b.handleHidetag(msg)
	case strings.HasPrefix(msg, "DOWNLOAD_MEDIA:"):
		b.handleDownloadMedia(msg)
	case strings.HasPrefix(msg, "ENHANCE:"):
		b.handleEnhance(msg)
	case strings.HasPrefix(msg, "CHATBOT:"):
		b.handleChatbot(msg)
	case strings.HasPrefix(msg, "CONVERT_STICKER:"):
		b.handleConvertSticker(msg)
	case strings.HasPrefix(msg, "SEND_STICKER:"):
		b.handleSendSticker(msg)
	case strings.HasPrefix(msg, "DOWNLOAD_FBIG:"):
		b.handleDownloadFBIG(msg)
	case strings.HasPrefix(msg, "DOWNLOAD:"):
		b.handleDownloadCommand(msg)
	case strings.HasPrefix(msg, "JOIN_GROUP:"):
		b.handleJoinGroup(msg)
	case strings.HasPrefix(msg, "SEND_BUTTONS:"):
		b.handleSendButtons(msg)
	case strings.HasPrefix(msg, "SEND_INTERACTIVE:"):
		b.handleSendInteractive(msg)
	case strings.HasPrefix(msg, "GENERATE_BRAT:"):
		b.handleGenerateBrat(msg)
	case strings.HasPrefix(msg, "SEND_LIST:"):
		b.handleSendList(msg)
	case strings.HasPrefix(msg, "SEND_VCARD:"):
		b.handleSendVCard(msg)
	case strings.HasPrefix(msg, "SEND:"):
		b.handleSendMessage(msg)
	case strings.HasPrefix(msg, "REACT:"):
		b.handleReaction(msg)
	case strings.HasPrefix(msg, "SEND_URL_IMAGE:"), strings.HasPrefix(msg, "SEND_IMAGE:"):
		b.processMediaCommand(msg, "SEND_URL_IMAGE:", MediaImage)
		b.processMediaCommand(msg, "SEND_IMAGE:", MediaImage)
	case strings.HasPrefix(msg, "SEND_URL_VIDEO:"), strings.HasPrefix(msg, "SEND_VIDEO:"):
		b.processMediaCommand(msg, "SEND_URL_VIDEO:", MediaVideo)
		b.processMediaCommand(msg, "SEND_VIDEO:", MediaVideo)
	case strings.HasPrefix(msg, "SEND_DOCUMENT:"):
		b.handleSendDocument(msg)
	case strings.HasPrefix(msg, "SEND_URL_AUDIO:"), strings.HasPrefix(msg, "SEND_AUDIO:"):
		b.processMediaCommand(msg, "SEND_URL_AUDIO:", MediaAudio)
		b.processMediaCommand(msg, "SEND_AUDIO:", MediaAudio)
	}
}

func (b *Bot) handleDownloadMedia(msg string) {
	parts := strings.SplitN(strings.TrimPrefix(msg, "DOWNLOAD_MEDIA:"), "|", 3)
	if len(parts) < 3 {
		b.Log.Errorf("Invalid DOWNLOAD_MEDIA format")
		fmt.Println("MEDIA_DATA:errorMESSAGE_END")
		return
	}

	messageID := parts[0]
	contextType := strings.TrimSuffix(parts[2], "MESSAGE_END")

	go func() {
		cached, ok := b.MessageCache.Load(messageID)
		if !ok {
			b.Log.Errorf("Message not found in cache: %s", messageID)
			fmt.Println("MEDIA_DATA:errorMESSAGE_END")
			return
		}

		cachedMsg, ok := cached.(*waE2E.Message)
		if !ok {
			b.Log.Errorf("Invalid cached message type")
			fmt.Println("MEDIA_DATA:errorMESSAGE_END")
			return
		}

		_ = contextType

		var data []byte
		var downloadErr error

		// Coba DownloadAny dulu
		data, downloadErr = b.Client.DownloadAny(context.Background(), cachedMsg)
		if downloadErr != nil {
			// Fallback: kalau sticker, coba download langsung via HTTP
			if stickerMsg := cachedMsg.GetStickerMessage(); stickerMsg != nil && stickerMsg.GetURL() != "" {
				b.Log.Infof("Fallback download sticker via HTTP: %s", stickerMsg.GetURL())
				data, downloadErr = b.Client.Download(context.Background(), stickerMsg)
			}
		}
		if downloadErr != nil {
			b.Log.Errorf("Download error: %v", downloadErr)
			fmt.Println("MEDIA_DATA:errorMESSAGE_END")
			return
		}

		fmt.Printf("MEDIA_DATA:%sMESSAGE_END\n", base64.StdEncoding.EncodeToString(data))
		os.Stdout.Sync()
	}()
}

func (b *Bot) handleEnhance(msg string) {
	parts := strings.SplitN(msg[len("ENHANCE:"):], "|", 3)
	if len(parts) < 3 {
		b.Log.Errorf("Invalid enhance format")
		return
	}

	action := parts[0]
	imageData := parts[1]
	isUrl := parts[2] == "1"

	go b.handleEnhanceRequest(action, imageData, isUrl)
}

func (b *Bot) handleChatbot(msg string) {
	parts := strings.SplitN(msg[len("CHATBOT:"):], "|", 4)
	if len(parts) < 4 {
		b.Log.Errorf("Invalid CHATBOT format")
		return
	}

	jid, err := types.ParseJID(parts[0])
	if err != nil {
		b.Log.Errorf("Failed to parse JID: %v", err)
		return
	}

	prompt := parts[1]
	model := parts[2]

	var messages []scraper.Message
	if err := json.Unmarshal([]byte(parts[3]), &messages); err != nil {
		b.Log.Errorf("Failed to unmarshal messages: %v", err)
		return
	}

	msgEvent := &events.Message{
		Info: types.MessageInfo{
			MessageSource: types.MessageSource{
				Chat:    jid,
				Sender:  jid,
				IsGroup: jid.Server == types.GroupServer,
			},
			ID:       types.MessageID("cli-" + time.Now().Format("20060102-150405")),
			PushName: "User",
		},
	}

	go b.handleGPTRequest(msgEvent, jid, prompt, model, messages)
}

func (b *Bot) handleDownloadCommand(msg string) {
	parts := strings.SplitN(msg[len("DOWNLOAD:"):], "|", 3)
	if len(parts) < 2 {
		b.Log.Errorf("Invalid download format")
		return
	}

	go b.handleDownload(parts[0], parts[1], parts[2])
}

func (b *Bot) handleSendMessage(msg string) {
	content := strings.SplitN(msg[5:], "|", 2)
	if len(content) != 2 {
		return
	}

	message := strings.ReplaceAll(content[1], "{{NL}}", "\n")
	jid, err := types.ParseJID(content[0])
	if err != nil {
		b.Log.Errorf("JID parse error: %v", err)
		return
	}

	_, err = b.Client.SendMessage(context.Background(), jid, &waProto.Message{
		Conversation: proto.String(message),
	})
	if err != nil {
		b.Log.Errorf("Send error: %v", err)
	}
}

func (b *Bot) handleReaction(msg string) {
	parts := strings.SplitN(msg[len("REACT:"):], "|", 4)
	if len(parts) < 4 {
		b.Log.Errorf("Invalid reaction format")
		return
	}

	jid, err := types.ParseJID(parts[0])
	if err != nil {
		b.Log.Errorf("Invalid JID: %v", err)
		return
	}

	messageID := parts[1]
	emoji := parts[2]
	senderjid, err := types.ParseJID(parts[3])
	if err != nil {
		b.Log.Errorf("Invalid JID: %v", err)
		return
	}

	_, err = b.Client.SendMessage(context.Background(), jid, b.Client.BuildReaction(jid, senderjid, messageID, emoji))
	if err != nil {
		b.Log.Errorf("Failed to send reaction: %v", err)
	}
}

func (b *Bot) handleDownload(service, url, format string) {
	var result interface{}
	var err error

	switch service {
	case "tiktok":
		result, err = b.TikTokScraper.DownloadVideo(url)
	case "youtube":
		if format == "mp3" {
			res, e := b.YouTubeScraper.Audio(url)
			if e == nil {
				result = map[string]interface{}{
					"status":    true,
					"url":       res.URL,
					"title":     res.Title,
					"duration":  res.Time * 60,
					"thumbnail": res.Thumbnail,
				}
			}
			err = e
		} else {
			res, e := b.YouTubeScraper.Video(url, "720")
			if e == nil {
				result = map[string]interface{}{
					"status":   true,
					"url":      res.URL,
					"title":    res.Title,
					"duration": res.Time * 60,
				}
			}
			err = e
		}
	}

	if err != nil {
		b.sendErrorResponse(err)
		return
	}

	b.sendSuccessResponse(result)
}

func (b *Bot) sendSuccessResponse(result interface{}) {
	response := map[string]interface{}{
		"type":   "download_result",
		"status": true,
		"result": result,
	}
	jsonResponse, _ := json.Marshal(response)
	fmt.Println("DOWNLOAD_RESULT:" + string(jsonResponse) + "MESSAGE_END")
	os.Stdout.Sync()
}

func (b *Bot) sendErrorResponse(err error) {
	response := map[string]interface{}{
		"type":   "download_result",
		"status": false,
		"error":  err.Error(),
	}
	jsonResponse, _ := json.Marshal(response)
	fmt.Println("DOWNLOAD_RESULT:" + string(jsonResponse) + "MESSAGE_END")
	os.Stdout.Sync()
}

func (b *Bot) handleGPTRequest(evt *events.Message, jid types.JID, prompt, model string, messages []scraper.Message) {
	if len(messages) == 0 || messages[0].Role != "system" {
		messages = append([]scraper.Message{
			{
				Role:    "system",
				Content: "Kamu adalah Alexa, asisten WhatsApp yang cerdas...",
			},
		}, messages...)
	}

	result, err := b.GPTScraper.Chat(prompt, messages, model)
	if err != nil {
		b.Log.Errorf("GPT error: %v", err)
		b.sendEvent(BotEvent{
			Type: "chatbot_error",
			Content: map[string]interface{}{
				"chat":  jid,
				"error": err.Error(),
			},
		})
		return
	}

	var jsonResponse struct {
		Cmd     string `json:"cmd"`
		Caption string `json:"caption"`
		Query   string `json:"query"`
	}

	b.sendEvent(BotEvent{
		Type: "chatbot_result",
		Content: map[string]interface{}{
			"chat":      evt.Info.Chat.String(),
			"from":      evt.Info.Sender.String(),
			"sender":    evt.Info.Sender.String(),
			"messageId": evt.Info.ID,
			"pushName":  evt.Info.PushName,
			"isGroup":   evt.Info.IsGroup,
			"message":   result.Message,
			"command":   jsonResponse.Cmd,
			"query":     jsonResponse.Query,
			"caption":   jsonResponse.Caption,
		},
	})
}

func (b *Bot) handleEnhanceRequest(action, imageData string, isUrl bool) {
	var imgBytes []byte
	var err error

	if isUrl {
		resp, err := http.Get(imageData)
		if err != nil {
			b.sendErrorResponse(err)
			return
		}
		defer resp.Body.Close()

		imgBytes, err = io.ReadAll(resp.Body)
	} else {
		imgBytes, err = base64.StdEncoding.DecodeString(imageData)
	}

	if err != nil {
		b.sendErrorResponse(err)
		return
	}

	enhanced, err := b.VyroScraper.EnhanceImage(imgBytes, action)
	if err != nil {
		b.sendErrorResponse(err)
		return
	}

	b.sendSuccessResponse(map[string]interface{}{
		"url": fmt.Sprintf("data:image/jpeg;base64,%s", base64.StdEncoding.EncodeToString(enhanced)),
	})
}

func (b *Bot) handleDownloadFBIG(msg string) {
	rawURL := strings.TrimSuffix(strings.TrimPrefix(msg, "DOWNLOAD_FBIG:"), "MESSAGE_END")
	rawURL = strings.TrimSpace(rawURL)

	go func() {
		result, err := b.FBIGScraper.Download(rawURL)
		if err != nil {
			b.sendErrorResponse(err)
			return
		}
		response := map[string]interface{}{
			"type":   "download_result",
			"status": true,
			"result": result,
		}
		jsonBytes, _ := json.Marshal(response)
		fmt.Println("DOWNLOAD_RESULT:" + string(jsonBytes) + "MESSAGE_END")
		os.Stdout.Sync()
	}()
}

func (b *Bot) handleConvertSticker(msg string) {
	b64 := strings.TrimSuffix(strings.TrimPrefix(msg, "CONVERT_STICKER:"), "MESSAGE_END")
	b64 = strings.TrimSpace(b64)

	go func() {
		imgData, err := base64.StdEncoding.DecodeString(b64)
		if err != nil {
			fmt.Println("STICKER_RESULT:errorMESSAGE_END")
			return
		}

		// Tulis ke temp file
		tmpIn, err := os.CreateTemp("", "sticker-in-*")
		if err != nil {
			fmt.Println("STICKER_RESULT:errorMESSAGE_END")
			return
		}
		// defer os.Remove(tmpIn.Name())
		tmpIn.Write(imgData)
		tmpIn.Close()

		tmpOut, err := os.CreateTemp("", "sticker-out-*.webp")
		if err != nil {
			fmt.Println("STICKER_RESULT:errorMESSAGE_END")
			return
		}
		// defer os.Remove(tmpOut.Name())
		tmpOut.Close()

		// Convert pakai ffmpeg
		cmd := exec.Command("ffmpeg", "-y",
			"-i", tmpIn.Name(),
			"-vf", "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000",
			"-vcodec", "libwebp",
			"-lossless", "0",
			"-compression_level", "6",
			"-q:v", "50",
			"-loop", "0",
			"-preset", "default",
			"-an",
			"-vsync", "0",
			"-t", "00:00:05",
			tmpOut.Name(),
		)

		if out, err := cmd.CombinedOutput(); err != nil {
			b.Log.Errorf("ffmpeg error: %v - %s", err, string(out))
			fmt.Println("STICKER_RESULT:errorMESSAGE_END")
			return
		}

		result, err := os.ReadFile(tmpOut.Name())
		if err != nil {
			fmt.Println("STICKER_RESULT:errorMESSAGE_END")
			return
		}

		fmt.Printf("STICKER_RESULT:%sMESSAGE_END\n", base64.StdEncoding.EncodeToString(result))
		os.Stdout.Sync()
	}()
}

func (b *Bot) handleSendSticker(msg string) {
	parts := strings.SplitN(strings.TrimPrefix(msg, "SEND_STICKER:"), "|", 2)
	if len(parts) < 2 {
		b.Log.Errorf("Invalid SEND_STICKER format")
		return
	}

	jid, err := types.ParseJID(parts[0])
	if err != nil {
		b.Log.Errorf("Invalid JID: %v", err)
		return
	}

	stickerData, err := base64.StdEncoding.DecodeString(
		strings.TrimSuffix(parts[1], "MESSAGE_END"),
	)
	if err != nil {
		b.Log.Errorf("Failed to decode sticker: %v", err)
		return
	}

	uploaded, err := b.Client.Upload(context.Background(), stickerData, whatsmeow.MediaImage)
	if err != nil {
		b.Log.Errorf("Failed to upload sticker: %v", err)
		return
	}

	msg2 := &waProto.Message{
		StickerMessage: &waProto.StickerMessage{
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(stickerData))),
			Mimetype:      proto.String("image/webp"),
			IsAnimated:    proto.Bool(false),
		},
	}

	if _, err := b.Client.SendMessage(context.Background(), jid, msg2); err != nil {
		b.Log.Errorf("Failed to send sticker: %v", err)
	}
}

func (b *Bot) handleSendVCard(msg string) {
	jidStr := strings.TrimSuffix(strings.TrimPrefix(msg, "SEND_VCARD:"), "MESSAGE_END")
	jidStr = strings.TrimSpace(jidStr)

	jid, err := types.ParseJID(jidStr)
	if err != nil {
		b.Log.Errorf("Invalid JID: %v", err)
		return
	}

	owner1 := os.Getenv("OWNER_1")
	owner2 := os.Getenv("OWNER_2")

	buildVCard := func(raw string) string {
		parts := strings.SplitN(raw, ":", 3)
		if len(parts) < 3 {
			return ""
		}
		phone, name, username := parts[0], parts[1], parts[2]
		return "BEGIN:VCARD\nVERSION:3.0\nFN:" + name + "\nORG:" + username + "\nTEL;type=CELL;type=VOICE;waid=" + phone + ":+" + phone + "\nEND:VCARD"
	}

	var contacts []*waE2E.ContactMessage
	for _, raw := range []string{owner1, owner2} {
		if raw == "" {
			continue
		}
		parts := strings.SplitN(raw, ":", 3)
		if len(parts) < 3 {
			continue
		}
		vcard := buildVCard(raw)
		contacts = append(contacts, &waE2E.ContactMessage{
			DisplayName: proto.String(parts[1]),
			Vcard:       proto.String(vcard),
		})
	}

	var sendMsg *waE2E.Message
	if len(contacts) == 1 {
		sendMsg = &waE2E.Message{
			ContactMessage: contacts[0],
		}
	} else {
		sendMsg = &waE2E.Message{
			ContactsArrayMessage: &waE2E.ContactsArrayMessage{
				Contacts: contacts,
			},
		}
	}

	if _, err := b.Client.SendMessage(context.Background(), jid, sendMsg); err != nil {
		b.Log.Errorf("Failed to send vcard: %v", err)
	}
}

func (b *Bot) handleSendList(msg string) {
	content := strings.TrimSuffix(strings.TrimPrefix(msg, "SEND_LIST:"), "MESSAGE_END")
	content = strings.TrimSpace(content)

	var payload struct {
		JID      string `json:"jid"`
		Title    string `json:"title"`
		Body     string `json:"body"`
		Footer   string `json:"footer"`
		Button   string `json:"button"`
		ImageB64 string `json:"image"`
		Sections []struct {
			Title string `json:"title"`
			Rows  []struct {
				ID          string `json:"id"`
				Title       string `json:"title"`
				Description string `json:"description"`
			} `json:"rows"`
		} `json:"sections"`
	}

	if err := json.Unmarshal([]byte(content), &payload); err != nil {
		b.Log.Errorf("Failed to parse list payload: %v", err)
		return
	}

	jid, err := types.ParseJID(payload.JID)
	if err != nil {
		b.Log.Errorf("Invalid JID: %v", err)
		return
	}

	var sections []*waE2E.ListMessage_Section
	for _, s := range payload.Sections {
		var rows []*waE2E.ListMessage_Row
		for _, r := range s.Rows {
			rows = append(rows, &waE2E.ListMessage_Row{
				RowID:       proto.String(r.ID),
				Title:       proto.String(r.Title),
				Description: proto.String(r.Description),
			})
		}
		sections = append(sections, &waE2E.ListMessage_Section{
			Title: proto.String(s.Title),
			Rows:  rows,
		})
	}

	listType := waE2E.ListMessage_SINGLE_SELECT
	listMsg := &waE2E.ListMessage{
		Title:      proto.String(payload.Title),
		Description: proto.String(payload.Body),
		ButtonText: proto.String(payload.Button),
		FooterText: proto.String(payload.Footer),
		ListType:   &listType,
		Sections:   sections,
	}

	// Kalau ada image, kirim dulu sebagai image dengan caption kosong
	// lalu kirim list message
	if payload.ImageB64 != "" {
		imgData, err := base64.StdEncoding.DecodeString(payload.ImageB64)
		if err == nil {
			b.uploadAndSendMedia(jid, imgData, MediaImage, "")
		}
	}

	_, err = b.Client.SendMessage(context.Background(), jid, &waE2E.Message{
		ListMessage: listMsg,
	})
	if err != nil {
		b.Log.Errorf("Failed to send list: %v", err)
	}
}

func (b *Bot) handleSendInteractive(msg string) {
	content := strings.TrimSuffix(strings.TrimPrefix(msg, "SEND_INTERACTIVE:"), "MESSAGE_END")
	content = strings.TrimSpace(content)

	var payload struct {
		JID     string `json:"jid"`
		Header  string `json:"header"`
		Body    string `json:"body"`
		Footer  string `json:"footer"`
		Buttons []struct {
			Name   string `json:"name"`
			Params string `json:"params"`
		} `json:"buttons"`
	}

	if err := json.Unmarshal([]byte(content), &payload); err != nil {
		b.Log.Errorf("Failed to parse interactive payload: %v", err)
		return
	}

	jid, err := types.ParseJID(payload.JID)
	if err != nil {
		b.Log.Errorf("Invalid JID: %v", err)
		return
	}

	var buttons []*waE2E.InteractiveMessage_NativeFlowMessage_NativeFlowButton
	for _, btn := range payload.Buttons {
		buttons = append(buttons, &waE2E.InteractiveMessage_NativeFlowMessage_NativeFlowButton{
			Name:             proto.String(btn.Name),
			ButtonParamsJSON: proto.String(btn.Params),
		})
	}

	msgVersion := int32(1)
	interactiveMsg := &waE2E.InteractiveMessage{
		Header: &waE2E.InteractiveMessage_Header{
			Title:              proto.String(payload.Header),
			HasMediaAttachment: proto.Bool(false),
		},
		Body: &waE2E.InteractiveMessage_Body{
			Text: proto.String(payload.Body),
		},
		Footer: &waE2E.InteractiveMessage_Footer{
			Text: proto.String(payload.Footer),
		},
		InteractiveMessage: &waE2E.InteractiveMessage_NativeFlowMessage_{
			NativeFlowMessage: &waE2E.InteractiveMessage_NativeFlowMessage{
				Buttons:        buttons,
				MessageVersion: &msgVersion,
			},
		},
	}

	_, err = b.Client.SendMessage(context.Background(), jid, &waE2E.Message{
		InteractiveMessage: interactiveMsg,
	})
	if err != nil {
		b.Log.Errorf("Failed to send interactive: %v", err)
	}
}

func (b *Bot) handleSendButtons(msg string) {
	content := strings.TrimSuffix(strings.TrimPrefix(msg, "SEND_BUTTONS:"), "MESSAGE_END")
	content = strings.TrimSpace(content)

	var payload struct {
		JID     string `json:"jid"`
		Title   string `json:"title"`
		Body    string `json:"body"`
		Footer  string `json:"footer"`
		Buttons []struct {
			ID   string `json:"id"`
			Text string `json:"text"`
		} `json:"buttons"`
	}

	if err := json.Unmarshal([]byte(content), &payload); err != nil {
		b.Log.Errorf("Failed to parse buttons payload: %v", err)
		return
	}

	jid, err := types.ParseJID(payload.JID)
	if err != nil {
		b.Log.Errorf("Invalid JID: %v", err)
		return
	}

	btnType := waE2E.ButtonsMessage_Button_RESPONSE
	var buttons []*waE2E.ButtonsMessage_Button
	for _, btn := range payload.Buttons {
		buttons = append(buttons, &waE2E.ButtonsMessage_Button{
			ButtonID:   proto.String(btn.ID),
			ButtonText: &waE2E.ButtonsMessage_Button_ButtonText{DisplayText: proto.String(btn.Text)},
			Type:       &btnType,
		})
	}

	headerType := waE2E.ButtonsMessage_TEXT
	_, err = b.Client.SendMessage(context.Background(), jid, &waE2E.Message{
		ButtonsMessage: &waE2E.ButtonsMessage{
			ContentText: proto.String(payload.Body),
			FooterText:  proto.String(payload.Footer),
			Buttons:     buttons,
			HeaderType:  &headerType,
			Header: &waE2E.ButtonsMessage_Text{Text: payload.Title},
		},
	})
	if err != nil {
		b.Log.Errorf("Failed to send buttons: %v", err)
	} else {
		b.Log.Infof("Buttons sent successfully")
	}
}

func (b *Bot) handleJoinGroup(msg string) {
	link := strings.TrimSuffix(strings.TrimPrefix(msg, "JOIN_GROUP:"), "MESSAGE_END")
	link = strings.TrimSpace(link)

	// Extract invite code dari link
	parts := strings.Split(link, "chat.whatsapp.com/")
	if len(parts) < 2 {
		b.Log.Errorf("Invalid group link: %s", link)
		return
	}
	code := strings.TrimSpace(parts[1])

	_, err := b.Client.JoinGroupWithLink(context.Background(), code)
	if err != nil {
		b.Log.Errorf("Failed to join group: %v", err)
	} else {
		b.Log.Infof("Successfully joined group with code: %s", code)
	}
}

func (b *Bot) handleSendDocument(msg string) {
	content := strings.TrimSuffix(strings.TrimPrefix(msg, "SEND_DOCUMENT:"), "MESSAGE_END")
	content = strings.TrimSpace(content)

	// Format: jid|filename|caption|base64data
	parts := strings.SplitN(content, "|", 4)
	if len(parts) < 4 {
		b.Log.Errorf("Invalid SEND_DOCUMENT format")
		return
	}

	jid, err := types.ParseJID(parts[0])
	if err != nil {
		b.Log.Errorf("Invalid JID: %v", err)
		return
	}

	filename := parts[1]
	caption := strings.ReplaceAll(parts[2], "{{NL}}", "\n")

	data, err := base64.StdEncoding.DecodeString(parts[3])
	if err != nil {
		b.Log.Errorf("Failed to decode document: %v", err)
		return
	}

	go func() {
		if err := b.uploadAndSendDocument(jid, data, filename, caption); err != nil {
			b.Log.Errorf("Document send error: %v", err)
		}
	}()
}

func (b *Bot) handleGenerateBrat(msg string) {
	text := strings.TrimSuffix(strings.TrimPrefix(msg, "GENERATE_BRAT:"), "MESSAGE_END")
	text = strings.TrimSpace(text)

	go func() {
		tmpOut, err := os.CreateTemp("", "brat-*.jpg")
		if err != nil {
			fmt.Println("BRAT_RESULT:errorMESSAGE_END")
			return
		}
		defer os.Remove(tmpOut.Name())
		tmpOut.Close()

		cmd := exec.Command("convert",
			"-size", "512x512",
			"xc:#8ace00",
			"-gravity", "center",
			"-font", "Helvetica-Bold",
			"-pointsize", "48",
			"-fill", "black",
			"-blur", "0x1.5",
			"-annotate", "+0+0", text,
			tmpOut.Name(),
		)

		if out, err := cmd.CombinedOutput(); err != nil {
			b.Log.Errorf("brat generate error: %v - %s", err, string(out))
			fmt.Println("BRAT_RESULT:errorMESSAGE_END")
			return
		}

		data, err := os.ReadFile(tmpOut.Name())
		if err != nil {
			fmt.Println("BRAT_RESULT:errorMESSAGE_END")
			return
		}

		fmt.Printf("BRAT_RESULT:%sMESSAGE_END\n", base64.StdEncoding.EncodeToString(data))
		os.Stdout.Sync()
	}()
}

func (b *Bot) handleGroupAction(msg string) {
	content := strings.TrimSuffix(strings.TrimPrefix(msg, "GROUP_ACTION:"), "MESSAGE_END")
	content = strings.TrimSpace(content)

	var payload struct {
		Action   string `json:"action"`
		GroupJID string `json:"groupJid"`
		Target   string `json:"target"`
	}

	if err := json.Unmarshal([]byte(content), &payload); err != nil {
		b.Log.Errorf("Failed to parse group action: %v", err)
		fmt.Println("GROUP_ACTION_RESULT:errorMESSAGE_END")
		return
	}

	groupJID, err := types.ParseJID(payload.GroupJID)
	if err != nil {
		b.Log.Errorf("Invalid group JID: %v", err)
		fmt.Println("GROUP_ACTION_RESULT:errorMESSAGE_END")
		return
	}

	targetJID, err := types.ParseJID(payload.Target)
	if err != nil {
		b.Log.Errorf("Invalid target JID: %v", err)
		fmt.Println("GROUP_ACTION_RESULT:errorMESSAGE_END")
		return
	}

	var changeType whatsmeow.ParticipantChange
	switch payload.Action {
	case "kick":
		changeType = whatsmeow.ParticipantChangeRemove
	case "promote":
		changeType = whatsmeow.ParticipantChangePromote
	case "demote":
		changeType = whatsmeow.ParticipantChangeDemote
	default:
		b.Log.Errorf("Unknown group action: %s", payload.Action)
		fmt.Println("GROUP_ACTION_RESULT:errorMESSAGE_END")
		return
	}

	_, err = b.Client.UpdateGroupParticipants(context.Background(), groupJID, []types.JID{targetJID}, changeType)
	if err != nil {
		b.Log.Errorf("Group action failed: %v", err)
		fmt.Println("GROUP_ACTION_RESULT:errorMESSAGE_END")
		return
	}

	fmt.Println("GROUP_ACTION_RESULT:okMESSAGE_END")
	os.Stdout.Sync()
}

func (b *Bot) handleHidetag(msg string) {
	content := strings.TrimSuffix(strings.TrimPrefix(msg, "HIDETAG:"), "MESSAGE_END")
	parts := strings.SplitN(content, "|", 2)
	if len(parts) < 2 {
		return
	}

	groupJID, err := types.ParseJID(parts[0])
	if err != nil {
		b.Log.Errorf("Invalid group JID: %v", err)
		return
	}

	text := strings.ReplaceAll(parts[1], "{{NL}}", "\n")

	info, err := b.Client.GetGroupInfo(context.Background(), groupJID)
	if err != nil {
		b.Log.Errorf("Failed to get group info: %v", err)
		return
	}

	var mentions []string
	for _, p := range info.Participants {
		mentions = append(mentions, p.JID.String())
	}

	_, err = b.Client.SendMessage(context.Background(), groupJID, &waE2E.Message{
		ExtendedTextMessage: &waE2E.ExtendedTextMessage{
			Text: proto.String(text),
			ContextInfo: &waE2E.ContextInfo{
				MentionedJID: mentions,
			},
		},
	})
	if err != nil {
		b.Log.Errorf("Failed to send hidetag: %v", err)
	}
}

func (b *Bot) handleGroupInfo(msg string) {
	content := strings.TrimSuffix(strings.TrimPrefix(msg, "GROUP_INFO:"), "MESSAGE_END")
	content = strings.TrimSpace(content)

	var payload struct {
		Action   string `json:"action"`
		GroupJID string `json:"groupJid"`
		Value    string `json:"value"`
	}

	if err := json.Unmarshal([]byte(content), &payload); err != nil {
		fmt.Println("GROUP_INFO_RESULT:{\"status\":false,\"error\":\"parse error\"}MESSAGE_END")
		return
	}

	groupJID, err := types.ParseJID(payload.GroupJID)
	if err != nil {
		fmt.Println("GROUP_INFO_RESULT:{\"status\":false,\"error\":\"invalid jid\"}MESSAGE_END")
		return
	}

	var resultErr error
	var linkResult string

	switch payload.Action {
	case "setname":
		resultErr = b.Client.SetGroupName(context.Background(), groupJID, payload.Value)
	case "setdesc":
		resultErr = b.Client.SetGroupTopic(context.Background(), groupJID, "", "", payload.Value)
	case "getlink":
		linkResult, resultErr = b.Client.GetGroupInviteLink(context.Background(), groupJID, false)
	case "revoke":
		linkResult, resultErr = b.Client.GetGroupInviteLink(context.Background(), groupJID, true)
	default:
		resultErr = fmt.Errorf("unknown action")
	}

	response := map[string]interface{}{
		"status": resultErr == nil,
	}
	if resultErr != nil {
		response["error"] = resultErr.Error()
		b.Log.Errorf("Group info action failed: %v", resultErr)
	}
	if linkResult != "" {
		response["link"] = linkResult
	}

	jsonBytes, _ := json.Marshal(response)
	fmt.Println("GROUP_INFO_RESULT:" + string(jsonBytes) + "MESSAGE_END")
	os.Stdout.Sync()
}
