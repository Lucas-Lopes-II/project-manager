package project

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	"github.com/Lucas-Lopes-II/project-manager/api/internal/httpx"
)

const (
	validBody = `{"name":"Projeto Iridium","client":"Clicksign","start_date":"2026-11-04","end_date":"2026-12-12"}`
	validID   = "61705246-aacf-4373-875a-08f4dd31428c"
)

// fakeStore records the calls and answers with err when it is set.
type fakeStore struct {
	projects []Project
	cover    StoredCover
	created  Fields
	updated  Fields
	filter   ListFilter
	total    int
	favorite *bool
	err      error
}

func (f *fakeStore) Create(_ context.Context, fields Fields) (Project, error) {
	f.created = fields
	return f.result(fields)
}

func (f *fakeStore) List(_ context.Context, filter ListFilter) ([]Project, error) {
	f.filter = filter
	return f.projects, f.err
}

func (f *fakeStore) Count(context.Context) (int, error) {
	return f.total, f.err
}

func (f *fakeStore) SetFavorite(_ context.Context, _ string, favorite bool) error {
	f.favorite = &favorite
	return f.err
}

func (f *fakeStore) Get(context.Context, string) (Project, error) {
	return Project{ID: validID}, f.err
}

func (f *fakeStore) GetCover(context.Context, string) (StoredCover, error) {
	return f.cover, f.err
}

func (f *fakeStore) Update(_ context.Context, _ string, fields Fields) (Project, error) {
	f.updated = fields
	return f.result(fields)
}

func (f *fakeStore) Delete(context.Context, string) error {
	return f.err
}

func (f *fakeStore) result(fields Fields) (Project, error) {
	if f.err != nil {
		return Project{}, f.err
	}
	return Project{
		ID:        validID,
		Name:      fields.Name,
		Client:    fields.Client,
		StartDate: fields.StartDate,
		EndDate:   fields.EndDate,
	}, nil
}

func serveProjects(t *testing.T, store Store, method, path, body string) (*httptest.ResponseRecorder, *bytes.Buffer) {
	t.Helper()

	var logs bytes.Buffer
	mux := http.NewServeMux()
	NewHandler(NewService(store), slog.New(slog.NewJSONHandler(&logs, nil))).Register(mux)

	res := httptest.NewRecorder()
	mux.ServeHTTP(res, httptest.NewRequest(method, path, strings.NewReader(body)))
	return res, &logs
}

func decodeProblem(t *testing.T, res *httptest.ResponseRecorder) httpx.Problem {
	t.Helper()

	if got := res.Header().Get("Content-Type"); got != "application/problem+json" {
		t.Errorf("Content-Type = %q, want application/problem+json", got)
	}
	var problem httpx.Problem
	if err := json.Unmarshal(res.Body.Bytes(), &problem); err != nil {
		t.Fatalf("body is not a Problem: %v, body: %q", err, res.Body.String())
	}
	return problem
}

func TestHandler_Create(t *testing.T) {
	res, _ := serveProjects(t, &fakeStore{}, http.MethodPost, basePath, validBody)

	if res.Code != http.StatusCreated {
		t.Fatalf("status = %d, want %d, body: %s", res.Code, http.StatusCreated, res.Body)
	}
	if got, want := res.Header().Get("Location"), basePath+"/"+validID; got != want {
		t.Errorf("Location = %q, want %q", got, want)
	}

	var body map[string]any
	if err := json.Unmarshal(res.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if body["start_date"] != "2026-11-04" || body["end_date"] != "2026-12-12" {
		t.Errorf("dates in the body = %v, %v", body["start_date"], body["end_date"])
	}
}

func TestHandler_ValidationErrorsListEveryField(t *testing.T) {
	requests := map[string]struct{ method, path string }{
		"create": {http.MethodPost, basePath},
		"update": {http.MethodPut, basePath + "/" + validID},
	}

	for name, request := range requests {
		t.Run(name, func(t *testing.T) {
			res, _ := serveProjects(t, &fakeStore{}, request.method, request.path, `{"name":"Iridium"}`)

			if res.Code != http.StatusUnprocessableEntity {
				t.Fatalf("status = %d, want %d", res.Code, http.StatusUnprocessableEntity)
			}
			want := []httpx.FieldError{
				{Field: "name", Code: CodeMinWords},
				{Field: "client", Code: CodeMinWords},
				{Field: "start_date", Code: CodeInvalidDate},
				{Field: "end_date", Code: CodeInvalidDate},
			}
			if got := decodeProblem(t, res).Errors; !reflect.DeepEqual(got, want) {
				t.Errorf("Errors = %+v, want %+v", got, want)
			}
		})
	}
}

func TestHandler_RejectsAMalformedBody(t *testing.T) {
	tests := []struct {
		name string
		body string
	}{
		{"invalid JSON", `{"name":`},
		{"wrong field type", `{"name":123}`},
		{"more than one JSON value", validBody + validBody},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			res, _ := serveProjects(t, &fakeStore{}, http.MethodPost, basePath, tt.body)

			if res.Code != http.StatusBadRequest {
				t.Errorf("status = %d, want %d", res.Code, http.StatusBadRequest)
			}
			decodeProblem(t, res)
		})
	}
}

