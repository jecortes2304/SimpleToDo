package v1

import (
	"SimpleToDo/dto/request"
	"SimpleToDo/dto/response"
	"SimpleToDo/middleware"
	"SimpleToDo/models"
	"SimpleToDo/repository"
	"SimpleToDo/service"
	"SimpleToDo/util/mapper"
	"errors"
	"fmt"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"net/http"
	"strconv"
	"strings"
)

type TaskController struct {
	TaskService *service.TaskService
}

func NewTaskController(taskService *service.TaskService) *TaskController {
	return &TaskController{TaskService: taskService}
}

func (taskController *TaskController) getAll(c echo.Context) error {

	userId := c.Get("user_id").(float64)

	userIdInt, err := strconv.Atoi(strconv.FormatFloat(userId, 'f', 0, 64))
	if err != nil || userIdInt < 1 {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Invalid User ID", true)
	}

	pagination, err := validatePagination(c)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Bad request error", err.Error(), true)
	}
	tasks, err := taskController.TaskService.GetAll(pagination, userIdInt)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Internal Server Error", err.Error(), true)
	}

	return response.WriteJSONResponse(c, http.StatusOK, "Tasks fetched successfully", tasks, false)
}

func (taskController *TaskController) getAllTaskByProject(c echo.Context) error {
	userId := c.Get("user_id").(float64)

	userIdInt, err := strconv.Atoi(strconv.FormatFloat(userId, 'f', 0, 64))
	if err != nil || userIdInt < 1 {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Invalid User ID", true)
	}

	pagination, err := validatePagination(c)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Bad request error", err.Error(), true)
	}
	projectId := c.Param("projectId")
	if projectId == "" {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Project ID must be provided", true)
	}

	projectIdInt, err := strconv.Atoi(projectId)
	if err != nil || projectIdInt < 1 {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Invalid project ID", true)
	}

	tasks, err := taskController.TaskService.GetAllTaskByProjectId(pagination, projectIdInt, userIdInt)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Internal Server Error", err.Error(), true)
	}

	return response.WriteJSONResponse(c, http.StatusOK, "Tasks fetched successfully", tasks, false)
}

func (taskController *TaskController) getTaskById(c echo.Context) error {
	taskId := c.Param("id")
	if taskId == "" {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Task ID must be provided", true)
	}

	taskIdInt, err := strconv.Atoi(taskId)
	if err != nil || taskIdInt < 1 {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Invalid Task ID", true)
	}

	taskResponse, err := taskController.TaskService.GetTaskById(taskIdInt)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return response.WriteJSONResponse(c, http.StatusNotFound, "Error getting task", err.Error(), true)
		}
		return response.WriteJSONResponse(c, http.StatusNotFound, "Error getting task", err.Error(), true)
	}

	return response.WriteJSONResponse(c, http.StatusOK, "Task fetched successfully", taskResponse, false)
}

func (taskController *TaskController) saveTask(c echo.Context) error {
	userId := c.Get("user_id").(float64)

	userIdInt, err := strconv.Atoi(strconv.FormatFloat(userId, 'f', 0, 64))
	if err != nil || userIdInt < 1 {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Invalid User ID", true)
	}

	projectId := c.Param("projectId")
	if projectId == "" {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Project ID must be provided", true)
	}

	projectIdInt, err := strconv.Atoi(projectId)
	if err != nil || projectIdInt < 1 {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Invalid project ID", true)
	}

	task := new(request.CreateTaskRequestDto)
	validate := validator.New()

	if err := c.Bind(task); err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", err.Error(), true)
	}

	err = validate.Struct(task)
	if err != nil {
		var errorsString []string
		for _, e := range err.(validator.ValidationErrors) {
			errorsString = append(errorsString, e.Field()+" is "+e.Tag()+" "+e.Param())
		}
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", errorsString, true)
	}

	taskResponse, err := taskController.TaskService.SaveTask(task, projectIdInt, userIdInt)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return response.WriteJSONResponse(c, http.StatusNotFound, "Error saving task", err.Error(), true)
		}
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Error saving task", err.Error(), true)
	}

	return response.WriteJSONResponse(c, http.StatusCreated, "Task created successfully", taskResponse, false)
}

func (taskController *TaskController) updateTask(c echo.Context) error {
	taskId := c.Param("id")
	if taskId == "" {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Task ID must be provided", true)
	}

	taskIdInt, err := strconv.Atoi(taskId)
	if err != nil || taskIdInt < 1 {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Invalid Task ID", true)
	}

	taskUpdate := new(request.UpdateTaskRequestDto)
	validate := validator.New()

	if errorBind := c.Bind(taskUpdate); errorBind != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", errorBind.Error(), true)
	}

	errorValidate := validate.Struct(taskUpdate)
	if errorValidate != nil {
		var errorsString []string
		for _, e := range errorValidate.(validator.ValidationErrors) {
			errorsString = append(errorsString, e.Field()+" is "+e.Tag()+" "+e.Param())
		}
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", errorsString, true)
	}

	taskUpdated, err := taskController.TaskService.UpdateTask(taskUpdate, taskIdInt)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			return response.WriteJSONResponse(c, http.StatusNotFound, "Error updating task", err.Error(), true)
		}
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Error updating task", err.Error(), true)
	}

	return response.WriteJSONResponse(c, http.StatusOK, "Task updated successfully", taskUpdated, false)
}

