package main

import (
	embedfs "SimpleToDo"
	"SimpleToDo/db"
	"SimpleToDo/router"
	"SimpleToDo/util"
	"fmt"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"net/http"
)

func applyMiddlewares(e *echo.Echo) {
	e.Use(middleware.Recover())
	e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
		Format: "\033[36m[${time_rfc3339}]\033[0m \033[32m${method}\033[0m \033[34m${uri}\033[0m \033[33m${status}\033[0m ${latency_human}\n",
	}))
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{
			"http://localhost:*",
		},
		AllowMethods: []string{
			echo.GET, echo.POST, echo.PUT, echo.DELETE, echo.OPTIONS,
		},
		AllowHeaders: []string{
			"Content-Type", "Authorization",
		},
		AllowCredentials: true,
	}))
	e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
		Skipper: func(c echo.Context) bool {
			// Skip the proxy if the prefix is /api
			return len(c.Path()) >= 4 && c.Path()[:4] == "/api"
		},
		// Root directory from where the static content is served.
		Root: "/",
		// Enable HTML5 mode by forwarding all not-found requests to root so that
		// SPA (single-page application) can handle the routing.
		HTML5:      true,
		Browse:     false,
		IgnoreBase: true,
		Filesystem: http.FS(embedfs.DistDirFS),
	}))
}

func main() {
	e := echo.New()

	e.FileFS("/", "index.html", embedfs.DistIndexHTML)
	e.StaticFS("/", embedfs.DistDirFS)

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
