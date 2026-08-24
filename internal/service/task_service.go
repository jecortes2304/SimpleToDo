package service

import (
	"errors"
	"simpletodo/internal/dto/request"
	response2 "simpletodo/internal/dto/response"
	"simpletodo/internal/models"
	repository2 "simpletodo/internal/repository"
	"simpletodo/internal/util/mapper"

	"gorm.io/gorm"
)

type TaskService struct {
	TaskRepository   *repository2.TaskRepository
	StatusRepository *repository2.StatusRepository
	TaskMapper       *mapper.TaskMapperImpl
}

func NewTaskService(taskRepo *repository2.TaskRepository, statusRepo *repository2.StatusRepository,
	taskMapper *mapper.TaskMapperImpl) *TaskService {
	return &TaskService{
		TaskRepository:   taskRepo,
		StatusRepository: statusRepo,
		TaskMapper:       taskMapper,
	}
}

func (taskService *TaskService) GetAll(pagination response2.Pagination, userId int) (*response2.Pagination, error) {

	tasksResponsePaginated, err := taskService.TaskRepository.FindAll(pagination, userId)
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

	var taskResponse = make([]response2.TaskResponseDto, 0)
	for _, task := range tasks {
		taskDto := taskService.TaskMapper.ToDto(task)
		taskResponse = append(taskResponse, taskDto)
	}

	tasksResponsePaginated.Items = taskResponse

	return tasksResponsePaginated, nil
}

func (taskService *TaskService) GetAllTaskByProjectId(pagination response2.Pagination, projectId int, userId int, taskTitle string, status string) (*response2.Pagination, error) {

	statusModel, err := taskService.StatusRepository.FindByValue(status)
	if err != nil {
		return nil, err
	}
	statusId := statusModel.ID
	tasksResponsePaginated, err := taskService.TaskRepository.FindAllByProjectId(pagination, projectId, userId, taskTitle, int(statusId))
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

	var taskResponse = make([]response2.TaskResponseDto, 0)
	for _, task := range tasks {
		taskDto := taskService.TaskMapper.ToDto(task)
		taskResponse = append(taskResponse, taskDto)
	}

	tasksResponsePaginated.Items = taskResponse

	return tasksResponsePaginated, nil
}

func (taskService *TaskService) GetTaskById(taskId int) (response2.TaskResponseDto, error) {
	task, err := taskService.TaskRepository.FindById(taskId)
	if err != nil {
		return response2.TaskResponseDto{}, err
	}
	taskDto := taskService.TaskMapper.ToDto(&task)

	return taskDto, nil
}

func (taskService *TaskService) SaveTask(taskToCreate *request.CreateTaskRequestDto, projectId int, userId int) (response2.TaskResponseDto, error) {

	statusFetched, err := taskService.StatusRepository.FindById(1)
	if err != nil {
		return response2.TaskResponseDto{}, err
	}

	taskEntity := models.Task{
		Model:       gorm.Model{},
		Title:       taskToCreate.Title,
		Description: taskToCreate.Description,
		StatusId:    1,
		Status:      statusFetched,
		UserId:      uint(userId),
		ProjectId:   uint(projectId),
		User:        models.User{},
		Project:     models.Project{},
	}

	taskResponse, err := taskService.TaskRepository.Save(taskEntity)
	if err != nil {
		return response2.TaskResponseDto{}, err
	}

	return taskService.TaskMapper.ToDto(&taskResponse), nil
}

func (taskService *TaskService) UpdateTask(taskUpdate *request.UpdateTaskRequestDto, id int) (response2.TaskResponseDto, error) {

	statusFetched, err := taskService.StatusRepository.FindByValue(taskUpdate.Status)
	if err != nil {
		return response2.TaskResponseDto{}, err
	}

	taskEntity := models.Task{
		Title:       taskUpdate.Title,
		Description: taskUpdate.Description,
		StatusId:    statusFetched.ID,
		Status:      *statusFetched,
	}

	taskResponse, err := taskService.TaskRepository.Update(taskEntity, id)
	if err != nil {
		return response2.TaskResponseDto{}, err
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
