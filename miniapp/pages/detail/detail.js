var app = getApp()

Page({
  data: {
    id: null,
    couplet: null,
    paragraph: null,
    paragraphs: [],
    loading: false,
    isFavorited: false
  },

  onLoad: function (options) {
    var id = options.id
    if (id) {
      this.setData({ id: parseInt(id) })
      this.fetchDetail(id)
    }
  },

  onShow: function () {
    this.checkFavorited()
  },

  fetchDetail: function (id) {
    var that = this
    this.setData({ loading: true })

    wx.request({
      url: app.globalData.apiBaseUrl + '/api/v2/couplets/' + id,
      success: function (res) {
        if (res.statusCode === 200) {
          var data = res.data
          var couplet = data.couplet || data
          var paragraph = data.paragraph || null
          var paragraphs = []
          if (paragraph && paragraph.content) {
            paragraphs = paragraph.content.split('\n').filter(function (p) { return p.trim() })
          }
          that.setData({
            couplet: couplet,
            paragraph: paragraph,
            paragraphs: paragraphs,
            loading: false
          })
          that.checkFavorited()
        } else {
          that.setData({ loading: false })
          wx.showToast({ title: '对联不存在', icon: 'none' })
        }
      },
      fail: function () {
        that.setData({ loading: false })
        wx.showToast({ title: '获取详情失败', icon: 'none' })
      }
    })
  },

  checkFavorited: function () {
    var couplet = this.data.couplet
    if (!couplet) return
    var favorites = wx.getStorageSync('favorites') || []
    var isFavorited = favorites.some(function (f) { return f.id === couplet.id })
    this.setData({ isFavorited: isFavorited })
  },

  toggleFavorite: function () {
    var couplet = this.data.couplet
    if (!couplet) return
    var favorites = wx.getStorageSync('favorites') || []

    if (this.data.isFavorited) {
      favorites = favorites.filter(function (f) { return f.id !== couplet.id })
      wx.setStorageSync('favorites', favorites)
      this.setData({ isFavorited: false })
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      favorites.unshift({
        id: couplet.id,
        first: couplet.first,
        second: couplet.second,
        author: couplet.author || '',
        dynasty: couplet.dynasty || '',
        occasion: couplet.occasion || '',
        location: couplet.location || '',
        note: couplet.note || '',
        paragraph_id: couplet.paragraph_id || null,
        book_name: couplet.book_name || '',
        volume: couplet.volume || '',
        confidence: couplet.confidence || 0,
        savedAt: Date.now()
      })
      wx.setStorageSync('favorites', favorites)
      this.setData({ isFavorited: true })
      wx.showToast({ title: '已收藏', icon: 'success' })
    }
  },

  copyCouplet: function () {
    var couplet = this.data.couplet
    if (!couplet) return
    wx.setClipboardData({
      data: couplet.first + '\n' + couplet.second,
      success: function () {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  shareCouplet: function () {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  onShareAppMessage: function () {
    var couplet = this.data.couplet
    if (!couplet) return
    return {
      title: couplet.first + ' / ' + couplet.second,
      path: '/pages/detail/detail?id=' + couplet.id
    }
  },

  onShareTimeline: function () {
    var couplet = this.data.couplet
    if (!couplet) return
    return {
      title: couplet.first + ' / ' + couplet.second
    }
  },

  goBack: function () {
    wx.navigateBack()
  }
})
