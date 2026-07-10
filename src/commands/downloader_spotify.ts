import { Command } from '../types'
import { downloadSpotify } from '../utils/btchDownloader'

export default {
  name: 'spotify',
  alias: ['sp'],
  category: 'downloader',
  wait: true,
  description: 'Download Spotify song',
  async handler(bot, args, context) {
    const url = args[0]
    if (!url?.includes('spotify.com')) return bot.sendMessage(context.chat, '⚠️ Kasih link Spotify yang valid!')
    try {
      const result = await downloadSpotify(url)
      const downloadUrl = result.download_url || result.url
      const title = result.title || 'Spotify Track'
      const filename = `${title.replace(/[\\/:*?"<>|]/g, '')}.mp3`

      const res = await fetch(downloadUrl)
      const buffer = Buffer.from(await res.arrayBuffer())
      await bot.sendDocument(context.chat, buffer, filename, `🎵 ${title}`)
    } catch (error) {
      await bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
} as Command
