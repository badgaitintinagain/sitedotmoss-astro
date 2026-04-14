"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Images, Upload, Download, X, WandSparkles, FolderArchive, SlidersHorizontal, Sparkles, Trash2 } from 'lucide-react';
import Tile from './Tile';

type SupportedFormat = 'image/png' | 'image/jpeg' | 'image/webp';
type PhotosSection = 'upload' | 'convert' | 'export';
type CompressionPreset = 'low' | 'medium' | 'high' | 'custom';

interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  convertedBlob?: Blob;
  convertedUrl?: string;
}

interface PhotosTileProps {
  size?: '1x1' | '2x1' | '2x2' | '2x3' | '3x2';
  accent?: 'primary' | 'secondary';
  opacity?: number;
}

const MAX_FILES_PER_UPLOAD = 10;

const FORMAT_OPTIONS: Array<{ value: SupportedFormat; label: string; ext: string }> = [
  { value: 'image/png', label: 'PNG', ext: 'png' },
  { value: 'image/jpeg', label: 'JPG', ext: 'jpg' },
  { value: 'image/webp', label: 'WEBP', ext: 'webp' },
];

const PhotosTile: React.FC<PhotosTileProps> = ({ size = '2x1', accent = 'primary', opacity = 35 }) => {
  const objectUrlsRef = useRef<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<PhotosSection>('upload');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<SupportedFormat>('image/webp');
  const [quality, setQuality] = useState(0.9);
  const [compressionPreset, setCompressionPreset] = useState<CompressionPreset>('high');
  const [isConverting, setIsConverting] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [conversionTotal, setConversionTotal] = useState(0);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const selectedFormat = useMemo(
    () => FORMAT_OPTIONS.find((option) => option.value === targetFormat) || FORMAT_OPTIONS[2],
    [targetFormat]
  );

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
      objectUrlsRef.current.clear();
    };
  }, []);

  const registerObjectUrl = (objectUrl: string) => {
    objectUrlsRef.current.add(objectUrl);
    return objectUrl;
  };

  const releaseObjectUrl = (objectUrl?: string) => {
    if (!objectUrl) {
      return;
    }
    if (objectUrlsRef.current.has(objectUrl)) {
      URL.revokeObjectURL(objectUrl);
      objectUrlsRef.current.delete(objectUrl);
    }
  };

  const validateIncomingFiles = (files: File[]) => {
    if (files.length === 0) {
      throw new Error('No image files found.');
    }
    if (files.length > MAX_FILES_PER_UPLOAD) {
      throw new Error(`You can upload up to ${MAX_FILES_PER_UPLOAD} images at a time.`);
    }
    if (photos.length + files.length > MAX_FILES_PER_UPLOAD) {
      throw new Error(`Upload would exceed ${MAX_FILES_PER_UPLOAD} images total. Remove some photos first.`);
    }
  };

  const appendFiles = (files: File[]) => {
    validateIncomingFiles(files);
    const nextItems: PhotoItem[] = files.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      previewUrl: registerObjectUrl(URL.createObjectURL(file)),
    }));
    setPhotos((prev) => [...prev, ...nextItems]);
    setStatus(`Added ${files.length} image${files.length > 1 ? 's' : ''}.`);
  };

  const clearConvertedForAll = () => {
    setPhotos((prev) =>
      prev.map((photo) => {
        releaseObjectUrl(photo.convertedUrl);
        return {
          ...photo,
          convertedBlob: undefined,
          convertedUrl: undefined,
        };
      })
    );
  };

  const resetAll = () => {
    photos.forEach((photo) => {
      releaseObjectUrl(photo.previewUrl);
      releaseObjectUrl(photo.convertedUrl);
    });
    setPhotos([]);
    setError('');
    setStatus('');
    setIsConverting(false);
    setConversionProgress(0);
    setConversionTotal(0);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const onImageFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files || []);
    setError('');
    setStatus('');
    clearConvertedForAll();

    try {
      const validFiles = incoming.filter((file) => file.type.startsWith('image/'));
      if (validFiles.length !== incoming.length) {
        throw new Error('Some files were ignored because they are not images.');
      }
      appendFiles(validFiles);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      setError(message);
    } finally {
      event.target.value = '';
    }
  };

  const processZipUpload = async (zipFile: File) => {
    const { default: JSZip } = await import('jszip');
    const archive = await JSZip.loadAsync(zipFile);
    const imageEntries = Object.values(archive.files).filter((entry) => {
      if (entry.dir) {
        return false;
      }
      const lower = entry.name.toLowerCase();
      return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp');
    });

    if (imageEntries.length === 0) {
      throw new Error('No supported image files found in ZIP.');
    }
    if (imageEntries.length > MAX_FILES_PER_UPLOAD) {
      throw new Error(`ZIP contains ${imageEntries.length} images. Max is ${MAX_FILES_PER_UPLOAD}.`);
    }
    if (photos.length + imageEntries.length > MAX_FILES_PER_UPLOAD) {
      throw new Error(`ZIP upload would exceed ${MAX_FILES_PER_UPLOAD} images total.`);
    }

    const extractedFiles: File[] = [];
    for (const entry of imageEntries) {
      const blob = await entry.async('blob');
      const fileName = entry.name.split('/').pop() || `image-${extractedFiles.length + 1}.png`;
      extractedFiles.push(new File([blob], fileName, { type: blob.type || 'image/png' }));
    }

    appendFiles(extractedFiles);
    setStatus(`ZIP extracted: ${extractedFiles.length} image${extractedFiles.length > 1 ? 's' : ''}.`);
  };

  const onZipFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const zipFile = event.target.files?.[0] || null;
    setError('');
    setStatus('');
    clearConvertedForAll();

    if (!zipFile) {
      return;
    }
    if (!zipFile.name.toLowerCase().endsWith('.zip')) {
      setError('Please upload a .zip file.');
      event.target.value = '';
      return;
    }

    try {
      await processZipUpload(zipFile);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not read ZIP file.';
      setError(message);
    } finally {
      event.target.value = '';
    }
  };

  const onDropFiles = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    setError('');
    setStatus('');
    clearConvertedForAll();

    const dropped = Array.from(event.dataTransfer.files || []);
    if (dropped.length === 0) {
      return;
    }

    try {
      const zipFiles = dropped.filter((file) => file.name.toLowerCase().endsWith('.zip'));
      const imageFiles = dropped.filter((file) => file.type.startsWith('image/'));

      if (zipFiles.length > 1) {
        throw new Error('Drop only one ZIP at a time.');
      }
      if (zipFiles.length === 1 && imageFiles.length > 0) {
        throw new Error('Drop either images or a ZIP file, not both together.');
      }

      if (zipFiles.length === 1) {
        await processZipUpload(zipFiles[0]);
        return;
      }

      if (imageFiles.length !== dropped.length) {
        throw new Error('Some dropped files are not supported images.');
      }

      appendFiles(imageFiles);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Drop upload failed.';
      setError(message);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((photo) => photo.id === id);
      if (target) {
        releaseObjectUrl(target.previewUrl);
        releaseObjectUrl(target.convertedUrl);
      }
      return prev.filter((photo) => photo.id !== id);
    });
  };

  const convertSingleImage = async (photo: PhotoItem): Promise<PhotoItem> => {
    const imageUrl = photo.previewUrl;

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to read ${photo.file.name}`));
      image.src = imageUrl;
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
            reject(new Error(`Could not convert ${photo.file.name}`));
            return;
          }
          resolve(nextBlob);
        },
        targetFormat,
        targetFormat === 'image/png' ? undefined : quality
      );
    });

    releaseObjectUrl(photo.convertedUrl);

    return {
      ...photo,
      convertedBlob: blob,
      convertedUrl: registerObjectUrl(URL.createObjectURL(blob)),
    };
  };

  const convertAllImages = async () => {
    if (photos.length === 0) {
      setError('Upload photos first.');
      return;
    }

    setError('');
    setStatus('Converting images...');
    setIsConverting(true);
    setConversionProgress(0);
    setConversionTotal(photos.length);

    try {
      const converted: PhotoItem[] = [];
      for (let index = 0; index < photos.length; index += 1) {
        const item = photos[index];
        const next = await convertSingleImage(item);
        converted.push(next);
        setConversionProgress(index + 1);
        setStatus(`Converting ${index + 1}/${photos.length}...`);
      }
      setPhotos(converted);
      setStatus(`Converted ${converted.length} image${converted.length > 1 ? 's' : ''}.`);
      setActiveSection('export');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image conversion failed.';
      setError(message);
      setStatus('');
    } finally {
      setIsConverting(false);
    }
  };

  const downloadOne = (photo: PhotoItem) => {
    if (!photo.convertedUrl || !photo.convertedBlob) {
      return;
    }

    const fileName = photo.file.name.replace(/\.[^/.]+$/, '');
    const link = document.createElement('a');
    link.href = photo.convertedUrl;
    link.download = `${fileName}.${selectedFormat.ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllAsZip = async () => {
    const readyPhotos = photos.filter((photo) => photo.convertedBlob);
    if (readyPhotos.length === 0) {
      setError('No converted files to export yet.');
      return;
    }

    setError('');
    setIsDownloadingAll(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      readyPhotos.forEach((photo, index) => {
        const fileName = photo.file.name.replace(/\.[^/.]+$/, '');
        zip.file(`${String(index + 1).padStart(2, '0')}-${fileName}.${selectedFormat.ext}`, photo.convertedBlob as Blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = zipUrl;
      const now = new Date();
      const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      link.download = `photos-converted-${stamp}-${selectedFormat.ext}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(zipUrl);
      setStatus(`Downloaded ZIP with ${readyPhotos.length} file${readyPhotos.length > 1 ? 's' : ''}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create ZIP download.';
      setError(message);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const applyCompressionPreset = (preset: CompressionPreset) => {
    setCompressionPreset(preset);
    if (preset === 'low') {
      setQuality(0.55);
      return;
    }
    if (preset === 'medium') {
      setQuality(0.75);
      return;
    }
    if (preset === 'high') {
      setQuality(0.9);
    }
  };

  const totalOriginalBytes = photos.reduce((sum, photo) => sum + photo.file.size, 0);
  const totalConvertedBytes = photos.reduce((sum, photo) => sum + (photo.convertedBlob?.size || 0), 0);
  const originalSizeLabel = photos.length ? `${(totalOriginalBytes / 1024).toFixed(1)} KB` : '-';
  const convertedSizeLabel = totalConvertedBytes ? `${(totalConvertedBytes / 1024).toFixed(1)} KB` : '-';
  const convertedCount = photos.filter((photo) => photo.convertedBlob).length;
  const savingsPercent = totalOriginalBytes > 0 && totalConvertedBytes > 0
    ? Math.max(0, Math.round(((totalOriginalBytes - totalConvertedBytes) / totalOriginalBytes) * 100))
    : 0;

  const menuItems: Array<{ id: PhotosSection; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'convert', label: 'Convert', icon: SlidersHorizontal },
    { id: 'export', label: 'Export', icon: Download },
  ];

  return (
    <>
      <Tile
        size={size}
        icon={Images}
        accentType={accent}
        opacity={opacity}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex w-full items-center justify-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">Photos</p>
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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(214,199,177,0.28)_0%,rgba(214,199,177,0.06)_28%,transparent_50%),radial-gradient(circle_at_84%_14%,rgba(156,171,135,0.26)_0%,rgba(156,171,135,0.05)_26%,transparent_44%),rgba(10,10,10,0.45)] backdrop-blur-2xl" />
            <motion.div
              className="relative z-10 flex h-[82vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/28 text-foreground shadow-[0_30px_90px_rgba(39,30,24,0.28)] backdrop-blur-3xl backdrop-saturate-150"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/20 bg-[linear-gradient(135deg,rgba(255,248,241,0.60)_0%,rgba(247,235,225,0.38)_42%,rgba(228,235,221,0.34)_100%)] p-5 backdrop-blur-xl backdrop-saturate-150 dark:bg-[linear-gradient(135deg,rgba(60,47,39,0.65)_0%,rgba(45,37,31,0.54)_45%,rgba(74,81,64,0.48)_100%)] md:p-6 flex-shrink-0">
                <div>
                  <h2 className="text-[1.1rem] font-medium tracking-tight text-foreground md:text-xl">Photos</h2>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-foreground/45 md:text-xs">converter lab</p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-white/25 bg-white/20 p-2.5 text-foreground/80 transition-all duration-200 hover:bg-white/35 hover:text-foreground backdrop-blur-md"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col md:flex-row">
                <aside className="border-b border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.06)_100%)] p-2.5 backdrop-blur-xl backdrop-saturate-150 md:w-[220px] md:border-b-0 md:border-r md:p-3.5 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)]">
                  <div className="mb-2 rounded-[20px] border border-white/20 bg-white/18 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] dark:bg-white/8">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/45">Navigation</p>
                    <p className="mt-1 text-sm text-foreground/70">Image workflow</p>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 md:grid-cols-1">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const active = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveSection(item.id)}
                          className={`flex items-center gap-2.5 rounded-[16px] border px-3 py-2.5 text-left text-xs transition-all ${
                            active
                              ? 'border-white/30 bg-white/30 text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.10)]'
                              : 'border-white/15 bg-white/12 text-foreground/70 hover:border-white/25 hover:bg-white/20'
                          }`}
                        >
                          <Icon size={14} className={active ? 'text-accent-primary' : ''} />
                          <span className="truncate font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <div className="min-h-0 flex-1 overflow-hidden p-4 md:p-5">
                  {activeSection === 'upload' && (
                    <section className="grid h-full min-h-0 gap-4 md:grid-cols-[1.05fr_0.95fr]">
                      <div className="flex min-h-0 flex-col gap-4 rounded-[24px] border border-white/20 bg-[linear-gradient(135deg,rgba(255,250,245,0.66)_0%,rgba(250,244,238,0.40)_100%)] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:bg-[linear-gradient(135deg,rgba(58,46,39,0.66)_0%,rgba(48,40,33,0.52)_100%)]">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-foreground/45" />
                          <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground">Upload</h3>
                          <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-foreground/45">{photos.length}/{MAX_FILES_PER_UPLOAD}</span>
                        </div>
                        <p className="text-xs text-foreground/60">Add up to 10 images each time, or upload a ZIP that contains up to 10 images.</p>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[18px] border border-white/25 bg-white/20 px-4 py-4 text-sm text-foreground/80 transition hover:bg-white/30">
                            <Upload size={16} />
                            Add Images
                            <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={onImageFilesChange} />
                          </label>
                          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[18px] border border-white/25 bg-white/20 px-4 py-4 text-sm text-foreground/80 transition hover:bg-white/30">
                            <FolderArchive size={16} />
                            Upload ZIP
                            <input type="file" accept=".zip,application/zip" className="hidden" onChange={onZipFileChange} />
                          </label>
                        </div>

                        <div
                          onDragOver={(event) => {
                            event.preventDefault();
                            setIsDragOver(true);
                          }}
                          onDragLeave={() => setIsDragOver(false)}
                          onDrop={onDropFiles}
                          className={`rounded-[18px] border border-dashed px-4 py-4 text-center text-sm transition ${
                            isDragOver
                              ? 'border-white/45 bg-white/35 text-foreground'
                              : 'border-white/25 bg-white/14 text-foreground/70'
                          }`}
                        >
                          Drag and drop images or one ZIP here
                        </div>

                        <div className="flex items-center justify-between rounded-[16px] border border-white/18 bg-white/14 px-3 py-2 text-xs text-foreground/70">
                          <span>{convertedCount > 0 ? `${savingsPercent}% smaller after convert` : 'Ready to batch convert'}</span>
                          <button
                            type="button"
                            onClick={resetAll}
                            disabled={photos.length === 0}
                            className="inline-flex items-center gap-1 rounded-md border border-white/25 bg-white/25 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground transition hover:bg-white/35 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={12} />
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="flex min-h-0 flex-col gap-3 rounded-[24px] border border-white/20 bg-white/16 p-4 backdrop-blur-md dark:bg-white/8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground">Queue</h3>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/45">Preview</span>
                        </div>
                        <div className="grid flex-1 grid-cols-2 gap-2 overflow-hidden sm:grid-cols-3 lg:grid-cols-4">
                          {photos.map((photo) => (
                            <div key={photo.id} className="group relative overflow-hidden rounded-[16px] border border-white/15 bg-white/12">
                              <img src={photo.previewUrl} alt={photo.file.name} className="h-24 w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removePhoto(photo.id)}
                                className="absolute right-1.5 top-1.5 rounded-full border border-white/25 bg-black/35 p-1 text-white opacity-0 transition group-hover:opacity-100"
                                aria-label="Remove photo"
                              >
                                <X size={12} />
                              </button>
                              <div className="truncate px-2 py-1.5 text-[10px] text-foreground/75">{photo.file.name}</div>
                            </div>
                          ))}
                          {photos.length === 0 && (
                            <div className="col-span-full flex h-full items-center justify-center rounded-[16px] border border-dashed border-white/18 bg-white/8 text-center text-xs text-foreground/45">
                              No photos yet
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {activeSection === 'convert' && (
                    <section className="grid h-full min-h-0 gap-4 md:grid-cols-[1fr_0.95fr]">
                      <div className="rounded-[24px] border border-white/20 bg-[linear-gradient(135deg,rgba(255,247,239,0.72)_0%,rgba(244,235,225,0.52)_100%)] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:bg-[linear-gradient(135deg,rgba(57,46,39,0.70)_0%,rgba(45,38,32,0.52)_100%)]">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground">Convert Settings</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {FORMAT_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setTargetFormat(option.value)}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
                                targetFormat === option.value
                                  ? 'border-white/35 bg-white/45 text-foreground'
                                  : 'border-white/20 bg-white/10 text-foreground/70 hover:bg-white/20'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>

                        {(targetFormat === 'image/jpeg' || targetFormat === 'image/webp') && (
                          <>
                            <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-foreground/50">Compress Preset</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(['low', 'medium', 'high'] as CompressionPreset[]).map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => applyCompressionPreset(preset)}
                                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                                    compressionPreset === preset
                                      ? 'border-white/35 bg-white/45 text-foreground'
                                      : 'border-white/20 bg-white/10 text-foreground/70 hover:bg-white/20'
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </>
                        )}

                        {(targetFormat === 'image/jpeg' || targetFormat === 'image/webp') && (
                          <div className="mt-4">
                            <div className="mb-2 flex items-center justify-between text-xs text-foreground/60">
                              <span>Quality</span>
                              <span>{Math.round(quality * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min={40}
                              max={100}
                              value={Math.round(quality * 100)}
                              onChange={(event) => {
                                setQuality(Number(event.target.value) / 100);
                                setCompressionPreset('custom');
                              }}
                              className="w-full accent-accent-primary"
                            />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={convertAllImages}
                          disabled={photos.length === 0 || isConverting}
                          className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-white/60 px-3 py-3 text-sm font-semibold text-black transition hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <WandSparkles size={15} />
                          {isConverting ? 'Converting...' : `Convert ${photos.length || 0} image${photos.length === 1 ? '' : 's'}`}
                        </button>

                        {isConverting && conversionTotal > 0 && (
                          <div className="mt-4 rounded-[14px] border border-white/20 bg-white/16 p-3">
                            <div className="mb-2 flex items-center justify-between text-xs text-foreground/65">
                              <span>Progress</span>
                              <span>{conversionProgress}/{conversionTotal}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/25">
                              <div
                                className="h-full rounded-full bg-white/70 transition-all duration-300"
                                style={{ width: `${Math.round((conversionProgress / conversionTotal) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex min-h-0 flex-col gap-3 rounded-[24px] border border-white/20 bg-white/16 p-4 backdrop-blur-md dark:bg-white/8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground">Summary</h3>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/45">{convertedCount} done</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-[16px] border border-white/18 bg-white/14 p-3">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/45">Original</p>
                            <p className="mt-1 font-semibold text-foreground">{originalSizeLabel}</p>
                          </div>
                          <div className="rounded-[16px] border border-white/18 bg-white/14 p-3">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/45">Converted</p>
                            <p className="mt-1 font-semibold text-foreground">{convertedSizeLabel}</p>
                          </div>
                          <div className="rounded-[16px] border border-white/18 bg-white/14 p-3 col-span-2">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/45">Savings</p>
                            <p className="mt-1 font-semibold text-foreground">{convertedCount > 0 ? `${savingsPercent}% smaller` : '-'}</p>
                          </div>
                        </div>
                        <p className="rounded-[16px] border border-white/18 bg-white/10 px-3 py-2 text-xs text-foreground/60">
                          Convert only when the queue is ready. This keeps the workflow linear and removes extra steps.
                        </p>
                      </div>
                    </section>
                  )}

                  {activeSection === 'export' && (
                    <section className="grid h-full min-h-0 gap-4 md:grid-cols-[1fr_0.95fr]">
                      <div className="rounded-[24px] border border-white/20 bg-white/16 p-4 backdrop-blur-md dark:bg-white/8">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground">Export</h3>
                        <p className="mt-2 text-xs text-foreground/60">Download all converted images as one ZIP or save a single file.</p>

                        <button
                          type="button"
                          onClick={downloadAllAsZip}
                          disabled={convertedCount === 0 || isDownloadingAll}
                          className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-white/25 bg-white/35 px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-white/45 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <FolderArchive size={14} />
                          {isDownloadingAll ? 'Preparing ZIP...' : 'Download All (.zip)'}
                        </button>

                        <div className="mt-4 rounded-[16px] border border-white/18 bg-white/10 px-3 py-2 text-xs text-foreground/60">
                          Tip: each individual file is already downloadable from the queue.
                        </div>
                      </div>

                      <div className="flex min-h-0 flex-col gap-2 rounded-[24px] border border-white/20 bg-white/16 p-4 backdrop-blur-md dark:bg-white/8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-foreground">Files</h3>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/45">{photos.length}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 overflow-hidden">
                          {photos.map((photo) => (
                            <div key={`${photo.id}-export`} className="flex items-center justify-between rounded-[14px] border border-white/18 bg-white/12 px-3 py-2">
                              <span className="truncate pr-2 text-xs text-foreground/75">{photo.file.name}</span>
                              <button
                                type="button"
                                onClick={() => downloadOne(photo)}
                                disabled={!photo.convertedUrl}
                                className="inline-flex items-center gap-1 rounded-md border border-white/25 bg-white/30 px-2.5 py-1 text-xs font-semibold text-foreground transition hover:bg-white/45 disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                <Download size={12} />
                                Download
                              </button>
                            </div>
                          ))}
                          {photos.length === 0 && (
                            <div className="rounded-[14px] border border-dashed border-white/18 bg-white/8 px-3 py-6 text-center text-xs text-foreground/45">
                              Nothing to export yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {error && (
                    <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p>
                  )}
                  {status && !error && (
                    <p className="mt-4 rounded-lg border border-white/20 bg-white/20 px-3 py-2 text-sm text-foreground/85">{status}</p>
                  )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PhotosTile;
