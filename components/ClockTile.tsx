"use client";
import React, { useEffect, useRef, useState, memo } from "react";
import Tile from "./Tile";

interface ClockProps {
  size?: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  accent?: 'primary' | 'secondary';
  opacity?: number;
  label?: string;
}

const ClockTile: React.FC<ClockProps> = ({ size = '2x2', accent = 'primary', opacity = 55, label = 'Clock' }) => {
  const minutesRef = useRef<HTMLSpanElement>(null);
  const hoursRef = useRef<HTMLSpanElement>(null);
  const [digitalTime, setDigitalTime] = useState("");

  useEffect(() => {
    function setTime() {
      const now = new Date();
      const seconds = now.getSeconds();
      const minutes = now.getMinutes();
      const hours = now.getHours();

      // Analog logic (smoother with fractional rotations)
      const minutesDegrees = (minutes / 60) * 360 + (seconds / 60) * 6 + 90;
      const hoursDegrees = (hours / 12) * 360 + (minutes / 60) * 30 + 90;

      if (minutesRef.current) {
        minutesRef.current.style.transform = `rotate(${minutesDegrees}deg)`;
      }
      if (hoursRef.current) {
        hoursRef.current.style.transform = `rotate(${hoursDegrees}deg)`;
      }

      setDigitalTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }

    const intervalId = setInterval(setTime, 1000);
    setTime(); 

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Tile size={size} accentType={accent} opacity={opacity} label={label}>
      <div className="relative w-full flex flex-col items-center justify-center p-1 pointer-events-none">
        {/* Analog Clock Face */}
        <div className="clock-face relative w-16 h-16 border-2 border-tile-text/40 rounded-full flex items-center justify-center bg-white/10 dark:bg-black/20 backdrop-blur-sm">
          <div className="center-dot w-1.5 h-1.5 bg-tile-text rounded-full z-30 shadow-sm" />
          
          <span ref={hoursRef} className="hand hour-hand" />
          <span ref={minutesRef} className="hand min-hand" />
          
          {/* Subtle Hour Markers */}
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-full h-full" 
              style={{ transform: `rotate(${i * 90}deg)` }}
            >
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-tile-text/60" />
            </div>
          ))}
        </div>

        {/* Digital Clock Label */}
        <div className="mt-2 text-[10px] font-mono tracking-[0.2em] text-tile-text bg-white/20 dark:bg-black/30 px-3 py-1 border border-white/10">
          {digitalTime || "--:--"}
        </div>
      </div>

      <style>{`
        .clock-face {
          box-shadow: 0 4px 20px rgba(0,0,0,0.05), inset 0 0 10px rgba(255,255,255,0.05);
        }
        .hand {
          position: absolute;
          top: 50%;
          right: 50%;
          background: currentColor;
          transform-origin: 100%;
          transform: rotate(90deg);
          transition: transform 0.1s cubic-bezier(0.4, 2.3, 0.3, 1);
        }
        .hour-hand {
          width: 25%;
          height: 3px;
          z-index: 10;
        }
        .min-hand {
          width: 38%;
          height: 1.5px;
          z-index: 11;
          opacity: 0.9;
        }
      `}</style>
    </Tile>
  );
};

export default memo(ClockTile);
