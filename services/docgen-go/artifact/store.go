package artifact

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

const (
	defaultTTL = 15 * time.Minute
)

// Store manages artifacts on the filesystem.
type Store struct {
	basePath string
	ttl      time.Duration
}

// Artifact represents a single generated artifact bundle.
type Artifact struct {
	ID   string
	Path string
}

// NewStore creates a new artifact store.
func NewStore(basePath string) (*Store, error) {
	if err := os.MkdirAll(basePath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create artifact base path: %w", err)
	}
	return &Store{
		basePath: basePath,
		ttl:      defaultTTL,
	}, nil
}

// CreateNew creates a new directory for an artifact bundle.
func (s *Store) CreateNew() (*Artifact, error) {
	id := uuid.New().String()
	path := filepath.Join(s.basePath, id)

	if err := os.Mkdir(path, 0755); err != nil {
		return nil, fmt.Errorf("failed to create artifact directory: %w", err)
	}

	return &Artifact{
		ID:   id,
		Path: path,
	}, nil
}

// WriteFile writes a file to the artifact's directory.
func (a *Artifact) WriteFile(filename string, data []byte) (string, error) {
	path := filepath.Join(a.Path, filename)
	if err := os.WriteFile(path, data, 0644); err != nil {
		return "", fmt.Errorf("failed to write artifact file: %w", err)
	}
	return path, nil
}

// GetFilePath returns the full path for a given filename within the artifact.
func (a *Artifact) GetFilePath(filename string) string {
	return filepath.Join(a.Path, filename)
}

// StartJanitor starts a background goroutine to clean up expired artifacts.
func (s *Store) StartJanitor(interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for range ticker.C {
			s.cleanup()
		}
	}()
}

func (s *Store) cleanup() {
	slog.Info("Running artifact cleanup janitor...")
	files, err := os.ReadDir(s.basePath)
	if err != nil {
		slog.Error("failed to read artifact directory for cleanup", "error", err)
		return
	}

	for _, file := range files {
		if !file.IsDir() {
			continue
		}

		info, err := file.Info()
		if err != nil {
			slog.Error("failed to get file info for cleanup", "error", err, "file", file.Name())
			continue
		}

		if time.Since(info.ModTime()) > s.ttl {
			path := filepath.Join(s.basePath, file.Name())
			slog.Info("Deleting expired artifact directory", "path", path)
			if err := os.RemoveAll(path); err != nil {
				slog.Error("failed to delete expired artifact", "error", err, "path", path)
			}
		}
	}
}

// GetArtifactPath returns the path to an artifact directory if it exists.
func (s *Store) GetArtifactPath(id, filename string) (string, error) {
	path := filepath.Join(s.basePath, id, filename)
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return "", fmt.Errorf("artifact not found: %s/%s", id, filename)
	}
	return path, nil
}
