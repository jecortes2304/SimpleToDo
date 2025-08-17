package middleware

import (
	"SimpleToDo/config"
	"SimpleToDo/dto/response"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

func JWTMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		authHeader := c.Request().Header.Get("Authorization")
		if authHeader == "" {
			return response.WriteJSONResponse(c, http.StatusUnauthorized, "Missing token", "", true)
		}

		if !strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
			authHeader = "Bearer " + authHeader
		}

		tokenStr := strings.TrimSpace(authHeader[len("Bearer "):])
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			secret := config.GetAppEnv().JWTSecret
			if secret == "" {
				secret = "supersecretkey"
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			return response.WriteJSONResponse(c, http.StatusUnauthorized, "Invalid token", "", true)
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return response.WriteJSONResponse(c, http.StatusUnauthorized, "Invalid claims", "", true)
		}

		c.Set("user_id", claims["user_id"])
		c.Set("user_role", claims["role"])
		c.Set("user_email", claims["email"])
		return next(c)
	}
}

func AdminOnly(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		role, ok := c.Get("user_role").(float64)
		if !ok || role != 1 {
			return response.WriteJSONResponse(c, http.StatusForbidden, "Admin access required", nil, true)
		}
		return next(c)
	}
}
