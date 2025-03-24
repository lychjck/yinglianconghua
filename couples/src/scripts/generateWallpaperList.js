/**
 * 壁纸列表生成脚本
 * 
 * 此脚本用于扫描 public/wallpaper 目录下的所有 .jpg 文件，
 * 并生成一个包含所有壁纸路径的 JSON 文件，供前端应用使用。
 */

const fs = require('fs');
const path = require('path');

// 壁纸目录路径
const wallpaperDir = path.join(__dirname, '../../public/wallpaper');
// 输出 JSON 文件路径
const outputFile = path.join(__dirname, '../wallpapers.json');

/**
 * 读取壁纸目录并生成 JSON 文件
 */
function generateWallpaperList() {
  console.log('开始扫描壁纸目录...');
  
  // 检查壁纸目录是否存在
  if (!fs.existsSync(wallpaperDir)) {
    console.error(`错误: 壁纸目录不存在: ${wallpaperDir}`);
    console.log('创建壁纸目录...');
    fs.mkdirSync(wallpaperDir, { recursive: true });
    console.log(`壁纸目录已创建: ${wallpaperDir}`);
  }
  
  // 读取壁纸目录
  fs.readdir(wallpaperDir, (err, files) => {
    if (err) {
      console.error('读取壁纸目录时出错:', err);
      return;
    }
    
    // 过滤出 .jpg 文件
    const wallpapers = files
      .filter(file => file.toLowerCase().endsWith('.jpg'))
      .map(file => `wallpaper/${file}`);
    
    console.log(`找到 ${wallpapers.length} 个壁纸文件`);
    
    // 添加默认壁纸
    if (!wallpapers.includes('清恽寿平花卉山水图册其一.jpg')) {
      wallpapers.unshift('清恽寿平花卉山水图册其一.jpg');
      console.log('已添加默认壁纸');
    }
    
    // 写入 JSON 文件
    fs.writeFile(outputFile, JSON.stringify(wallpapers, null, 2), err => {
      if (err) {
        console.error('写入 wallpapers.json 时出错:', err);
        return;
      }
      console.log(`壁纸列表已成功生成: ${outputFile}`);
    });
  });
}

// 执行生成函数
generateWallpaperList();

// 导出函数以便其他模块使用
module.exports = generateWallpaperList; 