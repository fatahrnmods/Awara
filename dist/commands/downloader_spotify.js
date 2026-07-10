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
    name: 'spotify',
    alias: ['sp'],
    category: 'downloader',
    wait: true,
    description: 'Download Spotify song',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = args[0];
            if (!(url === null || url === void 0 ? void 0 : url.includes('spotify.com')))
                return bot.sendMessage(context.chat, '⚠️ Kasih link Spotify yang valid!');
            try {
                const result = yield (0, btchDownloader_1.downloadSpotify)(url);
                const downloadUrl = result.download_url || result.url;
                const title = result.title || 'Spotify Track';
                const filename = `${title.replace(/[\\/:*?"<>|]/g, '')}.mp3`;
                const res = yield fetch(downloadUrl);
                const buffer = Buffer.from(yield res.arrayBuffer());
                yield bot.sendDocument(context.chat, buffer, filename, `🎵 ${title}`);
            }
            catch (error) {
                yield bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
};
