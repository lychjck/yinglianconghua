/**
 * 根据文本长度获取列样式类
 * 
 * @param {number} length - 文本长度
 * @returns {string} - 样式类名
 */
export const getColumnClass = (length) => {
  if (length > 15) return 'very-long';
  if (length > 10) return 'long';
  if (length > 5) return 'medium';
  return 'short';
};

/**
 * 优化分列逻辑，处理特殊情况
 * 
 * @param {string} text - 需要分列的文本
 * @param {number} maxCharsPerColumn - 每列最大字符数
 * @returns {Array} - 分列后的文本数组
 */
export const splitTextIntoColumns = (text, maxCharsPerColumn = 12) => {
  // 如果文本长度小于等于最大列字符数，直接返回一列
  if (text.length <= maxCharsPerColumn) {
    return [text];
  }
  
  // 检查是否是特殊情况：总长度超过一列，但第二列只有一个字
  const commaIndex = text.indexOf('，');
  if (commaIndex > 0 && commaIndex < text.length - 2 && text.length <= maxCharsPerColumn + 2) {
    // 以逗号为分割点，分成两列
    return [
      text.substring(0, commaIndex + 1), // 包含逗号的第一部分
      text.substring(commaIndex + 1)     // 逗号后的部分
    ];
  }
  
  // 常规情况：按最大字符数分列
  const columns = [];
  for (let i = 0; i < text.length; i += maxCharsPerColumn) {
    columns.push(text.slice(i, i + maxCharsPerColumn));
  }
  return columns;
}; 