package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/jbrukh/bayesian"
)

const (
	ClassImportant bayesian.Class = "Important"
	ClassNoise     bayesian.Class = "Noise"
)

var classifier *bayesian.Classifier

type ClassificationRequest struct {
	Message string `json:"message"`
}

type ClassificationResponse struct {
	IsImportant bool    `json:"is_important"`
	Confidence  float64 `json:"confidence"`
	Tag         string  `json:"tag"`
}

func main() {
	fmt.Println("1. Loading dataset.csv...")
	err := trainFromCSV("dataset.csv")
	if err != nil {
		log.Fatalf("Failed to train model: %v", err)
	}
	fmt.Println("2. Model trained successfully!")

	http.HandleFunc("/classify", handleClassify)

	fmt.Println("3. Server running on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

