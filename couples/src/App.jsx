import { useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from './config'
import './App.css'
import { motion } from 'framer-motion'

function App() {
  const [couplets, setCouplets] = useState([])
  const [activeNav, setActiveNav] = useState('文库')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [error, setError] = useState(null)
  const [currentCouplet, setCurrentCouplet] = useState(null)
  const [splashPosition, setSplashPosition] = useState(null)
  const [animateText, setAnimateText] = useState(true)
  const [sparkles, setSparkles] = useState([])
  const cardRef = useRef(null)
  const [enableFireworks, setEnableFireworks] = useState(() => {
    const saved = localStorage.getItem('enableFireworks');
    return saved !== null ? JSON.parse(saved) : true; // 默认启用烟花特效
  })
  const [enableBlur, setEnableBlur] = useState(() => {
    const saved = localStorage.getItem('enableBlur');
    return saved !== null ? JSON.parse(saved) : true; // 默认启用模糊效果
  })

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isAnimating && couplets.length > 0) {
        setCurrentIndex(prevIndex => (prevIndex + 1) % couplets.length)
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [isAnimating, couplets.length])

  useEffect(() => {
    localStorage.setItem('enableFireworks', JSON.stringify(enableFireworks));
  }, [enableFireworks]);

  useEffect(() => {
    // 更新 CSS 变量
    document.documentElement.style.setProperty('--blur-amount', enableBlur ? '2px' : '0px');
    document.documentElement.style.setProperty('--bg-opacity', enableBlur ? '0.1' : '0.05');
    
    // 保存到本地存储
    localStorage.setItem('enableBlur', JSON.stringify(enableBlur));
  }, [enableBlur]);

  const handleTouchStart = (e) => {
    setTouchStart(e.touches ? e.touches[0].clientX : e.clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches ? e.touches[0].clientX : e.clientX)
  }

  const handleMouseDown = (e) => {
    setTouchStart(e.clientX)
  }

  const handleMouseMove = (e) => {
    if (touchStart) {
      setTouchEnd(e.clientX)
    }
  }

  const fetchRandomCouplet = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/couplets/random`)
      if (!response.ok) {
        throw new Error('获取对联数据失败')
      }
      const data = await response.json()
      setCurrentCouplet(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching random couplet:', err)
    } finally {
      // 重置动画状态，触发新的动画
      setAnimateText(false)
      setTimeout(() => setAnimateText(true), 50)
    }
  }

  useEffect(() => {
    fetchRandomCouplet()
  }, [])

  const handleTouchEnd = (e) => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (Math.abs(distance) > minSwipeDistance) {
      setIsAnimating(true)
      
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      
      setSplashPosition({ x, y })
      
      if (enableFireworks) {
        createSparkles(x, y)
        // 在烟花发射动画结束时切换对联
        setTimeout(() => {
          fetchRandomCouplet()
        }, 800)
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

  // 处理点击事件，添加烟花效果并切换对联
  const handleClick = (e) => {
    if (isAnimating) return;
    
    const x = e.clientX;
    const y = e.clientY;
    
    setIsAnimating(true);
    setSplashPosition({ x, y });
    
    if (enableFireworks) {
      createSparkles(x, y);
      // 在烟花发射动画结束时切换对联
      setTimeout(() => {
        fetchRandomCouplet();
      }, 800);
    } else {
      fetchRandomCouplet();
    }
    
    // 缩短动画状态重置时间
    setTimeout(() => {
      setIsAnimating(false);
      setSplashPosition(null);
    }, 1500);
  };

  // 创建从点击位置发射到顶部的烟花效果
  const createSparkles = (x, y) => {
    const newSparkles = [];
    
    // 烟花颜色 - 更鲜艳的颜色
    const colors = [
      '#FF0000', // 红色
      '#FFD700', // 金色
      '#00FFFF', // 青色
      '#FF00FF', // 品红
      '#00FF00', // 绿色
      '#0000FF', // 蓝色
      '#FF4500', // 橙红色
      '#9400D3'  // 紫色
    ];
    
    // 随机选择烟花主色调
    const mainColor = colors[Math.floor(Math.random() * colors.length)];
    
    // 1. 烟花发射轨迹 - 从点击位置发射到顶部
    const launchDuration = 0.8; // 缩短发射持续时间
    const launchStartX = x;
    const launchStartY = y;
    const launchEndX = x + (Math.random() * 60 - 30); // 减小随机偏移
    const launchEndY = 50; // 固定在顶部位置
    
    // 发射轨迹 - 主体
    newSparkles.push({
      id: `launch-main-${Date.now()}`,
      x: launchStartX,
      y: launchStartY,
      targetX: launchEndX,
      targetY: launchEndY,
      size: 6, // 增大主体大小
      color: '#FFFFFF',
      duration: launchDuration,
      isLaunch: true
    });
    
    // 发射轨迹 - 光晕效果
    newSparkles.push({
      id: `launch-glow-${Date.now()}`,
      x: launchStartX,
      y: launchStartY,
      targetX: launchEndX,
      targetY: launchEndY,
      size: 12, // 更大的光晕
      color: '#FFCC00',
      duration: launchDuration,
      isLaunchGlow: true
    });
    
    // 发射轨迹的尾迹 - 更多的尾迹粒子
    for (let i = 0; i < 30; i++) {
      const progress = i / 30;
      const pathX = launchStartX + (launchEndX - launchStartX) * progress;
      const pathY = launchStartY + (launchEndY - launchStartY) * progress;
      
      // 添加一些随机偏移
      const offsetX = Math.random() * 8 - 4;
      const offsetY = Math.random() * 8 - 4;
      
      // 尾迹粒子
      newSparkles.push({
        id: `launch-trail-${Date.now()}-${i}`,
        x: pathX + offsetX,
        y: pathY + offsetY,
        targetX: pathX + offsetX * 2, // 让尾迹有一点扩散效果
        targetY: pathY + offsetY * 2,
        size: Math.random() * 3 + 1, // 随机大小
        color: i % 3 === 0 ? '#FFCC00' : '#FFFFFF', // 交替颜色
        duration: 0.4,
        delay: (i * launchDuration) / 40,
        isTrail: true
      });
      
      // 每隔几个粒子添加一个较大的火花
      if (i % 5 === 0) {
        newSparkles.push({
          id: `launch-spark-${Date.now()}-${i}`,
          x: pathX,
          y: pathY,
          targetX: pathX + (Math.random() * 20 - 10),
          targetY: pathY + (Math.random() * 20 - 10),
          size: Math.random() * 4 + 2,
          color: mainColor,
          duration: 0.3,
          delay: (i * launchDuration) / 40,
          isLaunchSpark: true
        });
      }
    }
    
    // 2. 爆炸效果 - 在顶部位置
    const explosionDelay = launchDuration;
    
    // 爆炸中心
    newSparkles.push({
      id: `explosion-center-${Date.now()}`,
      x: launchEndX,
      y: launchEndY,
      targetX: launchEndX,
      targetY: launchEndY,
      size: 30, // 更大的爆炸中心
      color: '#FFFFFF',
      duration: 0.4,
      delay: explosionDelay,
      isExplosionCenter: true
    });
    
    // 爆炸射线 - 第一波
    const rayCount1 = 30;
    for (let i = 0; i < rayCount1; i++) {
      const angle = (Math.PI * 2 * i) / rayCount1;
      const distance = Math.random() * 150 + 100;
      const duration = Math.random() * 0.4 + 0.3;
      
      newSparkles.push({
        id: `explosion-ray1-${Date.now()}-${i}`,
        x: launchEndX,
        y: launchEndY,
        targetX: launchEndX + Math.cos(angle) * distance,
        targetY: launchEndY + Math.sin(angle) * distance,
        size: Math.random() * 4 + 3,
        color: mainColor,
        duration: duration,
        delay: explosionDelay,
        isRay: true
      });
    }
    
    // 爆炸射线 - 第二波 (不同颜色)
    const rayCount2 = 25;
    const secondColor = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < rayCount2; i++) {
      const angle = (Math.PI * 2 * i) / rayCount2 + (Math.PI / rayCount2);
      const distance = Math.random() * 130 + 80;
      const duration = Math.random() * 0.3 + 0.4;
      
      newSparkles.push({
        id: `explosion-ray2-${Date.now()}-${i}`,
        x: launchEndX,
        y: launchEndY,
        targetX: launchEndX + Math.cos(angle) * distance,
        targetY: launchEndY + Math.sin(angle) * distance,
        size: Math.random() * 3 + 2,
        color: secondColor,
        duration: duration,
        delay: explosionDelay + 0.1,
        isRay: true
      });
    }
    
    // 3. 散落的火花
    const sparkCount = 60;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 200 + 50;
      const duration = Math.random() * 0.7 + 0.3;
      const size = Math.random() * 2 + 1;
      const sparkColor = colors[Math.floor(Math.random() * colors.length)];
      
      // 添加重力效果的终点偏移
      const gravity = 100 + Math.random() * 50;
      
      newSparkles.push({
        id: `spark-${Date.now()}-${i}`,
        x: launchEndX,
        y: launchEndY,
        targetX: launchEndX + Math.cos(angle) * distance,
        targetY: launchEndY + Math.sin(angle) * distance + gravity, // 添加重力效果
        size: size,
        color: sparkColor,
        duration: duration,
        delay: explosionDelay + Math.random() * 0.3,
        isSpark: true
      });
    }
    
    setSparkles(newSparkles);
    
    // 动画结束后清除烟花
    setTimeout(() => {
      setSparkles([]);
    }, (explosionDelay + 1.5) * 1000); // 缩短动画总时长
  };

  const navItems = ['文库', '创作', '发现', '我的']

  // 根据对联长度动态设置类名
  const getColumnClass = (length) => {
    if (length > 15) return 'very-long';
    if (length > 10) return 'long';
    if (length > 5) return 'medium';
    return 'short';
  };

  // 优化分列逻辑，处理特殊情况
  const splitTextIntoColumns = (text, maxCharsPerColumn = 12) => {
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

  // 添加一个切换烟花特效的函数
  const toggleFireworks = () => {
    setEnableFireworks(prev => !prev);
  };

  // 添加切换模糊效果的函数
  const toggleBlur = () => {
    setEnableBlur(prev => !prev);
  };

  return (
    <div className="app">
      {/* 顶部标题栏 */}
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
        </div>
      </header>

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
            onClick={handleClick}
            style={{
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
              height: '100%'
            }}
          >
            {/* 烟花效果 */}
            <div className="fireworks-container" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 1000 }}>
              {sparkles.map(sparkle => (
                <motion.div
                  key={sparkle.id}
                  className={`sparkle ${
                    sparkle.isLaunch ? 'sparkle-launch' : 
                    sparkle.isLaunchGlow ? 'sparkle-launch-glow' :
                    sparkle.isLaunchSpark ? 'sparkle-launch-spark' :
                    sparkle.isTrail ? 'sparkle-trail' : 
                    sparkle.isExplosionCenter ? 'sparkle-center' : 
                    sparkle.isRay ? 'sparkle-ray' : 
                    'sparkle-spark'
                  }`}
                  initial={{ 
                    x: sparkle.x, 
                    y: sparkle.y, 
                    opacity: sparkle.isExplosionCenter ? 0 : 
                             sparkle.isLaunchGlow ? 0.7 : 1,
                    scale: sparkle.isExplosionCenter ? 0 : 
                           sparkle.isLaunchGlow ? 0.5 : 1
                  }}
                  animate={{ 
                    x: sparkle.targetX, 
                    y: sparkle.targetY, 
                    opacity: sparkle.isLaunch ? [1, 0.8, 0.6] : 
                             sparkle.isLaunchGlow ? [0.7, 0.5, 0] :
                             sparkle.isTrail ? [1, 0] : 
                             sparkle.isExplosionCenter ? [1, 0] : 
                             [1, 1, 0.8, 0],
                    scale: sparkle.isExplosionCenter ? [0, 4, 0] : 
                           sparkle.isLaunchGlow ? [0.5, 1.5, 0] :
                           sparkle.isLaunch ? [1, 0.8, 0.6] : 
                           sparkle.isSpark ? [1, 0.5, 0] : 
                           [1, 0.8, 0]
                  }}
                  transition={{ 
                    duration: sparkle.duration,
                    ease: sparkle.isLaunch || sparkle.isLaunchGlow ? "linear" : 
                          sparkle.isSpark ? "easeOut" : 
                          "easeOut",
                    delay: sparkle.delay || 0,
                    times: sparkle.isExplosionCenter ? [0, 0.5, 1] : 
                           sparkle.isLaunch ? [0, 0.7, 1] : 
                           sparkle.isLaunchGlow ? [0, 0.7, 1] :
                           sparkle.isTrail ? [0, 1] : 
                           [0, 0.3, 0.7, 1]
                  }}
                  style={{
                    position: 'absolute',
                    width: sparkle.size,
                    height: sparkle.size,
                    borderRadius: '50%',
                    backgroundColor: sparkle.color,
                    boxShadow: `0 0 ${sparkle.isLaunchGlow ? sparkle.size * 4 : sparkle.size * 2}px ${sparkle.color}`,
                    pointerEvents: 'none',
                    filter: sparkle.isLaunchGlow ? 'blur(3px)' : 
                            sparkle.isLaunch ? 'blur(1px)' :
                            sparkle.isTrail ? 'blur(1px)' : 'none'
                  }}
                />
              ))}
            </div>
            
            {splashPosition && (
              <div
                className="splash-effect"
                style={{
                  position: 'fixed', // 使用 fixed 定位
                  left: splashPosition.x,
                  top: splashPosition.y,
                }}
              />
            )}
            <div className="couplet-text">
              {animateText && (
                <div className="couplet-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                  <div className="couplet-container">
                    {/* 下联（左边） */}
                    <div className="multi-column-container">
                      {splitTextIntoColumns(currentCouplet.second).map((columnText, columnIndex) => (
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
                                animation: `fadeInUp 0.5s forwards ${0.3 + (splitTextIntoColumns(currentCouplet.first).reduce((total, col) => total + col.length, 0) * 0.08) + (columnIndex * 0.2) + (charIndex * 0.08)}s`
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
                      {splitTextIntoColumns(currentCouplet.first).map((columnText, columnIndex) => (
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
              )}
            </div>
          </div>
        ) : (
          <div className="loading">加载中...</div>
        )}
      </main>
    </div>
  )
}

export default App
