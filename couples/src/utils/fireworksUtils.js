/**
 * 创建从点击位置发射到顶部的烟花效果
 * 
 * @param {number} x - 点击位置的 X 坐标
 * @param {number} y - 点击位置的 Y 坐标
 * @returns {Array} - 烟花粒子数组
 */
export const createFireworkSparkles = (x, y) => {
  const newSparkles = [];
  
  // 烟花颜色 - 更鲜艳的颜色
  const colors = [
    '#FF0000', // 红色
    '#FFD700', // 金色
    '#00FFFF', // 青色
    '#FF00FF', // 品红
    '#00FF00', // 绿色
    '#0000FF', // 蓝色
    '#FF4500', // 橙红色
    '#9400D3'  // 紫色
  ];
  
  // 随机选择烟花主色调
  const mainColor = colors[Math.floor(Math.random() * colors.length)];
  
  // 1. 烟花发射轨迹 - 从点击位置发射到顶部
  const launchDuration = 0.8; // 发射持续时间
  const launchStartX = x;
  const launchStartY = y;
  const launchEndX = x + (Math.random() * 60 - 30); // 减小随机偏移
  const launchEndY = 50; // 固定在顶部位置
  
  // 发射轨迹 - 主体
  newSparkles.push({
    id: `launch-main-${Date.now()}`,
    x: launchStartX,
    y: launchStartY,
    targetX: launchEndX,
    targetY: launchEndY,
    size: 6, // 增大主体大小
    color: '#FFFFFF',
    duration: launchDuration,
    isLaunch: true
  });
  
  // 发射轨迹 - 光晕效果
  newSparkles.push({
    id: `launch-glow-${Date.now()}`,
    x: launchStartX,
    y: launchStartY,
    targetX: launchEndX,
    targetY: launchEndY,
    size: 12, // 更大的光晕
    color: '#FFCC00',
    duration: launchDuration,
    isLaunchGlow: true
  });
  
  // 发射轨迹的尾迹 - 更多的尾迹粒子
  for (let i = 0; i < 30; i++) {
    const progress = i / 30;
    const pathX = launchStartX + (launchEndX - launchStartX) * progress;
    const pathY = launchStartY + (launchEndY - launchStartY) * progress;
    
    // 添加一些随机偏移
    const offsetX = Math.random() * 8 - 4;
    const offsetY = Math.random() * 8 - 4;
    
    // 尾迹粒子
    newSparkles.push({
      id: `launch-trail-${Date.now()}-${i}`,
      x: pathX + offsetX,
      y: pathY + offsetY,
      targetX: pathX + offsetX * 2, // 让尾迹有一点扩散效果
      targetY: pathY + offsetY * 2,
      size: Math.random() * 3 + 1, // 随机大小
      color: i % 3 === 0 ? '#FFCC00' : '#FFFFFF', // 交替颜色
      duration: 0.4,
      delay: (i * launchDuration) / 40,
      isTrail: true
    });
    
    // 每隔几个粒子添加一个较大的火花
    if (i % 5 === 0) {
      newSparkles.push({
        id: `launch-spark-${Date.now()}-${i}`,
        x: pathX,
        y: pathY,
        targetX: pathX + (Math.random() * 20 - 10),
        targetY: pathY + (Math.random() * 20 - 10),
        size: Math.random() * 4 + 2,
        color: mainColor,
        duration: 0.3,
        delay: (i * launchDuration) / 40,
        isLaunchSpark: true
      });
    }
  }
  
  // 2. 爆炸效果 - 在顶部位置
  const explosionDelay = launchDuration;
  
  // 爆炸中心
  newSparkles.push({
    id: `explosion-center-${Date.now()}`,
    x: launchEndX,
    y: launchEndY,
    targetX: launchEndX,
    targetY: launchEndY,
    size: 30, // 更大的爆炸中心
    color: '#FFFFFF',
    duration: 0.4,
    delay: explosionDelay,
    isExplosionCenter: true
  });
  
  // 爆炸射线 - 第一波
  const rayCount1 = 30;
  for (let i = 0; i < rayCount1; i++) {
    const angle = (Math.PI * 2 * i) / rayCount1;
    const distance = Math.random() * 150 + 100;
    const duration = Math.random() * 0.4 + 0.3;
    
    newSparkles.push({
      id: `explosion-ray1-${Date.now()}-${i}`,
      x: launchEndX,
      y: launchEndY,
      targetX: launchEndX + Math.cos(angle) * distance,
      targetY: launchEndY + Math.sin(angle) * distance,
      size: Math.random() * 4 + 3,
      color: mainColor,
      duration: duration,
      delay: explosionDelay,
      isRay: true
    });
  }
  
  // 爆炸射线 - 第二波 (不同颜色)
  const rayCount2 = 25;
  const secondColor = colors[Math.floor(Math.random() * colors.length)];
  for (let i = 0; i < rayCount2; i++) {
    const angle = (Math.PI * 2 * i) / rayCount2 + (Math.PI / rayCount2);
    const distance = Math.random() * 130 + 80;
    const duration = Math.random() * 0.3 + 0.4;
    
    newSparkles.push({
      id: `explosion-ray2-${Date.now()}-${i}`,
      x: launchEndX,
      y: launchEndY,
      targetX: launchEndX + Math.cos(angle) * distance,
      targetY: launchEndY + Math.sin(angle) * distance,
      size: Math.random() * 3 + 2,
      color: secondColor,
      duration: duration,
      delay: explosionDelay + 0.1,
      isRay: true
    });
  }
  
  // 3. 散落的火花
  const sparkCount = 60;
  for (let i = 0; i < sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 200 + 50;
    const duration = Math.random() * 0.7 + 0.3;
    const size = Math.random() * 2 + 1;
    const sparkColor = colors[Math.floor(Math.random() * colors.length)];
    
    // 添加重力效果的终点偏移
    const gravity = 100 + Math.random() * 50;
    
    newSparkles.push({
      id: `spark-${Date.now()}-${i}`,
      x: launchEndX,
      y: launchEndY,
      targetX: launchEndX + Math.cos(angle) * distance,
      targetY: launchEndY + Math.sin(angle) * distance + gravity, // 添加重力效果
      size: size,
      color: sparkColor,
      duration: duration,
      delay: explosionDelay + Math.random() * 0.3,
      isSpark: true
    });
  }
  
  return newSparkles;
}; 