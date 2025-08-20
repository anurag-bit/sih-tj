package handlers

// Diagram represents a diagram to be included in the documentation.
type Diagram struct {
	ID       string `json:"id"`
	Type     string `json:"type"`
	Language string `json:"language"`
	Title    string `json:"title,omitempty"`
	Code     string `json:"code"`
}
