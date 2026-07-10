package scraper

import (
	"errors"
	"os/exec"
	"regexp"
	"strings"
)

type YouTubeScraper struct{}

type VideoInfo struct {
	Title     string
	Duration  float64
	Thumbnail string
	Author    string
	URL       string
	Time      float64
}

func NewYouTubeScraper() *YouTubeScraper {
	return &YouTubeScraper{}
}

func (y *YouTubeScraper) extractYouTubeID(url string) (string, error) {
	re := regexp.MustCompile(`(?:v=|\/)([0-9A-Za-z_-]{11}).*`)
	match := re.FindStringSubmatch(url)
	if len(match) > 1 {
		return match[1], nil
	}
	return "", errors.New("gagal ekstrak YouTube ID")
}

func (y *YouTubeScraper) getURL(videoURL string, format string) (string, error) {
	args := []string{
		"--no-playlist",
		"--get-url",
		"-f", format,
		videoURL,
	}
	out, err := exec.Command("yt-dlp", args...).Output()
	if err != nil {
		return "", errors.New("yt-dlp gagal: " + err.Error())
	}
	link := strings.TrimSpace(string(out))
	if link == "" {
		return "", errors.New("URL kosong dari yt-dlp")
	}
	return link, nil
}

func (y *YouTubeScraper) getTitle(videoURL string) string {
	out, err := exec.Command("yt-dlp", "--no-playlist", "--get-title", videoURL).Output()
	if err != nil {
		return "Unknown Title"
	}
	return strings.TrimSpace(string(out))
}

func (y *YouTubeScraper) getDuration(videoURL string) float64 {
	out, err := exec.Command("yt-dlp", "--no-playlist", "--get-duration", videoURL).Output()
	if err != nil {
		return 0
	}
	// format: MM:SS atau HH:MM:SS
	parts := strings.Split(strings.TrimSpace(string(out)), ":")
	var total float64
	for _, p := range parts {
		total = total*60 + parseFloat(p)
	}
	return total
}

func parseFloat(s string) float64 {
	var f float64
	for _, c := range s {
		if c >= '0' && c <= '9' {
			f = f*10 + float64(c-'0')
		}
	}
	return f
}

func (y *YouTubeScraper) Audio(videoURL string) (*VideoInfo, error) {
	link, err := y.getURL(videoURL, "bestaudio[ext=m4a]/bestaudio")
	if err != nil {
		return nil, err
	}
	title := y.getTitle(videoURL)
	dur := y.getDuration(videoURL)
	return &VideoInfo{
		Title: title,
		URL:   link,
		Time:  dur / 60,
	}, nil
}

func (y *YouTubeScraper) Video(videoURL string, quality string) (*VideoInfo, error) {
	link, err := y.getURL(videoURL, "best[ext=mp4]/best")
	if err != nil {
		return nil, err
	}
	title := y.getTitle(videoURL)
	dur := y.getDuration(videoURL)
	return &VideoInfo{
		Title: title,
		URL:   link,
		Time:  dur / 60,
	}, nil
}
