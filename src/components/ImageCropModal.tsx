"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Check, X, RotateCw, ZoomIn, ZoomOut, Crop, Move, Eye } from "lucide-react";

export type AspectRatioType = 1 | 1.7777777777777777 | 1.3333333333333333 | 0.75 | "free";
export type CropShapeType = "rect" | "circle";

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  title?: string;
  aspectRatio?: AspectRatioType;
  cropShape?: CropShapeType;
  onCropComplete: (croppedBlob: Blob, croppedDataUrl: string) => void;
  onCancel: () => void;
}

export function ImageCropModal({
  isOpen,
  imageSrc,
  title = "Crop & Frame Image",
  aspectRatio: initialAspect = 1,
  cropShape = "rect",
  onCropComplete,
  onCancel,
}: ImageCropModalProps) {
  const [selectedAspect, setSelectedAspect] = useState<AspectRatioType>(initialAspect);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  
  // Crop selection coordinates normalized (percentages: 0 to 100)
  const [crop, setCrop] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imgNaturalSize, setImgNaturalSize] = useState<{ w: number; h: number }>({ w: 800, h: 600 });
  const [livePreviewUrl, setLivePreviewUrl] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Force aspect ratio to 1:1 if circle crop shape is requested
  const effectiveAspect = cropShape === "circle" ? 1 : selectedAspect;

  // Initialize aspect ratio and crop area when modal opens or image loads
  const initCropArea = useCallback((aspect: AspectRatioType, imgW: number, imgH: number) => {
    if (imgW <= 0 || imgH <= 0) return;

    if (aspect === "free") {
      setCrop({ x: 10, y: 10, width: 80, height: 80 });
      return;
    }

    const containerAspect = imgW / imgH;
    let targetW = 80;
    let targetH = 80;

    if (aspect > containerAspect) {
      targetW = 80;
      targetH = (80 * containerAspect) / aspect;
    } else {
      targetH = 80;
      targetW = (80 * aspect) / containerAspect;
    }

    const x = Math.max(0, (100 - targetW) / 2);
    const y = Math.max(0, (100 - targetH) / 2);

    setCrop({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      width: Math.round(targetW * 10) / 10,
      height: Math.round(targetH * 10) / 10,
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedAspect(cropShape === "circle" ? 1 : initialAspect);
      setZoom(1);
      setRotation(0);
      setImageLoaded(false);
      setLivePreviewUrl("");
    }
  }, [isOpen, initialAspect, cropShape, imageSrc]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImgNaturalSize({ w: naturalWidth, h: naturalHeight });
    setImageLoaded(true);
    initCropArea(effectiveAspect, naturalWidth, naturalHeight);
  };

  const handleAspectChange = (newAspect: AspectRatioType) => {
    if (cropShape === "circle") return;
    setSelectedAspect(newAspect);
    if (imgNaturalSize.w > 0) {
      initCropArea(newAspect, imgNaturalSize.w, imgNaturalSize.h);
    }
  };

  // Drag Handlers for Crop Box and Handles
  const handlePointerDown = (e: React.PointerEvent, handle: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setActiveHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const deltaXPercent = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - dragStart.y) / rect.height) * 100;

      setDragStart({ x: e.clientX, y: e.clientY });

      setCrop((prev) => {
        let { x, y, width, height } = prev;

        if (activeHandle === null) {
          x = Math.max(0, Math.min(100 - width, x + deltaXPercent));
          y = Math.max(0, Math.min(100 - height, y + deltaYPercent));
          return { x, y, width, height };
        }

        let newX = x;
        let newY = y;
        let newW = width;
        let newH = height;

        if (activeHandle.includes("e")) newW = Math.max(15, Math.min(100 - x, width + deltaXPercent));
        if (activeHandle.includes("w")) {
          const possibleW = width - deltaXPercent;
          if (possibleW >= 15 && x + deltaXPercent >= 0) {
            newX = x + deltaXPercent;
            newW = possibleW;
          }
        }
        if (activeHandle.includes("s")) newH = Math.max(15, Math.min(100 - y, height + deltaYPercent));
        if (activeHandle.includes("n")) {
          const possibleH = height - deltaYPercent;
          if (possibleH >= 15 && y + deltaYPercent >= 0) {
            newY = y + deltaYPercent;
            newH = possibleH;
          }
        }

        if (effectiveAspect !== "free" && imgNaturalSize.w > 0) {
          const containerAspect = imgNaturalSize.w / imgNaturalSize.h;
          if (activeHandle === "e" || activeHandle === "w") {
            newH = (newW * containerAspect) / effectiveAspect;
          } else {
            newW = (newH * effectiveAspect) / containerAspect;
          }

          if (newX + newW > 100) newW = 100 - newX;
          if (newY + newH > 100) newH = 100 - newY;
        }

        return {
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.round(newW * 10) / 10,
          height: Math.round(newH * 10) / 10,
        };
      });
    },
    [isDragging, dragStart, activeHandle, effectiveAspect, imgNaturalSize]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setActiveHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    } else {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Generate cropped result canvas & update live preview URL
  const generateCroppedBlob = useCallback((): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const img = imgRef.current;
      if (!img) return reject(new Error("Image element not ready"));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas 2D context unavailable"));

      const cropPxX = (crop.x / 100) * imgNaturalSize.w;
      const cropPxY = (crop.y / 100) * imgNaturalSize.h;
      const cropPxW = (crop.width / 100) * imgNaturalSize.w;
      const cropPxH = (crop.height / 100) * imgNaturalSize.h;

      const maxDim = 1200;
      let targetW = cropPxW;
      let targetH = cropPxH;

      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDim) / targetW);
          targetW = maxDim;
        } else {
          targetW = Math.round((targetW * maxDim) / targetH);
          targetH = maxDim;
        }
      }

      canvas.width = Math.max(1, Math.round(targetW));
      canvas.height = Math.max(1, Math.round(targetH));

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(
        img,
        cropPxX,
        cropPxY,
        cropPxW,
        cropPxH,
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.restore();

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Failed to export crop canvas"));
          const dataUrl = canvas.toDataURL("image/webp", 0.9);
          resolve({ blob, dataUrl });
        },
        "image/webp",
        0.9
      );
    });
  }, [crop, imgNaturalSize]);

  // Update live preview URL as user crops or zooms
  useEffect(() => {
    if (!imageLoaded) return;
    const timer = setTimeout(() => {
      generateCroppedBlob()
        .then(({ dataUrl }) => setLivePreviewUrl(dataUrl))
        .catch(() => {});
    }, 50);

    return () => clearTimeout(timer);
  }, [crop, zoom, rotation, imageLoaded, generateCroppedBlob]);

  const handleApply = async () => {
    try {
      const { blob, dataUrl } = await generateCroppedBlob();
      onCropComplete(blob, dataUrl);
    } catch (err) {
      console.error("Failed to crop image:", err);
      alert("Error cropping image. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#1c1b18] border border-[#3d372e] text-[#f4efe6] rounded-2xl max-w-4xl w-full p-6 shadow-2xl flex flex-col space-y-5 relative">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#3d372e] pb-3">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-[#d4af37]" />
            <h3 className="font-serif text-lg font-bold text-[#f4efe6] tracking-wide">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Toolbar (Disabled if circle crop shape) */}
        {cropShape !== "circle" ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-[#292621] p-2.5 rounded-xl border border-[#3d372e]">
            <span className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">Crop Aspect:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAspectChange(1)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedAspect === 1
                    ? "bg-[#d4af37] text-black shadow"
                    : "bg-[#1c1b18] text-gray-300 hover:bg-[#38332b]"
                }`}
              >
                1:1 Square
              </button>
              <button
                type="button"
                onClick={() => handleAspectChange(1.7777777777777777)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedAspect === 1.7777777777777777
                    ? "bg-[#d4af37] text-black shadow"
                    : "bg-[#1c1b18] text-gray-300 hover:bg-[#38332b]"
                }`}
              >
                16:9 Banner
              </button>
              <button
                type="button"
                onClick={() => handleAspectChange(0.75)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedAspect === 0.75
                    ? "bg-[#d4af37] text-black shadow"
                    : "bg-[#1c1b18] text-gray-300 hover:bg-[#38332b]"
                }`}
              >
                3:4 Portrait
              </button>
              <button
                type="button"
                onClick={() => handleAspectChange(1.3333333333333333)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedAspect === 1.3333333333333333
                    ? "bg-[#d4af37] text-black shadow"
                    : "bg-[#1c1b18] text-gray-300 hover:bg-[#38332b]"
                }`}
              >
                4:3 Landscape
              </button>
              <button
                type="button"
                onClick={() => handleAspectChange("free")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedAspect === "free"
                    ? "bg-[#d4af37] text-black shadow"
                    : "bg-[#1c1b18] text-gray-300 hover:bg-[#38332b]"
                }`}
              >
                Free Form
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#292621] p-2 px-3 rounded-xl border border-[#3d372e] flex items-center justify-between text-xs text-[#d4af37]">
            <span className="font-semibold text-[11px] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Circular Avatar Crop Mode (1:1 Frame)
            </span>
            <span className="text-[10px] text-gray-400">Position face in circle</span>
          </div>
        )}

        {/* Main Workspace: Interactive Cropper Viewport (Left) + Live Template Preview (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          
          {/* Interactive Canvas Viewport (2 Cols) */}
          <div className="md:col-span-2 relative w-full h-[320px] bg-black/60 rounded-xl border border-[#3d372e] overflow-hidden flex items-center justify-center select-none">
            <div
              ref={containerRef}
              className="relative max-w-full max-h-full inline-block overflow-hidden"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: isDragging ? "none" : "transform 0.2s ease-out",
              }}
            >
              {/* Base Image */}
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview source"
                onLoad={handleImageLoad}
                crossOrigin="anonymous"
                className="max-h-[310px] w-auto object-contain block mx-auto pointer-events-none"
              />

              {/* Darkened Overlay outside crop box */}
              {imageLoaded && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Top mask */}
                  <div
                    className="absolute bg-black/60 inset-x-0 top-0"
                    style={{ height: `${crop.y}%` }}
                  />
                  {/* Bottom mask */}
                  <div
                    className="absolute bg-black/60 inset-x-0 bottom-0"
                    style={{ height: `${100 - (crop.y + crop.height)}%` }}
                  />
                  {/* Left mask */}
                  <div
                    className="absolute bg-black/60 left-0"
                    style={{
                      top: `${crop.y}%`,
                      height: `${crop.height}%`,
                      width: `${crop.x}%`,
                    }}
                  />
                  {/* Right mask */}
                  <div
                    className="absolute bg-black/60 right-0"
                    style={{
                      top: `${crop.y}%`,
                      height: `${crop.height}%`,
                      width: `${100 - (crop.x + crop.width)}%`,
                    }}
                  />
                </div>
              )}

              {/* Draggable Crop Selection Frame (Rect or Circle) */}
              {imageLoaded && (
                <div
                  onPointerDown={(e) => handlePointerDown(e, null)}
                  className={`absolute border-2 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.5)] cursor-move ${
                    cropShape === "circle" ? "rounded-full" : "rounded-none"
                  }`}
                  style={{
                    left: `${crop.x}%`,
                    top: `${crop.y}%`,
                    width: `${crop.width}%`,
                    height: `${crop.height}%`,
                  }}
                >
                  {/* Grid Overlay */}
                  {cropShape !== "circle" && (
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                      <div className="border-r border-b border-white/60" />
                      <div className="border-r border-b border-white/60" />
                      <div className="border-b border-white/60" />
                      <div className="border-r border-b border-white/60" />
                      <div className="border-r border-b border-white/60" />
                      <div className="border-b border-white/60" />
                      <div className="border-r border-white/60" />
                      <div className="border-r border-white/60" />
                      <div />
                    </div>
                  )}

                  {/* Move Icon in center */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                    <span className="bg-black/80 text-[#d4af37] px-2 py-1 rounded-full text-[10px] flex items-center gap-1 font-bold shadow-lg">
                      <Move className="w-3 h-3" /> Drag frame
                    </span>
                  </div>

                  {/* Resize Handles */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, "nw")}
                    className="absolute -top-2 -left-2 w-4 h-4 bg-[#d4af37] border-2 border-black rounded-full cursor-nwse-resize shadow"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, "ne")}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-[#d4af37] border-2 border-black rounded-full cursor-nesw-resize shadow"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, "sw")}
                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#d4af37] border-2 border-black rounded-full cursor-nesw-resize shadow"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, "se")}
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#d4af37] border-2 border-black rounded-full cursor-nwse-resize shadow"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Live Website Template Preview Panel (1 Col) */}
          <div className="bg-[#292621] border border-[#3d372e] rounded-xl p-4 flex flex-col items-center justify-center space-y-3 min-h-[320px]">
            <div className="flex items-center gap-1.5 text-xs text-[#d4af37] font-bold uppercase tracking-wider">
              <Eye className="w-4 h-4 text-[#d4af37]" />
              Website Live Preview
            </div>

            <div className="flex-1 flex items-center justify-center w-full py-2">
              {livePreviewUrl ? (
                cropShape === "circle" ? (
                  /* Circular Avatar Website Frame */
                  <div className="relative w-36 h-36 rounded-full p-1.5 bg-gradient-to-tr from-[#d4af37] via-[#f4efe6] to-[#d4af37] shadow-xl">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#1c1b18] bg-black">
                      <img src={livePreviewUrl} alt="Website live preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                ) : (
                  /* Card Website Frame */
                  <div className="relative w-full max-w-[200px] h-[180px] rounded-xl overflow-hidden border-2 border-[#d4af37]/60 shadow-xl bg-black">
                    <img src={livePreviewUrl} alt="Website live preview" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs p-1 text-center">
                      <span className="text-[9px] text-[#d4af37] font-serif font-bold">Template Card Display</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="w-32 h-32 rounded-full border border-dashed border-gray-600 flex items-center justify-center text-xs text-gray-500">
                  Loading preview...
                </div>
              )}
            </div>

            <p className="text-[10px] text-gray-400 text-center italic">
              {cropShape === "circle"
                ? "Shows how your portrait appears inside the circular website frame"
                : "Shows how your cropped image appears in the website layout"}
            </p>
          </div>

        </div>

        {/* Controls: Zoom & Rotate */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#292621] p-3 rounded-xl border border-[#3d372e]">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
              className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-[#d4af37] cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-400 font-mono w-10 text-right">{Math.round(zoom * 100)}%</span>
          </div>

          {/* Rotate Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#1c1b18] hover:bg-[#38332b] text-gray-300 text-xs font-semibold rounded-lg border border-[#3d372e] transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#d4af37]" />
              Rotate 90°
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-3 border-t border-[#3d372e] pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-transparent hover:bg-white/5 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-black bg-[#d4af37] hover:bg-[#c29f2f] rounded-xl shadow-lg hover:shadow-[#d4af37]/20 transition-all transform active:scale-95"
          >
            <Check className="w-4 h-4" />
            Crop &amp; Upload
          </button>
        </div>

      </div>
    </div>
  );
}
