package request

type TaskRequestDto struct {
	Title       string `json:"title" example:"Task 1"`
	Description string `json:"description" example:"This is the first task in the project."`
	Status      string `json:"status" example:"pending"`
	UserId      int    `json:"userId" example:"1"`
}

type CreateTaskRequestDto struct {
	Title       string `json:"title" validate:"required,min=5,max=100" example:"Task 1"`
	Description string `json:"description" validate:"required,min=10,max=300" example:"This is the first task in the project."`
}

type UpdateTaskRequestDto struct {
	Title       string `json:"title" validate:"required,min=5,max=100" example:"Task 1"`
	Description string `json:"description" validate:"required,min=10,max=300" example:"This is the first task in the project."`
	Status      string `json:"status" validate:"required,oneof=pending ongoing completed blocked cancelled" example:"pending"`
}
