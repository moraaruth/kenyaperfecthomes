import React, { useState, useRef, useCallback } from 'react';
import { PropertyImage } from '../../types';
import {
  Upload,
  Camera,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

/**
 * Resolves a raw secureUrl value to a renderable src string.
 *
 * Handles four cases:
 *  1. Already a full URL (https:// or http://)  → use as-is
 *  2. A data: URI (base64 dev fallback)          → use as-is
 *  3. A valid absolute path (/images/foo.jpg)    → use as-is
 *  4. A bare filename or relative path           → treat as broken, return fallback
 */
const FALLBACK_IMAGE_SRC = '/images/property_westlands_apartment_1794311302942.jpg';

function resolveImageSrc(secureUrl: string | undefined): string {
  const FALLBACK = FALLBACK_IMAGE_SRC;
  if (!secureUrl) return FALLBACK;
  if (
    secureUrl.startsWith('http://') ||
    secureUrl.startsWith('https://') ||
    secureUrl.startsWith('data:') ||
    secureUrl.startsWith('blob:') ||
    secureUrl.startsWith('/')
  ) {
    return secureUrl;
  }
  // Bare filename or relative path — not resolvable safely
  return FALLBACK;
}

interface UploadItem {
  id: string;
  file?: File;
  previewUrl: string;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'failed';
  progress: number;
  errorMessage?: string;
  imageMetadata?: PropertyImage;
}

interface PropertyImageUploaderProps {
  images: PropertyImage[];
  onChange: (images: PropertyImage[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export const PropertyImageUploader: React.FC<PropertyImageUploaderProps> = ({
  images,
  onChange,
  maxFiles = 50,
  maxSizeMB = 25,
}) => {
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  // Image srcs that failed to load; those slots render the fallback via state, not DOM mutation
  const [failedSrcs, setFailedSrcs] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Latest images list. Updated synchronously on every commit so concurrent uploads build on each other
  const imagesRef = useRef<PropertyImage[]>(images);
  imagesRef.current = images;
  // Track object URLs we created so we can revoke them on cleanup
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const revokeObjectUrl = useCallback((url: string) => {
    if (url.startsWith('blob:') && objectUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      objectUrlsRef.current.delete(url);
    }
  }, []);

  const updateImagesList = (newImages: PropertyImage[]) => {
    const reindexed = newImages.map((img, idx) => ({ ...img, sortOrder: idx }));
    if (!reindexed.some((img) => img.isCover) && reindexed.length > 0) reindexed[0].isCover = true;
    imagesRef.current = reindexed;
    onChange(reindexed);
  };

  const uploadSingleFile = async (item: UploadItem) => {
    if (!item.file) return;

    setUploadQueue((prev) =>
      prev.map((i) => i.id === item.id ? { ...i, status: 'uploading', progress: 30 } : i)
    );

    const formData = new FormData();
    formData.append('image', item.file);

    try {
      setUploadQueue((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, status: 'processing', progress: 75 } : i)
      );

      const token = typeof window !== 'undefined' ? localStorage.getItem('ph_admin_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Server rejected image upload');
      }

      const uploadedMetadata: PropertyImage = await res.json();

      setUploadQueue((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: 'done', progress: 100, imageMetadata: uploadedMetadata } : i
        )
      );

      // Use ref so concurrent uploads always append to the latest list, never a stale snapshot
      updateImagesList([...imagesRef.current, uploadedMetadata]);

      const completedId = item.id;
      const completedPreviewUrl = item.previewUrl;
      setTimeout(() => {
        if (completedPreviewUrl) revokeObjectUrl(completedPreviewUrl);
        setUploadQueue((prev) => prev.filter((i) => i.id !== completedId));
      }, 1200);
    } catch (err: any) {
      setUploadQueue((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'failed', errorMessage: err.message || 'Upload failed. Check format or connection.' }
            : i
        )
      );
    }
  };

  // Run up to 3 uploads concurrently; queue the rest
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const remaining = maxFiles - images.length;
    if (remaining <= 0) {
      alert(`Maximum ${maxFiles} photos allowed.`);
      return;
    }

    const files = Array.from(fileList).slice(0, remaining);
    const newItems: UploadItem[] = [];

    for (const file of files) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`"${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max is ${maxSizeMB}MB.`);
        continue;
      }
      let previewUrl = '';
      try {
        previewUrl = URL.createObjectURL(file);
        objectUrlsRef.current.add(previewUrl);
      } catch { previewUrl = ''; }
      newItems.push({
        id: `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        status: 'pending',
        progress: 0,
      });
    }

    if (newItems.length === 0) return;
    setUploadQueue((prev) => [...prev, ...newItems]);

    // Upload in batches of 3 concurrently
    const CONCURRENCY = 3;
    const runBatch = async (batch: UploadItem[]) => {
      await Promise.all(batch.map(uploadSingleFile));
    };
    const runAll = async () => {
      for (let i = 0; i < newItems.length; i += CONCURRENCY) {
        await runBatch(newItems.slice(i, i + CONCURRENCY));
      }
    };
    runAll();
  };

  // Delete an image
  const handleDeleteImage = async (index: number) => {
    const target = images[index];
    if (!target) return;

    // Remove from UI immediately
    const remaining = images.filter((_, i) => i !== index);
    updateImagesList(remaining);

    // Call server to destroy Cloudinary asset asynchronously
    if (target.publicId && !target.publicId.startsWith('default_') && !target.publicId.startsWith('sample_')) {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('ph_admin_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await fetch(`/api/images/${encodeURIComponent(target.publicId)}`, {
          method: 'DELETE',
          headers,
          credentials: 'include',
        });
      } catch (err) {
        console.warn('Failed to delete asset from Cloudinary:', err);
      }
    }
  };

  // Set an image as cover photo
  const handleSetCover = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isCover: i === index,
    }));
    onChange(updated);
  };

  // Mobile & Desktop reordering
  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    updateImagesList(updated);
  };

  // Drag and drop handlers for desktop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (!sourceIndexStr) return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const updated = [...images];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);
    updateImagesList(updated);
  };

  const totalUploading = uploadQueue.filter((i) => i.status === 'uploading' || i.status === 'processing').length;

  return (
    <div className="space-y-4 text-left">
      {/* Hidden file input supporting camera capture & multi-selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif,.avif,.webp,.svg"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Main Drag & Drop / Mobile Tap Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-brand-700 bg-brand-50/80 scale-[1.01]'
            : 'border-neutral-300 hover:border-brand-600 bg-neutral-50/60 hover:bg-neutral-50'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center shadow-xs">
            <Camera className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-base font-bold text-neutral-900">
              Add Property Photos
            </h4>
            <p className="text-xs text-neutral-500 mt-1">
              Tap to take photo with phone camera, choose from library, or drag & drop files
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-semibold text-neutral-600">
            <span className="bg-white px-2.5 py-1 rounded-md border border-neutral-200">
              iPhone HEIC / HEIF
            </span>
            <span className="bg-white px-2.5 py-1 rounded-md border border-neutral-200">
              JPG / PNG / WEBP
            </span>
            <span className="bg-white px-2.5 py-1 rounded-md border border-neutral-200">
              Up to 25MB per photo
            </span>
            <span className="bg-white px-2.5 py-1 rounded-md border border-neutral-200">
              Multiple selection
            </span>
          </div>

          <button
            type="button"
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-800 text-white font-bold text-xs shadow-xs hover:bg-brand-900 transition-colors"
          >
            <Upload className="w-4 h-4 text-amber-300" />
            <span>Select Photos from Device</span>
          </button>
        </div>
      </div>

      {/* Upload Progress Tracker */}
      {uploadQueue.length > 0 && (
        <div className="bg-neutral-900 text-white p-4 rounded-xl space-y-3 shadow-md animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-2 text-amber-300">
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              <span>Cloudinary Processing ({totalUploading} active)</span>
            </span>
            <span className="text-neutral-400">
              {uploadQueue.filter((i) => i.status === 'done').length} of {uploadQueue.length} processed
            </span>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {uploadQueue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 bg-neutral-800 p-2.5 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt="preview"
                      className="w-8 h-8 rounded object-cover shrink-0"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-neutral-400 shrink-0" />
                  )}
                  <span className="truncate text-neutral-200">{item.file?.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'uploading' && (
                    <span className="text-amber-300 text-[11px] font-semibold">Uploading...</span>
                  )}
                  {item.status === 'processing' && (
                    <span className="text-blue-300 text-[11px] font-semibold">Optimizing...</span>
                  )}
                  {item.status === 'done' && (
                    <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Uploaded
                    </span>
                  )}
                  {item.status === 'failed' && (
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 text-[11px] font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Failed
                      </span>
                      <button
                        type="button"
                        onClick={() => uploadSingleFile(item)}
                        className="text-white bg-rose-600 hover:bg-rose-500 px-2 py-0.5 rounded text-[10px] font-bold"
                      >
                        Retry
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadQueue((prev) => prev.filter((i) => i.id !== item.id))}
                        className="text-neutral-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Uploaded / Existing Photos with Mobile Reorder & Cover Selection */}
      {images.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span className="font-bold">
              Property Photo Gallery ({images.length} {images.length === 1 ? 'photo' : 'photos'})
            </span>
            <span className="text-neutral-400 text-[11px]">
              Drag or use arrows to reorder · Star marks cover photo
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {images.map((img, idx) => {
              const isCover = Boolean(img.isCover || idx === 0);
              const resolvedSrc = resolveImageSrc(img.secureUrl);
              const displaySrc = failedSrcs[resolvedSrc] ? FALLBACK_IMAGE_SRC : resolvedSrc;
              return (
                <div
                  key={`${img.publicId || 'no-id'}|${img.secureUrl || ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={`group relative rounded-xl overflow-hidden aspect-[4/3] bg-neutral-100 border-2 transition-all shadow-xs ${
                    isCover
                      ? 'border-brand-700 ring-2 ring-brand-300'
                      : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <img
                    src={displaySrc}
                    alt={img.originalFilename || `Photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => {
                      if (!failedSrcs[resolvedSrc]) {
                        setFailedSrcs((prev) => ({ ...prev, [resolvedSrc]: true }));
                      }
                    }}
                  />

                  {/* Gradient Scrim for Controls */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Top Bar: Cover Badge & Delete */}
                  <div className="absolute top-2 inset-x-2 flex items-center justify-between z-10">
                    <button
                      type="button"
                      onClick={() => handleSetCover(idx)}
                      title={isCover ? 'Cover Photo' : 'Set as Cover Photo'}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                        isCover
                          ? 'bg-amber-400 text-neutral-950 shadow-sm'
                          : 'bg-black/60 text-white hover:bg-amber-400 hover:text-neutral-950'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${isCover ? 'fill-current' : ''}`} />
                      <span>{isCover ? 'COVER' : 'Make Cover'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteImage(idx)}
                      title="Remove photo"
                      className="w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bottom Bar: Touch-Friendly Mobile Reordering Arrows */}
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between text-white text-[11px] z-10">
                    <span className="font-bold bg-black/60 px-1.5 py-0.5 rounded text-[10px]">
                      #{idx + 1}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'left')}
                        title="Move Earlier"
                        className="w-6 h-6 rounded bg-black/70 hover:bg-brand-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => handleMove(idx, 'right')}
                        title="Move Later"
                        className="w-6 h-6 rounded bg-black/70 hover:bg-brand-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
