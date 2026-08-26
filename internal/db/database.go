package db

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"simpletodo/internal/config"
	"simpletodo/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type duplicateEmail struct {
	Email string
	Count int64
}

func normalizeUserEmails(database *gorm.DB) error {
	if !database.Migrator().HasTable(&models.User{}) {
		return nil
	}

	var duplicates []duplicateEmail
	if err := database.Unscoped().Model(&models.User{}).
		Select("LOWER(TRIM(email)) AS email, COUNT(*) AS count").
		Group("LOWER(TRIM(email))").
		Having("COUNT(*) > 1").
		Scan(&duplicates).Error; err != nil {
		return fmt.Errorf("check duplicate user emails: %w", err)
	}
	if len(duplicates) > 0 {
		return fmt.Errorf("cannot create unique user email index: duplicate normalized email %q", duplicates[0].Email)
	}

	if err := database.Unscoped().Model(&models.User{}).
		Where("email <> LOWER(TRIM(email))").
		UpdateColumn("email", gorm.Expr("LOWER(TRIM(email))")).Error; err != nil {
		return fmt.Errorf("normalize user emails: %w", err)
	}
	return nil
}

var DB *gorm.DB

func InitDB() (error, *gorm.DB) {
	appDir, err := config.AppDir()
	dbCLient, err := config.GetDbClient()

	if err != nil {
		return err, nil
	}

	if err = os.MkdirAll(appDir, 0o700); err != nil {
		return err, nil
	}
	if dbCLient == "sqlite" {
		sqliteDir := filepath.Join(appDir, "simple_todo.db")

		// Check SQLite db if exists
		if _, err = os.Stat(sqliteDir); err != nil {
			err = os.MkdirAll(appDir, 0700)
			if err != nil {
				return err, nil
			}
			_, err = os.Create(sqliteDir)
			if err != nil {
				return err, nil
			}
		}

		DB, err = gorm.Open(sqlite.Open(sqliteDir), &gorm.Config{})
		if err != nil {
			fmt.Println("Cannot connect to SQLite")
			log.Fatal("DB connection error:", err)
			return err, nil
		}
		fmt.Println("Connection to Database Sqlite Successful")
	} else if dbCLient == "postgresql" {
		dbConnectionString := config.GetPostgresDBConnectionString()
		DB, err = gorm.Open(postgres.Open(dbConnectionString), &gorm.Config{})
		if err != nil {
			fmt.Println("Cannot connect to PostgreSQL")
			log.Fatal("DB connection error:", err)
			return err, nil
		}
		fmt.Println("Connection to Database Postgres Successful")
	} else {
		return fmt.Errorf("unsupported db client: %s", dbCLient), nil
	}

	if err = normalizeUserEmails(DB); err != nil {
		return err, nil
	}

	if err = DB.AutoMigrate(
		&models.Role{},
		&models.Status{},
		&models.User{},
		&models.OAuthIdentity{},
		&models.Project{},
		&models.Task{},
		&models.PasswordResetToken{},
		&models.EmailVerificationToken{},
		&models.Prompt{},
		&models.AIServerSettings{},
	); err != nil {
		return err, nil
	}

	Seed(DB)

	return nil, DB
}
