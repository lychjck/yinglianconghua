package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gorilla/mux"
	_ "modernc.org/sqlite"
)

// testRepo creates an in-memory SQLite repository seeded with realistic test data.
func testRepo(t *testing.T) *SQLiteRepository {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	if err := initSQLiteTables(db); err != nil {
		t.Fatal(err)
	}
	seedTestData(t, db)
	return &SQLiteRepository{db: db}
}

func seedTestData(t *testing.T, db *sql.DB) {
	t.Helper()

	// Insert paragraphs
	for i := 1; i <= 5; i++ {
		_, err := db.Exec(
			"INSERT INTO paragraphs (id, book_name, volume, title, content) VALUES (?, ?, ?, ?, ?)",
			i, fmt.Sprintf("书名%d", i), fmt.Sprintf("卷%d", i),
			fmt.Sprintf("标题%d", i), fmt.Sprintf("内容%d", i),
		)
		if err != nil {
			t.Fatal(err)
		}
	}

	// Insert couplets with varying confidence, dynasty, occasion, book_name
	dynasties := []string{"宋", "元", "明", "清", ""}
	occasions := []string{"春联", "寿联", "挽联", "题赠", ""}
	books := []string{"楹联丛话", "楹联续话", "巧对录", "楹联三话", ""}

	for i := 1; i <= 100; i++ {
		dynasty := dynasties[i%len(dynasties)]
		occasion := occasions[i%len(occasions)]
		book := books[i%len(books)]
		confidence := float64(i) / 100.0 // 0.01 to 1.0
		var paragraphID *int
		if i%3 == 0 {
			pid := (i % 5) + 1
			paragraphID = &pid
		}

		_, err := db.Exec(
			`INSERT INTO couplets (id, first, second, author, dynasty, occasion, location, note, paragraph_id, book_name, volume, confidence)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			i,
			fmt.Sprintf("上联%d", i), fmt.Sprintf("下联%d", i),
			fmt.Sprintf("作者%d", i), dynasty, occasion,
			"", fmt.Sprintf("注释%d", i),
			paragraphID, book, fmt.Sprintf("卷%d", i%5),
			confidence,
		)
		if err != nil {
			t.Fatal(err)
		}
	}
}

// --- Property 1: 数据非空不变量 ---
// couplets 表中 first 和 second 非空
func TestProperty1_DataNonEmpty(t *testing.T) {
	repo := testRepo(t)
	defer repo.Close()

	rows, err := repo.db.Query("SELECT id, first, second FROM couplets")
	if err != nil {
		t.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var first, second string
		if err := rows.Scan(&id, &first, &second); err != nil {
			t.Fatal(err)
		}
		if first == "" {
			t.Errorf("couplet %d: first is empty", id)
		}
		if second == "" {
			t.Errorf("couplet %d: second is empty", id)
		}
	}
}

// --- Property 2: 置信度范围不变量 ---
// confidence 在 [0, 1] 范围内
func TestProperty2_ConfidenceRange(t *testing.T) {
	repo := testRepo(t)
	defer repo.Close()

	rows, err := repo.db.Query("SELECT id, confidence FROM couplets")
	if err != nil {
		t.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var confidence float64
		if err := rows.Scan(&id, &confidence); err != nil {
			t.Fatal(err)
		}
		if confidence < 0 || confidence > 1 {
			t.Errorf("couplet %d: confidence %f out of [0, 1]", id, confidence)
		}
	}
}

// --- Property 3: API 置信度过滤 ---
// GetRandomCoupletV2 和 ListCouplets 返回的记录 confidence >= 0.5
func TestProperty3_APIConfidenceFilter_Random(t *testing.T) {
	repo := testRepo(t)
	defer repo.Close()

	for i := 0; i < 50; i++ {
		c, err := repo.GetRandomCoupletV2()
		if err != nil {
			t.Fatal(err)
		}
		if c.Confidence < 0.5 {
			t.Errorf("GetRandomCoupletV2 returned confidence %f < 0.5 (id=%d)", c.Confidence, c.ID)
		}
	}
}

func TestProperty3_APIConfidenceFilter_List(t *testing.T) {
	repo := testRepo(t)
	defer repo.Close()

	// Test with various filter combinations
	filters := []CoupletFilter{
		{Page: 1, PageSize: 50},
		{Dynasty: "清", Page: 1, PageSize: 50},
		{Occasion: "春联", Page: 1, PageSize: 50},
		{BookName: "楹联丛话", Page: 1, PageSize: 50},
	}

	for _, f := range filters {
		couplets, _, err := repo.ListCouplets(f)
		if err != nil {
			t.Fatal(err)
		}
		for _, c := range couplets {
			if c.Confidence < 0.5 {
				t.Errorf("ListCouplets(filter=%+v) returned confidence %f < 0.5 (id=%d)", f, c.Confidence, c.ID)
			}
		}
	}
}

// --- Property 6: 筛选准确性 ---
// ListCouplets 返回的记录均满足筛选条件
func TestProperty6_FilterAccuracy(t *testing.T) {
	repo := testRepo(t)
	defer repo.Close()

	// Generate random filter combinations
	dynasties := []string{"宋", "元", "明", "清"}
	occasions := []string{"春联", "寿联", "挽联", "题赠"}
	books := []string{"楹联丛话", "楹联续话", "巧对录", "楹联三话"}

	rng := rand.New(rand.NewSource(42))

	for i := 0; i < 30; i++ {
		filter := CoupletFilter{Page: 1, PageSize: 50}

		// Randomly enable each filter dimension
		if rng.Intn(2) == 0 {
			filter.Dynasty = dynasties[rng.Intn(len(dynasties))]
		}
		if rng.Intn(2) == 0 {
			filter.Occasion = occasions[rng.Intn(len(occasions))]
		}
		if rng.Intn(2) == 0 {
			filter.BookName = books[rng.Intn(len(books))]
		}

		couplets, _, err := repo.ListCouplets(filter)
		if err != nil {
			t.Fatal(err)
		}

		for _, c := range couplets {
			if filter.Dynasty != "" && c.Dynasty != filter.Dynasty {
				t.Errorf("filter dynasty=%q but got %q (id=%d)", filter.Dynasty, c.Dynasty, c.ID)
			}
			if filter.Occasion != "" && c.Occasion != filter.Occasion {
				t.Errorf("filter occasion=%q but got %q (id=%d)", filter.Occasion, c.Occasion, c.ID)
			}
			if filter.BookName != "" && c.BookName != filter.BookName {
				t.Errorf("filter book_name=%q but got %q (id=%d)", filter.BookName, c.BookName, c.ID)
			}
		}
	}
}

// --- Property 7: 分页正确性 ---
// 返回记录数 <= page_size，total >= 返回数量
func TestProperty7_PaginationCorrectness(t *testing.T) {
	repo := testRepo(t)
	defer repo.Close()

	rng := rand.New(rand.NewSource(42))

	for i := 0; i < 20; i++ {
		pageSize := rng.Intn(55) - 2 // range [-2, 52] to test edge cases
		page := rng.Intn(10)          // range [0, 9] to test page < 1

		filter := CoupletFilter{Page: page, PageSize: pageSize}
		couplets, total, err := repo.ListCouplets(filter)
		if err != nil {
			t.Fatal(err)
		}

		// Effective page_size: if <= 0 or > 50, defaults to 20
		effectivePageSize := pageSize
		if effectivePageSize <= 0 || effectivePageSize > 50 {
			effectivePageSize = 20
		}

		if len(couplets) > effectivePageSize {
			t.Errorf("page=%d pageSize=%d: got %d records, expected <= %d",
				page, pageSize, len(couplets), effectivePageSize)
		}
		if total < len(couplets) {
			t.Errorf("page=%d pageSize=%d: total=%d < len(data)=%d",
				page, pageSize, total, len(couplets))
		}
	}
}

// --- Property 8: 去重值唯一性 ---
// GetDistinct* 返回无重复值
func TestProperty8_DistinctUniqueness(t *testing.T) {
	repo := testRepo(t)
	defer repo.Close()

	testCases := []struct {
		name string
		fn   func() ([]string, error)
	}{
		{"Dynasties", repo.GetDistinctDynasties},
		{"Occasions", repo.GetDistinctOccasions},
		{"Books", repo.GetDistinctBooks},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			values, err := tc.fn()
			if err != nil {
				t.Fatal(err)
			}

			seen := make(map[string]bool)
			for _, v := range values {
				if v == "" {
					t.Errorf("%s: returned empty string", tc.name)
				}
				if seen[v] {
					t.Errorf("%s: duplicate value %q", tc.name, v)
				}
				seen[v] = true
			}
		})
	}
}

// --- Property 9: GetCoupletByID 一致性 ---
// 返回记录的 ID 等于请求 ID
func TestProperty9_GetByIDConsistency(t *testing.T) {
	repo := testRepo(t)
	defer repo.Close()

	// Test all 100 seeded IDs
	for id := 1; id <= 100; id++ {
		c, err := repo.GetCoupletByID(id)
		if err != nil {
			t.Fatalf("GetCoupletByID(%d): %v", id, err)
		}
		if c.ID != id {
			t.Errorf("GetCoupletByID(%d): returned ID=%d", id, c.ID)
		}
	}

	// Non-existent ID should return error
	_, err := repo.GetCoupletByID(9999)
	if err == nil {
		t.Error("GetCoupletByID(9999): expected error for non-existent ID")
	}
}

// --- Property 4: 外键一致性 ---
// GetCoupletByID 返回的 paragraph_id 对应的 paragraph 存在
func TestProperty4_ForeignKeyConsistency(t *testing.T) {
	repo := testRepo(t)
	defer repo.Close()

	// Check every couplet with a non-null paragraph_id
	for id := 1; id <= 100; id++ {
		c, err := repo.GetCoupletByID(id)
		if err != nil {
			t.Fatalf("GetCoupletByID(%d): %v", id, err)
		}
		if c.ParagraphID != nil {
			p, err := repo.GetParagraphByID(*c.ParagraphID)
			if err != nil {
				t.Errorf("couplet %d: paragraph_id=%d but GetParagraphByID returned error: %v", id, *c.ParagraphID, err)
				continue
			}
			if p.ID != *c.ParagraphID {
				t.Errorf("couplet %d: paragraph_id=%d but paragraph.ID=%d", id, *c.ParagraphID, p.ID)
			}
		}
	}
}

// Property 4 via API handler: getCoupletByID returns a valid paragraph when paragraph_id is set
func TestProperty4_ForeignKeyConsistency_API(t *testing.T) {
	r := testRepo(t)
	defer r.Close()

	// Set the global repo so handlers can use it
	oldRepo := repo
	repo = r
	defer func() { repo = oldRepo }()

	router := mux.NewRouter()
	router.HandleFunc("/api/v2/couplets/{id}", getCoupletByID).Methods("GET")

	// Test couplets that have paragraph_id (every 3rd one in seed data)
	for id := 3; id <= 100; id += 3 {
		req := httptest.NewRequest("GET", fmt.Sprintf("/api/v2/couplets/%d", id), nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("GET /api/v2/couplets/%d: status=%d, want 200", id, w.Code)
			continue
		}

		var resp CoupletDetailResponse
		if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
			t.Fatalf("decode response for couplet %d: %v", id, err)
		}

		if resp.Couplet.ParagraphID != nil && resp.Paragraph == nil {
			t.Errorf("couplet %d: paragraph_id=%d but response.paragraph is nil", id, *resp.Couplet.ParagraphID)
		}
		if resp.Paragraph != nil && resp.Couplet.ParagraphID != nil && resp.Paragraph.ID != *resp.Couplet.ParagraphID {
			t.Errorf("couplet %d: paragraph_id=%d but paragraph.id=%d", id, *resp.Couplet.ParagraphID, resp.Paragraph.ID)
		}
	}
}

// --- Additional: verify distinct values exist in the database ---
func TestProperty8_DistinctValuesExistInDB(t *testing.T) {
	repo := testRepo(t)
	defer repo.Close()

	// Each distinct dynasty should exist in at least one couplet
	dynasties, err := repo.GetDistinctDynasties()
	if err != nil {
		t.Fatal(err)
	}
	for _, d := range dynasties {
		var count int
		err := repo.db.QueryRow("SELECT COUNT(*) FROM couplets WHERE dynasty = ? AND confidence >= 0.5", d).Scan(&count)
		if err != nil {
			t.Fatal(err)
		}
		if count == 0 {
			t.Errorf("dynasty %q returned by GetDistinctDynasties but no matching couplets with confidence >= 0.5", d)
		}
	}

	// Same for occasions
	occasions, err := repo.GetDistinctOccasions()
	if err != nil {
		t.Fatal(err)
	}
	for _, o := range occasions {
		var count int
		err := repo.db.QueryRow("SELECT COUNT(*) FROM couplets WHERE occasion = ? AND confidence >= 0.5", o).Scan(&count)
		if err != nil {
			t.Fatal(err)
		}
		if count == 0 {
			t.Errorf("occasion %q returned by GetDistinctOccasions but no matching couplets with confidence >= 0.5", o)
		}
	}

	// Same for books
	books, err := repo.GetDistinctBooks()
	if err != nil {
		t.Fatal(err)
	}
	for _, b := range books {
		var count int
		err := repo.db.QueryRow("SELECT COUNT(*) FROM couplets WHERE book_name = ? AND confidence >= 0.5", b).Scan(&count)
		if err != nil {
			t.Fatal(err)
		}
		if count == 0 {
			t.Errorf("book %q returned by GetDistinctBooks but no matching couplets with confidence >= 0.5", b)
		}
	}
}

func TestMain(m *testing.M) {
	os.Exit(m.Run())
}
