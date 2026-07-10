<div align="center">
  <img src="https://files.catbox.moe/ugs4hj.jpg" width="150" alt="AwaraBot Logo">
  <h1>AwaraBot</h1>
  <p>WhatsApp Bot (Go + TypeScript)</p>
  
  [![Go Version](https://img.shields.io/badge/Go-1.20%2B-blue?logo=go)](https://golang.org/)
  [![Node Version](https://img.shields.io/badge/Node-18%2B-green?logo=node.js)](https://nodejs.org/)
  [![License](https://img.shields.io/badge/License-MIT-red)](LICENSE)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/moo-d/AwaraBot/pulls)
</div>

## 🌟 Key Features

### 🎵 Media Downloader
| Service  | Format                 | Example Command                     | Aliases          |
|----------|------------------------|-------------------------------------|------------------|
| YouTube  | MP3 Audio              | `/ytmp3 https://youtu.be/...`       | `yta`, `ytaudio` |
| YouTube  | MP4 Video (720p HD)    | `/ytmp4 https://youtu.be/...`       | `ytv`, `ytvideo` |
| TikTok   | Video/Images (Auto-detect) | `/tt https://vm.tiktok.com/...` | `tt`, `tiktokdl` |

### 🛠️ Utility Commands
```bash
/menu   # Show all commands
/stats  # Show bot statistics
```

## 🚀 Getting Started

### ⚙️ Installation
```bash
# 1. Clone repository
git clone https://github.com/moo-d/AwaraBot && cd AwaraBot

# 2. Install dependencies
go mod tidy && npm install

# 3. Configure environment
cp .env.example .env
nano .env  # Edit your configuration

# 4. Start the bot
npm run prod
```

### 🔧 Configuration
```env
# .env Example
BOT_NAME=Awara
```

---

## 🏗️ Project Structure

```
AwaraBot/
├── build.sh                 # Build script dan helper
├── env.example              # Template environment variables
├── go.mod                   # Go module definition
├── go.sum                   # Go dependency checksum
├── package.json             # Node.js dependencies & scripts
├── package-lock.json        # Locked Node dependency tree
├── README.md                # Dokumentasi utama
├── LICENSE                  # Lisensi proyek
├── .env                     # Environment variables runtime (tidak dikomit)
├── dist/                    # Output build TypeScript
├── bin/                     # Optional binary / helper script
├── cmd/                     # Go entry point executable
├── instructions/            # Instruction files untuk bot
├── internal/                # Logika internal Go
└── src/                     # TypeScript command handler
```

### `/cmd`
- `bot/main.go` — entry point Go untuk menjalankan bot dan inisialisasi koneksi WhatsApp.

### `/internal`
- `bot/bot.go` — struktur bot dan inisialisasi utama.
- `bot/connection.go` — setup koneksi WhatsApp dengan Whatsmeow.
- `bot/events.go` — handler event pesan dan status.
- `bot/media.go` — pemrosesan media, download, dan pengiriman.
- `bot/stdin.go` — input terminal / stdin.
- `scraper/youtube.go` — downloader YouTube.
- `scraper/tiktok.go` — downloader TikTok.
- `scraper/vyro.go` — integrasi Vyro.
- `scraper/gpt.go` — integrasi GPT.

### `/instructions`
- `capabilities.txt` — daftar kemampuan bot.
- `personality.txt` — gaya pesan dan personality.
- `response_format.txt` — format respons standar.

### `/src`
- `index.ts` — entry point TypeScript.
- `types.d.ts` — definisi tipe.
- `commands/index.ts` — router command.
- `commands/main_menu.ts` — handler menu.
- `commands/main_stats.ts` — handler statistik.
- `commands/main_status.ts` — handler status.
- `commands/downloader_ytmp3.ts` — downloader YouTube MP3.
- `commands/downloader_ytmp4.ts` — downloader YouTube MP4.
- `commands/downloader_tiktok.ts` — downloader TikTok.
- `core/botClient.ts` — wrapper client bot.
- `utils/instructionLoader.ts` — loader instruction files.
- `utils/loader.ts` — utility loader.
- `utils/prefix.ts` — handler prefix command.
- `utils/statsHelper.ts` — util statistik.

---

## 🔄 Architecture Overview

AwaraBot adalah aplikasi hybrid dengan dua lapisan utama:

1. Go backend sebagai engine WhatsApp dan event processing.
2. TypeScript command handler untuk routing command dan logika response.

Pesan masuk diterima oleh Go, di-handle oleh `internal/bot`, lalu dialirkan ke TypeScript (`src/`) untuk memproses command dan membalas pengguna.

---

## 🛠️ Build & Run

```bash
# Compile TypeScript
npm run prod

# Alternatif pengembangan
npm run dev
```

> `npm run prod` menjalankan `npx tsc && node .`

Jika Anda ingin build Go sendiri:

```bash
go build -o bot ./cmd/bot/main.go
```

---

## 🧾 Dependencies

- Go 1.24+
- Node.js 18+
- `whatsmeow` untuk WhatsApp
- `sqlite3` untuk database lokal
- `typescript`, `ts-node`, `nodemon` untuk workflow JavaScript

---

## 📌 Notes

- `dist/` adalah output TypeScript hasil kompilasi.
- `node_modules/` tidak perlu dikomit.
- `.env` diperlukan untuk konfigurasi runtime.
- Gunakan `instructions/` untuk mengubah behavior bot tanpa mengubah kode.

---

## 📢 Join For More Information
<a href="https://chat.whatsapp.com/L1xOwYMceo64Ff8958Q1rT"> <img src="https://img.shields.io/badge/Join_Group-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp Group"> </a>
