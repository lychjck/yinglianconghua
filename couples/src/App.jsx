import { useState, useEffect } from 'react'
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

  const navItems = ['文库', '创作', '发现', '我的']

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
              overflow: 'hidden'
            }}
          >
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
                <>
                  <div className={`first-line ${currentCouplet.first.length <= 3 ? 'short-text' : ''}`}>
                    {currentCouplet.first.split('').map((char, index) => (
                      <motion.div
                        key={`first-${index}`}
                        className="char-item"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          type: 'spring',
                          damping: 12,
                          stiffness: 100,
                          delay: 0.3 + (currentCouplet.second.length * 0.08) + (index * 0.08)
                        }}
                      >
                        {char}
                      </motion.div>
                    ))}
                  </div>
                  <div className={`second-line ${currentCouplet.second.length <= 3 ? 'short-text' : ''}`}>
                    {currentCouplet.second.split('').map((char, index) => (
                      <motion.div
                        key={`second-${index}`}
                        className="char-item"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          type: 'spring',
                          damping: 12,
                          stiffness: 100,
                          delay: index * 0.08
                        }}
                      >
                        {char}
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="loading">加载中...</div>
        )}
      </main>

      {/* 底部导航栏 */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <span
            key={item}
            className={`nav-item ${activeNav === item ? 'active' : ''}`}
            onClick={() => setActiveNav(item)}
          >
            {item}
          </span>
        ))}
      </nav>
    </div>
  )
}

export default App
