#!/bin/bash
# 将 couples.sql (MySQL dump) 转换为 SQLite 兼容的 SQL 文件
# 用法: bash convert_to_sqlite.sh

INPUT="couples.sql"
OUTPUT="couples_sqlite.sql"

echo "-- SQLite 版对联数据（从 couples.sql 自动转换）" > "$OUTPUT"
echo "-- 生成时间: $(date)" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# 建表（SQLite 语法）
cat >> "$OUTPUT" << 'EOF'
CREATE TABLE IF NOT EXISTS couplets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first TEXT NOT NULL,
    second TEXT NOT NULL,
    author TEXT DEFAULT '',
    dynasty TEXT DEFAULT '',
    created DATETIME DEFAULT CURRENT_TIMESTAMP
);

BEGIN;
EOF

# 提取 INSERT 语句，去掉反引号
grep "^INSERT INTO" "$INPUT" | sed 's/`//g' >> "$OUTPUT"

echo "COMMIT;" >> "$OUTPUT"

# 同时插入 yinglian 表（API 实际读取的表）
cat >> "$OUTPUT" << 'EOF'

-- 将数据同步到 yinglian 表（后端 API 读取此表）
INSERT OR IGNORE INTO yinglian (id, first, second, author, source, ref)
SELECT id, first, second, author, '', 0 FROM couplets;
EOF

echo "转换完成: $OUTPUT"
echo "导入命令: sqlite3 yinglian.db < $OUTPUT"
