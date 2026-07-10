import { Command } from '../types'

export default {
  name: 'hidetag',
  alias: ['ht'],
  category: 'group',
  wait: true,
  description: 'Send message mentioning all members (hidden tags)',
  async handler(bot, args, context) {
    if (!context.isGroup) {
      return bot.sendMessage(context.chat, '❌ Command ini hanya untuk grup!')
    }
    const text = args.join(' ') || '📢 Pengumuman!'
    await bot.hidetag(context.chat, text)
  }
} as Command
