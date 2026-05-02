import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  FileText,
  MapPin,
} from "lucide-react";

const STATUS_CLASS_NAME = Object.freeze({
  "Đang Chờ": "incident-popup__status incident-popup__status--pending",
  "Đang Xử Lý": "incident-popup__status incident-popup__status--processing",
  "Đã Giải Quyết": "incident-popup__status incident-popup__status--resolved",
});

const getStatusClassName = (status) =>
  STATUS_CLASS_NAME[status] || "incident-popup__status incident-popup__status--pending";

export default function IncidentPopupContent({ incident }) {
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
    <div className="incident-popup-card">
      <div className="incident-popup-card__image-wrap">
        {currentImage ? (
          <img
            src={currentImage}
            alt={incident.title}
            className="incident-popup-card__image"
            loading="lazy"
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

        <div className="incident-popup-card__meta">
          <p className="incident-popup-card__meta-row">
            <MapPin size={15} />
            <span>{incident.location || "Chưa có vị trí"}</span>
          </p>
          <p className="incident-popup-card__meta-row">
            <CalendarDays size={15} />
            <span>{incident.displayDate || "Không rõ"}</span>
          </p>
          <p className="incident-popup-card__meta-row">
            <CircleUserRound size={15} />
            <span>{incident.reporterName || "Người dân phản ánh"}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
