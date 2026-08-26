package response

type AISettingsResponseDto struct {
	BaseUrl string `json:"baseUrl"`
	APIKey  string `json:"apiKey"`
	Model   string `json:"model"`
}
