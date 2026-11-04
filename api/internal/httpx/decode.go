package httpx

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
)

const maxBodyBytes = 1 << 20

// DecodeJSON reads a single JSON value from the request body into dst. When it
// fails, it writes the error response and returns false.
func DecodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxBodyBytes))

	err := decoder.Decode(dst)
	if err == nil {
		err = decoder.Decode(&struct{}{})
		if errors.Is(err, io.EOF) {
			return true
		}
	}

	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) {
		WriteProblem(w, r, http.StatusRequestEntityTooLarge, "O corpo da requisição excede o tamanho permitido.")
		return false
	}

	WriteProblem(w, r, http.StatusBadRequest, "O corpo da requisição não é um JSON válido.")
	return false
}
