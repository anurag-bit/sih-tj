# TODO List

This file tracks tasks that could not be completed automatically and require manual intervention.

## Pending Validations

- **Kubernetes Manifest Validation**: The `kubectl` command was not available in the agent's environment. The following manifest needs to be validated manually using `kubectl apply --dry-run=server`:
  - `infrastructure/k8s/docgen-go.yaml`

- **Backend Proxy Testing**: The unit tests for the `docgen` router in the backend (`backend/tests/test_docgen_router.py`) are incomplete. The current application design makes it difficult to mock the `httpx` calls to the `docgen-go` service. To properly test this, the `httpx.AsyncClient` should be provided through FastAPI's dependency injection system, which would allow it to be overridden in tests. This is a recommended refactoring for the backend application.

- **Frontend Component Testing**: React Testing Library tests should be written for the new frontend components (`DocumentsPanel.tsx`) and the new functionality within `ChatInterface.tsx`. This includes testing the docgen toggle, scope selection, API calls, and the rendering of generated documents and download links. These tests were not implemented due to the inability to run the frontend test suite in the agent's environment.

## Missing Features

- **Kroki Integration**: The `docgen-go` service does not currently implement the optional rendering of diagrams to SVG via a Kroki service. This would involve creating a `renderers/kroki.go` package and adding logic to the `design` handler to call the Kroki API.
- **Request Body Size Limit**: The Go service handlers do not enforce the 32KB request body size limit as specified in the requirements. This should be added as a middleware to reject requests with a `413 Payload Too Large` status.
