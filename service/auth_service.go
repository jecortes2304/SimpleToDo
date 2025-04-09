package service

import (
	"SimpleToDo/models"
	"SimpleToDo/repository"
	"errors"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"os"
	"time"
)

type AuthService struct {
	AuthRepository *repository.AuthRepository
}

func NewAuthService(authRepository *repository.AuthRepository) *AuthService {
	return &AuthService{AuthRepository: authRepository}
}

func (s *AuthService) RegisterUser(user *models.User) error {
	existing := s.AuthRepository.FindByEmail(user.Email)
	if existing != nil {
		return errors.New("user already exists")
	}
	return s.AuthRepository.Save(user)
}

func (s *AuthService) LoginUser(email, password string) (string, error) {
	user := s.AuthRepository.FindByEmail(email)
	if user == nil {
		return "", errors.New("invalid credentials")
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return "", errors.New("invalid credentials")
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    user.RoleId,
		"exp":     time.Now().Add(72 * time.Hour).Unix(),
	})
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "supersecretkey"
	}
	return token.SignedString([]byte(secret))
}
