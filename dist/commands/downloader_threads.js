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
    name: 'threads',
    category: 'downloader',
    wait: true,
    description: 'Download video/image from Threads',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = args[0];
            if (!(url === null || url === void 0 ? void 0 : url.includes('threads.net')) && !(url === null || url === void 0 ? void 0 : url.includes('threads.com'))) {
                return bot.sendMessage(context.chat, '⚠️ Kasih link Threads yang valid!');
            }
            try {
                const result = yield (0, btchDownloader_1.downloadThreads)(url);
                const items = Array.isArray(result) ? result : [result];
                for (const item of items) {
                    const mediaUrl = item.url || item.video_url || item.image_url;
                    if (item.type === 'video' || (mediaUrl === null || mediaUrl === void 0 ? void 0 : mediaUrl.includes('.mp4'))) {
                        yield bot.sendVideo(context.chat, mediaUrl, '', true);
                    }
                    else {
                        yield bot.sendImage(context.chat, mediaUrl, '', true);
                    }
                }
            }
            catch (error) {
                yield bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
};
