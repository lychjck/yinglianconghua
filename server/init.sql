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