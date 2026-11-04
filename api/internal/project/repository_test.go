package project

import (
	"context"
	"errors"
	"flag"
	"log"
	"log/slog"
	"os"
	"reflect"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/Lucas-Lopes-II/project-manager/api/internal/database"
	"github.com/Lucas-Lopes-II/project-manager/api/internal/testdb"
)

const unknownID = "00000000-0000-4000-8000-000000000000"

var testPool *pgxpool.Pool

func TestMain(m *testing.M) {
	flag.Parse()
	if testing.Short() {
		os.Exit(m.Run())
	}
	os.Exit(runWithDatabase(m))
}

func runWithDatabase(m *testing.M) int {
	ctx := context.Background()

	databaseURL, terminate, err := testdb.Start(ctx)
	if err != nil {
		log.Print(err)
		return 1
	}
	defer terminate()

	testPool, err = database.Connect(ctx, databaseURL)
	if err != nil {
		log.Print(err)
		return 1
	}
	defer testPool.Close()

	if err := database.Migrate(ctx, testPool, slog.New(slog.DiscardHandler)); err != nil {
		log.Print(err)
		return 1
	}

	return m.Run()
}

// emptyDatabase skips the test in short mode and removes the existing projects.
func emptyDatabase(t *testing.T) *pgxpool.Pool {
	t.Helper()

	if testing.Short() {
		t.Skip("integration test")
	}
	if _, err := testPool.Exec(t.Context(), `TRUNCATE projects`); err != nil {
		t.Fatalf("empty database: %v", err)
	}
	return testPool
}

func newFields(t *testing.T, name string) Fields {
	t.Helper()

	return Fields{
		Name:      name,
		Client:    "Clicksign",
		StartDate: mustParseDate(t, "2026-11-04"),
		EndDate:   mustParseDate(t, "2026-12-12"),
	}
}

func TestRepository_CreateAndGet(t *testing.T) {
	repo := NewRepository(emptyDatabase(t))

	created, err := repo.Create(t.Context(), newFields(t, "Projeto Iridium"))
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	if created.ID == "" || created.CreatedAt.IsZero() || created.UpdatedAt.IsZero() {
		t.Errorf("Create() = %+v, want generated values", created)
	}

	got, err := repo.Get(t.Context(), created.ID)
	if err != nil {
		t.Fatalf("Get() error = %v", err)
	}
	if !reflect.DeepEqual(got, created) {
		t.Errorf("Get() = %+v, want %+v", got, created)
	}
}

func TestRepository_KeepsTheDatesUnchanged(t *testing.T) {
	repo := NewRepository(emptyDatabase(t))

	created, err := repo.Create(t.Context(), newFields(t, "Projeto Iridium"))
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}

	if got := created.StartDate.String(); got != "2026-11-04" {
		t.Errorf("StartDate = %q", got)
	}
	if got := created.EndDate.String(); got != "2026-12-12" {
		t.Errorf("EndDate = %q", got)
	}
}

func TestRepository_ListSortsIgnoringCaseAndAccents(t *testing.T) {
	repo := NewRepository(emptyDatabase(t))

	for _, name := range []string{"Zeta Um", "área Dois", "Beta Três", "Alfa Quatro", "abacate Cinco", "Ômega Seis", "Avião Sete"} {
		if _, err := repo.Create(t.Context(), newFields(t, name)); err != nil {
			t.Fatalf("Create(%q) error = %v", name, err)
		}
	}

	projects, err := repo.List(t.Context())
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}

	var got []string
	for _, project := range projects {
		got = append(got, project.Name)
	}
	want := []string{"abacate Cinco", "Alfa Quatro", "área Dois", "Avião Sete", "Beta Três", "Ômega Seis", "Zeta Um"}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("List() order = %v, want %v", got, want)
	}
}

func TestRepository_ListWithNoProjectsReturnsAnEmptyList(t *testing.T) {
	repo := NewRepository(emptyDatabase(t))

	projects, err := repo.List(t.Context())
	if err != nil {
		t.Fatalf("List() error = %v", err)
	}
	if projects == nil || len(projects) != 0 {
		t.Errorf("List() = %#v, want an empty list", projects)
	}
}

func TestRepository_Update(t *testing.T) {
	repo := NewRepository(emptyDatabase(t))

	created, err := repo.Create(t.Context(), newFields(t, "Projeto Iridium"))
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}

	fields := Fields{
		Name:      "Projeto Atualizado",
		Client:    "Outro Cliente",
		StartDate: mustParseDate(t, "2027-01-01"),
		EndDate:   mustParseDate(t, "2027-02-02"),
	}
	updated, err := repo.Update(t.Context(), created.ID, fields)
	if err != nil {
		t.Fatalf("Update() error = %v", err)
	}

	if updated.ID != created.ID || !updated.CreatedAt.Equal(created.CreatedAt) {
		t.Errorf("Update() changed the identity: %+v", updated)
	}
	if updated.Name != fields.Name || updated.Client != fields.Client {
		t.Errorf("Update() = %+v", updated)
	}
	if updated.StartDate.String() != "2027-01-01" || updated.EndDate.String() != "2027-02-02" {
		t.Errorf("Update() dates = %s, %s", updated.StartDate, updated.EndDate)
	}
	if updated.UpdatedAt.Before(created.UpdatedAt) {
		t.Errorf("UpdatedAt = %v, want it not before %v", updated.UpdatedAt, created.UpdatedAt)
	}
}

func TestRepository_Delete(t *testing.T) {
	repo := NewRepository(emptyDatabase(t))

	created, err := repo.Create(t.Context(), newFields(t, "Projeto Iridium"))
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}

	if err := repo.Delete(t.Context(), created.ID); err != nil {
		t.Fatalf("Delete() error = %v", err)
	}
	if _, err := repo.Get(t.Context(), created.ID); !errors.Is(err, ErrNotFound) {
		t.Errorf("Get() after Delete() error = %v, want ErrNotFound", err)
	}
}

func TestRepository_UnknownIDReturnsNotFound(t *testing.T) {
	repo := NewRepository(emptyDatabase(t))

	if _, err := repo.Get(t.Context(), unknownID); !errors.Is(err, ErrNotFound) {
		t.Errorf("Get() error = %v, want ErrNotFound", err)
	}
	if _, err := repo.Update(t.Context(), unknownID, newFields(t, "Projeto Iridium")); !errors.Is(err, ErrNotFound) {
		t.Errorf("Update() error = %v, want ErrNotFound", err)
	}
	if err := repo.Delete(t.Context(), unknownID); !errors.Is(err, ErrNotFound) {
		t.Errorf("Delete() error = %v, want ErrNotFound", err)
	}
}
