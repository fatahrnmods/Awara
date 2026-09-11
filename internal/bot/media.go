package bot

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"time"
	"strconv"
	"strings"

	"go.mau.fi/whatsmeow"
	waProto "go.mau.fi/whatsmeow/binary/proto"
	"go.mau.fi/whatsmeow/types"
	"google.golang.org/protobuf/proto"
)

type MediaType string

const (
	MediaImage MediaType = "image"
	MediaVideo MediaType = "video"
	MediaAudio MediaType = "audio"
	MediaDocument MediaType = "document"
)

func getAudioDuration(path string) (float64, error) {
	cmd := exec.Command("ffprobe",
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		path,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return 0, fmt.Errorf("ffprobe error: %v, output: %s", err, string(output))
	}

	durationStr := strings.TrimSpace(string(output))
	return strconv.ParseFloat(durationStr, 64)
}

func getVideoDuration(path string) (float64, error) {
	cmd := exec.Command("ffprobe",
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		path,
	)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return 0, fmt.Errorf("ffprobe error: %v, output: %s", err, string(output))
	}
	durationStr := strings.TrimSpace(string(output))
	return strconv.ParseFloat(durationStr, 64)
}

func generateVideoThumbnail(videoPath string) ([]byte, error) {
	tmpThumb, err := os.CreateTemp("", "thumb_*.jpg")
	if err != nil {
		return nil, err
	}
	defer os.Remove(tmpThumb.Name())
	tmpThumb.Close()

	cmd := exec.Command("ffmpeg", "-y",
		"-i", videoPath,
		"-ss", "00:00:00.500",
		"-vframes", "1",
		"-vf", "scale=320:-1",
		tmpThumb.Name(),
	)
	if out, err := cmd.CombinedOutput(); err != nil {
		return nil, fmt.Errorf("ffmpeg thumbnail error: %v, output: %s", err, string(out))
	}

	return os.ReadFile(tmpThumb.Name())
}

