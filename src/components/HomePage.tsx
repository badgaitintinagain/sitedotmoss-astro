"use client";
import React, { useState, memo, useMemo, useEffect } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import Background from "@/components/Background";
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
import PhotosTile from "@/components/PhotosTile";
import SettingsModal from "@/components/SettingsModal";
import ProfileButton from "@/components/ProfileButton";
import { Settings, Users, PenTool, Newspaper, LayoutGrid, ArrowRight, Shield, ChevronDown, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface DashboardTile {
  id: string;
  size: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  shape?: 'rect' | 'circle' | 'triangle';
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
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" }
];

type UiMode = 'apple' | 'legacy';
const SITE_UI_MODE_EVENT = 'site-ui-mode-change';
const SITE_UI_MODE_KEY = 'site-ui-mode';

const TILE_NAME_FALLBACK: Record<string, string> = {
  clock: 'Clock',
  calendar: 'Calendar',
  settings: 'Settings',
  quote: 'Quote',
  ad: 'Ad',
  weather: 'Weather',
  blog: 'Blog',
  tasks: 'Tasks',
  resources: 'Resources',
  photos: 'Photos',
  project: 'Project Alpha',
  team: 'Team',
  spotify: 'Spotify Analysis',
  shoedemo: 'Shoe Demo',
  nextwbc: 'Next WBC'
};

const HomePage = () => {
  const [mounted] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [uiMode, setUiMode] = useState<UiMode>('apple');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [fullscreenTilePreviewId, setFullscreenTilePreviewId] = useState<string | null>(null);
  const [windowsTilePreviewIds, setWindowsTilePreviewIds] = useState<string[]>([]);
  const [pendingReplaceTileId, setPendingReplaceTileId] = useState<string | null>(null);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [randomQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  const applyUiMode = (mode: UiMode) => {
    setUiMode(mode);
    setFullscreenTilePreviewId(null);
    setWindowsTilePreviewIds([]);
    setPendingReplaceTileId(null);
    localStorage.setItem(SITE_UI_MODE_KEY, mode);
    document.documentElement.setAttribute('data-ui-mode', mode);
    window.dispatchEvent(new CustomEvent(SITE_UI_MODE_EVENT, { detail: { mode } }));
  };

  // Initialize UI mode from localStorage
  useEffect(() => {
    const mode = localStorage.getItem(SITE_UI_MODE_KEY) as UiMode | null;
    const resolvedMode = mode === 'legacy' ? 'legacy' : 'apple';
    setUiMode(resolvedMode);
    document.documentElement.setAttribute('data-ui-mode', resolvedMode);

    // Listen for mode changes from other sources (Settings modal header buttons)
    const handleModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ mode: UiMode }>;
      const nextMode = customEvent.detail?.mode;
      if (!nextMode) return;
      setUiMode(nextMode);
      document.documentElement.setAttribute('data-ui-mode', nextMode);
    };
    window.addEventListener(SITE_UI_MODE_EVENT, handleModeChange);
    return () => window.removeEventListener(SITE_UI_MODE_EVENT, handleModeChange);
  }, []);

  useEffect(() => {
    const onWindowClick = () => setActiveDropdown(null);
    window.addEventListener('click', onWindowClick);
    return () => window.removeEventListener('click', onWindowClick);
  }, []);

  const dashboardConfig = useMemo<DashboardGroup[]>(() => {
    const baseGroups: DashboardGroup[] = [
      {
        title: "Life at a glance",
        tiles: [
          { id: 'clock', size: '2x2', component: ClockTile, label: 'Clock' },
          { id: 'calendar', size: '2x3', component: CalendarTile, label: 'Calendar' },
          { id: 'settings', size: '1x1', shape: 'circle', label: 'Settings', icon: Settings, accent: 'secondary', opacity: 100 },
          { id: 'quote', size: '3x2', accent: 'primary', opacity: 92 },
          { id: 'ad', size: '3x2', component: AdTile, props: { title: "New Collection 2025", description: "Discover the future of design." } },
          { id: 'weather', size: '2x1', component: WeatherTile, label: 'Weather' }
        ]
      },
      {
        title: "Work & Focus",
        tiles: [
          { id: 'blog', size: '2x2', component: BlogTile, label: 'Blog' },
          { id: 'tasks', size: '2x2', label: 'Tasks', icon: PenTool, accent: 'secondary', opacity: 40 },
          { id: 'resources', size: '1x1', shape: 'triangle', component: ResourceTile, accent: 'primary', opacity: 100 },
          { id: 'photos', size: '2x1', component: PhotosTile, label: 'Photos', accent: 'primary', opacity: 35 },
          { id: 'project', size: '2x3', label: 'Project Alpha', accent: 'secondary', opacity: 50 },
          { id: 'team', size: '2x2', label: 'Team', icon: Users, accent: 'primary', opacity: 35 }
        ]
      },
      {
        title: "AI Lab",
        tiles: [
          { id: 'spotify', size: '2x1', component: SpotifyAnalysisTile },
          { id: 'shoedemo', size: '2x2', component: ShoeDemoTile },
          { id: 'nextwbc', size: '2x1', component: NextWbcTile }
        ]
      }
    ];

    return baseGroups.map((group, groupIndex) => ({
      ...group,
      tiles: group.tiles.map((tile, tileIndex) => {
        const accent = tile.accent || (groupIndex % 2 === 0 ? 'primary' : 'secondary');
        const opacity = tile.opacity || 44 + ((tileIndex + groupIndex) % 4) * 7;

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

  const getTileLabel = (tile: DashboardTile) => tile.label || TILE_NAME_FALLBACK[tile.id] || tile.id;
  const getTileLabelById = (tileId: string) => {
    const tile = allTiles.find((item) => item.id === tileId);
    if (tile) return getTileLabel(tile);
    return TILE_NAME_FALLBACK[tileId] || tileId;
  };

  const allTiles = useMemo(() => dashboardConfig.flatMap((group) => group.tiles), [dashboardConfig]);
  const fullscreenTilePreview = useMemo(
    () => allTiles.find((tile) => tile.id === fullscreenTilePreviewId) || null,
    [allTiles, fullscreenTilePreviewId]
  );
  const windowsTilePreviews = useMemo(
    () => windowsTilePreviewIds.map((id) => allTiles.find((tile) => tile.id === id)).filter(Boolean) as DashboardTile[],
    [allTiles, windowsTilePreviewIds]
  );

  const closeFullscreenPreview = () => {
    setFullscreenTilePreviewId(null);
  };

  const closeWindowsPreview = (tileId?: string) => {
    if (!tileId) {
      setWindowsTilePreviewIds([]);
      setPendingReplaceTileId(null);
      return;
    }
    setWindowsTilePreviewIds((prev) => {
      const next = prev.filter((id) => id !== tileId);
      if (next.length < 2) {
        setPendingReplaceTileId(null);
      }
      return next;
    });
  };

  const replaceWindowsPane = (side: 'left' | 'right') => {
    if (!pendingReplaceTileId) return;
    setWindowsTilePreviewIds((prev) => {
      if (prev.length < 2) return prev;
      if (side === 'left') return [pendingReplaceTileId, prev[1]];
      return [prev[0], pendingReplaceTileId];
    });
    setPendingReplaceTileId(null);
  };

  const handleSplitDragStart = (event: React.PointerEvent<HTMLButtonElement>) => {
    const container = event.currentTarget.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startX = event.clientX;
    const startRatio = splitRatio;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaPx = moveEvent.clientX - startX;
      const deltaRatio = deltaPx / rect.width;
      const nextRatio = Math.min(0.65, Math.max(0.35, startRatio + deltaRatio));
      setSplitRatio(nextRatio);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  useEffect(() => {
    if (!fullscreenTilePreviewId && windowsTilePreviewIds.length === 0) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFullscreenPreview();
        closeWindowsPreview();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [fullscreenTilePreviewId, windowsTilePreviewIds]);

  const renderTileContent = (tile: DashboardTile) => {
    if (tile.component) {
      const Component = tile.component;
      return <Component {...tile.props} />;
    }

    if (tile.id === 'quote') {
      return (
        <Tile size={tile.size} shape={tile.shape} className="text-white">
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
        size={tile.size}
        shape={tile.shape}
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
  };

  const handleTileShortcut = (tileId: string) => {
    setActiveDropdown(null);

    if (tileId === 'blog') {
      window.location.href = '/blog';
      return;
    }

    if (tileId === 'settings') {
      setIsSettingsOpen(true);
      return;
    }

    if (uiMode === 'apple') {
      setFullscreenTilePreviewId(tileId);
      return;
    }

    setPendingReplaceTileId(null);
    setWindowsTilePreviewIds((prev) => {
      if (prev.includes(tileId)) return prev;
      if (prev.length < 2) return [...prev, tileId];
      setPendingReplaceTileId(tileId);
      return prev;
    });
  };

  if (!mounted) return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center">
      <div className="text-foreground opacity-20 text-sm tracking-widest uppercase font-bold text-center">
        Loading...
      </div>
    </div>
  );

  return (
    <ThemeProvider>
      <Background />
      <div className="home-shell-wrapper">
        {/* Header with UI mode controls */}
        <header className="home-header">
          <div className="home-header__inner">
            <h1 className="home-header__title">site(.)moss</h1>
            <nav className="home-header__menu" aria-label="Group tile menu">
              {dashboardConfig.map((group) => {
                const isOpen = activeDropdown === group.title;

                return (
                  <div key={group.title} className="home-header__dropdown" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={`home-header__dropdown-trigger ${isOpen ? 'is-open' : ''}`}
                      onClick={() => setActiveDropdown(isOpen ? null : group.title)}
                      aria-expanded={isOpen}
                    >
                      <span>{group.title}</span>
                      <ChevronDown size={14} />
                    </button>
                    {isOpen && (
                      <div className="home-header__dropdown-menu" role="menu">
                        {group.tiles.map((tile) => (
                          <button
                            key={tile.id}
                            type="button"
                            className="home-header__dropdown-item"
                            onClick={() => handleTileShortcut(tile.id)}
                          >
                            {getTileLabel(tile)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
            <div className="home-header__controls">
              <div className="home-header__mode-switch" role="group" aria-label="Site interface mode">
                <span className={`home-header__mode-label ${uiMode === 'apple' ? 'is-active' : ''}`}>Web Traditional</span>
                <button
                  type="button"
                  className={`home-header__switch ${uiMode === 'legacy' ? 'is-windows' : ''}`}
                  role="switch"
                  aria-checked={uiMode === 'legacy'}
                  aria-label="Toggle between Web Traditional and Windows interface"
                  onClick={() => applyUiMode(uiMode === 'apple' ? 'legacy' : 'apple')}
                >
                  <span className="home-header__switch-thumb" />
                </button>
                <span className={`home-header__mode-label ${uiMode === 'legacy' ? 'is-active' : ''}`}>Windows</span>
              </div>
              <button
                type="button"
                className="home-header__btn"
                onClick={() => setIsSettingsOpen(true)}
              >
                Settings
              </button>
            </div>
          </div>
        </header>

        {/* Apple Mode Panel */}
        {uiMode === 'apple' && (
          <main className="home-content">
            <section className="home-apple-panel">
              <div className="home-apple-panel__overlay" />
              <div className="home-apple-panel__card">
                <div className="home-apple-panel__header">
                  <h2>Recommended Menu</h2>
                  <p>Shortcuts to the parts you open the most</p>
                </div>
                <nav className="home-apple-panel__nav">
                  <a href="/blog" className="home-apple-panel__nav-item">
                    <div className="home-apple-panel__nav-icon">
                      <Newspaper size={20} strokeWidth={1.5} />
                    </div>
                    <div className="home-apple-panel__nav-content">
                      <h3>Blog</h3>
                      <p>Stories, updates, and behind-the-scenes notes</p>
                    </div>
                    <ArrowRight size={16} className="home-apple-panel__nav-arrow" />
                  </a>
                  <button
                    type="button"
                    onClick={() => applyUiMode('legacy')}
                    className="home-apple-panel__nav-item"
                  >
                    <div className="home-apple-panel__nav-icon">
                      <LayoutGrid size={20} strokeWidth={1.5} />
                    </div>
                    <div className="home-apple-panel__nav-content">
                      <h3>Windows Dashboard</h3>
                      <p>Switch to tile view for a balanced at-a-glance layout</p>
                    </div>
                    <ArrowRight size={16} className="home-apple-panel__nav-arrow" />
                  </button>
                  <a href="/admin" className="home-apple-panel__nav-item">
                    <div className="home-apple-panel__nav-icon">
                      <Shield size={20} strokeWidth={1.5} />
                    </div>
                    <div className="home-apple-panel__nav-content">
                      <h3>Admin</h3>
                      <p>Manage posts and moderation tools</p>
                    </div>
                    <ArrowRight size={16} className="home-apple-panel__nav-arrow" />
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsSettingsOpen(true); }} className="home-apple-panel__nav-item">
                    <div className="home-apple-panel__nav-icon">
                      <Settings size={20} strokeWidth={1.5} />
                    </div>
                    <div className="home-apple-panel__nav-content">
                      <h3>Settings</h3>
                      <p>Appearance, theme, accessibility, and canvas controls</p>
                    </div>
                    <ArrowRight size={16} className="home-apple-panel__nav-arrow" />
                  </a>
                </nav>
              </div>
            </section>
          </main>
        )}

        {/* Classic Mode Panel */}
        {uiMode === 'legacy' && (
          <main className="home-content">
            <section className="home-classic-panel">
              <ProfileButton />
              <div className="home-shell__veil" />
              <div className="home-shell__content">
                <div className="home-shell__inner">
                  <main className="dashboard-main max-w-full no-scrollbar pb-8">
                    {dashboardConfig.map((group) => (
                      <div key={group.title} className="dashboard-group">
                        <h2 className="text-[10px] font-bold uppercase tracking-widest opacity-60 ml-1 text-foreground">
                          {group.title}
                        </h2>
                        <div className="dashboard-grid">
                          {group.tiles.map((tile) => {
                            return (
                              <div key={tile.id} className="dashboard-tile-anchor" data-tile-id={tile.id}>
                                {renderTileContent(tile)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </main>
                </div>
              </div>
            </section>
          </main>
        )}

        {fullscreenTilePreview && (
          <div className="home-menu-viewer home-menu-viewer--fullscreen" role="dialog" aria-modal="true">
            <button
              type="button"
              className="home-menu-viewer__backdrop"
              onClick={closeFullscreenPreview}
              aria-label="Close fullscreen menu"
            />
            <section className="home-menu-viewer__panel">
              <header className="home-menu-viewer__header">
                <div>
                  <p className="home-menu-viewer__kicker">Web Traditional</p>
                  <h3>{getTileLabel(fullscreenTilePreview)}</h3>
                </div>
                <button type="button" className="home-menu-viewer__close" onClick={closeFullscreenPreview} aria-label="Close viewer">
                  <X size={16} />
                </button>
              </header>
              <div className="home-menu-viewer__body">
                {renderTileContent(fullscreenTilePreview)}
              </div>
            </section>
          </div>
        )}

        {windowsTilePreviews.length > 0 && (
          <div className="home-menu-viewer home-menu-viewer--modal" role="dialog" aria-modal="true">
            <button
              type="button"
              className="home-menu-viewer__backdrop"
              onClick={() => closeWindowsPreview()}
              aria-label="Close modal menu"
            />
            <section className={`home-menu-viewer__panel home-menu-viewer__panel--modal ${windowsTilePreviews.length === 2 ? 'is-split' : ''}`}>
              <header className="home-menu-viewer__header">
                <div>
                  <p className="home-menu-viewer__kicker">Windows</p>
                  <h3>{windowsTilePreviews.length === 2 ? 'Split View' : getTileLabel(windowsTilePreviews[0])}</h3>
                </div>
                <button type="button" className="home-menu-viewer__close" onClick={() => closeWindowsPreview()} aria-label="Close viewer">
                  <X size={16} />
                </button>
              </header>
              {pendingReplaceTileId && windowsTilePreviewIds.length === 2 && (
                <div className="home-menu-viewer__replace-banner" role="status">
                  <p>
                    Choose where to open <strong>{getTileLabelById(pendingReplaceTileId)}</strong>
                  </p>
                  <div className="home-menu-viewer__replace-actions">
                    <button type="button" onClick={() => replaceWindowsPane('left')}>Replace Left</button>
                    <button type="button" onClick={() => replaceWindowsPane('right')}>Replace Right</button>
                    <button type="button" onClick={() => setPendingReplaceTileId(null)}>Cancel</button>
                  </div>
                </div>
              )}
              <div
                className={`home-menu-viewer__body home-menu-viewer__body--modal ${windowsTilePreviews.length === 2 ? 'is-split' : ''}`}
                style={windowsTilePreviews.length === 2 ? ({ ['--split-left' as string]: `${Math.round(splitRatio * 100)}%` } as React.CSSProperties) : undefined}
              >
                {windowsTilePreviews.length === 1 && (
                  <article key={windowsTilePreviews[0].id} className="home-menu-viewer__pane">
                    <div className="home-menu-viewer__pane-content">
                      {renderTileContent(windowsTilePreviews[0])}
                    </div>
                  </article>
                )}

                {windowsTilePreviews.length === 2 && (
                  <>
                    <article key={windowsTilePreviews[0].id} className="home-menu-viewer__pane">
                      <div className="home-menu-viewer__pane-header">
                        <h4>{getTileLabel(windowsTilePreviews[0])}</h4>
                        <button
                          type="button"
                          className="home-menu-viewer__pane-close"
                          onClick={() => closeWindowsPreview(windowsTilePreviews[0].id)}
                          aria-label={`Close ${getTileLabel(windowsTilePreviews[0])} pane`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="home-menu-viewer__pane-content">
                        {renderTileContent(windowsTilePreviews[0])}
                      </div>
                    </article>

                    <button
                      type="button"
                      className="home-menu-viewer__divider"
                      onPointerDown={handleSplitDragStart}
                      aria-label="Resize split panes"
                    >
                      <span />
                    </button>

                    <article key={windowsTilePreviews[1].id} className="home-menu-viewer__pane">
                      <div className="home-menu-viewer__pane-header">
                        <h4>{getTileLabel(windowsTilePreviews[1])}</h4>
                        <button
                          type="button"
                          className="home-menu-viewer__pane-close"
                          onClick={() => closeWindowsPreview(windowsTilePreviews[1].id)}
                          aria-label={`Close ${getTileLabel(windowsTilePreviews[1])} pane`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="home-menu-viewer__pane-content">
                        {renderTileContent(windowsTilePreviews[1])}
                      </div>
                    </article>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
        
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </ThemeProvider>
  );
};

export default memo(HomePage);
