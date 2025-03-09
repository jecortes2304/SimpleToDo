package dto

type Address struct {
	Address    string `json:"address"`
	City       string `json:"city"`
	PostalCode string `json:"postalCode"`
	Country    string `json:"country"`
}

type User struct {
	Id        int     `json:"id"`
	FirstName string  `json:"firstName"`
	LastName  string  `json:"lastName"`
	Age       int     `json:"age"`
	Gender    string  `json:"gender"`
	Email     string  `json:"email"`
	Phone     string  `json:"phone"`
	Username  string  `json:"username"`
	Password  string  `json:"password"`
	BirthDate string  `json:"birthDate"`
	Image     string  `json:"image"`
	Address   Address `json:"address"`
	Role      string  `json:"role"`
}
