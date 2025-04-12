package main

import (
	embedfs "SimpleToDo"
	"SimpleToDo/db"
	"SimpleToDo/router"
	"SimpleToDo/util"
	"flag"
	"fmt"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"net/http"
	"os/exec"
	"runtime"
	"strings"
	"time"
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

func main() {
	port := flag.Int("port", 8080, "Port to run the server on")
	openBrowserVal := flag.Bool("openbrowser", false, "Open browser on start")

	flag.Parse()

	fmt.Println("Port:", *port)
	fmt.Println("Open browser:", *openBrowserVal)

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

	if *openBrowserVal {
		go func() {
			time.Sleep(1 * time.Second)
			openBrowser(fmt.Sprintf("http://127.0.0.1:%d", *port))
		}()
	}

	e.Logger.Fatal(e.Start(fmt.Sprintf(":%d", *port)))
}
