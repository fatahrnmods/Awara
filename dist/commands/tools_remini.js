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
    name: 'remini',
    alias: ['hd', 'hdr', 'enhance'],
    category: 'tools',
    description: 'Enhance image quality using AI',
    wait: true,
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Validate we have an image to process
                if (!context.isImage && !context.isQuotedImage) {
                    throw new Error('Please send or reply to an image\nExample: /remini [reply to image]');
                }
                yield bot.sendReaction(context.chat, context.sender, context.messageId, '⏳');
                // Get the correct message details
                const isQuoted = context.isQuotedImage;
                const targetMessageId = isQuoted
                    ? (_a = context.quotedMessage) === null || _a === void 0 ? void 0 : _a.messageId
                    : context.messageId;
                if (!targetMessageId) {
                    throw new Error('Could not find image message ID');
                }
                // Download the media
                const imageBuffer = yield bot.downloadMedia(targetMessageId, context.chat, isQuoted ? 'quoted' : 'direct');
                if (!imageBuffer) {
                    throw new Error('Failed to download the image');
                }
                // Enhance the image
                const { result, error } = yield bot.enhanceImage(imageBuffer, 'enhance');
                if (!result) {
                    throw new Error(error || 'Failed to enhance image');
                }
                const isDataUri = result.url.startsWith('data:');
                if (isDataUri) {
                    const base64Data = result.url.split(',')[1];
                    const imageBuffer = Buffer.from(base64Data, 'base64');
                    yield bot.sendImage(context.chat, imageBuffer, 'Here\'s your enhanced image ✨');
                }
                else {
                    yield bot.sendImage(context.chat, result.url, 'Here\'s your enhanced image ✨', true);
                }
                yield bot.sendReaction(context.chat, context.sender, context.messageId, '✅');
            }
            catch (error) {
                console.error('[REMINI] Error:', error);
                yield bot.sendMessage(context.chat, `❌ ${error instanceof Error ? error.message : 'Failed to enhance image'}`);
                yield bot.sendReaction(context.chat, context.sender, context.messageId, '❌');
            }
        });
    }
};
