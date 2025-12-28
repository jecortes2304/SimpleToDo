package service

import (
	embedfs "SimpleToDo"
	"SimpleToDo/config"
	"SimpleToDo/models"
	"SimpleToDo/repository"
	"SimpleToDo/util/mailer"
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"html/template"
	"strconv"
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

	userVerified := s.AuthRepository.FindIfUserIsVerified(email)
	if userVerified == nil {
		return "", errors.New("email not verified")
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
	secret := config.GetAppEnv().JWTSecret
	if secret == "" {
		secret = "supersecretkey"
	}
	return token.SignedString([]byte(secret))
}

func (s *AuthService) generateToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func (s *AuthService) RequestPasswordReset(email string) error {
	user := s.AuthRepository.FindByEmail(email)
	if user == nil {
		return nil
	}
	token, err := s.generateToken(32)
	if err != nil {
		return nil
	}
	_, err = s.AuthRepository.CreatePasswordResetToken(user.ID, token, 30*time.Minute)
	if err != nil {
		return nil
	}

	m, err := mailer.New()
	if err != nil {
		return nil
	}

	base := config.GetAppEnv().BaseURL
	link := fmt.Sprintf("%s/reseting-password?token=%s", base, token)

	tpl, _ := template.ParseFS(embedfs.TemplatesFS, "config/static/templates/reset_password.html")
	var body bytes.Buffer
	errExc := tpl.Execute(&body, map[string]string{
		"Username": user.FirstName,
		"ResetURL": link,
		"Year":     strconv.Itoa(time.Now().Year()),
	})
	if errExc != nil {
		return err
	}

	subject := "Reset your password"

	go func() {
		errSent := m.SendWithTemplate(user.Email, subject, body.String())
		if errSent != nil {
			fmt.Printf("Error sending reset password email: %v\n", errSent)
		} else {
			fmt.Println("Reset password email sent successfully")
		}
	}()
	return nil
}

func (s *AuthService) ResetPassword(tokenPlain, newPassword string) error {
	t, err := s.AuthRepository.GetResetToken(tokenPlain)
	if err != nil {
		return errors.New("invalid token")
	}
	if t.Used || time.Now().After(t.ExpiresAt) {
		return errors.New("invalid token")
	}

	if err := s.AuthRepository.UpdateUserPassword(t.UserID, newPassword); err != nil {
		return err
	}
	if err := s.AuthRepository.MarkResetTokenUsed(t.ID); err != nil {
		return err
	}
	return nil
}

func (s *AuthService) SendVerificationEmail(user *models.User) error {
	token, err := s.generateToken(32)
	if err != nil {
		return err
	}
	_, err = s.AuthRepository.CreateEmailVerificationToken(user.ID, token, 24*time.Hour)
	if err != nil {
		return err
	}

	m, err := mailer.New()
	if err != nil {
		return err
	}
	base := config.GetAppEnv().BaseURL
	link := fmt.Sprintf("%s/verification-email?token=%s", base, token)

	tpl, _ := template.ParseFS(embedfs.TemplatesFS, "config/static/templates/verify_email.html")
	var body bytes.Buffer
	errExc := tpl.Execute(&body, map[string]string{
		"Username":  user.FirstName,
		"VerifyURL": link,
		"Year":      strconv.Itoa(time.Now().Year()),
	})
	if errExc != nil {
		return err
	}

	go func() {
		errSent := m.SendWithTemplate(user.Email, "Verify your email", body.String())
		if errSent != nil {
			fmt.Printf("Error sending verification email: %v\n", errSent)
		} else {
			fmt.Println("Verification email sent successfully")
		}
	}()
	return nil
}

func (s *AuthService) ResendVerificationEmail(email string) error {
	user := s.AuthRepository.FindByEmail(email)
	if user == nil {
		return errors.New("user not found")
	}
	if user.Verified {
		return errors.New("user already verified")
	}

	return s.SendVerificationEmail(user)
}

func (s *AuthService) VerifyEmail(tokenPlain string) error {
	t, err := s.AuthRepository.GetEmailVerificationToken(tokenPlain)
	if err != nil {
		return errors.New("invalid token")
	}
	if t.Used || time.Now().After(t.ExpiresAt) {
		return errors.New("invalid or expired token")
	}
	if err := s.AuthRepository.MarkUserVerified(t.UserID); err != nil {
		return err
	}
	return s.AuthRepository.MarkEmailVerificationTokenUsed(t.ID)
}

// Example cookie handlers using Echo framework
//func writeCookie(c echo.Context) error {
//	cookie := new(http.Cookie)
//	cookie.Name = "username"
//	cookie.Value = "jon"
//	cookie.Expires = time.Now().Add(24 * time.Hour)
//	c.SetCookie(cookie)
//	return c.String(http.StatusOK, "write a cookie")
//}
//
//func readCookie(c echo.Context) error {
//	cookie, err := c.Cookie("username")
//	if err != nil {
//		return err
//	}
//	return c.String(http.StatusOK, "read a cookie")
//}
