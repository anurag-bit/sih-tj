package handlers

import (
	"log/slog"
	"net/http"
	"services/docgen-go/artifact"

	"github.com/go-chi/chi/v5"
)

type FilesHandler struct {
	store *artifact.Store
}

func NewFilesHandler(store *artifact.Store) *FilesHandler {
	return &FilesHandler{store: store}
}

func (h *FilesHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	artifactID := chi.URLParam(r, "id")
	filename := chi.URLParam(r, "filename")

	path, err := h.store.GetArtifactPath(artifactID, filename)
	if err != nil {
		slog.Warn("artifact not found", "id", artifactID, "filename", filename, "error", err)
		http.NotFound(w, r)
		return
	}

	// Serve the file from the filesystem
	// http.ServeFile handles Content-Type and other headers automatically
	http.ServeFile(w, r, path)
}
