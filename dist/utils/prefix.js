"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCommand = extractCommand;
function extractCommand(input) {
    const trimmed = input.trim();
    if (!trimmed)
        return { prefix: null, command: '', args: [] };
    const [cmdPart, ...rawArgs] = trimmed.split(/\s+/);
    const args = rawArgs.filter(Boolean);
    const hasPrefix = /^[°•π÷×¶∆£¢€¥®™�✓_=|~!?#/$%^&.+-,\\\©^]/.test(cmdPart);
    const prefix = hasPrefix ? cmdPart[0] : null;
    const command = hasPrefix ? cmdPart.slice(1) : cmdPart;
    return { prefix, command, args };
}
