package mapper

import (
	response2 "simpletodo/internal/dto/response"
	"simpletodo/internal/models"
)

type ProjectMapperImpl struct {
	projectEntity *models.Project
	projectDto    *response2.ProjectResponseDto
	taskMapper    *TaskMapperImpl
}

func NewProjectMapperImpl() *ProjectMapperImpl {
	return &ProjectMapperImpl{}
}

func (p *ProjectMapperImpl) ToDtoForProjects(taskEntity *models.Task) response2.TaskResponseForProjectDto {

	return response2.TaskResponseForProjectDto{
		Id:          int(taskEntity.ID),
		Title:       taskEntity.Title,
		Description: taskEntity.Description,
		StatusId:    int(taskEntity.StatusId),
		UserId:      int(taskEntity.UserId),
		ProjectId:   int(taskEntity.ProjectId),
	}
}

func (p *ProjectMapperImpl) ToDto(projectEntity *models.Project) response2.ProjectResponseDto {
	var tasksDto = make([]response2.TaskResponseForProjectDto, 0)

	for _, task := range projectEntity.Tasks {
		taskDto := p.ToDtoForProjects(&task)
		tasksDto = append(tasksDto, taskDto)
	}

	return response2.ProjectResponseDto{
		Id:          int(projectEntity.ID),
		Name:        projectEntity.Name,
		Description: projectEntity.Description,
		Tasks:       tasksDto,
		CreatedAt:   projectEntity.CreatedAt,
		UpdatedAt:   projectEntity.UpdatedAt,
	}
}

func (p *ProjectMapperImpl) ToEntity(projectDto response2.ProjectResponseDto) *models.Project {
	return &models.Project{
		Name:        projectDto.Name,
		Description: projectDto.Description,
		Tasks:       []models.Task{},
	}
}
