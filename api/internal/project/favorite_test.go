package project

import (
	"encoding/json"
	"errors"
	"net/http"
	"testing"
)

// listBody reads the list response without decoding the dates.
type listBody struct {
	Items []map[string]any `json:"items"`
	Total int              `json:"total"`
}

func TestHandler_ListFiltersTheFavorites(t *testing.T) {
	store := &fakeStore{projects: []Project{{ID: validID, Favorite: true}}, total: 5}

	res, _ := serveProjects(t, store, http.MethodGet, basePath+"?favorite=true", "")

	if res.Code != http.StatusOK {
		t.Fatalf("status = %d, body: %s", res.Code, res.Body)
	}
	if !store.filter.FavoritesOnly {
		t.Error("FavoritesOnly = false, want true")
	}

	var list listBody
	if err := json.Unmarshal(res.Body.Bytes(), &list); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	if len(list.Items) != 1 || list.Total != 5 {
		t.Errorf("list = %d items and total %d, want 1 item and the total of every project", len(list.Items), list.Total)
	}
}

func TestHandler_ListWithoutFilter(t *testing.T) {
	store := &fakeStore{projects: []Project{{ID: validID}, {ID: unknownID}}, total: 99}

	res, _ := serveProjects(t, store, http.MethodGet, basePath, "")

	var list listBody
	if err := json.Unmarshal(res.Body.Bytes(), &list); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	if store.filter.FavoritesOnly || list.Total != 2 {
		t.Errorf("filter = %+v, total = %d, want no filter and the size of the list", store.filter, list.Total)
	}
}

func TestHandler_ListRejectsAnInvalidFilter(t *testing.T) {
	for _, value := range []string{"false", "1", "sim"} {
		t.Run(value, func(t *testing.T) {
			res, _ := serveProjects(t, &fakeStore{}, http.MethodGet, basePath+"?favorite="+value, "")

			if res.Code != http.StatusBadRequest {
				t.Errorf("status = %d, want %d", res.Code, http.StatusBadRequest)
			}
			decodeProblem(t, res)
		})
	}
}

func TestHandler_SetFavorite(t *testing.T) {
	tests := []struct {
		method string
		want   bool
	}{
		{method: http.MethodPut, want: true},
		{method: http.MethodDelete, want: false},
	}

	for _, tt := range tests {
		t.Run(tt.method, func(t *testing.T) {
			store := &fakeStore{}

			res, _ := serveProjects(t, store, tt.method, basePath+"/"+validID+"/favorite", "")

			if res.Code != http.StatusNoContent {
				t.Fatalf("status = %d, want %d", res.Code, http.StatusNoContent)
			}
			if store.favorite == nil || *store.favorite != tt.want {
				t.Errorf("favorite = %v, want %v", store.favorite, tt.want)
			}
		})
	}
}

func TestHandler_SetFavoriteOnAnUnknownProject(t *testing.T) {
	for _, id := range []string{validID, "abc"} {
		t.Run(id, func(t *testing.T) {
			res, _ := serveProjects(t, &fakeStore{err: ErrNotFound}, http.MethodPut, basePath+"/"+id+"/favorite", "")

			if res.Code != http.StatusNotFound {
				t.Errorf("status = %d, want %d", res.Code, http.StatusNotFound)
			}
			decodeProblem(t, res)
		})
	}
}

func TestRepository_Favorites(t *testing.T) {
	repo := NewRepository(emptyDatabase(t))

	alfa, err := repo.Create(t.Context(), newFields(t, "Alfa Um"))
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if _, err := repo.Create(t.Context(), newFields(t, "Beta Dois")); err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if alfa.Favorite {
		t.Error("a new project is a favorite, want it not to be")
	}

	if err := repo.SetFavorite(t.Context(), alfa.ID, true); err != nil {
		t.Fatalf("SetFavorite() error = %v", err)
	}
	// Repeating gives the same result.
	if err := repo.SetFavorite(t.Context(), alfa.ID, true); err != nil {
		t.Fatalf("SetFavorite() again error = %v", err)
	}

	favorites, err := repo.List(t.Context(), ListFilter{FavoritesOnly: true})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if len(favorites) != 1 || favorites[0].ID != alfa.ID || !favorites[0].Favorite {
		t.Errorf("List(favorites) = %+v, want only the favorite", favorites)
	}
	if !favorites[0].UpdatedAt.Equal(alfa.UpdatedAt) {
		t.Errorf("UpdatedAt = %v, want it unchanged at %v", favorites[0].UpdatedAt, alfa.UpdatedAt)
	}

	all, err := repo.List(t.Context(), ListFilter{})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	total, err := repo.Count(t.Context())
	if err != nil {
		t.Fatalf("Count() error = %v", err)
	}
	if len(all) != 2 || total != 2 {
		t.Errorf("List() = %d projects, Count() = %d, want 2 and 2", len(all), total)
	}

	// Editing keeps the favorite.
	updated, err := repo.Update(t.Context(), alfa.ID, newFields(t, "Alfa Novo"))
	if err != nil {
		t.Fatalf("Update() error = %v", err)
	}
	if !updated.Favorite {
		t.Error("the edit removed the favorite")
	}

	if err := repo.SetFavorite(t.Context(), alfa.ID, false); err != nil {
		t.Fatalf("SetFavorite(false) error = %v", err)
	}
	favorites, err = repo.List(t.Context(), ListFilter{FavoritesOnly: true})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if len(favorites) != 0 {
		t.Errorf("List(favorites) = %+v, want none", favorites)
	}
}

func TestRepository_SetFavoriteOnAnUnknownProject(t *testing.T) {
	repo := NewRepository(emptyDatabase(t))

	if err := repo.SetFavorite(t.Context(), unknownID, true); !errors.Is(err, ErrNotFound) {
		t.Errorf("SetFavorite() error = %v, want ErrNotFound", err)
	}
}

func TestAPI_Favorites(t *testing.T) {
	pool := emptyDatabase(t)
	server := newTestServer(t, pool)

	status, _, created := call(t, server, http.MethodPost, basePath, validBody)
	if status != http.StatusCreated || created["favorite"] != false {
		t.Fatalf("create: status = %d, favorite = %v", status, created["favorite"])
	}
	id := created["id"].(string)

	if status, _, _ := call(t, server, http.MethodPut, basePath+"/"+id+"/favorite", ""); status != http.StatusNoContent {
		t.Fatalf("favorite: status = %d", status)
	}
	_, _, list := call(t, server, http.MethodGet, basePath+"?favorite=true", "")
	if items := list["items"].([]any); len(items) != 1 || items[0].(map[string]any)["favorite"] != true {
		t.Errorf("favorites = %v, want the project", list["items"])
	}

	if status, _, _ := call(t, server, http.MethodDelete, basePath+"/"+id+"/favorite", ""); status != http.StatusNoContent {
		t.Fatalf("unfavorite: status = %d", status)
	}
	_, _, list = call(t, server, http.MethodGet, basePath+"?favorite=true", "")
	if items := list["items"].([]any); len(items) != 0 || list["total"] != float64(1) {
		t.Errorf("favorites = %v, total = %v, want none of 1", list["items"], list["total"])
	}
}
