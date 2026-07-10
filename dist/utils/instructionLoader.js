"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BASE_INSTRUCTIONS = void 0;
exports.loadInstruction = loadInstruction;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const INSTRUCTIONS_DIR = path_1.default.join(__dirname, '../../instructions');
function loadInstruction(filename) {
    try {
        const content = fs_1.default.readFileSync(path_1.default.join(INSTRUCTIONS_DIR, filename), 'utf-8');
        return { role: 'user', content };
    }
    catch (error) {
        console.error(`Error loading instruction ${filename}:`, error);
        return { role: 'user', content: '' };
    }
}
exports.BASE_INSTRUCTIONS = [
    'personality.txt',
    'capabilities.txt',
    'response_format.txt'
].map(loadInstruction).filter(inst => inst.content);
