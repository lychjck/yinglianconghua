App({
  globalData: {
    apiBaseUrl: 'http://175.178.191.108:8023',
    // 自定义字体 URL（必须 https），把 WenYue_GuTiFangSong_F.otf 上传到服务器/CDN 后填入
    fontUrl: ''
  },

  onLaunch() {
    this.loadCustomFont()
  },

  loadCustomFont() {
    const url = this.globalData.fontUrl
    if (!url) return

    wx.loadFontFace({
      global: true,
      family: 'WenYueGuTiFangSong',
      source: `url("${url}")`,
      scopes: ['webview', 'native'],
      success: () => console.log('[Font] 文悦古体仿宋加载成功'),
      fail: (err) => console.warn('[Font] 字体加载失败:', err)
    })
  }
})