func (b *Bot) getVideoInfo(videoData []byte) (float64, []byte, error) {
	tmpFile, err := os.CreateTemp("", "whatsapp_video_*.mp4")
	if err != nil {
		return 0, nil, fmt.Errorf("failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()

	if _, err := tmpFile.Write(videoData); err != nil {
		return 0, nil, fmt.Errorf("failed to write temp file: %v", err)
	}
	tmpFile.Close()

	duration, durErr := getVideoDuration(tmpFile.Name())
	thumbnail, thumbErr := generateVideoThumbnail(tmpFile.Name())

	if durErr != nil {
		durErr = nil
		duration = 0
	}
	if thumbErr != nil {
		thumbErr = nil
		thumbnail = nil
	}

	return duration, thumbnail, nil
}

func (b *Bot) getAudioDuration(audioData []byte) (float64, error) {
	tmpFile, err := os.CreateTemp("", "whatsapp_audio_*.tmp")
	if err != nil {
		return 0, fmt.Errorf("failed to create temp file: %v", err)
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()

	if _, err := tmpFile.Write(audioData); err != nil {
		return 0, fmt.Errorf("failed to write temp file: %v", err)
	}
	tmpFile.Close()

	return getAudioDuration(tmpFile.Name())
}

func (b *Bot) uploadAndSendMedia(jid types.JID, mediaData []byte, mediaType MediaType, caption string) error {
	var waMediaType whatsmeow.MediaType
	var msg *waProto.Message

	switch mediaType {
	case MediaImage:
		waMediaType = whatsmeow.MediaImage
		msg = &waProto.Message{
			ImageMessage: &waProto.ImageMessage{
				Caption: proto.String(caption),
			},
		}
	case MediaVideo:
		waMediaType = whatsmeow.MediaVideo
		msg = &waProto.Message{
			VideoMessage: &waProto.VideoMessage{
				Caption: proto.String(caption),
			},
		}
	case MediaAudio:
		waMediaType = whatsmeow.MediaAudio
		msg = &waProto.Message{
			AudioMessage: &waProto.AudioMessage{},
		}
	default:
		return fmt.Errorf("unsupported media type")
	}

	uploaded, err := b.Client.Upload(context.Background(), mediaData, waMediaType)
	if err != nil {
		return fmt.Errorf("upload failed: %v", err)
	}

	switch mediaType {
	case MediaImage:
		imgMsg := msg.ImageMessage
		imgMsg.Mimetype = proto.String(http.DetectContentType(mediaData))
		imgMsg.URL = proto.String(uploaded.URL)
		imgMsg.DirectPath = proto.String(uploaded.DirectPath)
		imgMsg.MediaKey = uploaded.MediaKey
		imgMsg.FileEncSHA256 = uploaded.FileEncSHA256
		imgMsg.FileSHA256 = uploaded.FileSHA256
		imgMsg.FileLength = proto.Uint64(uint64(len(mediaData)))
	case MediaVideo:
		vidMsg := msg.VideoMessage
		vidMsg.Mimetype = proto.String(http.DetectContentType(mediaData))
		vidMsg.URL = proto.String(uploaded.URL)
		vidMsg.DirectPath = proto.String(uploaded.DirectPath)
		vidMsg.MediaKey = uploaded.MediaKey
		vidMsg.FileEncSHA256 = uploaded.FileEncSHA256
		vidMsg.FileSHA256 = uploaded.FileSHA256
		vidMsg.FileLength = proto.Uint64(uint64(len(mediaData)))

		if duration, thumbnail, err := b.getVideoInfo(mediaData); err == nil {
			if duration > 0 {
				vidMsg.Seconds = proto.Uint32(uint32(duration + 0.5))
			}
			if thumbnail != nil {
				vidMsg.JPEGThumbnail = thumbnail
			}
		}
	case MediaAudio:
		audioMsg := msg.AudioMessage
		audioMsg.Mimetype = proto.String("audio/mpeg")
		audioMsg.URL = proto.String(uploaded.URL)
		audioMsg.DirectPath = proto.String(uploaded.DirectPath)
		audioMsg.MediaKey = uploaded.MediaKey
		audioMsg.FileEncSHA256 = uploaded.FileEncSHA256
		audioMsg.FileSHA256 = uploaded.FileSHA256
		audioMsg.FileLength = proto.Uint64(uint64(len(mediaData)))

		if duration, err := b.getAudioDuration(mediaData); err == nil {
			audioMsg.Seconds = proto.Uint32(uint32(duration + 0.5))
		}
	}

	_, err = b.Client.SendMessage(context.Background(), jid, msg)
	return err
}

func (b *Bot) processMediaCommand(msg string, prefix string, mediaType MediaType) {
	content := strings.SplitN(strings.TrimPrefix(msg, prefix), "|", 3)
	if len(content) < 2 {
		b.Log.Errorf("Invalid %s message format", mediaType)
		return
	}

	jid, err := types.ParseJID(content[0])
	if err != nil {
		b.Log.Errorf("JID parse error: %v", err)
		return
	}

	var mediaData []byte
	var caption string

	if strings.HasPrefix(prefix, "SEND_URL_") {
		url := content[1]
		if !strings.HasPrefix(url, "http") {
			b.Log.Errorf("Invalid URL scheme: %s", url)
			return
		}

		req, reqErr := http.NewRequest("GET", url, nil)
		if reqErr != nil {
			b.Log.Errorf("Failed to create request for %s: %v", mediaType, reqErr)
			return
		}
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
		req.Header.Set("Referer", "https://www.tikwm.com/")
		req.Header.Set("Accept", "*/*")
		req.Header.Set("Accept-Language", "en-US,en;q=0.9")
		req.Header.Set("Connection", "keep-alive")

		client := &http.Client{Timeout: 600 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			b.Log.Errorf("Failed to download %s: %v", mediaType, err)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			b.Log.Errorf("Failed to download %s: unexpected status %d", mediaType, resp.StatusCode)
			return
		}

		mediaData, err = io.ReadAll(resp.Body)
		if err != nil {
			b.Log.Errorf("Failed to read %s data: %v", mediaType, err)
			return
		}

		if len(mediaData) == 0 {
			b.Log.Errorf("Downloaded %s is empty", mediaType)
			return
		}

		if len(content) > 2 {
			caption = strings.ReplaceAll(content[2], "{{NL}}", "\n")
		}
	} else {
		var err error
		mediaData, err = base64.StdEncoding.DecodeString(content[1])
		if err != nil {
			return
		}

		if len(content) > 2 {
			caption = strings.ReplaceAll(content[2], "{{NL}}", "\n")
		}
	}

	if err := b.uploadAndSendMedia(jid, mediaData, mediaType, caption); err != nil {
		b.Log.Errorf("%s send error: %v", strings.Title(string(mediaType)), err)
	}
}

func (b *Bot) uploadAndSendDocument(jid types.JID, data []byte, filename, caption string) error {
	uploaded, err := b.Client.Upload(context.Background(), data, whatsmeow.MediaDocument)
	if err != nil {
		return fmt.Errorf("upload failed: %v", err)
	}

	msg := &waProto.Message{
		DocumentMessage: &waProto.DocumentMessage{
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(data))),
			Mimetype:      proto.String(http.DetectContentType(data)),
			FileName:      proto.String(filename),
			Caption:       proto.String(caption),
		},
	}

	_, err = b.Client.SendMessage(context.Background(), jid, msg)
	return err
}
