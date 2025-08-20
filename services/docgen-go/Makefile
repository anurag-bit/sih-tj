# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOTEST=$(GOCMD) test
GOMOD=$(GOCMD) mod
BINARY_NAME=docgen-go
PKG_LIST=$(shell go list ./... | grep -v /vendor/)

.PHONY: all build test clean tidy

all: build

# Build the binary
build:
	@echo "Building $(BINARY_NAME)..."
	@$(GOBUILD) -o $(BINARY_NAME) .

# Run tests
test:
	@echo "Running tests..."
	@$(GOTEST) -v $(PKG_LIST)

# Clean up binaries
clean:
	@echo "Cleaning up..."
	@rm -f $(BINARY_NAME)

# Tidy go.mod
tidy:
	@echo "Tidying go.mod..."
	@$(GOMOD) tidy
