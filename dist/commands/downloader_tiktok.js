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
    name: 'tiktok',
    alias: ['tt', 'tiktokdl'],
    category: 'downloader',
    wait: true,
    description: 'Download TikTok video or images without watermark',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!args.length) {
                return bot.sendMessage(context.chat, '⚠️ Please provide a TikTok URL\nExample: /tiktok https://vm.tiktok.com/xyz');
            }
            const url = args[0];
            if (!url.match(/tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com/)) {
                return bot.sendMessage(context.chat, '❌ Invalid TikTok URL. Please provide a valid TikTok link.');
            }
            try {
                const { result, error } = yield bot.downloader(url, 'tiktok');
                if (!result) {
                    throw new Error(error || 'No content found in response');
                }
                const sender = context.from.split(':')[0] + '@s.whatsapp.net';
                const isGroup = context.isGroup;
                const sendOperations = [];
                if ((_a = result.images) === null || _a === void 0 ? void 0 : _a.length) {
                    const sendPrivate = isGroup && result.images.length > 1;
                    if (sendPrivate) {
                        yield bot.sendMessage(context.chat, `📸 Found ${result.images.length} images. Sending to your private chat.`);
                    }
                    const targetChat = sendPrivate ? sender : context.chat;
                    const musicTarget = sendPrivate ? sender : context.chat;
                    for (const image of result.images) {
                        sendOperations.push(bot.sendImage(targetChat, image));
                    }
                    if (result.music) {
                        sendOperations.push(bot.sendAudio(musicTarget, result.music, !sendPrivate));
                    }
                }
                else if (result.video) {
                    sendOperations.push(bot.sendVideo(context.chat, result.video, 'TikTok Video', true));
                    if (result.music) {
                        sendOperations.push(bot.sendAudio(context.chat, result.music, true));
                    }
                }
                else {
                    throw new Error('No video or images found in response');
                }
                const results = yield Promise.allSettled(sendOperations);
                results.forEach((r, i) => {
                    if (r.status === 'rejected') {
                        console.error(`[TIKTOK] Send operation ${i} failed:`, r.reason);
                    }
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : 'An unknown error occurred';
                yield bot.sendMessage(context.chat, `❌ Failed to download TikTok content: ${errorMessage}`);
            }
        });
    }
};
