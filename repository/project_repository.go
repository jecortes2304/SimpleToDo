package repository

import (
	"SimpleToDo/dto/response"
	"SimpleToDo/models"
	"errors"
	"gorm.io/gorm"
)

type ProjectRepository struct {
	Db *gorm.DB
}

func NewProjectRepository(db *gorm.DB) *ProjectRepository {
	return &ProjectRepository{Db: db}
}

func (p *ProjectRepository) Save(project models.Project) (models.Project, error) {
	if p.Db == nil {
		return models.Project{}, errors.New("database connection is nil")
	}
	result := p.Db.Save(&project)
	if result.Error != nil {
		return models.Project{}, result.Error
	}
	return project, nil
}

func (p *ProjectRepository) Update(project models.Project, id int) (models.Project, error) {
	if p.Db == nil {
		return models.Project{}, errors.New("database connection is nil")
	}

	result := p.Db.Model(&models.Project{}).Where("id = ?", id).Updates(project)

	if result.Error != nil {
		return models.Project{}, result.Error
	}

	var updatedProject models.Project
	err := p.Db.Preload("Tasks").First(&updatedProject, id).Error
	if err != nil {
		return models.Project{}, err
	}

	return updatedProject, nil
}

func (p *ProjectRepository) Delete(id int) error {
	if p.Db == nil {
		return errors.New("database connection is nil")
	}
	result := p.Db.Where("project_id = ?", id).Delete(&models.Task{})
	if result.Error != nil {
		return result.Error
	}

	result = p.Db.Delete(&models.Project{}, id)
	if result.Error != nil {
		return result.Error
	}

	return nil
}

func (p *ProjectRepository) FindById(id int) (models.Project, error) {
	if p.Db == nil {
		return models.Project{}, errors.New("database connection is nil")
	}
	var project models.Project
	result := p.Db.Preload("Tasks").First(&project, id)
	if result.Error != nil {
		return models.Project{}, errors.New("project not found")
	}
	return project, nil
}

func (p *ProjectRepository) FindAll(pagination response.Pagination) (*response.Pagination, error) {
	if p.Db == nil {
		return nil, errors.New("database connection is nil")
	}
	var projects []*models.Project
	result := p.Db.Scopes(Paginate(&models.Project{}, &pagination, p.Db)).Preload("Tasks").Find(&projects)
	if result.Error != nil {
		return nil, result.Error
	}
	pagination.Items = projects

	return &pagination, nil
}
