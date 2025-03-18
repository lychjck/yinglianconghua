import React from 'react';
import SplitText from '../components/SplitText';
import '../components/SplitText.css';

const YourPage = () => {
  return (
    <div className="page-container">
      <h1>
        <SplitText 
          text="欢迎来到我的网站" 
          className="title-text"
          charClassName="title-char"
        />
      </h1>
      <p>
        <SplitText 
          text="这是一个使用文本分割动画的示例" 
          className="paragraph-text"
          charClassName="paragraph-char"
        />
      </p>
    </div>
  );
};

export default YourPage; 