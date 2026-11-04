package httpx

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestDecodeJSON(t *testing.T) {
	tests := []struct {
		name       string
		body       string
		wantOK     bool
		wantStatus int
	}{
		{name: "valid value", body: `{"name":"Iridium"}`, wantOK: true},
		{name: "invalid JSON", body: `{"name":`, wantStatus: http.StatusBadRequest},
		{name: "empty body", body: ``, wantStatus: http.StatusBadRequest},
		{name: "wrong type", body: `{"name":1}`, wantStatus: http.StatusBadRequest},
		{name: "two values", body: `{} {}`, wantStatus: http.StatusBadRequest},
		{name: "body above the limit", body: `{"name":"` + strings.Repeat("a", maxBodyBytes) + `"}`, wantStatus: http.StatusRequestEntityTooLarge},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var dst struct {
				Name string `json:"name"`
			}
			res := httptest.NewRecorder()

			ok := DecodeJSON(res, httptest.NewRequest(http.MethodPost, "/", strings.NewReader(tt.body)), &dst)

			if ok != tt.wantOK {
				t.Fatalf("DecodeJSON() = %v, want %v", ok, tt.wantOK)
			}
			if tt.wantOK {
				if dst.Name != "Iridium" {
					t.Errorf("Name = %q", dst.Name)
				}
				return
			}
			if res.Code != tt.wantStatus {
				t.Errorf("status = %d, want %d", res.Code, tt.wantStatus)
			}
			if got := res.Header().Get("Content-Type"); got != "application/problem+json" {
				t.Errorf("Content-Type = %q", got)
			}
		})
	}
}
