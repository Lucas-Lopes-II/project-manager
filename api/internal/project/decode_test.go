package project

import (
	"bytes"
	"log/slog"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	"github.com/Lucas-Lopes-II/project-manager/api/internal/httpx"
)

func validFormFields() map[string]string {
	return map[string]string{
		"name":       "Projeto Iridium",
		"client":     "Clicksign",
		"start_date": "2026-11-04",
		"end_date":   "2026-12-12",
	}
}

// newForm builds a multipart body. A nil cover leaves the file out of the form.
func newForm(t *testing.T, fields map[string]string, cover []byte) (*bytes.Buffer, string) {
	t.Helper()

	var body bytes.Buffer
	form := multipart.NewWriter(&body)
	for name, value := range fields {
		if err := form.WriteField(name, value); err != nil {
			t.Fatalf("write field: %v", err)
		}
	}
	if cover != nil {
		file, err := form.CreateFormFile("cover", "capa.png")
		if err != nil {
			t.Fatalf("create file: %v", err)
		}
		if _, err := file.Write(cover); err != nil {
			t.Fatalf("write file: %v", err)
		}
	}
	if err := form.Close(); err != nil {
		t.Fatalf("close form: %v", err)
	}
	return &body, form.FormDataContentType()
}

func serveForm(t *testing.T, store Store, body *bytes.Buffer, contentType string) *httptest.ResponseRecorder {
	t.Helper()
	return sendForm(t, store, http.MethodPost, basePath, body, contentType)
}

func sendForm(t *testing.T, store Store, method, path string, body *bytes.Buffer, contentType string) *httptest.ResponseRecorder {
	t.Helper()

	mux := http.NewServeMux()
	NewHandler(NewService(store), slog.New(slog.DiscardHandler)).Register(mux)

	req := httptest.NewRequest(method, path, body)
	req.Header.Set("Content-Type", contentType)
	res := httptest.NewRecorder()
	mux.ServeHTTP(res, req)
	return res
}

func TestHandler_CreateFromAForm(t *testing.T) {
	store := &fakeStore{}
	cover := testPNG(t)
	body, contentType := newForm(t, validFormFields(), cover)

	res := serveForm(t, store, body, contentType)

	if res.Code != http.StatusCreated {
		t.Fatalf("status = %d, want %d, body: %s", res.Code, http.StatusCreated, res.Body)
	}
	if store.created.Name != "Projeto Iridium" {
		t.Errorf("Name = %q", store.created.Name)
	}
	if store.created.Cover == nil || !bytes.Equal(store.created.Cover.Content, cover) {
		t.Errorf("Cover = %+v, want the file that was sent", store.created.Cover)
	}
}

func TestHandler_CreateFromAFormWithoutCover(t *testing.T) {
	store := &fakeStore{}
	body, contentType := newForm(t, validFormFields(), nil)

	res := serveForm(t, store, body, contentType)

	if res.Code != http.StatusCreated {
		t.Fatalf("status = %d, want %d, body: %s", res.Code, http.StatusCreated, res.Body)
	}
	if store.created.Cover != nil {
		t.Errorf("Cover = %+v, want nil", store.created.Cover)
	}
}

func TestHandler_FormReportsTheCoverWithTheOtherFields(t *testing.T) {
	fields := validFormFields()
	fields["name"] = "Iridium"
	body, contentType := newForm(t, fields, []byte("not an image"))

	res := serveForm(t, &fakeStore{}, body, contentType)

	if res.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusUnprocessableEntity)
	}
	want := []httpx.FieldError{
		{Field: "name", Code: CodeMinWords},
		{Field: "cover", Code: CodeInvalidImage},
	}
	if got := decodeProblem(t, res).Errors; !reflect.DeepEqual(got, want) {
		t.Errorf("errors = %+v, want %+v", got, want)
	}
}

func TestHandler_FormWithACoverAboveTheLimit(t *testing.T) {
	body, contentType := newForm(t, validFormFields(), make([]byte, maxCoverBytes+1))

	res := serveForm(t, &fakeStore{}, body, contentType)

	if res.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusUnprocessableEntity)
	}
	want := []httpx.FieldError{{Field: "cover", Code: CodeMaxSize}}
	if got := decodeProblem(t, res).Errors; !reflect.DeepEqual(got, want) {
		t.Errorf("errors = %+v, want %+v", got, want)
	}
}

func TestHandler_FormAboveTheBodyLimit(t *testing.T) {
	store := &fakeStore{}
	body, contentType := newForm(t, validFormFields(), make([]byte, maxFormBytes+1))

	res := serveForm(t, store, body, contentType)

	if res.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusRequestEntityTooLarge)
	}
	decodeProblem(t, res)
}

func TestHandler_RejectsAMalformedForm(t *testing.T) {
	tests := []struct {
		name        string
		contentType string
	}{
		{name: "without a boundary", contentType: "multipart/form-data"},
		{name: "with another boundary", contentType: "multipart/form-data; boundary=other"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			res := serveForm(t, &fakeStore{}, bytes.NewBufferString("not a form"), tt.contentType)

			if res.Code != http.StatusBadRequest {
				t.Errorf("status = %d, want %d", res.Code, http.StatusBadRequest)
			}
			decodeProblem(t, res)
		})
	}
}

