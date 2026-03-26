package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

type SQLiteRepository struct {
	db *sql.DB
}

func NewSQLiteRepository(dbPath string) (*SQLiteRepository, error) {
	log.Printf("[Database] Opening SQLite: %s", dbPath)

	db, err := sql.Open("sqlite3", dbPath+"?_journal_mode=WAL")
	if err != nil {
		return nil, fmt.Errorf("sqlite open failed: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("sqlite ping failed: %w", err)
	}

	// 如果是新数据库，自动建表
	if err := initSQLiteTables(db); err != nil {
		return nil, fmt.Errorf("sqlite init tables failed: %w", err)
	}

	log.Println("[Database] SQLite connected successfully")
	return &SQLiteRepository{db: db}, nil
}

func initSQLiteTables(db *sql.DB) error {
	schema := `
	CREATE TABLE IF NOT EXISTS yinglian (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		first TEXT NOT NULL,
		second TEXT NOT NULL,
		author TEXT DEFAULT '',
		source TEXT DEFAULT '',
		ref INTEGER DEFAULT 0,
		created DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS yinglian_content (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		book_name TEXT NOT NULL,
		volume TEXT NOT NULL,
		title TEXT NOT NULL,
		content TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS couplets (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		first TEXT NOT NULL,
		second TEXT NOT NULL,
		author TEXT DEFAULT '',
		dynasty TEXT DEFAULT '',
		created DATETIME DEFAULT CURRENT_TIMESTAMP
	);`
	_, err := db.Exec(schema)
	return err
}

func (r *SQLiteRepository) GetAllCouplets() ([]Couplet, error) {
	rows, err := r.db.Query("SELECT id, first, second, COALESCE(author, ''), COALESCE(source, ''), COALESCE(ref, 0), created, updated_at FROM yinglian")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var couplets []Couplet
	for rows.Next() {
		var c Couplet
		if err := rows.Scan(&c.ID, &c.First, &c.Second, &c.Author, &c.Source, &c.Ref, &c.Created, &c.Updated); err != nil {
			return nil, err
		}
		couplets = append(couplets, c)
	}
	return couplets, rows.Err()
}

func (r *SQLiteRepository) GetRandomCouplet() (*Couplet, error) {
	var c Couplet
	err := r.db.QueryRow("SELECT id, first, second, COALESCE(author, ''), COALESCE(source, ''), COALESCE(ref, 0), created, updated_at FROM yinglian ORDER BY RANDOM() LIMIT 1").
		Scan(&c.ID, &c.First, &c.Second, &c.Author, &c.Source, &c.Ref, &c.Created, &c.Updated)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *SQLiteRepository) GetContentByRef(ref string) (*YinglianContent, error) {
	var content YinglianContent
	err := r.db.QueryRow("SELECT id, book_name, volume, title, content, created_at, updated_at FROM yinglian_content WHERE id = ?", ref).
		Scan(&content.ID, &content.BookName, &content.Volume, &content.Title, &content.Content, &content.CreatedAt, &content.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &content, nil
}

func (r *SQLiteRepository) InsertCouplet(first, second, author, dynasty string) error {
	_, err := r.db.Exec("INSERT INTO couplets (first, second, author, dynasty) VALUES (?, ?, ?, ?)", first, second, author, dynasty)
	return err
}

func (r *SQLiteRepository) Close() error {
	return r.db.Close()
}

// ImportFromMySQL 从 MySQL 数据库导入数据到 SQLite（迁移工具）
func (r *SQLiteRepository) ImportFromMySQL(mysqlRepo *MySQLRepository) error {
	log.Println("[Migration] Starting MySQL -> SQLite migration...")

	couplets, err := mysqlRepo.GetAllCouplets()
	if err != nil {
		return fmt.Errorf("failed to read couplets from mysql: %w", err)
	}

	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare("INSERT OR IGNORE INTO yinglian (id, first, second, author, source, ref, created, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, c := range couplets {
		if _, err := stmt.Exec(c.ID, c.First, c.Second, c.Author, c.Source, c.Ref, c.Created, c.Updated); err != nil {
			log.Printf("[Migration] Warning: failed to insert couplet %d: %v", c.ID, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	log.Printf("[Migration] Imported %d couplets successfully", len(couplets))
	return nil
}
