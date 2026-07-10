import { Command } from '../types'

export default {
  name: 'testbutton',
  alias: ['tb'],
  category: 'main',
  async handler(bot, args, context) {
    await bot.sendButtons(context.chat, {
      title: 'Test Button',
      body: 'Ini test button',
      footer: '© Awara Bot',
      buttons: [
        { id: 'btn1', text: '📥 Downloader' },
        { id: 'btn2', text: '🛠️ Tools' },
        { id: 'btn3', text: '📊 Info' }
      ]
    })
  }
} as Command
