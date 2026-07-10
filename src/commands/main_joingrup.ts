import { Command } from '../types'

export default {
  name: 'join',
  alias: ['joingrup'],
  category: 'main',
  description: 'Join group via invite link (owner only)',
  async handler(bot, args, context) {
    const owners = [
      process.env.OWNER_1?.split(':')[0],
      process.env.OWNER_2?.split(':')[0]
    ].filter(Boolean)

    const senderLid = context.from.split(':')[0].split('@')[0]
    const senderNum = context.sender.replace('@s.whatsapp.net', '').replace('@lid', '')
    const isOwner = owners.some(o => o === senderLid || o === senderNum)
    if (!isOwner) {
      return bot.sendMessage(context.chat, '❌ Command ini hanya untuk owner!')
    }

    const link = args[0]
    if (!link) {
      return bot.sendMessage(context.chat, '⚠️ Kirim link grup!\nContoh: .join https://chat.whatsapp.com/xxx')
    }

    if (!link.includes('chat.whatsapp.com/')) {
      return bot.sendMessage(context.chat, '❌ Link tidak valid!')
    }

    await bot.joinGroup(link)
    await bot.sendMessage(context.chat, '✅ Berhasil join grup!')
  }
} as Command
