package httpx

import (
	"context"
	"io"
	"log/slog"
	"net"
	"net/http"
	"testing"
	"time"
)

func TestServe_FinishesRequestsInProgressBeforeReturning(t *testing.T) {
	started := make(chan struct{})
	release := make(chan struct{})

	mux := http.NewServeMux()
	mux.HandleFunc("GET /slow", func(w http.ResponseWriter, r *http.Request) {
		close(started)
		<-release
		w.WriteHeader(http.StatusNoContent)
	})

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	serveDone := make(chan error, 1)
	go func() {
		serveDone <- Serve(ctx, &http.Server{Handler: mux}, listener, slog.New(slog.DiscardHandler))
	}()

	status := make(chan int, 1)
	go func() {
		res, err := http.Get("http://" + listener.Addr().String() + "/slow")
		if err != nil {
			status <- 0
			return
		}
		defer res.Body.Close()
		_, _ = io.Copy(io.Discard, res.Body)
		status <- res.StatusCode
	}()

	<-started
	cancel()

	select {
	case err := <-serveDone:
		t.Fatalf("Serve returned before the request finished: %v", err)
	case <-time.After(100 * time.Millisecond):
	}

	close(release)

	if got := <-status; got != http.StatusNoContent {
		t.Errorf("status = %d, want %d", got, http.StatusNoContent)
	}
	if err := <-serveDone; err != nil {
		t.Errorf("Serve() error = %v", err)
	}
}

func TestServe_ReturnsListenerErrors(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	listener.Close()

	err = Serve(context.Background(), &http.Server{}, listener, slog.New(slog.DiscardHandler))

	if err == nil {
		t.Error("Serve() error = nil, want the listener error")
	}
}
