package repository

import (
	"SimpleToDo/dto/response"
	"SimpleToDo/models"
	"errors"
	"gorm.io/gorm"
)

type TaskRepository struct {
	Db *gorm.DB
}

func NewTaskRepository(db *gorm.DB) *TaskRepository {
	return &TaskRepository{Db: db}
}

func (t *TaskRepository) Save(taskToCreate models.Task) (task models.Task, err error) {
	if t.Db == nil {
		return models.Task{}, errors.New("database connection is nil")
	}
	result := t.Db.Model(&models.Project{}).Where("id = ?", taskToCreate.ProjectId).First(&models.Project{})
	if result.Error != nil {
		return models.Task{}, result.Error
	}

	result = t.Db.Save(&taskToCreate)
	if result.Error != nil {
		return models.Task{}, result.Error
	}
	return taskToCreate, nil
}

func (t *TaskRepository) Update(taskToUpdate models.Task, id int) (models.Task, error) {
	if t.Db == nil {
		return models.Task{}, errors.New("database connection is nil")
	}

	result := t.Db.Model(&models.Task{}).Where("id = ?", id).Updates(taskToUpdate)

	if result.Error != nil {
		return models.Task{}, result.Error
	}

	var updatedTask models.Task
	err := t.Db.Preload("Status").First(&updatedTask, id).Error
	if err != nil {
		return models.Task{}, err
	}

	return updatedTask, nil
}

func (t *TaskRepository) Delete(id int) error {
	if t.Db == nil {
		return errors.New("database connection is nil")
	}

	var taskToDelete models.Task

	result := t.Db.First(&taskToDelete, id)
	if result.Error != nil {
		return errors.New("task not found")
	}

	result = t.Db.Delete(&taskToDelete, id)
	if result.Error != nil {
		return result.Error
	}

	return nil
}

func (t *TaskRepository) FindById(id int) (task models.Task, err error) {
	if t.Db == nil {
		return models.Task{}, errors.New("database connection is nil")
	}
	var taskToReturn models.Task
	result := t.Db.Preload("Status").First(&taskToReturn, id)
	if result.Error != nil {
		return taskToReturn, errors.New("task not found")
	}
	return taskToReturn, nil
}

func (t *TaskRepository) FindAll(pagination response.Pagination) (*response.Pagination, error) {
	if t.Db == nil {
		return nil, errors.New("database connection is nil")
	}
	var tasks []*models.Task
	result := t.Db.Scopes(Paginate(&models.Task{}, &pagination, t.Db)).Preload("Status").Find(&tasks)
	if result.Error != nil {
		return nil, result.Error
	}
	pagination.Items = tasks

	return &pagination, nil
}

func (t *TaskRepository) FindAllByProjectId(pagination response.Pagination, projectId int) (*response.Pagination, error) {
	if t.Db == nil {
		return nil, errors.New("database connection is nil")
	}
	var tasks []*models.Task
	result := t.Db.Scopes(Paginate(&models.Task{}, &pagination, t.Db)).
		Preload("Status").
		Where("project_id = ?", projectId).
		Find(&tasks)
	if result.Error != nil {
		return nil, result.Error
	}
	pagination.Items = tasks

	return &pagination, nil
}
