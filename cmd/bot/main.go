package main

import (
	"context"
	"log"

	"github.com/joho/godotenv"
	_ "github.com/mattn/go-sqlite3"
	"github.com/moo-d/AwaraBot/internal/bot"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"
)

func main() {
	// Load .env
	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatalln("cannot load .env files")
	}

	// Buat logger tunggal
	logger := waLog.Stdout("BOT", "INFO", true)

	// Init DB (sekarang wajib pakai context & logger)
	container, err := sqlstore.New(
		context.Background(),
		"sqlite3",
		"file:bot.db?_foreign_keys=on&_journal_mode=WAL&_timeout=5000",
		logger,
	)
	if err != nil {
		log.Fatalf("DB error: %v", err)
	}

	// Ambil device (sekarang juga wajib context)
	device, err := container.GetFirstDevice(context.Background())
	if err != nil {
		log.Fatalf("Device error: %v", err)
	}

	// Start bot
	botInstance := bot.NewBot(device, logger)
	log.Println("Starting bot...")
	botInstance.Run()
}
