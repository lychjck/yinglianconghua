// Feature: couplet-search, Property 7: 高亮函数文本完整性（Round-trip）
// **Validates: Requirements 6.1, 6.2**

var { describe, test } = require('node:test')
var assert = require('node:assert/strict')
var fc = require('fast-check')
var highlightKeyword = require('./utils/highlight.js').highlightKeyword

// Arbitrary for Chinese characters (common CJK Unified Ideographs range)
var chineseChar = fc.integer({ min: 0x4e00, max: 0x9fff }).map(function (cp) {
  return String.fromCharCode(cp)
})

// Arbitrary for non-empty Chinese text (1-50 characters)
var chineseText = fc.array(chineseChar, { minLength: 1, maxLength: 50 }).map(function (chars) {
  return chars.join('')
})

// Arbitrary for a keyword that is a substring of the text
var textAndSubstringKeyword = chineseText.chain(function (text) {
  return fc.record({
    text: fc.constant(text),
    keyword: fc.integer({ min: 0, max: text.length - 1 }).chain(function (start) {
      return fc.integer({ min: start + 1, max: text.length }).map(function (end) {
        return text.substring(start, end)
      })
    })
  })
})

// Arbitrary for a keyword that may or may not appear in the text
var textAndArbitraryKeyword = fc.record({
  text: chineseText,
  keyword: fc.oneof(
    chineseText,
    fc.constant(''),
    fc.string({ minLength: 1, maxLength: 10 })
  )
})

describe('Property 7: highlightKeyword round-trip text completeness', function () {
  test('concatenating all segments equals original text (substring keyword)', function () {
    fc.assert(
      fc.property(textAndSubstringKeyword, function (pair) {
        var segments = highlightKeyword(pair.text, pair.keyword)
        var concatenated = segments.map(function (s) { return s.text }).join('')
        assert.strictEqual(concatenated, pair.text)
      }),
      { numRuns: 100 }
    )
  })

  test('concatenating all segments equals original text (arbitrary keyword)', function () {
    fc.assert(
      fc.property(textAndArbitraryKeyword, function (pair) {
        var segments = highlightKeyword(pair.text, pair.keyword)
        var concatenated = segments.map(function (s) { return s.text }).join('')
        assert.strictEqual(concatenated, pair.text)
      }),
      { numRuns: 100 }
    )
  })

  test('concatenating all segments equals original text (ASCII + mixed strings)', function () {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 0, maxLength: 20 }),
        function (text, keyword) {
          var segments = highlightKeyword(text, keyword)
          var concatenated = segments.map(function (s) { return s.text }).join('')
          assert.strictEqual(concatenated, text)
        }
      ),
      { numRuns: 100 }
    )
  })
})
