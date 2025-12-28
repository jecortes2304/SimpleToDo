package repository

import (
	"SimpleToDo/models"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"golang.org/x/crypto/bcrypt"
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

func (r *AuthRepository) FindIfUserIsVerified(email string) *models.User {
	var user models.User
	if err := r.Db.Where("email = ? AND verified = ?", email, true).First(&user).Error; err != nil {
		return nil
	}
	return &user
}

func (r *AuthRepository) CreatePasswordResetToken(userID uint, tokenPlain string, ttl time.Duration) (*models.PasswordResetToken, error) {
	hash, _ := getPasswordHash(tokenPlain)

	// invalidate previous active tokens for user
	_ = r.Db.Model(&models.PasswordResetToken{}).
		Where("user_id = ? AND used = ? AND expires_at > ?", userID, false, time.Now()).
		Update("used", true).Error

	item := &models.PasswordResetToken{
		UserID:    userID,
		TokenHash: hash,
		ExpiresAt: time.Now().Add(ttl),
		Used:      false,
	}
	if err := r.Db.Create(item).Error; err != nil {
		return nil, err
	}
	return item, nil
}

func (r *AuthRepository) GetResetToken(tokenPlain string) (*models.PasswordResetToken, error) {
	sum := sha256.Sum256([]byte(tokenPlain))
	hash := hex.EncodeToString(sum[:])

	var t models.PasswordResetToken
	if err := r.Db.Where("token_hash = ?", hash).First(&t).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *AuthRepository) MarkResetTokenUsed(id uint) error {
	return r.Db.Model(&models.PasswordResetToken{}).Where("id = ?", id).Update("used", true).Error
}

func (r *AuthRepository) UpdateUserPassword(userID uint, newPlain string) error {
	hashed, err := bcrypt.GenerateFromPassword([]byte(newPlain), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	return r.Db.Model(&models.User{}).Where("id = ?", userID).Update("password", string(hashed)).Error
}

func (r *AuthRepository) CreateEmailVerificationToken(userID uint, tokenPlain string, ttl time.Duration) (*models.EmailVerificationToken, error) {
	hash, _ := getPasswordHash(tokenPlain)

	// invalidate old tokens
	_ = r.Db.Model(&models.EmailVerificationToken{}).
		Where("user_id = ? AND used = ? AND expires_at > ?", userID, false, time.Now()).
		Update("used", true).Error

	item := &models.EmailVerificationToken{
		UserID:    userID,
		TokenHash: hash,
		ExpiresAt: time.Now().Add(ttl),
		Used:      false,
	}
	if err := r.Db.Create(item).Error; err != nil {
		return nil, err
	}
	return item, nil
}

func (r *AuthRepository) GetEmailVerificationToken(tokenPlain string) (*models.EmailVerificationToken, error) {
	hash, _ := getPasswordHash(tokenPlain)

	var t models.EmailVerificationToken
	if err := r.Db.Where("token_hash = ?", hash).First(&t).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *AuthRepository) MarkEmailVerificationTokenUsed(id uint) error {
	return r.Db.Model(&models.EmailVerificationToken{}).Where("id = ?", id).Update("used", true).Error
}

func (r *AuthRepository) MarkUserVerified(userID uint) error {
	return r.Db.Model(&models.User{}).Where("id = ?", userID).Update("verified", true).Error
}

func getPasswordHash(tokenPlain string) (string, error) {
	sum := sha256.Sum256([]byte(tokenPlain))
	hash := hex.EncodeToString(sum[:])
	return hash, nil
}
