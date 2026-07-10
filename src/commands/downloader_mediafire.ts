import { Command } from '../types'
import { downloadMediafire } from '../utils/btchDownloader'

export default {
  name: 'mediafire',
  alias: ['mf'],
  category: 'downloader',
  wait: true,
  description: 'Download file from Mediafire',
  async handler(bot, args, context) {
    const url = args[0]
    if (!url?.includes('mediafire.com')) return bot.sendMessage(context.chat, '⚠️ Kasih link Mediafire yang valid!')
    try {
      const result = await downloadMediafire(url)
      const downloadUrl = result.url || result.link
      const filename = result.filename || 'file'

      const res = await fetch(downloadUrl)
      const buffer = Buffer.from(await res.arrayBuffer())
      await bot.sendDocument(context.chat, buffer, filename, `📁 ${filename}`)
    } catch (error) {
      await bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
} as Command
