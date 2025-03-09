package main

import (
	"SimpleToDo/db"
	"SimpleToDo/router"
	"SimpleToDo/util"
	"fmt"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func applyMiddlewares(e *echo.Echo) {
	e.Use(middleware.Recover())
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "\033[36m[${time_rfc3339}]\033[0m \033[32m${method}\033[0m \033[34m${uri}\033[0m \033[33m${status}\033[0m ${latency_human}\n",
	}))
}

func main() {
	e := echo.New()
	e.HideBanner = true
	util.PrintBanner()
	applyMiddlewares(e)

	errDb, DB := db.InitDB()
	if errDb != nil {
		fmt.Println("Error initializing database:", errDb)
		return
	}

	router.InitRouters(e, DB)

	e.Logger.Fatal(e.Start(":8080"), "Error starting server")
}
