var app = getApp()

Page({
  data: {
    // 筛选选项
    dynasties: [],
    occasions: [],
    books: [],
    // 当前选中的筛选索引（0 = 全部）
    dynastyIndex: 0,
    occasionIndex: 0,
    bookIndex: 0,
    // 列表数据
    couplets: [],
    total: 0,
    page: 1,
    pageSize: 20,
    loading: false,
    allLoaded: false
  },

  onLoad: function () {
    this.fetchFilters()
  },

  fetchFilters: function () {
    var that = this
    wx.request({
      url: app.globalData.apiBaseUrl + '/api/v2/filters',
      success: function (res) {
        var data = res.data || {}
        that.setData({
          dynasties: ['全部朝代'].concat(data.dynasties || []),
          occasions: ['全部场合'].concat(data.occasions || []),
          books: ['全部书籍'].concat(data.books || [])
        })
        // 初始加载全部数据
        that.loadCouplets(true)
      },
      fail: function () {
        wx.showToast({ title: '获取筛选选项失败', icon: 'none' })
      }
    })
  },

  onDynastyChange: function (e) {
    this.setData({ dynastyIndex: e.detail.value })
    this.loadCouplets(true)
  },

  onOccasionChange: function (e) {
    this.setData({ occasionIndex: e.detail.value })
    this.loadCouplets(true)
  },

  onBookChange: function (e) {
    this.setData({ bookIndex: e.detail.value })
    this.loadCouplets(true)
  },

  loadCouplets: function (reset) {
    if (this.data.loading) return
    if (!reset && this.data.allLoaded) return

    var that = this
    var page = reset ? 1 : this.data.page
    var params = {
      page: page,
      page_size: this.data.pageSize
    }

    // 构建筛选参数
    var dynastyIndex = this.data.dynastyIndex
    var occasionIndex = this.data.occasionIndex
    var bookIndex = this.data.bookIndex

    if (dynastyIndex > 0) {
      params.dynasty = this.data.dynasties[dynastyIndex]
    }
    if (occasionIndex > 0) {
      params.occasion = this.data.occasions[occasionIndex]
    }
    if (bookIndex > 0) {
      params.book_name = this.data.books[bookIndex]
    }

    this.setData({ loading: true })

    wx.request({
      url: app.globalData.apiBaseUrl + '/api/v2/couplets',
      data: params,
      success: function (res) {
        var result = res.data || {}
        var newList = result.data || []
        var total = result.total || 0
        var currentList = reset ? [] : that.data.couplets
        var merged = currentList.concat(newList)

        that.setData({
          couplets: merged,
          total: total,
          page: page + 1,
          loading: false,
          allLoaded: merged.length >= total
        })
      },
      fail: function () {
        wx.showToast({ title: '加载失败', icon: 'none' })
        that.setData({ loading: false })
      }
    })
  },

  onReachBottom: function () {
    this.loadCouplets(false)
  },

  goDetail: function (e) {
    var id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + id
    })
  },

  getFilterSummary: function () {
    var parts = []
    if (this.data.dynastyIndex > 0) {
      parts.push(this.data.dynasties[this.data.dynastyIndex])
    }
    if (this.data.occasionIndex > 0) {
      parts.push(this.data.occasions[this.data.occasionIndex])
    }
    if (this.data.bookIndex > 0) {
      parts.push(this.data.books[this.data.bookIndex])
    }
    return parts.join(' · ') || '全部'
  }
})
