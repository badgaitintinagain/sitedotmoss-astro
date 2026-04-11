"use client";
import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from './ThemeProvider';
import gsap from 'gsap';

const Background: React.FC = () => {
  const { theme, bgType, bgValue, glassBlur } = useTheme();
  const bgRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  // Separate effect for background color/image logic to prevent flashes
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!bgRef.current) return;

      if (bgType === 'color') {
        const targetColor = bgValue || (theme === 'dark' ? '#1A1410' : '#F2EBE3');
        gsap.to(bgRef.current, {
          backgroundColor: targetColor,
          backgroundImage: 'none',
          duration: 1.2,
          ease: 'power3.out',
          overwrite: 'auto',
          force3D: true, // Force GPU acceleration
        });
      } else if (bgType === 'image' && bgValue) {
        gsap.to(bgRef.current, {
          backgroundImage: `url(${bgValue})`,
          backgroundColor: theme === 'dark' ? '#1A1410' : '#F2EBE3',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          duration: 1,
          ease: 'power2.inOut',
          overwrite: 'auto',
          force3D: true, // Force GPU acceleration
        });
      }
    });

    return () => ctx.kill(); // Kill the animation without resetting properties
  }, [theme, bgType, bgValue]);

  // Separate effect for blur to prevent background reloading
  useEffect(() => {
    if (layerRef.current) {
      gsap.to(layerRef.current, {
        backdropFilter: `blur(${glassBlur}px)`,
        webkitBackdropFilter: `blur(${glassBlur}px)`,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  }, [glassBlur]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden select-none pointer-events-none">
      {/* Actual Background Content */}
      <div 
        ref={bgRef} 
        className="absolute inset-0 will-change-[background-color,background-image] transform-gpu" 
        style={{ backgroundColor: theme === 'dark' ? '#1A1410' : '#F2EBE3' }}
      />
      
      {/* Liquid Glass / Blur Layer */}
      <div 
        ref={layerRef}
        className="absolute inset-0 z-10"
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
