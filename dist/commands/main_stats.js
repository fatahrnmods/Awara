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
const os_1 = __importDefault(require("os"));
const process_1 = __importDefault(require("process"));
const statsHelper_1 = require("../utils/statsHelper");
exports.default = {
    name: 'stats',
    alias: ['stat'],
    category: 'main',
    description: 'Check bot statistics',
    handler(bot, args, context) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(context.isGroup);
            const startTime = process_1.default.hrtime();
            const memoryUsage = process_1.default.memoryUsage();
            const cpuInfo = os_1.default.cpus()[0] || {};
            const stats = {
                responseSpeed: 0,
                uptimeBot: (0, statsHelper_1.formatUptime)(process_1.default.uptime()),
                uptimeServer: (0, statsHelper_1.formatUptime)(os_1.default.uptime()),
                memoryUsage: (memoryUsage.rss / 1048576).toFixed(2), // 1024*1024
                cpuModel: cpuInfo.model || 'Unknown',
                cpuSpeed: cpuInfo.speed || 0,
                cpuUsage: yield (0, statsHelper_1.getCpuUsage)(),
                platform: os_1.default.platform(),
                arch: os_1.default.arch(),
                ramTotal: (os_1.default.totalmem() / 1073741824).toFixed(2), // 1024^3
                ramFree: (os_1.default.freemem() / 1073741824).toFixed(2)
            };
            const diff = process_1.default.hrtime(startTime);
            stats.responseSpeed = parseFloat((diff[0] * 1000 + diff[1] / 1e6).toFixed(2));
            const message = `
╭━━━〔 📊 BOT STATISTICS 〕━━━╮
│
│  🔹 Bot Status:
│  ├ 🚀 Response Speed: ${stats.responseSpeed} ms
│  ├ ⏳ Uptime Bot: ${stats.uptimeBot}
│  ├ ⏳ Uptime Server: ${stats.uptimeServer}
│  ├ 📂 Memory Usage: ${stats.memoryUsage} MB
│  
│  🖥 Server Info:
│  ├ 🔧 CPU Model: ${stats.cpuModel}
│  ├ ⚡ CPU Speed: ${stats.cpuSpeed} MHz
│  ├ 📊 CPU Usage: ${stats.cpuUsage}%
│  
│  📜 Additional Info:
│  ├ 🌐 Platform: ${stats.platform}
│  ├ 🏷 Arch: ${stats.arch}
│  ├ 💾 RAM Total: ${stats.ramTotal} GB
│  ├ 📉 RAM Free: ${stats.ramFree} GB
│
╰━━━━━━━━━━━━━━━━━━━╯`.trim();
            yield bot.sendMessage(context.chat, message);
        });
    }
};
