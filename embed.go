package simpletodo

import (
	"embed"

	"github.com/labstack/echo/v4"
)

var (
	//go:embed assets/app/banner.txt
	BannerFS embed.FS

	//go:embed assets/app/root_image.png
	RootImage embed.FS

	//go:embed assets/app/templates/*.html
	TemplatesFS embed.FS

	// The frontend build is synchronized here before every build/run command.
	//go:embed internal/app/webdist
	StaticFS embed.FS

	DistDirFS     = echo.MustSubFS(StaticFS, "internal/app/webdist")
	DistIndexHTML = DistDirFS
)
