package response

import (
	"time"
)

type TaskResponseDto struct {
	Id          int       `json:"id"`
	Title       string    `json:"title" form:"title" validate:"required"`
	Description string    `json:"description" form:"description"`
	Status      string    `json:"status" form:"status"`
	StatusId    int       `json:"statusId" form:"statusId"`
	UserId      int       `json:"userId" form:"userId"`
	ProjectId   int       `json:"projectId" form:"projectId"`
	CreatedAt   time.Time `json:"createdAt" form:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt" form:"updatedAt"`
}

type TaskResponseForProjectDto struct {
	Id          int    `json:"id"`
	Title       string `json:"title" form:"title" validate:"required"`
	Description string `json:"description" form:"description"`
	StatusId    int    `json:"statusId" form:"statusId"`
	UserId      int    `json:"userId" form:"userId"`
	ProjectId   int    `json:"projectId" form:"projectId"`
}
