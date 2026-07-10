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
    name: 'imagine',
    alias: ['txt2img'],
    category: 'ai',
    wait: true,
    description: 'Generate image from text prompt using AI',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const prompt = args.join(' ');
            if (!prompt)
                return bot.sendMessage(context.chat, '⚠️ Kasih prompt gambarnya!\nContoh: /imagine cat wearing sunglasses');
            try {
                const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&nologo=true`;
                yield bot.sendImage(context.chat, url, `🎨 ${prompt}`, true);
            }
            catch (error) {
                yield bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
};
