package service

import (
	"errors"
	"simpletodo/internal/dto/request"
	response2 "simpletodo/internal/dto/response"
	"simpletodo/internal/models"
	"simpletodo/internal/repository"
	"simpletodo/internal/util/mapper"
)

type ProjectService struct {
	ProjectRepository *repository.ProjectRepository
	ProjectMapper     *mapper.ProjectMapperImpl
}

func NewProjectService(projectRepo *repository.ProjectRepository, projectMapper *mapper.ProjectMapperImpl) *ProjectService {
	return &ProjectService{
		ProjectRepository: projectRepo,
		ProjectMapper:     projectMapper,
	}
}

func (projectService *ProjectService) GetAllByUserId(pagination response2.Pagination, userId int) (*response2.Pagination, error) {
	projectsPaginated, err := projectService.ProjectRepository.FindAllByUserId(pagination, userId)
	if err != nil {
		return nil, err
	}
	projects, ok := projectsPaginated.Items.([]*models.Project)
	if !ok {
		return nil, errors.New("error converting projects to project entity")
	}

	var projectsResponse = make([]response2.ProjectResponseDto, 0)
	for _, project := range projects {
		projectDto := projectService.ProjectMapper.ToDto(project)
		projectsResponse = append(projectsResponse, projectDto)
	}

	projectsPaginated.Items = projectsResponse
	return projectsPaginated, nil
}

func (projectService *ProjectService) GetAll(pagination response2.Pagination) (*response2.Pagination, error) {
	projectsPaginated, err := projectService.ProjectRepository.FindAll(pagination)
	if err != nil {
		return nil, err
	}
	projects, ok := projectsPaginated.Items.([]*models.Project)
	if !ok {
		return nil, errors.New("error converting projects to project entity")
	}

	var projectsResponse = make([]response2.ProjectResponseDto, 0)
	for _, project := range projects {
		projectDto := projectService.ProjectMapper.ToDto(project)
		projectsResponse = append(projectsResponse, projectDto)
	}

	projectsPaginated.Items = projectsResponse
	return projectsPaginated, nil
}

func (projectService *ProjectService) GetProjectById(id int) (response2.ProjectResponseDto, error) {
	project, err := projectService.ProjectRepository.FindById(id)
	if err != nil {
		return response2.ProjectResponseDto{}, err
	}
	return projectService.ProjectMapper.ToDto(&project), nil
}

func (projectService *ProjectService) SaveProject(projectToCreate *request.CreateProjectRequestDto, userId int) (response2.ProjectResponseDto, error) {
	projectEntity := models.Project{
		Name:        projectToCreate.Name,
		Description: projectToCreate.Description,
	}

	projectResponse, err := projectService.ProjectRepository.Save(projectEntity, userId)
	if err != nil {
		return response2.ProjectResponseDto{}, err
	}

	return projectService.ProjectMapper.ToDto(&projectResponse), nil
}

func (projectService *ProjectService) UpdateProject(projectUpdate *request.UpdateProjectRequestDto, id int) (response2.ProjectResponseDto, error) {
	projectEntity := models.Project{
		Name:        projectUpdate.Name,
		Description: projectUpdate.Description,
	}

	projectResponse, err := projectService.ProjectRepository.Update(projectEntity, id)
	if err != nil {
		return response2.ProjectResponseDto{}, err
	}

	return projectService.ProjectMapper.ToDto(&projectResponse), nil
}

func (projectService *ProjectService) DeleteProject(id int) error {
	return projectService.ProjectRepository.Delete(id)
}
