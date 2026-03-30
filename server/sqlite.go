package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "modernc.org/sqlite"
)

type SQLiteRepository struct {
	db *sql.DB
}

func NewSQLiteRepository(dbPath string) (*SQLiteRepository, error) {
	log.Printf("[Database] Opening SQLite: %s", dbPath)

	db, err := sql.Open("sqlite", dbPath+"?_pragma=journal_mode(WAL)")
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
	-- 旧表：保留向后兼容
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

	-- 新表：LLM 提取的原文段落
	CREATE TABLE IF NOT EXISTS paragraphs (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		book_name TEXT NOT NULL,
		volume TEXT NOT NULL,
		title TEXT NOT NULL,
		content TEXT NOT NULL,
		file_path TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	-- 新表：LLM 提取的对联（含丰富元数据）
	CREATE TABLE IF NOT EXISTS couplets (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		first TEXT NOT NULL,
		second TEXT NOT NULL,
		author TEXT DEFAULT '',
		dynasty TEXT DEFAULT '',
		occasion TEXT DEFAULT '',
		location TEXT DEFAULT '',
		note TEXT DEFAULT '',
		paragraph_id INTEGER,
		book_name TEXT DEFAULT '',
		volume TEXT DEFAULT '',
		confidence REAL DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (paragraph_id) REFERENCES paragraphs(id)
	);

	-- 查询优化索引
	CREATE INDEX IF NOT EXISTS idx_couplets_dynasty ON couplets(dynasty);
	CREATE INDEX IF NOT EXISTS idx_couplets_occasion ON couplets(occasion);
	CREATE INDEX IF NOT EXISTS idx_couplets_book_name ON couplets(book_name);
	CREATE INDEX IF NOT EXISTS idx_couplets_confidence ON couplets(confidence);
	CREATE INDEX IF NOT EXISTS idx_couplets_paragraph_id ON couplets(paragraph_id);`

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

// --- v2 接口实现 ---

const coupletV2Columns = `id, first, second,
	COALESCE(author,''), COALESCE(dynasty,''),
	COALESCE(occasion,''), COALESCE(location,''),
	COALESCE(note,''), paragraph_id,
	COALESCE(book_name,''), COALESCE(volume,''),
	COALESCE(confidence, 0)`

func scanCoupletV2(scanner interface{ Scan(dest ...any) error }) (*CoupletV2, error) {
	var c CoupletV2
	err := scanner.Scan(
		&c.ID, &c.First, &c.Second,
		&c.Author, &c.Dynasty, &c.Occasion, &c.Location,
		&c.Note, &c.ParagraphID,
		&c.BookName, &c.Volume, &c.Confidence,
	)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *SQLiteRepository) GetRandomCoupletV2() (*CoupletV2, error) {
	row := r.db.QueryRow(fmt.Sprintf(
		"SELECT %s FROM couplets WHERE confidence >= 0.5 ORDER BY RANDOM() LIMIT 1",
		coupletV2Columns,
	))
	return scanCoupletV2(row)
}

func (r *SQLiteRepository) GetCoupletByID(id int) (*CoupletV2, error) {
	row := r.db.QueryRow(fmt.Sprintf(
		"SELECT %s FROM couplets WHERE id = ?", coupletV2Columns,
	), id)
	return scanCoupletV2(row)
}

func (r *SQLiteRepository) ListCouplets(filter CoupletFilter) ([]CoupletV2, int, error) {
	where := "WHERE confidence >= 0.5"
	args := []interface{}{}

	if filter.Dynasty != "" {
		where += " AND dynasty = ?"
		args = append(args, filter.Dynasty)
	}
	if filter.Occasion != "" {
		where += " AND occasion = ?"
		args = append(args, filter.Occasion)
	}
	if filter.BookName != "" {
		where += " AND book_name = ?"
		args = append(args, filter.BookName)
	}

	// 查询总数
	var total int
	if err := r.db.QueryRow("SELECT COUNT(*) FROM couplets "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// 分页参数
	pageSize := filter.PageSize
	if pageSize <= 0 || pageSize > 50 {
		pageSize = 20
	}
	offset := (filter.Page - 1) * pageSize
	if offset < 0 {
		offset = 0
	}

	queryArgs := append(args, pageSize, offset)
	rows, err := r.db.Query(fmt.Sprintf(
		"SELECT %s FROM couplets %s ORDER BY id ASC LIMIT ? OFFSET ?",
		coupletV2Columns, where,
	), queryArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var couplets []CoupletV2
	for rows.Next() {
		c, err := scanCoupletV2(rows)
		if err != nil {
			return nil, 0, err
		}
		couplets = append(couplets, *c)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return couplets, total, nil
}

func (r *SQLiteRepository) SearchCouplets(filter CoupletFilter) ([]CoupletV2, int, error) {
	where := "WHERE (first LIKE '%' || ? || '%' OR second LIKE '%' || ? || '%' OR author LIKE '%' || ? || '%') AND confidence >= 0.5"
	args := []interface{}{filter.Keyword, filter.Keyword, filter.Keyword}

	if filter.Dynasty != "" {
		where += " AND dynasty = ?"
		args = append(args, filter.Dynasty)
	}
	if filter.Occasion != "" {
		where += " AND occasion = ?"
		args = append(args, filter.Occasion)
	}
	if filter.BookName != "" {
		where += " AND book_name = ?"
		args = append(args, filter.BookName)
	}

	// 去重：按 first+second 分组，取 confidence 最高的记录
	// 使用子查询先找到每组最优 id，再用外层查询取完整字段
	dedup := fmt.Sprintf(
		`SELECT MIN(id) FROM couplets %s GROUP BY first, second`,
		where,
	)

	// 查询去重后总数
	var total int
	countSQL := fmt.Sprintf("SELECT COUNT(*) FROM (%s)", dedup)
	if err := r.db.QueryRow(countSQL, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// 分页参数
	pageSize := filter.PageSize
	if pageSize <= 0 || pageSize > 50 {
		pageSize = 20
	}
	offset := (filter.Page - 1) * pageSize
	if offset < 0 {
		offset = 0
	}

	// 用 IN 子查询取去重后的完整记录
	querySQL := fmt.Sprintf(
		"SELECT %s FROM couplets WHERE id IN (SELECT MIN(id) FROM couplets %s GROUP BY first, second) ORDER BY id ASC LIMIT ? OFFSET ?",
		coupletV2Columns, where,
	)
	queryArgs := append(args, pageSize, offset)
	rows, err := r.db.Query(querySQL, queryArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var couplets []CoupletV2
	for rows.Next() {
		c, err := scanCoupletV2(rows)
		if err != nil {
			return nil, 0, err
		}
		couplets = append(couplets, *c)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return couplets, total, nil
}

func (r *SQLiteRepository) GetParagraphByID(id int) (*Paragraph, error) {
	var p Paragraph
	err := r.db.QueryRow(
		"SELECT id, book_name, volume, title, content FROM paragraphs WHERE id = ?", id,
	).Scan(&p.ID, &p.BookName, &p.Volume, &p.Title, &p.Content)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *SQLiteRepository) GetDistinctDynasties() ([]string, error) {
	return r.getDistinctValues("dynasty")
}

func (r *SQLiteRepository) GetDistinctOccasions() ([]string, error) {
	return r.getDistinctValues("occasion")
}

func (r *SQLiteRepository) GetDistinctBooks() ([]string, error) {
	return r.getDistinctValues("book_name")
}

func (r *SQLiteRepository) getDistinctValues(column string) ([]string, error) {
	rows, err := r.db.Query(fmt.Sprintf(
		"SELECT DISTINCT %s FROM couplets WHERE %s != '' AND confidence >= 0.5 ORDER BY %s",
		column, column, column,
	))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var values []string
	for rows.Next() {
		var v string
		if err := rows.Scan(&v); err != nil {
			return nil, err
		}
		values = append(values, v)
	}
	return values, rows.Err()
}
