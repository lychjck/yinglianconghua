const fs = require('fs');
const path = require('path');

// 壁纸目录路径
const wallpaperDir = path.join(__dirname, '../public/wallpaper');
// 输出 JSON 文件路径
const outputFile = path.join(__dirname, '../src/wallpapers.json');

// 读取壁纸目录
fs.readdir(wallpaperDir, (err, files) => {
  if (err) {
    console.error('Error reading wallpaper directory:', err);
    return;
  }
  
  // 过滤出 .jpg 文件
  const wallpapers = files
    .filter(file => file.endsWith('.jpg'))
    .map(file => `wallpaper/${file}`);
  
  // 添加默认壁纸
  wallpapers.unshift('清恽寿平花卉山水图册其一.jpg');
  
  // 写入 JSON 文件
  fs.writeFile(outputFile, JSON.stringify(wallpapers, null, 2), err => {
    if (err) {
      console.error('Error writing wallpapers.json:', err);
      return;
    }
    console.log('Wallpaper list generated successfully!');
  });
}); 