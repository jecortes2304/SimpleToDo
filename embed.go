package embedfs

import (
	"embed"
	"github.com/labstack/echo/v4"
)

var (
	//go:embed config/banner.txt
	BannerFS embed.FS

	//go:embed config/root_image.png
	ImageFS embed.FS

	//go:embed db/data.sql
	SQLFS embed.FS

	//go:embed frontend/dist/*
	StaticFS embed.FS

	//go:embed frontend/dist/index.html
	indexHTML embed.FS

	DistDirFS     = echo.MustSubFS(StaticFS, "frontend/dist")
	DistIndexHTML = echo.MustSubFS(indexHTML, "frontend/dist")
)
