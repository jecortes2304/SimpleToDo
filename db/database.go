package db

import (
	"SimpleToDo/config"
	"SimpleToDo/models"
	"fmt"
	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"log"
	"os"
	"path/filepath"
)

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

	if err = DB.AutoMigrate(
		&models.Role{},
		&models.Status{},
		&models.User{},
		&models.Project{},
		&models.Task{},
		&models.PasswordResetToken{},
		&models.EmailVerificationToken{},
	); err != nil {
		return err, nil
	}

	Seed(DB)

	return nil, DB
}
