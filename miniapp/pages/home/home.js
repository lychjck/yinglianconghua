var app = getApp()
var shareCard = require('../../utils/shareCard')

Page({
  data: {
    couplet: null,
    firstChars: [],
    secondChars: [],
    loading: false,
    animating: false,
    isFavorited: false,
    showShare: false,
    showPreview: false,
    canvasW: 300,
    canvasH: 500
  },

  onLoad: function () {
    this.fetchRandom()
  },

  onShow: function () {
    this.checkFavorited()
  },

  onPullDownRefresh: function () {
    var that = this
    this.fetchRandom().then(function () {
      wx.stopPullDownRefresh()
    })
  },

  fetchRandom: function () {
    if (this.data.loading) return Promise.resolve()
    var that = this
    this.setData({ loading: true, animating: false })

    return new Promise(function (resolve) {
      wx.request({
        url: app.globalData.apiBaseUrl + '/api/couplets/random',
        success: function (res) {
          var couplet = res.data
          that.setData({
            couplet: couplet,
            firstChars: couplet.first.split(''),
            secondChars: couplet.second.split(''),
            loading: false
          })
          that.checkFavorited()
          setTimeout(function () {
            that.setData({ animating: true })
          }, 50)
        },
        fail: function () {
          wx.showToast({ title: '获取对联失败', icon: 'none' })
          that.setData({ loading: false })
        },
        complete: resolve
      })
    })
  },

  checkFavorited: function () {
    var couplet = this.data.couplet
    if (!couplet) return
    var favorites = wx.getStorageSync('favorites') || []
    var isFavorited = favorites.some(function (f) { return f.id === couplet.id })
    this.setData({ isFavorited: isFavorited })
  },

  saveFavorite: function () {
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

  goDetail: function () {
    var couplet = this.data.couplet
    if (!couplet || !couplet.ref) return
    wx.navigateTo({
      url: '/pages/detail/detail?ref=' + couplet.ref +
        '&first=' + encodeURIComponent(couplet.first) +
        '&second=' + encodeURIComponent(couplet.second)
    })
  },

  // ===== 分享相关 =====
  showShareSheet: function () {
    this.setData({ showShare: true })
  },

  hideShareSheet: function () {
    this.setData({ showShare: false })
  },

  // 分享给好友
  onShareAppMessage: function () {
    var couplet = this.data.couplet
    if (!couplet) return
    return {
      title: couplet.first + ' / ' + couplet.second,
      path: '/pages/home/home'
    }
  },

  // 分享到朋友圈
  onShareTimeline: function () {
    var couplet = this.data.couplet
    if (!couplet) return
    return {
      title: couplet.first + ' / ' + couplet.second
    }
  },

  // 复制文字
  copyCouplet: function () {
    var couplet = this.data.couplet
    if (!couplet) return
    wx.setClipboardData({
      data: couplet.first + '\n' + couplet.second,
      success: function () {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
    this.setData({ showShare: false })
  },

  // 生成图片
  saveAsImage: function () {
    var that = this
    this.setData({ showShare: false, showPreview: true })

    wx.showLoading({ title: '生成中...' })

    setTimeout(function () {
      var query = wx.createSelectorQuery()
      query.select('#shareCanvas')
        .fields({ node: true, size: true })
        .exec(function (res) {
          if (!res || !res[0] || !res[0].node) {
            wx.hideLoading()
            wx.showToast({ title: '生成失败', icon: 'none' })
            that.setData({ showPreview: false })
            return
          }
          var canvas = res[0].node
          var sysInfo = wx.getSystemInfoSync()
          var dpr = sysInfo.pixelRatio
          var couplet = that.data.couplet
          var source = (couplet.source && couplet.source.String) || '楹联丛话'

          shareCard.drawShareCard(canvas, {
            first: couplet.first,
            second: couplet.second,
            source: source,
            dpr: dpr
          }).then(function (size) {
            // 计算显示尺寸：限制在屏幕 70% 宽度内
            var maxDisplayW = sysInfo.windowWidth * 0.7
            var maxDisplayH = sysInfo.windowHeight * 0.6
            var scale = Math.min(maxDisplayW / size.width, maxDisplayH / size.height, 1)
            var displayW = Math.floor(size.width * scale)
            var displayH = Math.floor(size.height * scale)

            that.setData({
              canvasW: displayW,
              canvasH: displayH
            })
            that._shareCanvas = canvas
            wx.hideLoading()
          })
        })
    }, 500)
  },

  // 保存到相册
  doSaveImage: function () {
    var that = this
    var canvas = this._shareCanvas
    if (!canvas) {
      wx.showToast({ title: '请重试', icon: 'none' })
      return
    }

    wx.canvasToTempFilePath({
      canvas: canvas,
      success: function (res) {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function () {
            wx.showToast({ title: '已保存到相册', icon: 'success' })
            that.setData({ showPreview: false })
          },
          fail: function (err) {
            if (err.errMsg.indexOf('auth deny') >= 0 || err.errMsg.indexOf('authorize') >= 0) {
              wx.showModal({
                title: '需要相册权限',
                content: '请在设置中允许保存图片到相册',
                confirmText: '去设置',
                success: function (modalRes) {
                  if (modalRes.confirm) {
                    wx.openSetting()
                  }
                }
              })
            } else {
              wx.showToast({ title: '保存失败', icon: 'none' })
            }
          }
        })
      },
      fail: function () {
        wx.showToast({ title: '生成图片失败', icon: 'none' })
      }
    })
  },

  hidePreview: function () {
    this.setData({ showPreview: false })
  }
})
