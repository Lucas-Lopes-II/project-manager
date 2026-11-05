-- +goose Up
ALTER TABLE projects ADD COLUMN favorite BOOLEAN NOT NULL DEFAULT false;

-- +goose Down
ALTER TABLE projects DROP COLUMN favorite;
