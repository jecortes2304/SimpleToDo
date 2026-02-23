package repository

import (
	"SimpleToDo/dto/response"
	"SimpleToDo/models"
	"errors"
	"gorm.io/gorm"
)

type PromptRepository struct {
	Db *gorm.DB
}

func NewPromptRepository(db *gorm.DB) *PromptRepository {
	return &PromptRepository{Db: db}
}

func (r *PromptRepository) Save(prompt *models.Prompt) error {
	return r.Db.Create(prompt).Error
}

func (r *PromptRepository) Update(prompt *models.Prompt) (*models.Prompt, error) {
	if err := r.Db.Save(prompt).Error; err != nil {
		return nil, err
	}
	return prompt, nil
}

func (r *PromptRepository) Delete(id uint) error {
	if r.Db == nil {
		return errors.New("database connection is nil")
	}
	result := r.Db.Where("id = ?", id).First(&models.Prompt{})
	if result.Error != nil {
		return result.Error
	}

	result = r.Db.Delete(&models.Prompt{}, id)
	if result.Error != nil {
		return result.Error
	}

	return nil
}

func (r *PromptRepository) FindById(id uint) (*models.Prompt, error) {
	var p models.Prompt
	if err := r.Db.First(&p, id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PromptRepository) FindAll(pagination response.Pagination) (*response.Pagination, error) {
	if r.Db == nil {
		return nil, errors.New("database connection is nil")
	}
	var prompts []*models.Prompt
	result := r.Db.Scopes(Paginate(&models.Prompt{}, &pagination, r.Db)).Find(&prompts)
	if result.Error != nil {
		return nil, result.Error
	}
	pagination.Items = prompts
	return &pagination, nil
}
