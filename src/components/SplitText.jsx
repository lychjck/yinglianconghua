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

const SplitText = ({ text, className = '', charClassName = '' }) => {
  return (
    <motion.div
      className={`split-text-container ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          className={`split-text-char ${charClassName}`}
          variants={childVariants}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default SplitText; 