func TestHandler_RejectsAnOversizedBody(t *testing.T) {
	body := `{"name":"` + strings.Repeat("a", 1<<20) + `"}`

	res, _ := serveProjects(t, &fakeStore{}, http.MethodPost, basePath, body)

	if res.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("status = %d, want %d", res.Code, http.StatusRequestEntityTooLarge)
	}
	decodeProblem(t, res)
}

func TestHandler_List(t *testing.T) {
	store := &fakeStore{projects: []Project{{ID: validID, Name: "Projeto Iridium"}}}

	res, _ := serveProjects(t, store, http.MethodGet, basePath, "")

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusOK)
	}
	var list struct {
		Items []map[string]any `json:"items"`
		Total int              `json:"total"`
	}
	if err := json.Unmarshal(res.Body.Bytes(), &list); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if len(list.Items) != 1 || list.Total != 1 || list.Items[0]["id"] != validID {
		t.Errorf("list = %+v", list)
	}
}

func TestHandler_Get(t *testing.T) {
	res, _ := serveProjects(t, &fakeStore{}, http.MethodGet, basePath+"/"+validID, "")

	if res.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", res.Code, http.StatusOK)
	}
}

func TestHandler_Update(t *testing.T) {
	res, _ := serveProjects(t, &fakeStore{}, http.MethodPut, basePath+"/"+validID, validBody)

	if res.Code != http.StatusOK {
		t.Errorf("status = %d, want %d, body: %s", res.Code, http.StatusOK, res.Body)
	}
}

func TestHandler_Delete(t *testing.T) {
	res, _ := serveProjects(t, &fakeStore{}, http.MethodDelete, basePath+"/"+validID, "")

	if res.Code != http.StatusNoContent {
		t.Errorf("status = %d, want %d", res.Code, http.StatusNoContent)
	}
	if res.Body.Len() != 0 {
		t.Errorf("body = %q, want it empty", res.Body)
	}
}

func TestHandler_NotFound(t *testing.T) {
	ids := map[string]string{
		"unknown ID":   validID,
		"malformed ID": "not-a-uuid",
	}
	requests := []struct {
		method string
		body   string
	}{
		{http.MethodGet, ""},
		{http.MethodPut, validBody},
		{http.MethodDelete, ""},
	}

	for name, id := range ids {
		for _, request := range requests {
			t.Run(name+" "+request.method, func(t *testing.T) {
				store := &fakeStore{err: ErrNotFound}

				res, _ := serveProjects(t, store, request.method, basePath+"/"+id, request.body)

				if res.Code != http.StatusNotFound {
					t.Errorf("status = %d, want %d", res.Code, http.StatusNotFound)
				}
				decodeProblem(t, res)
			})
		}
	}
}

func TestHandler_UnexpectedErrorsHideDetailsFromTheClient(t *testing.T) {
	store := &fakeStore{err: errors.New("secret connection detail")}

	res, logs := serveProjects(t, store, http.MethodGet, basePath, "")

	if res.Code != http.StatusInternalServerError {
		t.Errorf("status = %d, want %d", res.Code, http.StatusInternalServerError)
	}
	if strings.Contains(res.Body.String(), "secret connection detail") {
		t.Errorf("response exposes the error: %q", res.Body)
	}
	if !strings.Contains(logs.String(), "secret connection detail") {
		t.Errorf("logs do not contain the error: %s", logs)
	}
}
