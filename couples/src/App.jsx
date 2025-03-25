import { useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from './config'
import './App.css'

// 导入组件
import Header from './components/Header'
import WallpaperSelector from './components/WallpaperSelector'
import Fireworks from './components/Fireworks'
import CoupletDisplay from './components/CoupletDisplay'
import ScrollDetailView from './components/ScrollDetailView'
import DetailModal from './components/DetailModal'

// 导入工具函数
import { createFireworkSparkles } from './utils/fireworksUtils'
import { getColumnClass, splitTextIntoColumns } from './utils/textUtils'

// 使用 Vite 的 import.meta.glob 动态导入所有壁纸
const wallpaperFiles = import.meta.glob('/public/wallpaper/*.jpg', { eager: true });

// 添加默认壁纸
const defaultWallpaper = '清恽寿平花卉山水图册其一.jpg';

/**
 * 主应用组件
 */
function App() {
  // ===== 状态管理 =====
  // 触摸和滑动相关状态
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  
  // 动画和显示相关状态
  const [isAnimating, setIsAnimating] = useState(false)
  const [animateText, setAnimateText] = useState(true)
  const [splashPosition, setSplashPosition] = useState(null)
  const [sparkles, setSparkles] = useState([])
  
  // 对联数据相关状态
  const [error, setError] = useState(null)
  const [currentCouplet, setCurrentCouplet] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [coupletDetail, setCoupletDetail] = useState(null)
  
  // 详情显示模式
  const [detailDisplayMode, setDetailDisplayMode] = useState(() => {
    const saved = localStorage.getItem('detailDisplayMode');
    return saved || 'scroll'; // 'scroll' 或 'modal'
  })
  
  // 特效控制相关状态
  const [enableFireworks, setEnableFireworks] = useState(() => {
    const saved = localStorage.getItem('enableFireworks');
    return saved !== null ? JSON.parse(saved) : false; // 默认不启用烟花特效
  })
  
  const [enableBlur, setEnableBlur] = useState(() => {
    const saved = localStorage.getItem('enableBlur');
    return saved !== null ? JSON.parse(saved) : false; // 默认启用模糊效果
  })
  
  // 壁纸相关状态
  const [wallpapers, setWallpapers] = useState([defaultWallpaper]);
  const [currentWallpaper, setCurrentWallpaper] = useState(() => {
    const saved = localStorage.getItem('currentWallpaper');
    return saved || defaultWallpaper;
  });
  const [showWallpaperSelector, setShowWallpaperSelector] = useState(false);
  
  // 引用
  const cardRef = useRef(null)

  // ===== 副作用 =====
  // 保存烟花效果设置到本地存储
  useEffect(() => {
    localStorage.setItem('enableFireworks', JSON.stringify(enableFireworks));
  }, [enableFireworks]);

  // 更新模糊效果 CSS 变量
  useEffect(() => {
    document.documentElement.style.setProperty('--blur-amount', enableBlur ? '2px' : '0px');
    document.documentElement.style.setProperty('--bg-opacity', enableBlur ? '0.1' : '0');
    localStorage.setItem('enableBlur', JSON.stringify(enableBlur));
  }, [enableBlur]);

  // 加载壁纸列表
  useEffect(() => {
    // 从 wallpaperFiles 中提取壁纸路径
    const paths = Object.keys(wallpaperFiles).map(path => path.replace('/public/', ''));
    
    // 确保默认壁纸在列表中
    if (!paths.includes(defaultWallpaper)) {
      paths.unshift(defaultWallpaper);
    }
    
    setWallpapers(paths);
    
    // 如果当前壁纸不在列表中，设置为默认壁纸
    if (!paths.includes(currentWallpaper)) {
      setCurrentWallpaper(defaultWallpaper);
    }
  }, []);

  // 更新壁纸 CSS 变量
  useEffect(() => {
    document.documentElement.style.setProperty('--wallpaper', `url('/${currentWallpaper}')`);
    localStorage.setItem('currentWallpaper', currentWallpaper);
  }, [currentWallpaper]);

  // 初始加载对联
  useEffect(() => {
    fetchRandomCouplet();
  }, []);

  // 点击外部区域关闭壁纸选择器
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showWallpaperSelector) {
        setShowWallpaperSelector(false);
      }
    };

    if (showWallpaperSelector) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showWallpaperSelector]);

  // 保存详情显示模式到本地存储
  useEffect(() => {
    localStorage.setItem('detailDisplayMode', detailDisplayMode);
  }, [detailDisplayMode]);

  // ===== 事件处理函数 =====
  /**
   * 触摸开始事件处理
   */
  const handleTouchStart = (e) => {
    setTouchStart(e.touches ? e.touches[0].clientX : e.clientX)
  }

  /**
   * 触摸移动事件处理
   */
  const handleTouchMove = (e) => {
    setTouchEnd(e.touches ? e.touches[0].clientX : e.clientX)
  }

  /**
   * 鼠标按下事件处理
   */
  const handleMouseDown = (e) => {
    setTouchStart(e.clientX)
  }

  /**
   * 鼠标移动事件处理
   */
  const handleMouseMove = (e) => {
    if (touchStart) {
      setTouchEnd(e.clientX)
    }
  }

  /**
   * 获取随机对联数据
   */
  const fetchRandomCouplet = async () => {
    try {
      // 如果正在显示详情，先关闭详情
      if (showDetailModal) {
        setShowDetailModal(false);
        setCoupletDetail(null);
      }
      
      // 重置动画状态
      setAnimateText(false);
      setCurrentCouplet(null);
      
      const response = await fetch(`${API_BASE_URL}/api/couplets/random`);
      if (!response.ok) {
        throw new Error('获取对联失败');
      }
      const data = await response.json();
      
      // 设置新数据并触发动画
      setCurrentCouplet(data);
      setTimeout(() => {
        setAnimateText(true);
      }, 100);
    } catch (error) {
      console.error('获取对联出错:', error);
      setError('获取对联失败，请稍后再试');
    }
  };

  /**
   * 触摸结束事件处理
   */
  const handleTouchEnd = (e) => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    // 只有在用户点击后滑动时才触发切换
    if (Math.abs(distance) > minSwipeDistance) {
      setIsAnimating(true)
      
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      
      setSplashPosition({ x, y })
      
      if (enableFireworks) {
        const newSparkles = createFireworkSparkles(x, y);
        setSparkles(newSparkles);
        
        // 在烟花发射动画结束时切换对联
        setTimeout(() => {
          fetchRandomCouplet()
        }, 800)
        
        // 动画结束后清除烟花
        setTimeout(() => {
          setSparkles([]);
        }, 2300); // 给足够的时间完成所有动画
      } else {
        fetchRandomCouplet()
      }
      
      // 缩短动画状态重置时间
      setTimeout(() => {
        setIsAnimating(false)
        setSplashPosition(null)
      }, 1500)
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  /**
   * 点击事件处理
   */
  const handleClick = async (e) => {
    if (isAnimating) return;

    // 检查点击是否在对联文本区域内
    // const isTextAreaClick = e.target.closest('.first-line, .second-line, .vertical-char, .char-container, .char-wrapper');
    const isTextAreaClick = e.target.closest('.couplet-container');

    // 如果点击在对联文本区域内，显示详情
    if (isTextAreaClick && currentCouplet && currentCouplet.ref) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/couplets/content/${currentCouplet.ref}`);
        if (!response.ok) {
          throw new Error('获取对联详细内容失败');
        }
        const data = await response.json();
        setCoupletDetail(data);
        setShowDetailModal(true);
        return;
      } catch (err) {
        console.error('Error fetching couplet detail:', err);
      }
      return;
    }
    
    const x = e.clientX;
    const y = e.clientY;
    
    setIsAnimating(true);
    setSplashPosition({ x, y });
    
    if (enableFireworks) {
      const newSparkles = createFireworkSparkles(x, y);
      setSparkles(newSparkles);
      
      // 在烟花发射动画结束时切换对联
      setTimeout(() => {
        fetchRandomCouplet();
      }, 800);
      
      // 动画结束后清除烟花
      setTimeout(() => {
        setSparkles([]);
      }, 2300);
    } else {
      fetchRandomCouplet();
    }
    
    // 缩短动画状态重置时间
    setTimeout(() => {
      setIsAnimating(false);
      setSplashPosition(null);
    }, 1500);
  };

  /**
   * 切换烟花效果
   */
  const toggleFireworks = (e) => {
    if (e) e.stopPropagation();
    setEnableFireworks(prev => !prev);
  };

  /**
   * 切换模糊效果
   */
  const toggleBlur = (e) => {
    if (e) e.stopPropagation();
    setEnableBlur(prev => !prev);
  };

  /**
   * 切换壁纸选择器显示状态
   */
  const toggleWallpaperSelector = (e) => {
    if (e) e.stopPropagation();
    setShowWallpaperSelector(prev => !prev);
  };

  /**
   * 切换详情显示模式
   */
  const toggleDetailDisplayMode = (e) => {
    if (e) e.stopPropagation();
    setDetailDisplayMode(prev => prev === 'scroll' ? 'modal' : 'scroll');
  };

  /**
   * 更改壁纸
   */
  const changeWallpaper = (wallpaper) => {
    setCurrentWallpaper(wallpaper);
    setShowWallpaperSelector(false);
  };

  /**
   * 关闭详情
   */
  const closeDetailModal = () => {
    setShowDetailModal(false);
  };

  // ===== 渲染 =====
  return (
    <div className="app" onClick={handleClick}>
      {/* 标题栏 */}
      <Header 
        enableFireworks={enableFireworks}
        toggleFireworks={toggleFireworks}
        enableBlur={enableBlur}
        toggleBlur={toggleBlur}
        toggleWallpaperSelector={toggleWallpaperSelector}
        detailDisplayMode={detailDisplayMode}
        toggleDetailDisplayMode={toggleDetailDisplayMode}
      />

      {/* 壁纸选择器 */}
      <WallpaperSelector 
        show={showWallpaperSelector}
        wallpapers={wallpapers}
        currentWallpaper={currentWallpaper}
        onSelect={changeWallpaper}
      />

      {/* 主要内容区域 */}
      <main className="content">
        {error ? (
          <div className="error-message">{error}</div>
        ) : currentCouplet ? (
          <div 
            ref={cardRef}
            className={`couplet-card ${isAnimating ? 'animating' : ''}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
            style={{
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
              height: '100%'
            }}
          >
            {/* 烟花效果 */}
            <Fireworks sparkles={sparkles} />
            
            {/* 点击水波纹效果 */}
            {splashPosition && (
              <div
                className="splash-effect"
                style={{
                  position: 'fixed',
                  left: splashPosition.x,
                  top: splashPosition.y,
                }}
              />
            )}
            
            {/* 对联文本显示 */}
            <div className="couplet-text">
              <CoupletDisplay 
                couplet={currentCouplet}
                animate={animateText}
                splitTextIntoColumns={splitTextIntoColumns}
                getColumnClass={getColumnClass}
              />
            </div>
            
            {/* 卷轴详情视图 - 只在卷轴模式下显示 */}
            {detailDisplayMode === 'scroll' && (
              <ScrollDetailView
                show={showDetailModal}
                detail={coupletDetail}
                onClose={closeDetailModal}
              />
            )}
          </div>
        ) : (
          <div className="loading">加载中...</div>
        )}
      </main>

      {/* 弹窗模式 - 只在弹窗模式下显示 */}
      {detailDisplayMode === 'modal' && (
        <DetailModal 
          show={showDetailModal}
          detail={coupletDetail}
          onClose={closeDetailModal}
        />
      )}
    </div>
  )
}

export default App
