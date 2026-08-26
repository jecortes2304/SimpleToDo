package v1

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"log"
	"net/http"
	"net/url"
	"simpletodo/internal/config"
	"simpletodo/internal/dto/request"
	"simpletodo/internal/dto/response"
	"simpletodo/internal/middleware"
	"simpletodo/internal/models"
	"simpletodo/internal/repository"
	"simpletodo/internal/service"
	"strings"
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

const googleOAuthStateCookie = "google_oauth_state"

func secureCookies() bool {
	baseURL, err := url.Parse(config.GetAppEnv().BaseURL)
	return err == nil && strings.EqualFold(baseURL.Scheme, "https")
}

func setAuthCookie(c echo.Context, token string) {
	c.SetCookie(&http.Cookie{
		Name:     middleware.AuthCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   secureCookies(),
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(72 * time.Hour),
		MaxAge:   int((72 * time.Hour).Seconds()),
	})
}

func clearAuthCookie(c echo.Context) {
	c.SetCookie(&http.Cookie{
		Name:     middleware.AuthCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   secureCookies(),
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
	})
}

func randomOAuthState() (string, error) {
	value := make([]byte, 32)
	if _, err := rand.Read(value); err != nil {
		return "", err
	}
	return hex.EncodeToString(value), nil
}

func (authController *AuthController) providers(c echo.Context) error {
	data := response.AuthProvidersResult{Google: authController.AuthService.GoogleEnabled()}
	return response.WriteJSONResponse(c, http.StatusOK, "Authentication providers", data, false)
}

func (authController *AuthController) googleOAuthStart(c echo.Context) error {
	state, err := randomOAuthState()
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusInternalServerError, "Could not start Google authentication", nil, true)
	}
	authorizationURL, err := authController.AuthService.GoogleAuthorizationURL(state)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrGoogleNotConfigured) {
			status = http.StatusServiceUnavailable
		}
		return response.WriteJSONResponse(c, status, "Google authentication unavailable", nil, true)
	}
	c.SetCookie(&http.Cookie{
		Name:     googleOAuthStateCookie,
		Value:    state,
		Path:     "/api/v1/auth/oauth/google/callback",
		HttpOnly: true,
		Secure:   secureCookies(),
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(10 * time.Minute),
		MaxAge:   int((10 * time.Minute).Seconds()),
	})
	return c.Redirect(http.StatusFound, authorizationURL)
}

func clearGoogleStateCookie(c echo.Context) {
	c.SetCookie(&http.Cookie{
		Name:     googleOAuthStateCookie,
		Value:    "",
		Path:     "/api/v1/auth/oauth/google/callback",
		HttpOnly: true,
		Secure:   secureCookies(),
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
	})
}

func frontendRedirect(c echo.Context, path string) error {
	return c.Redirect(http.StatusFound, strings.TrimRight(config.GetAppEnv().BaseURL, "/")+path)
}

func (authController *AuthController) googleOAuthCallback(c echo.Context) error {
	stateCookie, cookieErr := c.Cookie(googleOAuthStateCookie)
	clearGoogleStateCookie(c)

	if c.QueryParam("error") != "" {
		return frontendRedirect(c, "/auth?oauth_error=cancelled")
	}
	state := c.QueryParam("state")
	if cookieErr != nil || stateCookie == nil || state == "" ||
		subtle.ConstantTimeCompare([]byte(stateCookie.Value), []byte(state)) != 1 {
		return frontendRedirect(c, "/auth?oauth_error=invalid_state")
	}
	code := c.QueryParam("code")
	if code == "" {
		return frontendRedirect(c, "/auth?oauth_error=provider")
	}

	result, err := authController.AuthService.CompleteGoogleOAuth(c.Request().Context(), code)
	if err != nil {
		log.Printf("google authentication failed: %v", err)
		return frontendRedirect(c, "/auth?oauth_error=provider")
	}
	if !result.User.Verified {
		if err = authController.AuthService.SendVerificationEmail(result.User); err != nil {
			log.Printf("google user verification email could not be prepared: %v", err)
			return frontendRedirect(c, "/pending-email-verification?source=google&email_delivery=failed")
		}
		return frontendRedirect(c, "/pending-email-verification?source=google")
	}

	token, err := authController.AuthService.CreateSessionToken(result.User)
	if err != nil {
		log.Printf("google session creation failed: %v", err)
		return frontendRedirect(c, "/auth?oauth_error=session")
	}
	setAuthCookie(c, token)
	return frontendRedirect(c, "/")
}

