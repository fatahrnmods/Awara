import { Command } from '../types'

export default {
  name: 'setdesc',
  category: 'group',
  wait: true,
  description: 'Change group description (admin only)',
  async handler(bot, args, context) {
    if (!context.isGroup) return bot.sendMessage(context.chat, '❌ Command ini hanya untuk grup!')
    const desc = args.join(' ')
    if (!desc) return bot.sendMessage(context.chat, '⚠️ Kasih deskripsi grup barunya!')
    const res = await bot.groupInfo('setdesc', context.chat, desc)
    await bot.sendMessage(context.chat, res.status ? '✅ Deskripsi grup berhasil diubah!' : `❌ Gagal: ${res.error}`)
  }
} as Command
