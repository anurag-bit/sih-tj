package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"services/docgen-go/openrouter"
)

// SummaryResponse is the response for the /summary endpoint.
type SummaryResponse struct {
	SummaryMD string `json:"summary_md"`
}

type SummaryHandler struct {
	orClient *openrouter.Client
}

func NewSummaryHandler(orClient *openrouter.Client) *SummaryHandler {
	return &SummaryHandler{orClient: orClient}
}

func (h *SummaryHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	var req DocGenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	rawJSON, err := CallOpenRouter(r.Context(), w, h.orClient, "exec_summary", &req)
	if err != nil {
		// Error is already handled in CallOpenRouter
		return
	}

	var summaryResp SummaryResponse
	if err := json.Unmarshal(rawJSON, &summaryResp); err != nil {
		slog.Error("failed to unmarshal LLM response", "error", err, "response", string(rawJSON))
		http.Error(w, "Failed to parse LLM response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(summaryResp); err != nil {
		slog.Error("failed to write response", "error", err)
	}
}
