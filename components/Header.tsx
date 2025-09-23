import React from 'react';

interface HeaderProps {
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  return (
    <header className="absolute top-0 right-0 p-6 md:p-8 z-50">
      <button onClick={onLoginClick} className="font-serif-display text-4xl md:text-5xl text-gray-400 hover:text-white transition-colors duration-300" title="Member Login">
        K
      </button>
    </header>
  );
};

export default Header;
