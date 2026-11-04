// Package health exposes the endpoints used to check the API state.
package health

import (
	"net/http"

	"github.com/Lucas-Lopes-II/project-manager/api/internal/httpx"
)

type response struct {
	Status string `json:"status"`
}

// Register adds the health routes to mux.
func Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		httpx.WriteJSON(w, r, http.StatusOK, response{Status: "ok"})
	})
}
