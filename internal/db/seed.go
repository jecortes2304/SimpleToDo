package db

import (
	"errors"
	"log"
	embedfs "simpletodo"
	"simpletodo/internal/config"
	"simpletodo/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UserRootDtoEnvs struct {
	FirstName string
	LastName  string
	Email     string
	Username  string
	Password  string
}

func Seed(db *gorm.DB) {
	err := db.Transaction(func(tx *gorm.DB) error {
		statuses := []models.Status{
			{ID: 1, Name: "PENDING", Value: "pending"},
			{ID: 2, Name: "ONGOING", Value: "ongoing"},
			{ID: 3, Name: "COMPLETED", Value: "completed"},
			{ID: 4, Name: "BLOCKED", Value: "blocked"},
			{ID: 5, Name: "CANCELLED", Value: "cancelled"},
		}
		for _, s := range statuses {
			if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&s).Error; err != nil {
				return err
			}
		}

		roles := []models.Role{
			{ID: 1, Name: "Admin", Value: "admin"},
			{ID: 2, Name: "USER", Value: "user"},
		}
		for _, r := range roles {
			if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&r).Error; err != nil {
				return err
			}
		}

		imageBytes, err := embedfs.RootImage.ReadFile("assets/app/root_image.png")
		if err != nil {
			return err
		}
		userRoot := getUserRootFromEnv()

		var root models.User
		if err := tx.Where("username = ?", "root").First(&root).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				root = models.User{
					FirstName: userRoot.FirstName,
					LastName:  userRoot.LastName,
					Email:     userRoot.Email,
					Username:  userRoot.Username,
					Image:     imageBytes,
					Password:  userRoot.Password,
					RoleId:    1,
					Verified:  true,
				}
				if err := tx.Create(&root).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}

		return nil
	})

	if err != nil {
		log.Fatalf("seed error: %v", err)
	}

	log.Println("Seed completed.")
}

func getUserRootFromEnv() UserRootDtoEnvs {
	env := config.GetAppEnv()
	firstName := env.RootFirstName
	if firstName == "" {
		firstName = "Root"
	}
	lastName := env.RootLastName
	if lastName == "" {
		lastName = "Admin"
	}
	email := env.RootEmail
	if email == "" {
		panic("ROOT_EMAIL environment variable is not set")
	}
	username := env.RootUsername
	if username == "" {
		panic("ROOT_USERNAME environment variable is not set")
	}
	password := env.RootPassword
	if password == "" {
		panic("ROOT_PASSWORD environment variable is not set")
	}

	var userRoot = UserRootDtoEnvs{
		FirstName: firstName,
		LastName:  lastName,
		Email:     email,
		Username:  username,
		Password:  password,
	}

	return userRoot
}
