package prompts

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

// Prompt defines the structure for a prompt template.
type Prompt struct {
	ID          string   `json:"id"`
	Description string   `json:"description"`
	Template    string   `json:"template"`
	Constraints []string `json:"constraints"`
	Outputs     []string `json:"outputs"`
	Tags        []string `json:"tags"`
}

var (
	promptStore map[string]Prompt
	once        sync.Once
	loadErr     error
)

// LoadPrompts loads all prompt templates from the given directory.
// It's safe for concurrent use.
func LoadPrompts(dir string) error {
	once.Do(func() {
		promptStore = make(map[string]Prompt)
		files, err := filepath.Glob(filepath.Join(dir, "*.json"))
		if err != nil {
			loadErr = fmt.Errorf("failed to find prompt files: %w", err)
			return
		}

		if len(files) == 0 {
			loadErr = fmt.Errorf("no prompt files found in directory: %s", dir)
			return
		}

		for _, file := range files {
			data, err := os.ReadFile(file)
			if err != nil {
				loadErr = fmt.Errorf("failed to read prompt file %s: %w", file, err)
				return
			}

			var p Prompt
			if err := json.Unmarshal(data, &p); err != nil {
				loadErr = fmt.Errorf("failed to unmarshal prompt file %s: %w", file, err)
				return
			}

			if p.ID == "" {
				loadErr = fmt.Errorf("prompt file %s has no ID", file)
				return
			}
			promptStore[p.ID] = p
		}
	})
	return loadErr
}

// GetPrompt returns a prompt by its ID.
// It returns an error if the prompt is not found or if loading failed.
func GetPrompt(id string) (Prompt, error) {
	if loadErr != nil {
		return Prompt{}, fmt.Errorf("failed to load prompts: %w", loadErr)
	}
	if promptStore == nil {
		return Prompt{}, fmt.Errorf("prompts have not been loaded")
	}

	p, ok := promptStore[id]
	if !ok {
		return Prompt{}, fmt.Errorf("prompt with id '%s' not found", id)
	}
	return p, nil
}
