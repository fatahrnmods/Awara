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
    name: 'pin',
    alias: ['pinterest', 'pindl'],
    category: 'downloader',
    wait: true,
    description: 'Download Pinterest image/video',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args.length) {
                return bot.sendMessage(context.chat, '⚠️ Please provide a Pinterest URL\nExample: /pin https://pin.it/xxx');
            }
            const url = args[0];
            if (!url.match(/pinterest\.com|pin\.it/)) {
                return bot.sendMessage(context.chat, '❌ Invalid Pinterest URL.');
            }
            try {
                const media = yield (0, btchDownloader_1.downloadPinterest)(url);
                if (media.isVideo) {
                    yield bot.sendVideo(context.chat, media.url, 'Pinterest Video', true);
                }
                else {
                    yield bot.sendImage(context.chat, media.url, '', true);
                }
            }
            catch (error) {
                yield bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
};
