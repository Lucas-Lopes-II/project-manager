// Package httpx holds the HTTP building blocks shared by the API features.
package httpx

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

// Problem is an error response in the RFC 9457 format.
type Problem struct {
	Type      string       `json:"type"`
	Title     string       `json:"title"`
	Status    int          `json:"status"`
	Detail    string       `json:"detail,omitempty"`
	Code      string       `json:"code,omitempty"`
	RequestID string       `json:"request_id,omitempty"`
	Errors    []FieldError `json:"errors,omitempty"`
}

// FieldError points to an invalid field. The client turns Code into the text
// shown to the user.
type FieldError struct {
	Field string `json:"field"`
	Code  string `json:"code"`
}

// WriteProblem writes an error response for the given status.
func WriteProblem(w http.ResponseWriter, r *http.Request, status int, detail string, fieldErrors ...FieldError) {
	write(w, r, "application/problem+json", status, Problem{
		Type:      "about:blank",
		Title:     http.StatusText(status),
		Status:    status,
		Detail:    detail,
		RequestID: RequestID(r.Context()),
		Errors:    fieldErrors,
	})
}

// WriteCodedProblem writes an error response that is not about a single field.
// The client turns code into the text shown to the user.
func WriteCodedProblem(w http.ResponseWriter, r *http.Request, status int, code, detail string) {
	write(w, r, "application/problem+json", status, Problem{
		Type:      "about:blank",
		Title:     http.StatusText(status),
		Status:    status,
		Detail:    detail,
		Code:      code,
		RequestID: RequestID(r.Context()),
	})
}

// WriteJSON writes a successful JSON response.
func WriteJSON(w http.ResponseWriter, r *http.Request, status int, body any) {
	write(w, r, "application/json", status, body)
}

func write(w http.ResponseWriter, r *http.Request, contentType string, status int, body any) {
	w.Header().Set("Content-Type", contentType)
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		slog.ErrorContext(r.Context(), "write response", "error", err)
	}
}
