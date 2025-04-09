package router

import (
	"SimpleToDo/router/v1"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func InitRouters(e *echo.Echo, db *gorm.DB) {
	apiV1 := e.Group("/api/v1")

	v1.AuthRouters(db, apiV1)
	v1.UserRouters(db, apiV1)
	v1.TaskRouters(db, apiV1)
	v1.ProjectRoutes(db, apiV1)
}
