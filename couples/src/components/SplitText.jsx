import React from 'react';
import { motion } from 'framer-motion';

// 容器变体
const containerVariants = {
  hidden: { opacity: 0 },
  visible: (i = 1) => ({
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04 * i,
    },
  }),
};

// 子元素变体
const childVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    transition: {
      type: 'spring',
      damping: 12,
      stiffness: 100,
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 12,
      stiffness: 100,
    },
  },
};

const SplitText = ({ 
  text, 
  className = '', 
  charClassName = '',
  vertical = false, // 支持竖排文字
  delay = 0 // 延迟时间
}) => {
  if (!text) return null; // 防止空文本导致错误
  
  return (
    <motion.div
      className={`split-text-container ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      custom={delay}
      style={{ 
        display: 'inline-flex',
        flexDirection: vertical ? 'column' : 'row',
        flexWrap: vertical ? 'nowrap' : 'wrap',
        writingMode: vertical ? 'vertical-rl' : 'horizontal-tb',
        height: vertical ? '100%' : 'auto'
      }}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          className={`split-text-char ${charClassName}`}
          variants={childVariants}
          style={{ 
            display: 'inline-block',
            marginBottom: vertical ? '12px' : '0'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default SplitText; 