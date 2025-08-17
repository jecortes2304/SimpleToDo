package v1

import (
	"SimpleToDo/dto/request"
	"SimpleToDo/dto/response"
	"SimpleToDo/middleware"
	"SimpleToDo/repository"
	"SimpleToDo/service"
	"SimpleToDo/util/mapper"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"net/http"
	"strconv"
)

type UserController struct {
	UserService *service.UserService
}

func NewUserController(s *service.UserService) *UserController {
	return &UserController{UserService: s}
}

func (uc *UserController) getUserByID(c echo.Context) error {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid ID", err.Error(), true)
	}
	user, err := uc.UserService.GetByID(uint(id))
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusNotFound, "User not found", err.Error(), true)
	}
	return response.WriteJSONResponse(c, http.StatusOK, "User fetched successfully", user, false)
}

func (uc *UserController) getAllUsers(c echo.Context) error {
	pagination, err := validatePagination(c)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Bad request error", err.Error(), true)
	}
	users, err := uc.UserService.GetAll(pagination)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Error", err.Error(), true)
	}
	return response.WriteJSONResponse(c, http.StatusOK, "Users fetched successfully", users, false)
}

func (uc *UserController) updateUser(c echo.Context) error {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid ID", err.Error(), true)
	}

	var body request.UpdateUserRequest
	if err := c.Bind(&body); err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid", err.Error(), true)
	}
	validate := validator.New()
	errorValidate := validate.Struct(body)
	if errorValidate != nil {
		var errorsString []string
		for _, e := range errorValidate.(validator.ValidationErrors) {
			errorsString = append(errorsString, e.Field()+" is "+e.Tag()+" "+e.Param())
		}
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", errorsString, true)
	}

	updatedUser, err := uc.UserService.Update(uint(id), body)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Failed to update", err.Error(), true)
	}
	return response.WriteJSONResponse(c, http.StatusOK, "User updated successfully", updatedUser, false)
}

func (uc *UserController) deleteUser(c echo.Context) error {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid ID", err.Error(), true)
	}
	user, err := uc.UserService.GetByID(uint(id))

	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Error fetching user", err.Error(), true)
	}

	if user == nil {
		return response.WriteJSONResponse(c, http.StatusNotFound, "User not found", nil, true)
	}

	if user.Role == "ADMIN" {
		return response.WriteJSONResponse(c, http.StatusForbidden, "Cannot delete admin user", nil, true)
	}

	err = uc.UserService.Delete(uint(id))
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Error deleting user", err.Error(), true)
	}
	return response.WriteJSONResponse(c, http.StatusOK, "User deleted successfully", nil, false)
}

func (uc *UserController) getUserProfile(c echo.Context) error {
	id := c.Get("user_id").(float64)
	user, err := uc.UserService.GetByID(uint(id))
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusNotFound, "User not found", err.Error(), true)
	}
	return response.WriteJSONResponse(c, http.StatusOK, "User profile fetched successfully", user, false)
}

func (uc *UserController) updateProfile(c echo.Context) error {
	id := c.Get("user_id").(float64)
	var body request.UpdateUserRequest
	if err := c.Bind(&body); err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid", err.Error(), true)
	}
	validate := validator.New()
	errorValidate := validate.Struct(body)
	if errorValidate != nil {
		var errorsString []string
		for _, e := range errorValidate.(validator.ValidationErrors) {
			errorsString = append(errorsString, e.Field()+" is "+e.Tag()+" "+e.Param())
		}
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid request", errorsString, true)
	}

	updatedUser, err := uc.UserService.Update(uint(id), body)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Failed to update", err.Error(), true)
	}
	return response.WriteJSONResponse(c, http.StatusOK, "User updated successfully", updatedUser, false)
}

func UserRouters(db *gorm.DB, v1 *echo.Group) {
	userRepository := repository.NewUserRepository(db)
	userMapper := mapper.NewUserMapperImpl()
	userService := service.NewUserService(userRepository, userMapper)
	userController := NewUserController(userService)

	usersGroup := v1.Group("/users")
	usersGroup.Use(middleware.JWTMiddleware)
	usersGroup.Use(middleware.AdminOnly)

	userProfileGroup := v1.Group("/profile")
	userProfileGroup.Use(middleware.JWTMiddleware)

	// @Summary Get all users
	// @Description Retrieve a paginated list of all users (Admin only)
	// @Tags Users
	// @Security BearerAuth
	// @Param page query int false "Page number"
	// @Param limit query int false "Items per page"
	// @Success 200 {object} response.StandardResponseOkPaginated
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Failure 403 {object} response.StandardResponseError
	// @Failure 500 {object} response.StandardResponseError
	// @Router /users [get]
	usersGroup.GET("", userController.getAllUsers)

	// @Summary Get user by ID
	// @Description Retrieve details of a specific user by ID (Admin only)
	// @Tags Users
	// @Security BearerAuth
	// @Param id path int true "User ID"
	// @Success 200 {object} response.StandardResponseOk
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Failure 403 {object} response.StandardResponseError
	// @Failure 404 {object} response.StandardResponseError
	// @Failure 500 {object} response.StandardResponseError
	// @Router /users/user/{id} [get]
	usersGroup.GET("/user/:id", userController.getUserByID)

	// @Summary Delete user
	// @Description Delete a specific user by ID (Admin only, cannot delete admin users)
	// @Tags Users
	// @Security BearerAuth
	// @Param id path int true "User ID"
	// @Success 200 {object} response.StandardResponseOk
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 403 {object} response.StandardResponseError
	// @Failure 404 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Router /users/user/{id} [delete]
	usersGroup.DELETE("/user/:id", userController.deleteUser)

	// @Summary Update user
	// @Description Update user details by ID (Admin only)
	// @Tags Users
	// @Security BearerAuth
	// @Param id path int true "User ID"
	// @Param user body request.UpdateUserRequest true "User update payload"
	// @Success 200 {object} response.StandardResponseOk
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Failure 403 {object} response.StandardResponseError
	// @Failure 500 {object} response.StandardResponseError
	// @Router /users/user/{id} [put]
	usersGroup.PUT("/user/:id", userController.updateUser)

	// @Summary Get current user profile
	// @Description Retrieve the profile of the authenticated user
	// @Tags Profile
	// @Security BearerAuth
	// @Success 200 {object} response.StandardResponseOk
	// @Failure 401 {object} response.StandardResponseError
	// @Router /profile [get]
	userProfileGroup.GET("", userController.getUserProfile)

	// @Summary Update current user profile
	// @Description Update the profile of the authenticated user
	// @Tags Profile
	// @Security BearerAuth
	// @Accept json
	// @Produce json
	// @Param user body request.UpdateUserRequest true "Profile update payload"
	// @Success 200 {object} response.StandardResponseOk
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Failure 500 {object} response.StandardResponseError
	// @Router /profile [patch]
	userProfileGroup.PATCH("", userController.updateProfile)
}
