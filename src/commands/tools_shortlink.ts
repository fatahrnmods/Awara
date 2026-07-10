import { Command } from '../types'

export default {
  name: 'shortlink',
  alias: ['short'],
  category: 'tools',
  wait: true,
  description: 'Shorten a URL',
  async handler(bot, args, context) {
    const url = args[0]
    if (!url || !url.startsWith('http')) {
      return bot.sendMessage(context.chat, '⚠️ Kasih URL yang valid!\nContoh: /shortlink https://example.com')
    }
    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`)
      const shortUrl = await res.text()
      await bot.sendMessage(context.chat, `🔗 ${shortUrl}`)
    } catch (error) {
      await bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
} as Command
