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
exports.formatUptime = formatUptime;
exports.getCpuUsage = getCpuUsage;
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const parts = [];
    if (days > 0)
        parts.push(`${days} Hari`);
    parts.push(`${hours} Jam`, `${mins} Menit`, `${secs} Detik`);
    return parts.join(', ');
}
function getCpuUsage() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            const start = process.cpuUsage();
            setTimeout(() => {
                const end = process.cpuUsage(start);
                const usage = (end.user + end.system) / 10000;
                resolve(usage.toFixed(2) + '%');
            }, 100);
        });
    });
}
