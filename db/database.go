package db

import (
	"SimpleToDo/models"
	"fmt"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"log"
	"os"
	"path"
)

var DB *gorm.DB

func InitDB() (error, *gorm.DB) {
	confPath, _ := os.UserHomeDir()
	appDir := path.Dir(confPath + "/SimpleToDo/")
	sqliteFile := "simple_todo.db"
	sqliteDir := appDir + "/" + sqliteFile

	// Check SQLite db if exists
	if _, err := os.Stat(sqliteDir); err != nil {
		err := os.MkdirAll(appDir, 0700)
		if err != nil {
			return err, nil
		}
		_, err = os.Create(sqliteDir)
		if err != nil {
			return err, nil
		}
	}

	var err error
	DB, err = gorm.Open(sqlite.Open(sqliteDir), &gorm.Config{})

	if err != nil {
		fmt.Println("Cannot connect to database Postgres")
		log.Fatal("DB connection error:", err)
		return err, nil
	} else {
		fmt.Println("Connection to Database Successful")
	}

	errMigrate := DB.AutoMigrate(
		&models.Role{},
		&models.Status{},
		&models.Task{},
		&models.Project{},
		&models.User{},
	)

	Seed(DB)
	if errMigrate != nil {
		return errMigrate, nil
	}

	return nil, DB
}
