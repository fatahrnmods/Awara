import { Command } from '../types'
import { downloadThreads } from '../utils/btchDownloader'

export default {
  name: 'threads',
  category: 'downloader',
  wait: true,
  description: 'Download video/image from Threads',
  async handler(bot, args, context) {
    const url = args[0]
    if (!url?.includes('threads.net') && !url?.includes('threads.com')) {
      return bot.sendMessage(context.chat, '⚠️ Kasih link Threads yang valid!')
    }
    try {
      const result = await downloadThreads(url)
      const items = Array.isArray(result) ? result : [result]
      for (const item of items) {
        const mediaUrl = item.url || item.video_url || item.image_url
        if (item.type === 'video' || mediaUrl?.includes('.mp4')) {
          await bot.sendVideo(context.chat, mediaUrl, '', true)
        } else {
          await bot.sendImage(context.chat, mediaUrl, '', true)
        }
      }
    } catch (error) {
      await bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
} as Command
