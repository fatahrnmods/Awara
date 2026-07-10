import { Command } from '../types'

function resolveTarget(args: string[], quotedFrom?: string): string | null {
  if (quotedFrom) return quotedFrom
  if (!args[0]) return null
  // Bersihkan mention format: @628xxxx atau 628xxxx
  return args[0].replace(/[^0-9]/g, '')
}

export default {
  name: 'kick',
  category: 'group',
  wait: true,
  description: 'Kick member from group (admin only)',
  async handler(bot, args, context) {
    if (!context.isGroup) {
      return bot.sendMessage(context.chat, '❌ Command ini hanya untuk grup!')
    }
    const rawTarget = resolveTarget(args, context.quotedMessage?.from)
    if (!rawTarget) {
      return bot.sendMessage(context.chat, '⚠️ Reply/mention orang yang mau dikick!')
    }

    const number = rawTarget.replace('@lid', '').replace('@s.whatsapp.net', '')
    const candidates = [`${number}@lid`, `${number}@s.whatsapp.net`]

    let ok = false
    for (const jid of candidates) {
      ok = await bot.groupAction('kick', context.chat, jid)
      if (ok) break
    }

    await bot.sendMessage(context.chat, ok ? '✅ Berhasil kick member!' : '❌ Gagal kick, pastikan bot admin & nomor benar!')
  }
} as Command
