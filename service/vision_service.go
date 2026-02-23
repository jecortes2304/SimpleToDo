package service

import (
	"SimpleToDo/dto/request"
	"SimpleToDo/dto/response"
	"SimpleToDo/models"
	"SimpleToDo/repository"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type VisionService struct {
	AIServerRepository *repository.AIServerRepository
	PromptRepository   *repository.PromptRepository
	TaskService        *TaskService
}

func NewVisionService(aiRepo *repository.AIServerRepository, promptRepo *repository.PromptRepository, taskService *TaskService) *VisionService {
	return &VisionService{
		AIServerRepository: aiRepo,
		PromptRepository:   promptRepo,
		TaskService:        taskService,
	}
}

type aiChatRequest struct {
	Model     string      `json:"model"`
	Messages  []aiMessage `json:"messages"`
	MaxTokens int         `json:"max_tokens,omitempty"`
}

type aiMessage struct {
	Role    string      `json:"role"`
	Content interface{} `json:"content"`
}

type aiContentPart struct {
	Type     string `json:"type"`
	Text     string `json:"text,omitempty"`
	ImageUrl *aiUrl `json:"image_url,omitempty"`
}

type aiUrl struct {
	Url string `json:"url"`
}

type aiChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
		Code    string `json:"code"`
	} `json:"error,omitempty"`
}

func (s *VisionService) ExtractTaskFromImage(ctx context.Context, userID uint, projectIdInt uint, base64Image string) (response.TaskResponseDto, error) {
	if base64Image == "" {
		return response.TaskResponseDto{}, errors.New("empty image")
	}

	settings, err := s.AIServerRepository.FindByUserID(userID)
	if err != nil {
		return response.TaskResponseDto{}, errors.New("AI configuration not found for user")
	}

	prompts, err := s.PromptRepository.FindAll(response.Pagination{Page: 1, Limit: 1})
	if err != nil || prompts.Items == nil {
		return response.TaskResponseDto{}, errors.New("system prompt not configured in database")
	}
	promptList, ok := prompts.Items.([]*models.Prompt)
	if !ok || len(promptList) == 0 {
		return response.TaskResponseDto{}, errors.New("system prompt not found")
	}
	systemPrompt := promptList[0]

	parts := strings.Split(base64Image, ",")
	if len(parts) > 1 {
		base64Image = parts[1]
	}
	formattedImage := "data:image/jpeg;base64," + base64Image

	reqBody := aiChatRequest{
		Model: settings.Model,
		Messages: []aiMessage{
			{
				Role:    "system",
				Content: systemPrompt.SystemPrompt,
			},
			{
				Role: "user",
				Content: []aiContentPart{
					{
						Type: "text",
						Text: systemPrompt.Description,
					},
					{
						Type: "image_url",
						ImageUrl: &aiUrl{
							Url: formattedImage,
						},
					},
				},
			},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return response.TaskResponseDto{}, err
	}

	baseUrl := strings.TrimRight(settings.BaseUrl, "/")
	if strings.Contains(baseUrl, "api.openai.com") && !strings.HasSuffix(baseUrl, "/v1") {
		baseUrl += "/v1"
	}
	baseUrl = strings.TrimSuffix(baseUrl, "/chat/completions")
	reqURL := fmt.Sprintf("%s/chat/completions", baseUrl)

	req, err := http.NewRequestWithContext(ctx, "POST", reqURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return response.TaskResponseDto{}, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+settings.APIKey)

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return response.TaskResponseDto{}, fmt.Errorf("connection error: %v", err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		var errorResp aiChatResponse
		_ = json.Unmarshal(bodyBytes, &errorResp)
		if errorResp.Error != nil {
			return response.TaskResponseDto{}, fmt.Errorf("AI Error (%s): %s", errorResp.Error.Type, errorResp.Error.Message)
		}
		return response.TaskResponseDto{}, fmt.Errorf("provider status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var aiResp aiChatResponse
	if err := json.Unmarshal(bodyBytes, &aiResp); err != nil {
		return response.TaskResponseDto{}, errors.New("failed to parse AI response")
	}

	if len(aiResp.Choices) == 0 {
		return response.TaskResponseDto{}, errors.New("no content received")
	}

	rawContent := aiResp.Choices[0].Message.Content
	cleanJson := strings.TrimSpace(rawContent)

	if strings.HasPrefix(cleanJson, "```") {
		lines := strings.Split(cleanJson, "\n")
		if len(lines) >= 2 {
			cleanJson = strings.Join(lines[1:len(lines)-1], "\n")
		}
	}
	cleanJson = strings.TrimSpace(cleanJson)

	var result map[string]string
	if err := json.Unmarshal([]byte(cleanJson), &result); err != nil {
		return response.TaskResponseDto{}, errors.New("failed to parse AI response JSON")
	}

	task := request.CreateTaskRequestDto{
		Title:       result["title"],
		Description: result["description"],
	}

	saveTask, err := s.TaskService.SaveTask(&task, int(projectIdInt), int(userID))
	if err != nil {
		return response.TaskResponseDto{}, fmt.Errorf("failed to save task: %v", err)
	}
	return saveTask, nil
}
