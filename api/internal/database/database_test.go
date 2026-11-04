package database

import (
	"context"
	"flag"
	"fmt"
	"log"
	"log/slog"
	"net/url"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Lucas-Lopes-II/project-manager/api/internal/testdb"
)

var testDatabaseURL string

func TestMain(m *testing.M) {
	flag.Parse()
	if testing.Short() {
		os.Exit(m.Run())
	}
	os.Exit(runWithDatabase(m))
}

func runWithDatabase(m *testing.M) int {
	databaseURL, terminate, err := testdb.Start(context.Background())
	if err != nil {
		log.Print(err)
		return 1
	}
	defer terminate()

	testDatabaseURL = databaseURL
	return m.Run()
}

// newDatabase creates an empty database, so each test sees no migrations applied.
func newDatabase(t *testing.T, name string) *pgxpool.Pool {
	t.Helper()

	admin, err := Connect(t.Context(), testDatabaseURL)
	if err != nil {
		t.Fatalf("Connect() error = %v", err)
	}
	defer admin.Close()

	if _, err := admin.Exec(t.Context(), fmt.Sprintf(`CREATE DATABASE %q`, name)); err != nil {
		t.Fatalf("create database: %v", err)
	}

	databaseURL, err := url.Parse(testDatabaseURL)
	if err != nil {
		t.Fatalf("parse database URL: %v", err)
	}
	databaseURL.Path = "/" + name

	pool, err := Connect(t.Context(), databaseURL.String())
	if err != nil {
		t.Fatalf("Connect() error = %v", err)
	}
	t.Cleanup(pool.Close)
	return pool
}

func countAppliedMigrations(t *testing.T, pool *pgxpool.Pool) int {
	t.Helper()

	var count int
	err := pool.QueryRow(t.Context(), `SELECT count(*) FROM goose_db_version WHERE version_id > 0`).Scan(&count)
	if err != nil {
		t.Fatalf("count migrations: %v", err)
	}
	return count
}

func TestConnect_ReachesTheDatabase(t *testing.T) {
	if testing.Short() {
		t.Skip("integration test")
	}

	pool, err := Connect(t.Context(), testDatabaseURL)
	if err != nil {
		t.Fatalf("Connect() error = %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(t.Context()); err != nil {
		t.Errorf("Ping() error = %v", err)
	}
}

func TestConnect_DoesNotRequireTheDatabaseToStart(t *testing.T) {
	ctx, cancel := context.WithTimeout(t.Context(), 2*time.Second)
	defer cancel()

	pool, err := Connect(ctx, "postgres://user:password@127.0.0.1:1/db?sslmode=disable")
	if err != nil {
		t.Fatalf("Connect() error = %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err == nil {
		t.Error("Ping() error = nil, want an error for an unreachable database")
	}
}

func TestConnect_RejectsAnInvalidURL(t *testing.T) {
	if _, err := Connect(t.Context(), "postgres://%zz"); err == nil {
		t.Error("Connect() error = nil, want an error for an invalid URL")
	}
}

func TestMigrate_CreatesTheSchemaOnlyOnce(t *testing.T) {
	if testing.Short() {
		t.Skip("integration test")
	}
	pool := newDatabase(t, "migrate_once")
	logger := slog.New(slog.DiscardHandler)

	if err := Migrate(t.Context(), pool, logger); err != nil {
		t.Fatalf("first Migrate() error = %v", err)
	}
	applied := countAppliedMigrations(t, pool)
	if applied == 0 {
		t.Fatal("no migrations were applied")
	}

	if err := Migrate(t.Context(), pool, logger); err != nil {
		t.Fatalf("second Migrate() error = %v", err)
	}
	if got := countAppliedMigrations(t, pool); got != applied {
		t.Errorf("applied migrations = %d after the second run, want %d", got, applied)
	}

	if err := pool.Ping(t.Context()); err != nil {
		t.Errorf("the pool stopped working after Migrate(): %v", err)
	}
}

func TestMigrate_IsSafeToRunFromSeveralInstances(t *testing.T) {
	if testing.Short() {
		t.Skip("integration test")
	}
	pool := newDatabase(t, "migrate_concurrent")
	logger := slog.New(slog.DiscardHandler)

	const instances = 3
	errs := make([]error, instances)

	var wg sync.WaitGroup
	for i := range instances {
		wg.Go(func() {
			errs[i] = Migrate(t.Context(), pool, logger)
		})
	}
	wg.Wait()

	for i, err := range errs {
		if err != nil {
			t.Errorf("instance %d: Migrate() error = %v", i, err)
		}
	}

	var tables int
	err := pool.QueryRow(t.Context(), `SELECT count(*) FROM information_schema.tables WHERE table_name = 'projects'`).Scan(&tables)
	if err != nil {
		t.Fatalf("count tables: %v", err)
	}
	if tables != 1 {
		t.Errorf("projects tables = %d, want 1", tables)
	}
}

func TestMigrate_FailsWhenTheDatabaseIsUnavailable(t *testing.T) {
	ctx, cancel := context.WithTimeout(t.Context(), 5*time.Second)
	defer cancel()

	pool, err := Connect(ctx, "postgres://user:password@127.0.0.1:1/db?sslmode=disable")
	if err != nil {
		t.Fatalf("Connect() error = %v", err)
	}
	defer pool.Close()

	if err := Migrate(ctx, pool, slog.New(slog.DiscardHandler)); err == nil {
		t.Error("Migrate() error = nil, want an error for an unreachable database")
	}
}
