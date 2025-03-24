import React from 'react';
import { motion } from 'framer-motion';

/**
 * 烟花效果组件
 * 
 * @param {Object} props - 组件属性
 * @param {Array} props.sparkles - 烟花粒子数组
 */
const Fireworks = ({ sparkles }) => {
  if (!sparkles.length) return null;
  
  return (
    <div className="fireworks-container" style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      pointerEvents: 'none', 
      zIndex: 1000 
    }}>
      {sparkles.map(sparkle => (
        <motion.div
          key={sparkle.id}
          className={`sparkle ${
            sparkle.isLaunch ? 'sparkle-launch' : 
            sparkle.isLaunchGlow ? 'sparkle-launch-glow' :
            sparkle.isLaunchSpark ? 'sparkle-launch-spark' :
            sparkle.isTrail ? 'sparkle-trail' : 
            sparkle.isExplosionCenter ? 'sparkle-center' : 
            sparkle.isRay ? 'sparkle-ray' : 
            'sparkle-spark'
          }`}
          initial={{ 
            x: sparkle.x, 
            y: sparkle.y, 
            opacity: sparkle.isExplosionCenter ? 0 : 
                     sparkle.isLaunchGlow ? 0.7 : 1,
            scale: sparkle.isExplosionCenter ? 0 : 
                   sparkle.isLaunchGlow ? 0.5 : 1
          }}
          animate={{ 
            x: sparkle.targetX, 
            y: sparkle.targetY, 
            opacity: sparkle.isLaunch ? [1, 0.8, 0.6] : 
                     sparkle.isLaunchGlow ? [0.7, 0.5, 0] :
                     sparkle.isTrail ? [1, 0] : 
                     sparkle.isExplosionCenter ? [1, 0] : 
                     [1, 1, 0.8, 0],
            scale: sparkle.isExplosionCenter ? [0, 4, 0] : 
                   sparkle.isLaunchGlow ? [0.5, 1.5, 0] :
                   sparkle.isLaunch ? [1, 0.8, 0.6] : 
                   sparkle.isSpark ? [1, 0.5, 0] : 
                   [1, 0.8, 0]
          }}
          transition={{ 
            duration: sparkle.duration,
            ease: sparkle.isLaunch || sparkle.isLaunchGlow ? "linear" : 
                  sparkle.isSpark ? "easeOut" : 
                  "easeOut",
            delay: sparkle.delay || 0,
            times: sparkle.isExplosionCenter ? [0, 0.5, 1] : 
                   sparkle.isLaunch ? [0, 0.7, 1] : 
                   sparkle.isLaunchGlow ? [0, 0.7, 1] :
                   sparkle.isTrail ? [0, 1] : 
                   [0, 0.3, 0.7, 1]
          }}
          style={{
            position: 'absolute',
            width: sparkle.size,
            height: sparkle.size,
            borderRadius: '50%',
            backgroundColor: sparkle.color,
            boxShadow: `0 0 ${sparkle.isLaunchGlow ? sparkle.size * 4 : sparkle.size * 2}px ${sparkle.color}`,
            pointerEvents: 'none',
            filter: sparkle.isLaunchGlow ? 'blur(3px)' : 
                    sparkle.isLaunch ? 'blur(1px)' :
                    sparkle.isTrail ? 'blur(1px)' : 'none'
          }}
        />
      ))}
    </div>
  );
};

export default Fireworks; 