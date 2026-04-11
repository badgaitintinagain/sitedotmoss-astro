"use client";
import React, { useRef, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import gsap from 'gsap';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (iconRef.current) {
      gsap.fromTo(iconRef.current, 
        { rotation: theme === 'dark' ? -180 : 0, opacity: 0, scale: 0.5 },
        { rotation: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }
      );
    }
  }, [theme]);

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-6 md:top-8 right-6 z-50 p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 transition-all duration-200 group backdrop-blur-xl shadow-lg hover:shadow-xl"
      aria-label="Toggle Theme"
    >
      <div ref={iconRef} className="flex items-center justify-center w-8 h-8">
        {theme === 'light' ? (
          <Sun size={18} className="text-amber-600 transition-colors" />
        ) : (
          <Moon size={18} className="text-indigo-400 transition-colors" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
