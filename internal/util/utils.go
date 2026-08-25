package util

import (
	"fmt"
	"os"
	"runtime"
	embedfs "simpletodo"
	sharedbuildinfo "simpletodo/internal/buildinfo"
	"strings"
)

const (
	colorReset = "\033[0m"
	colorBlue  = "\033[38;5;75m"
	colorWhite = "\033[38;5;255m"
)

func PrintBanner() {
	banner, err := embedfs.BannerFS.ReadFile("assets/app/banner.txt")
	if err != nil {
		fmt.Println("WARNING: Banner not found:", err)
		return
	}
	blue, white, reset := colorBlue, colorWhite, colorReset
	if os.Getenv("NO_COLOR") != "" {
		blue, white, reset = "", "", ""
	}
	bannerArr := strings.Split(string(banner), "\n")
	fmt.Println(blue + strings.Join(bannerArr, "\n") + reset)
	fmt.Printf("%sVersion:%s %s\n", white, reset, sharedbuildinfo.Version)
	fmt.Printf("%sCommit:%s %s\n", white, reset, sharedbuildinfo.Commit)
	fmt.Printf("%sBuild Time:%s %s\n", white, reset, sharedbuildinfo.BuildTime)
	fmt.Printf("%sGo Runtime:%s %s\n", white, reset, runtime.Version())
	fmt.Println(blue + strings.Repeat("=", 72) + reset)
}
