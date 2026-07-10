import { Command } from '../types'

export default {
  name: 'imagine',
  alias: ['txt2img'],
  category: 'ai',
  wait: true,
  description: 'Generate image from text prompt using AI',
  async handler(bot, args, context) {
    const prompt = args.join(' ')
    if (!prompt) return bot.sendMessage(context.chat, '⚠️ Kasih prompt gambarnya!\nContoh: /imagine cat wearing sunglasses')
    try {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&nologo=true`
      await bot.sendImage(context.chat, url, `🎨 ${prompt}`, true)
    } catch (error) {
      await bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
} as Command
