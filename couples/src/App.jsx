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

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isAnimating && couplets.length > 0) {
        setCurrentIndex(prevIndex => (prevIndex + 1) % couplets.length)
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [isAnimating, couplets.length])

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
      const rect = e.currentTarget.getBoundingClientRect()
      const x = touchEnd - rect.left
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
      setSplashPosition({ x, y })
      fetchRandomCouplet()
      setTimeout(() => {
        setIsAnimating(false)
        setSplashPosition(null)
      }, 600)
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  // 处理点击事件，添加烟花效果并切换对联
  const handleClick = (e) => {
    if (isAnimating) return;
    
    // 获取点击位置相对于卡片的坐标
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 创建烟花效果
    createSparkles(x, y);
    
    // 切换对联
    setIsAnimating(true);
    setSplashPosition({ x, y });
    fetchRandomCouplet();
    setTimeout(() => {
      setIsAnimating(false);
      setSplashPosition(null);
    }, 600);
  };

  // 创建真正的烟花效果
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
    
    // 1. 烟花发射轨迹
    const launchDuration = 0.5;
    const launchStartY = window.innerHeight;
    const launchEndY = y;
    
    // 发射轨迹
    newSparkles.push({
      id: `launch-${Date.now()}`,
      x: x,
      y: launchStartY,
      targetX: x,
      targetY: launchEndY,
      size: 4,
      color: '#FFFFFF',
      duration: launchDuration,
      isLaunch: true
    });
    
    // 发射轨迹的尾迹
    for (let i = 0; i < 10; i++) {
      newSparkles.push({
        id: `launch-trail-${Date.now()}-${i}`,
        x: x + (Math.random() * 4 - 2),
        y: launchStartY - (i * (launchStartY - launchEndY) / 10),
        targetX: x + (Math.random() * 10 - 5),
        targetY: launchStartY - ((i + 1) * (launchStartY - launchEndY) / 10),
        size: 2,
        color: '#FFCC00',
        duration: launchDuration / 2,
        delay: (i * launchDuration) / 15,
        isTrail: true
      });
    }
    
    // 2. 爆炸效果 - 延迟到发射结束
    const explosionDelay = launchDuration;
    
    // 爆炸中心
    newSparkles.push({
      id: `explosion-center-${Date.now()}`,
      x: x,
      y: y,
      targetX: x,
      targetY: y,
      size: 20,
      color: '#FFFFFF',
      duration: 0.3,
      delay: explosionDelay,
      isExplosionCenter: true
    });
    
    // 爆炸射线 - 第一波
    const rayCount1 = 30;
    for (let i = 0; i < rayCount1; i++) {
      const angle = (Math.PI * 2 * i) / rayCount1;
      const distance = Math.random() * 150 + 100;
      const duration = Math.random() * 0.7 + 0.6;
      
      newSparkles.push({
        id: `explosion-ray1-${Date.now()}-${i}`,
        x: x,
        y: y,
        targetX: x + Math.cos(angle) * distance,
        targetY: y + Math.sin(angle) * distance,
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
      const duration = Math.random() * 0.6 + 0.5;
      
      newSparkles.push({
        id: `explosion-ray2-${Date.now()}-${i}`,
        x: x,
        y: y,
        targetX: x + Math.cos(angle) * distance,
        targetY: y + Math.sin(angle) * distance,
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
      const duration = Math.random() * 1.5 + 1;
      const size = Math.random() * 2 + 1;
      const sparkColor = colors[Math.floor(Math.random() * colors.length)];
      
      // 添加重力效果的终点偏移
      const gravity = 100 + Math.random() * 50;
      
      newSparkles.push({
        id: `spark-${Date.now()}-${i}`,
        x: x,
        y: y,
        targetX: x + Math.cos(angle) * distance,
        targetY: y + Math.sin(angle) * distance + gravity, // 添加重力效果
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
    }, (explosionDelay + 2) * 1000); // 给足够的时间完成所有动画
  };

  const navItems = ['文库', '创作', '发现', '我的']

  // 根据对联长度动态设置类名
  const getColumnClass = (length) => {
    if (length > 15) return 'very-long';
    if (length > 10) return 'long';
    if (length > 5) return 'medium';
    return 'short';
  };

  // 将长对联分成多列显示
  const splitTextIntoColumns = (text, maxCharsPerColumn = 12) => {
    if (text.length <= maxCharsPerColumn) {
      return [text];
    }
    
    const columns = [];
    for (let i = 0; i < text.length; i += maxCharsPerColumn) {
      columns.push(text.slice(i, i + maxCharsPerColumn));
    }
    return columns;
  };

  return (
    <div className="app">
      {/* 顶部标题栏 */}
      <header className="header">
        <h1>对联雅集</h1>
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
              overflow: 'hidden'
            }}
          >
            {/* 烟花效果 */}
            {sparkles.map(sparkle => (
              <motion.div
                key={sparkle.id}
                className={`sparkle ${
                  sparkle.isLaunch ? 'sparkle-launch' : 
                  sparkle.isTrail ? 'sparkle-trail' : 
                  sparkle.isExplosionCenter ? 'sparkle-center' : 
                  sparkle.isRay ? 'sparkle-ray' : 
                  'sparkle-spark'
                }`}
                initial={{ 
                  x: sparkle.x, 
                  y: sparkle.y, 
                  opacity: sparkle.isExplosionCenter ? 0 : 1,
                  scale: sparkle.isExplosionCenter ? 0 : 1
                }}
                animate={{ 
                  x: sparkle.targetX, 
                  y: sparkle.targetY, 
                  opacity: sparkle.isLaunch ? [1, 0] : 
                           sparkle.isTrail ? [1, 0] : 
                           sparkle.isExplosionCenter ? [1, 0] : 
                           [1, 1, 0.8, 0],
                  scale: sparkle.isExplosionCenter ? [0, 4, 0] : 
                         sparkle.isLaunch ? 1 : 
                         sparkle.isSpark ? [1, 0.5, 0] : 
                         [1, 0.8, 0]
                }}
                transition={{ 
                  duration: sparkle.duration,
                  ease: sparkle.isLaunch ? "easeIn" : 
                        sparkle.isSpark ? "easeOut" : 
                        "easeOut",
                  delay: sparkle.delay || 0,
                  times: sparkle.isExplosionCenter ? [0, 0.5, 1] : 
                         sparkle.isLaunch ? [0, 1] : 
                         sparkle.isTrail ? [0, 1] : 
                         [0, 0.3, 0.7, 1]
                }}
                style={{
                  position: 'absolute',
                  width: sparkle.size,
                  height: sparkle.size,
                  borderRadius: '50%',
                  backgroundColor: sparkle.color,
                  boxShadow: `0 0 ${sparkle.size * 2}px ${sparkle.color}`,
                  pointerEvents: 'none'
                }}
              />
            ))}
            
            {splashPosition && (
              <div
                className="splash-effect"
                style={{
                  position: 'absolute',
                  left: splashPosition.x,
                  top: splashPosition.y,
                }}
              />)}
            <div className="couplet-text">
              {animateText && (
                <div className="couplet-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                  <div className="couplet-container">
                    {/* 左边对联 - 可能多列 */}
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
                                animation: `fadeInUp 0.5s forwards ${0.3 + (columnIndex * 0.2) + (charIndex * 0.08)}s`
                              }}
                            >
                              {char}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    
                    {/* 右边对联 - 可能多列 */}
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