package scraper

import (
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type FBIGScraper struct{}

type FBIGResult struct {
	Status bool     `json:"status"`
	Title  string   `json:"title"`
	Video  string   `json:"video,omitempty"`
	Images []string `json:"images,omitempty"`
	Error  string   `json:"error,omitempty"`
}

func NewFBIGScraper() *FBIGScraper {
	return &FBIGScraper{}
}

func (f *FBIGScraper) Download(rawURL string) (*FBIGResult, error) {
	tmpDir, err := os.MkdirTemp("/tmp", "fbig-*")
	if err != nil {
		return nil, err
	}

	cmd := exec.Command("yt-dlp",
		"--no-playlist",
		"-f", "best[ext=mp4]/best",
		"-o", filepath.Join(tmpDir, "%(autonumber)s.%(ext)s"),
		"--merge-output-format", "mp4",
		rawURL,
	)
	if out, err := cmd.CombinedOutput(); err != nil {
		os.RemoveAll(tmpDir)
		return nil, errors.New("yt-dlp gagal: " + string(out))
	}

	titleOut, _ := exec.Command("yt-dlp", "--no-playlist", "--get-title", rawURL).Output()
	title := strings.TrimSpace(string(titleOut))

	entries, err := os.ReadDir(tmpDir)
	if err != nil || len(entries) == 0 {
		os.RemoveAll(tmpDir)
		return nil, errors.New("file tidak ditemukan setelah download")
	}

	var files []string
	for _, e := range entries {
		if !e.IsDir() {
			files = append(files, filepath.Join(tmpDir, e.Name()))
		}
	}

	if len(files) == 1 {
		return &FBIGResult{
			Status: true,
			Title:  title,
			Video:  "file:" + files[0],
		}, nil
	}

	var images []string
	for _, fp := range files {
		images = append(images, "file:"+fp)
	}

	return &FBIGResult{Status: true, Title: title, Images: images}, nil
}
