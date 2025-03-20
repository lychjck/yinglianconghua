package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"

	_ "github.com/go-sql-driver/mysql"
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

var db *sql.DB

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[CORS] %s %s", r.Method, r.URL.Path)
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		// w.Header().Set("Access-Control-Allow-Origin", "http://10.33.202.222:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	// 设置日志格式
	log.SetFlags(log.Ldate | log.Ltime | log.Lmicroseconds | log.Lshortfile)
	log.Println("[Server] Starting application...")

	// 加载环境变量
	err := godotenv.Load()
	if err != nil {
		log.Fatal("[Error] Failed loading .env file: ", err)
	}
	log.Println("[Config] Environment variables loaded successfully")

	// 连接数据库
	dbName := "yinglian"
	dbHost := "localhost"
	dbUser := "root"
	dbPass := ""
	log.Printf("[Database] Connecting to MySQL database %s on %s", dbName, dbHost)
	db, err = sql.Open("mysql", dbUser+":"+dbPass+"@tcp("+dbHost+")/"+dbName+"?parseTime=true&loc=Local&charset=utf8mb4")
	if err != nil {
		log.Fatal("[Error] Database connection failed: ", err)
	}
	log.Println("[Database] Connected successfully")
	defer db.Close()

	// 创建路由
	r := mux.NewRouter()

	// API 路由
	r.HandleFunc("/api/couplets", getCouplets).Methods("GET")
	r.HandleFunc("/api/couplets/random", getRandomCouplet).Methods("GET")
	// r.HandleFunc("/api/couplets", createCouplet).Methods("POST")

	// 启动服务器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 添加CORS中间件
	handler := enableCORS(r)

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func getCouplets(w http.ResponseWriter, r *http.Request) {
	log.Printf("[API] %s %s - Getting all couplets", r.Method, r.URL.Path)
	rows, err := db.Query("SELECT id, first, second, author, source, ref, created,updated_at FROM yinglian")
	if err != nil {
		log.Printf("[Error] Failed to query couplets: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var couplets []Couplet
	for rows.Next() {
		var c Couplet
		err := rows.Scan(&c.ID, &c.First, &c.Second, &c.Author, &c.Source, &c.Ref, &c.Created, &c.Updated)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		couplets = append(couplets, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(couplets)
}

func getRandomCouplet(w http.ResponseWriter, r *http.Request) {
	log.Printf("[API] %s %s - Getting random couplet", r.Method, r.URL.Path)
	var c Couplet
	err := db.QueryRow("SELECT id, first, second, author, source, ref, created,updated_at from yinglian ORDER BY RAND() LIMIT 1").Scan(
		&c.ID, &c.First, &c.Second, &c.Author, &c.Source, &c.Ref, &c.Created, &c.Updated)
	if err != nil {
		log.Printf("[Error] Failed to get random couplet: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	log.Printf("[Success] Retrieved random couplet ID: %d", c.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(c)
}

// func createCouplet(w http.ResponseWriter, r *http.Request) {
// 	log.Printf("[API] %s %s - Creating new couplet", r.Method, r.URL.Path)
// 	var c Couplet
// 	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
// 		log.Printf("[Error] Failed to decode request body: %v", err)
// 		http.Error(w, err.Error(), http.StatusBadRequest)
// 		return
// 	}

// 	log.Printf("[Database] Inserting new couplet: {First: %s, Second: %s, Author: %s, Dynasty: %s}",
// 		c.First, c.Second, c.Author, c.Dynasty)
// 	result, err := db.Exec("INSERT INTO couplets (first, second, author, dynasty, created) VALUES (?, ?, ?, ?, NOW())",
// 		c.First, c.Second, c.Author, c.Dynasty)
// 	if err != nil {
// 		log.Printf("[Error] Failed to insert couplet: %v", err)
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}

// 	id, _ := result.LastInsertId()
// 	c.ID = int(id)

// 	w.Header().Set("Content-Type", "application/json")
// 	w.WriteHeader(http.StatusCreated)
// 	json.NewEncoder(w).Encode(c)
// }
