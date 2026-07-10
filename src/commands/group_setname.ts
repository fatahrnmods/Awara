import { Command } from '../types'

export default {
  name: 'setname',
  category: 'group',
  wait: true,
  description: 'Change group name (admin only)',
  async handler(bot, args, context) {
    if (!context.isGroup) return bot.sendMessage(context.chat, '❌ Command ini hanya untuk grup!')
    const name = args.join(' ')
    if (!name) return bot.sendMessage(context.chat, '⚠️ Kasih nama grup barunya!')
    const res = await bot.groupInfo('setname', context.chat, name)
    await bot.sendMessage(context.chat, res.status ? '✅ Nama grup berhasil diubah!' : `❌ Gagal: ${res.error}`)
  }
} as Command
