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
const sanitizeFilename = (name) => {
    return name.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 100);
};
exports.default = {
    name: 'ytmp3',
    alias: ['ytaudio', 'yta'],
    category: 'downloader',
    description: 'Download YouTube audio (MP3)',
    wait: true,
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!args.length) {
                return bot.sendMessage(context.chat, '⚠️ Please provide a YouTube URL\nExample: /ytmp3 https://youtu.be/dQw4w9WgXcQ');
            }
            const url = args[0];
            const youtubeRegex = /(youtu\.be\/|youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/;
            if (!youtubeRegex.test(url)) {
                return bot.sendMessage(context.chat, '❌ Invalid YouTube URL. Please provide a valid link.');
            }
            try {
                const result = yield bot.downloader(url, 'youtube', 'mp3');
                if (!((_a = result === null || result === void 0 ? void 0 : result.result) === null || _a === void 0 ? void 0 : _a.url)) {
                    throw new Error((result === null || result === void 0 ? void 0 : result.error) || 'No audio URL received');
                }
                const title = result.result.title || 'Unknown';
                const filename = `${sanitizeFilename(title)}.mp3`;
                // Download dengan retry, timeout, dan headers yang lebih lengkap
                let buffer = null;
                let lastError = null;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 30000);
                        const res = yield fetch(result.result.url, {
                            signal: controller.signal,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                'Range': 'bytes=0-'
                            }
                        });
                        clearTimeout(timeoutId);
                        if (!res.ok)
                            throw new Error(`HTTP ${res.status}`);
                        const arrayBuffer = yield res.arrayBuffer();
                        buffer = Buffer.from(arrayBuffer);
                        break;
                    }
                    catch (err) {
                        lastError = err;
                        console.error(`[YTMP3] Attempt ${attempt} failed:`, err.message);
                        if (attempt < 3)
                            yield new Promise(r => setTimeout(r, 2000));
                    }
                }
                if (!buffer) {
                    throw new Error(`Download failed after 3 attempts: ${(lastError === null || lastError === void 0 ? void 0 : lastError.message) || 'Unknown error'}`);
                }
                yield bot.sendDocument(context.chat, buffer, filename, `🎵 ${title}\n⏱️ ${result.result.duration ? `${Math.floor(result.result.duration / 60)}m ${result.result.duration % 60}s` : 'Unknown'}`);
            }
            catch (error) {
                console.error('[YouTube MP3] Download error:', error);
                yield bot.sendMessage(context.chat, `❌ Failed to download YouTube audio: ${error.message}`);
            }
        });
    }
};
