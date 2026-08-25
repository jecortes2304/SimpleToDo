package service

import (
	"errors"
	"simpletodo/internal/dto/request"
	response2 "simpletodo/internal/dto/response"
	"simpletodo/internal/models"
	"simpletodo/internal/repository"
)

type PromptService struct {
	PromptRepository *repository.PromptRepository
}

func NewPromptService(promptRepo *repository.PromptRepository) *PromptService {
	return &PromptService{
		PromptRepository: promptRepo,
	}
}

func (s *PromptService) Create(data request.UpsertPromptRequest) (*response2.PromptResponse, error) {
	prompt := &models.Prompt{
		Title:        data.Title,
		Description:  data.Description,
		SystemPrompt: data.SystemPrompt,
	}
	err := s.PromptRepository.Save(prompt)
	if err != nil {
		return nil, err
	}
	return &response2.PromptResponse{
		ID:           int64(prompt.ID),
		Title:        prompt.Title,
		Description:  prompt.Description,
		SystemPrompt: prompt.SystemPrompt,
		CreatedAt:    prompt.CreatedAt,
		UpdatedAt:    prompt.UpdatedAt,
	}, nil
}

func (s *PromptService) Update(id uint, data request.UpsertPromptRequest) (*response2.PromptResponse, error) {
	existing, err := s.PromptRepository.FindById(id)
	if err != nil {
		return nil, err
	}

	if data.Title != "" {
		existing.Title = data.Title
	}
	if data.Description != "" {
		existing.Description = data.Description
	}
	if data.SystemPrompt != "" {
		existing.SystemPrompt = data.SystemPrompt
	}

	promptUpdated, err := s.PromptRepository.Update(existing)
	if err != nil {
		return nil, err
	}

	return &response2.PromptResponse{
		ID:           int64(promptUpdated.ID),
		Title:        promptUpdated.Title,
		Description:  promptUpdated.Description,
		SystemPrompt: promptUpdated.SystemPrompt,
		CreatedAt:    promptUpdated.CreatedAt,
		UpdatedAt:    promptUpdated.UpdatedAt,
	}, nil
}

func (s *PromptService) Delete(id uint) error {
	return s.PromptRepository.Delete(id)
}

func (s *PromptService) GetByID(id uint) (*response2.PromptResponse, error) {
	prompt, err := s.PromptRepository.FindById(id)
	if err != nil {
		return nil, err
	}
	return &response2.PromptResponse{
		ID:           int64(prompt.ID),
		Title:        prompt.Title,
		Description:  prompt.Description,
		SystemPrompt: prompt.SystemPrompt,
		CreatedAt:    prompt.CreatedAt,
		UpdatedAt:    prompt.UpdatedAt,
	}, nil
}

func (s *PromptService) GetAll(pagination response2.Pagination) (*response2.Pagination, error) {
	promptsPaginated, err := s.PromptRepository.FindAll(pagination)
	if err != nil {
		return nil, err
	}
	prompts, ok := promptsPaginated.Items.([]*models.Prompt)
	if !ok {
		return nil, errors.New("error converting prompts to project entity")
	}

	var promptsResponse = make([]response2.PromptResponse, 0)
	for _, prompt := range prompts {
		promptDto := response2.PromptResponse{
			ID:           int64(prompt.ID),
			Title:        prompt.Title,
			Description:  prompt.Description,
			SystemPrompt: prompt.SystemPrompt,
			CreatedAt:    prompt.CreatedAt,
			UpdatedAt:    prompt.UpdatedAt,
		}
		promptsResponse = append(promptsResponse, promptDto)
	}

	promptsPaginated.Items = promptsResponse
	return promptsPaginated, nil
}
