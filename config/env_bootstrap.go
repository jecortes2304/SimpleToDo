package config

import (
	"bufio"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"github.com/joho/godotenv"
	"net"
	"net/mail"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"
)

const EnvFileName = ".env"

var Env AppEnv

type envField struct {
	Key       string
	Prompt    string
	Default   string
	Optional  bool
	Secret    bool
	Validate  func(string) error
	Normalize func(string) string
}

type DBClientEnum string

const (
	PostgreSQL DBClientEnum = "postgresql"
	SQLite     DBClientEnum = "sqlite"
)

type AppEnv struct {
	JWTSecret     string
	Scheme        string
	Host          string
	Port          int
	BaseURL       string
	CorsOrigin    []string
	OpenBrowser   bool
	ShowLogs      bool
	SMTPHost      string
	SMTPPort      int
	SMTPUser      string
	SMTPPassword  string
	SMTPFromEmail string
	RootFirstName string
	RootLastName  string
	RootPhone     string
	RootEmail     string
	RootUsername  string
	RootPassword  string
	DbClient      string
	DbHost        string
	DbPort        int
	DbUser        string
	DbPassword    string
	DbName        string
	DbSSL         bool
	Timezone      string
}

var (
	reHostName = regexp.MustCompile(`^[a-zA-Z0-9.-]+$`)
	reUser     = regexp.MustCompile(`^.{1,}$`)
	reJWT      = regexp.MustCompile(`^.{16,}$`)
	rePhone    = regexp.MustCompile(`^[0-9+\-().\s]{6,}$`)
	reUsername = regexp.MustCompile(`^[a-zA-Z0-9._-]{3,}$`)
)

func validateDbClient(v string) error {
	x := strings.ToLower(strings.TrimSpace(v))
	if x != string(PostgreSQL) && x != string(SQLite) {
		return errors.New("DB_CLIENT must be postgresql or sqlite")
	}
	return nil
}

func validateTimezone(v string) error {
	v = strings.TrimSpace(v)
	if v == "" {
		return nil
	}
	_, err := time.LoadLocation(v)
	if err != nil {
		return errors.New("invalid TIMEZONE")
	}
	return nil
}

func validateScheme(v string) error {
	x := strings.ToLower(strings.TrimSpace(v))
	if x != "http" && x != "https" {
		return errors.New("SCHEME must be http or https")
	}
	return nil
}

func validateHost(v string) error {
	v = strings.TrimSpace(v)
	if ip := net.ParseIP(v); ip != nil {
		return nil
	}
	if !reHostName.MatchString(v) {
		return errors.New("HOST is invalid (use hostname or IP, no port)")
	}
	return nil
}

func validatePort(v string) error {
	p, err := strconv.Atoi(strings.TrimSpace(v))
	if err != nil || p < 1 || p > 65535 {
		return errors.New("PORT must be in 1-65535")
	}
	return nil
}

func validateBool(v string) error {
	x := strings.ToLower(strings.TrimSpace(v))
	if x != "true" && x != "false" {
		return errors.New("value must be true or false")
	}
	return nil
}

func validateBaseURL(v string) error {
	if strings.TrimSpace(v) == "" {
		return nil
	}
	u, err := url.Parse(strings.TrimSpace(v))
	if err != nil {
		return errors.New("BASE_URL is not a valid URL")
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return errors.New("BASE_URL must use http or https")
	}
	if u.Host == "" {
		return errors.New("BASE_URL must include a host")
	}
	return nil
}

func validateCorsOrigin(v string) error {
	if strings.TrimSpace(v) == "" {
		return nil
	}
	for _, origin := range splitCSV(v) {
		if _, err := url.ParseRequestURI(origin); err != nil {
			return fmt.Errorf("invalid CORS_ORIGIN: %s", origin)
		}
	}
	return nil
}

