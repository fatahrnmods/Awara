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
function resolveTarget(args, quotedFrom) {
    if (quotedFrom)
        return quotedFrom;
    if (!args[0])
        return null;
    return args[0].replace(/[^0-9]/g, '');
}
exports.default = {
    name: 'demote',
    category: 'group',
    wait: true,
    description: 'Demote admin to member (admin only)',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!context.isGroup) {
                return bot.sendMessage(context.chat, '❌ Command ini hanya untuk grup!');
            }
            const rawTarget = resolveTarget(args, (_a = context.quotedMessage) === null || _a === void 0 ? void 0 : _a.from);
            if (!rawTarget) {
                return bot.sendMessage(context.chat, '⚠️ Reply/mention orang yang mau diturunkan!');
            }
            const number = rawTarget.replace('@lid', '').replace('@s.whatsapp.net', '');
            const candidates = [`${number}@lid`, `${number}@s.whatsapp.net`];
            let ok = false;
            for (const jid of candidates) {
                ok = yield bot.groupAction('demote', context.chat, jid);
                if (ok)
                    break;
            }
            yield bot.sendMessage(context.chat, ok ? '✅ Berhasil turunkan admin!' : '❌ Gagal, pastikan bot admin & nomor benar!');
        });
    }
};
