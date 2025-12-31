package v1

import (
	"SimpleToDo/dto/request"
	"SimpleToDo/dto/response"
	"SimpleToDo/middleware"
	"SimpleToDo/models"
	"SimpleToDo/repository"
	"SimpleToDo/service"
	"net/http"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type AuthController struct {
	AuthService *service.AuthService
}

func NewAuthController(authService *service.AuthService) *AuthController {
	return &AuthController{AuthService: authService}
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

	// Set JWT in HTTP-only cookie
	cookie := &http.Cookie{
		Name:     middleware.AuthCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		// In dev mode, Secure should be false. In production, it should be true.
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(72 * time.Hour),
	}
	c.SetCookie(cookie)

	return response.WriteJSONResponse(c, http.StatusOK, "Login success", nil, false)
}

func (authController *AuthController) register(c echo.Context) error {
	var body request.RegisterRequest
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

	user := models.User{
		Username:  body.Username,
		Email:     body.Email,
		Password:  body.Password,
		FirstName: body.FirstName,
		LastName:  body.LastName,
		Age:       body.Age,
		Gender:    body.Gender,
		Phone:     body.Phone,
		BirthDate: body.BirthDate,
		RoleId:    2,
		Verified:  false,
	}
	if err := authController.AuthService.RegisterUser(&user); err != nil {
		return response.WriteJSONResponse(c, http.StatusConflict, "Register failed", err.Error(), true)
	}

	_ = authController.AuthService.SendVerificationEmail(&user)

	return response.WriteJSONResponse(c, http.StatusCreated, "User registered, please verify your email", nil, false)
}

func (authController *AuthController) logout(c echo.Context) error {
	// Invalidate cookie on server side
	cookie := &http.Cookie{
		Name:     middleware.AuthCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	}
	c.SetCookie(cookie)
	return response.WriteJSONResponse(c, http.StatusOK, "Logged out", "OK", false)
}

func (authController *AuthController) forgotPassword(c echo.Context) error {
	var body request.ForgotPasswordRequest
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
	_ = authController.AuthService.RequestPasswordReset(body.Email)
	return response.WriteJSONResponse(c, http.StatusOK, "If the email exists, a reset link has been sent", nil, false)
}

func (authController *AuthController) resetPassword(c echo.Context) error {
	var body request.ResetPasswordRequest
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
	if err := authController.AuthService.ResetPassword(body.Token, body.NewPassword); err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Reset failed", err.Error(), true)
	}
	return response.WriteJSONResponse(c, http.StatusOK, "Password updated", nil, false)
}

func (authController *AuthController) verifyEmail(c echo.Context) error {
	token := c.QueryParam("token")
	if token == "" {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Token is required", nil, true)
	}
	if err := authController.AuthService.VerifyEmail(token); err != nil {
		return response.WriteJSONResponse(c, http.StatusBadRequest, "Verification failed", err.Error(), true)
	}
	return response.WriteJSONResponse(c, http.StatusOK, "Email verified successfully", nil, false)
}

func (authController *AuthController) resendVerificationEmail(c echo.Context) error {
	var body request.ForgotPasswordRequest
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

	err := authController.AuthService.ResendVerificationEmail(body.Email)

	if err != nil {
		if err.Error() == "user not found" {
			return response.WriteJSONResponse(c, http.StatusNotFound, "User not found", err.Error(), true)
		} else if err.Error() == "user already verified" {
			return response.WriteJSONResponse(c, http.StatusConflict, "User already verified", err.Error(), true)
		}
		return response.WriteJSONResponse(c, http.StatusConflict, "User not found or already verified", err.Error(), true)
	}

	return response.WriteJSONResponse(c, http.StatusOK, "Verification email resent if the account is not verified", nil, false)
}

func (authController *AuthController) getCurrentUser(c echo.Context) error {
	userID := c.Get("user_id")
	userEmail := c.Get("user_email")
	userRole := c.Get("user_role")

	data := map[string]interface{}{
		"id":    userID,
		"email": userEmail,
		"role":  userRole,
	}
	return response.WriteJSONResponse(c, http.StatusOK, "Current user", data, false)
}

func AuthRouters(db *gorm.DB, v1 *echo.Group) {
	authRepository := repository.NewAuthRepository(db)
	authService := service.NewAuthService(authRepository)
	authController := NewAuthController(authService)

	authGroup := v1.Group("/auth")

	// @Summary Login
	// @Description Authenticate a user and set a JWT in HTTP-only cookie
	// @Tags Auth
	// @Accept json
	// @Produce json
	// @Param payload body request.LoginRequest true "Login payload"
	// @Success 200 {object} response.StandardResponseOk
	// @Failure 400 {object} response.StandardResponseError
	// @Router /auth/login [post]
	authGroup.POST("/login", authController.login)

	// @Summary Register
	// @Description Create a new user and send verification email
	// @Tags Auth
	// @Accept json
	// @Produce json
	// @Param payload body request.RegisterRequest true "Register payload"
	// @Success 201 {object} response.StandardResponseOk
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Failure 409 {object} response.StandardResponseError
	// @Router /auth/register [post]
	authGroup.POST("/register", authController.register)

	authProtected := authGroup.Group("")
	authProtected.Use(middleware.JWTMiddleware)

	// @Summary Logout
	// @Description Invalidate user session by clearing auth cookie
	// @Tags Auth
	// @Security BearerAuth
	// @Produce json
	// @Success 200 {object} response.StandardResponseOk
	// @Failure 401 {object} response.StandardResponseError
	// @Router /auth/logout [delete]
	authProtected.DELETE("/logout", authController.logout)

	// @Summary Forgot password
	// @Description Send password reset email if account exists
	// @Tags Auth
	// @Security BearerAuth
	// @Accept json
	// @Produce json
	// @Param payload body request.ForgotPasswordRequest true "Forgot password payload"
	// @Success 200 {object} response.StandardResponseOk
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Router /auth/forgot [post]
	authProtected.POST("/forgot", authController.forgotPassword)

	// @Summary Reset password
	// @Description Reset password using a one-time token sent by email
	// @Tags Auth
	// @Security BearerAuth
	// @Accept json
	// @Produce json
	// @Param payload body request.ResetPasswordRequest true "Reset password payload"
	// @Success 200 {object} response.StandardResponseOk
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Router /auth/reset [post]
	authProtected.POST("/reset", authController.resetPassword)

	// @Summary Verify email
	// @Description Verify user email using a token sent after registration
	// @Tags Auth
	// @Security BearerAuth
	// @Accept json
	// @Produce json
	// @Param token query string true "Email verification token"
	// @Success 200 {object} response.StandardResponseOk
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Router /auth/verify-email [post]
	authProtected.POST("/verify-email", authController.verifyEmail)

	// @Summary Resend verification email
	// @Description Resend email verification link if the user is not verified
	// @Tags Auth
	// @Security BearerAuth
	// @Accept json
	// @Produce json
	// @Param payload body request.ForgotPasswordRequest true "Resend verification payload (email)"
	// @Success 200 {object} response.StandardResponseOk
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Failure 404 {object} response.StandardResponseError
	// @Router /auth/resend-verification [post]
	authProtected.POST("/resend-verification", authController.resendVerificationEmail)

	// @Summary Get current authenticated user
	// @Description Returns basic info from the JWT claims
	// @Tags Auth
	// @Security BearerAuth
	// @Produce json
	// @Success 200 {object} response.StandardResponseOk
	// @Failure 401 {object} response.StandardResponseError
	// @Router /auth/me [get]
	authProtected.GET("/me", authController.getCurrentUser)
}
