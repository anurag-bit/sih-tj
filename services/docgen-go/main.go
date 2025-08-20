package main

import (
	"log/slog"
	"net/http"
	"os"
	"services/docgen-go/artifact"
	"services/docgen-go/handlers"
	"services/docgen-go/openrouter"
	"services/docgen-go/prompts"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

const (
	artifactBasePath = "/tmp/docgen"
	janitorInterval  = 5 * time.Minute
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	// Load prompts
	if err := prompts.LoadPrompts("./prompts"); err != nil {
		slog.Error("failed to load prompts", "error", err)
		os.Exit(1)
	}
	slog.Info("Prompts loaded successfully")

	// Create OpenRouter client
	orClient, err := openrouter.NewClient()
	if err != nil {
		slog.Error("failed to create OpenRouter client", "error", err)
		os.Exit(1)
	}

	// Create Artifact store
	artifactStore, err := artifact.NewStore(artifactBasePath)
	if err != nil {
		slog.Error("failed to create artifact store", "error", err)
		os.Exit(1)
	}
	// Start the cleanup janitor
	artifactStore.StartJanitor(janitorInterval)
	slog.Info("Artifact store initialized and janitor started", "path", artifactBasePath)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	// V1 routes
	r.Route("/v1/docgen", func(r chi.Router) {
		summaryHandler := handlers.NewSummaryHandler(orClient)
		planHandler := handlers.NewPlanHandler(orClient)
		designHandler := handlers.NewDesignHandler(orClient)
		fullHandler := handlers.NewFullHandler()
		exportHandler := handlers.NewExportHandler(artifactStore)
		filesHandler := handlers.NewFilesHandler(artifactStore)

		r.Mount("/summary", summaryHandler)
		r.Mount("/plan", planHandler)
		r.Mount("/design", designHandler)
		r.Mount("/full", fullHandler)
		r.Mount("/export", exportHandler)
		r.Get("/files/{id}/{filename}", filesHandler.ServeHTTP)
	})

	slog.Info("Starting server on :8080")
	if err := http.ListenAndServe(":8080", r); err != nil {
		slog.Error("server failed to start", "error", err)
		os.Exit(1)
	}
}
