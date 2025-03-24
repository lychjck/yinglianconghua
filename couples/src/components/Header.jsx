import React from 'react';

/**
 * 应用顶部标题栏组件
 * 
 * @param {Object} props - 组件属性
 * @param {boolean} props.enableFireworks - 是否启用烟花效果
 * @param {Function} props.toggleFireworks - 切换烟花效果的函数
 * @param {boolean} props.enableBlur - 是否启用模糊效果
 * @param {Function} props.toggleBlur - 切换模糊效果的函数
 * @param {Function} props.toggleWallpaperSelector - 切换壁纸选择器显示状态的函数
 * @param {string} props.detailDisplayMode - 详情展示模式
 * @param {Function} props.toggleDetailDisplayMode - 切换详情展示模式的函数
 */
const Header = ({ 
  enableFireworks, 
  toggleFireworks, 
  enableBlur, 
  toggleBlur, 
  toggleWallpaperSelector,
  detailDisplayMode,
  toggleDetailDisplayMode
}) => {
  return (
    <header className="header">
      <h1>对联雅集</h1>
      <div className="header-buttons">
        <button 
          className="toggle-btn"
          onClick={(e) => {
            e.stopPropagation();
            toggleFireworks();
          }}
        >
          {enableFireworks ? '关闭烟花' : '开启烟花'}
        </button>
        <button 
          className="toggle-btn"
          onClick={(e) => {
            e.stopPropagation();
            toggleBlur();
          }}
        >
          {enableBlur ? '关闭模糊' : '开启模糊'}
        </button>
        <button 
          className="toggle-btn toggle-wallpaper-btn"
          onClick={toggleWallpaperSelector}
        >
          更换壁纸
        </button>
        <button 
          className="toggle-btn toggle-detail-mode-btn"
          onClick={toggleDetailDisplayMode}
        >
          {detailDisplayMode === 'modal' ? '画卷模式' : '弹窗模式'}
        </button>
      </div>
    </header>
  );
};

export default Header; 