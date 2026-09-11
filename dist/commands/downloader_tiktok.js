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
const btchDownloader_1 = require("../utils/btchDownloader");
exports.default = {
    name: 'tiktok',
    alias: ['tt', 'tiktokdl'],
    category: 'downloader',
    wait: true,
    description: 'Download TikTok video or images without watermark',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args.length) {
                return bot.sendMessage(context.chat, '⚠️ Please provide a TikTok URL\nExample: /tiktok https://vm.tiktok.com/xyz');
            }
            const url = args[0];
            if (!url.match(/tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com/)) {
                return bot.sendMessage(context.chat, '❌ Invalid TikTok URL. Please provide a valid TikTok link.');
            }
            try {
                const result = yield (0, btchDownloader_1.downloadTiktok)(url);
                const sender = context.from.split(':')[0] + '@s.whatsapp.net';
                const isGroup = context.isGroup;
                const sendOperations = [];
                if (result.images.length > 0) {
                    const sendPrivate = isGroup && result.images.length > 1;
                    if (sendPrivate) {
                        yield bot.sendMessage(context.chat, `📸 Found ${result.images.length} images. Sending to your private chat.`);
                    }
                    const targetChat = sendPrivate ? sender : context.chat;
                    for (const image of result.images) {
                        sendOperations.push(bot.sendImage(targetChat, image, '', true));
                    }
                    if (result.audio) {
                        sendOperations.push(bot.sendAudio(targetChat, result.audio, true));
                    }
                }
                else if (result.video) {
                    const videoBuffer = yield (() => __awaiter(this, void 0, void 0, function* () {
                        for (let attempt = 1; attempt <= 3; attempt++) {
                            try {
                                const controller = new AbortController();
                                const timeoutId = setTimeout(() => controller.abort(), 60000);
                                const res = yield fetch(result.video, {
                                    signal: controller.signal,
                                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                                });
                                clearTimeout(timeoutId);
                                if (!res.ok)
                                    throw new Error(`HTTP ${res.status}`);
                                return Buffer.from(yield res.arrayBuffer());
                            }
                            catch (err) {
                                console.error(`[TIKTOK] Video download attempt ${attempt} failed:`, err);
                                if (attempt < 3)
                                    yield new Promise(r => setTimeout(r, 2000));
                            }
                        }
                        return null;
                    }))();
                    if (videoBuffer) {
                        sendOperations.push(bot.sendVideo(context.chat, videoBuffer, result.title || 'TikTok Video'));
                    }
                    else {
                        yield bot.sendMessage(context.chat, '❌ Gagal download video (koneksi lambat/timeout)');
                    }
                    if (result.audio) {
                        sendOperations.push(bot.sendAudio(context.chat, result.audio, true));
                    }
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
