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

func trainFromCSV(filepath string) error {
	file, err := os.Open(filepath)
	if err != nil {
		return err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return err
	}

	classifier = bayesian.NewClassifier(ClassImportant, ClassNoise)

	for i, record := range records {
		if i == 0 {
			continue 
		}

		text := strings.ToLower(record[0])
		label := record[1]

		words := strings.Fields(text)

		if label == "Important" {
			classifier.Learn(words, ClassImportant)
		} else {
			classifier.Learn(words, ClassNoise)
		}
	}

	return nil
}

// Logic to handle incoming web requests
func handleClassify(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ClassificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	words := strings.Fields(strings.ToLower(req.Message))
	scores, _, _ := classifier.LogScores(words)
	probs, _, _ := classifier.ProbScores(words)

	isImportant := scores[0] > scores[1]
	
	resp := ClassificationResponse{
		IsImportant: isImportant,
		Confidence:  probs[0],
		Tag:         string(ClassImportant),
	}
	if !isImportant {
		resp.Tag = string(ClassNoise)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}