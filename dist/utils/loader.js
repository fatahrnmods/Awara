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
exports._aliasRegistry = exports._commandRegistry = void 0;
exports.initializeLoader = initializeLoader;
exports.getCommand = getCommand;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
exports._commandRegistry = new Map();
exports._aliasRegistry = new Map();
const _commandCache = new Map();
const MAX_CACHE_SIZE = 100;
const CACHE_TTL = 3600000;
const PARALLEL_LIMIT = 5;
function cleanupCache() {
    const now = Date.now();
    const entries = [..._commandCache.entries()]
        .filter(([, cmd]) => cmd.meta.loadedAt && now - cmd.meta.loadedAt.getTime() > CACHE_TTL);
    if (_commandCache.size > MAX_CACHE_SIZE) {
        entries.sort((a, b) => a[1].meta.loadedAt.getTime() - b[1].meta.loadedAt.getTime());
        entries.slice(0, entries.length - MAX_CACHE_SIZE)
            .forEach(([key]) => _commandCache.delete(key));
    }
}
setInterval(cleanupCache, CACHE_TTL).unref();
function processFile(file, commandDir) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (!file.endsWith('.js') || !file.includes('_'))
            return;
        const filePath = path_1.default.join(commandDir, file);
        try {
            const stats = yield promises_1.default.stat(filePath);
            const [category] = file.split('_');
            delete require.cache[require.resolve(filePath)];
            const cmd = (yield Promise.resolve(`${filePath}`).then(s => __importStar(require(s)))).default;
            if (!(cmd === null || cmd === void 0 ? void 0 : cmd.name) || !cmd.handler) {
                console.warn(`⚠️ Invalid command in ${file}`);
                return;
            }
            const meta = {
                filePath,
                loadedAt: new Date(),
                lastModified: stats.mtimeMs,
                size: stats.size,
                category: cmd.category || category
            };
            exports._commandRegistry.set(cmd.name.toLowerCase(), meta);
            (_a = cmd.alias) === null || _a === void 0 ? void 0 : _a.forEach((alias) => exports._aliasRegistry.set(alias.toLowerCase(), cmd.name.toLowerCase()));
        }
        catch (err) {
            console.error(`✗ Failed to load ${file}:`, err);
        }
    });
}
function initializeLoader() {
    return __awaiter(this, void 0, void 0, function* () {
        const commandDir = path_1.default.resolve(__dirname, '../../dist/commands');
        try {
            const files = (yield promises_1.default.readdir(commandDir))
                .filter(file => file.endsWith('.js') && file.includes('_'));
            for (let i = 0; i < files.length; i += PARALLEL_LIMIT) {
                yield Promise.all(files.slice(i, i + PARALLEL_LIMIT)
                    .map(file => processFile(file, commandDir)));
            }
        }
        catch (err) {
            console.error('[LOADER] Initialization error:', err);
            throw err;
        }
    });
}
function getCommand(name) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const normalizedName = name.toLowerCase();
        const cached = _commandCache.get(normalizedName);
        if (cached)
            return cached;
        const commandName = exports._aliasRegistry.get(normalizedName) || normalizedName;
        const meta = exports._commandRegistry.get(commandName);
        if (!meta)
            return null;
        try {
            const stats = yield promises_1.default.stat(meta.filePath);
            const isModified = meta.lastModified !== stats.mtimeMs;
            if (isModified) {
                delete require.cache[require.resolve(meta.filePath)];
                meta.lastModified = stats.mtimeMs;
                meta.loadedAt = new Date();
            }
            const cmd = (yield Promise.resolve(`${meta.filePath}`).then(s => __importStar(require(s)))).default;
            const commandWithMeta = Object.assign(Object.assign({}, cmd), { meta: Object.assign(Object.assign({}, meta), { category: cmd.category || meta.category }) });
            _commandCache.set(commandName, commandWithMeta);
            (_a = cmd.alias) === null || _a === void 0 ? void 0 : _a.forEach((alias) => _commandCache.set(alias.toLowerCase(), commandWithMeta));
            return commandWithMeta;
        }
        catch (err) {
            console.error(`[LOADER] Failed to load ${commandName}`, err);
            exports._commandRegistry.delete(commandName);
            return null;
        }
    });
}
