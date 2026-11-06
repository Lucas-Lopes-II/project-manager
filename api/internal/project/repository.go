package project

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// The covers table only provides the update time here, so listing projects does
// not read the images.
const (
	columns       = `p.id, p.name, p.client, p.start_date, p.end_date, p.favorite, p.created_at, p.updated_at, c.updated_at`
	joinCovers    = `LEFT JOIN project_covers c ON c.project_id = p.id`
	selectProject = `SELECT ` + columns + ` FROM projects p ` + joinCovers + ` WHERE p.id = $1`
)

// Repository stores projects in PostgreSQL.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a Repository that uses db.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// createLock serializes the creations, so that concurrent ones cannot pass
// MaxProjects together. The value only needs to be unique among the advisory locks.
const createLock = 4_201_400

// Create stores a new project and its cover in a single transaction, unless there
// are already MaxProjects projects.
func (r *Repository) Create(ctx context.Context, fields Fields) (Project, error) {
	var project Project

	err := pgx.BeginFunc(ctx, r.db, func(tx pgx.Tx) error {
		if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock($1)`, createLock); err != nil {
			return fmt.Errorf("lock creation: %w", err)
		}
		var count int
		if err := tx.QueryRow(ctx, `SELECT count(*) FROM projects`).Scan(&count); err != nil {
			return fmt.Errorf("count projects: %w", err)
		}
		if count >= MaxProjects {
			return ErrProjectLimit
		}

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
			if err := saveCover(ctx, tx, id, *fields.Cover); err != nil {
				return err
			}
		}

		project, err = scanProject(tx.QueryRow(ctx, selectProject, id))
		return err
	})
	if err != nil {
		return Project{}, fmt.Errorf("create project: %w", err)
	}
	return project, nil
}

// byName orders by name ignoring case and accents, and breaks the remaining ties.
const byName = `p.name COLLATE "pt-BR-x-icu", p.id`

// orderBy holds the ORDER BY of each sort. Only these fixed clauses reach the query.
var orderBy = map[Sort]string{
	SortName:   byName,
	SortRecent: `p.start_date DESC, ` + byName,
	// Deadlines from today on come first, from the nearest, and then the expired
	// ones, from the most recent. Today is the date in São Paulo (ADR-0029).
	SortDeadline: `p.end_date < today, CASE WHEN p.end_date >= today THEN p.end_date END, p.end_date DESC, ` + byName,
}

// List returns the projects that match the filter, in the order it asks for.
func (r *Repository) List(ctx context.Context, filter ListFilter) ([]Project, error) {
	order, ok := orderBy[filter.Sort]
	if !ok {
		order = orderBy[SortName]
	}

	rows, err := r.db.Query(ctx,
		`SELECT `+columns+`
		 FROM projects p `+joinCovers+`,
		      LATERAL (SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date AS today) t
		 WHERE (NOT $1 OR p.favorite)
		   AND ($2 = '' OR unaccent(p.name) ILIKE '%' || unaccent($2) || '%')
		 ORDER BY `+order,
		filter.FavoritesOnly, escapeLike(filter.Query),
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

// likeEscaper makes the characters of a LIKE pattern match themselves. Backslash is
// the default escape character of PostgreSQL.
var likeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

func escapeLike(text string) string {
	return likeEscaper.Replace(text)
}

// Count returns the number of registered projects.
func (r *Repository) Count(ctx context.Context) (int, error) {
	var total int
	if err := r.db.QueryRow(ctx, `SELECT count(*) FROM projects`).Scan(&total); err != nil {
		return 0, fmt.Errorf("count projects: %w", err)
	}
	return total, nil
}

// Get returns the project with the given ID or ErrNotFound.
func (r *Repository) Get(ctx context.Context, id string) (Project, error) {
	row := r.db.QueryRow(ctx, selectProject, id)
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

// Update replaces the fields of a project and changes its cover in a single
// transaction, and returns the project or ErrNotFound.
func (r *Repository) Update(ctx context.Context, id string, fields Fields) (Project, error) {
	var project Project

	err := pgx.BeginFunc(ctx, r.db, func(tx pgx.Tx) error {
		result, err := tx.Exec(ctx,
			`UPDATE projects
			 SET name = $2, client = $3, start_date = $4, end_date = $5, updated_at = now()
			 WHERE id = $1`,
			id, fields.Name, fields.Client, fields.StartDate.time, fields.EndDate.time,
		)
		if err != nil {
			return fmt.Errorf("update project: %w", err)
		}
		if result.RowsAffected() == 0 {
			return ErrNotFound
		}

		switch {
		case fields.Cover != nil:
			if err := saveCover(ctx, tx, id, *fields.Cover); err != nil {
				return err
			}
		case fields.RemoveCover:
			if _, err := tx.Exec(ctx, `DELETE FROM project_covers WHERE project_id = $1`, id); err != nil {
				return fmt.Errorf("delete cover: %w", err)
			}
		}

		project, err = scanProject(tx.QueryRow(ctx, selectProject, id))
		return err
	})
	if err != nil {
		return Project{}, fmt.Errorf("update project: %w", err)
	}
	return project, nil
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

// SetFavorite marks or unmarks a project, or returns ErrNotFound. Favoriting
// does not change the data of the project, so updated_at stays the same.
func (r *Repository) SetFavorite(ctx context.Context, id string, favorite bool) error {
	result, err := r.db.Exec(ctx, `UPDATE projects SET favorite = $2 WHERE id = $1`, id, favorite)
	if err != nil {
		return fmt.Errorf("set favorite: %w", err)
	}
	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// saveCover stores the cover of a project, replacing the current one.
func saveCover(ctx context.Context, tx pgx.Tx, id string, cover Cover) error {
	_, err := tx.Exec(ctx,
		`INSERT INTO project_covers (project_id, content, content_type)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (project_id) DO UPDATE
		 SET content = EXCLUDED.content, content_type = EXCLUDED.content_type, updated_at = now()`,
		id, cover.Content, cover.ContentType,
	)
	if err != nil {
		return fmt.Errorf("save cover: %w", err)
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
		&project.Favorite,
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
