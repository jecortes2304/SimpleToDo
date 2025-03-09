package util

import (
	"bufio"
	"fmt"
	"log"
	"os"
)

func CheckError(e error, message string) {
	if e != nil {
		log.Fatal("ERROR: ", message+" ", e)
	}
}

func CheckErrorAndReturned(e error, message string) error {
	if e != nil {
		log.Fatal("ERROR: ", message+" ", e)
		return e
	}
	return nil
}

func CheckErrorF(e error, format string, v ...any) {
	if e != nil {
		log.Fatalf(format, v)
	}
}

func PrintBanner() {
	filename := "config/banner.txt"
	file, err := os.Open(filename)
	if err != nil {
		fmt.Println("⚠️ Banner not found:", err)
		return
	}
	defer func(file *os.File) {
		err := file.Close()
		if err != nil {
			fmt.Println("⚠️ Error closing file:", err)
		}
	}(file)

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		fmt.Println(scanner.Text())
	}
}
