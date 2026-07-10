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
    name: 'sticker',
    alias: ['s', 'stiker'],
    category: 'tools',
    wait: true,
    description: 'Convert image/gif/video to WhatsApp sticker',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const isMedia = context.isImage || context.isQuotedImage;
                if (!isMedia) {
                    throw new Error('Please send or reply to an image/gif/video\nExample: /sticker [reply to media]');
                }
                yield bot.sendReaction(context.chat, context.sender, context.messageId, '⏳');
                const isQuoted = context.isQuotedImage;
                const targetMessageId = isQuoted
                    ? (_a = context.quotedMessage) === null || _a === void 0 ? void 0 : _a.messageId
                    : context.messageId;
                if (!targetMessageId)
                    throw new Error('Could not find media message ID');
                const imageBuffer = yield bot.downloadMedia(targetMessageId, context.chat, isQuoted ? 'quoted' : 'direct');
                if (!imageBuffer)
                    throw new Error('Failed to download media');
                const stickerBuffer = yield bot.convertToSticker(imageBuffer);
                if (!stickerBuffer)
                    throw new Error('Failed to convert to sticker');
                yield bot.sendSticker(context.chat, stickerBuffer);
                yield bot.sendReaction(context.chat, context.sender, context.messageId, '✅');
            }
            catch (error) {
                console.error('[STICKER] Error:', error);
                yield bot.sendMessage(context.chat, `❌ ${error instanceof Error ? error.message : 'Failed to create sticker'}`);
                yield bot.sendReaction(context.chat, context.sender, context.messageId, '❌');
            }
        });
    }
};
