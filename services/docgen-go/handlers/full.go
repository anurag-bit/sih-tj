package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

// FullResponse is the response for the /full endpoint.
type FullResponse struct {
	SummaryMD   string    `json:"summary_md"`
	PlanMD      string    `json:"plan_md"`
	DesignMD    string    `json:"design_md"`
	Diagrams    []Diagram `json:"diagrams"`
	RisksMD     string    `json:"risks_md"`
	AcceptanceMD string    `json:"acceptance_md"`
	TestingMD   string    `json:"testing_md"`
	ApiMD       string    `json:"api_md"`
	DataMD      string    `json:"data_md"`
	CapacityMD  string    `json:"capacity_md"`
}

type FullHandler struct {
	// In a real implementation, this would likely take multiple services
	// to generate each part of the full document.
}

func NewFullHandler() *FullHandler {
	return &FullHandler{}
}

func (h *FullHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// For now, this is a placeholder. A full implementation would involve
	// multiple LLM calls and aggregation of the results.
	slog.Warn("The /v1/docgen/full endpoint is a placeholder and returns mock data.")

	resp := FullResponse{
		SummaryMD:   "# Executive Summary\n\nThis is a mock executive summary.",
		PlanMD:      "# Solution Plan\n\n- Phase 1: Mock plan.",
		DesignMD:    "# System Design\n\nMock system design.",
		RisksMD:     "# Risks\n\n- Mock risk.",
		AcceptanceMD: "# Acceptance Criteria\n\n- Mock criteria.",
		TestingMD:   "# Testing Strategy\n\n- Mock testing strategy.",
		ApiMD:       "# API/Data Models\n\n- Mock API models.",
		DataMD:      "# Data Model\n\n- Mock data model.",
		CapacityMD:  "# Capacity Planning\n\n- Mock capacity planning.",
		Diagrams: []Diagram{
			{
				ID:       "comp-1",
				Type:     "component",
				Language: "mermaid",
				Title:    "Mock Component Diagram",
				Code:     "graph TD;\n    A-->B;",
			},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		slog.Error("failed to write response", "error", err)
	}
}
