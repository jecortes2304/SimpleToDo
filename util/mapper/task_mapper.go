package mapper

import (
	"SimpleToDo/dto/response"
	"SimpleToDo/models"
	"gorm.io/gorm"
)

type TaskMapperImpl struct {
	taskEntity *models.Task
	taskDto    *response.TaskResponseDto
}

func NewTaskMapperImpl() *TaskMapperImpl {
	return &TaskMapperImpl{}
}

func (t *TaskMapperImpl) ToDto(taskEntity *models.Task) response.TaskResponseDto {

	return response.TaskResponseDto{
		Id:          int(taskEntity.ID),
		Title:       taskEntity.Title,
		Description: taskEntity.Description,
		Status:      taskEntity.Status.Value,
		StatusId:    int(taskEntity.StatusId),
		UserId:      int(taskEntity.UserId),
		ProjectId:   int(taskEntity.ProjectId),
		CreatedAt:   taskEntity.CreatedAt,
		UpdatedAt:   taskEntity.UpdatedAt,
	}
}

func (t *TaskMapperImpl) ToEntity(taskDto response.TaskResponseDto) *models.Task {

	return &models.Task{
		Model:       gorm.Model{},
		Title:       taskDto.Title,
		Description: taskDto.Description,
		StatusId:    uint(taskDto.StatusId),
		UserId:      uint(taskDto.UserId),
		ProjectId:   uint(taskDto.ProjectId),
		Status:      models.Status{},
		User:        models.User{},
		Project:     models.Project{},
	}
}
