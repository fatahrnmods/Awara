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
    name: 'ytmp4',
    alias: ['ytvideo', 'ytv'],
    category: 'downloader',
    description: 'Download YouTube video (MP4)',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args.length) {
                return bot.sendMessage(context.chat, '⚠️ Please provide a YouTube URL\nExample: /ytmp4 https://youtu.be/dQw4w9WgXcQ');
            }
            const url = args[0];
            const youtubeRegex = /(youtu\.be\/|youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/;
            if (!youtubeRegex.test(url)) {
                return bot.sendMessage(context.chat, '❌ Invalid YouTube URL. Please provide a valid YouTube link.');
            }
            try {
                yield bot.sendMessage(context.chat, '⏳ Downloading YouTube video... (This may take a while)');
                const { result, error } = yield bot.downloader(url, 'youtube', 'mp4');
                if (!(result === null || result === void 0 ? void 0 : result.url)) {
                    throw new Error(error || 'No video URL received');
                }
                if (!result.url.startsWith('http')) {
                    throw new Error('Invalid video URL format');
                }
                const [minutes, seconds] = result.duration
                    ? [Math.floor(result.duration / 60), Math.floor(result.duration % 60)]
                    : [0, 0];
                yield Promise.all([
                    bot.sendVideo(context.chat, result.url, result.title || 'YouTube Video'),
                    bot.sendMessage(context.chat, `✅ *${result.title || 'YouTube Video'}*\n` +
                        (result.duration ? `⏱ Duration: ${minutes}m ${seconds}s` : ''))
                ]);
            }
            catch (error) {
                yield bot.sendMessage(context.chat, `❌ Failed to download video: ${error.message || 'Unknown error'}\n` +
                    'Please try again later.');
            }
        });
    }
};