func validateSMTPPort(v string) error {
	if strings.TrimSpace(v) == "" {
		return nil
	}
	p, err := strconv.Atoi(v)
	if err != nil || p < 1 || p > 65535 {
		return errors.New("SMTP_PORT must be in 1-65535")
	}
	return nil
}

func validateNonEmpty(v string) error {
	if strings.TrimSpace(v) == "" {
		return errors.New("value cannot be empty")
	}
	return nil
}

func validateJWT(v string) error {
	if !reJWT.MatchString(v) {
		return errors.New("JWT_SECRET must be at least 16 characters")
	}
	return nil
}

func validateEmail(v string) error {
	if strings.TrimSpace(v) == "" {
		return nil
	}
	_, err := mail.ParseAddress(strings.TrimSpace(v))
	if err != nil {
		return errors.New("invalid email")
	}
	return nil
}

func validatePhone(v string) error {
	if strings.TrimSpace(v) == "" {
		return nil
	}
	if !rePhone.MatchString(strings.TrimSpace(v)) {
		return errors.New("invalid phone")
	}
	return nil
}

func validateUsername(v string) error {
	if !reUsername.MatchString(strings.TrimSpace(v)) {
		return errors.New("invalid username (min 3, alnum . _ -)")
	}
	return nil
}

func validatePassword(v string) error {
	if len(strings.TrimSpace(v)) < 8 {
		return errors.New("password too short (min 8)")
	}
	return nil
}

func envPath() (string, error) {
	dir, err := AppDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, EnvFileName), nil
}

func escapeEnv(v string) string {
	if strings.ContainsAny(v, " #=") {
		return strconv.Quote(v)
	}
	return v
}

func parseBoolWithDefault(s string, d bool) bool {
	if strings.EqualFold(strings.TrimSpace(s), "true") {
		return true
	}
	if strings.EqualFold(strings.TrimSpace(s), "false") {
		return false
	}
	return d
}

