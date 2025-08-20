package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/rand"
	"net/http"
	"services/docgen-go/openrouter"
	"services/docgen-go/prompts"
	"time"
)

// DocGenRequest is the common request structure for document generation endpoints.
type DocGenRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Constraints []string `json:"constraints,omitempty"`
	Model       string   `json:"model,omitempty"`
}

var defaultModels = []string{
	"openai/gpt-oss-20b:free",
	"google/gemini-flash-1.5",
	"moonshotai/kimi-k2:free",
	"google/gemma-3n-e2b-it:free",
}

func selectDefaultModel() string {
	rand.Seed(time.Now().UnixNano())
	return defaultModels[rand.Intn(len(defaultModels))]
}

// CallOpenRouter is a helper function to call the OpenRouter API.
func CallOpenRouter(ctx context.Context, w http.ResponseWriter, orClient *openrouter.Client, promptName string, req *DocGenRequest) (json.RawMessage, error) {
	// 1. Get the prompt template
	p, err := prompts.GetPrompt(promptName)
	if err != nil {
		slog.Error("failed to get prompt", "error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return nil, err
	}

	// 2. Construct the full prompt content
	fullPrompt := p.Template + `

Problem Title: ` + req.Title + `
Problem Description: ` + req.Description

	// 3. Call OpenRouter
	model := selectDefaultModel()
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

	orResp, err := orClient.CreateChatCompletion(ctx, orReq)
	if err != nil {
		slog.Error("failed to create chat completion", "error", err)
		http.Error(w, "Failed to generate document", http.StatusInternalServerError)
		return nil, err
	}

	if len(orResp.Choices) == 0 {
		slog.Error("no choices returned from OpenRouter")
		http.Error(w, "Failed to generate document", http.StatusInternalServerError)
		return nil, fmt.Errorf("no choices returned from OpenRouter")
	}

	return []byte(orResp.Choices[0].Message.Content), nil
}