func TestHandler_JSONCannotSendACover(t *testing.T) {
	store := &fakeStore{}
	body := strings.Replace(validBody, `{`, `{"cover":"aW1hZ2U=","Cover":"aW1hZ2U=",`, 1)

	res, _ := serveProjects(t, store, http.MethodPost, basePath, body)

	if res.Code != http.StatusCreated {
		t.Fatalf("status = %d, body: %s", res.Code, res.Body)
	}
	if store.created.Cover != nil {
		t.Errorf("Cover = %+v, want nil", store.created.Cover)
	}
}

func TestHandler_Cover(t *testing.T) {
	store := &fakeStore{cover: StoredCover{
		Cover:   Cover{Content: []byte("image"), ContentType: "image/png"},
		Version: "123",
	}}

	tests := []struct {
		name  string
		path  string
		cache string
	}{
		{name: "current version", path: coverPath(validID) + "?v=123", cache: "public, max-age=31536000, immutable"},
		{name: "old version", path: coverPath(validID) + "?v=122", cache: "no-cache"},
		{name: "no version", path: coverPath(validID), cache: "no-cache"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			res, _ := serveProjects(t, store, http.MethodGet, tt.path, "")

			if res.Code != http.StatusOK || res.Body.String() != "image" {
				t.Fatalf("status = %d, body = %q", res.Code, res.Body)
			}
			for header, want := range map[string]string{
				"Cache-Control":          tt.cache,
				"Content-Type":           "image/png",
				"Content-Length":         "5",
				"X-Content-Type-Options": "nosniff",
			} {
				if got := res.Header().Get(header); got != want {
					t.Errorf("%s = %q, want %q", header, got, want)
				}
			}
		})
	}
}

func TestHandler_CoverNotFound(t *testing.T) {
	tests := []struct {
		name string
		id   string
	}{
		{name: "project without cover", id: validID},
		{name: "malformed id", id: "abc"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			res, _ := serveProjects(t, &fakeStore{err: ErrCoverNotFound}, http.MethodGet, coverPath(tt.id), "")

			if res.Code != http.StatusNotFound {
				t.Errorf("status = %d, want %d", res.Code, http.StatusNotFound)
			}
			if got := decodeProblem(t, res).Detail; got != "Capa não encontrada." {
				t.Errorf("detail = %q", got)
			}
		})
	}
}

func TestHandler_UpdateFromAForm(t *testing.T) {
	path := basePath + "/" + validID
	cover := testPNG(t)

	tests := []struct {
		name        string
		removeCover string
		file        []byte
		wantFile    bool
		wantRemove  bool
	}{
		{name: "keeps the cover without a file"},
		{name: "replaces the cover", file: cover, wantFile: true},
		{name: "removes the cover", removeCover: "true", wantRemove: true},
		{name: "ignores other values", removeCover: "1"},
		{name: "prefers the file", removeCover: "true", file: cover, wantFile: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fields := validFormFields()
			if tt.removeCover != "" {
				fields["remove_cover"] = tt.removeCover
			}
			body, contentType := newForm(t, fields, tt.file)
			store := &fakeStore{}

			res := sendForm(t, store, http.MethodPut, path, body, contentType)

			if res.Code != http.StatusOK {
				t.Fatalf("status = %d, body: %s", res.Code, res.Body)
			}
			if got := store.updated.Cover != nil; got != tt.wantFile {
				t.Errorf("has a new cover = %v, want %v", got, tt.wantFile)
			}
			if store.updated.RemoveCover != tt.wantRemove {
				t.Errorf("RemoveCover = %v, want %v", store.updated.RemoveCover, tt.wantRemove)
			}
		})
	}
}

func TestHandler_UpdateFromJSONKeepsTheCover(t *testing.T) {
	store := &fakeStore{}
	body := strings.Replace(validBody, `{`, `{"remove_cover":true,`, 1)

	res, _ := serveProjects(t, store, http.MethodPut, basePath+"/"+validID, body)

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, body: %s", res.Code, res.Body)
	}
	if store.updated.Cover != nil || store.updated.RemoveCover {
		t.Errorf("Fields = %+v, want the cover untouched", store.updated)
	}
}

func TestHandler_UpdateRejectsAnInvalidCover(t *testing.T) {
	body, contentType := newForm(t, validFormFields(), []byte("not an image"))

	res := sendForm(t, &fakeStore{}, http.MethodPut, basePath+"/"+validID, body, contentType)

	if res.Code != http.StatusUnprocessableEntity {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusUnprocessableEntity)
	}
	want := []httpx.FieldError{{Field: "cover", Code: CodeInvalidImage}}
	if got := decodeProblem(t, res).Errors; !reflect.DeepEqual(got, want) {
		t.Errorf("errors = %+v, want %+v", got, want)
	}
}
