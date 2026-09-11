import { Command } from "../types"
import { downloadYoutube } from '../utils/btchDownloader'

const sanitizeFilename = (name: string): string => {
  return name.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 100)
}

export default {
  name: 'ytmp3',
  alias: ['ytaudio', 'yta'],
  category: 'downloader',
  wait: true,
  description: 'Download YouTube audio (MP3)',
  async handler(bot, args, context) {
    if (!args.length) {
      return bot.sendMessage(context.chat,
        '⚠️ Please provide a YouTube URL\nExample: /ytmp3 https://youtu.be/dQw4w9WgXcQ'
      )
    }
    const url = args[0]
    const youtubeRegex = /(youtu\.be\/|youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/
    if (!youtubeRegex.test(url)) {
      return bot.sendMessage(context.chat, '❌ Invalid YouTube URL. Please provide a valid link.')
    }

    try {
      const result = await downloadYoutube(url)
      if (!result.mp3) throw new Error('No audio URL received')

      const title = result.title || 'Unknown'
      const filename = `${sanitizeFilename(title)}.mp3`

      let buffer: Buffer | null = null
      let lastError: any = null

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 120000)
          const res = await fetch(result.mp3, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })
          clearTimeout(timeoutId)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          buffer = Buffer.from(await res.arrayBuffer())
          break
        } catch (err: any) {
          lastError = err
          console.error(`[YTMP3] Attempt ${attempt} failed:`, err.message)
          if (attempt < 3) await new Promise(r => setTimeout(r, 2000))
        }
      }

      if (!buffer) {
        throw new Error(`Download failed after 3 attempts: ${lastError?.message || 'Unknown error'}`)
      }

      await bot.sendDocument(context.chat, buffer, filename, `🎵 ${title}\n👤 ${result.author || 'Unknown'}`)
    } catch (error: any) {
      console.error('[YouTube MP3] Download error:', error)
      await bot.sendMessage(context.chat, `❌ Failed to download YouTube audio: ${error.message}`)
    }
  }
} as Command
