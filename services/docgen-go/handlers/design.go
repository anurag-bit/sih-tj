package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"services/docgen-go/openrouter"
)

// DesignResponse is the response for the /design endpoint.
type DesignResponse struct {
	DesignMD string    `json:"design_md"`
	Diagrams []Diagram `json:"diagrams"`
}

type DesignHandler struct {
	orClient *openrouter.Client
}

func NewDesignHandler(orClient *openrouter.Client) *DesignHandler {
	return &DesignHandler{orClient: orClient}
}

func (h *DesignHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	var req DocGenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	rawJSON, err := CallOpenRouter(r.Context(), w, h.orClient, "architecture_overview", &req)
	if err != nil {
		// Error is already handled in CallOpenRouter
		return
	}

	var designResp DesignResponse
	if err := json.Unmarshal(rawJSON, &designResp); err != nil {
		slog.Error("failed to unmarshal LLM response", "error", err, "response", string(rawJSON))
		http.Error(w, "Failed to parse LLM response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(designResp); err != nil {
		slog.Error("failed to write response", "error", err)
	}
}
