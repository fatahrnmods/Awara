import { Command } from '../types'

export default {
  name: 'translate',
  alias: ['tr'],
  category: 'ai',
  wait: true,
  description: 'Translate text to another language',
  async handler(bot, args, context) {
    if (args.length < 2) {
      return bot.sendMessage(context.chat, '⚠️ Format: /translate <kode_bahasa> <teks>\nContoh: /translate en halo dunia')
    }
    const targetLang = args[0]
    const text = args.slice(1).join(' ')
    try {
      const { translate } = await import('@vitalets/google-translate-api')
      const res: any = await translate(text, { to: targetLang })
      await bot.sendMessage(context.chat, `🌐 *${targetLang.toUpperCase()}*\n${res.text}`)
    } catch (error) {
      await bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
} as Command
