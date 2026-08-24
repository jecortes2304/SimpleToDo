package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"simpletodo/internal/config"
	"simpletodo/internal/models"
	"simpletodo/internal/repository"
	"strings"
	"testing"

	"github.com/glebarez/sqlite"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
)

func authTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", t.Name())
	database, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	if err = database.AutoMigrate(
		&models.User{},
		&models.OAuthIdentity{},
		&models.Project{},
		&models.Task{},
		&models.AIServerSettings{},
		&models.EmailVerificationToken{},
		&models.PasswordResetToken{},
	); err != nil {
		t.Fatalf("migrate test database: %v", err)
	}
	return database
}

func configureGoogleTest(t *testing.T, authService *AuthService, profile GoogleProfile) {
	t.Helper()
	originalEnv := config.Env
	t.Cleanup(func() { config.Env = originalEnv })

	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		switch request.URL.Path {
		case "/token":
			writer.Header().Set("Content-Type", "application/json")
			_, _ = writer.Write([]byte(`{"access_token":"google-access-token","token_type":"Bearer","expires_in":3600}`))
		case "/userinfo":
			if request.Header.Get("Authorization") != "Bearer google-access-token" {
				http.Error(writer, "missing bearer token", http.StatusUnauthorized)
				return
			}
			writer.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(writer).Encode(profile)
		default:
			http.NotFound(writer, request)
		}
	}))
	t.Cleanup(server.Close)

	config.Env.GoogleClientID = "test-client"
	config.Env.GoogleClientSecret = "test-secret"
	config.Env.BaseURL = "http://localhost:8000"
	authService.googleEndpoint = oauth2.Endpoint{AuthURL: server.URL + "/auth", TokenURL: server.URL + "/token"}
	authService.googleUserInfoURL = server.URL + "/userinfo"
	authService.httpClient = server.Client()
}

func TestCompleteGoogleOAuthCreatesUnverifiedUserAndReusesIdentity(t *testing.T) {
	database := authTestDB(t)
	authService := NewAuthService(repository.NewAuthRepository(database))
	configureGoogleTest(t, authService, GoogleProfile{
		Subject:       "google-subject-1",
		Email:         "New.User@Example.com",
		EmailVerified: true,
		GivenName:     "New",
		FamilyName:    "User",
	})

	first, err := authService.CompleteGoogleOAuth(context.Background(), "valid-code")
	if err != nil {
		t.Fatalf("complete first Google login: %v", err)
	}
	if !first.Created || first.User.Verified || first.User.Email != "new.user@example.com" {
		t.Fatalf("unexpected created user: %+v", first)
	}

	second, err := authService.CompleteGoogleOAuth(context.Background(), "valid-code")
	if err != nil {
		t.Fatalf("complete repeated Google login: %v", err)
	}
	if second.Created || second.User.ID != first.User.ID {
		t.Fatalf("identity was not reused: first=%+v second=%+v", first, second)
	}
}

func TestCompleteGoogleOAuthLinksExistingVerifiedEmail(t *testing.T) {
	database := authTestDB(t)
	existing := models.User{
		FirstName: "Existing", LastName: "User", Email: "existing@example.com",
		Username: "existing", Password: "valid-password", RoleId: 2, Verified: true,
	}
	if err := database.Create(&existing).Error; err != nil {
		t.Fatalf("create existing user: %v", err)
	}
	authService := NewAuthService(repository.NewAuthRepository(database))
	configureGoogleTest(t, authService, GoogleProfile{
		Subject: "google-existing", Email: "EXISTING@example.com", EmailVerified: true,
	})

	result, err := authService.CompleteGoogleOAuth(context.Background(), "valid-code")
	if err != nil {
		t.Fatalf("complete Google login: %v", err)
	}
	if result.Created || result.User.ID != existing.ID || !result.User.Verified {
		t.Fatalf("existing user was not linked: %+v", result)
	}
}

func TestCompleteGoogleOAuthRejectsUnverifiedGoogleEmail(t *testing.T) {
	database := authTestDB(t)
	authService := NewAuthService(repository.NewAuthRepository(database))
	configureGoogleTest(t, authService, GoogleProfile{
		Subject: "google-unverified", Email: "person@example.com", EmailVerified: false,
	})

	_, err := authService.CompleteGoogleOAuth(context.Background(), "valid-code")
	if err != ErrGoogleEmailUnverified {
		t.Fatalf("expected ErrGoogleEmailUnverified, got %v", err)
	}
}

func TestOAuthUsersReceiveUniqueGeneratedUsernames(t *testing.T) {
	database := authTestDB(t)
	authRepository := repository.NewAuthRepository(database)

	first, _, err := authRepository.ResolveOAuthUser("google", "subject-one", "same@one.example", "same", "password-one", "First", "User")
	if err != nil {
		t.Fatalf("create first OAuth user: %v", err)
	}
	second, _, err := authRepository.ResolveOAuthUser("google", "subject-two", "same@two.example", "same", "password-two", "Second", "User")
	if err != nil {
		t.Fatalf("create second OAuth user: %v", err)
	}
	if first.Username != "same" || second.Username != "same-1" {
		t.Fatalf("unexpected generated usernames: %q and %q", first.Username, second.Username)
	}
}

func TestGoogleAuthorizationURLIncludesStateAndMinimalScopes(t *testing.T) {
	database := authTestDB(t)
	authService := NewAuthService(repository.NewAuthRepository(database))
	configureGoogleTest(t, authService, GoogleProfile{})

	authorizationURL, err := authService.GoogleAuthorizationURL("csrf-state")
	if err != nil {
		t.Fatalf("build authorization URL: %v", err)
	}
	if authorizationURL == "" || !containsAll(authorizationURL, "state=csrf-state", "scope=openid+email+profile", "response_type=code") {
		t.Fatalf("unexpected authorization URL: %s", authorizationURL)
	}
}

func containsAll(value string, expected ...string) bool {
	for _, item := range expected {
		if !strings.Contains(value, item) {
			return false
		}
	}
	return true
}
