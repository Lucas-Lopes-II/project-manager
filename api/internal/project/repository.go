package project

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// The covers table only provides the update time here, so listing projects does
// not read the images.
const (
	columns    = `p.id, p.name, p.client, p.start_date, p.end_date, p.created_at, p.updated_at, c.updated_at`
	joinCovers = `LEFT JOIN project_covers c ON c.project_id = p.id`
)

// Repository stores projects in PostgreSQL.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a Repository that uses db.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// Create stores a new project and its cover in a single transaction.
func (r *Repository) Create(ctx context.Context, fields Fields) (Project, error) {
	var project Project

	err := pgx.BeginFunc(ctx, r.db, func(tx pgx.Tx) error {
		var id string
		err := tx.QueryRow(ctx,
			`INSERT INTO projects (name, client, start_date, end_date)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id`,
			fields.Name, fields.Client, fields.StartDate.time, fields.EndDate.time,
		).Scan(&id)
		if err != nil {
			return fmt.Errorf("insert project: %w", err)
		}

		if fields.Cover != nil {
			_, err := tx.Exec(ctx,
				`INSERT INTO project_covers (project_id, content, content_type)
				 VALUES ($1, $2, $3)`,
				id, fields.Cover.Content, fields.Cover.ContentType,
			)
			if err != nil {
				return fmt.Errorf("insert cover: %w", err)
			}
		}

		project, err = scanProject(tx.QueryRow(ctx, `SELECT `+columns+` FROM projects p `+joinCovers+` WHERE p.id = $1`, id))
		return err
	})
	if err != nil {
		return Project{}, fmt.Errorf("create project: %w", err)
	}
	return project, nil
}

// List returns every project in alphabetical order, ignoring case and accents.
func (r *Repository) List(ctx context.Context) ([]Project, error) {
	rows, err := r.db.Query(ctx,
		`SELECT `+columns+`
		 FROM projects p `+joinCovers+`
		 ORDER BY p.name COLLATE "pt-BR-x-icu", p.id`,
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
	row := r.db.QueryRow(ctx, `SELECT `+columns+` FROM projects p `+joinCovers+` WHERE p.id = $1`, id)
	return scanProject(row)
}

// GetCover returns the cover of a project or ErrCoverNotFound.
func (r *Repository) GetCover(ctx context.Context, id string) (StoredCover, error) {
	var cover StoredCover
	var updatedAt time.Time

	err := r.db.QueryRow(ctx,
		`SELECT content, content_type, updated_at FROM project_covers WHERE project_id = $1`, id,
	).Scan(&cover.Content, &cover.ContentType, &updatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return StoredCover{}, ErrCoverNotFound
	}
	if err != nil {
		return StoredCover{}, fmt.Errorf("get cover: %w", err)
	}

	cover.Version = coverVersion(updatedAt)
	return cover, nil
}

// Update replaces the fields of a project and returns it, or ErrNotFound.
func (r *Repository) Update(ctx context.Context, id string, fields Fields) (Project, error) {
	row := r.db.QueryRow(ctx,
		`WITH p AS (
		     UPDATE projects
		     SET name = $2, client = $3, start_date = $4, end_date = $5, updated_at = now()
		     WHERE id = $1
		     RETURNING *
		 )
		 SELECT `+columns+` FROM p `+joinCovers,
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
	var coverUpdatedAt *time.Time

	err := row.Scan(
		&project.ID,
		&project.Name,
		&project.Client,
		&startDate,
		&endDate,
		&project.CreatedAt,
		&project.UpdatedAt,
		&coverUpdatedAt,
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
	if coverUpdatedAt != nil {
		url := coverPath(project.ID) + "?v=" + coverVersion(*coverUpdatedAt)
		project.CoverURL = &url
	}
	return project, nil
}

func coverVersion(updatedAt time.Time) string {
	return strconv.FormatInt(updatedAt.UnixMicro(), 10)
}
