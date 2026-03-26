const app = getApp()

Page({
  data: {
    ref: null,
    first: '',
    second: '',
    detail: null,
    paragraphs: [],
    loading: false,
    isFavorited: false
  },

  onLoad(options) {
    const { ref, first, second } = options
    this.setData({
      ref,
      first: decodeURIComponent(first || ''),
      second: decodeURIComponent(second || '')
    })

    this.checkFavorited()

    if (ref) {
      this.fetchDetail(ref)
    }
  },

  // 获取出处详情
  fetchDetail(ref) {
    this.setData({ loading: true })

    wx.request({
      url: `${app.globalData.apiBaseUrl}/api/couplets/content/${ref}`,
      success: (res) => {
        if (res.statusCode === 200) {
          const detail = res.data
          this.setData({
            detail,
            paragraphs: detail.content ? detail.content.split('\n').filter(p => p.trim()) : [],
            loading: false
          })
        } else {
          this.setData({ loading: false })
        }
      },
      fail: () => {
        wx.showToast({ title: '获取详情失败', icon: 'none' })
        this.setData({ loading: false })
      }
    })
  },

  // 检查是否已收藏
  checkFavorited() {
    const favorites = wx.getStorageSync('favorites') || []
    const { first, second } = this.data
    const isFavorited = favorites.some(f => f.first === first && f.second === second)
    this.setData({ isFavorited })
  },

  // 切换收藏
  toggleFavorite() {
    let favorites = wx.getStorageSync('favorites') || []
    const { first, second, ref } = this.data

    if (this.data.isFavorited) {
      // 取消收藏
      favorites = favorites.filter(f => !(f.first === first && f.second === second))
      wx.setStorageSync('favorites', favorites)
      this.setData({ isFavorited: false })
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      // 添加收藏
      favorites.unshift({
        id: Date.now(),
        first,
        second,
        author: { String: '', Valid: false },
        source: { String: this.data.detail ? this.data.detail.book_name : '', Valid: true },
        ref: parseInt(ref) || 0,
        savedAt: Date.now()
      })
      wx.setStorageSync('favorites', favorites)
      this.setData({ isFavorited: true })
      wx.showToast({ title: '已收藏', icon: 'success' })
    }
  },

  // 复制对联
  copyCouplet() {
    const { first, second } = this.data
    wx.setClipboardData({
      data: `${first}\n${second}`,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  // 分享
  shareCouplet() {
    // 触发小程序原生分享
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  // 分享给朋友
  onShareAppMessage() {
    const { first, second } = this.data
    return {
      title: `${first} / ${second}`,
      path: `/pages/home/home`
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { first, second } = this.data
    return {
      title: `${first} / ${second}`
    }
  },

  goBack() {
    wx.navigateBack()
  }
})
