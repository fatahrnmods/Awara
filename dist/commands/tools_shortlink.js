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
exports.default = {
    name: 'shortlink',
    alias: ['short'],
    category: 'tools',
    wait: true,
    description: 'Shorten a URL',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = args[0];
            if (!url || !url.startsWith('http')) {
                return bot.sendMessage(context.chat, '⚠️ Kasih URL yang valid!\nContoh: /shortlink https://example.com');
            }
            try {
                const res = yield fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
                const shortUrl = yield res.text();
                yield bot.sendMessage(context.chat, `🔗 ${shortUrl}`);
            }
            catch (error) {
                yield bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
};
