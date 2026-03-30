/**
 * 将文本按关键词拆分为高亮片段数组
 * @param {string} text - 原始文本
 * @param {string} keyword - 搜索关键词
 * @returns {Array<{text: string, highlight: boolean}>} 片段数组
 */
function highlightKeyword(text, keyword) {
  if (!text) return [{ text: '', highlight: false }]
  if (!keyword) return [{ text: text, highlight: false }]

  var segments = []
  var lower = text
  var kw = keyword
  var startIndex = 0

  while (startIndex < text.length) {
    var pos = lower.indexOf(kw, startIndex)
    if (pos === -1) {
      segments.push({ text: text.substring(startIndex), highlight: false })
      break
    }
    if (pos > startIndex) {
      segments.push({ text: text.substring(startIndex, pos), highlight: false })
    }
    segments.push({ text: text.substring(pos, pos + kw.length), highlight: true })
    startIndex = pos + kw.length
  }

  if (segments.length === 0) {
    return [{ text: text, highlight: false }]
  }
  return segments
}

module.exports = { highlightKeyword: highlightKeyword }
