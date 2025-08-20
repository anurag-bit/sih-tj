package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"services/docgen-go/openrouter"
	"services/docgen-go/prompts"
)

// Diagram represents a single diagram in a design response.
type Diagram struct {
	ID       string `json:"id"`
	Type     string `json:"type"`
	Language string `json:"language"`
	Title    string `json:"title,omitempty"`
	Code     string `json:"code"`
}

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

	p, err := prompts.GetPrompt("architecture_overview")
	if err != nil {
		slog.Error("failed to get prompt", "error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	fullPrompt := p.Template + "\n\nProblem Title: " + req.Title + "\nProblem Description: " + req.Description

	model := "openrouter/auto"
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
		http.Error(w, "Failed to generate design", http.StatusInternalServerError)
		return
	}

	if len(orResp.Choices) == 0 {
		slog.Error("no choices returned from OpenRouter")
		http.Error(w, "Failed to generate design", http.StatusInternalServerError)
		return
	}

	var designResp DesignResponse
	err = json.Unmarshal([]byte(orResp.Choices[0].Message.Content), &designResp)
	if err != nil {
		slog.Error("failed to unmarshal LLM response", "error", err, "response", orResp.Choices[0].Message.Content)
		http.Error(w, "Failed to parse LLM response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(designResp); err != nil {
		slog.Error("failed to write response", "error", err)
	}
}
