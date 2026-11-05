package project

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Lucas-Lopes-II/project-manager/api/internal/httpx"
)

// call sends a request and decodes the JSON response into a map.
func call(t *testing.T, server *httptest.Server, method, path, body string) (int, http.Header, map[string]any) {
	t.Helper()

	req, err := http.NewRequestWithContext(t.Context(), method, server.URL+path, strings.NewReader(body))
	if err != nil {
		t.Fatalf("create request: %v", err)
	}
	res, err := server.Client().Do(req)
	if err != nil {
		t.Fatalf("send request: %v", err)
	}
	defer res.Body.Close()

	raw, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatalf("read response: %v", err)
	}

	var decoded map[string]any
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &decoded); err != nil {
			t.Fatalf("decode response: %v, body: %q", err, raw)
		}
	}
	return res.StatusCode, res.Header, decoded
}

func TestAPI_ProjectLifecycle(t *testing.T) {
	pool := emptyDatabase(t)

	logger := slog.New(slog.DiscardHandler)
	mux := http.NewServeMux()
	NewHandler(NewService(NewRepository(pool)), logger).Register(mux)
	server := httptest.NewServer(httpx.NewHandler(mux, logger))
	defer server.Close()

	status, _, list := call(t, server, http.MethodGet, basePath, "")
	if status != http.StatusOK || list["total"] != float64(0) {
		t.Fatalf("empty list: status = %d, body = %v", status, list)
	}
	if items, ok := list["items"].([]any); !ok || len(items) != 0 {
		t.Fatalf("empty list: items = %#v, want an empty array", list["items"])
	}

	status, headers, created := call(t, server, http.MethodPost, basePath, `{
		"name": "  Projeto   Iridium ",
		"client": "Clicksign",
		"start_date": "2026-11-04",
		"end_date": "2026-12-12"
	}`)
	if status != http.StatusCreated {
		t.Fatalf("create: status = %d, body = %v", status, created)
	}
	location := headers.Get("Location")
	if location != basePath+"/"+created["id"].(string) {
		t.Errorf("Location = %q, id = %v", location, created["id"])
	}
	if created["name"] != "Projeto Iridium" {
		t.Errorf("name = %v, want it normalized", created["name"])
	}

	status, _, got := call(t, server, http.MethodGet, location, "")
	if status != http.StatusOK {
		t.Fatalf("get: status = %d, body = %v", status, got)
	}
	if got["start_date"] != "2026-11-04" || got["end_date"] != "2026-12-12" {
		t.Errorf("dates = %v, %v, want them unchanged", got["start_date"], got["end_date"])
	}

	status, _, updated := call(t, server, http.MethodPut, location, `{
		"name": "Projeto Atualizado",
		"client": "Outro Cliente",
		"start_date": "2027-01-01",
		"end_date": "2027-02-02"
	}`)
	if status != http.StatusOK || updated["name"] != "Projeto Atualizado" || updated["start_date"] != "2027-01-01" {
		t.Fatalf("update: status = %d, body = %v", status, updated)
	}

	status, _, list = call(t, server, http.MethodGet, basePath, "")
	if status != http.StatusOK || list["total"] != float64(1) {
		t.Fatalf("list: status = %d, body = %v", status, list)
	}

	status, _, _ = call(t, server, http.MethodDelete, location, "")
	if status != http.StatusNoContent {
		t.Fatalf("delete: status = %d", status)
	}

	status, _, problem := call(t, server, http.MethodDelete, location, "")
	if status != http.StatusNotFound || problem["request_id"] == "" {
		t.Errorf("second delete: status = %d, body = %v", status, problem)
	}

	status, _, _ = call(t, server, http.MethodGet, location, "")
	if status != http.StatusNotFound {
		t.Errorf("get after delete: status = %d", status)
	}
}

