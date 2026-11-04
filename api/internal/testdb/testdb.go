// Package testdb starts a PostgreSQL container for integration tests.
package testdb

import (
	"context"
	"fmt"
	"log"

	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
)

// image is the same one used by compose.yaml.
const image = "postgres:17-alpine"

// Start runs a container and returns its connection URL and a function that
// removes it.
func Start(ctx context.Context) (url string, terminate func(), err error) {
	container, err := postgres.Run(ctx, image, postgres.BasicWaitStrategies())
	if err != nil {
		return "", nil, fmt.Errorf("start postgres container: %w", err)
	}

	terminate = func() {
		if err := testcontainers.TerminateContainer(container); err != nil {
			log.Printf("terminate postgres container: %v", err)
		}
	}

	url, err = container.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		terminate()
		return "", nil, fmt.Errorf("read connection string: %w", err)
	}

	return url, terminate, nil
}
