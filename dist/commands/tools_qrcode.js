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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const qrcode_1 = __importDefault(require("qrcode"));
exports.default = {
    name: 'qrcode',
    alias: ['qr'],
    category: 'tools',
    wait: true,
    description: 'Generate QR code from text',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const text = args.join(' ');
            if (!text)
                return bot.sendMessage(context.chat, '⚠️ Kasih teks/link untuk dijadikan QR!');
            try {
                const buffer = yield qrcode_1.default.toBuffer(text, { width: 512, margin: 2 });
                yield bot.sendImage(context.chat, buffer, `📱 QR Code: ${text}`);
            }
            catch (error) {
                yield bot.sendMessage(context.chat, `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
};