// sendToServer sends a form and decodes the JSON response into a map.
func sendToServer(t *testing.T, server *httptest.Server, method, path string, body io.Reader, contentType string) map[string]any {
	t.Helper()

	req, err := http.NewRequestWithContext(t.Context(), method, server.URL+path, body)
	if err != nil {
		t.Fatalf("create request: %v", err)
	}
	req.Header.Set("Content-Type", contentType)
	res, err := server.Client().Do(req)
	if err != nil {
		t.Fatalf("send request: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		t.Fatalf("%s %s: status = %d", method, path, res.StatusCode)
	}

	var decoded map[string]any
	if err := json.NewDecoder(res.Body).Decode(&decoded); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return decoded
}

func TestAPI_ProjectWithCover(t *testing.T) {
	pool := emptyDatabase(t)

	logger := slog.New(slog.DiscardHandler)
	mux := http.NewServeMux()
	NewHandler(NewService(NewRepository(pool)), logger).Register(mux)
	server := httptest.NewServer(httpx.NewHandler(mux, logger))
	defer server.Close()

	image := testPNG(t)
	body, contentType := newForm(t, validFormFields(), image)
	res, err := server.Client().Post(server.URL+basePath, contentType, body)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusCreated {
		t.Fatalf("create: status = %d", res.StatusCode)
	}
	var created struct {
		ID       string  `json:"id"`
		CoverURL *string `json:"cover_url"`
	}
	if err := json.NewDecoder(res.Body).Decode(&created); err != nil {
		t.Fatalf("decode project: %v", err)
	}
	if created.CoverURL == nil {
		t.Fatal("cover_url = null, want the address of the image")
	}

	cover, err := server.Client().Get(server.URL + *created.CoverURL)
	if err != nil {
		t.Fatalf("get cover: %v", err)
	}
	defer cover.Body.Close()
	got, err := io.ReadAll(cover.Body)
	if err != nil {
		t.Fatalf("read cover: %v", err)
	}
	if cover.StatusCode != http.StatusOK || !bytes.Equal(got, image) {
		t.Errorf("cover: status = %d, %d bytes, want %d", cover.StatusCode, len(got), len(image))
	}
	if got := cover.Header.Get("Content-Type"); got != "image/png" {
		t.Errorf("Content-Type = %q", got)
	}

	// A JSON update keeps the cover.
	status, _, updated := call(t, server, http.MethodPut, basePath+"/"+created.ID, validBody)
	if status != http.StatusOK || updated["cover_url"] != *created.CoverURL {
		t.Errorf("JSON update: status = %d, cover_url = %v, want %q", status, updated["cover_url"], *created.CoverURL)
	}

	// A form replaces the cover and changes its address.
	replacement := testJPEG(t)
	body, contentType = newForm(t, validFormFields(), replacement)
	replaced := sendToServer(t, server, http.MethodPut, basePath+"/"+created.ID, body, contentType)
	if replaced["cover_url"] == nil || replaced["cover_url"] == *created.CoverURL {
		t.Errorf("replaced cover_url = %v, want a new address", replaced["cover_url"])
	}
	stale, err := server.Client().Get(server.URL + *created.CoverURL)
	if err != nil {
		t.Fatalf("get old address: %v", err)
	}
	defer stale.Body.Close()
	if got := stale.Header.Get("Cache-Control"); got != "no-cache" {
		t.Errorf("Cache-Control of the old address = %q, want no-cache", got)
	}
	if got := stale.Header.Get("Content-Type"); got != "image/jpeg" {
		t.Errorf("Content-Type of the old address = %q, want the new image", got)
	}

	// A form can also remove the cover.
	fields := validFormFields()
	fields["remove_cover"] = "true"
	body, contentType = newForm(t, fields, nil)
	removed := sendToServer(t, server, http.MethodPut, basePath+"/"+created.ID, body, contentType)
	if removed["cover_url"] != nil {
		t.Errorf("removed cover_url = %v, want null", removed["cover_url"])
	}
	status, _, _ = call(t, server, http.MethodGet, coverPath(created.ID), "")
	if status != http.StatusNotFound {
		t.Errorf("cover after removal: status = %d, want 404", status)
	}

	status, _, _ = call(t, server, http.MethodDelete, basePath+"/"+created.ID, "")
	if status != http.StatusNoContent {
		t.Fatalf("delete: status = %d", status)
	}
	status, _, _ = call(t, server, http.MethodGet, coverPath(created.ID), "")
	if status != http.StatusNotFound {
		t.Errorf("cover after delete: status = %d, want 404", status)
	}
}
