import { Command } from '../types'

export default {
  name: 'tts',
  category: 'ai',
  wait: true,
  description: 'Convert text to speech',
  async handler(bot, args, context) {
    const text = args.join(' ')
    if (!text) return bot.sendMessage(context.chat, '⚠️ Kasih teksnya!\nContoh: /tts halo dunia')
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=id&client=tw-ob`
      await bot.sendAudio(context.chat, url, true)
    } catch (error) {
      await bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
} as Command
