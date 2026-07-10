import { Command } from '../types'
import { downloadPinterest } from '../utils/btchDownloader'

export default {
  name: 'pin',
  alias: ['pinterest', 'pindl'],
  category: 'downloader',
  wait: true,
  description: 'Download Pinterest image/video',
  async handler(bot, args, context) {
    if (!args.length) {
      return bot.sendMessage(context.chat,
        '⚠️ Please provide a Pinterest URL\nExample: /pin https://pin.it/xxx'
      )
    }
    const url = args[0]
    if (!url.match(/pinterest\.com|pin\.it/)) {
      return bot.sendMessage(context.chat, '❌ Invalid Pinterest URL.')
    }
    try {
      const media = await downloadPinterest(url)
      if (media.isVideo) {
        await bot.sendVideo(context.chat, media.url, 'Pinterest Video', true)
      } else {
        await bot.sendImage(context.chat, media.url, '', true)
      }
    } catch (error) {
      await bot.sendMessage(context.chat,
        `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
} as Command
