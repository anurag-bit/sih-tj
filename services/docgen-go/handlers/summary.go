package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"services/docgen-go/openrouter"
	"services/docgen-go/prompts"
)

// DocGenRequest is the common request structure for document generation endpoints.
type DocGenRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Constraints []string `json:"constraints,omitempty"`
	Model       string   `json:"model,omitempty"`
}

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

	// 1. Get the prompt template
	p, err := prompts.GetPrompt("exec_summary")
	if err != nil {
		slog.Error("failed to get prompt", "error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// 2. Construct the full prompt content
	// In a real implementation, this would be more sophisticated
	fullPrompt := p.Template + "\n\nProblem Title: " + req.Title + "\nProblem Description: " + req.Description

	// 3. Call OpenRouter
	model := "openrouter/auto" // Default model
	if req.Model != "" {
		model = req.Model
	}

	orReq := openrouter.ChatRequest{
		Model: model,
		Messages: []openrouter.Message{
			{Role: "system", Content: "You are a helpful assistant that generates documents based on user input."},
			{Role: "user", Content: fullPrompt},
		},
		ResponseFormat: &openrouter.ResponseFormat{Type: "json_object"},
	}

	orResp, err := h.orClient.CreateChatCompletion(r.Context(), orReq)
	if err != nil {
		slog.Error("failed to create chat completion", "error", err)
		http.Error(w, "Failed to generate summary", http.StatusInternalServerError)
		return
	}

	if len(orResp.Choices) == 0 {
		slog.Error("no choices returned from OpenRouter")
		http.Error(w, "Failed to generate summary", http.StatusInternalServerError)
		return
	}

	// 4. Parse the response from the LLM
	var summaryResp SummaryResponse
	err = json.Unmarshal([]byte(orResp.Choices[0].Message.Content), &summaryResp)
	if err != nil {
		slog.Error("failed to unmarshal LLM response", "error", err, "response", orResp.Choices[0].Message.Content)
		// Retry logic could be implemented here to ask the LLM to fix its JSON
		http.Error(w, "Failed to parse LLM response", http.StatusInternalServerError)
		return
	}

	// 5. Send the response to the client
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(summaryResp); err != nil {
		slog.Error("failed to write response", "error", err)
	}
}
