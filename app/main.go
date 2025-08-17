package main

import (
	embedfs "SimpleToDo"
	"SimpleToDo/config"
	"SimpleToDo/db"
	"SimpleToDo/docs"
	_ "SimpleToDo/docs"
	"SimpleToDo/router"
	"SimpleToDo/util"
	"fmt"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/labstack/gommon/log"
	_ "github.com/swaggo/echo-swagger"
	echoSwagger "github.com/swaggo/echo-swagger"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"
)

func applyMiddlewares(e *echo.Echo, showLogs *bool, corsOrigins *[]string) {

	if !*showLogs {
		e.Logger.SetLevel(log.OFF)
	} else {
		e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
			Format: "\033[36m[${time_rfc3339}]\033[0m \033[32m${method}\033[0m \033[34m${uri}\033[0m \033[33m${status}\033[0m ${latency_human}\n",
		}))
	}

	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: *corsOrigins,
		AllowMethods: []string{
			echo.GET, echo.POST, echo.PUT, echo.PATCH, echo.DELETE, echo.OPTIONS,
		},
		AllowHeaders: []string{
			"Content-Type", "Authorization",
		},
		AllowCredentials: true,
	}))

	e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
		Skipper: func(c echo.Context) bool {
			path := c.Request().URL.Path
			// Jump over API and Swagger paths to avoid serving static files for them.
			return strings.HasPrefix(path, "/api") || strings.HasPrefix(path, "/swagger")
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

func openBrowser(url string) {
	var err error

	switch runtime.GOOS {
	case "linux", "freebsd", "openbsd", "netbsd":
		err = exec.Command("xdg-open", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	case "windows":
		r := strings.NewReplacer("&", "^&")
		err = exec.Command("cmd", "/c", "start", r.Replace(url)).Start()
	default:
		err = fmt.Errorf("unsupported platform")
	}

	if err != nil {
		fmt.Println("❌ Error opening browser:", err)
	} else {
		fmt.Println("🌐 Browser launched:", url)
	}
}

// @title           SimpleToDo API
// @version         1.0.0
// @description     REST API for SimpleToDo. Includes authentication, email verification, password reset, projects, tasks management.
// @termsOfService  https://example.com/terms

// @contact.name    API Support
// @contact.url     https://example.com/support
// @contact.email   support@example.com

// @license.name    MIT
// @license.url     https://opensource.org/licenses/MIT

// @host      localhost:8000
// @BasePath  /api/v1
// @schemes   http

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Provide your JWT as: Bearer <token>
func main() {

	if err := config.EnsureEnvInteractive(); err != nil {
		fmt.Println("❌ Invalid config:", err)
		os.Exit(1)
	}

	if err := config.LoadEnvFromAppDir(); err != nil {
		fmt.Println("❌ Error loading .env:", err)
		os.Exit(1)
	}

	e := echo.New()

	e.HideBanner = true
	util.PrintBanner()

	env := config.GetAppEnv()
	applyMiddlewares(e, &env.ShowLogs, &env.CorsOrigin)

	if u, err := url.Parse(env.BaseURL); err == nil && u.Scheme != "" && u.Host != "" {
		docs.SwaggerInfo.Host = u.Host
		docs.SwaggerInfo.Schemes = []string{u.Scheme}
	} else {
		docs.SwaggerInfo.Host = fmt.Sprintf("%s:%d", env.Host, env.Port)
		docs.SwaggerInfo.Schemes = []string{env.Scheme}
	}

	errDb, DB := db.InitDB()
	if errDb != nil {
		fmt.Println("Error initializing database:", errDb)
		return
	}

	// Initialize routes
	router.InitRouters(e, DB)

	// Serve Swagger UI at /swagger/index.html
	e.GET("/swagger/*", echoSwagger.WrapHandler)

	// Serve static files from the embedded filesystem
	e.FileFS("/", "index.html", embedfs.DistIndexHTML)
	e.StaticFS("/", embedfs.DistDirFS)

	if env.OpenBrowser {
		go func() {
			time.Sleep(1 * time.Second)
			if (env.Scheme == "http" || env.Scheme == "https") && env.Host != "" {
				openBrowser(fmt.Sprintf("%s://%s:%d", env.Scheme, env.Host, env.Port))
			} else {
				fmt.Println("⚠️  SCHEME or HOST are not set properly in .env file.")
			}
		}()
	}

	e.Logger.Fatal(e.Start(fmt.Sprintf(":%d", env.Port)))
}
