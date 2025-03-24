import React, { useEffect, useState } from 'react';
import './BookDetailModal.css';

/**
 * 对联风格的书本详情模态窗口组件
 * 
 * @param {Object} props - 组件属性
 * @param {boolean} props.show - 是否显示模态窗口
 * @param {Object} props.detail - 对联详细信息
 * @param {Function} props.onClose - 关闭模态窗口的回调函数
 */
const BookDetailModal = ({ show, detail, onClose }) => {
  const [animationState, setAnimationState] = useState('closed'); // 'closed', 'opening', 'open', 'closing'
  
  useEffect(() => {
    if (show) {
      // 显示模态窗口时，先设置为正在打开状态
      setAnimationState('opening');
      // 300ms 后设置为完全打开状态
      const timer = setTimeout(() => {
        setAnimationState('open');
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // 如果当前是打开状态，则设置为正在关闭状态
      if (animationState === 'open') {
        setAnimationState('closing');
        // 300ms 后设置为完全关闭状态
        const timer = setTimeout(() => {
          setAnimationState('closed');
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [show, animationState]);
  
  // 如果不显示且已完全关闭，则不渲染任何内容
  if (!show && animationState === 'closed') return null;
  
  // 处理关闭事件
  const handleClose = () => {
    setAnimationState('closing');
    // 等待动画完成后再调用 onClose
    setTimeout(() => {
      onClose();
      setAnimationState('closed');
    }, 300);
  };
  
  return (
    <div 
      className={`scroll-modal-overlay ${animationState}`} 
      onClick={handleClose}
    >
      <div 
        className={`scroll-modal-content ${animationState}`} 
        onClick={e => e.stopPropagation()}
      >
        {detail && (
          <div className="scroll-content">
            <div className="scroll-header">
              <div className="scroll-title-container">
                <h2>{detail.book_name}</h2>
                <h3>{detail.volume}</h3>
                <h4>{detail.title}</h4>
              </div>
              <div className="scroll-decoration top-decoration"></div>
            </div>
            <div className="scroll-body">
              {detail.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="scroll-decoration bottom-decoration"></div>
          </div>
        )}
        <button className="scroll-close-btn" onClick={handleClose}>
          ×
        </button>
      </div>
    </div>
  );
};

export default BookDetailModal; 