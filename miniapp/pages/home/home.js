const app = getApp()

Page({
  data: {
    couplet: null,
    firstChars: [],
    secondChars: [],
    loading: false,
    animating: false,
    isFavorited: false
  },

  onLoad() {
    this.fetchRandom()
  },

  onShow() {
    // 从收藏页/详情页返回时，重新检查当前对联是否已收藏
    this.checkFavorited()
  },

  onPullDownRefresh() {
    this.fetchRandom().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 获取随机对联
  fetchRandom() {
    if (this.data.loading) return Promise.resolve()

    this.setData({ loading: true, animating: false })

    return new Promise((resolve) => {
      wx.request({
        url: `${app.globalData.apiBaseUrl}/api/couplets/random`,
        success: (res) => {
          const couplet = res.data
          this.setData({
            couplet,
            firstChars: couplet.first.split(''),
            secondChars: couplet.second.split(''),
            loading: false
          })
          this.checkFavorited()
          setTimeout(() => {
            this.setData({ animating: true })
          }, 50)
        },
        fail: () => {
          wx.showToast({ title: '获取对联失败', icon: 'none' })
          this.setData({ loading: false })
        },
        complete: resolve
      })
    })
  },

  // 检查当前对联是否已收藏
  checkFavorited() {
    const { couplet } = this.data
    if (!couplet) return

    const favorites = wx.getStorageSync('favorites') || []
    const isFavorited = favorites.some(f => f.id === couplet.id)
    this.setData({ isFavorited })
  },

  // 收藏/取消收藏
  saveFavorite() {
    const { couplet, isFavorited } = this.data
    if (!couplet) return

    let favorites = wx.getStorageSync('favorites') || []

    if (isFavorited) {
      // 取消收藏
      favorites = favorites.filter(f => f.id !== couplet.id)
      wx.setStorageSync('favorites', favorites)
      this.setData({ isFavorited: false })
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      // 添加收藏
      favorites.unshift({
        id: couplet.id,
        first: couplet.first,
        second: couplet.second,
        author: couplet.author,
        source: couplet.source,
        ref: couplet.ref,
        savedAt: Date.now()
      })
      wx.setStorageSync('favorites', favorites)
      this.setData({ isFavorited: true })
      wx.showToast({ title: '已收藏', icon: 'success' })
    }
  },

  // 跳转详情页
  goDetail() {
    const { couplet } = this.data
    if (!couplet || !couplet.ref) return

    wx.navigateTo({
      url: `/pages/detail/detail?ref=${couplet.ref}&first=${encodeURIComponent(couplet.first)}&second=${encodeURIComponent(couplet.second)}`
    })
  }
})
