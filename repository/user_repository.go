package repository

import (
	"SimpleToDo/dto/response"
	"SimpleToDo/models"
	"errors"
	"gorm.io/gorm"
)

type UserRepository struct {
	Db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{Db: db}
}

func (r *UserRepository) FindByID(id uint) (*models.User, error) {
	var u models.User
	if err := r.Db.Preload("Role").First(&u, id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) FindAll(pagination response.Pagination) (*response.Pagination, error) {
	if r.Db == nil {
		return nil, errors.New("database connection is nil")
	}
	var users []*models.User
	result := r.Db.Scopes(Paginate(&models.User{}, &pagination, r.Db)).Preload("Role").Find(&users)
	if result.Error != nil {
		return nil, result.Error
	}
	pagination.Items = users

	return &pagination, nil
}

func (r *UserRepository) Update(user *models.User) (*models.User, error) {
	if err := r.Db.Save(user).Error; err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepository) Delete(id uint) error {
	return r.Db.Delete(&models.User{}, id).Error
}
