package mapper

import (
	"simpletodo/internal/dto/response"
	"simpletodo/internal/models"
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
		Email:     userEntity.Email,
		Username:  userEntity.Username,
		Image:     userEntity.Image,
		Role:      userEntity.Role.Name,
	}
}
