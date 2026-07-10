import { Command } from '../types'
import { _commandRegistry } from '../utils/loader'

export default {
  name: 'menu',
  alias: ['help'],
  category: 'main',
  description: 'Show all available commands',
  async handler(bot, args, context) {
    const commandsByCategory: Record<string, Array<{name: string, desc: string, alias: string[]}>> = {}
    
    for (const [cmdName, meta] of _commandRegistry) {
      if (!commandsByCategory[meta.category]) {
        commandsByCategory[meta.category] = []
      }
      commandsByCategory[meta.category].push({
        name: cmdName,
        desc: (meta as any).description || '',
        alias: meta.alias || []
      })
    }

    const name = context.pushName || 'kamu'
    const line = '━━━━━━━━━━━━━━━━━━━━━'

    let menu = `Hai *${name}*! ( ´ ω \` )\n`
    menu += `Aku Awa-chan, asisten bot-mu~\n`
    menu += `Ini daftar command yang bisa kamu pakai!\n\n`
    menu += `╭${line}╮\n`
    menu += `┃   🤖 *AWARA BOT MENU*\n`
    menu += `╰${line}╯\n\n`

    const emoji: Record<string, string> = {
      downloader: '📥',
      main: '🏠',
      info: '📊',
      tools: '🛠️'
    }

    for (const [category, commands] of Object.entries(commandsByCategory)) {
      const cat_emoji = emoji[category.toLowerCase()] || '📌'
      menu += `${cat_emoji} *${category.toUpperCase()}*\n`
      for (const cmd of commands) {
        menu += `  ┣ *.${cmd.name}*`
        if (cmd.alias.length > 0) menu += ` _(${cmd.alias.slice(0,2).join(', ')})_`
        if (cmd.desc) menu += `\n  ┃  _${cmd.desc}_`
        menu += '\n'
      }
      menu += '  ┗\n\n'
    }

    menu += `╔${line}╗\n`
    menu += `║  © Awara Bot • by moo-d\n`
    menu += `╚${line}╝`

    await bot.sendMessage(context.chat, menu)
  }
} as Command
