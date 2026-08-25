package request

type UpsertPromptRequest struct {
	Title        string `json:"title" validate:"max=150"`
	Description  string `json:"description"`
	SystemPrompt string `json:"systemPrompt"`
}
