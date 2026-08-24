package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"simpletodo/internal/config"
	"simpletodo/internal/models"
	"strings"

	"golang.org/x/oauth2"
)

const (
	GoogleOAuthProvider = "google"
	googleUserInfoURL   = "https://openidconnect.googleapis.com/v1/userinfo"
	googleAuthURL       = "https://accounts.google.com/o/oauth2/v2/auth"
	googleTokenURL      = "https://oauth2.googleapis.com/token"
)

var (
	ErrGoogleNotConfigured   = errors.New("google authentication is not configured")
	ErrGoogleEmailUnverified = errors.New("google email is not verified")
	ErrInvalidGoogleProfile  = errors.New("google profile is incomplete")
	usernameCleaner          = regexp.MustCompile(`[^a-z0-9._-]+`)
)

type GoogleProfile struct {
	Subject       string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
}

type OAuthUserResult struct {
	User    *models.User
	Created bool
}

func (s *AuthService) googleOAuthConfig() (*oauth2.Config, error) {
	env := config.GetAppEnv()
	if strings.TrimSpace(env.GoogleClientID) == "" || strings.TrimSpace(env.GoogleClientSecret) == "" {
		return nil, ErrGoogleNotConfigured
	}
	return &oauth2.Config{
		ClientID:     env.GoogleClientID,
		ClientSecret: env.GoogleClientSecret,
		RedirectURL:  strings.TrimRight(env.BaseURL, "/") + "/api/v1/auth/oauth/google/callback",
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     s.googleEndpoint,
	}, nil
}

func (s *AuthService) GoogleEnabled() bool {
	_, err := s.googleOAuthConfig()
	return err == nil
}

func (s *AuthService) GoogleAuthorizationURL(state string) (string, error) {
	cfg, err := s.googleOAuthConfig()
	if err != nil {
		return "", err
	}
	return cfg.AuthCodeURL(state, oauth2.AccessTypeOnline), nil
}

func (s *AuthService) CompleteGoogleOAuth(ctx context.Context, code string) (*OAuthUserResult, error) {
	cfg, err := s.googleOAuthConfig()
	if err != nil {
		return nil, err
	}
	oauthContext := context.WithValue(ctx, oauth2.HTTPClient, s.httpClient)
	token, err := cfg.Exchange(oauthContext, code)
	if err != nil {
		return nil, fmt.Errorf("exchange google authorization code: %w", err)
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, s.googleUserInfoURL, nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Authorization", "Bearer "+token.AccessToken)
	response, err := s.httpClient.Do(request)
	if err != nil {
		return nil, fmt.Errorf("request google profile: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		_, _ = io.Copy(io.Discard, io.LimitReader(response.Body, 1<<20))
		return nil, fmt.Errorf("google profile returned status %d", response.StatusCode)
	}

	var profile GoogleProfile
	if err = json.NewDecoder(io.LimitReader(response.Body, 1<<20)).Decode(&profile); err != nil {
		return nil, fmt.Errorf("decode google profile: %w", err)
	}
	profile.Subject = strings.TrimSpace(profile.Subject)
	profile.Email = strings.ToLower(strings.TrimSpace(profile.Email))
	if profile.Subject == "" || profile.Email == "" {
		return nil, ErrInvalidGoogleProfile
	}
	if !profile.EmailVerified {
		return nil, ErrGoogleEmailUnverified
	}

	password, err := s.generateToken(32)
	if err != nil {
		return nil, err
	}
	firstName := strings.TrimSpace(profile.GivenName)
	lastName := strings.TrimSpace(profile.FamilyName)
	if firstName == "" {
		firstName = "Google"
	}
	if lastName == "" {
		lastName = "User"
	}
	usernameBase := googleUsernameBase(profile.Email)
	user, created, err := s.AuthRepository.ResolveOAuthUser(
		GoogleOAuthProvider,
		profile.Subject,
		profile.Email,
		usernameBase,
		password,
		firstName,
		lastName,
	)
	if err != nil {
		return nil, fmt.Errorf("resolve google user: %w", err)
	}
	return &OAuthUserResult{User: user, Created: created}, nil
}

func googleUsernameBase(email string) string {
	base, _, _ := strings.Cut(strings.ToLower(email), "@")
	base = usernameCleaner.ReplaceAllString(base, "-")
	base = strings.Trim(base, ".-_")
	if len(base) < 3 {
		base = "user-" + base
	}
	if len(base) > 80 {
		base = base[:80]
	}
	return base
}
