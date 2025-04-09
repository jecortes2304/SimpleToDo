package v1

import (
	"SimpleToDo/dto/request"
	"SimpleToDo/dto/response"
	"SimpleToDo/models"
	"SimpleToDo/repository"
	"SimpleToDo/service"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
	"net/http"
)

type AuthController struct {
	AuthService *service.AuthService
}

func NewAuthController(authService *service.AuthService) *AuthController {
	return &AuthController{AuthService: authService}
}

func (authController *AuthController) register(c echo.Context) error {
	var body request.RegisterRequest
	if err := c.Bind(&body); err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid data", err.Error(), true)
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

	user := models.User{
		Username:  body.Username,
		Email:     body.Email,
		Password:  body.Password,
		FirstName: body.FirstName,
		LastName:  body.LastName,
		Age:       body.Age,
		Gender:    body.Gender,
		Phone:     body.Phone,
		Image:     nil,
		BirthDate: body.BirthDate,
		RoleId:    2, // Assuming 2 is the default role ID for a user
	}

	err := authController.AuthService.RegisterUser(&user)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusConflict, "Register failed", err.Error(), true)
	}

	return response.WriteJSONResponse(c, http.StatusCreated, "User registered", nil, false)
}

func (authController *AuthController) login(c echo.Context) error {
	var body request.LoginRequest
	if err := c.Bind(&body); err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Invalid data", err.Error(), true)
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

	token, err := authController.AuthService.LoginUser(body.Email, body.Password)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusUnauthorized, "Login failed", err.Error(), true)
	}

	return response.WriteJSONResponse(c, http.StatusOK, "Login success", map[string]string{"token": token}, false)
}

func (authController *AuthController) logout(c echo.Context) error {
	// Logout client-side: this is usually token deletion/expiration in frontend or storage
	return response.WriteJSONResponse(c, http.StatusOK, "Logged out", "OK", false)
}

func AuthRouters(db *gorm.DB, v1 *echo.Group) {
	authRepository := repository.NewAuthRepository(db)

	authService := service.NewAuthService(authRepository)
	authController := NewAuthController(authService)

	tasksGroup := v1.Group("/auth")

	tasksGroup.POST("/login", authController.login)
	tasksGroup.POST("/register", authController.register)
	tasksGroup.DELETE("/logout", authController.logout)
}
