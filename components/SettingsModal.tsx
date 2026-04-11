"use client";
import React, { useRef, useEffect, useState, memo, useMemo } from 'react';
import { X, Sun, Moon, Check, Ghost, Image as ImageIcon, Wind, Zap } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from './ThemeProvider';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = memo(({ isOpen, onClose }: SettingsModalProps) => {
  const { 
    theme, toggleTheme, isGrayscale, setGrayscale,
    bgType, bgValue, setBgValue, glassBlur, setGlassBlur, setBgType
  } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeSection, setActiveSection] = useState<'interface' | 'canvas' | 'glass' | 'accessibility'>('interface');

  const bgPresets = useMemo(() => [
    { id: 'beige', type: 'color' as const, value: '#F2EBE3', name: 'Default Light' },
    { id: 'charcoal', type: 'color' as const, value: '#1A1A1A', name: 'Deep Dark' },
    { id: 'nature', type: 'image' as const, value: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1600&q=80', name: 'Nature' },
    { id: 'abstract', type: 'image' as const, value: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?auto=format&fit=crop&w=1600&q=80', name: 'Abstract' },
    { id: 'city', type: 'image' as const, value: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80', name: 'City' },
    { id: 'aurora', type: 'image' as const, value: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=1600&q=80', name: 'Aurora' },
    { id: 'ocean-drive', type: 'image' as const, value: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80', name: 'Ocean Drive' },
    { id: 'mountain-fog', type: 'image' as const, value: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80', name: 'Mountain Fog' },
    { id: 'neon-night', type: 'image' as const, value: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80', name: 'Neon Night' },
    { id: 'desert-dunes', type: 'image' as const, value: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1600&q=80', name: 'Desert Dunes' },
  ], []);

  const visibleBgPresets = useMemo(
    () => bgPresets.filter(bg => bg.type === bgType),
    [bgPresets, bgType]
  );

  const settingsSections = useMemo(() => ([
    { id: 'interface' as const, label: 'Interface', icon: Sun },
    { id: 'canvas' as const, label: 'Canvas', icon: ImageIcon },
    { id: 'glass' as const, label: 'Glass', icon: Wind },
    { id: 'accessibility' as const, label: 'Accessibility', icon: Ghost }
  ]), []);

  useEffect(() => {
    let active = true;
    let cleanup: (() => void) | undefined;

    const run = async () => {
      const gsap = (await import('gsap')).default;
      if (!active || !isOpen || !modalRef.current) return;

      const ctx = gsap.context(() => {
        if (isOpen && modalRef.current) {
          gsap.fromTo(modalRef.current,
            { opacity: 0, scale: 0.9, y: 20 },
            { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.4)" }
          );
        }
      });
      cleanup = () => ctx.revert();
    };

    void run();

    return () => {
      active = false;
      cleanup?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 transition-colors duration-500 ${isDragging ? 'bg-black/10' : 'bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.03)_35%,rgba(0,0,0,0.18)_100%)]'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 backdrop-blur-lg transition-all duration-500 ${isDragging ? 'opacity-0' : 'opacity-100'}`}
        onClick={onClose}
      />
      
      {/* App Window */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-xl h-[81vh] rounded-[4px] border border-foreground/20 bg-background/24 text-foreground overflow-hidden flex flex-col shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-500"
        style={{ 
          opacity: isDragging ? 0.15 : 1,
          transform: isDragging ? 'scale(0.98)' : 'scale(1)',
          pointerEvents: isDragging ? 'none' : 'auto'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-foreground/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.20)_0%,rgba(255,255,255,0.04)_100%)] backdrop-blur-xl backdrop-saturate-150 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <Zap className="text-accent-primary animate-pulse" />
            <div>
              <h2 className="text-xl font-light tracking-tight text-foreground">Setting</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-[4px] border border-foreground/20 bg-background/20 text-foreground/75 transition-all duration-200 hover:bg-background/35 hover:text-foreground backdrop-blur-md backdrop-saturate-150"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside className="border-b border-foreground/15 bg-background/16 p-2 backdrop-blur-xl backdrop-saturate-150 md:w-[170px] md:border-b-0 md:border-r md:p-3">
            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
              {settingsSections.map(section => {
                const Icon = section.icon;
                const active = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 rounded-[4px] border px-2.5 py-2 text-left text-xs transition-all ${active ? 'border-foreground/30 bg-background/28 text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]' : 'border-foreground/15 bg-background/14 text-foreground/70 hover:border-foreground/30 hover:bg-background/24'}`}
                  >
                    <Icon size={14} />
                    <span className="truncate">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 no-scrollbar md:p-5">
            {activeSection === 'interface' && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sun size={16} className="text-foreground opacity-40" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground">Interface</h3>
                </div>
                <div className="flex bg-background/18 border border-foreground/15 p-1 rounded-[4px] backdrop-blur-md">
                  <button
                    onClick={() => theme === 'dark' && toggleTheme()}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[3px] transition-all ${theme === 'light' ? 'bg-background/55 border border-foreground/20 text-foreground font-bold backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]' : 'text-foreground/45'}`}
                  >
                    <Sun size={16} className={theme === 'light' ? 'text-amber-500' : ''} />
                    <span className="text-sm">Day</span>
                  </button>
                  <button
                    onClick={() => theme === 'light' && toggleTheme()}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[3px] transition-all ${theme === 'dark' ? 'bg-background/55 border border-foreground/20 text-foreground font-bold backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]' : 'text-foreground/45'}`}
                  >
                    <Moon size={16} className={theme === 'dark' ? 'text-indigo-400' : ''} />
                    <span className="text-sm">Night</span>
                  </button>
                </div>
              </section>
            )}

            {activeSection === 'canvas' && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <ImageIcon size={16} className="text-foreground opacity-40" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground">Canvas</h3>
                </div>
                <div className="flex bg-background/18 border border-foreground/15 p-1 rounded-[4px] backdrop-blur-md">
                  <button
                    onClick={() => setBgType('color')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[3px] text-xs uppercase tracking-[0.2em] transition-all ${bgType === 'color' ? 'bg-background/55 border border-foreground/20 text-foreground font-bold' : 'text-foreground/45'}`}
                  >
                    Color
                  </button>
                  <button
                    onClick={() => setBgType('image')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[3px] text-xs uppercase tracking-[0.2em] transition-all ${bgType === 'image' ? 'bg-background/55 border border-foreground/20 text-foreground font-bold' : 'text-foreground/45'}`}
                  >
                    Image
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2.5">
                  {visibleBgPresets.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => {
                        setBgType(bg.type as 'color' | 'image');
                        setBgValue(bg.value);
                      }}
                      className={`relative aspect-square rounded-[4px] overflow-hidden border transition-all ${
                        bgValue === bg.value && bgType === bg.type ? 'border-accent-primary scale-[0.97] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]' : 'border-foreground/15 opacity-80 hover:opacity-100'
                      }`}
                    >
                      {bg.type === 'color' ? (
                        <div className="w-full h-full" style={{ backgroundColor: bg.value }} />
                      ) : (
                        <Image src={bg.value} className="object-cover" alt={bg.name} fill sizes="100px" />
                      )}
                      {bgValue === bg.value && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Check size={16} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {activeSection === 'glass' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Wind size={16} className="text-foreground opacity-40" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground">Glass Intensity</h3>
                  </div>
                  <span className="text-[10px] font-mono opacity-40 text-foreground">{glassBlur}px</span>
                </div>
                <div className="relative pt-2 pb-6">
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={glassBlur}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                    onChange={(e) => setGlassBlur(Number(e.target.value))}
                    className="w-full h-1.5 bg-foreground/10 rounded-lg appearance-none cursor-pointer accent-accent-primary"
                  />
                  {isDragging && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground animate-bounce whitespace-nowrap">
                      Previewing Dashboard...
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeSection === 'accessibility' && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Ghost size={16} className="text-foreground opacity-40" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground">Accessibility</h3>
                </div>
                <button
                  onClick={() => setGrayscale(!isGrayscale)}
                  className={`w-full flex items-center justify-between p-3 rounded-[4px] border transition-all ${
                    isGrayscale
                      ? 'bg-accent-primary/18 border-accent-primary/45 text-accent-primary font-bold'
                      : 'bg-background/22 border-foreground/15 text-foreground opacity-85'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Ghost size={16} />
                    <span className="text-sm">Force to Grayscale</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${isGrayscale ? 'bg-accent-primary' : 'bg-gray-400/30'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isGrayscale ? 'left-6' : 'left-1'}`} />
                  </div>
                </button>
              </section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 text-center border-t border-foreground/15 opacity-35 mt-auto flex-shrink-0 bg-background/14 backdrop-blur-md">
          <p className="text-[8px] uppercase tracking-[0.3em] text-foreground">site(.)moss, Built by Moss. Refined by Claude. (NextJS, React, Turso SQLite and Huggingface)</p>
        </div>
      </div>
      
      {/* Slider Helper (External to modal so it doesn't fade) */}
      {isDragging && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-[200px] bg-white/10 backdrop-blur-md px-6 py-3 rounded-[4px] border border-white/20 pointer-events-none animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-3 text-white">
            <Wind size={20} className="animate-spin" />
            <span className="text-lg font-light tracking-widest uppercase">Adjusting Blur</span>
          </div>
        </div>
      )}
    </div>
  );
});

SettingsModal.displayName = 'SettingsModal';

export default SettingsModal;
