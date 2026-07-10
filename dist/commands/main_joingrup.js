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
    name: 'join',
    alias: ['joingrup'],
    category: 'main',
    description: 'Join group via invite link (owner only)',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const owners = [
                (_a = process.env.OWNER_1) === null || _a === void 0 ? void 0 : _a.split(':')[0],
                (_b = process.env.OWNER_2) === null || _b === void 0 ? void 0 : _b.split(':')[0]
            ].filter(Boolean);
            const senderLid = context.from.split(':')[0].split('@')[0];
            const senderNum = context.sender.replace('@s.whatsapp.net', '').replace('@lid', '');
            const isOwner = owners.some(o => o === senderLid || o === senderNum);
            if (!isOwner) {
                return bot.sendMessage(context.chat, '❌ Command ini hanya untuk owner!');
            }
            const link = args[0];
            if (!link) {
                return bot.sendMessage(context.chat, '⚠️ Kirim link grup!\nContoh: .join https://chat.whatsapp.com/xxx');
            }
            if (!link.includes('chat.whatsapp.com/')) {
                return bot.sendMessage(context.chat, '❌ Link tidak valid!');
            }
            yield bot.joinGroup(link);
            yield bot.sendMessage(context.chat, '✅ Berhasil join grup!');
        });
    }
};
