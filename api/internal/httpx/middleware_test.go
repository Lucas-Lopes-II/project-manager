package httpx

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func newTestHandler(t *testing.T) (http.Handler, *bytes.Buffer) {
	t.Helper()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /ok", func(w http.ResponseWriter, r *http.Request) {
		WriteJSON(w, r, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.HandleFunc("GET /invalid", func(w http.ResponseWriter, r *http.Request) {
		WriteProblem(w, r, http.StatusUnprocessableEntity, "invalid", FieldError{Field: "name", Code: "min_words"})
	})
	mux.HandleFunc("GET /panic", func(http.ResponseWriter, *http.Request) {
		panic("secret internal detail")
	})

	var logs bytes.Buffer
	return NewHandler(mux, slog.New(slog.NewJSONHandler(&logs, nil))), &logs
}

func decodeProblem(t *testing.T, res *httptest.ResponseRecorder) Problem {
	t.Helper()

	if got := res.Header().Get("Content-Type"); got != "application/problem+json" {
		t.Errorf("Content-Type = %q, want application/problem+json", got)
	}
	var problem Problem
	if err := json.Unmarshal(res.Body.Bytes(), &problem); err != nil {
		t.Fatalf("body is not a Problem: %v, body: %q", err, res.Body.String())
	}
	return problem
}

func TestHandler_ErrorsUseTheProblemFormat(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		path       string
		wantStatus int
		wantTitle  string
	}{
		{"unknown route", http.MethodGet, "/unknown", http.StatusNotFound, "Not Found"},
		{"method not allowed", http.MethodPost, "/ok", http.StatusMethodNotAllowed, "Method Not Allowed"},
		{"panic", http.MethodGet, "/panic", http.StatusInternalServerError, "Internal Server Error"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler, _ := newTestHandler(t)
			res := httptest.NewRecorder()

			handler.ServeHTTP(res, httptest.NewRequest(tt.method, tt.path, nil))

			if res.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", res.Code, tt.wantStatus)
			}
			problem := decodeProblem(t, res)
			if problem.Status != tt.wantStatus || problem.Title != tt.wantTitle || problem.Type != "about:blank" {
				t.Errorf("problem = %+v", problem)
			}
			if problem.RequestID == "" || problem.RequestID != res.Header().Get("X-Request-ID") {
				t.Errorf("problem.RequestID = %q, header = %q", problem.RequestID, res.Header().Get("X-Request-ID"))
			}
		})
	}
}

func TestHandler_MethodNotAllowedKeepsAllowHeader(t *testing.T) {
	handler, _ := newTestHandler(t)
	res := httptest.NewRecorder()

	handler.ServeHTTP(res, httptest.NewRequest(http.MethodPost, "/ok", nil))

	if got := res.Header().Get("Allow"); !strings.Contains(got, http.MethodGet) {
		t.Errorf("Allow = %q, want it to contain GET", got)
	}
}

func TestHandler_ValidationErrorsListTheFields(t *testing.T) {
	handler, _ := newTestHandler(t)
	res := httptest.NewRecorder()

	handler.ServeHTTP(res, httptest.NewRequest(http.MethodGet, "/invalid", nil))

	problem := decodeProblem(t, res)
	if len(problem.Errors) != 1 || problem.Errors[0] != (FieldError{Field: "name", Code: "min_words"}) {
		t.Errorf("problem.Errors = %+v", problem.Errors)
	}
}

func TestHandler_PanicHidesDetailsFromClientAndLogsThem(t *testing.T) {
	handler, logs := newTestHandler(t)
	res := httptest.NewRecorder()

	handler.ServeHTTP(res, httptest.NewRequest(http.MethodGet, "/panic", nil))

	if strings.Contains(res.Body.String(), "secret internal detail") {
		t.Errorf("response exposes the panic value: %q", res.Body.String())
	}
	for _, want := range []string{"secret internal detail", `"stack"`, "goroutine"} {
		if !strings.Contains(logs.String(), want) {
			t.Errorf("logs do not contain %q: %s", want, logs.String())
		}
	}
}

func TestHandler_LogsEachRequest(t *testing.T) {
	tests := []struct {
		name       string
		path       string
		wantStatus float64
	}{
		{"matched route", "/ok", http.StatusOK},
		{"unknown route", "/unknown", http.StatusNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler, logs := newTestHandler(t)
			res := httptest.NewRecorder()

			handler.ServeHTTP(res, httptest.NewRequest(http.MethodGet, tt.path, nil))

			var entry map[string]any
			if err := json.Unmarshal(logs.Bytes(), &entry); err != nil {
				t.Fatalf("log is not JSON: %v, log: %q", err, logs.String())
			}
			if entry["request_id"] != res.Header().Get("X-Request-ID") {
				t.Errorf("request_id = %v, header = %q", entry["request_id"], res.Header().Get("X-Request-ID"))
			}
			if entry["method"] != http.MethodGet || entry["path"] != tt.path || entry["status"] != tt.wantStatus {
				t.Errorf("log entry = %v", entry)
			}
			if _, ok := entry["duration_ms"]; !ok {
				t.Errorf("log entry has no duration_ms: %v", entry)
			}
		})
	}
}
