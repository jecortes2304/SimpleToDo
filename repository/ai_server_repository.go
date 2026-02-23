package repository

import (
	"SimpleToDo/models"
	"errors"
	"gorm.io/gorm"
)

type AIServerRepository struct {
	Db *gorm.DB
}

func NewAIServerRepository(db *gorm.DB) *AIServerRepository {
	return &AIServerRepository{Db: db}
}

func (r *AIServerRepository) FindByUserID(userID uint) (*models.AIServerSettings, error) {
	var settings models.AIServerSettings
	err := r.Db.Where("user_id = ?", userID).First(&settings).Error
	if err != nil {
		return nil, err
	}
	return &settings, nil
}

func (r *AIServerRepository) Save(settings *models.AIServerSettings) error {
	var existing models.AIServerSettings
	err := r.Db.Where("user_id = ?", settings.UserID).First(&existing).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return r.Db.Create(settings).Error
		}
		return err
	}

	existing.BaseUrl = settings.BaseUrl
	existing.APIKey = settings.APIKey
	existing.Model = settings.Model
	return r.Db.Save(&existing).Error
}
