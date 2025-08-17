package request

type UpdateUserRequest struct {
	FirstName string `json:"firstName" validate:"omitempty,min=2,max=50" example:"John"`
	LastName  string `json:"lastName" validate:"omitempty,min=2,max=50" example:"Doe"`
	Email     string `json:"email" validate:"omitempty,email" example:"john.doe@example.com"`
	Phone     string `json:"phone" validate:"omitempty,min=4,max=15" example:"+123456789"`
	Image     []byte `json:"image" validate:"omitempty"`
}

type User struct {
	Id        int    `json:"id" example:"1"`
	FirstName string `json:"firstName" example:"John"`
	LastName  string `json:"lastName" example:"Doe"`
	Age       int    `json:"age" example:"30"`
	Gender    string `json:"gender" example:"male"`
	Email     string `json:"email" example:"john.doe@example.com"`
	Phone     string `json:"phone" example:"+123456789"`
	Username  string `json:"username" example:"johndoe"`
	Password  string `json:"password" example:"SecurePass123!"`
	BirthDate string `json:"birthDate" example:"1993-04-15"`
	Image     string `json:"image" example:"https://example.com/images/avatar.png"`
	Address   string `json:"address" example:"123 Main St, New York, USA"`
	Role      string `json:"role" example:"USER"`
}
