package project

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/Lucas-Lopes-II/project-manager/api/internal/httpx"
)

const basePath = "/api/v1/projects"

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
	mux.HandleFunc("PUT "+basePath+"/{id}", h.update)
	mux.HandleFunc("DELETE "+basePath+"/{id}", h.delete)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	list, err := h.service.List(r.Context())
	if err != nil {
		h.writeError(w, r, err)
		return
	}
	httpx.WriteJSON(w, r, http.StatusOK, list)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var input Input
	if !httpx.DecodeJSON(w, r, &input) {
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

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	var input Input
	if !httpx.DecodeJSON(w, r, &input) {
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

	default:
		h.log.ErrorContext(r.Context(), "project request failed", "request_id", httpx.RequestID(r.Context()), "error", err)
		httpx.WriteProblem(w, r, http.StatusInternalServerError, "")
	}
}
