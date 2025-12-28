package response

import "time"

type ProjectResponseDto struct {
	Id          int                         `json:"id"`
	Name        string                      `json:"name"`
	Description string                      `json:"description"`
	Tasks       []TaskResponseForProjectDto `json:"tasks"`
	CreatedAt   time.Time                   `json:"createdAt"`
	UpdatedAt   time.Time                   `json:"updatedAt"`
}
