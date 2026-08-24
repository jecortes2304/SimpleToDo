package app

import (
	"fmt"
	"os"
	"simpletodo/internal/config"
)

func setUpConfig() {
	if err := config.EnsureEnvInteractive(); err != nil {
		fmt.Println("ERROR: Invalid config:", err)
		os.Exit(1)
	}

	if err := config.LoadEnvFromAppDir(); err != nil {
		fmt.Println("ERROR: Error loading .env:", err)
		os.Exit(1)
	}
}

func Run() error {
	setUpConfig()
	err := SetUpRouters()
	if err != nil {
		return err
	}

	return nil
}
