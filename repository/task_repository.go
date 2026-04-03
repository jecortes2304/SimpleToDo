package repository

import (
	"SimpleToDo/dto/response"
	"SimpleToDo/models"
	"errors"
	"gorm.io/gorm"
	"strings"
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

func (t *TaskRepository) Delete(ids []int) error {
	if t.Db == nil {
		return errors.New("database connection is nil")
	}

	var count int64
	t.Db.Model(&models.Task{}).Where("id IN ?", ids).Count(&count)
	if count == 0 {
		return errors.New("no tasks found to delete")
	}

	result := t.Db.Where("id IN ?", ids).Delete(&models.Task{})
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("no tasks were deleted")
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

func (t *TaskRepository) FindAll(pagination response.Pagination, userId int) (*response.Pagination, error) {
	if t.Db == nil {
		return nil, errors.New("database connection is nil")
	}
	var tasks []*models.Task
	result := t.Db.Where("user_id = ?", userId).Scopes(Paginate(&models.Task{}, &pagination, t.Db)).Preload("Status").Find(&tasks)
	if result.Error != nil {
		return nil, result.Error
	}
	pagination.Items = tasks

	return &pagination, nil
}

func (t *TaskRepository) FindAllByProjectId(pagination response.Pagination, projectId int, userId int, taskTitle string, statusId int) (*response.Pagination, error) {
	if t.Db == nil {
		return nil, errors.New("database connection is nil")
	}
	var tasks []*models.Task
	conditions := getConditionsByParams(taskTitle, statusId, projectId, userId)
	queryStr, args := response.ToQueryStringMany(conditions)

	result := t.Db.Where(queryStr, args...).
		Scopes(PaginateWithConditions(&models.Task{}, conditions, &pagination, t.Db)).
		Preload("Status").
		Find(&tasks)

	if result.Error != nil {
		return nil, result.Error
	}
	pagination.Items = tasks

	return &pagination, nil
}

func getConditionsByParams(taskTitle string, statusId int, projectId int, userId int) []response.Condition {
	var conditions []response.Condition

	if taskTitle != "" {
		conditions = append(conditions, response.Condition{
			Column:   "LOWER(title)",
			Operator: response.Like,
			Value:    "%" + strings.ToLower(taskTitle) + "%",
			Modifier: response.And,
		})
	}
	if statusId != 0 {
		conditions = append(conditions, response.Condition{
			Column:   "status_id",
			Operator: response.Equal,
			Value:    statusId,
			Modifier: response.And,
		})
	}
	conditions = append(conditions, response.Condition{
		Column:   "user_id",
		Operator: response.Equal,
		Value:    userId,
		Modifier: response.And})
	conditions = append(conditions, response.Condition{
		Column:   "project_id",
		Operator: response.Equal,
		Value:    projectId,
		Modifier: response.And})
	return conditions
}
