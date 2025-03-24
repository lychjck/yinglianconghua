import React, { useEffect, useState } from 'react';
import './ScrollDetailView.css';

/**
 * 对联详情组件 - 画卷展开效果
 * 
 * @param {Object} props - 组件属性
 * @param {boolean} props.show - 是否显示详情
 * @param {Object} props.detail - 对联详细信息
 * @param {Function} props.onClose - 关闭详情的回调函数
 */
const ScrollDetailView = ({ show, detail, onClose }) => {
  const [animationState, setAnimationState] = useState('closed'); // 'closed', 'opening', 'open', 'closing'
  
  useEffect(() => {
    if (show) {
      // 显示详情时，先设置为正在打开状态
      setAnimationState('opening');
      // 800ms 后设置为完全打开状态
      const timer = setTimeout(() => {
        setAnimationState('open');
      }, 800);
      return () => clearTimeout(timer);
    } else {
      // 如果当前是打开状态，则设置为正在关闭状态
      if (animationState === 'open') {
        setAnimationState('closing');
        // 800ms 后设置为完全关闭状态
        const timer = setTimeout(() => {
          setAnimationState('closed');
        }, 800);
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
    }, 800);
  };
  
  return (
    <div className={`scroll-detail-view ${animationState}`}>
      {detail && (
        <div className="scroll-detail-content">
          <div className="scroll-detail-header">
            <h2>{detail.book_name}</h2>
            <h3>{detail.volume}</h3>
            <h4>{detail.title}</h4>
          </div>
          <div className="scroll-detail-body">
            {detail.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <button className="scroll-back-btn" onClick={handleClose}>
            返回对联
          </button>
        </div>
      )}
    </div>
  );
};

export default ScrollDetailView; 