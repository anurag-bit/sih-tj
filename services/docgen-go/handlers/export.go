package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"services/docgen-go/artifact"
	"strings"

	"github.com/jung-kurt/gofpdf"
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

	art, err := h.store.CreateNew()
	if err != nil {
		slog.Error("failed to create artifact", "error", err)
		http.Error(w, "Failed to create artifact", http.StatusInternalServerError)
		return
	}

	var filenames []string
	if req.Format == "pdf" {
		for key, value := range req.Bundle {
			if content, ok := value.(string); ok {
				filename := fmt.Sprintf("%s.pdf", key)
				pdf := gofpdf.New("P", "mm", "A4", "")
				pdf.SetMargins(15, 15, 15)
				pdf.SetAutoPageBreak(true, 15)
				pdf.AddPage()
				// Use a built-in core font to avoid missing font errors in minimal containers
				pdf.SetFont("Helvetica", "", 12)

				lines := strings.Split(content, "\n")
				for _, line := range lines {
					if strings.HasPrefix(line, "# ") {
						pdf.SetFont("Helvetica", "B", 16)
						pdf.Cell(40, 10, strings.TrimPrefix(line, "# "))
						pdf.Ln(12)
						pdf.SetFont("Helvetica", "", 12)
					} else {
						pdf.MultiCell(0, 10, line, "", "", false)
						pdf.Ln(4)
					}
				}

				// Write PDF directly to the artifact path; the file doesn't exist yet, so don't check for it
				path := art.GetFilePath(filename)
				if err := pdf.OutputFileAndClose(path); err != nil {
					slog.Error("failed to write pdf file", "error", err)
					http.Error(w, "Failed to write pdf file", http.StatusInternalServerError)
					return
				}
				filenames = append(filenames, filename)
			}
		}
	} else {
		// For now, we just write the markdown content from the bundle.
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
