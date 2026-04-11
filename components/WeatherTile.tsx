"use client";
import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, Snowflake, Wind } from 'lucide-react';
import Tile from './Tile';

const LOCATIONS = [
  { name: "Bangkok", lat: 13.7563, lon: 100.5018, image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=400&q=80" },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503, image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400&q=80" },
  { name: "London", lat: 51.5074, lon: -0.1278, image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=400&q=80" },
  { name: "New York", lat: 40.7128, lon: -74.0060, image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=400&q=80" },
  { name: "Paris", lat: 48.8566, lon: 2.3522, image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80" },
  { name: "Sydney", lat: -33.8688, lon: 151.2093, image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=400&q=80" },
  { name: "Dubai", lat: 25.2048, lon: 55.2708, image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=400&q=80" },
  { name: "Reykjavik", lat: 64.1466, lon: -21.9426, image: "https://images.unsplash.com/photo-1529963183134-61a90db47eaf?auto=format&fit=crop&w=400&q=80" }
];

const getWeatherIcon = (code: number) => {
  if (code === 0) return Sun;
  if (code >= 1 && code <= 3) return Cloud;
  if (code >= 45 && code <= 48) return Wind;
  if (code >= 51 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return Snowflake;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 95 && code <= 99) return CloudLightning;
  return Cloud;
};

interface WeatherProps {
  size?: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  accent?: 'primary' | 'secondary';
  opacity?: number;
}

const WeatherTile: React.FC<WeatherProps> = ({ size = '2x1', accent = 'primary', opacity = 45 }) => {
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  const [loading, setLoading] = useState(true);
  
  const location = useMemo(() => {
    // Pick a random location
    return LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  }, []);

  const fetchWeather = useCallback(async () => {
    if (!location) return;
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true`
      );
      const data = await response.json();
      if (data.current_weather) {
        setWeather({
          temp: Math.round(data.current_weather.temperature),
          code: data.current_weather.weathercode
        });
      }
    } catch (error) {
      console.error("Failed to fetch weather:", error);
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const Icon = weather ? getWeatherIcon(weather.code) : Cloud;

  return (
    <Tile 
      size={size} 
      label={location.name} 
      icon={Icon} 
      accentType={accent}
      opacity={opacity}
      bgImage={location.image}
    >
      <div className="flex flex-col items-center justify-center h-full w-full pointer-events-none">
        {loading ? (
          <div className="animate-pulse bg-white/20 h-6 w-12 rounded" />
        ) : (
          <div className="flex flex-col items-center bg-black/40 backdrop-blur-md px-3 py-1.5 border border-white/10 shadow-xl">
            <p className="text-xl font-medium leading-none tracking-tighter text-white drop-shadow-md">{weather?.temp}°C</p>
            <p className="text-[7px] uppercase tracking-[0.3em] font-bold text-white/90 mt-1">{location.name}</p>
          </div>
        )}
      </div>
    </Tile>
  );
};

export default memo(WeatherTile);
