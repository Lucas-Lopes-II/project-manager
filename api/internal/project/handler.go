package project

import (
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/Lucas-Lopes-II/project-manager/api/internal/httpx"
)

const basePath = "/api/v1/projects"

func coverPath(id string) string {
	return basePath + "/" + id + "/cover"
}

// Handler exposes the project routes.
type Handler struct {
	service *Service
	log     *slog.Logger
}

// NewHandler creates a Handler that uses service.
func NewHandler(service *Service, log *slog.Logger) *Handler {
	return &Handler{service: service, log: log}
}

// Register adds the project routes to mux.
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET "+basePath, h.list)
	mux.HandleFunc("POST "+basePath, h.create)
	mux.HandleFunc("GET "+basePath+"/{id}", h.get)
	mux.HandleFunc("GET "+basePath+"/{id}/cover", h.cover)
	mux.HandleFunc("PUT "+basePath+"/{id}", h.update)
	mux.HandleFunc("DELETE "+basePath+"/{id}", h.delete)
	mux.HandleFunc("PUT "+basePath+"/{id}/favorite", h.setFavorite(true))
	mux.HandleFunc("DELETE "+basePath+"/{id}/favorite", h.setFavorite(false))
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	var filter ListFilter
	switch r.URL.Query().Get("favorite") {
	case "":
	case "true":
		filter.FavoritesOnly = true
	default:
		httpx.WriteProblem(w, r, http.StatusBadRequest, "O filtro favorite aceita apenas o valor true.")
		return
	}

	list, err := h.service.List(r.Context(), filter)
	if err != nil {
		h.writeError(w, r, err)
		return
	}
	httpx.WriteJSON(w, r, http.StatusOK, list)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	input, ok := decodeInput(w, r)
	if !ok {
		return
	}

	project, err := h.service.Create(r.Context(), input)
	if err != nil {
		h.writeError(w, r, err)
		return
	}

	w.Header().Set("Location", basePath+"/"+project.ID)
	httpx.WriteJSON(w, r, http.StatusCreated, project)
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	project, err := h.service.Get(r.Context(), r.PathValue("id"))
	if err != nil {
		h.writeError(w, r, err)
		return
	}
	httpx.WriteJSON(w, r, http.StatusOK, project)
}

func (h *Handler) cover(w http.ResponseWriter, r *http.Request) {
	cover, err := h.service.Cover(r.Context(), r.PathValue("id"))
	if err != nil {
		h.writeError(w, r, err)
		return
	}

	// The URL given by cover_url carries the current version, so it never changes.
	cacheControl := "no-cache"
	if r.URL.Query().Get("v") == cover.Version {
		cacheControl = "public, max-age=31536000, immutable"
	}

	w.Header().Set("Cache-Control", cacheControl)
	w.Header().Set("Content-Type", cover.ContentType)
	w.Header().Set("Content-Length", strconv.Itoa(len(cover.Content)))
	w.Header().Set("X-Content-Type-Options", "nosniff")
	if _, err := w.Write(cover.Content); err != nil {
		h.log.ErrorContext(r.Context(), "write cover", "request_id", httpx.RequestID(r.Context()), "error", err)
	}
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	input, ok := decodeInput(w, r)
	if !ok {
		return
	}

	project, err := h.service.Update(r.Context(), r.PathValue("id"), input)
	if err != nil {
		h.writeError(w, r, err)
		return
	}
	httpx.WriteJSON(w, r, http.StatusOK, project)
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	if err := h.service.Delete(r.Context(), r.PathValue("id")); err != nil {
		h.writeError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// setFavorite answers PUT, which marks the project, and DELETE, which unmarks it.
// Both can be repeated with the same result.
func (h *Handler) setFavorite(favorite bool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := h.service.SetFavorite(r.Context(), r.PathValue("id"), favorite); err != nil {
			h.writeError(w, r, err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

func (h *Handler) writeError(w http.ResponseWriter, r *http.Request, err error) {
	var validation *ValidationError

	switch {
	case errors.As(err, &validation):
		fieldErrors := make([]httpx.FieldError, len(validation.Errors))
		for i, fieldError := range validation.Errors {
			fieldErrors[i] = httpx.FieldError{Field: fieldError.Field, Code: fieldError.Code}
		}
		httpx.WriteProblem(w, r, http.StatusUnprocessableEntity, "Um ou mais campos são inválidos.", fieldErrors...)

	case errors.Is(err, ErrNotFound):
		httpx.WriteProblem(w, r, http.StatusNotFound, "Projeto não encontrado.")

	case errors.Is(err, ErrCoverNotFound):
		httpx.WriteProblem(w, r, http.StatusNotFound, "Capa não encontrada.")

	default:
		h.log.ErrorContext(r.Context(), "project request failed", "request_id", httpx.RequestID(r.Context()), "error", err)
		httpx.WriteProblem(w, r, http.StatusInternalServerError, "")
	}
}