func (taskController *TaskController) deleteTasks(c echo.Context) error {
	rawIDs := c.QueryParam("ids")
	if rawIDs == "" {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "IDs must be provided", true)
	}

	idStrs := strings.Split(rawIDs, ",")
	var ids []int
	for _, idStr := range idStrs {
		id, err := strconv.Atoi(strings.TrimSpace(idStr))
		if err != nil {
			return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid ID", fmt.Sprintf("'%s' is not a valid ID", idStr), true)
		}
		ids = append(ids, id)
	}

	if err := taskController.TaskService.DeleteTasks(ids); err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Failed to delete tasks", err.Error(), true)
	}

	return response.WriteJSONResponse(c, http.StatusOK, "Tasks deleted", "OK", false)
}

func validatePagination(c echo.Context) (response.Pagination, error) {
	limit := c.QueryParam("limit")
	page := c.QueryParam("page")
	sort := c.QueryParam("sort")

	if limit == "" {
		limit = "10"
	}
	if page == "" {
		page = "1"
	}

	if sort == "" || (sort != "asc" && sort != "desc") {
		sort = "asc"
	}

	limitInt, err := strconv.Atoi(limit)
	if err != nil {
		return response.Pagination{}, err
	}
	pageInt, err := strconv.Atoi(page)
	if err != nil {
		return response.Pagination{}, err
	}

	if limitInt < 1 || pageInt < 1 {
		errorString := errors.New("limit and Page must be greater than 0")
		return response.Pagination{}, errorString
	}

	pagination := response.Pagination{
		Limit:      limitInt,
		Page:       pageInt,
		Sort:       "Id " + sort,
		Items:      []models.Task{},
		TotalItems: 0,
		TotalPages: 0,
	}

	return pagination, nil
}

func TaskRouters(db *gorm.DB, v1 *echo.Group) {
	taskRepository := repository.NewTaskRepository(db)
	statusRepository := repository.NewStatusRepository(db)
	taskMapper := mapper.NewTaskMapperImpl()

	taskService := service.NewTaskService(taskRepository, statusRepository, taskMapper)
	taskController := NewTaskController(taskService)

	tasksGroup := v1.Group("/tasks")
	tasksGroup.Use(middleware.JWTMiddleware)

	// @Summary      List all tasks for the current user
	// @Tags         Tasks
	// @Security     BearerAuth
	// @Produce      json
	// @Param        limit query int false "Limit per page" default(10)
	// @Param        page  query int false "Page number" default(1)
	// @Param        sort  query string false "Sort order" Enums(asc, desc) default(asc)
	// @Success      200 {object} response.StandardResponseOk
	// @Failure      400 {object} response.StandardResponseError
	// @Failure      500 {object} response.StandardResponseError
	// @Router       /tasks [get]
	tasksGroup.GET("", taskController.getAll)

	// @Summary      List all tasks by project for the current user
	// @Tags         Tasks
	// @Security     BearerAuth
	// @Produce      json
	// @Param        projectId path int true "Project ID"
	// @Param        limit query int false "Limit per page" default(10)
	// @Param        page  query int false "Page number" default(1)
	// @Param        sort  query string false "Sort order" Enums(asc, desc) default(asc)
	// @Success      200 {object} response.StandardResponseOk
	// @Failure      400 {object} response.StandardResponseError
	// @Failure      500 {object} response.StandardResponseError
	// @Router       /tasks/{projectId} [get]
	tasksGroup.GET("/:projectId", taskController.getAllTaskByProject)

	// @Summary      Get a task by ID
	// @Tags         Tasks
	// @Security     BearerAuth
	// @Produce      json
	// @Param        id path int true "Task ID"
	// @Success      200 {object} response.StandardResponseOk
	// @Failure      400 {object} response.StandardResponseError
	// @Failure      404 {object} response.StandardResponseError
	// @Router       /tasks/task/{id} [get]
	tasksGroup.GET("/task/:id", taskController.getTaskById)

	// @Summary      Delete multiple tasks by IDs
	// @Tags         Tasks
	// @Security     BearerAuth
	// @Produce      json
	// @Param        ids query string true "Comma-separated task IDs" example:"1,2,3"
	// @Success      200 {object} response.StandardResponseOk
	// @Failure      400 {object} response.StandardResponseError
	// @Failure      500 {object} response.StandardResponseError
	// @Router       /tasks [delete]
	tasksGroup.DELETE("", taskController.deleteTasks)

	// @Summary      Create a new task in a project
	// @Tags         Tasks
	// @Security     BearerAuth
	// @Accept       json
	// @Produce      json
	// @Param        projectId path int true "Project ID"
	// @Param        payload body request.CreateTaskRequestDto true "Task data"
	// @Success      201 {object} response.StandardResponseOk
	// @Failure      400 {object} response.StandardResponseError
	// @Failure      404 {object} response.StandardResponseError
	// @Router       /tasks/task/{projectId} [post]
	tasksGroup.POST("/task/:projectId", taskController.saveTask)

	// @Summary      Update a task by ID
	// @Tags         Tasks
	// @Security     BearerAuth
	// @Accept       json
	// @Produce      json
	// @Param        id path int true "Task ID"
	// @Param        payload body request.UpdateTaskRequestDto true "Task data"
	// @Success      200 {object} response.StandardResponseOk
	// @Failure      400 {object} response.StandardResponseError
	// @Failure      404 {object} response.StandardResponseError
	// @Router       /tasks/task/{id} [put]
	tasksGroup.PUT("/task/:id", taskController.updateTask)
}
