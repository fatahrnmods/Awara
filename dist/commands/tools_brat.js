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
    name: 'brat',
    category: 'tools',
    wait: true,
    description: 'Generate brat-style sticker',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const text = args.join(' ');
            if (!text) {
                return bot.sendMessage(context.chat, '⚠️ Kasih teksnya!\nContoh: /brat hello world');
            }
            try {
                const image = yield bot.generateBrat(text);
                if (!image)
                    throw new Error('Gagal generate brat');
                const sticker = yield bot.convertToSticker(image);
                if (!sticker)
                    throw new Error('Gagal convert ke sticker');
                yield bot.sendSticker(context.chat, sticker);
            }
            catch (error) {
                yield bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
};
