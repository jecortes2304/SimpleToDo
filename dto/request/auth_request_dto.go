package request

import "time"

type RegisterRequest struct {
	Username  string    `json:"username" validate:"required,min=2,max=100"`
	Email     string    `json:"email" validate:"required,email"`
	Password  string    `json:"password" validate:"required,min=6,max=50"`
	Phone     string    `json:"phone" validate:"min=4,max=15"`
	FirstName string    `json:"firstName" validate:"required,min=2,max=100"`
	LastName  string    `json:"lastName" validate:"required,min=2,max=100"`
	Age       int       `json:"age" validate:"min=16,max=120"`
	Gender    string    `json:"gender,omitempty" validate:"required,oneof=male female"`
	BirthDate time.Time `json:"birthDate"`
	Address   string    `json:"address"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}
