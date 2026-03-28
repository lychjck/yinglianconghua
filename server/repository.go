package main

// Repository 定义数据访问接口，支持不同数据库后端
type Repository interface {
	// --- 旧版接口（向后兼容） ---

	// GetAllCouplets 获取全部对联
	GetAllCouplets() ([]Couplet, error)
	// GetRandomCouplet 随机获取一副对联
	GetRandomCouplet() (*Couplet, error)
	// GetContentByRef 根据引用 ID 获取出处详情
	GetContentByRef(ref string) (*YinglianContent, error)
	// InsertCouplet 插入一副对联（供 scraper 使用）
	InsertCouplet(first, second, author, dynasty string) error

	// --- v2 接口（LLM 提取数据） ---

	// GetRandomCoupletV2 随机获取一副 CoupletV2（confidence >= 0.5）
	GetRandomCoupletV2() (*CoupletV2, error)
	// GetCoupletByID 根据 id 获取对联详情
	GetCoupletByID(id int) (*CoupletV2, error)
	// ListCouplets 按筛选条件分页查询对联
	ListCouplets(filter CoupletFilter) ([]CoupletV2, int, error)
	// GetParagraphByID 根据 id 获取原文段落
	GetParagraphByID(id int) (*Paragraph, error)
	// GetDistinctDynasties 获取所有不重复的朝代
	GetDistinctDynasties() ([]string, error)
	// GetDistinctOccasions 获取所有不重复的场合
	GetDistinctOccasions() ([]string, error)
	// GetDistinctBooks 获取所有不重复的书名
	GetDistinctBooks() ([]string, error)

	// Close 关闭数据库连接
	Close() error
}
