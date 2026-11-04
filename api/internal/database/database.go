// Package database connects the API to PostgreSQL and keeps its schema updated.
package database

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
	"github.com/pressly/goose/v3/lock"
)

const migrateTimeout = time.Minute

//go:embed migrations/*.sql
var migrationFiles embed.FS

// Connect creates a connection pool. The pool connects on demand, so a database
// outage does not bring the API down and /ready can report it.
func Connect(ctx context.Context, url string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, fmt.Errorf("create database pool: %w", err)
	}
	return pool, nil
}

// Migrate applies the pending migrations. An advisory lock makes it safe to run
// from several instances at the same time.
func Migrate(ctx context.Context, pool *pgxpool.Pool, log *slog.Logger) error {
	ctx, cancel := context.WithTimeout(ctx, migrateTimeout)
	defer cancel()

	migrations, err := fs.Sub(migrationFiles, "migrations")
	if err != nil {
		return fmt.Errorf("read migrations: %w", err)
	}

	locker, err := lock.NewPostgresSessionLocker(lock.WithLockTimeout(1, 60))
	if err != nil {
		return fmt.Errorf("create migration lock: %w", err)
	}

	db := stdlib.OpenDBFromPool(pool)
	defer db.Close()

	provider, err := goose.NewProvider(goose.DialectPostgres, db, migrations, goose.WithSessionLocker(locker))
	if err != nil {
		return fmt.Errorf("create migration provider: %w", err)
	}

	results, err := provider.Up(ctx)
	if err != nil {
		return fmt.Errorf("apply migrations: %w", err)
	}

	for _, result := range results {
		log.InfoContext(ctx, "migration applied", "file", result.Source.Path, "duration_ms", result.Duration.Milliseconds())
	}
	return nil
}
