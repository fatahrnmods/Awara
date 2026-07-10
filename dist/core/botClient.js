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
exports.createBotClient = createBotClient;
function createBotClient(botProcess) {
    const formatContent = (content) => content.replace(/\n/g, '{{NL}}');
    const sendCommand = (command, errorPrefix = 'Command') => {
        return new Promise((resolve, reject) => {
            var _a;
            (_a = botProcess.stdin) === null || _a === void 0 ? void 0 : _a.write(command, err => {
                err ? reject(`${errorPrefix} error: ${err}`) : resolve();
            });
        });
    };
    const createMediaCommand = (type, jid, media, caption = '', isUrl = false) => {
        const baseCmd = isUrl || typeof media === 'string' ? `SEND_URL_${type}` : `SEND_${type}`;
        const mediaData = typeof media === 'string' ? media : media.toString('base64');
        return `${baseCmd}:${jid}|${mediaData}${type !== 'AUDIO' ? `|${formatContent(caption)}` : ''}MESSAGE_END\n`;
    };
    const handleResponse = (prefix) => {
        return new Promise((resolve, reject) => {
            var _a;
            let buffer = '';
            const handler = (data) => {
                var _a;
                buffer += data.toString();
                if (buffer.includes(`${prefix}:`) && buffer.includes('MESSAGE_END')) {
                    (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.off('data', handler);
                    try {
                        const jsonStr = buffer.split(`${prefix}:`)[1].split('MESSAGE_END')[0].trim();
                        resolve(JSON.parse(jsonStr));
                    }
                    catch (err) {
                        reject(err);
                    }
                }
            };
            (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', handler);
        });
    };
    const ai = (jid_1, prompt_1, ...args_1) => __awaiter(this, [jid_1, prompt_1, ...args_1], void 0, function* (jid, prompt, messages = [], model = "GPT-4") {
        const messagesStr = JSON.stringify(messages);
        const command = `CHATBOT:${jid}|${prompt}|${model}|${messagesStr}MESSAGE_END\n`;
        yield sendCommand(command, 'Chatbot');
        return new Promise((resolve) => {
            var _a;
            const handler = (data) => {
                var _a;
                const message = data.toString();
                if (message.includes('CHATBOT_RESULT:')) {
                    try {
                        const jsonStr = message.split('CHATBOT_RESULT:')[1].split('MESSAGE_END')[0].trim();
                        const result = JSON.parse(jsonStr);
                        resolve({
                            chat: result.chat || jid,
                            message: result.message || result.caption || 'No response',
                            command: result.command,
                            query: result.query,
                            caption: result.caption
                        });
                    }
                    catch (err) {
                        console.error('Failed to parse chatbot response:', err);
                        resolve({
                            chat: jid,
                            message: 'Error processing response'
                        });
                    }
                    finally {
                        (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.off('data', handler);
                    }
                }
            };
            (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', handler);
        });
    });
    return {
        ai,
        sendCommand,
        sendMessage: (jid, content) => sendCommand(`SEND:${jid}|${formatContent(typeof content === 'string' ? content : '')}MESSAGE_END\n`, 'Write'),
        sendImage: (jid, image, caption = '', isUrl = false) => sendCommand(createMediaCommand('IMAGE', jid, image, caption, isUrl), 'Image send'),
        sendVideo: (jid, video, caption = '', isUrl = false) => sendCommand(createMediaCommand('VIDEO', jid, video, caption, isUrl), 'Video send'),
        sendAudio: (jid, audio, isUrl = false) => sendCommand(createMediaCommand('AUDIO', jid, audio, '', isUrl), 'Audio send'),
        sendDocument: (jid_1, data_1, filename_1, ...args_1) => __awaiter(this, [jid_1, data_1, filename_1, ...args_1], void 0, function* (jid, data, filename, caption = '') {
            const base64 = data.toString('base64');
            const cmd = `SEND_DOCUMENT:${jid}|${filename}|${formatContent(caption)}|${base64}MESSAGE_END\n`;
            return sendCommand(cmd, 'Document send');
        }),
        sendListMenu: (jid, payload) => __awaiter(this, void 0, void 0, function* () {
            const data = {
                jid,
                title: payload.title,
                body: payload.body,
                footer: payload.footer,
                button: payload.button,
                image: payload.image ? payload.image.toString('base64') : '',
                sections: payload.sections
            };
            return sendCommand(`SEND_LIST:${JSON.stringify(data)}MESSAGE_END\n`, 'List send');
        }),
        sendInteractive: (jid, payload) => __awaiter(this, void 0, void 0, function* () {
            const data = Object.assign({ jid }, payload);
            return sendCommand(`SEND_INTERACTIVE:${JSON.stringify(data)}MESSAGE_END\n`, 'Interactive send');
        }),
        sendButtons: (jid, payload) => __awaiter(this, void 0, void 0, function* () {
            const data = Object.assign({ jid }, payload);
            return sendCommand(`SEND_BUTTONS:${JSON.stringify(data)}MESSAGE_END\n`, 'Buttons send');
        }),
        joinGroup: (link) => __awaiter(this, void 0, void 0, function* () {
            return sendCommand(`JOIN_GROUP:${link}MESSAGE_END\n`, 'Join group');
        }),
        groupInfo: (action_1, groupJid_1, ...args_1) => __awaiter(this, [action_1, groupJid_1, ...args_1], void 0, function* (action, groupJid, value = '') {
            const data = { action, groupJid, value };
            yield sendCommand(`GROUP_INFO:${JSON.stringify(data)}MESSAGE_END\n`, 'Group info');
            return new Promise((resolve) => {
                var _a;
                const timer = setTimeout(() => resolve({ status: false, error: 'timeout' }), 15000);
                let buffer = '';
                const handler = (d) => {
                    var _a;
                    buffer += d.toString();
                    if (buffer.includes('GROUP_INFO_RESULT:') && buffer.includes('MESSAGE_END')) {
                        clearTimeout(timer);
                        (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.off('data', handler);
                        try {
                            const jsonStr = buffer.split('GROUP_INFO_RESULT:')[1].split('MESSAGE_END')[0].trim();
                            resolve(JSON.parse(jsonStr));
                        }
                        catch (_b) {
                            resolve({ status: false, error: 'parse error' });
                        }
                    }
                };
                (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', handler);
            });
        }),
        downloadMedia: (messageId, jid, type) => __awaiter(this, void 0, void 0, function* () {
            yield sendCommand(`DOWNLOAD_MEDIA:${messageId}|${jid}|${type}MESSAGE_END\n`);
            return new Promise((resolve) => {
                var _a;
                const timer = setTimeout(() => resolve(null), 15000);
                let buffer = '';
                const handler = (data) => {
                    var _a;
                    buffer += data.toString();
                    if (buffer.includes('MEDIA_DATA:') && buffer.includes('MESSAGE_END')) {
                        clearTimeout(timer);
                        (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.off('data', handler);
                        try {
                            const b64 = buffer.split('MEDIA_DATA:')[1].split('MESSAGE_END')[0].trim();
                            if (b64 === 'error')
                                return resolve(null);
                            resolve(Buffer.from(b64, 'base64'));
                        }
                        catch (_b) {
                            resolve(null);
                        }
                    }
                };
                (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', handler);
            });
        }),
        enhanceImage: (imageBuffer_1, ...args_1) => __awaiter(this, [imageBuffer_1, ...args_1], void 0, function* (imageBuffer, mode = 'enhance') {
            const base64 = imageBuffer.toString('base64');
            yield sendCommand(`ENHANCE:${mode}|${base64}|0MESSAGE_END\n`);
            return new Promise((resolve) => {
                var _a;
                const timer = setTimeout(() => resolve({ error: 'Timeout' }), 30000);
                let buffer = '';
                const handler = (data) => {
                    var _a, _b;
                    buffer += data.toString();
                    if (buffer.includes('DOWNLOAD_RESULT:') && buffer.includes('MESSAGE_END')) {
                        clearTimeout(timer);
                        (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.off('data', handler);
                        try {
                            const jsonStr = buffer.split('DOWNLOAD_RESULT:')[1].split('MESSAGE_END')[0].trim();
                            const parsed = JSON.parse(jsonStr);
                            if (parsed.status && ((_b = parsed.result) === null || _b === void 0 ? void 0 : _b.url)) {
                                resolve({ result: { url: parsed.result.url } });
                            }
                            else {
                                resolve({ error: parsed.error || 'Failed' });
                            }
                        }
                        catch (_c) {
                            resolve({ error: 'Parse error' });
                        }
                    }
                };
                (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', handler);
            });
        }),
        convertToSticker: (mediaBuffer) => __awaiter(this, void 0, void 0, function* () {
            const base64 = mediaBuffer.toString('base64');
            yield sendCommand(`CONVERT_STICKER:${base64}MESSAGE_END\n`);
            return new Promise((resolve) => {
                var _a;
                const timer = setTimeout(() => resolve(null), 30000);
                let buffer = '';
                const handler = (data) => {
                    var _a;
                    buffer += data.toString();
                    if (buffer.includes('STICKER_RESULT:') && buffer.includes('MESSAGE_END')) {
                        clearTimeout(timer);
                        (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.off('data', handler);
                        try {
                            const b64 = buffer.split('STICKER_RESULT:')[1].split('MESSAGE_END')[0].trim();
                            if (b64 === 'error')
                                return resolve(null);
                            resolve(Buffer.from(b64, 'base64'));
                        }
                        catch (_b) {
                            resolve(null);
                        }
                    }
                };
                (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', handler);
            });
        }),
        generateBrat: (text) => __awaiter(this, void 0, void 0, function* () {
            yield sendCommand(`GENERATE_BRAT:${text}MESSAGE_END\n`);
            return new Promise((resolve) => {
                var _a;
                const timer = setTimeout(() => resolve(null), 15000);
                let buffer = '';
                const handler = (data) => {
                    var _a;
                    buffer += data.toString();
                    if (buffer.includes('BRAT_RESULT:') && buffer.includes('MESSAGE_END')) {
                        clearTimeout(timer);
                        (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.off('data', handler);
                        try {
                            const b64 = buffer.split('BRAT_RESULT:')[1].split('MESSAGE_END')[0].trim();
                            if (b64 === 'error')
                                return resolve(null);
                            resolve(Buffer.from(b64, 'base64'));
                        }
                        catch (_b) {
                            resolve(null);
                        }
                    }
                };
                (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', handler);
            });
        }),
        sendSticker: (jid, sticker) => __awaiter(this, void 0, void 0, function* () {
            const base64 = sticker.toString('base64');
            return sendCommand(`SEND_STICKER:${jid}|${base64}MESSAGE_END\n`, 'Sticker send');
        }),
        fbigDownloader: (url) => __awaiter(this, void 0, void 0, function* () {
            yield sendCommand(`DOWNLOAD_FBIG:${url}MESSAGE_END\n`);
            const raw = yield handleResponse('DOWNLOAD_RESULT');
            return (raw === null || raw === void 0 ? void 0 : raw.result) || raw;
        }),
        groupAction: (action, groupJid, target) => __awaiter(this, void 0, void 0, function* () {
            const data = { action, groupJid, target };
            yield sendCommand(`GROUP_ACTION:${JSON.stringify(data)}MESSAGE_END\n`, 'Group action');
            return new Promise((resolve) => {
                var _a;
                const timer = setTimeout(() => resolve(false), 20000);
                let buffer = '';
                const handler = (d) => {
                    var _a;
                    buffer += d.toString();
                    if (buffer.includes('GROUP_ACTION_RESULT:') && buffer.includes('MESSAGE_END')) {
                        clearTimeout(timer);
                        (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.off('data', handler);
                        resolve(buffer.includes('okMESSAGE_END'));
                    }
                };
                (_a = botProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', handler);
            });
        }),
        hidetag: (groupJid, text) => __awaiter(this, void 0, void 0, function* () {
            return sendCommand(`HIDETAG:${groupJid}|${formatContent(text)}MESSAGE_END\n`, 'Hidetag');
        }),
        downloader: (url, type, format) => __awaiter(this, void 0, void 0, function* () {
            yield sendCommand(`DOWNLOAD:${type}|${url}|${format || ''}MESSAGE_END\n`);
            return handleResponse('DOWNLOAD_RESULT');
        }),
        sendOwnerVCard: (jid) => __awaiter(this, void 0, void 0, function* () {
            return sendCommand(`SEND_VCARD:${jid}MESSAGE_END\n`, 'VCard send');
        }),
        sendReaction: (jid, sender, messageId, emoji) => {
            const command = `REACT:${jid}|${messageId}|${formatContent(emoji)}|${sender}MESSAGE_END\n`;
            return sendCommand(command, 'Reaction');
        }
    };
}
