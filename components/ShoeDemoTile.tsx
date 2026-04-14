"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Tile from './Tile';
import { X, Footprints, Upload, Loader2, ImageIcon, Layers, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

// --- Types ---
interface ShoeResult {
  side: string;
  brand: string;
  confidence: number;
  pose_score: number;
  blur_score: number;
  depth_score: number;
  probs: {
    swin: number[];
    marqo: number[];
    google: number[];
    weighted_avg: number[];
    weights: number[];
  };
  relabel_info: string;
  crop_base64: string;
  pose_base64: string;
}

interface PersonResult {
  rank: number;
  shoes: ShoeResult[];
  person_crop_base64: string;
}

interface InferenceResult {
  annotated_image: string;
  depth_map: string;
  persons: PersonResult[];
}

interface GradioClient {
  predict: (endpoint: string, data: unknown[]) => Promise<{ data: unknown[] }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submit: (endpoint: string, data: unknown[]) => AsyncIterable<any>;
}

interface ShoeDemoProps {
  size?: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  accent?: 'primary' | 'secondary';
  opacity?: number;
}

const BRANDS = ['adidas', 'nike', 'asics', 'other'];
const BRAND_COLORS: Record<string, string> = {
  adidas: '#00CED1',
  nike: '#FF4444',
  asics: '#4488FF',
  other: '#888888'
};

// --- Compact Probability Bars ---
const ProbBars: React.FC<{ probs: ShoeResult['probs']; compact?: boolean }> = ({ probs, compact }) => {
  const winnerIdx = probs.weighted_avg.indexOf(Math.max(...probs.weighted_avg));

  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      {BRANDS.map((brand, i) => {
        const avg = probs.weighted_avg[i] ?? 0;
        const isWinner = i === winnerIdx;
        const brandColor = BRAND_COLORS[brand] || BRAND_COLORS.other;
        return (
          <div key={brand} className="flex items-center gap-1.5">
            <span className={`w-10 text-[8px] font-bold uppercase tracking-wider text-right ${isWinner ? 'text-foreground' : 'text-foreground/40'}`}>
              {brand}
            </span>
            <div className="flex-1 h-1.5 bg-foreground/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${avg * 100}%`, backgroundColor: brandColor, opacity: isWinner ? 1 : 0.35 }}
              />
            </div>
            <span className={`w-8 text-[8px] tabular-nums text-right ${isWinner ? 'font-bold' : 'opacity-40'}`}
              style={{ color: isWinner ? brandColor : undefined }}>
              {(avg * 100).toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

// --- Compact Shoe Side Card (Left or Right foot) ---
const ShoeSideCard: React.FC<{ shoe: ShoeResult; label: string }> = ({ shoe, label }) => {
  const brandColor = BRAND_COLORS[shoe.brand] || BRAND_COLORS.other;
  const [showPose, setShowPose] = useState(false);

  return (
    <div className="flex-1 min-w-0 border border-foreground/10 rounded-lg overflow-hidden bg-foreground/[0.02]">
      {/* Side header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-foreground/5" style={{ backgroundColor: `${brandColor}10` }}>
        <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/60">{label}</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
          <span className="text-[10px] font-bold uppercase" style={{ color: brandColor }}>{shoe.brand}</span>
          <span className="text-[9px] opacity-50 tabular-nums text-foreground">{(shoe.confidence * 100).toFixed(0)}%</span>
          {shoe.relabel_info && <span className="text-[8px] text-amber-400">↻</span>}
        </div>
      </div>

      {/* Image + bars row */}
      <div className="flex gap-2 p-2">
        {/* Crop image  */}
        {shoe.crop_base64 && (
          <button
            onClick={() => shoe.pose_base64 && setShowPose(!showPose)}
            className="w-20 h-20 shrink-0 rounded-md overflow-hidden border border-foreground/10 bg-black/20 relative"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={showPose && shoe.pose_base64 ? shoe.pose_base64 : shoe.crop_base64}
              alt={`${label} shoe`}
              className="w-full h-full object-contain"
            />
            {shoe.pose_base64 && (
              <div className="absolute bottom-0.5 right-0.5 text-[6px] bg-black/60 text-white px-1 rounded">
                {showPose ? 'POSE' : 'CROP'}
              </div>
            )}
          </button>
        )}

        {/* Prob bars + quality */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <ProbBars probs={shoe.probs} compact />
          {/* Quality inline */}
          <div className="flex items-center gap-2 mt-1.5 pt-1 border-t border-foreground/5">
            {[
              { label: 'PSE', value: shoe.pose_score },
              { label: 'BLR', value: shoe.blur_score },
              { label: 'DPT', value: shoe.depth_score },
            ].map(m => (
              <div key={m.label} className="flex items-center gap-0.5">
                <span className="text-[7px] opacity-30 text-foreground">{m.label}</span>
                <span className="text-[8px] font-bold tabular-nums text-foreground/60">{(m.value * 100).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
const ShoeDemoTile: React.FC<ShoeDemoProps> = ({ size = '2x2', accent = 'secondary', opacity = 40 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const clientRef = useRef<GradioClient | null>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);

  const HF_REPO_ID = "badgaitintin/shoedetclss";

  const getClient = async () => {
    if (clientRef.current) return clientRef.current;
    setStatusText('Connecting to Hugging Face...');
    const { Client } = await import("@gradio/client");
    clientRef.current = await Client.connect(HF_REPO_ID);
    return clientRef.current;
  };

  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelineLog, setPipelineLog] = useState<string[]>([]);
  const [liveStats, setLiveStats] = useState<Record<string, string>>({});

  const resetState = useCallback(() => {
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setStatusText('');
    setLoading(false);
    setPipelineProgress(0);
    setSelectedPerson(null);
    setPipelineLog([]);
    setLiveStats({});
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Image too large. Maximum 20MB.');
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);
    setPipelineProgress(0);
    setPipelineLog([]);
    setLiveStats({});

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      setStatusText('Connecting to model...');
      const client = await getClient();

      setStatusText('Starting pipeline...');
      const job = client!.submit("/predict", [file]);

      let gotResult = false;
      for await (const event of job) {
        if (event.type === "status") {
          if (event.stage === "error") {
            throw new Error("Pipeline failed");
          }
          if (event.progress_data && event.progress_data.length > 0) {
            const p = event.progress_data[0];
            setPipelineProgress(Math.round(p.progress * 100));
            if (p.desc) {
              // Parse STAT: messages for live stats
              if (p.desc.startsWith('STAT:')) {
                const [statPart, ...msgParts] = p.desc.substring(5).split('|');
                const displayMsg = msgParts.join('|');
                // Parse stat key=value
                const [key, val] = statPart.split('=');
                if (key && val) {
                  setLiveStats(prev => ({ ...prev, [key]: val }));
                }
                if (displayMsg) {
                  setPipelineLog(prev => [...prev, displayMsg]);
                  setStatusText(displayMsg);
                }
              } else {
                setStatusText(p.desc);
              }
            }
          }
        } else if (event.type === "data" && event.data) {
          if (event.data[0]) {
            const data = event.data[0] as InferenceResult;
            setResult(data);
            setStatusText('');
            setPipelineProgress(100);
            gotResult = true;
          }
        }
      }

      if (!gotResult) {
        throw new Error('No result returned from model');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Inference failed: ${msg}`);
      setStatusText('');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const totalShoes = result?.persons?.reduce((sum, p) => sum + (p.shoes?.length || 0), 0) || 0;

  return (
    <>
      <Tile
        size={size}
        label="Shoe Demo"
        icon={Footprints}
        accentType={accent}
        opacity={opacity}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="text-[10px] uppercase tracking-[0.2em] opacity-40 mt-2"></div>
        </div>
      </Tile>

      <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            className="relative w-full max-w-5xl h-[85vh] bg-background border border-foreground/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-foreground/5 bg-foreground/5">
              <div className="flex items-center gap-3">
                <Footprints className="text-accent-primary" />
                <div>
                  <h2 className="text-xl font-light tracking-tight text-foreground">Shoe Demo</h2>
                  <p className="text-[10px] uppercase tracking-widest opacity-50 text-foreground">
                    Multi-Model Shoe Brand Classification Pipeline
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(result || previewUrl) && (
                  <button
                    onClick={resetState}
                    className="p-2 hover:bg-foreground/10 rounded-full transition-colors text-foreground/60 hover:text-foreground"
                    title="Reset"
                  >
                    <RotateCcw size={18} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-foreground/10 rounded-full transition-colors text-foreground"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent">
              
              {/* Upload Area */}
              {!result && (
                <div
                  ref={dropzoneRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => !loading && fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer
                    ${isDragging 
                      ? 'border-accent-primary bg-accent-primary/10' 
                      : 'border-foreground/15 hover:border-foreground/30 hover:bg-foreground/[0.02]'}
                    ${loading ? 'pointer-events-none opacity-60' : ''}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {previewUrl ? (
                    <div className="p-4 flex flex-col items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Preview" className="max-h-64 rounded-lg object-contain" />
                      {loading && (
                        <div className="w-full max-w-md space-y-3">
                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-primary rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${pipelineProgress}%` }}
                            />
                          </div>

                          {/* Live stats badges */}
                          {Object.keys(liveStats).length > 0 && (
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              {liveStats.persons && (
                                <span className="text-[10px] bg-accent-primary/15 text-accent-primary px-2 py-0.5 rounded-full font-medium tabular-nums">
                                  {liveStats.persons} person{liveStats.persons !== '1' ? 's' : ''}
                                </span>
                              )}
                              {liveStats.shoes && (
                                <span className="text-[10px] bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full font-medium tabular-nums">
                                  {liveStats.shoes} shoe{liveStats.shoes !== '1' ? 's' : ''}
                                </span>
                              )}
                              {liveStats.depth === 'done' && (
                                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                                  depth ✓
                                </span>
                              )}
                            </div>
                          )}

                          {/* Pipeline log terminal */}
                          {pipelineLog.length > 0 && (
                            <div className="bg-foreground/[0.03] border border-foreground/5 rounded-lg p-2 max-h-24 overflow-y-auto">
                              {pipelineLog.map((msg, i) => (
                                <div key={i} className="flex items-start gap-1.5 text-[10px] text-foreground/50 leading-relaxed">
                                  <span className="text-emerald-400 mt-px shrink-0">✓</span>
                                  <span>{msg}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Current stage */}
                          <div className="flex items-center justify-center gap-2 text-accent-primary">
                            <Loader2 size={14} className="animate-spin" />
                            <span className="text-xs tracking-wide">{statusText || 'Processing...'}</span>
                            <span className="text-[10px] opacity-50 tabular-nums">{pipelineProgress}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-12 flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center">
                        <Upload size={24} className="text-foreground/30" />
                      </div>
                      <p className="text-sm text-foreground/50">Drop an image here or click to upload</p>
                      <p className="text-[10px] uppercase tracking-widest opacity-30 text-foreground">
                        JPG, PNG — Max 20MB
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500">

                  {/* Overview strip: annotated + depth side by side, compact */}
                  <div className="flex gap-2 h-36">
                    {result.annotated_image && (
                      <div className="flex-1 rounded-lg overflow-hidden border border-foreground/10 relative bg-black/20">
                        <div className="absolute top-1 left-1 z-10 text-[7px] bg-black/70 text-white px-1.5 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                          <ImageIcon size={7} /> Detect
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={result.annotated_image} alt="Annotated" className="w-full h-full object-contain" />
                      </div>
                    )}
                    {result.depth_map && (
                      <div className="flex-1 rounded-lg overflow-hidden border border-foreground/10 relative bg-black/20">
                        <div className="absolute top-1 left-1 z-10 text-[7px] bg-black/70 text-white px-1.5 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                          <Layers size={7} /> Depth
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={result.depth_map} alt="Depth map" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>

                  {/* Summary bar */}
                  <div className="text-[10px] uppercase tracking-widest opacity-40 text-foreground px-1">
                    {result.persons?.length || 0} person{(result.persons?.length || 0) !== 1 ? 's' : ''} · {totalShoes} shoe{totalShoes !== 1 ? 's' : ''}
                    {selectedPerson === null ? ' — tap to inspect' : ''}
                  </div>

                  {/* Person navigation */}
                  {selectedPerson === null ? (
                    // --- Person grid ---
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {result.persons?.map((person) => {
                        const leftShoe = person.shoes?.find(s => s.side === 'Left');
                        const rightShoe = person.shoes?.find(s => s.side === 'Right');
                        const topShoe = person.shoes?.[0];
                        const topBrand = topShoe?.brand || 'unknown';
                        const brandColor = BRAND_COLORS[topBrand] || BRAND_COLORS.other;
                        return (
                          <button
                            key={person.rank}
                            onClick={() => setSelectedPerson(person.rank)}
                            className="group rounded-lg border border-foreground/10 overflow-hidden bg-foreground/[0.02] hover:border-foreground/20 transition-all text-left"
                          >
                            {/* Person thumbnail */}
                            {person.person_crop_base64 && (
                              <div className="aspect-[4/5] overflow-hidden bg-black/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={person.person_crop_base64} alt={`Person ${person.rank}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              </div>
                            )}
                            <div className="p-1.5 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/60">P{person.rank}</span>
                                <div className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: brandColor }} />
                                  <span className="text-[8px] font-bold uppercase" style={{ color: brandColor }}>{topBrand}</span>
                                </div>
                              </div>
                              {/* L/R indicator */}
                              <div className="flex items-center gap-1 text-[7px] text-foreground/40">
                                <span className={leftShoe ? 'text-foreground/70 font-bold' : 'opacity-30'}>L</span>
                                <span>|</span>
                                <span className={rightShoe ? 'text-foreground/70 font-bold' : 'opacity-30'}>R</span>
                                <ChevronRight size={9} className="ml-auto opacity-0 group-hover:opacity-50 transition-opacity text-foreground" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    // --- Person detail: side-by-side left/right ---
                    (() => {
                      const person = result.persons?.find(p => p.rank === selectedPerson);
                      if (!person) return null;
                      const personIdx = result.persons?.findIndex(p => p.rank === selectedPerson) ?? 0;
                      const prevPerson = result.persons?.[personIdx - 1];
                      const nextPerson = result.persons?.[personIdx + 1];
                      const leftShoe = person.shoes?.find(s => s.side === 'Left');
                      const rightShoe = person.shoes?.find(s => s.side === 'Right');

                      return (
                        <div className="space-y-3">
                          {/* Nav bar */}
                          <div className="flex items-center justify-between">
                            <button onClick={() => setSelectedPerson(null)}
                              className="flex items-center gap-1 text-xs text-foreground/50 hover:text-foreground transition-colors">
                              <ChevronLeft size={14} />
                              <span className="text-[10px] uppercase tracking-wider">Back</span>
                            </button>
                            <div className="flex items-center gap-1">
                              {prevPerson && (
                                <button onClick={() => setSelectedPerson(prevPerson.rank)}
                                  className="p-1 hover:bg-foreground/10 rounded text-foreground/40 hover:text-foreground transition-colors">
                                  <ChevronLeft size={14} />
                                </button>
                              )}
                              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/50 px-1">
                                Person {person.rank}
                              </span>
                              {nextPerson && (
                                <button onClick={() => setSelectedPerson(nextPerson.rank)}
                                  className="p-1 hover:bg-foreground/10 rounded text-foreground/40 hover:text-foreground transition-colors">
                                  <ChevronRight size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Left / Right shoe split */}
                          <div className="flex gap-3">
                            {leftShoe ? (
                              <ShoeSideCard shoe={leftShoe} label="👟 Left Foot" />
                            ) : (
                              <div className="flex-1 border border-dashed border-foreground/10 rounded-lg flex items-center justify-center py-8">
                                <span className="text-[10px] text-foreground/25 uppercase tracking-widest">No left shoe</span>
                              </div>
                            )}
                            {rightShoe ? (
                              <ShoeSideCard shoe={rightShoe} label="👟 Right Foot" />
                            ) : (
                              <div className="flex-1 border border-dashed border-foreground/10 rounded-lg flex items-center justify-center py-8">
                                <span className="text-[10px] text-foreground/25 uppercase tracking-widest">No right shoe</span>
                              </div>
                            )}
                          </div>

                          {(!person.shoes || person.shoes.length === 0) && (
                            <div className="text-center py-6 text-foreground/30 text-sm">No shoes detected</div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>

            {/* Pipeline Info Footer */}
            <div className="px-5 py-3 border-t border-foreground/5 bg-foreground/[0.03]">
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-widest opacity-30 text-foreground">
                  YOLO → Depth (MiDaS) → Pose (YOLOv8) → Swin-T + FashionSigLIP + SigLIP2 → Consensus Voting
                </p>
                <p className="text-[9px] uppercase tracking-widest opacity-30 text-foreground">
                  Running on HF Space
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
};

export default ShoeDemoTile;
