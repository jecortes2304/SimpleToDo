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
	ID          uint `gorm:"primaryKey"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Name        string `gorm:"not null"`
	Description string
	UserId      uint
	User        User  `gorm:"foreignKey:UserId"`
	Tasks       Tasks `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;foreignKey:ProjectId"`
}

type Tasks []Task

type User struct {
	gorm.Model `json:"gorm.Model"`
	FirstName  string    `json:"firstName,omitempty"`
	LastName   string    `json:"lastName,omitempty"`
	Age        int       `json:"age,omitempty"`
	Gender     string    `json:"gender,omitempty"`
	Email      string    `json:"email,omitempty"`
	Phone      string    `json:"phone,omitempty"`
	Username   string    `json:"username,omitempty" gorm:"uniqueIndex:idx_username_email;not null"`
	Password   string    `gorm:"not null" json:"password,omitempty"`
	BirthDate  time.Time `gorm:"type:date" json:"birthDate"`
	Image      []byte    `gorm:"type:bytea" json:"image,omitempty"`
	RoleId     uint      `json:"roleId,omitempty"`
	Address    string    `json:"address,omitempty"`
	Role       Role      `gorm:"foreignKey:RoleId" json:"role"`
	Verified   bool      `gorm:"default:false"`
}

type EmailVerificationToken struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`

	UserID    uint   `gorm:"not null;index"`
	TokenHash string `gorm:"size:64;not null;uniqueIndex"`
	ExpiresAt time.Time
	Used      bool `gorm:"not null;default:false"`
}

type PasswordResetToken struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`

	UserID    uint      `gorm:"not null;index"`
	TokenHash string    `gorm:"size:64;not null;uniqueIndex"`
	ExpiresAt time.Time `gorm:"not null"`
	Used      bool      `gorm:"not null;default:false"`
}

func (u *User) BeforeCreate(*gorm.DB) (err error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}
