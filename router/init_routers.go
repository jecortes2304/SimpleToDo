package router

import (
	"SimpleToDo/router/v1"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

func InitRouters(e *echo.Echo, db *gorm.DB) {
	v1.TaskRouters(e, db)
	v1.ProjectRoutes(e, db)
}
