package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

type Couplet struct {
	ID      int            `json:"id"`
	First   string         `json:"first"`
	Second  string         `json:"second"`
	Author  sql.NullString `json:"author"`
	Source  sql.NullString `json:"source"`
	Ref     int            `json:"ref"`
	Created sql.NullTime   `json:"created"`
	Updated sql.NullTime   `json:"updated_at"`
}

type YinglianContent struct {
	ID        int64        `json:"id"`
	BookName  string       `json:"book_name"`
	Volume    string       `json:"volume"`
	Title     string       `json:"title"`
	Content   string       `json:"content"`
	CreatedAt sql.NullTime `json:"created_at"`
	UpdatedAt sql.NullTime `json:"updated_at"`
}

var repo Repository

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[CORS] %s %s", r.Method, r.URL.Path)
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// initRepository 根据环境变量创建对应的数据库实现
func initRepository() (Repository, error) {
	dbDriver := os.Getenv("DB_DRIVER")
	if dbDriver == "" {
		dbDriver = "sqlite" // 默认使用 SQLite
	}

	switch dbDriver {
	case "mysql":
		user := os.Getenv("DB_USER")
		pass := os.Getenv("DB_PASS")
		host := os.Getenv("DB_HOST")
		name := os.Getenv("DB_NAME")
		if host == "" {
			host = "localhost:3306"
		}
		if name == "" {
			name = "yinglian"
		}
		return NewMySQLRepository(user, pass, host, name)
	case "sqlite":
		path := os.Getenv("DB_PATH")
		if path == "" {
			path = "yinglian.db"
		}
		return NewSQLiteRepository(path)
	default:
		log.Fatalf("[Error] Unsupported DB_DRIVER: %s (use 'mysql' or 'sqlite')", dbDriver)
		return nil, nil
	}
}

func main() {
	log.SetFlags(log.Ldate | log.Ltime | log.Lmicroseconds | log.Lshortfile)
	log.Println("[Server] Starting application...")

	// 加载环境变量
	if err := godotenv.Load(); err != nil {
		log.Println("[Config] No .env file found, using system environment")
	}

	// 初始化数据库
	var err error
	repo, err = initRepository()
	if err != nil {
		log.Fatal("[Error] Database init failed: ", err)
	}
	defer repo.Close()

	// 检查分享图片所需资源
	checkShareAssets()

	// 创建路由
	r := mux.NewRouter()
	r.HandleFunc("/api/couplets", getCouplets).Methods("GET")
	r.HandleFunc("/api/couplets/random", getRandomCouplet).Methods("GET")
	r.HandleFunc("/api/couplets/content/{ref}", getContentByRef).Methods("GET")
	r.HandleFunc("/api/couplets/{id}/share.png", generateShareImage).Methods("GET")

	// v2 API 路由（LLM 提取数据）
	r.HandleFunc("/api/v2/couplets/random", getRandomCoupletV2).Methods("GET")
	r.HandleFunc("/api/v2/couplets/search", searchCouplets).Methods("GET")
	r.HandleFunc("/api/v2/couplets/{id}", getCoupletByID).Methods("GET")
	r.HandleFunc("/api/v2/couplets", listCouplets).Methods("GET")
	r.HandleFunc("/api/v2/paragraphs/{id}", getParagraphByID).Methods("GET")
	r.HandleFunc("/api/v2/filters", getFilterOptions).Methods("GET")

	// 静态文件（字体等）
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	// 启动服务器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	handler := enableCORS(r)
	log.Printf("[Server] Listening on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func getCouplets(w http.ResponseWriter, r *http.Request) {
	log.Printf("[API] %s %s - Getting all couplets", r.Method, r.URL.Path)
	couplets, err := repo.GetAllCouplets()
	if err != nil {
		log.Printf("[Error] Failed to query couplets: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(couplets)
}

func getRandomCouplet(w http.ResponseWriter, r *http.Request) {
	log.Printf("[API] %s %s - Getting random couplet", r.Method, r.URL.Path)
	c, err := repo.GetRandomCouplet()
	if err != nil {
		log.Printf("[Error] Failed to get random couplet: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	log.Printf("[Success] Retrieved random couplet ID: %d", c.ID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(c)
}

func getContentByRef(w http.ResponseWriter, r *http.Request) {
	log.Printf("[API] %s %s - Getting content by ref", r.Method, r.URL.Path)
	vars := mux.Vars(r)
	ref := vars["ref"]

	content, err := repo.GetContentByRef(ref)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("[Warning] No content found for ref: %s", ref)
			http.Error(w, "Content not found", http.StatusNotFound)
			return
		}
		log.Printf("[Error] Failed to get content by ref: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	log.Printf("[Success] Retrieved content for ref: %s", ref)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(content)
}
