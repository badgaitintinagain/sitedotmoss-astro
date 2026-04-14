"use client";
import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';

const Background: React.FC = () => {
  const { theme, bgType, bgValue, glassBlur } = useTheme();
  const backgroundStyle = useMemo(() => {
    const fallbackColor = theme === 'dark' ? '#1A1410' : '#F2EBE3';
    if (bgType === 'image' && bgValue) {
      return {
        backgroundColor: fallbackColor,
        backgroundImage: `url(${bgValue})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }

    return {
      backgroundColor: bgValue || fallbackColor,
      backgroundImage: 'none',
      backgroundSize: 'auto',
      backgroundPosition: 'center',
    };
  }, [theme, bgType, bgValue]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden select-none pointer-events-none">
      {/* Actual Background Content */}
      <motion.div
        className="absolute inset-0 will-change-[background-color,background-image] transform-gpu" 
        animate={backgroundStyle}
        initial={false}
        transition={{ duration: bgType === 'image' ? 1 : 1.2, ease: 'easeOut' }}
      />
      
      {/* Liquid Glass / Blur Layer */}
      <motion.div
        className="absolute inset-0 z-10"
        animate={{
          backdropFilter: `blur(${glassBlur}px)`,
          WebkitBackdropFilter: `blur(${glassBlur}px)`,
        }}
        initial={false}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />

      {/* Subtle Noise Texture - Inline SVG for performance */}
      <div 
        className="absolute inset-0 z-20 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}
      />
      
      {/* Darken/Lighten Overlay for readability */}
      <div className={`absolute inset-0 z-30 transition-opacity duration-1000 ${
        theme === 'dark' ? 'bg-black/25' : 'bg-white/15'
      }`} />
    </div>
  );
};

export default memo(Background);
