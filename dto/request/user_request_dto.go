package request

type UpdateUserRequest struct {
	FirstName string `json:"firstName" validate:"omitempty,min=2,max=50"`
	LastName  string `json:"lastName" validate:"omitempty,min=2,max=50"`
	Email     string `json:"email" validate:"omitempty,email"`
	Phone     string `json:"phone" validate:"omitempty,min=4,max=15"`
	Image     []byte `json:"image"`
}

type User struct {
	Id        int    `json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Age       int    `json:"age"`
	Gender    string `json:"gender"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Username  string `json:"username"`
	Password  string `json:"password"`
	BirthDate string `json:"birthDate"`
	Image     string `json:"image"`
	Address   string `json:"address"`
	Role      string `json:"role"`
}
