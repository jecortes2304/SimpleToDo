package request

type CreateProjectRequestDto struct {
	Name        string `json:"name" validate:"required,min=5,max=100" example:"Project Alpha"`
	Description string `json:"description" validate:"required,min=20,max=300" example:"This project aims to develop a new software solution for managing tasks efficiently."`
}

type UpdateProjectRequestDto struct {
	Name        string `json:"name" validate:"required,min=5,max=100" example:"Project Alpha"`
	Description string `json:"description" validate:"required,min=20,max=300" example:"This project aims to develop a new software solution for managing tasks efficiently."`
}
