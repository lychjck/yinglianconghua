CREATE DATABASE IF NOT EXISTS couples CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE couples;

CREATE TABLE IF NOT EXISTS couplets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first VARCHAR(255) NOT NULL,
    second VARCHAR(255) NOT NULL,
    author VARCHAR(100) NOT NULL,
    dynasty VARCHAR(50) NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO couplets (first, second, author, dynasty) VALUES
('春风得意马蹄疾', '一日看尽长安花', '孟郊', '唐'),
('两个黄鹂鸣翠柳', '一行白鹭上青天', '杜甫', '唐'),
('海内存知己', '天涯若比邻', '王勃', '唐'),
('落霞与孤鹜齐飞', '秋水共长天一色', '王勃', '唐'),
('月落乌啼霜满天', '江枫渔火对愁眠', '张继', '唐');

CREATE DATABASE IF NOT EXISTS yinglian CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE yinglian;

CREATE TABLE IF NOT EXISTS yinglian (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first TEXT NOT NULL COMMENT '上联',
    second TEXT NOT NULL COMMENT '下联',
    author VARCHAR(255) COMMENT '作者',
    source VARCHAR(255) COMMENT '来源',
    ref INT COMMENT '引用表id',
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
)COMMENT='楹联表';

CREATE TABLE yinglian_content (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    book_name VARCHAR(255) NOT NULL COMMENT '书名',
    volume VARCHAR(255) NOT NULL COMMENT '卷名',
    title VARCHAR(255) NOT NULL COMMENT '标题',
    content TEXT NOT NULL COMMENT '正文内容',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='楹联出处表';