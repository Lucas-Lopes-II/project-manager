// Package config loads the API configuration from environment variables.
package config

import (
	"fmt"
	"strings"
)

const defaultPort = "8080"

// Config holds the values the API needs to start.
type Config struct {
	Port        string
	DatabaseURL string
}

// Load builds a Config using getenv, usually os.Getenv. It fails when a
// required variable is missing, so the API never starts half configured.
func Load(getenv func(string) string) (Config, error) {
	cfg := Config{
		Port:        getenv("PORT"),
		DatabaseURL: getenv("DATABASE_URL"),
	}

	if cfg.Port == "" {
		cfg.Port = defaultPort
	}

	var missing []string
	if cfg.DatabaseURL == "" {
		missing = append(missing, "DATABASE_URL")
	}
	if len(missing) > 0 {
		return Config{}, fmt.Errorf("missing required environment variables: %s", strings.Join(missing, ", "))
	}

	return cfg, nil
}
