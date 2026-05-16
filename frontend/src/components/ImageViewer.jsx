import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ImageViewer({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const validImages = (images || []).filter(Boolean);

  useEffect(() => {
    const nextIndex = Math.min(
      Math.max(initialIndex, 0),
      Math.max(validImages.length - 1, 0),
    );
    setCurrentIndex(nextIndex);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, [initialIndex, isOpen, validImages.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]); 

  if (!isOpen || typeof document === "undefined" || validImages.length === 0) return null;

  if (validImages.length === 0) return null;

  const currentImage = validImages[currentIndex] || validImages[0];
  const canNavigate = validImages.length > 1;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 4));
  const handleZoomOut = () => {
    setZoom((z) => {
      const newZoom = Math.max(z - 0.5, 1);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const handlePointerDown = (e) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    if (e.currentTarget?.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging || zoom <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm pointer-events-auto"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose?.();
        }}
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors pointer-events-auto"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Image counter */}
      {canNavigate && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm z-10 pointer-events-none">
          {currentIndex + 1} / {validImages.length}
        </div>
      )}

      {/* Navigation arrows */}
      {canNavigate && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePrev();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            type="button"
            className="absolute left-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors pointer-events-auto"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleNext();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            type="button"
            className="absolute right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors pointer-events-auto"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Zoom controls */}
      <div 
        className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur-sm z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleZoomOut}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-white min-w-[48px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPosition({ x: 0, y: 0 });
          }}
          className="ml-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white hover:bg-white/30 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Image */}
      <div
        className="flex items-center justify-center w-full h-full p-6 md:p-12 select-none"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="max-w-[90vw] max-h-[85vh] w-full flex items-center justify-center">
          <div
            className="flex items-center justify-center"
            style={{
              transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
              transition: isDragging ? "none" : "transform 0.2s ease-out",
              cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
              willChange: "transform",
            }}
          >
            <img
              src={currentImage}
              alt={`Ảnh ${currentIndex + 1}`}
              draggable="false"
              className="w-full h-full object-contain"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.2s ease-out",
                willChange: "transform",
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
