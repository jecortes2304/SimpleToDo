package app

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"runtime"
	embedfs "simpletodo"
	"simpletodo/api"
	"simpletodo/internal/config"
	"simpletodo/internal/db"
	"simpletodo/internal/repository"
	"simpletodo/internal/router"
	"simpletodo/internal/service"
	"simpletodo/internal/util"
	"strings"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/labstack/gommon/log"
	echoSwagger "github.com/swaggo/echo-swagger"
)

func applyMiddlewares(e *echo.Echo, showLogs *bool, corsOrigins *[]string, debug *bool) {

	if !*showLogs {
		e.Logger.SetLevel(log.OFF)
	} else {
		format := "\u001B[32m${id} - \033[36m[${time_rfc3339}]\033[0m \033[32m${method}\033[0m \033[34m${uri}\033[0m \033[33m${status}\033[0m ${latency_human}\n"
		if os.Getenv("NO_COLOR") != "" {
			format = "${time_rfc3339} ${method} ${uri} ${status} latency_ns=${latency}\n"
		}
		e.Use(middleware.LoggerWithConfig(middleware.LoggerConfig{
			Format: format,
		}))
	}
	corsConfig := middleware.CORSConfig{
		AllowMethods: []string{
			echo.GET, echo.POST, echo.PUT, echo.PATCH, echo.DELETE, echo.OPTIONS,
		},
		AllowHeaders: []string{
			echo.HeaderContentType, echo.HeaderAuthorization, "Application-Name", "Accept",
		},
		AllowCredentials: true,
	}

	if *debug {
		corsConfig.AllowOriginFunc = func(origin string) (bool, error) {
			return true, nil
		}
		fmt.Println("🔓 CORS: Debug mode enabled - Allowing all origins with credentials")
	} else {
		if len(*corsOrigins) == 0 {
			fmt.Println("WARNING: No CORS origins defined in production!")
		}
		corsConfig.AllowOrigins = *corsOrigins
	}

	e.Use(middleware.CORSWithConfig(corsConfig))
	e.Use(middleware.Recover())
	e.Use(middleware.RequestID())

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

func isAddressInUse(err error) bool {
	// 10048 is WSAEADDRINUSE on Windows; syscall.EADDRINUSE covers Unix.
	return errors.Is(err, syscall.EADDRINUSE) || errors.Is(err, syscall.Errno(10048))
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
		fmt.Println("ERROR: Error opening browser:", err)
	} else {
		fmt.Println("🌐 Browser launched:", url)
	}
}

// @title           simpletodo API
// @version         1.0.0
// @description     REST API for SimpleTodo. All responses use statusCode and statusMessage; successful payloads are returned in result and failures in errors.
// @description     Protected operations accept a JWT through Authorization: Bearer <token>. The web client may alternatively use the HTTP-only auth cookie set by login.

// @license.name    MIT
// @license.url     https://opensource.org/licenses/MIT

// @host      localhost:8000
// @BasePath  /api/v1
// @schemes   http

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Provide your JWT as: Bearer <token>
func SetUpRouters() error {
	e := echo.New()

	e.HideBanner = true
	e.HidePort = true
	util.PrintBanner()

	env := config.GetAppEnv()
	applyMiddlewares(e, &env.ShowLogs, &env.CorsOrigin, &env.Debug)
	address := fmt.Sprintf(":%d", env.Port)
	listener, err := net.Listen("tcp", address)
	if err != nil {
		if isAddressInUse(err) {
			return fmt.Errorf("cannot start server: port %d is already in use; stop the other server or configure another PORT", env.Port)
		}
		return fmt.Errorf("cannot reserve server port %d: %w", env.Port, err)
	}
	e.Listener = listener
	defer listener.Close()

	if u, err := url.Parse(env.BaseURL); err == nil && u.Scheme != "" && u.Host != "" {
		api.SwaggerInfo.Host = u.Host
		api.SwaggerInfo.Schemes = []string{u.Scheme}
	} else {
		api.SwaggerInfo.Host = fmt.Sprintf("%s:%d", env.Host, env.Port)
		api.SwaggerInfo.Schemes = []string{env.Scheme}
	}

	errDb, DB := db.InitDB()
	if errDb != nil {
		fmt.Println("Error initializing database:", errDb)
		return errDb
	}
	cleanupService := service.NewAuthService(repository.NewAuthRepository(DB))
	go cleanupService.RunUnverifiedAccountCleanup(context.Background(), time.Hour)

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
				fmt.Println("WARNING: SCHEME or HOST are not set properly in .env file.")
			}
		}()
	}

	fmt.Printf("Server listening on %s://%s:%d\n", env.Scheme, env.Host, env.Port)
	if err := e.Start(address); err != nil && !errors.Is(err, http.ErrServerClosed) {
		if isAddressInUse(err) {
			return fmt.Errorf("cannot start server: port %d is already in use; stop the other server or configure another PORT", env.Port)
		}
		return fmt.Errorf("cannot start server on port %d: %w", env.Port, err)
	}
	return nil
}
