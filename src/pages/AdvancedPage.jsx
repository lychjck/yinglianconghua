import React from 'react';
import AdvancedSplitText from '../components/AdvancedSplitText';
import '../components/SplitText.css';

const AdvancedPage = () => {
  return (
    <div className="page-container">
      <h1>
        <AdvancedSplitText 
          text="欢迎来到我的网站" 
          className="title-text"
          charClassName="title-char"
          animation="scale"
          staggerDelay={0.08}
        />
      </h1>
      
      <p>
        <AdvancedSplitText 
          text="这是一个使用文本分割动画的示例" 
          className="paragraph-text"
          charClassName="paragraph-char"
          type="words"
          animation="fadeUp"
          staggerDelay={0.1}
          initialDelay={0.2}
        />
      </p>
      
      <div className="feature-text">
        <AdvancedSplitText 
          text="旋转效果" 
          animation="rotate"
          staggerDelay={0.05}
        />
      </div>
    </div>
  );
};

export default AdvancedPage; 