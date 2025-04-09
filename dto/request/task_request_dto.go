package request

type TaskRequestDto struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
	UserId      int    `json:"userId"`
}

type CreateTaskRequestDto struct {
	Title       string `json:"title" validate:"required,min=5,max=100"`
	Description string `json:"description" validate:"required,min=10,max=300"`
}

type UpdateTaskRequestDto struct {
	Title       string `json:"title" validate:"required,min=5,max=100"`
	Description string `json:"description" validate:"required,min=10,max=300"`
	Status      string `json:"status" validate:"required,oneof=pending ongoing completed blocked cancelled"`
}
