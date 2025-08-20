# ---- Builder Stage ----
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./
# Download all dependencies.
# Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# Copy the source code
COPY . .

# Build the Go app
# CGO_ENABLED=0 is important for a static binary
# -ldflags="-w -s" strips debug information, reducing binary size
RUN CGO_ENABLED=0 GOOS=linux go build -a -ldflags="-w -s" -o /app/docgen-go .

# ---- Final Stage ----
FROM gcr.io/distroless/static-debian11

WORKDIR /

# Copy the Pre-built binary file from the previous stage
COPY --from=builder /app/docgen-go /docgen-go
COPY --from=builder /app/prompts /prompts

# This container exposes port 8080 to the outside world
EXPOSE 8080

# Command to run the executable
ENTRYPOINT ["/docgen-go"]
