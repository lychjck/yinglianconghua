var helper = require('./bindHelper')

/**
 * 绘制对联分享卡片
 */
function drawShareCard(canvas, opts) {
  var first = opts.first
  var second = opts.second
  var source = opts.source || '楹联丛话'
  var dpr = opts.dpr || 2

  var maxPerCol = 12
  var firstCols = helper.splitTextIntoColumns(first, maxPerCol)
  var secondCols = helper.splitTextIntoColumns(second, maxPerCol)

  // 最长列字数
  var maxChars = 0
  var allCols = firstCols.concat(secondCols)
  for (var i = 0; i < allCols.length; i++) {
    if (allCols[i].length > maxChars) maxChars = allCols[i].length
  }

  // 字号根据字数自适应
  var fontSize = maxChars > 10 ? 22 : maxChars > 7 ? 26 : 30
  var charGap = fontSize * 0.3
  var colGap = fontSize * 1.2
  var totalCols = firstCols.length + secondCols.length
  var coupletGap = fontSize * 2.5

  // 固定卡片比例 3:4，宽度 360
  var canvasW = 360
  var contentWidth = totalCols * (fontSize + colGap) - colGap + coupletGap
  if (contentWidth + 100 > canvasW) canvasW = contentWidth + 100

  var contentHeight = maxChars * (fontSize + charGap) - charGap
  var canvasH = Math.max(contentHeight + 200, canvasW * 1.33)

  var paddingTop = 80
  // 文字区域垂直居中
  var textStartY = paddingTop + (canvasH - 200 - contentHeight) / 2 + 20

  canvas.width = canvasW * dpr
  canvas.height = canvasH * dpr

  var ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  return new Promise(function (resolve) {
    var bgImg = canvas.createImage()
    bgImg.onload = function () {
      drawContent(ctx, bgImg, canvasW, canvasH, textStartY, contentHeight,
        firstCols, secondCols, fontSize, charGap, colGap, coupletGap, source)
      resolve({ width: canvasW, height: canvasH })
    }
    bgImg.onerror = function () {
      drawContent(ctx, null, canvasW, canvasH, textStartY, contentHeight,
        firstCols, secondCols, fontSize, charGap, colGap, coupletGap, source)
      resolve({ width: canvasW, height: canvasH })
    }
    bgImg.src = '/images/share-bg.jpg'
  })
}

function drawContent(ctx, bgImg, w, h, textStartY, contentHeight,
  firstCols, secondCols, fontSize, charGap, colGap, coupletGap, source) {

  // ===== 背景 =====
  if (bgImg) {
    var imgR = bgImg.width / bgImg.height
    var canR = w / h
    var sx, sy, sw, sh
    if (imgR > canR) {
      sh = bgImg.height; sw = sh * canR; sx = (bgImg.width - sw) / 2; sy = 0
    } else {
      sw = bgImg.width; sh = sw / canR; sx = 0; sy = (bgImg.height - sh) / 2
    }
    ctx.drawImage(bgImg, sx, sy, sw, sh, 0, 0, w, h)
    // 遮罩
    ctx.fillStyle = 'rgba(248,243,235,0.82)'
    ctx.fillRect(0, 0, w, h)
  } else {
    var g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#f8f3eb')
    g.addColorStop(1, '#ede3cf')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }

  // ===== 外边框 =====
  ctx.strokeStyle = 'rgba(184,150,62,0.35)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(16, 16, w - 32, h - 32)

  // 内边框
  ctx.strokeStyle = 'rgba(184,150,62,0.15)'
  ctx.lineWidth = 0.5
  ctx.strokeRect(22, 22, w - 44, h - 44)

  // ===== 顶部标题 =====
  ctx.fillStyle = '#b8963e'
  ctx.font = '14px STFangsong, FangSong, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('对 联 雅 集', w / 2, 48)

  // 标题下装饰线
  drawGoldLine(ctx, w, 62, 0.4)

  // ===== 对联文字 =====
  ctx.font = 'bold ' + fontSize + 'px STFangsong, FangSong, Songti SC, serif'
  ctx.fillStyle = '#2c2418'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 计算总宽度，居中放置
  var totalCols = firstCols.length + secondCols.length
  var totalWidth = totalCols * fontSize + (totalCols - 1) * colGap + coupletGap - colGap
  var startX = w / 2 + totalWidth / 2 - fontSize / 2

  // 上联（右侧，先画）
  for (var ci = 0; ci < firstCols.length; ci++) {
    var col = firstCols[ci]
    var x = startX - ci * (fontSize + colGap)
    for (var ri = 0; ri < col.length; ri++) {
      var y = textStartY + ri * (fontSize + charGap) + fontSize / 2
      ctx.fillText(col[ri], x, y)
    }
  }

  // 中间装饰竖线（上联最左列和下联最右列的正中间）
  var lastFirstX = startX - (firstCols.length - 1) * (fontSize + colGap)
  var firstSecondX = secondStartX
  var divX = (lastFirstX + firstSecondX) / 2
  var lineG = ctx.createLinearGradient(0, textStartY - 10, 0, textStartY + contentHeight + 10)
  lineG.addColorStop(0, 'rgba(184,150,62,0)')
  lineG.addColorStop(0.2, 'rgba(184,150,62,0.3)')
  lineG.addColorStop(0.8, 'rgba(184,150,62,0.3)')
  lineG.addColorStop(1, 'rgba(184,150,62,0)')
  ctx.strokeStyle = lineG
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(divX, textStartY - 10)
  ctx.lineTo(divX, textStartY + contentHeight + 10)
  ctx.stroke()

  // 下联（左侧）
  var secondStartX = startX - firstCols.length * (fontSize + colGap) - coupletGap + colGap
  for (var ci2 = 0; ci2 < secondCols.length; ci2++) {
    var col2 = secondCols[ci2]
    var x2 = secondStartX - ci2 * (fontSize + colGap)
    for (var ri2 = 0; ri2 < col2.length; ri2++) {
      var y2 = textStartY + ri2 * (fontSize + charGap) + fontSize / 2
      ctx.fillText(col2[ri2], x2, y2)
    }
  }

  // ===== 底部来源 =====
  drawGoldLine(ctx, w, h - 55, 0.4)
  ctx.fillStyle = '#8a7e6c'
  ctx.font = '12px STFangsong, FangSong, serif'
  ctx.textAlign = 'center'
  ctx.fillText('— ' + source + ' —', w / 2, h - 38)

  // ===== 四角装饰 =====
  drawCorner(ctx, 26, 26, 1, 1)
  drawCorner(ctx, w - 26, 26, -1, 1)
  drawCorner(ctx, 26, h - 26, 1, -1)
  drawCorner(ctx, w - 26, h - 26, -1, -1)
}

function drawGoldLine(ctx, w, y, opacity) {
  var g = ctx.createLinearGradient(w * 0.15, 0, w * 0.85, 0)
  g.addColorStop(0, 'rgba(184,150,62,0)')
  g.addColorStop(0.5, 'rgba(184,150,62,' + opacity + ')')
  g.addColorStop(1, 'rgba(184,150,62,0)')
  ctx.strokeStyle = g
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(w * 0.15, y)
  ctx.lineTo(w * 0.85, y)
  ctx.stroke()
}

// 四角小装饰（L 形）
function drawCorner(ctx, x, y, dx, dy) {
  var len = 12
  ctx.strokeStyle = 'rgba(184,150,62,0.4)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y + dy * len)
  ctx.lineTo(x, y)
  ctx.lineTo(x + dx * len, y)
  ctx.stroke()
}

module.exports = { drawShareCard: drawShareCard }
