package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

type MySQLRepository struct {
	db *sql.DB
}

func NewMySQLRepository(user, pass, host, dbName string) (*MySQLRepository, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s)/%s?parseTime=true&loc=Local&charset=utf8mb4", user, pass, host, dbName)
	log.Printf("[Database] Connecting to MySQL: %s@%s/%s", user, host, dbName)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("mysql connection failed: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("mysql ping failed: %w", err)
	}
	log.Println("[Database] MySQL connected successfully")
	return &MySQLRepository{db: db}, nil
}

func (r *MySQLRepository) GetAllCouplets() ([]Couplet, error) {
	rows, err := r.db.Query("SELECT id, first, second, author, source, ref, created, updated_at FROM yinglian")
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

func (r *MySQLRepository) GetRandomCouplet() (*Couplet, error) {
	var c Couplet
	err := r.db.QueryRow("SELECT id, first, second, author, source, ref, created, updated_at FROM yinglian ORDER BY RAND() LIMIT 1").
		Scan(&c.ID, &c.First, &c.Second, &c.Author, &c.Source, &c.Ref, &c.Created, &c.Updated)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *MySQLRepository) GetContentByRef(ref string) (*YinglianContent, error) {
	var content YinglianContent
	err := r.db.QueryRow("SELECT id, book_name, volume, title, content, created_at, updated_at FROM yinglian_content WHERE id = ?", ref).
		Scan(&content.ID, &content.BookName, &content.Volume, &content.Title, &content.Content, &content.CreatedAt, &content.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &content, nil
}

func (r *MySQLRepository) InsertCouplet(first, second, author, dynasty string) error {
	_, err := r.db.Exec("INSERT INTO couplets (first, second, author, dynasty) VALUES (?, ?, ?, ?)", first, second, author, dynasty)
	return err
}

func (r *MySQLRepository) Close() error {
	return r.db.Close()
}
