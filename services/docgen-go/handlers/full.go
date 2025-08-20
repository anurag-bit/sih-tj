package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"services/docgen-go/openrouter"
	"services/docgen-go/prompts"
	"strings"
	"sync"
)

// FullRequest is the request for the /full endpoint.
type FullRequest struct {
	DocGenRequest
	Prompts []string `json:"prompts"`
}

// FullResponse is the response for the /full endpoint.
type FullResponse struct {
	SummaryMD    string    `json:"summary_md,omitempty"`
	PlanMD       string    `json:"plan_md,omitempty"`
	DesignMD     string    `json:"design_md,omitempty"`
	Diagrams     []Diagram `json:"diagrams,omitempty"`
	RisksMD      string    `json:"risks_md,omitempty"`
	AcceptanceMD string    `json:"acceptance_md,omitempty"`
	TestingMD    string    `json:"testing_md,omitempty"`
	ApiMD        string    `json:"api_md,omitempty"`
	DataModelMD  string    `json:"data_model_md,omitempty"`
	CapacityMD   string    `json:"capacity_md,omitempty"`
	BreakdownMD  string    `json:"breakdown_md,omitempty"`
	TradeoffsMD  string    `json:"tradeoffs_md,omitempty"`
}

type FullHandler struct {
	orClient *openrouter.Client
}

func NewFullHandler(orClient *openrouter.Client) *FullHandler {
	return &FullHandler{orClient: orClient}
}

func (h *FullHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	var req FullRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	fullResp, err := h.generateCombined(r.Context(), w, &req)
	if err != nil {
		// Error is already handled in generateCombined
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(fullResp); err != nil {
		slog.Error("failed to write response", "error", err)
	}
}

func (h *FullHandler) generateCombined(ctx context.Context, w http.ResponseWriter, req *FullRequest) (*FullResponse, error) {
	var combinedPrompt strings.Builder
	var expectedOutputs []string
	var wg sync.WaitGroup
	var mu sync.Mutex
	fullResp := &FullResponse{}

	// This map is used to determine which prompts are for diagrams and which are for JSON.
	diagramPrompts := map[string]string{
		"mermaid_component":  "component",
		"mermaid_deployment": "deployment",
		"mermaid_sequence":   "sequence",
	}

	// Separate prompts into diagram prompts and JSON prompts.
	var jsonPromptIDs []string
	for _, promptID := range req.Prompts {
		if _, isDiagram := diagramPrompts[promptID]; isDiagram {
			wg.Add(1)
			// Handle diagram prompts separately
			go func(pID string) {
				defer wg.Done()
				rawJSON, err := CallOpenRouter(ctx, w, h.orClient, pID, &req.DocGenRequest)
				if err != nil {
					// Error handling for diagram generation
					return
				}
				// Assuming rawJSON contains just the Mermaid code string
				// Trim surrounding quotes/backticks/whitespace from the returned code
				code := strings.Trim(string(rawJSON), " `\"") // Remove quotes/backticks and trim whitespace
				mu.Lock()
				fullResp.Diagrams = append(fullResp.Diagrams, Diagram{
					ID:       pID,
					Type:     diagramPrompts[pID],
					Language: "mermaid",
					Code:     code,
				})
				mu.Unlock()
			}(promptID)
		} else {
			jsonPromptIDs = append(jsonPromptIDs, promptID)
		}
	}

	// Process JSON prompts if any exist
	if len(jsonPromptIDs) > 0 {
		// Fetch prompt templates and build the combined prompt for JSON generation
		for _, promptID := range jsonPromptIDs {
			p, err := prompts.GetPrompt(promptID)
			if err != nil {
				slog.Error("failed to get prompt", "error", err)
				return nil, err
			}
			combinedPrompt.WriteString(p.Template)
			combinedPrompt.WriteString("\n\n")
			expectedOutputs = append(expectedOutputs, p.Outputs...)
		}

		fullPrompt := combinedPrompt.String() + "\n\nProblem Title: " + req.Title + "\nProblem Description: " + req.Description

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

		orResp, err := h.orClient.CreateChatCompletion(ctx, orReq)
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

		var llmResponse map[string]interface{}
		if err := json.Unmarshal([]byte(orResp.Choices[0].Message.Content), &llmResponse); err != nil {
			slog.Error("failed to unmarshal LLM response into generic map", "error", err, "response", orResp.Choices[0].Message.Content)
			http.Error(w, "Failed to parse LLM response", http.StatusInternalServerError)
			return nil, err
		}

		for _, outputKey := range expectedOutputs {
			switch outputKey {
			case "summary_md":
				if val, ok := llmResponse[outputKey].(string); ok {
					fullResp.SummaryMD = val
				}
				break
			case "plan_md":
				if val, ok := llmResponse[outputKey].(string); ok {
					fullResp.PlanMD = val
				}
				break
			case "design_md":
				if val, ok := llmResponse[outputKey].(string); ok {
					fullResp.DesignMD = val
				}
				break
			case "diagrams":
				if val, ok := llmResponse[outputKey].([]interface{}); ok {
					for _, diagram := range val {
						if dMap, isMap := diagram.(map[string]interface{}); isMap {
							d := Diagram{
								ID:       fmt.Sprintf("%v", dMap["id"]),
								Type:     fmt.Sprintf("%v", dMap["type"]),
								Language: fmt.Sprintf("%v", dMap["language"]),
								Code:     fmt.Sprintf("%v", dMap["code"]),
							}
							if title, ok := dMap["title"].(string); ok {
								d.Title = title
							}
							fullResp.Diagrams = append(fullResp.Diagrams, d)
						}
					}
				}
				break
			case "risks_md":
				if val, ok := llmResponse[outputKey].(string); ok {
					fullResp.RisksMD = val
				}
				break
			case "acceptance_md":
				if val, ok := llmResponse[outputKey].(string); ok {
					fullResp.AcceptanceMD = val
				}
				break
			case "testing_md":
				if val, ok := llmResponse[outputKey].(string); ok {
					fullResp.TestingMD = val
				}
				break
			case "api_md":
				if val, ok := llmResponse[outputKey].(string); ok {
					fullResp.ApiMD = val
				}
				break
			case "data_model_md":
				if val, ok := llmResponse[outputKey].(string); ok {
					fullResp.DataModelMD = val
				}
				break
			case "capacity_md":
				if val, ok := llmResponse[outputKey].(string); ok {
					fullResp.CapacityMD = val
				}
				break
			case "breakdown_md":
				if val, ok := llmResponse[outputKey].(string); ok {
					fullResp.BreakdownMD = val
				}
				break
			case "tradeoffs_md":
				if val, ok := llmResponse[outputKey].(string); ok {
					fullResp.TradeoffsMD = val
				}
				break
			}
		}
	}

	wg.Wait()
	return fullResp, nil
}
