package v1

import (
	"net/http"
	"simpletodo/internal/dto/request"
	"simpletodo/internal/dto/response"
	"simpletodo/internal/middleware"
	repository2 "simpletodo/internal/repository"
	service2 "simpletodo/internal/service"
	"strconv"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type VisionController struct {
	VisionService *service2.VisionService
}

func NewVisionController(visionService *service2.VisionService) *VisionController {
	return &VisionController{VisionService: visionService}
}

func (vc *VisionController) analyzeImage(c echo.Context) error {
	userID := c.Get("user_id").(float64)

	var body request.AnalyzeImageRequest
	if err := c.Bind(&body); err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid data", err.Error(), true)
	}

	projectId := c.Param("projectId")
	if projectId == "" {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Project ID must be provided", true)
	}

	projectIdInt, err := strconv.Atoi(projectId)
	if err != nil || projectIdInt < 1 {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", "Invalid project ID", true)
	}

	validate := validator.New()
	if err := validate.Struct(body); err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Validation failed", err.Error(), true)
	}

	ctx := c.Request().Context()

	taskCreated, err := vc.VisionService.ExtractTaskFromImage(ctx, uint(userID), uint(projectIdInt), body.ImageBase64)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "AI processing failed", err.Error(), true)
	}

	return response.WriteJSONResponse(c, http.StatusOK, "Image analyzed successfully", taskCreated, false)
}

func VisionRouters(db *gorm.DB, v1 *echo.Group) {
	aiRepo := repository2.NewAIServerRepository(db)
	promptRepo := repository2.NewPromptRepository(db)
	taskService := service2.NewTaskService(repository2.NewTaskRepository(db), repository2.NewStatusRepository(db), nil)

	visionService := service2.NewVisionService(aiRepo, promptRepo, taskService)
	visionController := NewVisionController(visionService)

	visionGroup := v1.Group("/vision")
	visionGroup.Use(middleware.JWTMiddleware)

	// @Summary Analyze Image
	// @Description Extract task details from image using AI with User settings
	// @Tags Vision
	// @Security BearerAuth
	// @Accept json
	// @Produce json
	// @Param projectId path int true "Project ID that will own the generated task"
	// @Param payload body request.AnalyzeImageRequest true "Base64 Image"
	// @Success 200 {object} response.TaskResponse
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Failure 500 {object} response.StandardResponseError
	// @Router /vision/analyze/{projectId} [post]
	visionGroup.POST("/analyze/:projectId", visionController.analyzeImage)
}
