package httpx

import (
	"context"
	"crypto/rand"
	"errors"
	"log/slog"
	"net/http"
	"runtime/debug"
	"time"
)

type requestIDKey struct{}

// RequestID returns the ID of the current request, or an empty string when
// the request did not go through NewHandler.
func RequestID(ctx context.Context) string {
	id, _ := ctx.Value(requestIDKey{}).(string)
	return id
}

// NewHandler wraps mux with the middlewares used by every route. Requests
// that match no route also go through them, so they are logged and answered
// in the Problem format.
func NewHandler(mux *http.ServeMux, log *slog.Logger) http.Handler {
	return withRequestID(withLogging(log, withRecover(log, withProblemErrors(mux))))
}

func withRequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := rand.Text()
		w.Header().Set("X-Request-ID", id)
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), requestIDKey{}, id)))
	})
}

func withLogging(log *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w}

		next.ServeHTTP(rec, r)

		log.InfoContext(r.Context(), "request",
			"request_id", RequestID(r.Context()),
			"method", r.Method,
			"path", r.URL.Path,
			"status", rec.status,
			"duration_ms", time.Since(start).Milliseconds(),
		)
	})
}

func withRecover(log *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rec := &statusRecorder{ResponseWriter: w}

		defer func() {
			v := recover()
			if v == nil {
				return
			}
			// net/http uses this value to abort a response on purpose.
			if err, ok := v.(error); ok && errors.Is(err, http.ErrAbortHandler) {
				panic(v)
			}

			log.ErrorContext(r.Context(), "panic",
				"request_id", RequestID(r.Context()),
				"panic", v,
				"stack", string(debug.Stack()),
			)
			if rec.status == 0 {
				WriteProblem(rec, r, http.StatusInternalServerError, "")
			}
		}()

		next.ServeHTTP(rec, r)
	})
}

// withProblemErrors converts the plain text 404 and 405 written by ServeMux.
// Requests that match a route are not touched.
func withProblemErrors(mux *http.ServeMux) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, pattern := mux.Handler(r); pattern == "" {
			w = &problemWriter{ResponseWriter: w, request: r}
		}
		mux.ServeHTTP(w, r)
	})
}

type problemWriter struct {
	http.ResponseWriter
	request *http.Request
}

func (p *problemWriter) WriteHeader(status int) {
	WriteProblem(p.ResponseWriter, p.request, status, "")
}

// Write discards the plain text body, already replaced by the Problem.
func (p *problemWriter) Write(b []byte) (int, error) {
	return len(b), nil
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (s *statusRecorder) WriteHeader(status int) {
	if s.status == 0 {
		s.status = status
	}
	s.ResponseWriter.WriteHeader(status)
}

func (s *statusRecorder) Write(b []byte) (int, error) {
	if s.status == 0 {
		s.status = http.StatusOK
	}
	return s.ResponseWriter.Write(b)
}

func (s *statusRecorder) Unwrap() http.ResponseWriter {
	return s.ResponseWriter
}
