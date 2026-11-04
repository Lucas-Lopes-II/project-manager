package database

import (
	"context"
	"flag"
	"log"
	"os"
	"testing"
	"time"

	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
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
	ctx := context.Background()

	container, err := postgres.Run(ctx, "postgres:17-alpine", postgres.BasicWaitStrategies())
	if err != nil {
		log.Printf("start postgres container: %v", err)
		return 1
	}
	defer func() {
		if err := testcontainers.TerminateContainer(container); err != nil {
			log.Printf("terminate postgres container: %v", err)
		}
	}()

	testDatabaseURL, err = container.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		log.Printf("read connection string: %v", err)
		return 1
	}

	return m.Run()
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
