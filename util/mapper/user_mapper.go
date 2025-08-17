package mapper

import (
	"SimpleToDo/dto/response"
	"SimpleToDo/models"
)

type UserMapperImpl struct {
	userEntity *models.User
	userDto    *response.UserResponseDto
}

func NewUserMapperImpl() *UserMapperImpl {
	return &UserMapperImpl{}
}

func (t *UserMapperImpl) ToDto(userEntity *models.User) response.UserResponseDto {

	return response.UserResponseDto{
		Id:        userEntity.ID,
		FirstName: userEntity.FirstName,
		LastName:  userEntity.LastName,
		Age:       userEntity.Age,
		Gender:    userEntity.Gender,
		Email:     userEntity.Email,
		Phone:     userEntity.Phone,
		Username:  userEntity.Username,
		BirthDate: userEntity.BirthDate,
		Image:     userEntity.Image,
		Address:   userEntity.Address,
		Role:      userEntity.Role.Name,
	}
}
