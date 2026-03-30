package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"unicode/utf8"

	"github.com/gorilla/mux"
)

// Feature: couplet-search, Property 1: 搜索结果匹配关键词与筛选条件
// Validates: Requirements 1.2, 7.1, 7.2
func TestSearchProperty1_ResultsMatchKeywordAndFilters(t *testing.T) {
	repo := testRepo(t)
	defer repo.Close()

	// Keywords that will match seed data (上联N, 下联N, 作者N)
	keywords := []string{"上联", "下联", "作者", "5", "6", "7", "8", "9"}
	dynasties := []string{"", "宋", "元", "明", "清"}
	occasions := []string{"", "春联", "寿联", "挽联", "题赠"}
	books := []string{"", "楹联丛话", "楹联续话", "巧对录", "楹联三话"}

	rng := rand.New(rand.NewSource(42))

	for i := 0; i < 100; i++ {
		keyword := keywords[rng.Intn(len(keywords))]
		dynasty := dynasties[rng.Intn(len(dynasties))]
		occasion := occasions[rng.Intn(len(occasions))]
		book := books[rng.Intn(len(books))]

		filter := CoupletFilter{
			Keyword:  keyword,
			Dynasty:  dynasty,
			Occasion: occasion,
			BookName: book,
			Page:     1,
			PageSize: 50,
		}

		couplets, _, err := repo.SearchCouplets(filter)
		if err != nil {
			t.Fatalf("iteration %d: SearchCouplets(%+v) error: %v", i, filter, err)
		}

		for _, c := range couplets {
			// (a) At least one of first/second/author contains the keyword
			containsKeyword := strings.Contains(c.First, keyword) ||
				strings.Contains(c.Second, keyword) ||
				strings.Contains(c.Author, keyword)
			if !containsKeyword {
				t.Errorf("iteration %d: couplet %d does not contain keyword %q (first=%q, second=%q, author=%q)",
					i, c.ID, keyword, c.First, c.Second, c.Author)
			}

			// (b) Filter conditions match
			if dynasty != "" && c.Dynasty != dynasty {
				t.Errorf("iteration %d: couplet %d dynasty=%q, want %q", i, c.ID, c.Dynasty, dynasty)
			}
			if occasion != "" && c.Occasion != occasion {
				t.Errorf("iteration %d: couplet %d occasion=%q, want %q", i, c.ID, c.Occasion, occasion)
			}
			if book != "" && c.BookName != book {
				t.Errorf("iteration %d: couplet %d book_name=%q, want %q", i, c.ID, c.BookName, book)
			}
		}
	}
}

// Feature: couplet-search, Property 2: 搜索结果置信度不变量
// Validates: Requirements 1.3
func TestSearchProperty2_ConfidenceInvariant(t *testing.T) {
	repo := testRepo(t)
	defer repo.Close()

	keywords := []string{"上联", "下联", "作者", "5", "6", "7", "8", "9", "1"}
	dynasties := []string{"", "宋", "元", "明", "清"}
	occasions := []string{"", "春联", "寿联", "挽联", "题赠"}
	books := []string{"", "楹联丛话", "楹联续话", "巧对录", "楹联三话"}

	rng := rand.New(rand.NewSource(99))

	for i := 0; i < 100; i++ {
		filter := CoupletFilter{
			Keyword:  keywords[rng.Intn(len(keywords))],
			Dynasty:  dynasties[rng.Intn(len(dynasties))],
			Occasion: occasions[rng.Intn(len(occasions))],
			BookName: books[rng.Intn(len(books))],
			Page:     1,
			PageSize: 50,
		}

		couplets, _, err := repo.SearchCouplets(filter)
		if err != nil {
			t.Fatalf("iteration %d: SearchCouplets(%+v) error: %v", i, filter, err)
		}

		for _, c := range couplets {
			if c.Confidence < 0.5 {
				t.Errorf("iteration %d: couplet %d has confidence %f < 0.5", i, c.ID, c.Confidence)
			}
		}
	}
}

// Feature: couplet-search, Property 3: 搜索响应格式完整性
// Validates: Requirements 1.4, 2.4
func TestSearchProperty3_ResponseFormatCompleteness(t *testing.T) {
	r := testRepo(t)
	defer r.Close()

	oldRepo := repo
	repo = r
	defer func() { repo = oldRepo }()

	router := mux.NewRouter()
	router.HandleFunc("/api/v2/couplets/search", searchCouplets).Methods("GET")

	// Seed-data keywords that will produce matches (1-50 chars)
	keywords := []string{"上联", "下联", "作者", "5", "6", "7", "8", "9", "上联1", "下联2"}

	rng := rand.New(rand.NewSource(42))

	for i := 0; i < 100; i++ {
		keyword := keywords[rng.Intn(len(keywords))]

		url := fmt.Sprintf("/api/v2/couplets/search?keyword=%s&page=%d&page_size=%d",
			url.QueryEscape(keyword), rng.Intn(3)+1, rng.Intn(50)+1)
		req := httptest.NewRequest("GET", url, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("iteration %d: status=%d, want 200 for keyword=%q", i, w.Code, keyword)
		}

		var resp CoupletListResponse
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("iteration %d: decode error: %v", i, err)
		}

		// Verify all required fields are present and valid
		if resp.Data == nil {
			t.Errorf("iteration %d: data field is nil", i)
		}
		if resp.Page < 1 {
			t.Errorf("iteration %d: page=%d, want >= 1", i, resp.Page)
		}
		if resp.PageSize < 1 {
			t.Errorf("iteration %d: page_size=%d, want >= 1", i, resp.PageSize)
		}
		if resp.Total < len(resp.Data) {
			t.Errorf("iteration %d: total=%d < len(data)=%d", i, resp.Total, len(resp.Data))
		}
	}
}

