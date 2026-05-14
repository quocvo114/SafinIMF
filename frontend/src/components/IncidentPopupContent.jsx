import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  FileText,
  MapPin,
} from "lucide-react";
import ImageViewer from "./ImageViewer";

const STATUS_CLASS_NAME = Object.freeze({
  "Đang Chờ": "incident-popup__status incident-popup__status--pending",
  "Đang Xử Lý": "incident-popup__status incident-popup__status--processing",
  "Đã Giải Quyết": "incident-popup__status incident-popup__status--resolved",
});

const getStatusClassName = (status) =>
  STATUS_CLASS_NAME[status] ||
  "incident-popup__status incident-popup__status--pending";

export default function IncidentPopupContent({ incident, onDetail }) {
  const images = useMemo(() => {
    const mergedImages = [];

    if (Array.isArray(incident.images)) {
      mergedImages.push(...incident.images.filter(Boolean));
    }

    if (incident.image) {
      mergedImages.push(incident.image);
    }

    return [...new Set(mergedImages)];
  }, [incident.image, incident.images]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [incident.id]);

  const currentImage = images[activeImageIndex] || "";
  const canNavigateImages = images.length > 1;

  const handlePrevImage = () => {
    setActiveImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1,
    );
  };

  const handleNextImage = () => {
    setActiveImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1,
    );
  };

  return (
    <>
      <div className="incident-popup-card">
        <div className="incident-popup-card__image-wrap">
          {currentImage ? (
            <img
              src={currentImage}
              alt={incident.title}
              className="incident-popup-card__image cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
              onClick={() => setImageViewerOpen(true)}
            />
          ) : (
            <div className="incident-popup-card__image incident-popup-card__image--fallback">
              <FileText size={22} />
              <span>Không có hình ảnh</span>
            </div>
          )}

          {canNavigateImages ? (
            <>
              <button
                type="button"
                className="incident-popup-card__nav incident-popup-card__nav--left"
                onClick={handlePrevImage}
                aria-label="Ảnh trước"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="incident-popup-card__nav incident-popup-card__nav--right"
                onClick={handleNextImage}
                aria-label="Ảnh tiếp theo"
              >
                <ChevronRight size={18} />
              </button>
              <div className="incident-popup-card__image-indicator">
                {activeImageIndex + 1}/{images.length}
              </div>
            </>
          ) : null}
        </div>

        <div className="incident-popup-card__body">
          <div className="incident-popup-card__header">
            <h3 className="incident-popup-card__title">{incident.title}</h3>
            <span className={getStatusClassName(incident.status)}>
              {incident.status || "Đang Chờ"}
            </span>
          </div>

          <p className="incident-popup-card__description">
            {incident.description || "Chưa có mô tả chi tiết cho sự cố này."}
          </p>

          <button
            type="button"
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] py-2 text-xs font-bold text-white transition-colors hover:bg-[#1d4ed8]"
            onClick={(e) => {
              e.stopPropagation();
              onDetail?.(incident);
            }}
          >
            <FileText size={14} />
            <span>Xem chi tiết báo cáo</span>
          </button>
        </div>
      </div>

      <ImageViewer
        images={images}
        initialIndex={activeImageIndex}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
      />
    </>
  );
}