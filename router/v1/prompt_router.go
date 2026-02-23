package v1

import (
	"SimpleToDo/dto/request"
	"SimpleToDo/dto/response"
	"SimpleToDo/middleware"
	"SimpleToDo/repository"
	"SimpleToDo/service"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"net/http"
	"strconv"
)

type PromptController struct {
	PromptService *service.PromptService
}

func NewPromptController(promptService *service.PromptService) *PromptController {
	return &PromptController{PromptService: promptService}
}

func (pc *PromptController) createPrompt(c echo.Context) error {
	var body request.CreatePromptRequest
	if err := c.Bind(&body); err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid data", err.Error(), true)
	}

	validate := validator.New()
	if err := validate.Struct(body); err != nil {
		var errorsString []string
		for _, e := range err.(validator.ValidationErrors) {
			errorsString = append(errorsString, e.Field()+" is "+e.Tag()+" "+e.Param())
		}
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", errorsString, true)
	}

	prompt, err := pc.PromptService.Create(body)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusConflict, "Failed to create prompt", err.Error(), true)
	}

	return response.WriteJSONResponse(c, http.StatusCreated, "Prompt created successfully", prompt, false)
}

func (pc *PromptController) getAllPrompts(c echo.Context) error {
	pagination, err := validatePagination(c)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Bad request error", err.Error(), true)
	}

	prompts, err := pc.PromptService.GetAll(pagination)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Error fetching prompts", err.Error(), true)
	}
	return response.WriteJSONResponse(c, http.StatusOK, "Prompts fetched successfully", prompts, false)
}

func (pc *PromptController) getPromptByID(c echo.Context) error {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid ID", err.Error(), true)
	}

	prompt, err := pc.PromptService.GetByID(uint(id))
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusNotFound, "Prompt not found", err.Error(), true)
	}
	return response.WriteJSONResponse(c, http.StatusOK, "Prompt fetched successfully", prompt, false)
}

func (pc *PromptController) updatePrompt(c echo.Context) error {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid ID", err.Error(), true)
	}

	var body request.UpdatePromptRequest
	if err := c.Bind(&body); err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid data", err.Error(), true)
	}

	validate := validator.New()
	if err := validate.Struct(body); err != nil {
		var errorsString []string
		for _, e := range err.(validator.ValidationErrors) {
			errorsString = append(errorsString, e.Field()+" is "+e.Tag()+" "+e.Param())
		}
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", errorsString, true)
	}

	updatedPrompt, err := pc.PromptService.Update(uint(id), body)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Failed to update", err.Error(), true)
	}
	return response.WriteJSONResponse(c, http.StatusOK, "Prompt updated successfully", updatedPrompt, false)
}

func (pc *PromptController) deletePrompt(c echo.Context) error {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid ID", err.Error(), true)
	}

	err = pc.PromptService.Delete(uint(id))
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Error deleting prompt", err.Error(), true)
	}
	return response.WriteJSONResponse(c, http.StatusOK, "Prompt deleted successfully", nil, false)
}

func PromptRouters(db *gorm.DB, v1 *echo.Group) {
	promptRepository := repository.NewPromptRepository(db)
	promptService := service.NewPromptService(promptRepository)
	promptController := NewPromptController(promptService)

	promptGroup := v1.Group("/prompts")
	promptGroup.Use(middleware.JWTMiddleware)
	promptGroup.Use(middleware.AdminOnlyMIddleware)

	// @Summary Create Prompt
	// @Description Create a new AI system prompt (Admin only)
	// @Tags Prompts
	// @Security BearerAuth
	// @Accept json
	// @Produce json
	// @Param payload body request.CreatePromptRequest true "Create Prompt payload"
	// @Success 201 {object} response.StandardResponseOk
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Failure 403 {object} response.StandardResponseError
	// @Router /prompts [post]
	promptGroup.POST("", promptController.createPrompt)

	// @Summary Get all prompts
	// @Description Retrieve a paginated list of all prompts (Admin only)
	// @Tags Prompts
	// @Security BearerAuth
	// @Param page query int false "Page number"
	// @Param limit query int false "Items per page"
	// @Success 200 {object} response.StandardResponseOkPaginated
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Failure 403 {object} response.StandardResponseError
	// @Failure 500 {object} response.StandardResponseError
	// @Router /prompts [get]
	promptGroup.GET("", promptController.getAllPrompts)

	// @Summary Get Prompt by ID
	// @Description Retrieve details of a specific prompt (Admin only)
	// @Tags Prompts
	// @Security BearerAuth
	// @Param id path int true "Prompt ID"
	// @Success 200 {object} response.StandardResponseOk
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Failure 403 {object} response.StandardResponseError
	// @Failure 404 {object} response.StandardResponseError
	// @Router /prompts/{id} [get]
	promptGroup.GET("/:id", promptController.getPromptByID)

	// @Summary Update Prompt
	// @Description Update prompt details (Admin only)
	// @Tags Prompts
	// @Security BearerAuth
	// @Param id path int true "Prompt ID"
	// @Param payload body request.UpdatePromptRequest true "Update Prompt payload"
	// @Success 200 {object} response.StandardResponseOk
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Failure 403 {object} response.StandardResponseError
	// @Failure 500 {object} response.StandardResponseError
	// @Router /prompts/{id} [put]
	promptGroup.PUT("/:id", promptController.updatePrompt)

	// @Summary Delete Prompt
	// @Description Delete a specific prompt (Admin only)
	// @Tags Prompts
	// @Security BearerAuth
	// @Param id path int true "Prompt ID"
	// @Success 200 {object} response.StandardResponseOk
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Failure 403 {object} response.StandardResponseError
	// @Failure 500 {object} response.StandardResponseError
	// @Router /prompts/{id} [delete]
	promptGroup.DELETE("/:id", promptController.deletePrompt)
}
