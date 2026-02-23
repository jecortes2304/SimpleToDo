package request

type UpdateAISettingsRequest struct {
	BaseUrl string `json:"baseUrl" validate:"required,url"`
	APIKey  string `json:"apiKey" validate:"required"`
	Model   string `json:"model" validate:"required"`
}
