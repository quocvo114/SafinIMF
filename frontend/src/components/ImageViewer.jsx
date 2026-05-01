import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useState } from "react";

export default function ImageViewer({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  });

  if (!isOpen || !images || images.length === 0) return null;

  const validImages = images.filter(Boolean);
  if (validImages.length === 0) return null;

  const currentImage = validImages[currentIndex] || validImages[0];
  const canNavigate = validImages.length > 1;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
    setZoom(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
    setZoom(1);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.5, 0.5));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Image counter */}
      {canNavigate && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
          {currentIndex + 1} / {validImages.length}
        </div>
      )}

      {/* Navigation arrows */}
      {canNavigate && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur-sm">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-white min-w-[48px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom(1);
          }}
          className="ml-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white hover:bg-white/30 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Image */}
      <div
        className="flex items-center justify-center w-full h-full p-16"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage}
          alt={`Ảnh ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        />
      </div>
    </div>
  );
}
