import { Command } from '../types'

export default {
  name: 'sticker',
  alias: ['s', 'stiker'],
  category: 'tools',
  wait: true,
  description: 'Convert image/gif/video to WhatsApp sticker',
  async handler(bot, args, context) {
    try {
      const isMedia = context.isImage || context.isQuotedImage
      if (!isMedia) {
        throw new Error('Please send or reply to an image/gif/video\nExample: /sticker [reply to media]')
      }

      await bot.sendReaction(context.chat, context.sender, context.messageId, '⏳')

      const isQuoted = context.isQuotedImage
      const targetMessageId = isQuoted
        ? context.quotedMessage?.messageId
        : context.messageId

      if (!targetMessageId) throw new Error('Could not find media message ID')

      const imageBuffer = await bot.downloadMedia(
        targetMessageId,
        context.chat,
        isQuoted ? 'quoted' : 'direct'
      )

      if (!imageBuffer) throw new Error('Failed to download media')

      const stickerBuffer = await bot.convertToSticker(imageBuffer)
      if (!stickerBuffer) throw new Error('Failed to convert to sticker')

      await bot.sendSticker(context.chat, stickerBuffer)
      await bot.sendReaction(context.chat, context.sender, context.messageId, '✅')

    } catch (error) {
      console.error('[STICKER] Error:', error)
      await bot.sendMessage(
        context.chat,
        `❌ ${error instanceof Error ? error.message : 'Failed to create sticker'}`
      )
      await bot.sendReaction(context.chat, context.sender, context.messageId, '❌')
    }
  }
} as Command
