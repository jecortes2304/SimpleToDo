package service

import (
	"simpletodo/internal/models"
	"simpletodo/internal/repository"
	"testing"
	"time"
)

func TestCleanupExpiredUnverifiedUsersDeletesDependenciesAndProtectsOthers(t *testing.T) {
	database := authTestDB(t)
	now := time.Now().UTC()

	expired := models.User{FirstName: "Expired", LastName: "User", Email: "expired@example.com", Username: "expired", Password: "password", RoleId: 2}
	recent := models.User{FirstName: "Recent", LastName: "User", Email: "recent@example.com", Username: "recent", Password: "password", RoleId: 2}
	verified := models.User{FirstName: "Verified", LastName: "User", Email: "verified@example.com", Username: "verified", Password: "password", RoleId: 2, Verified: true}
	admin := models.User{FirstName: "Root", LastName: "Admin", Email: "root@example.com", Username: "root", Password: "password", RoleId: 1}
	for _, user := range []*models.User{&expired, &recent, &verified, &admin} {
		if err := database.Create(user).Error; err != nil {
			t.Fatalf("create user %s: %v", user.Email, err)
		}
	}
	database.Model(&expired).Update("created_at", now.Add(-8*24*time.Hour))
	database.Model(&recent).Update("created_at", now.Add(-6*24*time.Hour))
	database.Model(&verified).Update("created_at", now.Add(-8*24*time.Hour))
	database.Model(&admin).Update("created_at", now.Add(-8*24*time.Hour))

	project := models.Project{Name: "Expired project", UserId: expired.ID}
	if err := database.Create(&project).Error; err != nil {
		t.Fatalf("create project: %v", err)
	}
	dependencies := []any{
		&models.Task{Title: "Expired task", UserId: expired.ID, ProjectId: project.ID},
		&models.OAuthIdentity{UserID: expired.ID, Provider: "google", Subject: "expired-sub"},
		&models.EmailVerificationToken{UserID: expired.ID, TokenHash: "email-token", ExpiresAt: now.Add(time.Hour)},
		&models.PasswordResetToken{UserID: expired.ID, TokenHash: "reset-token", ExpiresAt: now.Add(time.Hour)},
		&models.AIServerSettings{UserID: expired.ID, BaseUrl: "http://example.com", APIKey: "key", Model: "model"},
	}
	for _, dependency := range dependencies {
		if err := database.Create(dependency).Error; err != nil {
			t.Fatalf("create dependency %T: %v", dependency, err)
		}
	}

	authService := NewAuthService(repository.NewAuthRepository(database))
	deleted, err := authService.CleanupExpiredUnverifiedUsers(now)
	if err != nil {
		t.Fatalf("cleanup accounts: %v", err)
	}
	if deleted != 1 {
		t.Fatalf("expected one deleted account, got %d", deleted)
	}

	var expiredCount int64
	database.Unscoped().Model(&models.User{}).Where("id = ?", expired.ID).Count(&expiredCount)
	if expiredCount != 0 {
		t.Fatalf("expired account was not hard deleted")
	}
	for _, id := range []uint{recent.ID, verified.ID, admin.ID} {
		var count int64
		database.Unscoped().Model(&models.User{}).Where("id = ?", id).Count(&count)
		if count != 1 {
			t.Fatalf("protected user %d was deleted", id)
		}
	}
	for _, model := range []any{&models.Project{}, &models.Task{}, &models.OAuthIdentity{}, &models.EmailVerificationToken{}, &models.PasswordResetToken{}, &models.AIServerSettings{}} {
		var count int64
		database.Unscoped().Model(model).Where("user_id = ?", expired.ID).Count(&count)
		if count != 0 {
			t.Fatalf("dependency %T was not deleted", model)
		}
	}
}
