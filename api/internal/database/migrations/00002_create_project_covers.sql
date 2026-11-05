-- +goose Up
CREATE TABLE project_covers (
    project_id   UUID PRIMARY KEY REFERENCES projects (id) ON DELETE CASCADE,
    content      BYTEA NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png')),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE project_covers;
