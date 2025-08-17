package embedfs

import (
	"embed"
	"github.com/labstack/echo/v4"
)

var (
	//go:embed config/static/banner.txt
	BannerFS embed.FS

	//go:embed config/static/root_image.png
	ImageFS embed.FS

	//go:embed config/static/templates/*.html
	TemplatesFS embed.FS

	//go:embed frontend/dist/*
	StaticFS embed.FS

	//go:embed frontend/dist/index.html
	indexHTML embed.FS

	DistDirFS     = echo.MustSubFS(StaticFS, "frontend/dist")
	DistIndexHTML = echo.MustSubFS(indexHTML, "frontend/dist")
)
