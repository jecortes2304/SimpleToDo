package service

import (
	"SimpleToDo/dto/request"
	"SimpleToDo/dto/response"
	"SimpleToDo/models"
	"SimpleToDo/repository"
	"SimpleToDo/util/mapper"
	"errors"
)

type UserService struct {
	UserRepository *repository.UserRepository
	UserMapper     *mapper.UserMapperImpl
}

func NewUserService(repo *repository.UserRepository, userMapper *mapper.UserMapperImpl) *UserService {
	return &UserService{UserRepository: repo, UserMapper: userMapper}
}

func (userService *UserService) GetByID(id uint) (*response.UserResponseDto, error) {
	userEntity, err := userService.UserRepository.FindByID(id)
	if err != nil {
		return &response.UserResponseDto{}, err
	}
	userDto := userService.UserMapper.ToDto(userEntity)

	return &userDto, err
}

func (userService *UserService) GetAll(pagination response.Pagination) (*response.Pagination, error) {

	userResponsePaginated, err := userService.UserRepository.FindAll(pagination)
	if err != nil {
		return nil, err
	}
	if userResponsePaginated.Items == nil {
		return userResponsePaginated, nil
	}

	users, ok := userResponsePaginated.Items.([]*models.User)
	if !ok {
		return nil, errors.New("error converting user to user entity")
	}

	var userResponse = make([]response.UserResponseDto, 0)
	for _, user := range users {
		userDto := userService.UserMapper.ToDto(user)
		userResponse = append(userResponse, userDto)
	}

	userResponsePaginated.Items = userResponse

	return userResponsePaginated, nil
}

func (userService *UserService) Update(id uint, data request.UpdateUserRequest) (*response.UserResponseDto, error) {
	existing, err := userService.UserRepository.FindByID(id)
	if err != nil {
		return nil, err
	}

	if data.FirstName != "" {
		existing.FirstName = data.FirstName
	}
	if data.LastName != "" {
		existing.LastName = data.LastName
	}
	if data.Email != "" {
		existing.Email = data.Email
	}
	if data.Phone != "" {
		existing.Phone = data.Phone
	}
	if len(data.Image) > 0 {
		existing.Image = data.Image
	}

	userEntity, err := userService.UserRepository.Update(existing)

	if err != nil {
		return &response.UserResponseDto{}, err
	}
	userDto := userService.UserMapper.ToDto(userEntity)

	return &userDto, err
}

func (userService *UserService) Delete(id uint) error {
	return userService.UserRepository.Delete(id)
}
