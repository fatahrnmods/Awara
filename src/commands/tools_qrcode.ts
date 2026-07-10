import { Command } from '../types'
import QRCode from 'qrcode'

export default {
  name: 'qrcode',
  alias: ['qr'],
  category: 'tools',
  wait: true,
  description: 'Generate QR code from text',
  async handler(bot, args, context) {
    const text = args.join(' ')
    if (!text) return bot.sendMessage(context.chat, '⚠️ Kasih teks/link untuk dijadikan QR!')
    try {
      const buffer = await QRCode.toBuffer(text, { width: 512, margin: 2 })
      await bot.sendImage(context.chat, buffer, `📱 QR Code: ${text}`)
    } catch (error) {
      await bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
} as Command
