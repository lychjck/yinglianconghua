Page({
  data: {
    favorites: []
  },

  onShow: function () {
    var favorites = wx.getStorageSync('favorites') || []
    // 兼容旧版收藏数据：author/source 可能是 sql.NullString 对象
    favorites = favorites.map(function (item) {
      var fixed = Object.assign({}, item)
      if (fixed.author && typeof fixed.author === 'object') {
        fixed.author = fixed.author.String || ''
      }
      if (fixed.source && typeof fixed.source === 'object') {
        fixed.source = fixed.source.String || ''
      }
      // 旧版数据没有 book_name，尝试从 source 补充
      if (!fixed.book_name && fixed.source) {
        fixed.book_name = typeof fixed.source === 'string' ? fixed.source : ''
      }
      return fixed
    })
    this.setData({ favorites: favorites })
  },

  goDetail: function (e) {
    var item = e.currentTarget.dataset
    if (!item.id) return
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + item.id
    })
  },

  removeFavorite: function (e) {
    var index = e.currentTarget.dataset.index
    var that = this

    wx.showModal({
      title: '取消收藏',
      content: '确定要移除这副对联吗？',
      confirmText: '移除',
      confirmColor: '#8b2500',
      success: function (res) {
        if (res.confirm) {
          var favorites = that.data.favorites
          favorites.splice(index, 1)
          wx.setStorageSync('favorites', favorites)
          that.setData({ favorites: favorites })
          wx.showToast({ title: '已移除', icon: 'none' })
        }
      }
    })
  }
})
