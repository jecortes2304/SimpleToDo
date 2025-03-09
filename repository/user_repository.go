package repository

import (
	"SimpleToDo/models"
	"gorm.io/gorm"
)

type UserRepository struct {
	Db *gorm.DB
}

func (u *UserRepository) Save(user models.User) {
	//TODO implement me
	panic("implement me")
}

func (u *UserRepository) Update(user models.User) {
	//TODO implement me
	panic("implement me")
}

func (u *UserRepository) Delete(id int) {
	//TODO implement me
	panic("implement me")
}

func (u *UserRepository) FindById(id int) (user models.User, err error) {
	//TODO implement me
	panic("implement me")
}

func (u *UserRepository) FindAll() []models.User {
	//TODO implement me
	panic("implement me")
}
