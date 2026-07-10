"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const loader_1 = require("../utils/loader");
exports.default = {
    name: 'menu',
    alias: ['help'],
    category: 'main',
    description: 'Show all available commands',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const commandsByCategory = {};
            for (const [cmdName, meta] of loader_1._commandRegistry) {
                if (!commandsByCategory[meta.category]) {
                    commandsByCategory[meta.category] = [];
                }
                commandsByCategory[meta.category].push({
                    name: cmdName,
                    desc: meta.description || '',
                    alias: meta.alias || []
                });
            }
            const name = context.pushName || 'kamu';
            const line = '━━━━━━━━━━━━━━━━━━━━━';
            let menu = `Hai *${name}*! ( ´ ω \` )\n`;
            menu += `Aku Awa-chan, asisten bot-mu~\n`;
            menu += `Ini daftar command yang bisa kamu pakai!\n\n`;
            menu += `╭${line}╮\n`;
            menu += `┃   🤖 *AWARA BOT MENU*\n`;
            menu += `╰${line}╯\n\n`;
            const emoji = {
                downloader: '📥',
                main: '🏠',
                info: '📊',
                tools: '🛠️'
            };
            for (const [category, commands] of Object.entries(commandsByCategory)) {
                const cat_emoji = emoji[category.toLowerCase()] || '📌';
                menu += `${cat_emoji} *${category.toUpperCase()}*\n`;
                for (const cmd of commands) {
                    menu += `  ┣ *.${cmd.name}*`;
                    if (cmd.alias.length > 0)
                        menu += ` _(${cmd.alias.slice(0, 2).join(', ')})_`;
                    if (cmd.desc)
                        menu += `\n  ┃  _${cmd.desc}_`;
                    menu += '\n';
                }
                menu += '  ┗\n\n';
            }
            menu += `╔${line}╗\n`;
            menu += `║  © Awara Bot • by moo-d\n`;
            menu += `╚${line}╝`;
            yield bot.sendMessage(context.chat, menu);
        });
    }
};
