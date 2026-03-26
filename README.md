# 对联雅集

一个展示中国传统楹联的 Web 应用 + 微信小程序。对联以竖排书法风格呈现，配以古典国画壁纸，营造典雅的阅读体验。

## 功能

- 随机展示对联，支持点击或滑动切换
- 竖排文字渲染，还原传统阅读方式
- 点击对联可查看出处详情（书名、卷名、标题、原文）
- 两种详情模式：画卷展开 / 弹窗
- 可选烟花特效和背景模糊效果
- 多款古典国画壁纸可切换
- 用户偏好自动保存至浏览器本地存储
- 微信小程序版本（收藏、分享、出处卷轴）

## 技术栈

| 层级 | 技术 |
|------|------|
| Web 前端 | React 19 + Vite 6，纯 CSS，文悦古体仿宋字体 |
| 小程序 | 微信原生小程序，自定义字体支持 |
| 后端 | Go 1.24，gorilla/mux，godotenv，纯 Go 编译（无 CGO 依赖） |
| 数据库 | SQLite（默认）或 MySQL 8.4，通过 Repository 接口抽象，可自由切换 |

## 项目结构

```
yinglianconghua/
├── couples/                # Web 前端 React 应用
│   ├── public/             # 静态资源（壁纸图片、字体文件）
│   └── src/
│       ├── App.jsx         # 主组件，管理全部应用状态
│       ├── config.js       # API 地址配置
│       ├── components/     # UI 组件
│       └── utils/          # 工具函数
├── miniapp/                # 微信小程序
│   ├── app.js / app.json   # 小程序入口与配置
│   └── pages/              # 页面（home / collection / detail）
├── server/                 # 后端 Go API 服务
│   ├── main.go             # 入口：路由、HTTP handler、数据库初始化
│   ├── repository.go       # Repository 接口定义
│   ├── mysql.go            # MySQL 实现
│   ├── sqlite.go           # SQLite 实现（纯 Go，无 CGO）
│   ├── scraper.go          # 对联数据文件解析导入工具
│   ├── .env                # 环境变量配置
│   ├── couples.sql         # MySQL 完整数据集
│   ├── couples_sqlite.sql  # SQLite 数据集（从 couples.sql 转换）
│   ├── convert_to_sqlite.sh # MySQL → SQLite 转换脚本
│   └── init.sql            # MySQL 数据库建表脚本
└── README.md
```

## 环境要求

- Node.js >= 18（Web 前端）
- Go >= 1.24（后端，无需 C 编译器）
- MySQL >= 8.0（仅在使用 MySQL 模式时需要）
- 微信开发者工具（小程序开发时需要）

---

## 数据库配置

后端通过 `server/.env` 中的 `DB_DRIVER` 选择数据库。支持 `sqlite` 和 `mysql`。

### 方式一：使用 SQLite（默认，推荐）

零配置文件数据库，无需安装额外服务。后端使用纯 Go 的 SQLite 驱动（`modernc.org/sqlite`），不依赖 CGO，可直接交叉编译。

#### 1. 配置 `.env`

```env
DB_DRIVER=sqlite
DB_PATH=yinglian.db
PORT=8080
```

#### 2. 导入数据

项目提供了现成的 SQLite 数据文件，直接导入 `yinglian` 表：

```bash
cd server
sqlite3 yinglian.db < couples_sqlite.sql
```

验证数据：

```bash
sqlite3 yinglian.db "SELECT COUNT(*) FROM yinglian;"
# 应输出 1637
```

如果你修改了 `couples.sql`（MySQL 源数据），可以重新生成 SQLite 版本：

```bash
bash convert_to_sqlite.sh
sqlite3 yinglian.db < couples_sqlite.sql
```

### 方式二：使用 MySQL

#### 1. 初始化数据库

```bash
cd server
mysql -u root < init.sql      # 创建数据库和表结构
mysql -u root < couples.sql   # 导入完整数据集（约 1600+ 条）
```

#### 2. 配置 `.env`

```env
DB_DRIVER=mysql
DB_USER=root
DB_PASS=
DB_HOST=localhost:3306
DB_NAME=yinglian
PORT=8080
```

### 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DB_DRIVER` | 数据库驱动（`sqlite` 或 `mysql`） | `sqlite` |
| `DB_PATH` | SQLite 文件路径 | `yinglian.db` |
| `DB_USER` | MySQL 用户名 | - |
| `DB_PASS` | MySQL 密码 | - |
| `DB_HOST` | MySQL 地址（含端口） | `localhost:3306` |
| `DB_NAME` | MySQL 数据库名 | `yinglian` |
| `PORT` | 服务监听端口 | `8080` |

---

## 启动服务

### 后端

```bash
cd server
go run .
```

启动日志示例：

```
[Database] Opening SQLite: yinglian.db
[Database] SQLite connected successfully
[Server] Listening on port 8080
```

### Web 前端

```bash
cd couples
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。API 地址配置在 `couples/src/config.js`。

### 生产构建

```bash
cd couples
npm run build    # 产物在 couples/dist/
```

### 微信小程序

1. 用微信开发者工具打开 `miniapp/` 目录
2. 在 `miniapp/app.js` 中修改 `apiBaseUrl` 为你的后端地址
3. 开发阶段勾选「不校验合法域名」（使用 localhost 时）
4. 自定义字体：将字体文件上传到 HTTPS 地址，填入 `app.js` 的 `fontUrl`

---

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/couplets` | 获取全部对联列表 |
| GET | `/api/couplets/random` | 随机获取一副对联 |
| GET | `/api/couplets/content/{ref}` | 根据引用 ID 获取出处详情 |

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

---

## 数据库表结构

### yinglian 表（主表，后端 API 读取）

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

---

## 架构说明

后端采用 Repository 模式抽象数据库访问层：

```
main.go          → HTTP handler，调用 Repository 接口
repository.go    → Repository 接口定义
mysql.go         → MySQL 实现（ORDER BY RAND()）
sqlite.go        → SQLite 实现（ORDER BY RANDOM()，纯 Go，自动建表）
```

切换数据库只需修改 `.env` 中的 `DB_DRIVER`，无需改动代码。
