package request

type RegisterRequest struct {
	Username  string `json:"username" validate:"required,min=2,max=100" example:"jdoe"`
	Email     string `json:"email" validate:"required,email" example:"jdoe@example.com"`
	Password  string `json:"password" validate:"required,min=6,max=50" example:"P@ssw0rd!"`
	FirstName string `json:"firstName" validate:"required,min=2,max=100" example:"John"`
	LastName  string `json:"lastName" validate:"required,min=2,max=100" example:"Doe"`
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
