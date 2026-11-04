// Command api starts the project manager HTTP API.
package main

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Lucas-Lopes-II/project-manager/api/internal/config"
	"github.com/Lucas-Lopes-II/project-manager/api/internal/database"
	"github.com/Lucas-Lopes-II/project-manager/api/internal/health"
	"github.com/Lucas-Lopes-II/project-manager/api/internal/httpx"
	"github.com/Lucas-Lopes-II/project-manager/api/internal/project"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(log)

	if err := run(log); err != nil {
		log.Error("api stopped", "error", err)
		os.Exit(1)
	}
}

func run(log *slog.Logger) error {
	cfg, err := config.Load(os.Getenv)
	if err != nil {
		return err
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	db, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer db.Close()

	if err := database.Migrate(ctx, db, log); err != nil {
		return err
	}

	mux := http.NewServeMux()
	health.Register(mux, db, log)
	project.NewHandler(project.NewService(project.NewRepository(db)), log).Register(mux)

	listener, err := net.Listen("tcp", ":"+cfg.Port)
	if err != nil {
		return fmt.Errorf("listen on port %s: %w", cfg.Port, err)
	}

	srv := &http.Server{
		Handler:           httpx.NewHandler(mux, log),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	return httpx.Serve(ctx, srv, listener, log)
}
