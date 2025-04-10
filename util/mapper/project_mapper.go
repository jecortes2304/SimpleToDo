package mapper

import (
	"SimpleToDo/dto/response"
	"SimpleToDo/models"
)

type ProjectMapperImpl struct {
	projectEntity *models.Project
	projectDto    *response.ProjectResponseDto
	taskMapper    *TaskMapperImpl
}

func NewProjectMapperImpl() *ProjectMapperImpl {
	return &ProjectMapperImpl{}
}

func (p *ProjectMapperImpl) ToDtoForProjects(taskEntity *models.Task) response.TaskResponseForProjectDto {

	return response.TaskResponseForProjectDto{
		Id:          int(taskEntity.ID),
		Title:       taskEntity.Title,
		Description: taskEntity.Description,
		StatusId:    int(taskEntity.StatusId),
		UserId:      int(taskEntity.UserId),
		ProjectId:   int(taskEntity.ProjectId),
	}
}

func (p *ProjectMapperImpl) ToDto(projectEntity *models.Project) response.ProjectResponseDto {
	var tasksDto = make([]response.TaskResponseForProjectDto, 0)

	for _, task := range projectEntity.Tasks {
		taskDto := p.ToDtoForProjects(&task)
		tasksDto = append(tasksDto, taskDto)
	}

	return response.ProjectResponseDto{
		Id:          int(projectEntity.ID),
		Name:        projectEntity.Name,
		Description: projectEntity.Description,
		Tasks:       tasksDto,
		CreatedAt:   projectEntity.CreatedAt,
		UpdatedAt:   projectEntity.UpdatedAt,
	}
}

func (p *ProjectMapperImpl) ToEntity(projectDto response.ProjectResponseDto) *models.Project {
	return &models.Project{
		Name:        projectDto.Name,
		Description: projectDto.Description,
		Tasks:       []models.Task{},
	}
}