func (authController *AuthController) login(c echo.Context) error {
	var body request.LoginRequest
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

	token, err := authController.AuthService.LoginUser(body.Email, body.Password)
	if err != nil {
		return response.WriteJSONResponse(c, http.StatusUnauthorized, "Login failed", err.Error(), true)
	}

	appName := c.Request().Header.Get("Application-Name")
	if appName == "SimpleTodoWeb" {
		setAuthCookie(c, token)
	}

	data := map[string]interface{}{
		"token": token,
	}

	return response.WriteJSONResponse(c, http.StatusOK, "Login success", data, false)
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
	clearAuthCookie(c)
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

	authProtectedGroup := authGroup.Group("")
	authProtectedGroup.Use(middleware.JWTMiddleware)

	// @Summary List authentication providers
	// @Description Returns the social authentication providers configured on this server
	// @Tags Auth
	// @Produce json
	// @Success 200 {object} response.AuthProvidersResponse
	// @Router /auth/providers [get]
	authGroup.GET("/providers", authController.providers)

	// @Summary Start Google authentication
	// @Description Redirects the browser to Google OpenID Connect
	// @Tags Auth
	// @Produce json
	// @Success 302 {string} string "Redirect to Google"
	// @Failure 503 {object} response.StandardResponseError
	// @Router /auth/oauth/google [get]
	authGroup.GET("/oauth/google", authController.googleOAuthStart)

	// @Summary Complete Google authentication
	// @Description Validates the OAuth state and Google profile, then redirects to the application
	// @Tags Auth
	// @Param code query string false "Google authorization code"
	// @Param state query string false "OAuth anti-CSRF state"
	// @Param error query string false "Google authorization error"
	// @Success 302 {string} string "Redirect to the application"
	// @Router /auth/oauth/google/callback [get]
	authGroup.GET("/oauth/google/callback", authController.googleOAuthCallback)

	// @Summary Login
	// @Description Authenticate a user and set a JWT in HTTP-only cookie
	// @Tags Auth
	// @Accept json
	// @Produce json
	// @Param payload body request.LoginRequest true "Login payload"
	// @Success 200 {object} response.LoginResponse "JWT returned; web clients also receive an HTTP-only cookie"
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 401 {object} response.StandardResponseError
	// @Router /auth/login [post]
	authGroup.POST("/login", authController.login)

	// @Summary Register
	// @Description Create a new user and send verification email
	// @Tags Auth
	// @Accept json
	// @Produce json
	// @Param payload body request.RegisterRequest true "Register payload"
	// @Success 201 {object} response.EmptyResponse
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 409 {object} response.StandardResponseError
	// @Router /auth/register [post]
	authGroup.POST("/register", authController.register)

	// @Summary Forgot password
	// @Description Send password reset email if account exists
	// @Tags Auth
	// @Accept json
	// @Produce json
	// @Param payload body request.ForgotPasswordRequest true "Forgot password payload"
	// @Success 200 {object} response.EmptyResponse
	// @Failure 400 {object} response.StandardResponseError
	// @Router /auth/forgot [post]
	authGroup.POST("/forgot", authController.forgotPassword)

	// @Summary Reset password
	// @Description Reset password using a one-time token sent by email
	// @Tags Auth
	// @Accept json
	// @Produce json
	// @Param payload body request.ResetPasswordRequest true "Reset password payload"
	// @Success 200 {object} response.EmptyResponse
	// @Failure 400 {object} response.StandardResponseError
	// @Router /auth/reset [post]
	authGroup.POST("/reset", authController.resetPassword)

	// @Summary Verify email
	// @Description Verify user email using a token sent after registration
	// @Tags Auth
	// @Accept json
	// @Produce json
	// @Param token query string true "Email verification token"
	// @Success 200 {object} response.EmptyResponse
	// @Failure 400 {object} response.StandardResponseError
	// @Router /auth/verify-email [post]
	authGroup.POST("/verify-email", authController.verifyEmail)

	// @Summary Resend verification email
	// @Description Resend email verification link if the user is not verified
	// @Tags Auth
	// @Accept json
	// @Produce json
	// @Param payload body request.ForgotPasswordRequest true "Resend verification payload (email)"
	// @Success 200 {object} response.EmptyResponse
	// @Failure 400 {object} response.StandardResponseError
	// @Failure 404 {object} response.StandardResponseError
	// @Failure 409 {object} response.StandardResponseError
	// @Router /auth/resend-verification [post]
	authGroup.POST("/resend-verification", authController.resendVerificationEmail)

	// @Summary Logout
	// @Description Invalidate user session by clearing auth cookie
	// @Tags Auth
	// @Security BearerAuth
	// @Produce json
	// @Success 200 {object} response.StringResponse
	// @Failure 401 {object} response.StandardResponseError
	// @Router /auth/logout [delete]
	authProtectedGroup.DELETE("/logout", authController.logout)

	// @Summary Get current authenticated user
	// @Description Returns basic info from the JWT claims
	// @Tags Auth
	// @Security BearerAuth
	// @Produce json
	// @Success 200 {object} response.CurrentUserResponse
	// @Failure 401 {object} response.StandardResponseError
	// @Router /auth/me [get]
	authProtectedGroup.GET("/me", authController.getCurrentUser)
}
