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
exports.downloadInstagram = downloadInstagram;
exports.downloadPinterest = downloadPinterest;
exports.downloadSpotify = downloadSpotify;
exports.downloadMediafire = downloadMediafire;
exports.downloadThreads = downloadThreads;
exports.downloadCapcut = downloadCapcut;
const btch_downloader_1 = require("btch-downloader");
function detectFromUrl(url) {
    try {
        // URL formatnya: https://d.rapidcdn.app/v2?token=<JWT>
        const tokenMatch = url.match(/token=([^&]+)/);
        if (!tokenMatch)
            return url.toLowerCase().includes('.mp4');
        const token = tokenMatch[1];
        const payloadB64 = token.split('.')[1];
        const payloadJson = Buffer.from(payloadB64, 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson);
        const filename = payload.filename || payload.url || '';
        return filename.toLowerCase().includes('.mp4');
    }
    catch (_a) {
        return url.toLowerCase().includes('.mp4');
    }
}
function downloadInstagram(url) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const res = yield (0, btch_downloader_1.igdl)(url);
        if (!res.status || !((_a = res.result) === null || _a === void 0 ? void 0 : _a.length)) {
            throw new Error('Failed to fetch Instagram content');
        }
        return res.result.map((item) => ({
            url: item.url,
            isVideo: detectFromUrl(item.url)
        }));
    });
}
function downloadPinterest(url) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        const { pinterest } = yield Promise.resolve().then(() => __importStar(require('btch-downloader')));
        const res = yield pinterest(url);
        if (!res.status || !((_a = res.result) === null || _a === void 0 ? void 0 : _a.result)) {
            throw new Error('Failed to fetch Pinterest content');
        }
        const data = res.result.result;
        if (data.video_url) {
            return { url: data.video_url, isVideo: true };
        }
        if ((_d = (_c = (_b = data.videos) === null || _b === void 0 ? void 0 : _b.video) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.url) {
            return { url: data.videos.video[0].url, isVideo: true };
        }
        let imageUrl = ((_f = (_e = data.images) === null || _e === void 0 ? void 0 : _e.orig) === null || _f === void 0 ? void 0 : _f.url) || data.image;
        if (!imageUrl) {
            throw new Error('No media URL found in Pinterest response');
        }
        // Ganti path resolusi kecil (mis. /236x/) ke /originals/ untuk kualitas penuh
        imageUrl = imageUrl.replace(/\/\d+x(?:\d+)?\//, '/originals/');
        return { url: imageUrl, isVideo: false };
    });
}
function downloadSpotify(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const { spotify } = yield Promise.resolve().then(() => __importStar(require('btch-downloader')));
        const res = yield spotify(url);
        if (!res.status || !res.result)
            throw new Error('Failed to fetch Spotify content');
        return res.result;
    });
}
function downloadMediafire(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const { mediafire } = yield Promise.resolve().then(() => __importStar(require('btch-downloader')));
        const res = yield mediafire(url);
        if (!res.status || !res.result)
            throw new Error('Failed to fetch Mediafire content');
        return res.result;
    });
}
function downloadThreads(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const { threads } = yield Promise.resolve().then(() => __importStar(require('btch-downloader')));
        const res = yield threads(url);
        if (!res.status || !res.result)
            throw new Error('Failed to fetch Threads content');
        return res.result;
    });
}
function downloadCapcut(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const { capcut } = yield Promise.resolve().then(() => __importStar(require('btch-downloader')));
        const res = yield capcut(url);
        if (!res.status || !res.result)
            throw new Error('Failed to fetch Capcut content');
        return res.result;
    });
}
