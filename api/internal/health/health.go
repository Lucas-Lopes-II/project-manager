// Package health exposes the endpoints used to check the API state.
package health

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/Lucas-Lopes-II/project-manager/api/internal/httpx"
)

const readyTimeout = 3 * time.Second

// Pinger reports whether a dependency can be reached.
type Pinger interface {
	Ping(ctx context.Context) error
}

type response struct {
	Status string `json:"status"`
}

// Register adds the health routes to mux. /health only says the process is
// running, while /ready also checks the database.
func Register(mux *http.ServeMux, db Pinger, log *slog.Logger) {
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		httpx.WriteJSON(w, r, http.StatusOK, response{Status: "ok"})
	})

	mux.HandleFunc("GET /ready", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), readyTimeout)
		defer cancel()

		if err := db.Ping(ctx); err != nil {
			log.ErrorContext(ctx, "readiness check failed", "request_id", httpx.RequestID(ctx), "error", err)
			httpx.WriteProblem(w, r, http.StatusServiceUnavailable, "O banco de dados não está disponível.")
			return
		}

		httpx.WriteJSON(w, r, http.StatusOK, response{Status: "ready"})
	})
}
