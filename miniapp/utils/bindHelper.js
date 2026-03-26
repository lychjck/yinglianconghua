/**
 * 将文本按最大字数分列（竖排多列）
 */
function splitTextIntoColumns(text, maxPerCol) {
  maxPerCol = maxPerCol || 12
  if (text.length <= maxPerCol) return [text]
  var columns = []
  for (var i = 0; i < text.length; i += maxPerCol) {
    columns.push(text.slice(i, i + maxPerCol))
  }
  return columns
}

module.exports = { splitTextIntoColumns: splitTextIntoColumns }
