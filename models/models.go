package models

import (
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"time"
)

type Status struct {
	ID    uint   `gorm:"primarykey"`
	Name  string `gorm:"unique;not null"`
	Value string
}

type Role struct {
	ID    uint   `gorm:"primarykey"`
	Name  string `gorm:"unique;not null"`
	Value string
}

type Task struct {
	gorm.Model
	Title       string `gorm:"uniqueIndex:idx_title_project_user;not null"`
	Description string
	StatusId    uint
	Status      Status `gorm:"foreignKey:StatusId"`
	UserId      uint
	ProjectId   uint
	User        User    `gorm:"foreignKey:UserId"`
	Project     Project `gorm:"foreignKey:ProjectId"`
}

type Project struct {
	gorm.Model
	Name        string `gorm:"unique;not null"`
	Description string
	Tasks       Tasks `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;foreignKey:ProjectId"`
}
type Tasks []Task

type Address struct {
	gorm.Model
	Address    string `gorm:"not null"`
	City       string
	PostalCode string
	Country    string
}

type User struct {
	gorm.Model
	FirstName string
	LastName  string
	Age       int
	Gender    string
	Email     string
	Phone     string
	Username  string
	Password  string    `gorm:"not null"`
	BirthDate time.Time `gorm:"type:date"`
	Image     []byte    `gorm:"type:bytea"`
	AddressId uint
	RoleId    uint
	Address   Address `gorm:"foreignKey:AddressId"`
	Role      Role    `gorm:"foreignKey:RoleId"`
}

func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}
