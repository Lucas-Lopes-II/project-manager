package project

import (
	"errors"
	"io"
	"mime"
	"net/http"

	"github.com/Lucas-Lopes-II/project-manager/api/internal/httpx"
)

// maxFormBytes leaves room for the text fields and the boundaries of the form.
// A file above maxCoverBytes that still fits here becomes a field error.
const maxFormBytes = maxCoverBytes + 1<<16

// decodeInput reads the project from a JSON body or from a multipart form. When
// it fails, it writes the error response and returns false.
func decodeInput(w http.ResponseWriter, r *http.Request) (Input, bool) {
	mediaType, _, _ := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if mediaType == "multipart/form-data" {
		return decodeForm(w, r)
	}

	var input Input
	ok := httpx.DecodeJSON(w, r, &input)
	return input, ok
}

func decodeForm(w http.ResponseWriter, r *http.Request) (Input, bool) {
	r.Body = http.MaxBytesReader(w, r.Body, maxFormBytes)

	// The memory limit covers the whole body, so no temporary file is created.
	if err := r.ParseMultipartForm(maxFormBytes); err != nil {
		writeFormError(w, r, err)
		return Input{}, false
	}
	defer func() { _ = r.MultipartForm.RemoveAll() }()

	input := Input{
		Name:        r.PostFormValue("name"),
		Client:      r.PostFormValue("client"),
		StartDate:   r.PostFormValue("start_date"),
		EndDate:     r.PostFormValue("end_date"),
		RemoveCover: r.PostFormValue("remove_cover") == "true",
	}

	file, _, err := r.FormFile("cover")
	if errors.Is(err, http.ErrMissingFile) {
		return input, true
	}
	if err != nil {
		writeFormError(w, r, err)
		return Input{}, false
	}
	defer func() { _ = file.Close() }()

	input.Cover, err = io.ReadAll(file)
	if err != nil {
		writeFormError(w, r, err)
		return Input{}, false
	}
	return input, true
}

func writeFormError(w http.ResponseWriter, r *http.Request, err error) {
	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) {
		httpx.WriteProblem(w, r, http.StatusRequestEntityTooLarge, "O corpo da requisição excede o tamanho permitido.")
		return
	}
	httpx.WriteProblem(w, r, http.StatusBadRequest, "O corpo da requisição não é um formulário válido.")
}
