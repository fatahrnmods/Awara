import { Command } from '../types'

export default {
  name: 'revoke',
  category: 'group',
  wait: true,
  description: 'Reset group invite link (admin only)',
  async handler(bot, args, context) {
    if (!context.isGroup) return bot.sendMessage(context.chat, '❌ Command ini hanya untuk grup!')
    const res = await bot.groupInfo('revoke', context.chat)
    await bot.sendMessage(context.chat, res.status ? `✅ Link baru: ${res.link}` : `❌ Gagal: ${res.error}`)
  }
} as Command
