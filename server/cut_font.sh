# 安装
uv init venv
uv pip install fonttools brotli

# 1. 导出所有用到的字符
sqlite3 yinglian.db "SELECT first || second FROM yinglian" | fold -w 1 | sort -u > chars.txt

# 2. 子集化 + 转 WOFF2
pyftsubset WenYue_GuTiFangSong_F.otf \
  --text-file=chars.txt \
  --flavor=woff2 \
  --output-file=WenYue_subset.woff2

# 3. 也生成一个子集化的 OTF（后端渲染用）
pyftsubset WenYue_GuTiFangSong_F.otf \
  --text-file=chars.txt \
  --output-file=WenYue_subset.otf
