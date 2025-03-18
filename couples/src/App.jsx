import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [couplets, setCouplets] = useState([])
  const [activeNav, setActiveNav] = useState('文库')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCouplets()
  }, [])

  const fetchCouplets = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/couplets')
      if (!response.ok) {
        throw new Error('获取对联数据失败')
      }
      const data = await response.json()
      setCouplets(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching couplets:', err)
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isAnimating && couplets.length > 0) {
        setCurrentIndex(prevIndex => (prevIndex + 1) % couplets.length)
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [isAnimating, couplets.length])

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (Math.abs(distance) > minSwipeDistance) {
      setIsAnimating(true)
      if (distance > 0) {
        // 向左滑动
        setCurrentIndex(prevIndex => (prevIndex + 1) % couplets.length)
      } else {
        // 向右滑动
        setCurrentIndex(prevIndex => (prevIndex - 1 + couplets.length) % couplets.length)
      }
      setTimeout(() => setIsAnimating(false), 300)
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
        ) : couplets.length > 0 ? (
          <div 
            className={`couplet-card ${isAnimating ? 'animating' : ''}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="couplet-text">
              <div className="second-line">{couplets[currentIndex].second}</div>
              <div className="first-line">{couplets[currentIndex].first}</div>
            </div>
          </div>
        ) : (
          <div className="loading">加载中...</div>
        )}
      </main>

      {/* 底部导航栏 */}
      <nav className="bottom-nav">
        {navItems.map(item => (
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
