package service

import (
	"SimpleToDo/dto/request"
	"SimpleToDo/dto/response"
	"SimpleToDo/models"
	"SimpleToDo/repository"
	"SimpleToDo/util/mapper"
	"errors"
	"gorm.io/gorm"
)

type UserService struct {
	UserRepository     *repository.UserRepository
	AIServerRepository *repository.AIServerRepository
	UserMapper         *mapper.UserMapperImpl
}

func NewUserService(userRepo *repository.UserRepository, aiRepo *repository.AIServerRepository, userMapper *mapper.UserMapperImpl) *UserService {
	return &UserService{
		UserRepository:     userRepo,
		AIServerRepository: aiRepo,
		UserMapper:         userMapper,
	}
}

func (s *UserService) GetByID(id uint) (*response.UserResponseDto, error) {
	userEntity, err := s.UserRepository.FindByID(id)
	if err != nil {
		return &response.UserResponseDto{}, err
	}
	userDto := s.UserMapper.ToDto(userEntity)
	return &userDto, err
}

func (s *UserService) GetAll(pagination response.Pagination) (*response.Pagination, error) {
	userResponsePaginated, err := s.UserRepository.FindAll(pagination)
	if err != nil {
		return nil, err
	}

	users, ok := userResponsePaginated.Items.([]*models.User)
	if !ok {
		return nil, errors.New("error converting user to user entity")
	}

	var userResponse = make([]response.UserResponseDto, 0)
	for _, user := range users {
		userDto := s.UserMapper.ToDto(user)
		userResponse = append(userResponse, userDto)
	}

	userResponsePaginated.Items = userResponse
	return userResponsePaginated, nil
}

func (s *UserService) Update(id uint, data request.UpdateUserRequest) (*response.UserResponseDto, error) {
	existing, err := s.UserRepository.FindByID(id)
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

	userEntity, err := s.UserRepository.Update(existing)
	if err != nil {
		return &response.UserResponseDto{}, err
	}
	userDto := s.UserMapper.ToDto(userEntity)
	return &userDto, err
}

func (s *UserService) Delete(id uint) error {
	return s.UserRepository.Delete(id)
}

func (s *UserService) GetAISettings(userID uint) (*response.AISettingsResponseDto, error) {
	settings, err := s.AIServerRepository.FindByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &response.AISettingsResponseDto{BaseUrl: "", APIKey: ""}, nil
		}
		return nil, err
	}

	return &response.AISettingsResponseDto{
		BaseUrl: settings.BaseUrl,
		APIKey:  settings.APIKey,
		Model:   settings.Model,
	}, nil
}

func (s *UserService) UpdateAISettings(userID uint, data request.UpdateAISettingsRequest) (*response.AISettingsResponseDto, error) {
	settings := &models.AIServerSettings{
		UserID:  userID,
		BaseUrl: data.BaseUrl,
		APIKey:  data.APIKey,
		Model:   data.Model,
	}

	err := s.AIServerRepository.Save(settings)
	if err != nil {
		return nil, err
	}

	return &response.AISettingsResponseDto{
		BaseUrl: settings.BaseUrl,
		APIKey:  settings.APIKey,
		Model:   settings.Model,
	}, nil
}
