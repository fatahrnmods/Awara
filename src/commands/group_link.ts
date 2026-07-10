import { Command } from '../types'

export default {
  name: 'grouplink',
  alias: ['glink'],
  category: 'group',
  wait: true,
  description: 'Get group invite link (admin only)',
  async handler(bot, args, context) {
    if (!context.isGroup) return bot.sendMessage(context.chat, '❌ Command ini hanya untuk grup!')
    const res = await bot.groupInfo('getlink', context.chat)
    await bot.sendMessage(context.chat, res.status ? `🔗 ${res.link}` : `❌ Gagal: ${res.error}`)
  }
} as Command
