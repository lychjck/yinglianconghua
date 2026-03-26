# 对联雅集

一个展示中国传统楹联的 Web 应用。对联以竖排书法风格呈现，配以古典国画壁纸，营造典雅的阅读体验。

## 功能

- 随机展示对联，支持点击或滑动切换
- 竖排文字渲染，还原传统阅读方式
- 点击对联可查看出处详情（书名、卷名、标题、原文）
- 两种详情模式：画卷展开 / 弹窗
- 可选烟花特效和背景模糊效果
- 多款古典国画壁纸可切换
- 用户偏好自动保存至浏览器本地存储

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + Vite 6，纯 CSS，文悦古体仿宋字体 |
| 后端 | Go 1.24，gorilla/mux，godotenv |
| 数据库 | SQLite（默认）或 MySQL 8.4，通过 Repository 接口抽象，可自由切换 |

## 项目结构

```
yinglianconghua/
├── couples/                # 前端 React 应用
│   ├── public/             # 静态资源（壁纸图片、字体文件）
│   └── src/
│       ├── App.jsx         # 主组件，管理全部应用状态
│       ├── App.css         # 主样式表
│       ├── config.js       # API 地址配置
│       ├── components/     # UI 组件（Header、CoupletDisplay、DetailModal 等）
│       └── utils/          # 工具函数（文本分列、烟花粒子生成）
├── server/                 # 后端 Go API 服务
│   ├── main.go             # 入口：路由、HTTP handler、数据库初始化
│   ├── repository.go       # Repository 接口定义
│   ├── mysql.go            # MySQL 实现
│   ├── sqlite.go           # SQLite 实现（含自动建表和 MySQL 迁移工具）
│   ├── scraper.go          # 对联数据文件解析导入工具
│   ├── .env                # 环境变量配置
│   ├── init.sql            # MySQL 数据库建表脚本
│   ├── couples.sql         # MySQL 完整数据集（Navicat 导出格式）
│   ├── go.mod / go.sum     # Go 依赖管理
└── README.md
```

## 环境要求

