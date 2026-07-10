import { Command } from '../types'

function resolveTarget(args: string[], quotedFrom?: string): string | null {
  if (quotedFrom) return quotedFrom
  if (!args[0]) return null
  return args[0].replace(/[^0-9]/g, '')
}

export default {
  name: 'demote',
  category: 'group',
  wait: true,
  description: 'Demote admin to member (admin only)',
  async handler(bot, args, context) {
    if (!context.isGroup) {
      return bot.sendMessage(context.chat, '❌ Command ini hanya untuk grup!')
    }
    const rawTarget = resolveTarget(args, context.quotedMessage?.from)
    if (!rawTarget) {
      return bot.sendMessage(context.chat, '⚠️ Reply/mention orang yang mau diturunkan!')
    }

    const number = rawTarget.replace('@lid', '').replace('@s.whatsapp.net', '')
    const candidates = [`${number}@lid`, `${number}@s.whatsapp.net`]

    let ok = false
    for (const jid of candidates) {
      ok = await bot.groupAction('demote', context.chat, jid)
      if (ok) break
    }

    await bot.sendMessage(context.chat, ok ? '✅ Berhasil turunkan admin!' : '❌ Gagal, pastikan bot admin & nomor benar!')
  }
} as Command
