package httpclient

import (
	"math"
	"math/rand"
	"net/http"
	"time"
)

// RetryableClient is a wrapper around http.Client that provides retry logic.
type RetryableClient struct {
	httpClient *http.Client
	retries    int
	backoff    time.Duration
}

// New creates a new RetryableClient.
func New(timeout time.Duration, retries int, backoff time.Duration) *RetryableClient {
	return &RetryableClient{
		httpClient: &http.Client{
			Timeout: timeout,
		},
		retries: retries,
		backoff: backoff,
	}
}

// Do executes an HTTP request with retry logic.
func (c *RetryableClient) Do(req *http.Request) (*http.Response, error) {
	var resp *http.Response
	var err error

	for i := 0; i <= c.retries; i++ {
		resp, err = c.httpClient.Do(req)
		if err != nil {
			// If there is a network error, we can retry
			time.Sleep(c.getBackoffWithJitter(i))
			continue
		}

		// Retry on 429 or 5xx status codes
		if resp.StatusCode == http.StatusTooManyRequests || (resp.StatusCode >= 500 && resp.StatusCode <= 599) {
			// It's important to close the response body to avoid leaking connections
			if resp.Body != nil {
				resp.Body.Close()
			}
			time.Sleep(c.getBackoffWithJitter(i))
			continue
		}

		// If the status code is not a server error, we are done
		return resp, nil
	}

	return resp, err
}

func (c *RetryableClient) getBackoffWithJitter(attempt int) time.Duration {
	if attempt == 0 {
		return c.backoff
	}
	// Exponential backoff with jitter
	backoff := float64(c.backoff) * math.Pow(2, float64(attempt))
	jitter := (rand.Float64() - 0.5) * backoff * 0.5 // Jitter up to 25%
	return time.Duration(backoff + jitter)
}
