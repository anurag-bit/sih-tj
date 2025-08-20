package artifact

import (
	"os"
	"testing"
	"time"
)

func TestArtifactStore(t *testing.T) {
	basePath := t.TempDir()
	store, err := NewStore(basePath)
	if err != nil {
		t.Fatalf("Failed to create store: %v", err)
	}

	t.Run("CreateNew", func(t *testing.T) {
		art, err := store.CreateNew()
		if err != nil {
			t.Fatalf("Failed to create artifact: %v", err)
		}
		if art.ID == "" {
			t.Error("Expected artifact to have an ID")
		}
		if _, err := os.Stat(art.Path); os.IsNotExist(err) {
			t.Errorf("Expected artifact directory to be created at %s", art.Path)
		}
	})

	t.Run("WriteFile", func(t *testing.T) {
		art, _ := store.CreateNew()
		testData := []byte("hello world")
		path, err := art.WriteFile("test.txt", testData)
		if err != nil {
			t.Fatalf("Failed to write file: %v", err)
		}
		if _, err := os.Stat(path); os.IsNotExist(err) {
			t.Errorf("Expected file to be created at %s", path)
		}
		data, _ := os.ReadFile(path)
		if string(data) != "hello world" {
			t.Errorf("Expected file content to be 'hello world', got '%s'", string(data))
		}
	})
}

func TestJanitor(t *testing.T) {
	basePath := t.TempDir()
	// Use a very short TTL for testing
	store, err := NewStore(basePath)
	if err != nil {
		t.Fatalf("Failed to create store: %v", err)
	}
	store.ttl = 10 * time.Millisecond

	// Create an old artifact
	oldArt, _ := store.CreateNew()
	// Create a new artifact
	newArt, _ := store.CreateNew()

	// Make the old artifact's mod time ancient
	ancientTime := time.Now().Add(-1 * time.Hour)
	if err := os.Chtimes(oldArt.Path, ancientTime, ancientTime); err != nil {
		t.Fatalf("Failed to change mod time: %v", err)
	}

	// Run cleanup
	store.cleanup()

	// Check that the old artifact is gone
	if _, err := os.Stat(oldArt.Path); !os.IsNotExist(err) {
		t.Errorf("Expected old artifact directory to be deleted, but it still exists at %s", oldArt.Path)
	}

	// Check that the new artifact is still there
	if _, err := os.Stat(newArt.Path); os.IsNotExist(err) {
		t.Errorf("Expected new artifact directory to exist, but it was deleted from %s", newArt.Path)
	}
}
