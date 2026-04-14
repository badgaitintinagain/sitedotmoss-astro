"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Tile from './Tile';
import { X, Microscope, Upload, Loader2, ImageIcon, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

// --- Types ---
interface CellResult {
  id: number;
  class: string;
  confidence: number;
  bbox: number[];
  crop_base64: string;
  color: string;
}

interface InferenceResult {
  annotated_image: string;
  original_image: string;
  total_cells: number;
  class_counts: Record<string, number>;
  cells: CellResult[];
  error?: string;
}

interface GradioClient {
  predict: (endpoint: string, data: unknown[]) => Promise<{ data: unknown[] }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submit: (endpoint: string, data: unknown[]) => AsyncIterable<any>;
}

interface NextWbcProps {
  size?: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  accent?: 'primary' | 'secondary';
  opacity?: number;
}

const CLASSES = [
  'heterophil',
  'eosinophil',
  'basophil',
  'lymphocyte',
  'monocyte',
  'thrombocyte',
] as const;

const CLASS_COLORS: Record<string, string> = {
  heterophil:  '#FFC800',
  eosinophil:  '#FF0000',
  basophil:    '#8000FF',
  lymphocyte:  '#00C8FF',
  monocyte:    '#00FF00',
  thrombocyte: '#C8C8C8',
};

const CLASS_LABELS: Record<string, string> = {
  heterophil:  'Heterophil',
  eosinophil:  'Eosinophil',
  basophil:    'Basophil',
  lymphocyte:  'Lymphocyte',
  monocyte:    'Monocyte',
  thrombocyte: 'Thrombocyte',
};

// --- Count Bar ---
const CountBar: React.FC<{ counts: Record<string, number>; total: number }> = ({ counts, total }) => (
  <div className="space-y-1.5">
    {CLASSES.map((cls) => {
      const count = counts[cls] || 0;
      const pct = total > 0 ? (count / total) * 100 : 0;
      const color = CLASS_COLORS[cls];
      return (
        <div key={cls} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="w-20 text-[9px] font-bold uppercase tracking-wider text-foreground/60">
            {CLASS_LABELS[cls]}
          </span>
          <div className="flex-1 h-1.5 bg-foreground/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: color, opacity: count > 0 ? 0.85 : 0.15 }}
            />
          </div>
          <span
            className="w-8 text-[9px] tabular-nums text-right font-bold"
            style={{ color: count > 0 ? color : undefined, opacity: count > 0 ? 1 : 0.3 }}
          >
            {count}
          </span>
        </div>
      );
    })}
  </div>
);

// --- Cell Card ---
const CellCard: React.FC<{ cell: CellResult }> = ({ cell }) => {
  const color = CLASS_COLORS[cell.class] || '#888';
  return (
    <div className="border border-foreground/10 rounded-lg overflow-hidden bg-foreground/[0.02]">
      {cell.crop_base64 && (
        <div className="aspect-square overflow-hidden bg-black/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cell.crop_base64}
            alt={cell.class}
            className="w-full h-full object-contain"
          />
        </div>
      )}
      <div className="px-2 py-1.5 flex items-center justify-between" style={{ backgroundColor: `${color}10` }}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>
            {CLASS_LABELS[cell.class] || cell.class}
          </span>
        </div>
        <span className="text-[9px] tabular-nums text-foreground/50 font-medium">
          {(cell.confidence * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

// --- Main Component ---
const NextWbcTile: React.FC<NextWbcProps> = ({ size = '2x1', accent = 'primary', opacity = 40 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showAllCells, setShowAllCells] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const clientRef = useRef<GradioClient | null>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const HF_REPO_ID = "badgaitintin/nextwbc";

  const getClient = async () => {
    if (clientRef.current) return clientRef.current;
    setStatusText('Connecting to Hugging Face...');
    const { Client } = await import("@gradio/client");
    clientRef.current = await Client.connect(HF_REPO_ID);
    return clientRef.current;
  };

  const resetState = useCallback(() => {
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setStatusText('');
    setLoading(false);
    setProgress(0);
    setShowAllCells(false);
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
    setProgress(0);
    setShowAllCells(false);

    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      setStatusText('Connecting to model...');
      const client = await getClient();

      setStatusText('Running detection...');
      const job = client!.submit("/predict", [file]);

      let gotResult = false;
      for await (const event of job) {
        if (event.type === "status") {
          if (event.stage === "error") {
            throw new Error("Detection pipeline failed");
          }
          if (event.progress_data && event.progress_data.length > 0) {
            const p = event.progress_data[0];
            setProgress(Math.round(p.progress * 100));
            if (p.desc) {
              setStatusText(p.desc);
            }
          }
        } else if (event.type === "data" && event.data) {
          if (event.data[0]) {
            const data = event.data[0] as InferenceResult;
            if (data.error) {
              throw new Error(data.error);
            }
            setResult(data);
            setStatusText('');
            setProgress(100);
            gotResult = true;
          }
        }
      }

      if (!gotResult) {
        throw new Error('No result returned from model');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Detection failed: ${msg}`);
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

  const CELLS_PREVIEW_COUNT = 8;
  const visibleCells = result?.cells
    ? (showAllCells ? result.cells : result.cells.slice(0, CELLS_PREVIEW_COUNT))
    : [];
  const hasMoreCells = (result?.cells?.length || 0) > CELLS_PREVIEW_COUNT;

  return (
    <>
      <Tile
        size={size}
        label="NextWBC"
        icon={Microscope}
        accentType={accent}
        opacity={opacity}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="text-[10px] uppercase tracking-[0.2em] opacity-40 mt-2" />
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
                <Microscope className="text-accent-primary" />
                <div>
                  <h2 className="text-xl font-light tracking-tight text-foreground">NextWBC</h2>
                  <p className="text-[10px] uppercase tracking-widest opacity-50 text-foreground">
                    6-class white blood cell detection in avian blood smears // from capstone project by badgaitintin on Hugging Face Spaces
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
            <div className="flex-1 overflow-hidden p-5 flex flex-col gap-4">

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
                          <div className="w-full h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-primary rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-center gap-2 text-accent-primary">
                            <Loader2 size={14} className="animate-spin" />
                            <span className="text-xs tracking-wide">{statusText || 'Processing...'}</span>
                            <span className="text-[10px] opacity-50 tabular-nums">{progress}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-12 flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center">
                        <Upload size={24} className="text-foreground/30" />
                      </div>
                      <p className="text-sm text-foreground/50">Drop a blood smear image here or click to upload</p>
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
                <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500 min-h-0">

                  {/* Top row: Annotated image + Stats side by side */}
                  <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
                    {/* Annotated image */}
                    {result.annotated_image && (
                      <div className="flex-1 rounded-lg overflow-hidden border border-foreground/10 relative bg-black/20 min-h-0">
                        <div className="absolute top-1.5 left-1.5 z-10 text-[7px] bg-black/70 text-white px-1.5 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                          <ImageIcon size={7} /> Detection
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={result.annotated_image} alt="Annotated" className="w-full h-full object-contain" />
                      </div>
                    )}

                    {/* Stats panel */}
                    <div className="w-full md:w-72 shrink-0 flex flex-col gap-3">
                      {/* Total count badge */}
                      <div className="flex flex-col items-center justify-center px-4 py-3 border border-foreground/10 rounded-xl bg-foreground/[0.02]">
                        <span className="text-3xl font-light tabular-nums text-foreground">{result.total_cells}</span>
                        <span className="text-[9px] uppercase tracking-widest opacity-40 text-foreground mt-1">
                          Cells Detected
                        </span>
                      </div>

                      {/* Class distribution bars */}
                      <div className="flex-1 border border-foreground/10 rounded-xl bg-foreground/[0.02] p-4">
                        <div className="text-[9px] uppercase tracking-widest opacity-40 text-foreground mb-3">
                          Cell Distribution
                        </div>
                        <CountBar counts={result.class_counts} total={result.total_cells} />
                      </div>
                    </div>
                  </div>

                  {/* Individual cell crops */}
                  {result.cells && result.cells.length > 0 && (
                    <div className="shrink-0">
                      <div className="text-[9px] uppercase tracking-widest opacity-40 text-foreground mb-2">
                        Detected Cells ({result.cells.length})
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5">
                        {visibleCells.map((cell) => (
                          <CellCard key={cell.id} cell={cell} />
                        ))}
                      </div>
                      {hasMoreCells && (
                        <button
                          onClick={() => setShowAllCells(!showAllCells)}
                          className="flex items-center gap-1.5 mx-auto text-[10px] uppercase tracking-wider text-foreground/40 hover:text-foreground/70 transition-colors py-1.5"
                        >
                          {showAllCells ? (
                            <>
                              <ChevronUp size={12} />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown size={12} />
                              Show All {result.cells.length} Cells
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-foreground/5 bg-foreground/[0.03]">
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-widest opacity-30 text-foreground">
                  YOLO12 → 6-Class WBC Detection (Heterophil · Eosinophil · Basophil · Lymphocyte · Monocyte · Thrombocyte)
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

export default NextWbcTile;
