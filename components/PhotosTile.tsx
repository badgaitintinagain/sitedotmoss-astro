"use client";
import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Images, Upload, Download, X, WandSparkles } from 'lucide-react';
import Tile from './Tile';

type SupportedFormat = 'image/png' | 'image/jpeg' | 'image/webp';

interface PhotosTileProps {
  size?: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  accent?: 'primary' | 'secondary';
  opacity?: number;
}

const FORMAT_OPTIONS: Array<{ value: SupportedFormat; label: string; ext: string }> = [
  { value: 'image/png', label: 'PNG', ext: 'png' },
  { value: 'image/jpeg', label: 'JPG', ext: 'jpg' },
  { value: 'image/webp', label: 'WEBP', ext: 'webp' },
];

const PhotosTile: React.FC<PhotosTileProps> = ({ size = '2x2', accent = 'primary', opacity = 35 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [convertedUrl, setConvertedUrl] = useState<string>('');
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [targetFormat, setTargetFormat] = useState<SupportedFormat>('image/webp');
  const [quality, setQuality] = useState(0.9);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState('');

  const selectedFormat = useMemo(
    () => FORMAT_OPTIONS.find((option) => option.value === targetFormat) || FORMAT_OPTIONS[2],
    [targetFormat]
  );

  const clearConverted = () => {
    if (convertedUrl) {
      URL.revokeObjectURL(convertedUrl);
    }
    setConvertedBlob(null);
    setConvertedUrl('');
  };

  const resetAll = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    clearConverted();
    setSourceFile(null);
    setPreviewUrl('');
    setError('');
    setIsConverting(false);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setError('');
    clearConverted();

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setSourceFile(file);
    setPreviewUrl(nextPreviewUrl);
  };

  const convertImage = async () => {
    if (!sourceFile) {
      setError('Choose a photo first.');
      return;
    }

    setError('');
    setIsConverting(true);
    clearConverted();

    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to read image.'));
        image.src = previewUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas is not supported in this browser.');
      }

      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (nextBlob) => {
            if (!nextBlob) {
              reject(new Error('Could not convert this file.'));
              return;
            }
            resolve(nextBlob);
          },
          targetFormat,
          targetFormat === 'image/png' ? undefined : quality
        );
      });

      const nextUrl = URL.createObjectURL(blob);
      setConvertedBlob(blob);
      setConvertedUrl(nextUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image conversion failed.';
      setError(message);
    } finally {
      setIsConverting(false);
    }
  };

  const downloadConverted = () => {
    if (!sourceFile || !convertedUrl || !convertedBlob) {
      return;
    }

    const fileName = sourceFile.name.replace(/\.[^/.]+$/, '');
    const link = document.createElement('a');
    link.href = convertedUrl;
    link.download = `${fileName}.${selectedFormat.ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const originalSizeLabel = sourceFile ? `${(sourceFile.size / 1024).toFixed(1)} KB` : '-';
  const convertedSizeLabel = convertedBlob ? `${(convertedBlob.size / 1024).toFixed(1)} KB` : '-';

  return (
    <>
      <Tile
        size={size}
        label="Photos"
        icon={Images}
        accentType={accent}
        opacity={opacity}
        onClick={() => setIsOpen(true)}
      >
        <div className="mt-7 text-center">
          <p className="text-[8px] uppercase tracking-[0.2em] opacity-70">Convert</p>
          <p className="text-[7px] opacity-50">PNG JPG WEBP</p>
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
            onClick={closeModal}
          >
            <div className="absolute inset-0 bg-black/65 backdrop-blur-md" />
            <motion.div
              className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/15 bg-[#101010]/95 text-white shadow-2xl"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Photos Converter</h2>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">Work and Focus Tool</p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-white/15 bg-white/5 p-2 text-white/80 transition hover:bg-white/10"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid gap-5 p-5 md:grid-cols-[1.2fr_1fr]">
                <div className="space-y-4">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/25 bg-white/5 px-4 py-4 text-sm text-white/80 transition hover:bg-white/10">
                    <Upload size={16} />
                    Upload Image
                    <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Original</p>
                      <p className="mt-1 text-sm font-semibold">{originalSizeLabel}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Converted</p>
                      <p className="mt-1 text-sm font-semibold">{convertedSizeLabel}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Target Format</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {FORMAT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setTargetFormat(option.value)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
                            targetFormat === option.value
                              ? 'border-cyan-300 bg-cyan-300/20 text-cyan-100'
                              : 'border-white/20 bg-white/5 text-white/75 hover:bg-white/10'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {(targetFormat === 'image/jpeg' || targetFormat === 'image/webp') && (
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-xs text-white/60">
                          <span>Quality</span>
                          <span>{Math.round(quality * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={40}
                          max={100}
                          value={Math.round(quality * 100)}
                          onChange={(event) => setQuality(Number(event.target.value) / 100)}
                          className="w-full accent-cyan-300"
                        />
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={convertImage}
                        disabled={!sourceFile || isConverting}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <WandSparkles size={15} />
                        {isConverting ? 'Converting...' : 'Convert'}
                      </button>
                      <button
                        type="button"
                        onClick={downloadConverted}
                        disabled={!convertedUrl}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Download size={15} />
                        Download
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/45">Preview</p>
                    <div className="flex h-56 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Uploaded preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <p className="text-xs text-white/45">Upload a photo to preview</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/70">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">Roadmap</p>
                    <ul className="mt-2 space-y-1.5">
                      <li>1. Convert formats (now)</li>
                      <li>2. Compress quality presets (next)</li>
                      <li>3. Batch convert multiple files</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={resetAll}
                    className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70 transition hover:bg-white/10"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PhotosTile;
