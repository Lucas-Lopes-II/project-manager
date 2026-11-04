package health

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHealth(t *testing.T) {
	mux := http.NewServeMux()
	Register(mux)
	res := httptest.NewRecorder()

	mux.ServeHTTP(res, httptest.NewRequest(http.MethodGet, "/health", nil))

	if res.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", res.Code, http.StatusOK)
	}
	if got := strings.TrimSpace(res.Body.String()); got != `{"status":"ok"}` {
		t.Errorf("body = %q", got)
	}
}
