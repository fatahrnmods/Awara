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
    name: 'ig',
    alias: ['instagram', 'igdl'],
    category: 'downloader',
    wait: true,
    description: 'Download Instagram photo/video/reels',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!args.length) {
                return bot.sendMessage(context.chat, '⚠️ Please provide an Instagram URL\nExample: /ig https://instagram.com/p/...');
            }
            const url = args[0];
            if (!url.match(/instagram\.com/)) {
                return bot.sendMessage(context.chat, '❌ Invalid Instagram URL.');
            }
            try {
                const items = yield (0, btchDownloader_1.downloadInstagram)(url);
                if (items.length > 1) {
                    yield bot.sendMessage(context.chat, `📦 Mengirim ${items.length} media...`);
                }
                // Kirim berurutan (bukan Promise.all) biar urutan album tetap terjaga
                // dan tidak membanjiri koneksi sekaligus (mengurangi risiko error 463)
                for (const item of items) {
                    try {
                        if (item.isVideo) {
                            yield bot.sendVideo(context.chat, item.url, '', true);
                        }
                        else {
                            yield bot.sendImage(context.chat, item.url, '', true);
                        }
                    }
                    catch (err) {
                        console.error('[IG COMMAND] Failed to send item:', err);
                    }
                    // jeda kecil antar kiriman biar tidak dianggap spam oleh WhatsApp
                    yield new Promise(r => setTimeout(r, 800));
                }
            }
            catch (error) {
                console.error('[IG COMMAND] Error:', error);
                yield bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
};
