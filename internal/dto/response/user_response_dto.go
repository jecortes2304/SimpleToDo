package response

type UserResponseDto struct {
	Id        uint   `json:"id"`
	FirstName string `json:"firstName,omitempty"`
	LastName  string `json:"lastName,omitempty"`
	Email     string `json:"email,omitempty"`
	Username  string `json:"username,omitempty"`
	Image     []byte `json:"image,omitempty" swaggertype:"string" format:"byte" example:"iVBORw0KGgoAAAANSUhEUgAA..."`
	Role      string `json:"role"`
}
