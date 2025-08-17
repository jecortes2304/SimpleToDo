package v1

import (
	"SimpleToDo/dto/request"
	"SimpleToDo/dto/response"
	"SimpleToDo/middleware"
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

func (p *ProjectController) getAllProjectsByUser(c echo.Context) error {
	userId := c.Get("user_id").(float64)

	userIdInt, err := strconv.Atoi(strconv.FormatFloat(userId, 'f', 0, 64))
	if err != nil || userIdInt < 1 {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Invalid User ID", true)
	}

	pagination, err := validatePagination(c)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Bad request error", err.Error(), true)
	}
	projects, err := p.ProjectService.GetAllByUserId(pagination, userIdInt)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Internal Server Error", err.Error(), true)
	}
	return response.WriteJSONResponse(c, http.StatusOK, "Projects fetched successfully", projects, false)
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
	userId := c.Get("user_id").(float64)

	userIdInt, err := strconv.Atoi(strconv.FormatFloat(userId, 'f', 0, 64))
	if err != nil || userIdInt < 1 {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Invalid User ID", true)
	}
	project := new(request.CreateProjectRequestDto)
	if err := c.Bind(project); err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", err.Error(), true)
	}

	projectResponse, err := p.ProjectService.SaveProject(project, userIdInt)
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

	projectResponse, err := p.ProjectService.UpdateProject(project, projectIdInt)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Internal Server Error", err.Error(), true)
	}

	return response.WriteJSONResponse(c, http.StatusOK, "Project updated successfully", projectResponse, false)
}

func ProjectRoutes(db *gorm.DB, apiV1 *echo.Group) {
	projectRepository := repository.NewProjectRepository(db)
	projectMapper := mapper.NewProjectMapperImpl()

	projectService := service.NewProjectService(projectRepository, projectMapper)
	projectController := NewProjectController(projectService)

	projectGroup := apiV1.Group("/projects")
	projectGroup.Use(middleware.JWTMiddleware)

	// @Summary      List all projects for the current user
	// @Tags         Projects
	// @Security     BearerAuth
	// @Produce      json
	// @Param        limit query int false "Limit per page" default(10)
	// @Param        page  query int false "Page number" default(1)
	// @Param        sort  query string false "Sort order" Enums(asc, desc) default(asc)
	// @Success      200 {object} response.StandardResponseOk
	// @Failure      400 {object} response.StandardResponseError
	// @Failure      500 {object} response.StandardResponseError
	// @Router       /projects/user [get]
	projectGroup.GET("/user", projectController.getAllProjectsByUser)

	// @Summary      List all projects
	// @Tags         Projects
	// @Security     BearerAuth
	// @Produce      json
	// @Param        limit query int false "Limit per page" default(10)
	// @Param        page  query int false "Page number" default(1)
	// @Param        sort  query string false "Sort order" Enums(asc, desc) default(asc)
	// @Success      200 {object} response.StandardResponseOk
	// @Failure      400 {object} response.StandardResponseError
	// @Failure      500 {object} response.StandardResponseError
	// @Router       /projects [get]
	projectGroup.GET("", projectController.getAllProjects)

	// @Summary      Get a project by ID
	// @Tags         Projects
	// @Security     BearerAuth
	// @Produce      json
	// @Param        id path int true "Project ID"
	// @Success      200 {object} response.StandardResponseOk
	// @Failure      400 {object} response.StandardResponseError
	// @Failure      404 {object} response.StandardResponseError
	// @Router       /projects/project/{id} [get]
	projectGroup.GET("/project/:id", projectController.getProjectById)

	// @Summary      Delete a project by ID
	// @Tags         Projects
	// @Security     BearerAuth
	// @Produce      json
	// @Param        id path int true "Project ID"
	// @Success      200 {object} response.StandardResponseOk
	// @Failure      400 {object} response.StandardResponseError
	// @Failure      404 {object} response.StandardResponseError
	// @Router       /projects/project/{id} [delete]
	projectGroup.DELETE("/project/:id", projectController.deleteProject)

	// @Summary      Create a new project
	// @Tags         Projects
	// @Security     BearerAuth
	// @Accept       json
	// @Produce      json
	// @Param        payload body request.CreateProjectRequestDto true "Project data"
	// @Success      201 {object} response.StandardResponseOk
	// @Failure      400 {object} response.StandardResponseError
	// @Failure      500 {object} response.StandardResponseError
	// @Router       /projects/project [post]
	projectGroup.POST("/project", projectController.saveProject)

	// @Summary      Update a project by ID
	// @Tags         Projects
	// @Security     BearerAuth
	// @Accept       json
	// @Produce      json
	// @Param        id path int true "Project ID"
	// @Param        payload body request.UpdateProjectRequestDto true "Project data"
	// @Success      200 {object} response.StandardResponseOk
	// @Failure      400 {object} response.StandardResponseError
	// @Failure      500 {object} response.StandardResponseError
	// @Router       /projects/project/{id} [put]
	projectGroup.PUT("/project/:id", projectController.updateProject)
}
