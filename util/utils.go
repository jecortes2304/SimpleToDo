package util

import (
	"SimpleToDo"
	"SimpleToDo/config"
	"fmt"
	"os"
	"text/template"
)

func PrintBanner() {
	banner, err := embedfs.BannerFS.ReadFile("config/static/banner.txt")
	if err != nil {
		fmt.Println("⚠️ Banner not found:", err)
		return
	}
	t := template.Must(template.New("banner").Parse(string(banner)))
	err = t.Execute(os.Stdout, config.VersionInfo)
	if err != nil {
		_, _ = os.Stdout.WriteString("Error imprimiendo banner: " + err.Error() + "\n")
	}
}
