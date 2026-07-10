package bot

import (
	waProto "go.mau.fi/whatsmeow/binary/proto"
	"go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types/events"
)

func (b *Bot) eventHandler(evt interface{}) {
	switch v := evt.(type) {
	case *events.Message:
		b.handleMessage(v)
	case *events.Connected:
		b.onConnected(v)
	case *events.Disconnected:
		b.onDisconnected()
	case *events.HistorySync:
		b.Log.Infof("History sync: %d conversations", len(v.Data.GetConversations()))
	}
}

func (b *Bot) handleMessage(msg *events.Message) {
	if msg.Info.IsFromMe {
		return
	}

	text := ""
	if conv := msg.Message.GetConversation(); conv != "" {
		text = conv
	} else if ext := msg.Message.GetExtendedTextMessage(); ext != nil {
		text = ext.GetText()
	} else if img := msg.Message.GetImageMessage(); img != nil {
		text = img.GetCaption()
	} else if vid := msg.Message.GetVideoMessage(); vid != nil {
		text = vid.GetCaption()
	}

	isImage := msg.Message.GetImageMessage() != nil
	isSticker := msg.Message.GetStickerMessage() != nil
	if isSticker {
		isImage = true
		// Store full message dengan semua media keys
		b.MessageCache.Store(msg.Info.ID, msg.Message)
		b.Log.Infof("Cached sticker: %s url:%s", msg.Info.ID, msg.Message.GetStickerMessage().GetURL())
	}
	var quotedMsg *waProto.Message
	var isQuotedImage bool
	var quotedMsgID string
	var quotedParticipant string

	if extMsg := msg.Message.GetExtendedTextMessage(); extMsg != nil {
		if ctxInfo := extMsg.GetContextInfo(); ctxInfo != nil {
			quotedMsg = ctxInfo.GetQuotedMessage()
			quotedMsgID = ctxInfo.GetStanzaID()
			quotedParticipant = ctxInfo.GetParticipant()
			isQuotedImage = quotedMsg.GetImageMessage() != nil || quotedMsg.GetStickerMessage() != nil
			if quotedMsg.GetStickerMessage() != nil {
				stickerMsg := &waE2E.Message{
					StickerMessage: quotedMsg.GetStickerMessage(),
				}
				b.MessageCache.Store(quotedMsgID, stickerMsg)
				b.Log.Infof("Cached quoted sticker: %s url:%s", quotedMsgID, quotedMsg.GetStickerMessage().GetURL())
			}
		}
	}

	eventContent := map[string]interface{}{
		"from":          msg.Info.Sender.String(),
		"chat":          msg.Info.Chat.String(),
		"text":          text,
		"pushName":      msg.Info.PushName,
		"isGroup":       msg.Info.IsGroup,
		"messageId":     msg.Info.ID,
		"isImage":       isImage,
		"isQuotedImage": isQuotedImage,
		"isSticker":      isSticker,
	}

	if isImage {
		b.MessageCache.Store(msg.Info.ID, msg.Message)
	}
	if isQuotedImage && quotedMsg != nil {
		b.MessageCache.Store(quotedMsgID, &waE2E.Message{
			ImageMessage: quotedMsg.GetImageMessage(),
		})
		eventContent["quotedMessage"] = map[string]interface{}{
			"messageId": quotedMsgID,
			"from":      quotedParticipant,
			"isImage":   true,
		}
	}

	b.sendEvent(BotEvent{
		Type:    "message",
		Content: eventContent,
	})
}
