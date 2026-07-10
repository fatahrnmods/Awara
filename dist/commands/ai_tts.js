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
    name: 'tts',
    category: 'ai',
    wait: true,
    description: 'Convert text to speech',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const text = args.join(' ');
            if (!text)
                return bot.sendMessage(context.chat, '⚠️ Kasih teksnya!\nContoh: /tts halo dunia');
            try {
                const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=id&client=tw-ob`;
                yield bot.sendAudio(context.chat, url, true);
            }
            catch (error) {
                yield bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
};
