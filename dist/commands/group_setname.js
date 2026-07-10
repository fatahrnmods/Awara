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
    name: 'setname',
    category: 'group',
    wait: true,
    description: 'Change group name (admin only)',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!context.isGroup)
                return bot.sendMessage(context.chat, '❌ Command ini hanya untuk grup!');
            const name = args.join(' ');
            if (!name)
                return bot.sendMessage(context.chat, '⚠️ Kasih nama grup barunya!');
            const res = yield bot.groupInfo('setname', context.chat, name);
            yield bot.sendMessage(context.chat, res.status ? '✅ Nama grup berhasil diubah!' : `❌ Gagal: ${res.error}`);
        });
    }
};
