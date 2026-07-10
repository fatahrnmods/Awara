"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const qrcode = __importStar(require("qrcode-terminal"));
const prefix_1 = require("./utils/prefix");
const commands_1 = require("./commands");
const loader_1 = require("./utils/loader");
const botClient_1 = require("./core/botClient");
const instructionLoader_1 = require("./utils/instructionLoader");
const chatHistories = {};
class WhatsAppBotLauncher {
    static launch() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { initializeLoader } = yield Promise.resolve().then(() => __importStar(require('./utils/loader')));
                yield initializeLoader();
                this.ensureBinaryExists();
                const botProcess = this.spawnBot(this.getPlatformBinaryPath());
                this.setupEventHandlers(botProcess);
                console.log('Loaded commands:', [...loader_1._commandRegistry.keys()]);
            }
            catch (error) {
                console.error('❌ Fatal error:', error);
                process.exit(1);
            }
        });
    }
    static getPlatformBinaryPath() {
        const platform = os_1.default.platform();
        const arch = os_1.default.arch();
        const binaries = {
            win32: 'whatsapp-bot.exe',
            linux: `whatsapp-bot-linux-${arch === 'x64' ? 'x64' : 'arm64'}`,
            darwin: `whatsapp-bot-macos-${arch === 'arm64' ? 'arm64' : 'x64'}`
        };
        return path_1.default.join(this.BINARY_DIR, binaries[platform]);
    }
    static ensureBinaryExists() {
        const binaryPath = this.getPlatformBinaryPath();
        if (!fs_1.default.existsSync(binaryPath)) {
            console.log('🔨 Building binary...');
            this.buildBinary();
        }
        if (os_1.default.platform() !== 'win32') {
            try {
                fs_1.default.chmodSync(binaryPath, 0o755);
            }
            catch (err) {
                console.warn('⚠️ Could not set execute permissions:', err);
            }
        }
    }
    static buildBinary() {
        const platform = os_1.default.platform();
        const arch = os_1.default.arch();
        const outputFile = path_1.default.join(this.BINARY_DIR, `whatsapp-bot-${platform}-${arch === 'x64' ? 'x64' : 'arm64'}`);
        const buildCommands = {
            win32: `set GOOS=windows&& set GOARCH=amd64&& go build -o ${path_1.default.join(this.BINARY_DIR, "whatsapp-bot.exe")} ./cmd/bot`,
            linux: `GOOS=linux GOARCH=${arch === 'x64' ? 'amd64' : 'arm64'} go build -o "${outputFile}" ./cmd/bot`,
            darwin: `GOOS=darwin GOARCH=${arch === 'arm64' ? 'arm64' : 'amd64'} go build -o "${outputFile}" ./cmd/bot`
        };
        try {
            (0, child_process_1.execSync)(buildCommands[platform], {
                cwd: this.BUILD_DIR,
                stdio: 'inherit',
                env: Object.assign({}, process.env)
            });
        }
        catch (error) {
            console.error('❌ Build failed:', error);
            throw new Error('Failed to build binary');
        }
    }
    static spawnBot(binaryPath) {
        if (!fs_1.default.existsSync(binaryPath)) {
            throw new Error(`Binary not found at ${binaryPath}`);
        }
        return (0, child_process_1.spawn)(binaryPath, [], {
            cwd: path_1.default.dirname(binaryPath),
            stdio: ['pipe', 'pipe', 'inherit'],
            windowsHide: true,
            shell: false
        });
    }
    static setupEventHandlers(botProcess) {
        var _a, _b;
        let messageBuffer = '';
        const bot = (0, botClient_1.createBotClient)(botProcess);
        const handleOutput = (data) => {
            const output = data.toString().trim();
            if (!output)
                return;
            try {
                const message = JSON.parse(output);
                switch (message.type) {
                    case 'qr':
                        qrcode.generate(message.content.code, { small: true });
                        console.log(message.content.message);
                        break;
                    case 'message':
                        this.handleMessage(bot, message.content);
                        break;
                    case 'chatbot_result':
                        this.handleChatbotResponse(bot, message.content);
                        break;
                    default:
                        if (output.includes('[BOT INFO]'))
                            console.log(output);
                }
            }
            catch (_a) {
                console.log(output);
            }
        };
        (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
            messageBuffer += data.toString();
            const messages = messageBuffer.split('\n');
            messageBuffer = messages.pop() || '';
            messages.forEach(msg => {
                if (msg.trim()) {
                    try {
                        handleOutput(Buffer.from(msg));
                    }
                    catch (err) {
                        console.error('IPC message processing error:', err);
                    }
                }
            });
        });
        (_b = botProcess.stderr) === null || _b === void 0 ? void 0 : _b.on('data', data => console.error(`[BOT ERROR] ${data.toString().trim()}`));
        botProcess.on('error', err => {
            console.error('🔥 Process error:', err);
            process.exit(1);
        });
        botProcess.on('exit', code => {
            console.log(`🛑 Process exited with code ${code}`);
            process.exit(code || 0);
        });
        process.on('SIGINT', () => {
            console.log('\nShutting down...');
            botProcess.kill();
            process.exit();
        });
        process.on('exit', () => {
            commands_1.commandCache.clear();
            loader_1._commandRegistry.clear();
            loader_1._aliasRegistry.clear();
        });
    }
    static handleChatbotResponse(bot, content) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('[CHATBOT] Received response:', content);
                let parsedResponse;
                let isJsonResponse = false;
                try {
                    let rawMsg = content.message || '';
                    // Cari semua JSON objects dalam response
                    const jsonMatches = rawMsg.match(/\{[\s\S]*?\}/g);
                    if (jsonMatches) {
                        // Ambil JSON terakhir yang valid dengan caption
                        for (const match of jsonMatches.reverse()) {
                            try {
                                const parsed = JSON.parse(match);
                                if (parsed.caption || parsed.cmd) {
                                    parsedResponse = parsed;
                                    isJsonResponse = true;
                                    break;
                                }
                            }
                            catch (_a) { }
                        }
                    }
                    if (!isJsonResponse) {
                        parsedResponse = rawMsg;
                    }
                }
                catch (e) {
                    parsedResponse = content.message;
                }
                if (isJsonResponse && parsedResponse.cmd) {
                    const command = parsedResponse.cmd.replace(/^\//, '');
                    const caption = parsedResponse.caption || '';
                    const query = parsedResponse.query || '';
                    if (caption) {
                        yield bot.sendMessage(content.chat, caption);
                    }
                    const cmd = yield (0, commands_1.getCommand)(command);
                    if (cmd) {
                        const context = {
                            chat: content.chat,
                            from: content.from || content.chat,
                            sender: content.sender,
                            text: parsedResponse.cmd,
                            isGroup: content.chat.endsWith('@g.us'),
                            messageId: content.messageId || '',
                            pushName: content.pushName || ''
                        };
                        yield cmd.handler(bot, query ? [query] : [], context);
                    }
                }
                else if (isJsonResponse && parsedResponse.caption) {
                    this.updateChatHistory(content.sender, 'assistant', parsedResponse.caption);
                    yield bot.sendMessage(content.chat, parsedResponse.caption);
                }
                else {
                    this.updateChatHistory(content.from, 'assistant', content.message);
                    yield bot.sendMessage(content.chat, content.message);
                }
            }
            catch (error) {
                console.error('[CHATBOT] Error handling response:', error);
                yield bot.sendMessage(content.chat, '⚠️ Maaf, terjadi kesalahan saat memproses pesanmu');
            }
        });
    }
    static updateChatHistory(sender, role, content) {
        if (!chatHistories[sender]) {
            chatHistories[sender] = { historyChatbot: [] };
        }
        chatHistories[sender].historyChatbot.push({ role, content });
    }
    static handleMessage(bot, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const { command: cmdName, args } = (0, prefix_1.extractCommand)(content.text);
            const { chat, from, text, pushName, isGroup, messageId } = content;
            const sender = from.split(':')[0] + '@s.whatsapp.net';
            const context = {
                chat,
                from,
                sender,
                text,
                pushName,
                isGroup,
                messageId,
                isImage: content.isImage,
                isQuotedImage: content.isQuotedImage,
                isSticker: content.isSticker,
                isQuotedSticker: content.isQuotedSticker,
                quotedMessage: content.quotedMessage ? {
                    messageId: content.quotedMessage.messageId || '',
                    from: content.quotedMessage.from || '',
                    isImage: content.quotedMessage.isImage || false
                } : undefined
            };
            if (!chatHistories[sender]) {
                chatHistories[sender] = { historyChatbot: [] };
            }
            if (!cmdName) {
                if (!isGroup) {
                    this.updateChatHistory(sender, 'user', text);
                    return yield bot.ai(chat, text, [
                        ...instructionLoader_1.BASE_INSTRUCTIONS,
                        ...chatHistories[sender].historyChatbot
                    ], 'GPT-4');
                }
                return;
            }
            try {
                const cmd = yield (0, commands_1.getCommand)(cmdName);
                if (!cmd && !isGroup) {
                    this.updateChatHistory(sender, 'user', text);
                    return yield bot.ai(chat, text, [
                        ...instructionLoader_1.BASE_INSTRUCTIONS,
                        ...chatHistories[sender].historyChatbot
                    ], 'GPT-4');
                }
                if (!cmd)
                    return;
                const startTime = Date.now();
                try {
                    console.log(`[MSG] From: ${from} - Content: ${text}`);
                    if (cmd.wait) {
                        yield bot.sendReaction(chat, sender, messageId, '⏳');
                    }
                    yield cmd.handler(bot, args, context);
                    const duration = Date.now() - startTime;
                    if (duration > 1000) {
                        console.log(`[PERF] Slow command ${cmdName}: ${duration}ms`);
                    }
                    if (cmd.wait)
                        yield bot.sendReaction(chat, sender, messageId, '✅');
                }
                catch (err) {
                    console.error(`[ERROR] Command ${cmdName} failed after ${Date.now() - startTime}ms`, err);
                    throw err;
                }
            }
            catch (err) {
                yield bot.sendMessage(content.chat, '⚠️ An error occurred while processing your command');
            }
        });
    }
}
WhatsAppBotLauncher.BINARY_DIR = path_1.default.join(__dirname, '../bin');
WhatsAppBotLauncher.BUILD_DIR = path_1.default.join(__dirname, '..');
WhatsAppBotLauncher.launch();
