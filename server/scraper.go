package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"path/filepath"
	"regexp"
	"strings"
)

// 已存在的对联集合，用于去重
var existingCouplets = make(map[string]bool)

func scrapeCouplets(sourceDir string) error {
	log.Printf("[Parser] 开始从目录读取对联数据: %s", sourceDir)

	// 读取目录中的所有文件
	files, err := ioutil.ReadDir(sourceDir)
	if err != nil {
		log.Printf("[Error] 读取目录失败: %v", err)
		return fmt.Errorf("failed to read directory: %v", err)
	}

	// 遍历所有文件
	for _, file := range files {
		if !file.IsDir() { // 只处理文件，不处理子目录
			filePath := filepath.Join(sourceDir, file.Name())
			if err := parseFile(filePath); err != nil {
				log.Printf("[Error] 解析文件失败 %s: %v", filePath, err)
			}
		}
	}
	return nil
}

func parseFile(filePath string) error {
	log.Printf("[Parser] 开始解析文件: %s", filePath)

	// 读取文件内容
	content, err := ioutil.ReadFile(filePath)
	if err != nil {
		log.Printf("[Error] 读取文件失败: %v", err)
		return fmt.Errorf("failed to read file: %v", err)
	}
	log.Printf("[Parser] 成功读取文件内容，长度: %d 字符", len(content))

	// 使用正则表达式匹配对联
	// 匹配格式："上联xxx";"下联xxx"
	coupletPattern := regexp.MustCompile(`"([^"]+)";"([^"]+)"`) // 匹配双引号包裹的对联
	matches := coupletPattern.FindAllStringSubmatch(string(content), -1)
	log.Printf("[Parser] 使用正则表达式匹配到 %d 个潜在对联", len(matches))

	for i, match := range matches {
		log.Printf("[Parser] 处理第 %d 个匹配项: %s", i+1, match[0])
		// 提取上下联
		if len(match) >= 3 {
			first := strings.TrimSpace(match[1])
			second := strings.TrimSpace(match[2])

			// 生成对联的唯一标识
			coupletKey := first + "|" + second

			// 检查是否已存在
			if !existingCouplets[coupletKey] {
				existingCouplets[coupletKey] = true
				// 插入数据库
				_, err := db.Exec(
					"INSERT INTO couplets (first, second, author, dynasty) VALUES (?, ?, ?, ?)",
					first, second, "未知", "未知",
				)
				if err != nil {
					log.Printf("[Error] Failed to insert couplet: %v", err)
					continue
				}
				log.Printf("[Success] Successfully inserted couplet: %s, %s", first, second)
			}
		}
	}

	return nil
}
