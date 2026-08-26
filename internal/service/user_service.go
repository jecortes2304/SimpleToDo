package service

import (
	"errors"
	request2 "simpletodo/internal/dto/request"
	response2 "simpletodo/internal/dto/response"
	"simpletodo/internal/models"
	repository2 "simpletodo/internal/repository"
	"simpletodo/internal/util/mapper"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService struct {
	UserRepository     *repository2.UserRepository
	AIServerRepository *repository2.AIServerRepository
	UserMapper         *mapper.UserMapperImpl
}

func NewUserService(userRepo *repository2.UserRepository, aiRepo *repository2.AIServerRepository, userMapper *mapper.UserMapperImpl) *UserService {
	return &UserService{
		UserRepository:     userRepo,
		AIServerRepository: aiRepo,
		UserMapper:         userMapper,
	}
}

func (s *UserService) GetByID(id uint) (*response2.UserResponseDto, error) {
	userEntity, err := s.UserRepository.FindByID(id)
	if err != nil {
		return &response2.UserResponseDto{}, err
	}
	userDto := s.UserMapper.ToDto(userEntity)
	return &userDto, err
}

func (s *UserService) GetAll(pagination response2.Pagination) (*response2.Pagination, error) {
	userResponsePaginated, err := s.UserRepository.FindAll(pagination)
	if err != nil {
		return nil, err
	}

	users, ok := userResponsePaginated.Items.([]*models.User)
	if !ok {
		return nil, errors.New("error converting user to user entity")
	}

	var userResponse = make([]response2.UserResponseDto, 0)
	for _, user := range users {
		userDto := s.UserMapper.ToDto(user)
		userResponse = append(userResponse, userDto)
	}

	userResponsePaginated.Items = userResponse
	return userResponsePaginated, nil
}

func (s *UserService) UpdateProfile(id uint, data request2.UpdateUserRequest) (*response2.UserResponseDto, error) {
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
	if len(data.Image) > 0 {
		existing.Image = data.Image
	}

	userEntity, err := s.UserRepository.Update(existing)
	if err != nil {
		return &response2.UserResponseDto{}, err
	}
	userDto := s.UserMapper.ToDto(userEntity)
	return &userDto, err
}

func (s *UserService) UpdateByAdmin(id uint, data request2.AdminUpdateUserRequest) (*response2.UserResponseDto, error) {
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
	if len(data.Image) > 0 {
		existing.Image = data.Image
	}
	if data.Password != "" {
		hashedPassword, hashErr := bcrypt.GenerateFromPassword([]byte(data.Password), bcrypt.DefaultCost)
		if hashErr != nil {
			return nil, hashErr
		}
		existing.Password = string(hashedPassword)
	}

	userEntity, err := s.UserRepository.Update(existing)
	if err != nil {
		return nil, err
	}
	userDto := s.UserMapper.ToDto(userEntity)
	return &userDto, nil
}

func (s *UserService) Delete(id uint) error {
	return s.UserRepository.Delete(id)
}

func (s *UserService) GetAISettings(userID uint) (*response2.AISettingsResponseDto, error) {
	settings, err := s.AIServerRepository.FindByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &response2.AISettingsResponseDto{BaseUrl: "", APIKey: ""}, nil
		}
		return nil, err
	}

	return &response2.AISettingsResponseDto{
		BaseUrl: settings.BaseUrl,
		APIKey:  settings.APIKey,
		Model:   settings.Model,
	}, nil
}

func (s *UserService) UpdateAISettings(userID uint, data request2.UpdateAISettingsRequest) (*response2.AISettingsResponseDto, error) {
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

	return &response2.AISettingsResponseDto{
		BaseUrl: settings.BaseUrl,
		APIKey:  settings.APIKey,
		Model:   settings.Model,
	}, nil
}
