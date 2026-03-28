package main

// CoupletV2 新版对联数据模型，包含 LLM 提取的丰富元数据
type CoupletV2 struct {
	ID          int     `json:"id"`
	First       string  `json:"first"`
	Second      string  `json:"second"`
	Author      string  `json:"author"`
	Dynasty     string  `json:"dynasty"`
	Occasion    string  `json:"occasion"`
	Location    string  `json:"location"`
	Note        string  `json:"note"`
	ParagraphID *int    `json:"paragraph_id,omitempty"`
	BookName    string  `json:"book_name"`
	Volume      string  `json:"volume"`
	Confidence  float64 `json:"confidence"`
}

// Paragraph 原文段落数据模型
type Paragraph struct {
	ID       int    `json:"id"`
	BookName string `json:"book_name"`
	Volume   string `json:"volume"`
	Title    string `json:"title"`
	Content  string `json:"content"`
}

// CoupletFilter 筛选参数
type CoupletFilter struct {
	Dynasty  string `json:"dynasty"`
	Occasion string `json:"occasion"`
	BookName string `json:"book_name"`
	Page     int    `json:"page"`
	PageSize int    `json:"page_size"`
}

// CoupletListResponse 分页列表响应
type CoupletListResponse struct {
	Data     []CoupletV2 `json:"data"`
	Total    int         `json:"total"`
	Page     int         `json:"page"`
	PageSize int         `json:"page_size"`
}

// CoupletDetailResponse 对联详情响应（包含关联原文）
type CoupletDetailResponse struct {
	Couplet   CoupletV2  `json:"couplet"`
	Paragraph *Paragraph `json:"paragraph,omitempty"`
}

// FilterOptionsResponse 筛选选项响应
type FilterOptionsResponse struct {
	Dynasties []string `json:"dynasties"`
	Occasions []string `json:"occasions"`
	Books     []string `json:"books"`
}