// Feature: couplet-search, Property 4: 超长关键词拒绝
// Validates: Requirements 1.6
func TestSearchProperty4_LongKeywordRejected(t *testing.T) {
	r := testRepo(t)
	defer r.Close()

	oldRepo := repo
	repo = r
	defer func() { repo = oldRepo }()

	router := mux.NewRouter()
	router.HandleFunc("/api/v2/couplets/search", searchCouplets).Methods("GET")

	rng := rand.New(rand.NewSource(42))
	baseChars := []rune("春夏秋冬风花雪月山水云天日星河海")

	for i := 0; i < 100; i++ {
		// Generate a keyword with length > 50 runes (51 to 200)
		length := 51 + rng.Intn(150)
		var sb strings.Builder
		for j := 0; j < length; j++ {
			sb.WriteRune(baseChars[rng.Intn(len(baseChars))])
		}
		keyword := sb.String()

		if utf8.RuneCountInString(keyword) <= 50 {
			t.Fatalf("iteration %d: generated keyword too short: %d runes", i, utf8.RuneCountInString(keyword))
		}

		url := fmt.Sprintf("/api/v2/couplets/search?keyword=%s", url.QueryEscape(keyword))
		req := httptest.NewRequest("GET", url, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("iteration %d: status=%d, want 400 for keyword length=%d",
				i, w.Code, utf8.RuneCountInString(keyword))
		}
	}
}

// Feature: couplet-search, Property 5: SQL 注入安全性
// Validates: Requirements 1.7
func TestSearchProperty5_SQLInjectionSafety(t *testing.T) {
	r := testRepo(t)
	defer r.Close()

	oldRepo := repo
	repo = r
	defer func() { repo = oldRepo }()

	router := mux.NewRouter()
	router.HandleFunc("/api/v2/couplets/search", searchCouplets).Methods("GET")

	// SQL injection patterns mixed with normal text
	injectionPatterns := []string{
		"'", "\"", ";", "--", "OR 1=1",
		"' OR '1'='1", "'; DROP TABLE couplets;--",
		"\" OR \"\"=\"", "1; SELECT * FROM couplets",
		"上联' OR 1=1--", "作者\"; DROP TABLE--",
		"' UNION SELECT * FROM couplets--",
		"下联'; DELETE FROM couplets;--",
	}

	rng := rand.New(rand.NewSource(42))

	for i := 0; i < 100; i++ {
		keyword := injectionPatterns[rng.Intn(len(injectionPatterns))]

		// Truncate to 50 runes to avoid triggering the length check
		runes := []rune(keyword)
		if len(runes) > 50 {
			runes = runes[:50]
		}
		keyword = string(runes)

		reqURL := "/api/v2/couplets/search?keyword=" + url.QueryEscape(keyword)
		req := httptest.NewRequest("GET", reqURL, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Should never return 500 (internal server error)
		if w.Code == http.StatusInternalServerError {
			t.Errorf("iteration %d: got 500 for SQL injection keyword=%q", i, keyword)
		}
		// Should be either 200 (normal results) or 400 (validation error)
		if w.Code != http.StatusOK && w.Code != http.StatusBadRequest {
			t.Errorf("iteration %d: status=%d, want 200 or 400 for keyword=%q", i, w.Code, keyword)
		}
	}
}

// Feature: couplet-search, Property 6: 分页参数默认值
// Validates: Requirements 2.2, 2.3
func TestSearchProperty6_PaginationDefaults(t *testing.T) {
	r := testRepo(t)
	defer r.Close()

	oldRepo := repo
	repo = r
	defer func() { repo = oldRepo }()

	router := mux.NewRouter()
	router.HandleFunc("/api/v2/couplets/search", searchCouplets).Methods("GET")

	rng := rand.New(rand.NewSource(42))

	for i := 0; i < 100; i++ {
		// Generate invalid page values: negative or zero
		page := -(rng.Intn(100))     // range [-99, 0]
		pageSize := rng.Intn(200) - 50 // range [-50, 149], many will be invalid

		url := fmt.Sprintf("/api/v2/couplets/search?keyword=上联&page=%d&page_size=%d", page, pageSize)
		req := httptest.NewRequest("GET", url, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("iteration %d: status=%d, want 200", i, w.Code)
		}

		var resp CoupletListResponse
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("iteration %d: decode error: %v", i, err)
		}

		// page < 1 should be corrected to 1
		if page < 1 && resp.Page != 1 {
			t.Errorf("iteration %d: page=%d (input=%d), want 1", i, resp.Page, page)
		}

		// page_size <= 0 or > 50 should be corrected to 20
		if (pageSize <= 0 || pageSize > 50) && resp.PageSize != 20 {
			t.Errorf("iteration %d: page_size=%d (input=%d), want 20", i, resp.PageSize, pageSize)
		}

		// Valid page_size (1-50) should be preserved
		if pageSize > 0 && pageSize <= 50 && resp.PageSize != pageSize {
			t.Errorf("iteration %d: page_size=%d (input=%d), want %d", i, resp.PageSize, pageSize, pageSize)
		}
	}
}
