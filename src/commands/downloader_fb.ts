import { Command } from '../types'
import * as fs from 'fs'

const toBuffer = (data: string): Buffer => {
  if (data.startsWith('file:')) {
    const path = data.slice(5)
    const buf = fs.readFileSync(path)
    try { fs.unlinkSync(path); fs.rmdirSync(require('path').dirname(path)) } catch {}
    return buf
  }
  return Buffer.from(data, 'base64')
}

export default {
  name: 'fb',
  alias: ['facebook', 'fbdl'],
  category: 'downloader',
  wait: true,
  description: 'Download Facebook video',
  async handler(bot, args, context) {
    if (!args.length) {
      return bot.sendMessage(context.chat,
        '⚠️ Please provide a Facebook URL\nExample: /fb https://fb.com/...'
      )
    }
    const url = args[0]
    if (!url.match(/facebook\.com|fb\.watch/)) {
      return bot.sendMessage(context.chat, '❌ Invalid Facebook URL.')
    }
    try {
      const result = await bot.fbigDownloader(url)
      if (!result.status) throw new Error(result.error || 'Failed')

      if (result.video) {
        await bot.sendVideo(context.chat, toBuffer(result.video), result.title || 'Facebook Video')
      } else {
        throw new Error('No video found')
      }
    } catch (error) {
      await bot.sendMessage(context.chat,
        `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
} as Command
