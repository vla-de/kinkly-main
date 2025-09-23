
import React, { useState, useEffect } from 'react';

interface RotatingTextProps {
  texts: string[];
}

const RotatingText: React.FC<RotatingTextProps> = ({ texts }) => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % texts.length);
        setVisible(true);
      }, 1500); // Time for fade-out animation
    }, 4500); // 3s display + 1.5s fade-out

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texts.length]);

  return (
    <span className={visible ? 'fade-in' : 'fade-out'}>
      {texts[index]}
    </span>
  );
};

export default RotatingText;
