package httpx

import (
	"context"
	"log/slog"
	"net"
	"net/http"
	"time"
)

// shutdownTimeout stays below the 10 seconds Cloud Run waits after SIGTERM.
const shutdownTimeout = 8 * time.Second

// Serve runs srv on listener until ctx is canceled, then lets the requests in
// progress finish before returning.
func Serve(ctx context.Context, srv *http.Server, listener net.Listener, log *slog.Logger) error {
	serveErr := make(chan error, 1)
	go func() {
		log.Info("server listening", "addr", listener.Addr().String())
		serveErr <- srv.Serve(listener)
	}()

	select {
	case err := <-serveErr:
		return err
	case <-ctx.Done():
	}

	log.Info("server shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()

	return srv.Shutdown(shutdownCtx)
}
