package request

type UpdateUserRequest struct {
	FirstName string `json:"firstName" validate:"omitempty,min=2,max=50" example:"John"`
	LastName  string `json:"lastName" validate:"omitempty,min=2,max=50" example:"Doe"`
	Email     string `json:"email" validate:"omitempty,email" example:"john.doe@example.com"`
	Image     []byte `json:"image" validate:"omitempty" swaggertype:"string" format:"byte" example:"iVBORw0KGgoAAAANSUhEUgAA..."`
}

// AdminUpdateUserRequest deliberately excludes email. Administrators may edit
// profile details, replace the avatar and set a new password, but never change
// the account's email address.
type AdminUpdateUserRequest struct {
	FirstName string `json:"firstName" validate:"omitempty,min=2,max=50" example:"John"`
	LastName  string `json:"lastName" validate:"omitempty,min=2,max=50" example:"Doe"`
	Image     []byte `json:"image" validate:"omitempty,max=5242880" swaggertype:"string" format:"byte" example:"iVBORw0KGgoAAAANSUhEUgAA..."`
	Password  string `json:"password" validate:"omitempty,min=8,max=72" example:"NewSecurePass123!"`
}

type User struct {
	Id        int    `json:"id" example:"1"`
	FirstName string `json:"firstName" example:"John"`
	LastName  string `json:"lastName" example:"Doe"`
	Email     string `json:"email" example:"john.doe@example.com"`
	Username  string `json:"username" example:"johndoe"`
	Password  string `json:"password" example:"SecurePass123!"`
	Image     string `json:"image" example:"https://example.com/images/avatar.png"`
	Role      string `json:"role" example:"USER"`
}
