package v1

import (
	"SimpleToDo/dto/request"
	"SimpleToDo/dto/response"
	"SimpleToDo/repository"
	"SimpleToDo/service"
	"SimpleToDo/util/mapper"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"net/http"
	"strconv"
)

type ProjectController struct {
	ProjectService *service.ProjectService
}

func NewProjectController(projectService *service.ProjectService) *ProjectController {
	return &ProjectController{ProjectService: projectService}
}

func (p *ProjectController) getAllProjects(c echo.Context) error {
	pagination, err := validatePagination(c)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Bad request error", err.Error(), true)
	}
	projects, err := p.ProjectService.GetAll(pagination)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Internal Server Error", err.Error(), true)
	}
	return response.WriteJSONResponse(c, http.StatusOK, "Projects fetched successfully", projects, false)
}

func (p *ProjectController) getProjectById(c echo.Context) error {
	projectId := c.Param("id")
	projectIdInt, err := strconv.Atoi(projectId)
	if err != nil || projectIdInt < 1 {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Invalid Project ID", true)
	}
	projectResponse, err := p.ProjectService.GetProjectById(projectIdInt)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusNotFound, "Error getting project", err.Error(), true)
	}
	return response.WriteJSONResponse(c, http.StatusOK, "Project fetched successfully", projectResponse, false)
}

func (p *ProjectController) deleteProject(c echo.Context) error {
	projectId := c.Param("id")
	projectIdInt, err := strconv.Atoi(projectId)
	if err != nil || projectIdInt < 1 {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Invalid Project ID", true)
	}
	err = p.ProjectService.DeleteProject(projectIdInt)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusNotFound, "Error getting project", err.Error(), true)
	}
	return response.WriteJSONResponse(c, http.StatusOK, "Project deleted successfully", "OK", false)
}

func (p *ProjectController) saveProject(c echo.Context) error {
	project := new(request.CreateProjectRequestDto)
	if err := c.Bind(project); err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", err.Error(), true)
	}

	projectResponse, err := p.ProjectService.SaveProject(project)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Internal Server Error", err.Error(), true)
	}

	return response.WriteJSONResponse(c, http.StatusCreated, "Project created successfully", projectResponse, false)
}

func (p *ProjectController) updateProject(c echo.Context) error {
	projectId := c.Param("id")
	projectIdInt, err := strconv.Atoi(projectId)
	if err != nil || projectIdInt < 1 {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Invalid Project ID", true)
	}

	project := new(request.UpdateProjectRequestDto)
	if err := c.Bind(project); err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", err.Error(), true)
	}

	projectResponse, err := p.ProjectService.UpdateProject(project, 1)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Internal Server Error", err.Error(), true)
	}

	return response.WriteJSONResponse(c, http.StatusOK, "Project updated successfully", projectResponse, false)
}

func ProjectRoutes(c *echo.Echo, db *gorm.DB) {
	projectRepository := repository.NewProjectRepository(db)
	projectMapper := mapper.NewProjectMapperImpl()

	projectService := service.NewProjectService(projectRepository, projectMapper)
	projectController := NewProjectController(projectService)

	projectGroup := c.Group("/projects")
	projectGroup.GET("", projectController.getAllProjects)
	projectGroup.GET("/project/:id", projectController.getProjectById)
	projectGroup.DELETE("/project/:id", projectController.deleteProject)
	projectGroup.POST("/project", projectController.saveProject)
	projectGroup.PUT("/project/:id", projectController.updateProject)
}
