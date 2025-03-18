import React from 'react';
import { motion } from 'framer-motion';

// 容器变体
const containerVariants = {
  hidden: { opacity: 0 },
  visible: (i = 1) => ({
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.04 * i,
    },
  }),
};

// 子元素变体选项
const variants = {
  fadeUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', damping: 12, stiffness: 100 }
    }
  },
  fadeDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', damping: 12, stiffness: 100 }
    }
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  },
  scale: {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring', damping: 12, stiffness: 100 }
    }
  },
  rotate: {
    hidden: { opacity: 0, rotate: -45 },
    visible: { 
      opacity: 1, 
      rotate: 0,
      transition: { type: 'spring', damping: 12, stiffness: 100 }
    }
  }
};

const AdvancedSplitText = ({ 
  text, 
  className = '', 
  charClassName = '',
  type = 'chars', // 'chars' 或 'words'
  animation = 'fadeUp', // 动画类型
  staggerDelay = 0.12, // 错开延迟
  initialDelay = 0.04, // 初始延迟
}) => {
  // 选择动画变体
  const childVariants = variants[animation] || variants.fadeUp;
  
  // 自定义容器变体
  const customContainerVariants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay * i,
      },
    }),
  };

  // 按字符或单词分割
  const items = type === 'words' ? text.split(/\s+/) : text.split('');

  return (
    <motion.div
      className={`split-text-container ${className}`}
      variants={customContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, index) => (
        <motion.span
          key={`${item}-${index}`}
          className={`split-text-item ${charClassName}`}
          variants={childVariants}
          style={{ display: 'inline-block', whiteSpace: type === 'words' ? 'nowrap' : 'normal' }}
        >
          {item}
          {type === 'words' && index < items.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default AdvancedSplitText; 