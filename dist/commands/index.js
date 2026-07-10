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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCommand = exports.getCommand = exports.commandCache = void 0;
const loader_1 = require("../utils/loader");
exports.commandCache = new Map();
const getCommand = (name) => __awaiter(void 0, void 0, void 0, function* () {
    const normalizedName = name.toLowerCase();
    if (exports.commandCache.has(normalizedName)) {
        return exports.commandCache.get(normalizedName);
    }
    const commandName = loader_1._aliasRegistry.get(normalizedName) || normalizedName;
    const meta = loader_1._commandRegistry.get(commandName);
    if (!meta)
        return null;
    try {
        delete require.cache[require.resolve(meta.filePath)];
        const cmd = (yield Promise.resolve(`${meta.filePath}`).then(s => __importStar(require(s)))).default;
        const commandWithMeta = Object.assign(Object.assign({}, cmd), { meta: Object.assign(Object.assign({}, cmd.meta), { filePath: meta.filePath, category: cmd.category || meta.category }) });
        exports.commandCache.set(commandName, commandWithMeta);
        return commandWithMeta;
    }
    catch (err) {
        console.error(`[CMD] Failed to load ${commandName}:`, err);
        return null;
    }
});
exports.getCommand = getCommand;
const handleCommand = (bot, name, args, context) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const command = yield (0, exports.getCommand)(name);
    if (!command)
        return null;
    try {
        const result = yield command.handler(bot, args, Object.assign(Object.assign({}, context), { category: ((_a = command.meta) === null || _a === void 0 ? void 0 : _a.category) || 'general' }));
        return result;
    }
    catch (err) {
        console.error(`[CMD] Execution error (${name}):`, err);
        return null;
    }
});
exports.handleCommand = handleCommand;
