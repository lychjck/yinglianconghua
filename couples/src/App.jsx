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
  const [currentCouplet, setCurrentCouplet] = useState(null)

  // useEffect(() => {
  //   fetchCouplets()
  // }, [])

  const fetchCouplets = async () => {
    try {
      const response = await fetch('http://10.33.202.222:8080/api/couplets')
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
      const response = await fetch('http://10.33.202.222:8080/api/couplets/random')
      if (!response.ok) {
        throw new Error('获取对联数据失败')
      }
      const data = await response.json()
      setCurrentCouplet(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching random couplet:', err)
    }
  }

  useEffect(() => {
    fetchRandomCouplet()
  }, [])

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (Math.abs(distance) > minSwipeDistance) {
      setIsAnimating(true)
      fetchRandomCouplet()
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
          >
            <div className="couplet-text">
              <div className={`second-line ${currentCouplet.second.length <= 3 ? 'short-text' : ''}`}>{currentCouplet.second}</div>
              <div className={`first-line ${currentCouplet.first.length <= 3 ? 'short-text' : ''}`}>{currentCouplet.first}</div>
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
