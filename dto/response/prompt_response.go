package response

import "time"

type PromptResponse struct {
	ID           int64     `json:"id"`
	Title        string    `json:"title" validate:"required,max=150"`
	Description  string    `json:"description"`
	SystemPrompt string    `json:"systemPrompt" validate:"required"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}
