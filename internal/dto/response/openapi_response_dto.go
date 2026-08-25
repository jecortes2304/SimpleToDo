package response

// These envelopes describe the concrete JSON returned by WriteJSONResponse.
// Runtime handlers can remain generic while the generated API contract stays typed.

type EmptyResponse struct {
	StandardResponse
	Result any `json:"result" swaggertype:"object"`
}

type StringResponse struct {
	StandardResponse
	Result string `json:"result" example:"OK"`
}

type LoginResult struct {
	Token string `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
}

type LoginResponse struct {
	StandardResponse
	Result LoginResult `json:"result"`
}

type CurrentUserResult struct {
	ID    uint   `json:"id" example:"1"`
	Email string `json:"email" example:"jdoe@example.com"`
	Role  string `json:"role" example:"USER"`
}

type CurrentUserResponse struct {
	StandardResponse
	Result CurrentUserResult `json:"result"`
}

type AuthProvidersResult struct {
	Google bool `json:"google" example:"true"`
}

type AuthProvidersResponse struct {
	StandardResponse
	Result AuthProvidersResult `json:"result"`
}

type ProjectResponse struct {
	StandardResponse
	Result ProjectResponseDto `json:"result"`
}

type ProjectsPage struct {
	Limit      int                  `json:"limit" example:"10"`
	Page       int                  `json:"page" example:"1"`
	Sort       string               `json:"sort" example:"id desc"`
	Search     string               `json:"search" example:"website"`
	TotalItems int64                `json:"totalItems" example:"24"`
	TotalPages int                  `json:"totalPages" example:"3"`
	Items      []ProjectResponseDto `json:"items"`
}

type ProjectsResponse struct {
	StandardResponse
	Result ProjectsPage `json:"result"`
}

type TaskResponse struct {
	StandardResponse
	Result TaskResponseDto `json:"result"`
}

type TasksPage struct {
	Limit      int               `json:"limit" example:"10"`
	Page       int               `json:"page" example:"1"`
	Sort       string            `json:"sort" example:"id desc"`
	Search     string            `json:"search" example:"documentation"`
	TotalItems int64             `json:"totalItems" example:"24"`
	TotalPages int               `json:"totalPages" example:"3"`
	Items      []TaskResponseDto `json:"items"`
}

type TasksResponse struct {
	StandardResponse
	Result TasksPage `json:"result"`
}

type PromptItemResponse struct {
	StandardResponse
	Result PromptResponse `json:"result"`
}

type PromptsPage struct {
	Limit      int              `json:"limit" example:"10"`
	Page       int              `json:"page" example:"1"`
	Sort       string           `json:"sort" example:"id desc"`
	Search     string           `json:"search" example:"extract task"`
	TotalItems int64            `json:"totalItems" example:"24"`
	TotalPages int              `json:"totalPages" example:"3"`
	Items      []PromptResponse `json:"items"`
}

type PromptsResponse struct {
	StandardResponse
	Result PromptsPage `json:"result"`
}

type UserResponse struct {
	StandardResponse
	Result UserResponseDto `json:"result"`
}

type UsersPage struct {
	Limit      int               `json:"limit" example:"10"`
	Page       int               `json:"page" example:"1"`
	Sort       string            `json:"sort" example:"id desc"`
	Search     string            `json:"search" example:"john"`
	TotalItems int64             `json:"totalItems" example:"24"`
	TotalPages int               `json:"totalPages" example:"3"`
	Items      []UserResponseDto `json:"items"`
}

type UsersResponse struct {
	StandardResponse
	Result UsersPage `json:"result"`
}

type AISettingsResponse struct {
	StandardResponse
	Result AISettingsResponseDto `json:"result"`
}
