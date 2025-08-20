package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"services/docgen-go/artifact"
)

// ExportRequest is the request for the /export endpoint.
type ExportRequest struct {
	Bundle map[string]interface{} `json:"bundle"`
	Format string                 `json:"format"` // "pdf" or "zip"
}

// ExportResponse is the response for the /export endpoint.
type ExportResponse struct {
	ArtifactID string   `json:"artifact_id"`
	Filenames  []string `json:"filenames"`
}

type ExportHandler struct {
	store *artifact.Store
}

func NewExportHandler(store *artifact.Store) *ExportHandler {
	return &ExportHandler{store: store}
}

func (h *ExportHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	var req ExportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// 1. Create a new artifact bundle
	art, err := h.store.CreateNew()
	if err != nil {
		slog.Error("failed to create artifact", "error", err)
		http.Error(w, "Failed to create artifact", http.StatusInternalServerError)
		return
	}

	// 2. Write files to the artifact directory
	// In a real implementation, we would generate PDF/ZIP here.
	// For now, we just write the markdown content from the bundle.
	var filenames []string
	for key, value := range req.Bundle {
		if content, ok := value.(string); ok {
			filename := fmt.Sprintf("%s.md", key)
			if _, err := art.WriteFile(filename, []byte(content)); err != nil {
				slog.Error("failed to write artifact file", "error", err, "filename", filename)
				http.Error(w, "Failed to write artifact file", http.StatusInternalServerError)
				return
			}
			filenames = append(filenames, filename)
		}
	}

	resp := ExportResponse{
		ArtifactID: art.ID,
		Filenames:  filenames,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		slog.Error("failed to write response", "error", err)
	}
}
