package db

import (
	"SimpleToDo/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"log"
	"os"
	"strings"
	"time"
)

func ReadImageFile(filePath string) ([]byte, error) {
	imageData, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}
	return imageData, nil
}

func Seed(db *gorm.DB) {
	filePath := "db/data.sql"
	sqlBytes, err := os.ReadFile(filePath)
	if err != nil {
		log.Fatalf("Error al leer el archivo SQL: %v", err)
	}

	imageBytes, err := ReadImageFile("config/root_image.png")
	if err != nil {
		log.Fatalf("Error al leer la imagen: %v", err)
	}

	sqlStatements := strings.Split(string(sqlBytes), ";")

	for _, stmt := range sqlStatements {
		stmt = strings.TrimSpace(stmt)
		if stmt != "" {
			if err := db.Exec(stmt).Error; err != nil {
				log.Fatalf("Error al ejecutar SQL: %v", err)
			}
		}
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("rootpassword"), bcrypt.DefaultCost)

	user := models.User{
		FirstName: "Root",
		LastName:  "Admin",
		Age:       30,
		Gender:    "Unknown",
		Email:     "root@example.com",
		Phone:     "123456789",
		Username:  "root",
		Image:     imageBytes,
		Password:  string(hashedPassword),
		BirthDate: time.Now(),
		AddressId: 1,
		RoleId:    1,
	}
	if err := db.FirstOrCreate(&user, models.User{Username: "root"}).Error; err != nil {
		log.Fatalf("Error inserting user: %v", err)
	}

	log.Println("✅ Seed completed correctly.")
}
