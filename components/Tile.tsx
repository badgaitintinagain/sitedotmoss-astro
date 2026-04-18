"use client";
import React, { useMemo, useRef, useState, memo } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface TileProps {
  size: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  shape?: 'rect' | 'circle' | 'triangle';
  label?: string;
  className?: string;
  children?: React.ReactNode;
  bgClass?: string;
  bgImage?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  accentType?: 'primary' | 'secondary';
  opacity?: number;
}

const Tile: React.FC<TileProps> = memo(({ size, shape = 'rect', label, className = '', children, bgClass = '', bgImage, icon: Icon, onClick, accentType, opacity }) => {
  const tileRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const entryDelay = useMemo(() => Math.random() * 0.3, []);

  // Use a fallback opacity if not provided
  const effectiveOpacity = opacity !== undefined ? opacity / 100 : 0.45;

  // Determine text color based on background image or accent
  const textClass = bgImage ? 'text-white' : 'text-tile-text';

  const sizeClasses = {
    '1x1': 'tile-1x1 row-span-1 col-span-1',
    '2x1': 'tile-2x1 row-span-1 col-span-2',
    '2x2': 'tile-2x2 row-span-2 col-span-2',
    '2x3': 'tile-2x3 row-span-3 col-span-2',
    '3x2': 'tile-3x2 row-span-2 col-span-3',
  };

  const isSmall = size === '1x1' || size === '2x1';
  const shapeStyle = {
    borderRadius: shape === 'circle' ? '999px' : undefined,
    clipPath: shape === 'triangle' ? 'polygon(50% 0%, 2% 98%, 98% 98%)' : undefined,
  } as React.CSSProperties;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const tile = tileRef.current;
    if (!tile) return;
    const rect = tile.getBoundingClientRect();
    tile.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    tile.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={tileRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className={`tile relative overflow-hidden group ${sizeClasses[size]} flex flex-col ${isSmall ? 'justify-center items-center' : 'justify-end items-start'} p-2 text-left border cursor-pointer ${textClass} ${className}`}
      style={shapeStyle}
      initial={{ opacity: 0, scale: 0.98, y: 5 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: isHovered ? -4 : 0,
        filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
        borderColor: isHovered ? 'rgba(0,0,255,0.72)' : 'rgba(0,0,255,0.36)',
        boxShadow: isHovered ? '0 20px 40px rgba(0,0,255,0.22)' : '0 4px 12px rgba(0,0,255,0.1)'
      }}
      transition={{ duration: 0.3, ease: 'easeOut', opacity: { duration: 0.8, delay: entryDelay } }}
    >
      {/* Base Color Background (from Palette) */}
      {accentType && (
        <div 
          className="absolute inset-0 z-0 transition-colors duration-500"
          style={{ 
            backgroundColor: `var(--accent-${accentType})`,
            opacity: bgImage ? 0.35 : effectiveOpacity 
          }}
        />
      )}

      {/* Manual bgClass overlay (if provided) */}
      {bgClass && <div className={`absolute inset-0 z-0 ${bgClass}`} />}

      {/* Background Image */}
      {bgImage && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 blur-[1px]"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}
      {/* Dark Overlay for Image */}
      {bgImage && <div className="absolute inset-0 z-0 transition-colors duration-500" style={{ backgroundColor: isHovered ? 'rgba(0,0,255,0.28)' : 'rgba(0,0,255,0.45)' }} />}

      {/* Gradient Blur Overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 z-0"
        style={{
          background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,0,255,0.35) 0%, transparent 60%)',
          filter: 'blur(20px)',
        }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      />
      
      <div className={`relative z-10 flex-1 w-full flex items-center justify-center ${isSmall ? 'gap-2' : ''}`}>
        {Icon && <Icon size={isSmall ? 24 : 32} strokeWidth={1.5} className="opacity-90 flex-shrink-0" />}
        {children}
      </div>
      {label && !isSmall && (
        <span className="relative z-10 text-[7px] uppercase tracking-widest font-bold mt-auto opacity-80 drop-shadow-sm">
          {label}
        </span>
      )}
      {label && isSmall && (
        <span className="absolute bottom-2 left-2 z-10 text-[7px] uppercase tracking-widest font-bold opacity-80 drop-shadow-sm">
          {label}
        </span>
      )}
    </motion.div>
  );
});

Tile.displayName = 'Tile';

export default Tile;
