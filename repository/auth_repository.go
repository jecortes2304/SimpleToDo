package repository

import (
	"SimpleToDo/models"
	"gorm.io/gorm"
)

type AuthRepository struct {
	Db *gorm.DB
}

func NewAuthRepository(db *gorm.DB) *AuthRepository {
	return &AuthRepository{Db: db}
}

func (r *AuthRepository) Save(user *models.User) error {
	return r.Db.Create(user).Error
}

func (r *AuthRepository) FindByEmail(email string) *models.User {
	var user models.User
	if err := r.Db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil
	}
	return &user
}
