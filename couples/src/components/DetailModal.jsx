import React from 'react';

/**
 * 对联详情模态窗口组件
 * 
 * @param {Object} props - 组件属性
 * @param {boolean} props.show - 是否显示模态窗口
 * @param {Object} props.detail - 对联详细信息
 * @param {Function} props.onClose - 关闭模态窗口的回调函数
 */
const DetailModal = ({ show, detail, onClose }) => {
  if (!show || !detail) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <div className="modal-body">
          <div className="couplet-detail">
            <div className="detail-header" style={{ textAlign: "center" }}>
              <h2>{detail.book_name}</h2>
              <h3>{detail.volume}</h3>
              <h4>{detail.title}</h4>
            </div>
            <div className="detail-content">
              {detail.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal; 