package project

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const columns = `id, name, client, start_date, end_date, created_at, updated_at`

// Repository stores projects in PostgreSQL.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a Repository that uses db.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// Create stores a new project.
func (r *Repository) Create(ctx context.Context, fields Fields) (Project, error) {
	row := r.db.QueryRow(ctx,
		`INSERT INTO projects (name, client, start_date, end_date)
		 VALUES ($1, $2, $3, $4)
		 RETURNING `+columns,
		fields.Name, fields.Client, fields.StartDate.time, fields.EndDate.time,
	)
	return scanProject(row)
}

// List returns every project in alphabetical order, ignoring case and accents.
func (r *Repository) List(ctx context.Context) ([]Project, error) {
	rows, err := r.db.Query(ctx,
		`SELECT `+columns+`
		 FROM projects
		 ORDER BY name COLLATE "pt-BR-x-icu", id`,
	)
	if err != nil {
		return nil, fmt.Errorf("list projects: %w", err)
	}

	projects, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (Project, error) {
		return scanProject(row)
	})
	if err != nil {
		return nil, fmt.Errorf("list projects: %w", err)
	}
	return projects, nil
}

// Get returns the project with the given ID or ErrNotFound.
func (r *Repository) Get(ctx context.Context, id string) (Project, error) {
	row := r.db.QueryRow(ctx, `SELECT `+columns+` FROM projects WHERE id = $1`, id)
	return scanProject(row)
}

// Update replaces the fields of a project and returns it, or ErrNotFound.
func (r *Repository) Update(ctx context.Context, id string, fields Fields) (Project, error) {
	row := r.db.QueryRow(ctx,
		`UPDATE projects
		 SET name = $2, client = $3, start_date = $4, end_date = $5, updated_at = now()
		 WHERE id = $1
		 RETURNING `+columns,
		id, fields.Name, fields.Client, fields.StartDate.time, fields.EndDate.time,
	)
	return scanProject(row)
}

// Delete removes a project or returns ErrNotFound.
func (r *Repository) Delete(ctx context.Context, id string) error {
	result, err := r.db.Exec(ctx, `DELETE FROM projects WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete project: %w", err)
	}
	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func scanProject(row pgx.Row) (Project, error) {
	var project Project
	var startDate, endDate time.Time

	err := row.Scan(
		&project.ID,
		&project.Name,
		&project.Client,
		&startDate,
		&endDate,
		&project.CreatedAt,
		&project.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return Project{}, ErrNotFound
	}
	if err != nil {
		return Project{}, fmt.Errorf("scan project: %w", err)
	}

	project.StartDate = Date{time: startDate}
	project.EndDate = Date{time: endDate}
	project.CreatedAt = project.CreatedAt.UTC()
	project.UpdatedAt = project.UpdatedAt.UTC()
	return project, nil
}
