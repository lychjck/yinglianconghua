var app = getApp()
var highlightKeyword = require('../../utils/highlight.js').highlightKeyword

Page({
  data: {
    keyword: '',
    couplets: [],
    total: 0,
    page: 1,
    pageSize: 20,
    loading: false,
    allLoaded: false,
    searched: false,
    dynasties: [],
    occasions: [],
    books: [],
    dynastyIndex: 0,
    occasionIndex: 0,
    bookIndex: 0
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
      },
      fail: function () {
        wx.showToast({ title: '获取筛选选项失败', icon: 'none' })
      }
    })
  },

  onInputChange: function (e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch: function () {
    var keyword = this.data.keyword.trim()
    if (!keyword) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' })
      return
    }
    this.setData({ keyword: keyword })
    this.doSearch(true)
  },

  onCancel: function () {
    wx.navigateBack()
  },

  onDynastyChange: function (e) {
    this.setData({ dynastyIndex: e.detail.value })
    if (this.data.searched) {
      this.doSearch(true)
    }
  },

  onOccasionChange: function (e) {
    this.setData({ occasionIndex: e.detail.value })
    if (this.data.searched) {
      this.doSearch(true)
    }
  },

  onBookChange: function (e) {
    this.setData({ bookIndex: e.detail.value })
    if (this.data.searched) {
      this.doSearch(true)
    }
  },

  doSearch: function (reset) {
    if (this.data.loading) return
    if (!reset && this.data.allLoaded) return

    var keyword = this.data.keyword.trim()
    if (!keyword) return

    var that = this
    var page = reset ? 1 : this.data.page
    var params = {
      keyword: keyword,
      page: page,
      page_size: this.data.pageSize
    }

    if (this.data.dynastyIndex > 0) {
      params.dynasty = this.data.dynasties[this.data.dynastyIndex]
    }
    if (this.data.occasionIndex > 0) {
      params.occasion = this.data.occasions[this.data.occasionIndex]
    }
    if (this.data.bookIndex > 0) {
      params.book_name = this.data.books[this.data.bookIndex]
    }

    this.setData({ loading: true })

    wx.request({
      url: app.globalData.apiBaseUrl + '/api/v2/couplets/search',
      data: params,
      success: function (res) {
        var result = res.data || {}
        var newList = result.data || []
        var total = result.total || 0

        // Apply highlight to each result
        var highlighted = newList.map(function (item) {
          item.firstSegments = highlightKeyword(item.first || '', keyword)
          item.secondSegments = highlightKeyword(item.second || '', keyword)
          item.authorSegments = highlightKeyword(item.author || '', keyword)
          return item
        })

        var currentList = reset ? [] : that.data.couplets
        var merged = currentList.concat(highlighted)

        that.setData({
          couplets: merged,
          total: total,
          page: page + 1,
          loading: false,
          allLoaded: merged.length >= total,
          searched: true
        })
      },
      fail: function () {
        wx.showToast({ title: '搜索失败，请重试', icon: 'none' })
        that.setData({ loading: false })
      }
    })
  },

  onReachBottom: function () {
    this.doSearch(false)
  },

  goDetail: function (e) {
    var id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({
      url: '/pages/detail/detail?id=' + id
    })
  }
})
