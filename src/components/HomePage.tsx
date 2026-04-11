"use client";
import React, { useState, useEffect, useRef, memo, useMemo } from "react";
import Tile from "@/components/Tile";
import WeatherTile from "@/components/WeatherTile";
import AdTile from "@/components/AdTile";
import CalendarTile from "@/components/CalendarTile";
import ClockTile from "@/components/ClockTile";
import ShoeDemoTile from "@/components/ShoeDemoTile";
import NextWbcTile from "@/components/NextWbcTile";
import SpotifyAnalysisTile from "@/components/SpotifyAnalysisTile";
import BlogTile from "@/components/BlogTile";
import ResourceTile from "@/components/ResourceTile";
import SettingsModal from "@/components/SettingsModal";
import ProfileButton from "@/components/ProfileButton";
import gsap from "gsap";
import { Settings, Users, PenTool, StickyNote } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DashboardTile {
  id: string;
  size: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  label?: string;
  icon?: LucideIcon;
  component?: React.ComponentType<Record<string, unknown>>;
  props?: Record<string, unknown>;
  accent?: 'primary' | 'secondary';
  opacity?: number;
}

interface DashboardGroup {
  title: string;
  tiles: DashboardTile[];
}

const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=60" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=60" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", image: "https://images.unsplash.com/photo-1485872232694-217b2ad2303e?auto=format&fit=crop&w=400&q=60" }
];

const HomePage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [randomQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  const dashboardConfig = useMemo<DashboardGroup[]>(() => {
    const baseGroups: DashboardGroup[] = [
      {
        title: "Life at a glance",
        tiles: [
          { id: 'clock', size: '2x2', component: ClockTile, label: 'Clock' },
          { id: 'calendar', size: '2x3', component: CalendarTile, label: 'Calendar' },
          { id: 'settings', size: '1x1', label: 'Settings', icon: Settings, accent: 'secondary', opacity: 60 },
          { id: 'quote', size: '3x2', accent: 'primary' },
          { id: 'ad', size: '3x2', component: AdTile, props: { title: "New Collection 2025", description: "Discover the future of design." } },
          { id: 'weather', size: '2x1', component: WeatherTile, label: 'Weather' }
        ]
      },
      {
        title: "AI Lab",
        tiles: [
          { id: 'spotify', size: '2x1', component: SpotifyAnalysisTile },
          { id: 'shoedemo', size: '2x2', component: ShoeDemoTile },
          { id: 'nextwbc', size: '2x1', component: NextWbcTile }
        ]
      },
      {
        title: "Work & Focus",
        tiles: [
          { id: 'blog', size: '2x2', component: BlogTile, label: 'Blog' },
          { id: 'tasks', size: '2x2', label: 'Tasks', icon: PenTool, accent: 'secondary', opacity: 40 },
          { id: 'resources', size: '1x1', component: ResourceTile, accent: 'primary', opacity: 25 },
          { id: 'notes', size: '1x1', label: 'Notes', icon: StickyNote, accent: 'secondary', opacity: 35 },
          { id: 'project', size: '2x3', label: 'Project Alpha', accent: 'secondary', opacity: 50 },
          { id: 'team', size: '2x2', label: 'Team', icon: Users, accent: 'primary', opacity: 35 }
        ]
      }
    ];

    return baseGroups.map(group => ({
      ...group,
      tiles: group.tiles.map(tile => {
        const accent = tile.accent || (Math.random() > 0.5 ? 'primary' : 'secondary');
        const opacity = tile.opacity || Math.floor(Math.random() * 31) + 45;

        return {
          ...tile,
          accent,
          opacity,
          props: {
            ...tile.props,
            accent,
            opacity,
            size: tile.size,
            label: tile.label
          }
        };
      })
    }));
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    gsap.from(".dashboard-header", {
      y: -20,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      force3D: true,
    });
  }, [mounted]);

  if (!mounted) return (
    <div className="min-h-screen w-full bg-[#F2EBE3] dark:bg-[#1A1410] flex items-center justify-center">
      <div className="text-foreground opacity-20 text-sm tracking-widest uppercase font-bold text-center">
        Loading...
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto font-sans flex items-center justify-center">
      <ProfileButton />
      <div className="absolute inset-0 bg-white/5 dark:bg-black/10 z-10 backdrop-blur-[1px] pointer-events-none" />

      <div className="relative z-20 w-full flex flex-col items-center justify-center py-12 min-h-screen">
        <div className="w-fit max-w-full px-6 md:px-12 lg:px-16">
          <header className="mb-8 text-left dashboard-header">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight text-foreground drop-shadow-sm">site(.)moss</h1>
          </header>

          <main className="dashboard-main w-fit max-w-full gap-x-8 gap-y-10 no-scrollbar pb-8">
            {dashboardConfig.map((group) => (
              <div key={group.title} className="flex flex-col gap-3 w-fit items-start flex-shrink-0">
                <h2 className="text-[10px] font-bold uppercase tracking-widest opacity-60 ml-1 text-foreground">
                  {group.title}
                </h2>
                <div className="grid grid-rows-5 grid-flow-col gap-1.5 h-[21.5rem] w-max">
                  {group.tiles.map((tile) => {
                    if (tile.component) {
                      const Component = tile.component;
                      return <Component key={tile.id} {...tile.props} />;
                    }

                    if (tile.id === 'quote') {
                      return (
                        <Tile key={tile.id} size={tile.size} bgImage={randomQuote.image} bgClass="bg-black/40 border-white/20" className="text-white">
                          <div className="flex flex-col items-center justify-center w-full h-full px-6 text-center">
                            <p className="text-xs italic font-medium leading-tight mb-2">&quot;{randomQuote.text}&quot;</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">- {randomQuote.author}</p>
                          </div>
                        </Tile>
                      );
                    }

                    const extraProps = tile.id === 'settings' ? { onClick: () => setIsSettingsOpen(true) } : {};

                    return (
                      <Tile
                        key={tile.id}
                        size={tile.size}
                        label={tile.label}
                        icon={tile.icon}
                        accentType={tile.accent}
                        opacity={tile.opacity}
                        {...extraProps}
                      >
                        {tile.id === 'project' && (
                          <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center">
                            <div className="w-10 h-10 rounded-full border-2 border-tile-text/30 flex items-center justify-center mb-1">
                              <span className="text-xs font-bold text-tile-text">75%</span>
                            </div>
                            <p className="text-[8px] font-bold uppercase tracking-tighter text-tile-text">In Progress</p>
                          </div>
                        )}
                      </Tile>
                    );
                  })}
                </div>
              </div>
            ))}
          </main>
        </div>
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default memo(HomePage);
