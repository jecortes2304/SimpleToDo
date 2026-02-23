package request

type CreatePromptRequest struct {
	Title        string `json:"title" validate:"required,max=150"`
	Description  string `json:"description"`
	SystemPrompt string `json:"systemPrompt" validate:"required"`
}

type UpdatePromptRequest struct {
	Title        string `json:"title" validate:"max=150"`
	Description  string `json:"description"`
	SystemPrompt string `json:"systemPrompt"`
}
