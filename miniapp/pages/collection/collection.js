Page({
  data: {
    favorites: []
  },

  onShow() {
    // 每次显示时重新读取收藏（从详情页返回时可能有变化）
    const favorites = wx.getStorageSync('favorites') || []
    this.setData({ favorites })
  },

  // 点击跳转详情
  goDetail(e) {
    const { ref, first, second } = e.currentTarget.dataset
    if (!ref) return

    wx.navigateTo({
      url: `/pages/detail/detail?ref=${ref}&first=${encodeURIComponent(first)}&second=${encodeURIComponent(second)}`
    })
  },

  // 长按删除收藏
  removeFavorite(e) {
    const { index } = e.currentTarget.dataset

    wx.showModal({
      title: '取消收藏',
      content: '确定要移除这副对联吗？',
      confirmText: '移除',
      confirmColor: '#8b2500',
      success: (res) => {
        if (res.confirm) {
          let favorites = this.data.favorites
          favorites.splice(index, 1)
          wx.setStorageSync('favorites', favorites)
          this.setData({ favorites })
          wx.showToast({ title: '已移除', icon: 'none' })
        }
      }
    })
  }
})
