package app

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestEmbeddedFrontendServesRootAssetsAndSPARoutes(t *testing.T) {
	e := echo.New()
	registerEmbeddedFrontend(e)

	for _, path := range []string{"/", "/projects"} {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("GET %s returned %d, want %d", path, rec.Code, http.StatusOK)
		}
		if !strings.Contains(rec.Body.String(), "<div id=\"root\">") {
			t.Fatalf("GET %s did not return the frontend index", path)
		}
	}

	req := httptest.NewRequest(http.MethodGet, "/logo.svg", nil)
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("GET /logo.svg returned %d, want %d", rec.Code, http.StatusOK)
	}
	if body, _ := io.ReadAll(rec.Result().Body); len(body) == 0 {
		t.Fatal("GET /logo.svg returned an empty asset")
	}
}
