package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"services/docgen-go/openrouter"
)

// PlanResponse is the response for the /plan endpoint.
type PlanResponse struct {
	PlanMD string `json:"plan_md"`
}

type PlanHandler struct {
	orClient *openrouter.Client
}

func NewPlanHandler(orClient *openrouter.Client) *PlanHandler {
	return &PlanHandler{orClient: orClient}
}

func (h *PlanHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	var req DocGenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	rawJSON, err := CallOpenRouter(r.Context(), w, h.orClient, "solution_plan", &req)
	if err != nil {
		// Error is already handled in CallOpenRouter
		return
	}

	var planResp PlanResponse
	if err := json.Unmarshal(rawJSON, &planResp); err != nil {
		slog.Error("failed to unmarshal LLM response", "error", err, "response", string(rawJSON))
		http.Error(w, "Failed to parse LLM response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(planResp); err != nil {
		slog.Error("failed to write response", "error", err)
	}
}
