package v1

import (
	"net/http"
	"net/http/httptest"
	"simpletodo/internal/config"
	"simpletodo/internal/repository"
	"simpletodo/internal/service"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
)

func authRouterTestController(t *testing.T) *AuthController {
	t.Helper()
	originalEnv := config.Env
	t.Cleanup(func() { config.Env = originalEnv })
	config.Env.BaseURL = "http://localhost:8000"
	return NewAuthController(service.NewAuthService(repository.NewAuthRepository(nil)))
}

func TestGoogleOAuthCallbackRejectsMismatchedStateAndClearsCookie(t *testing.T) {
	controller := authRouterTestController(t)
	e := echo.New()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/auth/oauth/google/callback?state=attacker&code=code", nil)
	request.AddCookie(&http.Cookie{Name: googleOAuthStateCookie, Value: "expected-state"})
	recorder := httptest.NewRecorder()

	if err := controller.googleOAuthCallback(e.NewContext(request, recorder)); err != nil {
		t.Fatalf("callback returned error: %v", err)
	}
	if recorder.Code != http.StatusFound {
		t.Fatalf("expected redirect, got %d", recorder.Code)
	}
	if location := recorder.Header().Get("Location"); location != "http://localhost:8000/auth?oauth_error=invalid_state" {
		t.Fatalf("unexpected redirect: %s", location)
	}
	if cookie := recorder.Header().Get("Set-Cookie"); !strings.Contains(cookie, googleOAuthStateCookie+"=") || !strings.Contains(cookie, "Max-Age=0") {
		t.Fatalf("state cookie was not cleared: %s", cookie)
	}
}

func TestGoogleOAuthStartReturnsServiceUnavailableWhenDisabled(t *testing.T) {
	controller := authRouterTestController(t)
	config.Env.GoogleClientID = ""
	config.Env.GoogleClientSecret = ""
	e := echo.New()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/auth/oauth/google", nil)
	recorder := httptest.NewRecorder()

	if err := controller.googleOAuthStart(e.NewContext(request, recorder)); err != nil {
		t.Fatalf("start returned error: %v", err)
	}
	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d: %s", recorder.Code, recorder.Body.String())
	}
}

func TestProvidersReflectGoogleConfiguration(t *testing.T) {
	controller := authRouterTestController(t)
	e := echo.New()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/auth/providers", nil)
	recorder := httptest.NewRecorder()

	if err := controller.providers(e.NewContext(request, recorder)); err != nil {
		t.Fatalf("providers returned error: %v", err)
	}
	if !strings.Contains(recorder.Body.String(), `"google":false`) {
		t.Fatalf("unexpected disabled response: %s", recorder.Body.String())
	}

	config.Env.GoogleClientID = "client"
	config.Env.GoogleClientSecret = "secret"
	recorder = httptest.NewRecorder()
	if err := controller.providers(e.NewContext(request, recorder)); err != nil {
		t.Fatalf("providers returned error: %v", err)
	}
	if !strings.Contains(recorder.Body.String(), `"google":true`) {
		t.Fatalf("unexpected enabled response: %s", recorder.Body.String())
	}
}
