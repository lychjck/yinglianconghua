import React from 'react';

/**
 * 对联显示组件
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.couplet - 当前显示的对联
 * @param {boolean} props.animate - 是否显示动画
 * @param {Function} props.splitTextIntoColumns - 文本分列函数
 * @param {Function} props.getColumnClass - 获取列样式类的函数
 */
const CoupletDisplay = ({ couplet, animate, splitTextIntoColumns, getColumnClass }) => {
  if (!couplet || !animate) return null;
  
  return (
    <div className="couplet-wrapper" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%', 
      width: '100%' 
    }}>
      <div className="couplet-container">
        {/* 下联（左边） */}
        <div className="multi-column-container">
          {splitTextIntoColumns(couplet.second).map((columnText, columnIndex) => (
            <div 
              key={`second-column-${columnIndex}`}
              className={`vertical-column ${getColumnClass(columnText.length)}`}
            >
              {columnText.split('').map((char, charIndex) => (
                <div 
                  key={`second-${columnIndex}-${charIndex}`} 
                  className="vertical-char"
                  style={{
                    opacity: 0,
                    animation: `fadeInUp 0.5s forwards ${0.3 + (splitTextIntoColumns(couplet.first).reduce((total, col) => total + col.length, 0) * 0.08) + (columnIndex * 0.2) + (charIndex * 0.08)}s`
                  }}
                >
                  {char}
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {/* 上联（右边） */}
        <div className="multi-column-container">
          {splitTextIntoColumns(couplet.first).map((columnText, columnIndex) => (
            <div 
              key={`first-column-${columnIndex}`}
              className={`vertical-column ${getColumnClass(columnText.length)}`}
            >
              {columnText.split('').map((char, charIndex) => (
                <div 
                  key={`first-${columnIndex}-${charIndex}`} 
                  className="vertical-char"
                  style={{
                    opacity: 0,
                    animation: `fadeInUp 0.5s forwards ${(columnIndex * 0.2) + (charIndex * 0.08)}s`
                  }}
                >
                  {char}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoupletDisplay; 