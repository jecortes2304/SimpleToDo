package service

import (
	"bytes"
	"simpletodo/internal/dto/request"
	"simpletodo/internal/models"
	"simpletodo/internal/repository"
	"simpletodo/internal/util/mapper"
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestAdminUpdatePreservesEmailAndUpdatesAllowedFields(t *testing.T) {
	database := authTestDB(t)
	user := models.User{
		FirstName: "Original",
		LastName:  "User",
		Email:     "original@example.com",
		Username:  "original-user",
		Password:  "old-password",
		RoleId:    2,
	}
	if err := database.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}

	userService := NewUserService(
		repository.NewUserRepository(database),
		repository.NewAIServerRepository(database),
		mapper.NewUserMapperImpl(),
	)
	newImage := []byte("new-avatar")
	if _, err := userService.UpdateByAdmin(user.ID, request.AdminUpdateUserRequest{
		FirstName: "Updated",
		LastName:  "Person",
		Image:     newImage,
		Password:  "new-password",
	}); err != nil {
		t.Fatalf("admin update: %v", err)
	}

	updated, err := userService.UserRepository.FindByID(user.ID)
	if err != nil {
		t.Fatalf("reload user: %v", err)
	}
	if updated.Email != "original@example.com" {
		t.Fatalf("admin update changed immutable email: %q", updated.Email)
	}
	if updated.FirstName != "Updated" || updated.LastName != "Person" {
		t.Fatalf("name was not updated: %+v", updated)
	}
	if !bytes.Equal(updated.Image, newImage) {
		t.Fatalf("avatar was not updated")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(updated.Password), []byte("new-password")); err != nil {
		t.Fatalf("new password was not securely stored: %v", err)
	}
}
