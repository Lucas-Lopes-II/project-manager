package project

import (
	"net/http"
	"reflect"
	"testing"
)

func TestHandler_ListSearch(t *testing.T) {
	tests := []struct {
		query string
		want  string
	}{
		{query: "", want: ""},
		{query: "?q=projeto", want: "projeto"},
		{query: "?q=%20%20proj%20%20alfa%20", want: "proj alfa"},
		{query: "?q=50%25&favorite=true&sort=recent", want: "50%"},
	}

	for _, tt := range tests {
		t.Run(tt.query, func(t *testing.T) {
			store := &fakeStore{}

			res, _ := serveProjects(t, store, http.MethodGet, basePath+tt.query, "")

			if res.Code != http.StatusOK {
				t.Fatalf("status = %d, body: %s", res.Code, res.Body)
			}
			if store.filter.Query != tt.want {
				t.Errorf("Query = %q, want %q", store.filter.Query, tt.want)
			}
		})
	}
}

func TestEscapeLike(t *testing.T) {
	if got, want := escapeLike(`50% de_uso \ ok`), `50\% de\_uso \\ ok`; got != want {
		t.Errorf("escapeLike() = %q, want %q", got, want)
	}
}

func TestRepository_ListSearch(t *testing.T) {
	repo := NewRepository(emptyDatabase(t))

	for _, name := range []string{"Área Norte", "Projeto Alfa", "projeto beta", "Meta de 50% Um", "Código_Fonte Dois", "Outro Nome"} {
		if _, err := repo.Create(t.Context(), newFields(t, name)); err != nil {
			t.Fatalf("Create(%q) error = %v", name, err)
		}
	}

	tests := []struct {
		query string
		want  []string
	}{
		{query: "projeto", want: []string{"Projeto Alfa", "projeto beta"}},
		{query: "PROJ", want: []string{"Projeto Alfa", "projeto beta"}},
		{query: "area", want: []string{"Área Norte"}},
		{query: "nórte", want: []string{"Área Norte"}},
		{query: "50%", want: []string{"Meta de 50% Um"}},
		{query: "%", want: []string{"Meta de 50% Um"}},
		{query: "o_f", want: []string{"Código_Fonte Dois"}},
		{query: "_", want: []string{"Código_Fonte Dois"}},
		{query: "inexistente", want: nil},
	}

	for _, tt := range tests {
		t.Run(tt.query, func(t *testing.T) {
			list, err := repo.List(t.Context(), ListFilter{Query: tt.query, Sort: SortName})
			if err != nil {
				t.Fatalf("List() error = %v", err)
			}

			var got []string
			for _, project := range list {
				got = append(got, project.Name)
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("List(%q) = %v, want %v", tt.query, got, tt.want)
			}
		})
	}
}
