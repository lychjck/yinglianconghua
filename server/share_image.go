package main

import (
	"fmt"
	"image"
	"image/jpeg"
	"log"
	"math"
	"net/http"
	"os"

	"github.com/fogleman/gg"
	"github.com/gorilla/mux"
	"golang.org/x/image/font"
	"golang.org/x/image/font/opentype"
)

var (
	fontPath = "static/fonts/WenYue_GuTiFangSong_F.otf"
	bgPath   = "static/share-bg.jpg"
)

// splitColumns 将文本按最大字数分列
func splitColumns(text string, maxPerCol int) []string {
	runes := []rune(text)
	if len(runes) <= maxPerCol {
		return []string{text}
	}
	var cols []string
	for i := 0; i < len(runes); i += maxPerCol {
		end := i + maxPerCol
		if end > len(runes) {
			end = len(runes)
		}
		cols = append(cols, string(runes[i:end]))
	}
	return cols
}

// loadBgImage 加载背景图
func loadBgImage() (image.Image, error) {
	f, err := os.Open(bgPath)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	img, err := jpeg.Decode(f)
	if err != nil {
		return nil, err
	}
	return img, nil
}

func generateShareImage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	log.Printf("[API] GET /api/couplets/%s/share.png", id)

	// 预加载所有字号的字体
	titleFace, err := loadFontFace(fontPath, 28)
	if err != nil {
		log.Printf("[Error] Font load failed (title): %v", err)
		http.Error(w, "font load failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	sourceFace, err := loadFontFace(fontPath, 24)
	if err != nil {
		log.Printf("[Error] Font load failed (source): %v", err)
		http.Error(w, "font load failed", http.StatusInternalServerError)
		return
	}
	log.Println("[Share] Fonts loaded successfully")

	// 查数据库 — 优先从 v2 新表查，回退到旧表
	idInt := 0
	fmt.Sscanf(id, "%d", &idInt)

	var first, second, source string
	cv2, err := repo.GetCoupletByID(idInt)
	if err == nil && cv2 != nil {
		first = cv2.First
		second = cv2.Second
		source = "楹联丛话"
		if cv2.BookName != "" {
			source = cv2.BookName
		}
	} else {
		// 回退：从旧表查
		var c Couplet
		couplets, err := repo.GetAllCouplets()
		if err != nil {
			http.Error(w, "database error", http.StatusInternalServerError)
			return
		}
		found := false
		for _, cp := range couplets {
			if fmt.Sprintf("%d", cp.ID) == id {
				c = cp
				found = true
				break
			}
		}
		if !found {
			http.Error(w, "couplet not found", http.StatusNotFound)
			return
		}
		first = c.First
		second = c.Second
		source = "楹联丛话"
		if c.Source.Valid && c.Source.String != "" {
			source = c.Source.String
		}
	}

	// 分列
	maxPerCol := 12
	firstCols := splitColumns(first, maxPerCol)
	secondCols := splitColumns(second, maxPerCol)

	// 最长列字数
	maxChars := 0
	for _, col := range append(firstCols, secondCols...) {
		if len([]rune(col)) > maxChars {
			maxChars = len([]rune(col))
		}
	}

	// 字号自适应
	var fontSize float64
	switch {
	case maxChars > 10:
		fontSize = 44
	case maxChars > 7:
		fontSize = 52
	default:
		fontSize = 60
	}

	charGap := fontSize * 0.3
	colGap := fontSize * 1.2
	totalCols := len(firstCols) + len(secondCols)
	coupletGap := fontSize * 2.5

	// 画布尺寸
	canvasW := 720.0
	contentWidth := float64(totalCols)*(fontSize+colGap) - colGap + coupletGap
	if contentWidth+200 > canvasW {
		canvasW = contentWidth + 200
	}
	contentHeight := float64(maxChars)*(fontSize+charGap) - charGap
	canvasH := math.Max(contentHeight+400, canvasW*1.33)

	paddingTop := 160.0
	textStartY := paddingTop + (canvasH-400-contentHeight)/2 + 40

	dc := gg.NewContext(int(canvasW), int(canvasH))

	// ===== 背景 =====
	bgImg, bgErr := loadBgImage()
	if bgErr == nil {
		// Cover 模式绘制背景
		dc.Push()
		bgBounds := bgImg.Bounds()
		imgW := float64(bgBounds.Dx())
		imgH := float64(bgBounds.Dy())
		scaleX := canvasW / imgW
		scaleY := canvasH / imgH
		scale := math.Max(scaleX, scaleY)
		offsetX := (canvasW - imgW*scale) / 2
		offsetY := (canvasH - imgH*scale) / 2
		dc.Translate(offsetX, offsetY)
		dc.Scale(scale, scale)
		dc.DrawImage(bgImg, 0, 0)
		dc.Pop()

		// 半透明遮罩
		dc.SetRGBA(0.97, 0.95, 0.92, 0.82)
		dc.DrawRectangle(0, 0, canvasW, canvasH)
		dc.Fill()
	} else {
		// 纯色兜底
		dc.SetHexColor("#f7f2ea")
		dc.DrawRectangle(0, 0, canvasW, canvasH)
		dc.Fill()
	}

	// ===== 外边框 =====
	dc.SetRGBA(0.72, 0.59, 0.24, 0.35)
	dc.SetLineWidth(3)
	dc.DrawRectangle(32, 32, canvasW-64, canvasH-64)
	dc.Stroke()

	// 内边框
	dc.SetRGBA(0.72, 0.59, 0.24, 0.15)
	dc.SetLineWidth(1)
	dc.DrawRectangle(44, 44, canvasW-88, canvasH-88)
	dc.Stroke()

	// 四角装饰
	cornerLen := 24.0
	drawCornerGo(dc, 52, 52, 1, 1, cornerLen)
	drawCornerGo(dc, canvasW-52, 52, -1, 1, cornerLen)
	drawCornerGo(dc, 52, canvasH-52, 1, -1, cornerLen)
	drawCornerGo(dc, canvasW-52, canvasH-52, -1, -1, cornerLen)

	// ===== 标题 =====
	dc.SetFontFace(titleFace)
	dc.SetRGBA(0.72, 0.59, 0.24, 1)
	dc.DrawStringAnchored("对 联 雅 集", canvasW/2, 96, 0.5, 0.5)
	log.Printf("[Share] Drew title at y=96")

	// 标题装饰线
	drawGoldLineGo(dc, canvasW, 124)

	// ===== 对联文字 =====
	coupletFace, err := loadFontFace(fontPath, fontSize)
	if err != nil {
		log.Printf("[Error] Font load failed (couplet size %.0f): %v", fontSize, err)
	} else {
		dc.SetFontFace(coupletFace)
	}
	dc.SetHexColor("#2c2418")
	log.Printf("[Share] Drawing couplet: first=%s second=%s fontSize=%.0f", first, second, fontSize)

	totalWidth := float64(totalCols)*fontSize + float64(totalCols-1)*colGap + coupletGap - colGap
	startX := canvasW/2 + totalWidth/2 - fontSize/2

	// 上联（右侧）
	for ci, col := range firstCols {
		x := startX - float64(ci)*(fontSize+colGap)
		for ri, ch := range []rune(col) {
			y := textStartY + float64(ri)*(fontSize+charGap) + fontSize/2
			dc.DrawStringAnchored(string(ch), x, y, 0.5, 0.5)
		}
	}

	// 中间竖线
	secondStartX := startX - float64(len(firstCols))*(fontSize+colGap) - coupletGap + colGap
	lastFirstX := startX - float64(len(firstCols)-1)*(fontSize+colGap)
	divX := (lastFirstX + secondStartX) / 2

	dc.SetRGBA(0.72, 0.59, 0.24, 0.3)
	dc.SetLineWidth(1)
	dc.DrawLine(divX, textStartY-20, divX, textStartY+contentHeight+20)
	dc.Stroke()

	// 下联（左侧）
	dc.SetHexColor("#2c2418")
	for ci, col := range secondCols {
		x := secondStartX - float64(ci)*(fontSize+colGap)
		for ri, ch := range []rune(col) {
			y := textStartY + float64(ri)*(fontSize+charGap) + fontSize/2
			dc.DrawStringAnchored(string(ch), x, y, 0.5, 0.5)
		}
	}

	// ===== 底部来源 =====
	drawGoldLineGo(dc, canvasW, canvasH-110)
	dc.SetFontFace(sourceFace)
	dc.SetRGBA(0.54, 0.49, 0.42, 1)
	dc.DrawStringAnchored("— "+source+" —", canvasW/2, canvasH-76, 0.5, 0.5)

	// 输出 PNG
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Cache-Control", "public, max-age=86400")
	if err := dc.EncodePNG(w); err != nil {
		log.Printf("[Error] Failed to encode PNG: %v", err)
	}
}

func drawGoldLineGo(dc *gg.Context, canvasW, y float64) {
	dc.SetRGBA(0.72, 0.59, 0.24, 0.4)
	dc.SetLineWidth(1)
	dc.DrawLine(canvasW*0.15, y, canvasW*0.85, y)
	dc.Stroke()
}

func drawCornerGo(dc *gg.Context, x, y, dx, dy, length float64) {
	dc.SetRGBA(0.72, 0.59, 0.24, 0.4)
	dc.SetLineWidth(2)
	dc.DrawLine(x, y+dy*length, x, y)
	dc.DrawLine(x, y, x+dx*length, y)
	dc.Stroke()
}

// loadFontFace 加载 OTF/TTF 字体
func loadFontFace(path string, size float64) (font.Face, error) {
	fontBytes, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read font: %w", err)
	}
	f, err := opentype.Parse(fontBytes)
	if err != nil {
		return nil, fmt.Errorf("parse font: %w", err)
	}
	face, err := opentype.NewFace(f, &opentype.FaceOptions{
		Size:    size,
		DPI:     72,
		Hinting: font.HintingFull,
	})
	if err != nil {
		return nil, fmt.Errorf("create face: %w", err)
	}
	return face, nil
}

// 检查字体和背景文件是否存在
func checkShareAssets() {
	if _, err := os.Stat(fontPath); err != nil {
		log.Printf("[Warning] Font file not found: %s", fontPath)
	}
	if _, err := os.Stat(bgPath); err != nil {
		log.Printf("[Warning] Background image not found: %s", bgPath)
	}
}
