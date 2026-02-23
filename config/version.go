package config

import "runtime"

var VersionInfo struct {
	Version   string
	Commit    string
	BuildDate string
	GoVersion string
}

var (
	version   = "dev"
	commit    = "none"
	buildDate = "unknown"
	goVersion = runtime.Version()
)

func init() {
	VersionInfo.Version = version
	VersionInfo.Commit = commit
	VersionInfo.BuildDate = buildDate
	VersionInfo.GoVersion = goVersion
}
