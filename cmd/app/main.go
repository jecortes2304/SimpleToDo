package main

import (
	"simpletodo/internal/app"

	"github.com/labstack/gommon/log"
	_ "github.com/swaggo/echo-swagger"
)

func main() {
	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}
