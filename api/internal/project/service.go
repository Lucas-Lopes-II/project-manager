package project

import "context"

// Store is the persistence used by the Service.
type Store interface {
	Create(ctx context.Context, fields Fields) (Project, error)
	List(ctx context.Context) ([]Project, error)
	Get(ctx context.Context, id string) (Project, error)
	GetCover(ctx context.Context, id string) (StoredCover, error)
	Update(ctx context.Context, id string, fields Fields) (Project, error)
	Delete(ctx context.Context, id string) error
}

// List is the result of listing projects.
type List struct {
	Items []Project `json:"items"`
	Total int       `json:"total"`
}

// Service applies the project rules.
type Service struct {
	store Store
}

// NewService creates a Service that uses store.
func NewService(store Store) *Service {
	return &Service{store: store}
}

// Create validates the input and stores a new project.
func (s *Service) Create(ctx context.Context, input Input) (Project, error) {
	fields, err := input.Validate()
	if err != nil {
		return Project{}, err
	}
	return s.store.Create(ctx, fields)
}

// List returns every project and the total of registered projects.
func (s *Service) List(ctx context.Context) (List, error) {
	projects, err := s.store.List(ctx)
	if err != nil {
		return List{}, err
	}
	return List{Items: projects, Total: len(projects)}, nil
}

// Get returns a project. A malformed ID cannot exist, so it is not found too.
func (s *Service) Get(ctx context.Context, id string) (Project, error) {
	if !idPattern.MatchString(id) {
		return Project{}, ErrNotFound
	}
	return s.store.Get(ctx, id)
}

// Cover returns the cover of a project.
func (s *Service) Cover(ctx context.Context, id string) (StoredCover, error) {
	if !idPattern.MatchString(id) {
		return StoredCover{}, ErrCoverNotFound
	}
	return s.store.GetCover(ctx, id)
}

// Update validates the input and replaces the fields of a project.
func (s *Service) Update(ctx context.Context, id string, input Input) (Project, error) {
	if !idPattern.MatchString(id) {
		return Project{}, ErrNotFound
	}
	fields, err := input.Validate()
	if err != nil {
		return Project{}, err
	}
	return s.store.Update(ctx, id, fields)
}

// Delete removes a project.
func (s *Service) Delete(ctx context.Context, id string) error {
	if !idPattern.MatchString(id) {
		return ErrNotFound
	}
	return s.store.Delete(ctx, id)
}
