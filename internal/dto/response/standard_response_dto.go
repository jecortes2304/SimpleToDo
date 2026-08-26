package response

import (
	"fmt"

	"github.com/labstack/echo/v4"
)

type StandardResponse struct {
	StatusCode    int    `json:"statusCode"`
	StatusMessage string `json:"statusMessage"`
}

type StandardResponseOk struct {
	StandardResponse
	Result any `json:"result"`
}

type StandardResponseError struct {
	StandardResponse
	Errors []string `json:"errors"`
}

func normalizeErrors(data any) []string {
	switch value := data.(type) {
	case nil:
		return []string{}
	case []string:
		return value
	case string:
		return []string{value}
	case error:
		return []string{value.Error()}
	default:
		return []string{fmt.Sprint(value)}
	}
}

func WriteJSONResponse(c echo.Context, statusCode int, message string, data any, isError bool) error {

	var response any
	if isError {
		response = StandardResponseError{
			StandardResponse: StandardResponse{
				StatusCode:    statusCode,
				StatusMessage: message,
			},
			Errors: normalizeErrors(data),
		}
	} else {
		response = StandardResponseOk{
			StandardResponse: StandardResponse{
				StatusCode:    statusCode,
				StatusMessage: message,
			},
			Result: data,
		}
	}

	return c.JSON(statusCode, response)
}
