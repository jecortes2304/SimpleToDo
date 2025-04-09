package util

import (
	"SimpleToDo"
	"fmt"
)

func PrintBanner() {
	banner, err := embedfs.BannerFS.ReadFile("config/banner.txt")
	if err != nil {
		fmt.Println("⚠️ Banner not found:", err)
		return
	}
	fmt.Println(string(banner))
}
