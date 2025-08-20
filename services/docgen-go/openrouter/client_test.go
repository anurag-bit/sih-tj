package openrouter

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"services/docgen-go/internal/httpclient"
	"testing"
	"time"
)

func TestMain(m *testing.M) {
	// Set dummy env vars for tests
	os.Setenv("OPENROUTER_API_KEY", "test-key")
	os.Setenv("HTTP_REFERER", "test-referer")
	os.Setenv("X_TITLE", "test-title")
	code := m.Run()
	os.Exit(code)
}

func TestCreateChatCompletion(t *testing.T) {
	t.Run("successful request", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Check headers
			if r.Header.Get("Authorization") != "Bearer test-key" {
				t.Errorf("Expected Authorization header to be 'Bearer test-key', got '%s'", r.Header.Get("Authorization"))
			}
			if r.Header.Get("HTTP-Referer") != "test-referer" {
				t.Errorf("Expected HTTP-Referer header to be 'test-referer', got '%s'", r.Header.Get("HTTP-Referer"))
			}
			if r.Header.Get("X-Title") != "test-title" {
				t.Errorf("Expected X-Title header to be 'test-title', got '%s'", r.Header.Get("X-Title"))
			}

			w.WriteHeader(http.StatusOK)
			resp := ChatResponse{
				ID: "test-id",
				Choices: []Choice{
					{Message: Message{Role: "assistant", Content: "Hello"}},
				},
			}
			json.NewEncoder(w).Encode(resp)
		}))
		defer server.Close()

		// Override the API URL to point to the mock server
		originalURL := openRouterAPIURL
		openRouterAPIURL = server.URL
		defer func() { openRouterAPIURL = originalURL }()

		client, err := NewClient()
		if err != nil {
			t.Fatalf("Failed to create client: %v", err)
		}

		req := ChatRequest{Model: "test-model", Messages: []Message{{Role: "user", Content: "Hi"}}}
		resp, err := client.CreateChatCompletion(context.Background(), req)

		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		if resp.ID != "test-id" {
			t.Errorf("Expected response ID to be 'test-id', got '%s'", resp.ID)
		}
		if len(resp.Choices) != 1 || resp.Choices[0].Message.Content != "Hello" {
			t.Errorf("Unexpected response content: %+v", resp.Choices)
		}
	})

	t.Run("unauthorized request", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusUnauthorized)
		}))
		defer server.Close()

		originalURL := openRouterAPIURL
		openRouterAPIURL = server.URL
		defer func() { openRouterAPIURL = originalURL }()

		client, _ := NewClient()
		_, err := client.CreateChatCompletion(context.Background(), ChatRequest{})

		if err == nil {
			t.Fatal("Expected an error, got nil")
		}
		if err != ErrUnauthorized {
			t.Errorf("Expected error to be ErrUnauthorized, got %v", err)
		}
	})

	t.Run("server error with retry", func(t *testing.T) {
		retryCount := 0
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if retryCount == 0 {
				w.WriteHeader(http.StatusInternalServerError)
				retryCount++
				return
			}
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(ChatResponse{ID: "retry-success"})
		}))
		defer server.Close()

		originalURL := openRouterAPIURL
		openRouterAPIURL = server.URL
		defer func() { openRouterAPIURL = originalURL }()

		client, _ := NewClient()
		// Use a short backoff for testing
		client.httpClient = httpclient.New(1*time.Second, 1, 10*time.Millisecond)

		resp, err := client.CreateChatCompletion(context.Background(), ChatRequest{})

		if err != nil {
			t.Fatalf("Expected no error after retry, got %v", err)
		}
		if resp.ID != "retry-success" {
			t.Errorf("Expected response ID to be 'retry-success', got '%s'", resp.ID)
		}
		if retryCount != 1 {
			t.Errorf("Expected server to be called twice, was called %d times", retryCount+1)
		}
	})
}