- Node.js >= 18
- Go >= 1.24
- CGO 支持（SQLite 驱动 `go-sqlite3` 需要 C 编译器）
  - macOS：已自带（Xcode Command Line Tools）
  - Linux：`apt install gcc` 或 `yum install gcc`
  - Windows：安装 [TDM-GCC](https://jmeubank.github.io/tdm-gcc/) 或使用 WSL
- MySQL >= 8.0（仅在使用 MySQL 模式时需要）

---

## 数据库配置

后端通过 `server/.env` 文件中的 `DB_DRIVER` 环境变量选择数据库后端。支持 `sqlite` 和 `mysql` 两种模式。

### 方式一：使用 SQLite（默认，推荐）

SQLite 是零配置的文件数据库，无需安装额外服务，适合开发和轻量部署。

#### 1. 配置 `.env`

```env
DB_DRIVER=sqlite
DB_PATH=yinglian.db
PORT=8080
```

- `DB_PATH`：SQLite 数据库文件路径，默认为 `yinglian.db`
- 首次启动时会自动创建数据库文件并建表（`yinglian`、`yinglian_content`、`couplets`）

#### 2. 导入数据到 SQLite

由于项目自带的 `couples.sql` 是 MySQL 格式的 dump 文件，不能直接导入 SQLite。以下提供几种导入方式：

**方式 A：从 MySQL 迁移（如果你已有 MySQL 数据）**

代码中 `sqlite.go` 提供了 `ImportFromMySQL` 方法，可以编写一个简单的迁移脚本。在 `server/` 目录下创建 `migrate.go`：

```go
//go:build ignore

package main

import (
	"log"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	// 连接 MySQL 源数据库
	mysqlRepo, err := NewMySQLRepository("root", "", "localhost:3306", "yinglian")
	if err != nil {
		log.Fatal("MySQL connection failed:", err)
	}
	defer mysqlRepo.Close()

	// 创建 SQLite 目标数据库
	sqliteRepo, err := NewSQLiteRepository("yinglian.db")
	if err != nil {
		log.Fatal("SQLite init failed:", err)
	}
	defer sqliteRepo.Close()

	// 执行迁移
	if err := sqliteRepo.ImportFromMySQL(mysqlRepo); err != nil {
		log.Fatal("Migration failed:", err)
	}
	log.Println("Done!")
}
```

运行迁移：

```bash
cd server
go run migrate.go repository.go mysql.go sqlite.go main.go
```

> 注意：`ImportFromMySQL` 目前迁移 `yinglian` 表的数据。如需迁移 `yinglian_content` 表，需要自行扩展迁移逻辑。

**方式 B：手动用 sqlite3 命令行导入**

如果你有 CSV 格式的数据，可以直接用 `sqlite3` 命令导入：

```bash
# 先启动一次服务让它自动建表
cd server
go run . &
# 等待启动后 Ctrl+C 停止

# 用 sqlite3 插入数据
sqlite3 yinglian.db <<'EOF'
INSERT INTO yinglian (first, second, author, source, ref) VALUES
('新年纳余庆', '嘉节号长春', '', '', 0),
('海内存知己', '天涯若比邻', '王勃', '', 0),
('落霞与孤鹜齐飞', '秋水共长天一色', '王勃', '', 0);
EOF
```

**方式 C：从 MySQL dump 转换为 SQLite 格式**

使用开源工具 [mysql2sqlite](https://github.com/dumblob/mysql2sqlite) 转换：

```bash
# 安装转换工具
# macOS: brew install mysql2sqlite
# 或直接下载脚本: https://github.com/dumblob/mysql2sqlite

# 转换并导入
mysql2sqlite couples.sql | sqlite3 yinglian.db
```


### 方式二：使用 MySQL

适合已有 MySQL 环境或需要处理大量数据的场景。

#### 1. 安装并启动 MySQL

确保 MySQL 8.0+ 已安装并运行。

#### 2. 初始化数据库

```bash
cd server

# 创建数据库和表结构
mysql -u root < init.sql
```

这会创建两个数据库：
- `couples`：包含 `couplets` 表（旧版格式，含 author/dynasty 字段）
- `yinglian`：包含 `yinglian` 表（主表）和 `yinglian_content` 表（出处详情）

> 后端实际连接的是 `yinglian` 数据库。

#### 3. 导入数据

```bash
# 导入完整对联数据集（约 1600+ 条）
mysql -u root < couples.sql
```

`couples.sql` 是 Navicat 导出的完整 dump 文件，包含建表语句和全部数据。

#### 4. 配置 `.env`

```env
DB_DRIVER=mysql
DB_USER=root
DB_PASS=
DB_HOST=localhost:3306
DB_NAME=yinglian
PORT=8080
```

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DB_DRIVER` | 数据库驱动 | `sqlite` |
| `DB_USER` | MySQL 用户名 | - |
| `DB_PASS` | MySQL 密码 | - |
| `DB_HOST` | MySQL 地址（含端口） | `localhost:3306` |
| `DB_NAME` | MySQL 数据库名 | `yinglian` |
| `DB_PATH` | SQLite 文件路径 | `yinglian.db` |
| `PORT` | 服务监听端口 | `8080` |

---

## 启动服务

### 1. 启动后端

```bash
cd server
go run .
```

启动日志会显示使用的数据库类型：

```
[Database] Opening SQLite: yinglian.db
[Database] SQLite connected successfully
[Server] Listening on port 8080
```

或（MySQL 模式）：

```
[Database] Connecting to MySQL: root@localhost:3306/yinglian
[Database] MySQL connected successfully
[Server] Listening on port 8080
```

### 2. 启动前端

```bash
cd couples
npm install
npm run dev
```

开发服务器启动后，浏览器打开 `http://localhost:5173`。

前端默认连接 `http://localhost:8080` 的后端 API。如需修改，编辑 `couples/src/config.js`：

```js
export const API_BASE_URL = 'http://localhost:8080';
```

### 3. 生产构建

```bash
cd couples
npm run build
```

构建产物在 `couples/dist/` 目录，可部署到 Nginx、Caddy 或任意静态文件服务器。

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/couplets` | 获取全部对联列表 |
| GET | `/api/couplets/random` | 随机获取一副对联 |
| GET | `/api/couplets/content/{ref}` | 根据引用 ID 获取出处详情（书名、卷名、标题、原文） |

### 响应示例

`GET /api/couplets/random`

```json
{
  "id": 66,
  "first": "万事不如杯在手",
  "second": "一年几见月当头",
  "author": "",
  "source": "",
  "ref": 12,
  "created": "2025-03-18T06:06:39+08:00",
  "updated_at": "2025-03-18T06:06:39+08:00"
}
```

`GET /api/couplets/content/12`

```json
{
  "id": 12,
  "book_name": "楹联丛话",
  "volume": "卷一",
  "title": "故事",
  "content": "...",
  "created_at": "2025-03-18T06:06:39+08:00",
  "updated_at": "2025-03-18T06:06:39+08:00"
}
```

---

## 数据库架构

### yinglian 表（主表，后端读取）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| first | TEXT | 上联 |
| second | TEXT | 下联 |
| author | TEXT | 作者 |
| source | TEXT | 来源 |
| ref | INTEGER | 关联 yinglian_content 表的 ID |
| created | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### yinglian_content 表（出处详情）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| book_name | TEXT | 书名 |
| volume | TEXT | 卷名 |
| title | TEXT | 标题 |
| content | TEXT | 正文内容 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### couplets 表（旧版格式，scraper 使用）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| first | TEXT | 上联 |
| second | TEXT | 下联 |
| author | TEXT | 作者 |
| dynasty | TEXT | 朝代 |
| created | DATETIME | 创建时间 |

---

## 架构说明

后端采用 Repository 模式抽象数据库访问层：

```
main.go          → HTTP handler，调用 Repository 接口
repository.go    → Repository 接口定义（GetAllCouplets, GetRandomCouplet, GetContentByRef, InsertCouplet, Close）
mysql.go         → MySQL 实现（ORDER BY RAND()）
sqlite.go        → SQLite 实现（ORDER BY RANDOM()，自动建表）
```

切换数据库只需修改 `.env` 中的 `DB_DRIVER`，无需改动任何代码。如需支持 PostgreSQL 等其他数据库，只需新增一个实现 `Repository` 接口的文件即可。
