import React from 'react';

/**
 * 壁纸选择器组件
 * 
 * @param {Object} props - 组件属性
 * @param {boolean} props.show - 是否显示壁纸选择器
 * @param {Array} props.wallpapers - 壁纸列表
 * @param {string} props.currentWallpaper - 当前选中的壁纸
 * @param {Function} props.onSelect - 选择壁纸的回调函数
 */
const WallpaperSelector = ({ show, wallpapers, currentWallpaper, onSelect }) => {
  if (!show) return null;
  
  return (
    <div className="wallpaper-selector" onClick={(e) => e.stopPropagation()}>
      <h3>选择壁纸</h3>
      <div className="wallpaper-grid">
        {wallpapers.map((wallpaper, index) => (
          <div 
            key={index}
            className={`wallpaper-item ${currentWallpaper === wallpaper ? 'active' : ''}`}
            onClick={() => onSelect(wallpaper)}
          >
            <img src={`/${wallpaper}`} alt={`壁纸 ${index + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default WallpaperSelector; 