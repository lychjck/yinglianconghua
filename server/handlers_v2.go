package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

func getRandomCoupletV2(w http.ResponseWriter, r *http.Request) {
	log.Printf("[API] %s %s - Getting random couplet v2", r.Method, r.URL.Path)
	c, err := repo.GetRandomCoupletV2()
	if err != nil {
		log.Printf("[Error] Failed to get random couplet v2: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "internal server error"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(c)
}

func getCoupletByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid id"})
		return
	}

	log.Printf("[API] %s %s - Getting couplet by ID: %d", r.Method, r.URL.Path, id)
	c, err := repo.GetCoupletByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "couplet not found"})
			return
		}
		log.Printf("[Error] Failed to get couplet by ID: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "internal server error"})
		return
	}

	resp := CoupletDetailResponse{Couplet: *c}
	if c.ParagraphID != nil {
		p, err := repo.GetParagraphByID(*c.ParagraphID)
		if err == nil {
			resp.Paragraph = p
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func listCouplets(w http.ResponseWriter, r *http.Request) {
	log.Printf("[API] %s %s - Listing couplets", r.Method, r.URL.Path)
	q := r.URL.Query()

	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(q.Get("page_size"))
	if pageSize <= 0 || pageSize > 50 {
		pageSize = 20
	}

	filter := CoupletFilter{
		Dynasty:  q.Get("dynasty"),
		Occasion: q.Get("occasion"),
		BookName: q.Get("book_name"),
		Page:     page,
		PageSize: pageSize,
	}

	data, total, err := repo.ListCouplets(filter)
	if err != nil {
		log.Printf("[Error] Failed to list couplets: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "internal server error"})
		return
	}

	if data == nil {
		data = []CoupletV2{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(CoupletListResponse{
		Data:     data,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

func getParagraphByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid id"})
		return
	}

	log.Printf("[API] %s %s - Getting paragraph by ID: %d", r.Method, r.URL.Path, id)
	p, err := repo.GetParagraphByID(id)
	if err != nil {
		if err == sql.ErrNoRows {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "paragraph not found"})
			return
		}
		log.Printf("[Error] Failed to get paragraph by ID: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "internal server error"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(p)
}

func getFilterOptions(w http.ResponseWriter, r *http.Request) {
	log.Printf("[API] %s %s - Getting filter options", r.Method, r.URL.Path)

	dynasties, err := repo.GetDistinctDynasties()
	if err != nil {
		log.Printf("[Error] Failed to get dynasties: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "internal server error"})
		return
	}

	occasions, err := repo.GetDistinctOccasions()
	if err != nil {
		log.Printf("[Error] Failed to get occasions: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "internal server error"})
		return
	}

	books, err := repo.GetDistinctBooks()
	if err != nil {
		log.Printf("[Error] Failed to get books: %v", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "internal server error"})
		return
	}

	if dynasties == nil {
		dynasties = []string{}
	}
	if occasions == nil {
		occasions = []string{}
	}
	if books == nil {
		books = []string{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(FilterOptionsResponse{
		Dynasties: dynasties,
		Occasions: occasions,
		Books:     books,
	})
}
