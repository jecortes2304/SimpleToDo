package response

import "time"

type UserResponseDto struct {
	Id        uint      `json:"id"`
	FirstName string    `json:"firstName,omitempty"`
	LastName  string    `json:"lastName,omitempty"`
	Age       int       `json:"age,omitempty"`
	Gender    string    `json:"gender,omitempty"`
	Email     string    `json:"email,omitempty"`
	Phone     string    `json:"phone,omitempty"`
	Username  string    `json:"username,omitempty"`
	BirthDate time.Time `json:"birthDate"`
	Image     []byte    `json:"image,omitempty"`
	Address   string    `json:"address"`
	Role      string    `json:"role"`
}
