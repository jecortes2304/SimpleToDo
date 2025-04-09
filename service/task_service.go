package service

import (
	"SimpleToDo/dto/request"
	"SimpleToDo/dto/response"
	"SimpleToDo/models"
	"SimpleToDo/repository"
	"SimpleToDo/util/mapper"
	"errors"
	"gorm.io/gorm"
)

type TaskService struct {
	TaskRepository   *repository.TaskRepository
	StatusRepository *repository.StatusRepository
	TaskMapper       *mapper.TaskMapperImpl
}

func NewTaskService(taskRepo *repository.TaskRepository, statusRepo *repository.StatusRepository,
	taskMapper *mapper.TaskMapperImpl) *TaskService {
	return &TaskService{
		TaskRepository:   taskRepo,
		StatusRepository: statusRepo,
		TaskMapper:       taskMapper,
	}
}

func (taskService *TaskService) GetAll(pagination response.Pagination) (*response.Pagination, error) {

	tasksResponsePaginated, err := taskService.TaskRepository.FindAll(pagination)
	if err != nil {
		return nil, err
	}
	if tasksResponsePaginated.Items == nil {
		return tasksResponsePaginated, nil
	}

	tasks, ok := tasksResponsePaginated.Items.([]*models.Task)
	if !ok {
		return nil, errors.New("error converting tasks to task entity")
	}

	var taskResponse = make([]response.TaskResponseDto, 0)
	for _, task := range tasks {
		taskDto := taskService.TaskMapper.ToDto(task)
		taskResponse = append(taskResponse, taskDto)
	}

	tasksResponsePaginated.Items = taskResponse

	return tasksResponsePaginated, nil
}

func (taskService *TaskService) GetAllTaskByProjectId(pagination response.Pagination, projectId int) (*response.Pagination, error) {

	tasksResponsePaginated, err := taskService.TaskRepository.FindAllByProjectId(pagination, projectId)
	if err != nil {
		return nil, err
	}
	if tasksResponsePaginated.Items == nil {
		return tasksResponsePaginated, nil
	}

	tasks, ok := tasksResponsePaginated.Items.([]*models.Task)
	if !ok {
		return nil, errors.New("error converting tasks to task entity")
	}

	var taskResponse = make([]response.TaskResponseDto, 0)
	for _, task := range tasks {
		taskDto := taskService.TaskMapper.ToDto(task)
		taskResponse = append(taskResponse, taskDto)
	}

	tasksResponsePaginated.Items = taskResponse

	return tasksResponsePaginated, nil
}

func (taskService *TaskService) GetTaskById(taskId int) (response.TaskResponseDto, error) {
	task, err := taskService.TaskRepository.FindById(taskId)
	if err != nil {
		return response.TaskResponseDto{}, err
	}
	taskDto := taskService.TaskMapper.ToDto(&task)

	return taskDto, nil
}

func (taskService *TaskService) SaveTask(taskToCreate *request.CreateTaskRequestDto, projectId int) (response.TaskResponseDto, error) {

	statusFetched, err := taskService.StatusRepository.FindById(1)
	if err != nil {
		return response.TaskResponseDto{}, err
	}

	taskEntity := models.Task{
		Model:       gorm.Model{},
		Title:       taskToCreate.Title,
		Description: taskToCreate.Description,
		StatusId:    1,
		Status:      statusFetched,
		UserId:      1,
		ProjectId:   uint(projectId),
		User:        models.User{},
		Project:     models.Project{},
	}

	taskResponse, err := taskService.TaskRepository.Save(taskEntity)
	if err != nil {
		return response.TaskResponseDto{}, err
	}

	return taskService.TaskMapper.ToDto(&taskResponse), nil
}

func (taskService *TaskService) UpdateTask(taskUpdate *request.UpdateTaskRequestDto, id int) (response.TaskResponseDto, error) {

	statusFetched, err := taskService.StatusRepository.FindByValue(taskUpdate.Status)
	if err != nil {
		return response.TaskResponseDto{}, err
	}

	taskEntity := models.Task{
		Title:       taskUpdate.Title,
		Description: taskUpdate.Description,
		StatusId:    statusFetched.ID,
		Status:      *statusFetched,
	}

	taskResponse, err := taskService.TaskRepository.Update(taskEntity, id)
	if err != nil {
		return response.TaskResponseDto{}, err
	}

	return taskService.TaskMapper.ToDto(&taskResponse), nil
}

func (taskService *TaskService) DeleteTasks(taskIds []int) error {
	err := taskService.TaskRepository.Delete(taskIds)
	if err != nil {
		return err
	}

	return nil
}
