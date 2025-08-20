package openrouter

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"services/docgen-go/internal/httpclient"
	"time"
)

var (
	defaultTimeout   = 30 * time.Second
	defaultRetries   = 1
	defaultBackoff   = 2 * time.Second
	openRouterAPIURL = "https://openrouter.ai/api/v1/chat/completions"
)

var (
	ErrUnauthorized = errors.New("unauthorized: check your OpenRouter API key")
	ErrForbidden    = errors.New("forbidden: you do not have permission to access this resource")
	ErrRateLimited  = errors.New("rate limited: too many requests")
)

// Client is a client for the OpenRouter API.
type Client struct {
	httpClient *httpclient.RetryableClient
	apiKey     string
	referer    string
	title      string
}

// NewClient creates a new OpenRouter client.
func NewClient() (*Client, error) {
	apiKey := os.Getenv("OPENROUTER_API_KEY")
	if apiKey == "" {
		return nil, errors.New("OPENROUTER_API_KEY environment variable not set")
	}

	return &Client{
		httpClient: httpclient.New(defaultTimeout, defaultRetries, defaultBackoff),
		apiKey:     apiKey,
		referer:    os.Getenv("HTTP_REFERER"),
		title:      os.Getenv("X_TITLE"),
	}, nil
}

// ChatRequest represents a request to the OpenRouter chat completions API.
type ChatRequest struct {
	Model          string          `json:"model"`
	Messages       []Message       `json:"messages"`
	ResponseFormat *ResponseFormat `json:"response_format,omitempty"`
}

// Message represents a single message in a chat conversation.
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ResponseFormat specifies the format for the response.
type ResponseFormat struct {
	Type string `json:"type"` // e.g., "json_object"
}

// ChatResponse represents a response from the OpenRouter chat completions API.
type ChatResponse struct {
	ID      string   `json:"id"`
	Choices []Choice `json:"choices"`
	Usage   Usage    `json:"usage"`
}

// Choice represents a single choice in a chat response.
type Choice struct {
	Message Message `json:"message"`
}

// Usage represents the token usage for a request.
type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// CreateChatCompletion sends a chat completion request to the OpenRouter API.
func (c *Client) CreateChatCompletion(ctx context.Context, req ChatRequest) (*ChatResponse, error) {
	reqBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", openRouterAPIURL, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	c.setHeaders(httpReq)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if err := c.handleError(resp); err != nil {
		return nil, err
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var chatResp ChatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w (response: %s)", err, string(respBody))
	}

	return &chatResp, nil
}

func (c *Client) setHeaders(req *http.Request) {
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	if c.referer != "" {
		req.Header.Set("HTTP-Referer", c.referer)
	}
	if c.title != "" {
		req.Header.Set("X-Title", c.title)
	}
}

func (c *Client) handleError(resp *http.Response) error {
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}

	switch resp.StatusCode {
	case http.StatusUnauthorized:
		return ErrUnauthorized
	case http.StatusForbidden:
		return ErrForbidden
	case http.StatusTooManyRequests:
		return ErrRateLimited
	case http.StatusInternalServerError:
		return fmt.Errorf("internal server error: %s", resp.Status)
	default:
		return fmt.Errorf("received non-2xx status code: %d", resp.StatusCode)
	}
}
