package health

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Lucas-Lopes-II/project-manager/api/internal/httpx"
)

type fakePinger struct {
	err error
}

func (f fakePinger) Ping(context.Context) error {
	return f.err
}

func serve(t *testing.T, path string, db Pinger) (*httptest.ResponseRecorder, *bytes.Buffer) {
	t.Helper()

	var logs bytes.Buffer
	mux := http.NewServeMux()
	Register(mux, db, slog.New(slog.NewJSONHandler(&logs, nil)))

	res := httptest.NewRecorder()
	mux.ServeHTTP(res, httptest.NewRequest(http.MethodGet, path, nil))
	return res, &logs
}

func TestHealth_DoesNotDependOnTheDatabase(t *testing.T) {
	res, _ := serve(t, "/health", fakePinger{err: errors.New("database down")})

	if res.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", res.Code, http.StatusOK)
	}
	if got := strings.TrimSpace(res.Body.String()); got != `{"status":"ok"}` {
		t.Errorf("body = %q", got)
	}
}

func TestReady_WithTheDatabaseAvailable(t *testing.T) {
	res, _ := serve(t, "/ready", fakePinger{})

	if res.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", res.Code, http.StatusOK)
	}
	if got := strings.TrimSpace(res.Body.String()); got != `{"status":"ready"}` {
		t.Errorf("body = %q", got)
	}
}

func TestReady_WithTheDatabaseUnavailable(t *testing.T) {
	res, logs := serve(t, "/ready", fakePinger{err: errors.New("secret connection detail")})

	if res.Code != http.StatusServiceUnavailable {
		t.Errorf("status = %d, want %d", res.Code, http.StatusServiceUnavailable)
	}
	if got := res.Header().Get("Content-Type"); got != "application/problem+json" {
		t.Errorf("Content-Type = %q, want application/problem+json", got)
	}

	var problem httpx.Problem
	if err := json.Unmarshal(res.Body.Bytes(), &problem); err != nil {
		t.Fatalf("body is not a Problem: %v, body: %q", err, res.Body.String())
	}
	if problem.Status != http.StatusServiceUnavailable {
		t.Errorf("problem.Status = %d", problem.Status)
	}
	if strings.Contains(res.Body.String(), "secret connection detail") {
		t.Errorf("response exposes the error: %q", res.Body.String())
	}
	if !strings.Contains(logs.String(), "secret connection detail") {
		t.Errorf("logs do not contain the error: %s", logs.String())
	}
}
