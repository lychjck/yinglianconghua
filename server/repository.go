package main

// Repository 定义数据访问接口，支持不同数据库后端
type Repository interface {
	// GetAllCouplets 获取全部对联
	GetAllCouplets() ([]Couplet, error)
	// GetRandomCouplet 随机获取一副对联
	GetRandomCouplet() (*Couplet, error)
	// GetContentByRef 根据引用 ID 获取出处详情
	GetContentByRef(ref string) (*YinglianContent, error)
	// InsertCouplet 插入一副对联（供 scraper 使用）
	InsertCouplet(first, second, author, dynasty string) error
	// Close 关闭数据库连接
	Close() error
}
