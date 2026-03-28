App({
  globalData: {
    apiBaseUrl: 'http://175.178.191.108:8023'
    // apiBaseUrl: 'http://127.0.0.1:8080'
  },

  onLaunch() {
    this.loadCustomFont()
  },

  loadCustomFont() {
    var url = this.globalData.apiBaseUrl + '/static/fonts/WenYue_subset.woff2'

    wx.loadFontFace({
      global: true,
      family: 'WenYueGuTiFangSong',
      source: 'url("' + url + '")',
      scopes: ['webview', 'native'],
      success: function () {
        console.log('[Font] 文悦古体仿宋加载成功')
      },
      fail: function (err) {
        console.warn('[Font] 字体加载失败:', err)
      }
    })
  }
})
