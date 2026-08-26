package repository

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"simpletodo/internal/models"
	"strings"
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
	if err := r.Db.Where("email = ?", strings.ToLower(strings.TrimSpace(email))).First(&user).Error; err != nil {
		return nil
	}
	return &user
}

func (r *AuthRepository) FindIfUserIsVerified(email string) *models.User {
	var user models.User
	if err := r.Db.Where("email = ? AND verified = ?", strings.ToLower(strings.TrimSpace(email)), true).First(&user).Error; err != nil {
		return nil
	}
	return &user
}

func (r *AuthRepository) FindOAuthUser(provider, subject string) (*models.User, error) {
	var identity models.OAuthIdentity
	err := r.Db.Preload("User").
		Where("provider = ? AND subject = ?", provider, subject).
		First(&identity).Error
	if err != nil {
		return nil, err
	}
	return &identity.User, nil
}

func usernameExists(tx *gorm.DB, username string) (bool, error) {
	var count int64
	err := tx.Unscoped().Model(&models.User{}).Where("username = ?", username).Count(&count).Error
	return count > 0, err
}

func nextAvailableUsername(tx *gorm.DB, base string) (string, error) {
	for suffix := 0; suffix < 10000; suffix++ {
		candidate := base
		if suffix > 0 {
			candidate = fmt.Sprintf("%s-%d", base, suffix)
		}
		exists, err := usernameExists(tx, candidate)
		if err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
	}
	return "", errors.New("could not generate a unique username")
}

func (r *AuthRepository) ResolveOAuthUser(provider, subject, email, usernameBase, password, firstName, lastName string) (*models.User, bool, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	var resolved models.User
	created := false

	err := r.Db.Transaction(func(tx *gorm.DB) error {
		var identity models.OAuthIdentity
		err := tx.Preload("User").Where("provider = ? AND subject = ?", provider, subject).First(&identity).Error
		if err == nil {
			resolved = identity.User
			return nil
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		var user models.User
		err = tx.Where("email = ?", email).First(&user).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			username, usernameErr := nextAvailableUsername(tx, usernameBase)
			if usernameErr != nil {
				return usernameErr
			}
			user = models.User{
				FirstName: firstName,
				LastName:  lastName,
				Email:     email,
				Username:  username,
				Password:  password,
				RoleId:    2,
				Verified:  false,
			}
			if err = tx.Create(&user).Error; err != nil {
				return err
			}
			created = true
		} else if err != nil {
			return err
		}

		identity = models.OAuthIdentity{UserID: user.ID, Provider: provider, Subject: subject}
		if err = tx.Create(&identity).Error; err != nil {
			return err
		}
		resolved = user
		return nil
	})
	if err != nil {
		// A concurrent callback may have created the same identity first.
		if user, lookupErr := r.FindOAuthUser(provider, subject); lookupErr == nil {
			return user, false, nil
		}
		return nil, false, err
	}
	return &resolved, created, nil
}

func (r *AuthRepository) DeleteExpiredUnverifiedUsers(cutoff time.Time) (int64, error) {
	var deleted int64
	err := r.Db.Transaction(func(tx *gorm.DB) error {
		var userIDs []uint
		if err := tx.Unscoped().Model(&models.User{}).
			Where("verified = ? AND role_id <> ? AND created_at <= ?", false, 1, cutoff).
			Pluck("id", &userIDs).Error; err != nil {
			return err
		}
		if len(userIDs) == 0 {
			return nil
		}

		var projectIDs []uint
		if err := tx.Unscoped().Model(&models.Project{}).Where("user_id IN ?", userIDs).Pluck("id", &projectIDs).Error; err != nil {
			return err
		}
		taskQuery := tx.Unscoped().Where("user_id IN ?", userIDs)
		if len(projectIDs) > 0 {
			taskQuery = tx.Unscoped().Where("user_id IN ? OR project_id IN ?", userIDs, projectIDs)
		}
		if err := taskQuery.Delete(&models.Task{}).Error; err != nil {
			return err
		}

		for _, item := range []any{
			&models.AIServerSettings{},
			&models.EmailVerificationToken{},
			&models.PasswordResetToken{},
			&models.OAuthIdentity{},
		} {
			if err := tx.Unscoped().Where("user_id IN ?", userIDs).Delete(item).Error; err != nil {
				return err
			}
		}
		if err := tx.Unscoped().Where("user_id IN ?", userIDs).Delete(&models.Project{}).Error; err != nil {
			return err
		}
		result := tx.Unscoped().Where("id IN ? AND verified = ? AND role_id <> ?", userIDs, false, 1).Delete(&models.User{})
		if result.Error != nil {
			return result.Error
		}
		deleted = result.RowsAffected
		return nil
	})
	return deleted, err
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
