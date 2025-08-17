package request

import "time"

type RegisterRequest struct {
	Username  string    `json:"username" validate:"required,min=2,max=100" example:"jdoe"`
	Email     string    `json:"email" validate:"required,email" example:"jdoe@example.com"`
	Password  string    `json:"password" validate:"required,min=6,max=50" example:"P@ssw0rd!"`
	Phone     string    `json:"phone" validate:"min=4,max=15" example:"+34123456789"`
	FirstName string    `json:"firstName" validate:"required,min=2,max=100" example:"John"`
	LastName  string    `json:"lastName" validate:"required,min=2,max=100" example:"Doe"`
	Age       int       `json:"age" validate:"min=16,max=120" example:"30"`
	Gender    string    `json:"gender,omitempty" validate:"required,oneof=male female" example:"male"`
	BirthDate time.Time `json:"birthDate" example:"1995-01-15T00:00:00Z"`
	Address   string    `json:"address" example:"First Avenue 5, Madrid"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email" example:"jdoe@example.com"`
	Password string `json:"password" validate:"required" example:"P@ssw0rd!"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email" example:"jdoe@example.com"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" validate:"required,min=64" example:"6a1fbd97e8...<rest_of_token>"`
	NewPassword string `json:"newPassword" validate:"required,min=6,max=50" example:"NewP@ss123"`
}
