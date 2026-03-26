#!/bin/bash
# 将 couples.sql (MySQL dump) 转换为 SQLite 兼容的 SQL 文件
# 直接插入 yinglian 表（后端 API 读取此表）
# 用法: bash convert_to_sqlite.sh

INPUT="couples.sql"
OUTPUT="couples_sqlite.sql"

echo "-- SQLite 版对联数据（从 couples.sql 自动转换）" > "$OUTPUT"
echo "-- 生成时间: $(date)" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# 建表（SQLite 语法）
cat >> "$OUTPUT" << 'EOF'
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

BEGIN;
EOF

# 提取 INSERT 语句，去掉反引号，将表名 couplets 改为 yinglian，
# 将字段 (id, first, second, author, dynasty, created) 映射为 (id, first, second, author, source, created)
grep "^INSERT INTO" "$INPUT" \
  | sed 's/`//g' \
  | sed 's/INSERT INTO couplets (id, first, second, author, dynasty, created)/INSERT INTO yinglian (id, first, second, author, source, created)/g' \
  >> "$OUTPUT"

echo "COMMIT;" >> "$OUTPUT"

echo "转换完成: $OUTPUT"
echo "导入命令: sqlite3 yinglian.db < $OUTPUT"
