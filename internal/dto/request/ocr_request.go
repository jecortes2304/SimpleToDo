package request

type AnalyzeImageRequest struct {
	ImageBase64 string `json:"imageBase64" validate:"required"`
}
