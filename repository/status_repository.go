package repository

import (
	"SimpleToDo/models"
	"errors"
	"gorm.io/gorm"
)

type StatusRepository struct {
	Db *gorm.DB
}

func NewStatusRepository(db *gorm.DB) *StatusRepository {
	return &StatusRepository{Db: db}
}

func (s *StatusRepository) FindById(id int) (status models.Status, err error) {
	if s.Db == nil {
		return status, errors.New("database connection is nil")
	}
	var statusToReturn models.Status
	result := s.Db.First(&statusToReturn, id)
	if result.Error != nil {
		return statusToReturn, errors.New("status not found")
	}
	return statusToReturn, nil
}

func (s *StatusRepository) FindByName(name string) (status *models.Status, err error) {
	if s.Db == nil {
		return status, errors.New("database connection is nil")
	}
	var statusToReturn models.Status
	result := s.Db.Find(&statusToReturn, "name = ?", name)
	if result.Error != nil {
		return nil, errors.New("status not found")
	}

	return &statusToReturn, nil
}

func (s *StatusRepository) FindByValue(value string) (status *models.Status, err error) {
	if s.Db == nil {
		return status, errors.New("database connection is nil")
	}
	var statusToReturn models.Status
	result := s.Db.Find(&statusToReturn, "value = ?", value)
	if result.Error != nil {
		return nil, errors.New("status not found")
	}

	return &statusToReturn, nil
}
