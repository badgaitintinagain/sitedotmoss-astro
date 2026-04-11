"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import Tile from './Tile';
import { FileText } from 'lucide-react';

interface BlogTileProps {
  size?: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  accent?: 'primary' | 'secondary';
  opacity?: number;
}

const BlogTile: React.FC<BlogTileProps> = ({ size = '2x2', accent = 'primary', opacity = 40 }) => {
  const router = useRouter();

  return (
    <Tile 
      size={size} 
      label="Blog" 
      icon={FileText} 
      accentType={accent}
      opacity={opacity}
      onClick={() => router.push('/blog')}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="text-[10px] uppercase tracking-widest opacity-40 text-tile-text"></div>
      </div>
    </Tile>
  );
};

export default BlogTile;
