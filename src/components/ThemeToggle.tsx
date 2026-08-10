import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      className={`relative inline-flex items-center justify-center p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container border border-outline-variant/60 hover:border-primary transition-all duration-300 active:scale-90 shrink-0 ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun
          className={`w-5 h-5 absolute transition-all duration-300 transform ${
            theme === 'light'
              ? 'rotate-0 scale-100 text-amber-500 opacity-100'
              : 'rotate-90 scale-0 text-amber-500 opacity-0'
          }`}
        />
        <Moon
          className={`w-5 h-5 absolute transition-all duration-300 transform ${
            theme === 'dark'
              ? 'rotate-0 scale-100 text-primary opacity-100'
              : '-rotate-90 scale-0 text-primary opacity-0'
          }`}
        />
      </div>
    </button>
  );
};
