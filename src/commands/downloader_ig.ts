import { Command } from '../types'
import { downloadInstagram } from '../utils/btchDownloader'

export default {
  name: 'ig',
  alias: ['instagram', 'igdl'],
  category: 'downloader',
  wait: true,
  description: 'Download Instagram photo/video/reels',
  async handler(bot, args, context) {
    if (!args.length) {
      return bot.sendMessage(context.chat,
        '⚠️ Please provide an Instagram URL\nExample: /ig https://instagram.com/p/...'
      )
    }
    const url = args[0]
    if (!url.match(/instagram\.com/)) {
      return bot.sendMessage(context.chat, '❌ Invalid Instagram URL.')
    }
    try {
      const items = await downloadInstagram(url)

      if (items.length > 1) {
        await bot.sendMessage(context.chat, `📦 Mengirim ${items.length} media...`)
      }

      // Kirim berurutan (bukan Promise.all) biar urutan album tetap terjaga
      // dan tidak membanjiri koneksi sekaligus (mengurangi risiko error 463)
      for (const item of items) {
        try {
          if (item.isVideo) {
            await bot.sendVideo(context.chat, item.url, '', true)
          } else {
            await bot.sendImage(context.chat, item.url, '', true)
          }
        } catch (err) {
          console.error('[IG COMMAND] Failed to send item:', err)
        }
        // jeda kecil antar kiriman biar tidak dianggap spam oleh WhatsApp
        await new Promise(r => setTimeout(r, 800))
      }
    } catch (error) {
      console.error('[IG COMMAND] Error:', error)
      await bot.sendMessage(context.chat,
        `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
} as Command
