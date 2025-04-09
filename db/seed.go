package db

import (
	"SimpleToDo"
	"SimpleToDo/models"
	"gorm.io/gorm"
	"log"
	"strings"
	"time"
)

func Seed(db *gorm.DB) {
	sqlBytes, err := embedfs.SQLFS.ReadFile("db/data.sql")
	if err != nil {
		log.Fatalf("Error al leer el archivo SQL embebido: %v", err)
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

	imageBytes, err := embedfs.ImageFS.ReadFile("config/root_image.png")
	if err != nil {
		log.Fatalf("Error al leer la imagen embebida: %v", err)
	}

	for _, stmt := range sqlStatements {
		stmt = strings.TrimSpace(stmt)
		if stmt != "" {
			if err := db.Exec(stmt).Error; err != nil {
				log.Fatalf("Error al ejecutar SQL: %v", err)
			}
		}
	}

	user := models.User{
		FirstName: "Root",
		LastName:  "Admin",
		Age:       30,
		Gender:    "Unknown",
		Email:     "root@example.com",
		Phone:     "123456789",
		Username:  "root",
		Image:     imageBytes,
		Password:  "rootpassword",
		BirthDate: time.Now(),
		Address:   "First Avenue 5, Madrid, Spain",
		RoleId:    1,
	}
	if err := db.FirstOrCreate(&user, models.User{Username: "root"}).Error; err != nil {
		log.Fatalf("Error inserting user: %v", err)
	}

	log.Println("✅ Seed completed correctly.")
}
