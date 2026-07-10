import { Command } from '../types'

export default {
  name: 'toimage',
  alias: ['ti', 'toimg', 'stickertoimage'],
  category: 'tools',
  wait: true,
  description: 'Convert sticker to image',
  async handler(bot, args, context) {
    try {
      const hasSticker = context.isSticker || context.isQuotedSticker || context.isImage || context.isQuotedImage
      if (!hasSticker) {
        throw new Error('Please send or reply to a sticker\nExample: /toimage [reply to sticker]')
      }

      await bot.sendReaction(context.chat, context.sender, context.messageId, '⏳')

      const isQuoted = context.isQuotedSticker || context.isQuotedImage
      const targetMessageId = isQuoted
        ? context.quotedMessage?.messageId
        : context.messageId

      if (!targetMessageId) throw new Error('Could not find sticker message ID')

      const stickerBuffer = await bot.downloadMedia(
        targetMessageId,
        context.chat,
        isQuoted ? 'quoted' : 'direct'
      )

      if (!stickerBuffer) throw new Error('Failed to download sticker')

      await bot.sendImage(context.chat, stickerBuffer, '', false)
      await bot.sendReaction(context.chat, context.sender, context.messageId, '✅')

    } catch (error) {
      console.error('[TOIMAGE] Error:', error)
      await bot.sendMessage(
        context.chat,
        `❌ ${error instanceof Error ? error.message : 'Failed to convert sticker'}`
      )
      await bot.sendReaction(context.chat, context.sender, context.messageId, '❌')
    }
  }
} as Command
