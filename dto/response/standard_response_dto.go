package response

import (
	"github.com/labstack/echo/v4"
	"reflect"
)

type StandardResponse struct {
	StatusCode    int    `json:"statusCode"`
	StatusMessage string `json:"statusMessage"`
}

type StandardResponseOk struct {
	StandardResponse
	Result any `json:"result"`
}

type StandardResponseOkPaginated struct {
	StandardResponse
	Pagination
}

type StandardResponseError struct {
	StandardResponse
	Errors any `json:"errors"`
}

func WriteJSONResponse(c echo.Context, statusCode int, message string, data any, isError bool) error {

	var response any
	if isError {
		response = StandardResponseError{
			StandardResponse: StandardResponse{
				StatusCode:    statusCode,
				StatusMessage: message,
			},
			Errors: data,
		}
	} else {
		if data != nil && reflect.TypeOf(data).Kind() == reflect.Slice {
			response = StandardResponseOkPaginated{
				StandardResponse: StandardResponse{
					StatusCode:    statusCode,
					StatusMessage: message,
				},
				Pagination: data.(Pagination),
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

	}

	return c.JSON(statusCode, response)
}
