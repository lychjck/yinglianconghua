#!/bin/bash
# 裁剪字库：从数据库中提取所有用到的汉字，生成子集化字体
# 用法: cd yinglianconghua/server && bash cut_font.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

FULL_FONT="static/fonts/WenYue_GuTiFangSong_F.otf"

if [ ! -f "$FULL_FONT" ]; then
  echo "❌ 找不到完整字体文件: $FULL_FONT"
  exit 1
fi

# 1. 从两个数据库导出所有用到的字符（去重合并）
echo "📖 提取字符..."
{
  # 原始对联库
  if [ -f yinglian.db ]; then
    sqlite3 yinglian.db "SELECT first || second FROM yinglian"
  fi
  # LLM 提取库
  if [ -f yinglian_extract.db ]; then
    sqlite3 yinglian_extract.db "SELECT first || second FROM couplets"
  fi
  # UI 界面文字（不在数据库中，但需要字体覆盖）
  echo "对联雅集楹联丛话浏览筛选朝代场合书籍全部共副"
  echo "我的收藏尚无在首页点击印章即可"
  echo "详情作者出处地点典故返回"
  echo "载入中展卷中已收藏分享复制保存到相册取消"
  echo "暂无匹配的对联暂无对联信息"
  echo "上拉加载更多已加载按"
  echo "发给好友保存图片生成图片复制文字分享此联"
  echo "点击空白处换一副点击查看出处"
} | fold -w 1 | sort -u > chars.txt

CHAR_COUNT=$(wc -l < chars.txt | tr -d ' ')
echo "   共 ${CHAR_COUNT} 个不重复字符"

# 2. 子集化 → WOFF2（前端 + 小程序用）
echo "✂️  生成 WenYue_subset.woff2 ..."
uvx --index-url https://mirrors.aliyun.com/pypi/simple/ \
  --from fonttools[woff] pyftsubset "$FULL_FONT" \
  --text-file=chars.txt \
  --flavor=woff2 \
  --output-file=static/fonts/WenYue_subset.woff2

# 3. 子集化 → OTF（后端渲染用）
echo "✂️  生成 WenYue_subset.otf ..."
uvx --index-url https://mirrors.aliyun.com/pypi/simple/ \
  --from fonttools pyftsubset "$FULL_FONT" \
  --text-file=chars.txt \
  --output-file=static/fonts/WenYue_subset.otf

# 显示结果
echo ""
echo "✅ 完成！"
ls -lh static/fonts/WenYue_subset.*
