-- +goose Up
CREATE TABLE projects (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    client     TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date   DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT projects_end_date_after_start_date CHECK (end_date > start_date)
);

-- +goose Down
DROP TABLE projects;
