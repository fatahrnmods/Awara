import { Command } from '../types'

export default {
  name: 'brat',
  category: 'tools',
  wait: true,
  description: 'Generate brat-style sticker',
  async handler(bot, args, context) {
    const text = args.join(' ')
    if (!text) {
      return bot.sendMessage(context.chat, '⚠️ Kasih teksnya!\nContoh: /brat hello world')
    }
    try {
      const image = await bot.generateBrat(text)
      if (!image) throw new Error('Gagal generate brat')

      const sticker = await bot.convertToSticker(image)
      if (!sticker) throw new Error('Gagal convert ke sticker')

      await bot.sendSticker(context.chat, sticker)
    } catch (error) {
      await bot.sendMessage(context.chat,
        `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
} as Command
