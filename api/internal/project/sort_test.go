package project

import (
	"net/http"
	"reflect"
	"testing"
	"time"
)

func TestHandler_ListSort(t *testing.T) {
	tests := []struct {
		query string
		want  Sort
	}{
		{query: "", want: SortName},
		{query: "?sort=name", want: SortName},
		{query: "?sort=recent", want: SortRecent},
		{query: "?sort=deadline&favorite=true", want: SortDeadline},
	}

	for _, tt := range tests {
		t.Run(tt.query, func(t *testing.T) {
			store := &fakeStore{}

			res, _ := serveProjects(t, store, http.MethodGet, basePath+tt.query, "")

			if res.Code != http.StatusOK {
				t.Fatalf("status = %d, body: %s", res.Code, res.Body)
			}
			if store.filter.Sort != tt.want {
				t.Errorf("Sort = %q, want %q", store.filter.Sort, tt.want)
			}
		})
	}
}

func TestHandler_ListRejectsAnUnknownSort(t *testing.T) {
	for _, value := range []string{"start_date", "NAME", "-name"} {
		t.Run(value, func(t *testing.T) {
			res, _ := serveProjects(t, &fakeStore{}, http.MethodGet, basePath+"?sort="+value, "")

			if res.Code != http.StatusBadRequest {
				t.Errorf("status = %d, want %d", res.Code, http.StatusBadRequest)
			}
			decodeProblem(t, res)
		})
	}
}

// todayInSaoPaulo asks the database for the date it uses as today, so the test
// does not depend on the clock or the time zone of the machine.
func todayInSaoPaulo(t *testing.T) time.Time {
	t.Helper()

	var today time.Time
	err := testPool.QueryRow(t.Context(), `SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date`).Scan(&today)
	if err != nil {
		t.Fatalf("read today: %v", err)
	}
	return today
}

func TestRepository_ListSorts(t *testing.T) {
	repo := NewRepository(emptyDatabase(t))
	today := todayInSaoPaulo(t)
	day := func(offset int) Date { return Date{time: today.AddDate(0, 0, offset)} }

	projects := []struct {
		name       string
		start, end int
	}{
		{name: "Vence Hoje", start: -30, end: 0},
		{name: "Vence Amanhã", start: -10, end: 1},
		{name: "Vence em Um Mês", start: -5, end: 30},
		{name: "Venceu Ontem", start: -20, end: -1},
		{name: "Venceu Há Um Ano", start: -400, end: -365},
		{name: "Área Empatada", start: -10, end: 1},
	}
	for _, p := range projects {
		fields := newFields(t, p.name)
		fields.StartDate, fields.EndDate = day(p.start), day(p.end)
		if _, err := repo.Create(t.Context(), fields); err != nil {
			t.Fatalf("Create(%q) error = %v", p.name, err)
		}
	}

	tests := []struct {
		sort Sort
		want []string
	}{
		{
			sort: SortName,
			want: []string{"Área Empatada", "Vence Amanhã", "Vence em Um Mês", "Vence Hoje", "Venceu Há Um Ano", "Venceu Ontem"},
		},
		{
			sort: SortRecent,
			want: []string{"Vence em Um Mês", "Área Empatada", "Vence Amanhã", "Venceu Ontem", "Vence Hoje", "Venceu Há Um Ano"},
		},
		{
			sort: SortDeadline,
			want: []string{"Vence Hoje", "Área Empatada", "Vence Amanhã", "Vence em Um Mês", "Venceu Ontem", "Venceu Há Um Ano"},
		},
	}

	for _, tt := range tests {
		t.Run(string(tt.sort), func(t *testing.T) {
			list, err := repo.List(t.Context(), ListFilter{Sort: tt.sort})
			if err != nil {
				t.Fatalf("List() error = %v", err)
			}

			var got []string
			for _, project := range list {
				got = append(got, project.Name)
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("order = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestRepository_ListSortsTheFavorites(t *testing.T) {
	repo := NewRepository(emptyDatabase(t))

	for _, name := range []string{"Gama Três", "Alfa Um", "Beta Dois"} {
		created, err := repo.Create(t.Context(), newFields(t, name))
		if err != nil {
			t.Fatalf("Create(%q) error = %v", name, err)
		}
		if name != "Beta Dois" {
			if err := repo.SetFavorite(t.Context(), created.ID, true); err != nil {
				t.Fatalf("SetFavorite() error = %v", err)
			}
		}
	}

	list, err := repo.List(t.Context(), ListFilter{FavoritesOnly: true, Sort: SortName})
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if len(list) != 2 || list[0].Name != "Alfa Um" || list[1].Name != "Gama Três" {
		t.Errorf("List() = %+v, want the favorites in alphabetical order", list)
	}
}
