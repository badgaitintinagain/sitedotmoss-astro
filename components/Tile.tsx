"use client";
import React, { useRef, useEffect, memo } from 'react';
import type { LucideIcon } from 'lucide-react';

interface TileProps {
  size: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
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

const Tile: React.FC<TileProps> = memo(({ size, label, className = '', children, bgClass = '', bgImage, icon: Icon, onClick, accentType, opacity }) => {
  const tileRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const tile = tileRef.current;
    const glow = glowRef.current;
    if (!tile || !glow) return;

    let active = true;
    let cleanup: (() => void) | undefined;

    const run = async () => {
      const gsap = (await import('gsap')).default;
      if (!active) return;

      const ctx = gsap.context(() => {
        gsap.fromTo(tile,
          { opacity: 0, scale: 0.98, y: 5 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            delay: Math.random() * 0.3,
            clearProps: 'opacity,scale,y'
          }
        );

        const onMouseEnter = () => {
          gsap.to(glow, { opacity: 1, duration: 0.3, ease: 'power2.out' });
          gsap.to(tile, {
            y: -4,
            filter: 'brightness(1.1)',
            duration: 0.3,
            ease: 'power2.out',
            borderColor: 'rgba(255,255,255,0.6)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          });
        };

        const onMouseLeave = () => {
          gsap.to(glow, { opacity: 0, duration: 0.3, ease: 'power2.inOut' });
          gsap.to(tile, {
            y: 0,
            filter: 'brightness(1)',
            duration: 0.3,
            ease: 'power2.inOut',
            borderColor: 'rgba(255,255,255,0.25)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          });
        };

        const onMouseMove = (e: MouseEvent) => {
          const rect = tile.getBoundingClientRect();
          tile.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
          tile.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        };

        tile.addEventListener('mouseenter', onMouseEnter);
        tile.addEventListener('mouseleave', onMouseLeave);
        tile.addEventListener('mousemove', onMouseMove);

        cleanup = () => {
          tile.removeEventListener('mouseenter', onMouseEnter);
          tile.removeEventListener('mouseleave', onMouseLeave);
          tile.removeEventListener('mousemove', onMouseMove);
        };
      }, tile);

      cleanup = () => {
        ctx.revert();
      };
    };

    void run();

    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  return (
    <div 
      ref={tileRef}
      onClick={onClick}
      className={`tile relative overflow-hidden group ${sizeClasses[size]} flex flex-col ${isSmall ? 'justify-center items-center' : 'justify-end items-start'} p-2 text-left border cursor-pointer ${textClass} ${className}`}
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
      {bgImage && <div className="absolute inset-0 z-0 bg-black/40 group-hover:bg-black/25 transition-colors duration-500" />}

      {/* Gradient Blur Overlay */}
      <div 
        ref={glowRef}
        className="pointer-events-none absolute inset-0 opacity-0 z-0"
        style={{
          background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.4) 0%, transparent 60%)',
          filter: 'blur(20px)',
        }}
      />
      
      <div className={`relative z-10 flex-1 w-full flex items-center justify-center ${isSmall ? 'gap-2' : ''}`}>
        {Icon && <Icon size={isSmall ? 24 : 32} strokeWidth={1.5} className="opacity-90 flex-shrink-0" />}
        {children}
      </div>
      {!isSmall && label && (
        <span className="relative z-10 text-[7px] uppercase tracking-widest font-bold mt-auto opacity-80 drop-shadow-sm">
          {label}
        </span>
      )}
    </div>
  );
});

Tile.displayName = 'Tile';

export default Tile;
