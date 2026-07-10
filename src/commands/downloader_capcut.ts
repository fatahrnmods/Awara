import { Command } from '../types'
import { downloadCapcut } from '../utils/btchDownloader'

export default {
  name: 'capcut',
  category: 'downloader',
  wait: true,
  description: 'Download Capcut template',
  async handler(bot, args, context) {
    const url = args[0]
    if (!url?.includes('capcut.com')) return bot.sendMessage(context.chat, '⚠️ Kasih link Capcut yang valid!')
    try {
      const result = await downloadCapcut(url)
      const videoUrl = result.url || result.video_url
      await bot.sendVideo(context.chat, videoUrl, result.title || 'Capcut Template', true)
    } catch (error) {
      await bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
} as Command
