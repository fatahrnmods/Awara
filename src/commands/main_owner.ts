import { Command } from '../types'

export default {
  name: 'owner',
  alias: ['creator'],
  category: 'main',
  description: 'Send owner contact',
  async handler(bot, args, context) {
    await bot.sendOwnerVCard(context.chat)
  }
} as Command
