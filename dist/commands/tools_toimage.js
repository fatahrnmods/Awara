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
    name: 'toimage',
    alias: ['ti', 'toimg', 'stickertoimage'],
    category: 'tools',
    wait: true,
    description: 'Convert sticker to image',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const hasSticker = context.isSticker || context.isQuotedSticker || context.isImage || context.isQuotedImage;
                if (!hasSticker) {
                    throw new Error('Please send or reply to a sticker\nExample: /toimage [reply to sticker]');
                }
                yield bot.sendReaction(context.chat, context.sender, context.messageId, '⏳');
                const isQuoted = context.isQuotedSticker || context.isQuotedImage;
                const targetMessageId = isQuoted
                    ? (_a = context.quotedMessage) === null || _a === void 0 ? void 0 : _a.messageId
                    : context.messageId;
                if (!targetMessageId)
                    throw new Error('Could not find sticker message ID');
                const stickerBuffer = yield bot.downloadMedia(targetMessageId, context.chat, isQuoted ? 'quoted' : 'direct');
                if (!stickerBuffer)
                    throw new Error('Failed to download sticker');
                yield bot.sendImage(context.chat, stickerBuffer, '', false);
                yield bot.sendReaction(context.chat, context.sender, context.messageId, '✅');
            }
            catch (error) {
                console.error('[TOIMAGE] Error:', error);
                yield bot.sendMessage(context.chat, `❌ ${error instanceof Error ? error.message : 'Failed to convert sticker'}`);
                yield bot.sendReaction(context.chat, context.sender, context.messageId, '❌');
            }
        });
    }
};
