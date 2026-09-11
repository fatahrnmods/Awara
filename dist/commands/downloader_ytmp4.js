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
const sanitizeFilename = (name) => {
    return name.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 100);
};
exports.default = {
    name: 'ytmp4',
    alias: ['ytvideo', 'ytv'],
    category: 'downloader',
    wait: true,
    description: 'Download YouTube video (MP4)',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args.length) {
                return bot.sendMessage(context.chat, '⚠️ Please provide a YouTube URL\nExample: /ytmp4 https://youtu.be/dQw4w9WgXcQ');
            }
            const url = args[0];
            const youtubeRegex = /(youtu\.be\/|youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/;
            if (!youtubeRegex.test(url)) {
                return bot.sendMessage(context.chat, '❌ Invalid YouTube URL. Please provide a valid link.');
            }
            try {
                const result = yield (0, btchDownloader_1.downloadYoutube)(url);
                if (!result.mp4)
                    throw new Error('No video URL received');
                const title = result.title || 'Unknown';
                const filename = `${sanitizeFilename(title)}.mp4`;
                let buffer = null;
                let lastError = null;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 60000);
                        const res = yield fetch(result.mp4, {
                            signal: controller.signal,
                            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                        });
                        clearTimeout(timeoutId);
                        if (!res.ok)
                            throw new Error(`HTTP ${res.status}`);
                        buffer = Buffer.from(yield res.arrayBuffer());
                        break;
                    }
                    catch (err) {
                        lastError = err;
                        console.error(`[YTMP4] Attempt ${attempt} failed:`, err.message);
                        if (attempt < 3)
                            yield new Promise(r => setTimeout(r, 2000));
                    }
                }
                if (!buffer) {
                    throw new Error(`Download failed after 3 attempts: ${(lastError === null || lastError === void 0 ? void 0 : lastError.message) || 'Unknown error'}`);
                }
                yield bot.sendDocument(context.chat, buffer, filename, `🎬 ${title}\n👤 ${result.author || 'Unknown'}`);
            }
            catch (error) {
                console.error('[YouTube MP4] Download error:', error);
                yield bot.sendMessage(context.chat, `❌ Failed to download video: ${error.message}`);
            }
        });
    }
};
