import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup as LeafletPopup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, X } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Component to fix Leaflet map rendering issue when container size changes or is initially hidden
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function LocationMapInline({
  lat,
  lng,
  address,
  title,
  children,
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 420 });
  const triggerRef = useRef(null);
  const mapContainerRef = useRef(null);

  const hasCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
  const center = hasCoords ? [lat, lng] : [16.0471, 108.2068];
  const zoom = hasCoords ? 16 : 13;

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    // Only calculate position once when opening
    const calculatePosition = () => {
      const rect = triggerRef.current.getBoundingClientRect();

      // Calculate responsive width
      const maxWidth = window.innerWidth - 32; // 16px padding on each side
      const popoverW = Math.min(420, maxWidth);
      const popoverH = 340;

      let top = rect.bottom + 8; // Default: below the icon
      let left = rect.left;

      // Adjust horizontal position if it overflows right screen edge
      if (left + popoverW > window.innerWidth - 16) {
        left = window.innerWidth - popoverW - 16;
      }
      if (left < 16) left = 16;

      // Adjust vertical position if it overflows bottom screen edge
      if (top + popoverH > window.innerHeight - 16) {
        // Show above the icon instead
        top = rect.top - popoverH - 8;
      }

      setPos({ top, left, width: popoverW });
    };

    calculatePosition();

    // Optional: Recalculate on window resize
    window.addEventListener("resize", calculatePosition);
    return () => window.removeEventListener("resize", calculatePosition);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      const popover = document.getElementById("location-map-popover");
      if (popover && !popover.contains(e.target)) {
        setOpen(false);
      }
    };
    // Delay to avoid immediate close from the click that opened it
    const timer = setTimeout(
      () => document.addEventListener("mousedown", handler),
      10,
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [open]);

  // Even if there are no coordinates, we render children.
  // If we don't render children, they won't show at all.
  // We can attach onClick anyway, but if !hasCoords, we maybe show an alert or just don't open?
  // Actually, if we return children directly when !hasCoords, the onClick wrapper is lost.

  return (
    <>
      <span
        ref={triggerRef}
        onClick={(e) => {
          if (!hasCoords) {
            alert("Không có tọa độ vị trí để hiển thị bản đồ.");
            return;
          }
          setOpen(true);
        }}
        className={hasCoords ? "cursor-pointer" : ""}
      >
        {children}
      </span>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999]"
            onClick={() => setOpen(false)}
          >
            <div
              className="fixed bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden"
              style={{
                top: pos.top,
                left: pos.left,
                width: pos.width,
                zIndex: 100000,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    Vị trí sự cố
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Map */}
              <div
                className="w-full bg-gray-100"
                style={{ height: "260px" }}
                ref={mapContainerRef}
              >
                <MapContainer
                  key={`${lat}-${lng}`}
                  center={center}
                  zoom={zoom}
                  style={{ width: "100%", height: "100%" }}
                  zoomControl={true}
                  scrollWheelZoom={false}
                >
                  <MapResizer />
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[lat, lng]}>
                    <LeafletPopup autoClose={false} closeButton={false}>
                      <div style={{ fontSize: "11px", minWidth: "100px" }}>
                        <p style={{ fontWeight: 600, marginBottom: 2 }}>
                          {title || "Sự cố"}
                        </p>
                        {address && (
                          <p style={{ color: "#6b7280", lineHeight: 1.3 }}>
                            {address}
                          </p>
                        )}
                      </div>
                    </LeafletPopup>
                  </Marker>
                </MapContainer>
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-900 leading-snug">
                      {address}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {lat.toFixed(6)}, {lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
