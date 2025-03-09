package request

type CreateProjectRequestDto struct {
	Name        string `json:"name" validate:"required,min=5,max=100"`
	Description string `json:"description" validate:"required,min=20,max=300"`
}

type UpdateProjectRequestDto struct {
	Name        string `json:"name" validate:"required,min=5,max=100"`
	Description string `json:"description" validate:"required,min=20,max=300"`
}
