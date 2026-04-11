"use client";
import React from 'react';
import { ExternalLink } from 'lucide-react';
import Tile from './Tile';

interface AdTileProps {
  title?: string;
  description?: string;
  image?: string;
  size?: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  accent?: 'primary' | 'secondary';
  opacity?: number;
}

const AdTile: React.FC<AdTileProps> = ({ 
  title = "Premium Experience", 
  description = "Upgrade your lifestyle with our latest collection.",
  image = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=420&q=60",
  size = "3x2",
  accent = "secondary",
  opacity = 35
}) => {
  return (
    <Tile 
      size={size} 
      label="Sponsored"
      accentType={accent}
      opacity={opacity}
      bgImage={image}
    >
      <div className="flex flex-col items-center text-center px-3 py-2 bg-black/50 backdrop-blur-md rounded-none border border-white/10 shadow-xl transform transition-all duration-500 group-hover:scale-105 mx-1 mb-0.5">
        <h3 className="text-[10px] font-bold leading-tight mb-0.5 text-white/90">{title}</h3>
        <p className="text-[7px] leading-tight opacity-100 text-zinc-100 max-w-[140px]">{description}</p>
        <div className="mt-1 flex items-center gap-1 text-white/80">
          <span className="text-[6px] font-bold uppercase tracking-widest">Learn More</span>
          <ExternalLink size={6} />
        </div>
      </div>
    </Tile>
  );
};

export default AdTile;