func splitCSV(s string) []string {
	var out []string
	for _, p := range strings.Split(s, ",") {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func normalizeCSV(s string) string {
	return strings.Join(splitCSV(s), ",")
}

func fallback(s, def string) string {
	if strings.TrimSpace(s) == "" {
		return def
	}
	return s
}

func mustGenerateJWTSecret() string {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "ChangeMePlease_UseAStrongSecret123!"
	}
	return base64.RawURLEncoding.EncodeToString(buf)
}

func atoiDefault(s string, def int) (int, error) {
	if strings.TrimSpace(s) == "" {
		return def, nil
	}
	return strconv.Atoi(s)
}

func fileExists(p string) bool {
	_, err := os.Stat(p)
	return err == nil
}

func AppDir() (string, error) {
	simpleTodoHome := os.Getenv("SIMPLETODO_HOME")
	if v := strings.TrimSpace(simpleTodoHome); v != "" {
		return v, nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, "SimpleToDo"), nil
}

func GetDbClient() (string, error) {
	env := GetAppEnv()
	if env.DbClient != "" {
		return env.DbClient, nil
	}
	return "sqlite", nil
}

func EnsureEnvInteractive() error {
	envPath, err := envPath()
	if err != nil {
		return err
	}
	if err = os.MkdirAll(filepath.Dir(envPath), 0o700); err != nil {
		return err
	}

	fields := []envField{
		{Key: "JWT_SECRET", Prompt: "JWT Secret (>=16 chars)", Default: "", Secret: true, Validate: func(s string) error {
			if strings.TrimSpace(s) == "" {
				return nil
			}
			return validateJWT(s)
		}},
		{Key: "SCHEME", Prompt: "Scheme (http|https)", Default: "http", Validate: validateScheme, Normalize: strings.ToLower},
		{Key: "HOST", Prompt: "Host (e.g., localhost or 127.0.0.1)", Default: "localhost", Validate: validateHost},
		{Key: "PORT", Prompt: "Port", Default: "8000", Validate: validatePort},
		{Key: "BASE_URL", Prompt: "Base URL (leave empty to derive from SCHEME://HOST:PORT)", Default: "", Optional: true, Validate: validateBaseURL},
		{Key: "OPEN_BROWSER", Prompt: "Open browser on start? (true/false)", Default: "true", Validate: validateBool},
		{Key: "SHOW_LOGS", Prompt: "Show logs? (true/false)", Default: "true", Validate: validateBool},
		{Key: "CORS_ORIGIN", Prompt: "CORS Origin (comma-separated)",
			Default: "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173", Optional: true, Validate: validateCorsOrigin, Normalize: normalizeCSV},

		{Key: "SMTP_HOST", Prompt: "SMTP Host", Default: "", Optional: false, Validate: func(s string) error { return nil }},
		{Key: "SMTP_PORT", Prompt: "SMTP Port", Default: "", Optional: false, Validate: validateSMTPPort},
		{Key: "SMTP_USER", Prompt: "SMTP User", Default: "", Optional: false, Validate: func(s string) error {
			if strings.TrimSpace(s) == "" {
				return nil
			}
			if !reUser.MatchString(s) {
				return errors.New("invalid SMTP_USER")
			}
			return nil
		}},
		{Key: "SMTP_PASSWORD", Prompt: "SMTP Password", Default: "", Optional: true, Secret: true, Validate: func(s string) error { return nil }},
		{Key: "SMTP_FROM_EMAIL", Prompt: "SMTP From Email", Default: "", Optional: true, Validate: validateEmail},

		{Key: "ROOT_FIRSTNAME", Prompt: "Root first name", Default: "Admin", Validate: validateNonEmpty},
		{Key: "ROOT_LASTNAME", Prompt: "Root last name", Default: "User", Validate: validateNonEmpty},
		{Key: "ROOT_PHONE", Prompt: "Root phone", Default: "", Optional: false, Validate: validatePhone},
		{Key: "ROOT_EMAIL", Prompt: "Root email", Default: "admin@example.com", Validate: validateEmail},
		{Key: "ROOT_USERNAME", Prompt: "Root username", Default: "admin", Validate: validateUsername},
		{Key: "ROOT_PASSWORD", Prompt: "Root password (>=8)", Default: "", Secret: true, Validate: func(s string) error {
			if strings.TrimSpace(s) == "" {
				return nil
			}
			return validatePassword(s)
		}},
		{Key: "DB_CLIENT", Prompt: "Database client (postgresql|sqlite)", Default: "sqlite", Validate: validateDbClient, Normalize: strings.ToLower},
	}

	// Add DB fields if PostgreSQL is selected
	if dbClient := os.Getenv("DB_CLIENT"); strings.ToLower(strings.TrimSpace(dbClient)) == "postgresql" {
		fields = append(fields,
			envField{Key: "DB_HOST", Prompt: "Database host", Default: "localhost", Validate: validateHost},
			envField{Key: "DB_PORT", Prompt: "Database port", Default: "5432", Validate: validatePort},
			envField{Key: "DB_USER", Prompt: "Database user", Default: "postgres", Validate: validateNonEmpty},
			envField{Key: "DB_PASSWORD", Prompt: "Database password", Default: "", Optional: true, Secret: true, Validate: func(s string) error { return nil }},
			envField{Key: "DB_NAME", Prompt: "Database name", Default: "simpletodo", Validate: validateNonEmpty},
			envField{Key: "DB_SSL", Prompt: "Database SSL (true/false)", Default: "false", Validate: validateBool},
			envField{Key: "TIMEZONE", Prompt: "Timezone (e.g., UTC, leave empty for system default)", Default: "", Optional: true, Validate: validateTimezone},
		)
	}

	// If .env exists, validate and return
	if fileExists(envPath) {
		m, err := godotenv.Read(envPath)
		if err != nil {
			return fmt.Errorf("cannot read %s: %w", envPath, err)
		}
		for _, f := range fields {
			val := strings.TrimSpace(m[f.Key])
			if val == "" && !f.Optional && f.Default == "" {
				return fmt.Errorf("'%s' is empty in %s", f.Key, envPath)
			}
			if f.Normalize != nil {
				val = f.Normalize(val)
			}
			if err := f.Validate(val); err != nil {
				return fmt.Errorf("'%s' invalid: %v", f.Key, err)
			}
		}
		return nil
	}

	// Determine whether we can prompt
	info, _ := os.Stdin.Stat()
	interactive := (info.Mode() & os.ModeCharDevice) != 0

	fmt.Printf("No configuration file found.\nIt will be created at: %s\n\n", envPath)
	if interactive {
		fmt.Println("Tip: Press Enter to accept the default shown in [brackets].")
	}

	values := map[string]string{}

	for _, f := range fields {
		// 1) If provided via environment (env vars or env_file), trust and validate it, no prompt.
		if envVal := strings.TrimSpace(os.Getenv(f.Key)); envVal != "" {
			if f.Normalize != nil {
				envVal = f.Normalize(envVal)
			}
			if err := f.Validate(envVal); err != nil {
				return fmt.Errorf("'%s' invalid (from environment): %v", f.Key, err)
			}
			values[f.Key] = envVal
			continue
		}

		// 2) If not interactive (e.g., container), use defaults (and generate JWT if empty)
		if !interactive {
			candidate := f.Default
			if f.Key == "JWT_SECRET" && candidate == "" {
				candidate = mustGenerateJWTSecret()
				fmt.Println("(generated secure JWT secret)")
			}
			if f.Normalize != nil {
				candidate = f.Normalize(candidate)
			}
			if !f.Optional || candidate != "" {
				if err := f.Validate(candidate); err != nil {
					return fmt.Errorf("'%s' invalid (non-interactive default): %v", f.Key, err)
				}
			}
			values[f.Key] = candidate
			continue
		}

		// 3) Interactive prompt
		reader := bufio.NewReader(os.Stdin)
		for {
			defNote := ""
			if f.Secret && f.Key == "JWT_SECRET" && f.Default == "" {
				defNote = "[default: auto-generate secure key]"
			} else if f.Default != "" {
				defNote = fmt.Sprintf("[default: %s]", f.Default)
			} else if f.Optional {
				defNote = "[optional, can be empty]"
			}
			fmt.Printf("%s %s: ", f.Prompt, defNote)

			line, _ := reader.ReadString('\n')
			input := strings.TrimSpace(line)
			if input == "" {
				if f.Key == "JWT_SECRET" && f.Default == "" {
					input = mustGenerateJWTSecret()
					fmt.Println("(generated secure JWT secret)")
				} else {
					input = f.Default
				}
			}
			if f.Normalize != nil {
				input = f.Normalize(input)
			}
			if !f.Optional || input != "" {
				if err := f.Validate(input); err != nil {
					fmt.Printf("  -> %v\n", err)
					continue
				}
			}
			values[f.Key] = input
			break
		}
	}

	// Derive BASE_URL if empty
	if strings.TrimSpace(values["BASE_URL"]) == "" {
		values["BASE_URL"] = fmt.Sprintf("%s://%s:%s", values["SCHEME"], values["HOST"], values["PORT"])
	}

	// Write .env atomically
	var b strings.Builder
	for _, f := range fields {
		v := values[f.Key]
		_, _ = fmt.Fprintf(&b, "%s=%s\n", f.Key, escapeEnv(v))
	}
	tmp := envPath + ".tmp"
	if err := os.WriteFile(tmp, []byte(b.String()), 0o600); err != nil {
		return err
	}
	if err := os.Rename(tmp, envPath); err != nil {
		return err
	}
	fmt.Printf("\n.env created at %s\n\n", envPath)
	return nil
}

func LoadEnvFromAppDir() error {
	envPath, err := envPath()
	if err != nil {
		return err
	}

	// Load from .env if it exists; otherwise continue (env/process may supply values)
	if fileExists(envPath) {
		if err := godotenv.Load(envPath); err != nil {
			return err
		}
	}

	port, err := atoiDefault(os.Getenv("PORT"), 8000)
	if err != nil {
		return fmt.Errorf("invalid PORT: %w", err)
	}
	smtpPort, err := atoiDefault(os.Getenv("SMTP_PORT"), 0)
	if err != nil {
		return fmt.Errorf("invalid SMTP_PORT: %w", err)
	}

	cors := splitCSV(os.Getenv("CORS_ORIGIN"))
	if len(cors) == 0 {
		cors = []string{"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"}
	}

	scheme := fallback(os.Getenv("SCHEME"), "http")
	host := fallback(os.Getenv("HOST"), "localhost")
	base := strings.TrimSpace(os.Getenv("BASE_URL"))
	if base == "" {
		base = fmt.Sprintf("%s://%s:%d", scheme, host, port)
	}

	jwt := os.Getenv("JWT_SECRET")
	if strings.TrimSpace(jwt) == "" {
		jwt = mustGenerateJWTSecret()
	}

	dbPort, err := atoiDefault(os.Getenv("DB_PORT"), 5432)

	Env = AppEnv{
		JWTSecret:     jwt,
		Scheme:        scheme,
		Host:          host,
		Port:          port,
		BaseURL:       base,
		CorsOrigin:    cors,
		OpenBrowser:   parseBoolWithDefault(os.Getenv("OPEN_BROWSER"), true),
		ShowLogs:      parseBoolWithDefault(os.Getenv("SHOW_LOGS"), true),
		SMTPHost:      os.Getenv("SMTP_HOST"),
		SMTPPort:      smtpPort,
		SMTPUser:      os.Getenv("SMTP_USER"),
		SMTPPassword:  os.Getenv("SMTP_PASSWORD"),
		SMTPFromEmail: os.Getenv("SMTP_FROM_EMAIL"),
		RootFirstName: fallback(os.Getenv("ROOT_FIRSTNAME"), "Admin"),
		RootLastName:  fallback(os.Getenv("ROOT_LASTNAME"), "User"),
		RootPhone:     os.Getenv("ROOT_PHONE"),
		RootEmail:     fallback(os.Getenv("ROOT_EMAIL"), "admin@example.com"),
		RootUsername:  fallback(os.Getenv("ROOT_USERNAME"), "admin"),
		RootPassword:  fallback(os.Getenv("ROOT_PASSWORD"), "ChangeMe123!"),
		DbClient:      fallback(os.Getenv("DB_CLIENT"), "sqlite"),
		DbHost:        fallback(os.Getenv("DB_HOST"), "localhost"),
		DbPort:        dbPort,
		DbUser:        fallback(os.Getenv("DB_USER"), "postgres"),
		DbPassword:    fallback(os.Getenv("DB_PASSWORD"), "postgres"),
		DbName:        fallback(os.Getenv("DB_NAME"), "simpletodo_db"),
		DbSSL:         parseBoolWithDefault(os.Getenv("DB_SSL"), false),
		Timezone:      fallback(os.Getenv("TIMEZONE"), "UTC"),
	}
	return nil
}

func GetAppEnv() *AppEnv {
	return &Env
}

func GetPostgresDBConnectionString() string {
	env := GetAppEnv()
	if env.DbClient == string(PostgreSQL) {
		sslMode := "disable"
		if env.DbSSL {
			sslMode = "enable"
		}
		return fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%d sslmode=%s TimeZone=%s",
			env.DbHost, env.DbUser, env.DbPassword, env.DbName, env.DbPort, sslMode, env.Timezone)
	}
	return ""
}
