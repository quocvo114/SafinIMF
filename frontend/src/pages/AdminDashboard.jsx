import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Building2, TrafficCone, TreePine, Zap } from "lucide-react";
import IncidentPopupContent from "../components/IncidentPopupContent";
import { incidentMarkerIcons } from "../lib/mapIcons";
import { reportApi } from "../services/api/reportApi";
import "../styles/map.css";

const DANANG_CENTER = [16.0471, 108.2068];
const ADMIN_REPORTS_CACHE_KEY = "admin-map-reports-cache-v1";
const ADMIN_GEOCODE_CACHE_KEY = "admin-map-geocode-cache-v1";

const REPORT_TYPE_TO_INCIDENT_TYPE = Object.freeze({
  giaothong: "traffic",
  dien: "electric",
  cayxanh: "tree",
  ctcc: "building",
});

const parseCoordinate = (value, min, max) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < min || numericValue > max) {
    return null;
  }

  return numericValue;
};

const extractPositionFromReport = (report) => {
  const latFromField = parseCoordinate(report?.lat ?? report?.reportLatitude, -90, 90);
  const lngFromField = parseCoordinate(report?.lng ?? report?.reportLongitude, -180, 180);
  if (latFromField !== null && lngFromField !== null) {
    return [latFromField, lngFromField];
  }

  const locationMatch = String(report?.location || "").match(
    /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
  );
  if (!locationMatch) {
    return null;
  }

  const latFromLocation = parseCoordinate(locationMatch[1], -90, 90);
  const lngFromLocation = parseCoordinate(locationMatch[2], -180, 180);
  if (latFromLocation === null || lngFromLocation === null) {
    return null;
  }

  return [latFromLocation, lngFromLocation];
};

const mapReportTypeToIncidentType = (reportType) => {
  const normalizedType = String(reportType || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  return REPORT_TYPE_TO_INCIDENT_TYPE[normalizedType] || null;
};

const parseReportDate = (timeValue, createdAtValue) => {
  const matchedDate = String(timeValue || "").match(/\d{1,2}\/\d{1,2}\/\d{4}/);
  if (matchedDate) {
    return matchedDate[0];
  }

  if (createdAtValue) {
    const createdAt = new Date(createdAtValue);
    if (!Number.isNaN(createdAt.getTime())) {
      return createdAt.toLocaleDateString("vi-VN");
    }
  }

  return "Không rõ";
};

const getReporterName = (report) => {
  if (report?.reporterName) {
    return report.reporterName;
  }

  if (report?.userId) {
    return `Người dùng #${report.userId}`;
  }

  if (report?.user_id !== undefined && report?.user_id !== null) {
    return `Người dùng #${report.user_id}`;
  }

  return "Người dân phản ánh";
};

const loadCachedReports = () => {
  try {
    const cachedValue = localStorage.getItem(ADMIN_REPORTS_CACHE_KEY);
    if (!cachedValue) {
      return [];
    }

    const parsedValue = JSON.parse(cachedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    console.warn("Không thể đọc cache marker admin map:", error);
    return [];
  }
};

const saveCachedReports = (reports) => {
  try {
    localStorage.setItem(ADMIN_REPORTS_CACHE_KEY, JSON.stringify(reports));
  } catch (error) {
    console.warn("Không thể lưu cache marker admin map:", error);
  }
};

const loadGeocodeCache = () => {
  try {
    const cachedValue = localStorage.getItem(ADMIN_GEOCODE_CACHE_KEY);
    if (!cachedValue) {
      return {};
    }

    const parsedValue = JSON.parse(cachedValue);
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch (error) {
    console.warn("Không thể đọc cache geocode admin map:", error);
    return {};
  }
};

const saveGeocodeCache = (cacheValue) => {
  try {
    localStorage.setItem(ADMIN_GEOCODE_CACHE_KEY, JSON.stringify(cacheValue));
  } catch (error) {
    console.warn("Không thể lưu cache geocode admin map:", error);
  }
};

const geocodeLocation = async (location) => {
  const query = String(location || "").trim();
  if (!query) {
    return null;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query,
      )}&limit=1&addressdetails=1`,
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (!Array.isArray(result) || result.length === 0) {
      return null;
    }

    const lat = parseCoordinate(result[0]?.lat, -90, 90);
    const lng = parseCoordinate(result[0]?.lon, -180, 180);
    if (lat === null || lng === null) {
      return null;
    }

    return [lat, lng];
  } catch {
    return null;
  }
};

const normalizeReportsForMap = async (rawReports) => {
  const geocodeCache = loadGeocodeCache();
  let geocodeBudget = 10;

  const normalizedReports = await Promise.all(
    rawReports.map(async (report, index) => {
      const category = mapReportTypeToIncidentType(
        report?.type || report?.reportType || report?.category,
      );
      if (!category) {
        return null;
      }

      let position = extractPositionFromReport(report);

      if (!position) {
        const locationKey = String(report?.location || "").trim().toLowerCase();

        if (locationKey && Array.isArray(geocodeCache[locationKey])) {
          const [lat, lng] = geocodeCache[locationKey];
          const normalizedLat = parseCoordinate(lat, -90, 90);
          const normalizedLng = parseCoordinate(lng, -180, 180);
          if (normalizedLat !== null && normalizedLng !== null) {
            position = [normalizedLat, normalizedLng];
          }
        }

        if (!position && locationKey && geocodeBudget > 0) {
          geocodeBudget -= 1;
          const geocodedPosition = await geocodeLocation(report?.location);
          if (geocodedPosition) {
            geocodeCache[locationKey] = geocodedPosition;
            position = geocodedPosition;
          }
        }
      }

      if (!position) {
        return null;
      }

      return {
        id: String(report?._id || report?.id || report?.report_id || index),
        category,
        position,
        title: report?.title || "Báo cáo sự cố",
        status: report?.status || "Đang Chờ",
        location: report?.location || "",
        description: report?.description || "",
        image: report?.image || "",
        images: Array.isArray(report?.images) ? report.images : [],
        displayDate: parseReportDate(report?.time, report?.createdAt),
        reporterName: getReporterName(report),
      };
    }),
  );

  saveGeocodeCache(geocodeCache);
  return normalizedReports.filter(Boolean);
};

function MapController({ mapRef }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);

  return null;
}

const CATEGORY_OPTIONS = [
  {
    id: "all",
    label: "Tất Cả",
    icon: "⌘",
    color: "#2563eb",
  },
  {
    id: "traffic",
    label: "Giao Thông",
    icon: <TrafficCone className="h-4 w-4" />,
    color: "#f97316",
  },
  {
    id: "electric",
    label: "Điện",
    icon: <Zap className="h-4 w-4" />,
    color: "#eab308",
  },
  {
    id: "tree",
    label: "Cây Xanh",
    icon: <TreePine className="h-4 w-4" />,
    color: "#22c55e",
  },
  {
    id: "public",
    label: "Công Trình Công Cộng",
    icon: <Building2 className="h-4 w-4" />,
    color: "#a855f7",
  },
];

export default function AdminDashboard() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [reports, setReports] = useState(() => loadCachedReports());
  const mapRef = useRef(null);
  const hasAutoFittedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const fetchReports = async () => {
      try {
        let rawReports = [];

        try {
          const mapResponse = await reportApi.getMapReports();
          rawReports = Array.isArray(mapResponse?.data) ? mapResponse.data : [];
        } catch (mapError) {
          console.warn("Không thể lấy dữ liệu map-view, thử fallback all reports", mapError);
        }

        if (rawReports.length === 0) {
          const fallbackResponse = await reportApi.getAllReports();
          rawReports = Array.isArray(fallbackResponse?.data)
            ? fallbackResponse.data
            : [];
        }

        const normalizedReports = await normalizeReportsForMap(rawReports);

        if (isMounted) {
          setReports(normalizedReports);
          saveCachedReports(normalizedReports);
        }
      } catch (error) {
        console.error("Lỗi tải marker cho admin map:", error);
      }
    };

    fetchReports();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || hasAutoFittedRef.current || reports.length === 0) {
      return;
    }

    mapRef.current.fitBounds(reports.map((report) => report.position), {
      padding: [42, 42],
      maxZoom: 15,
    });
    hasAutoFittedRef.current = true;
  }, [reports]);

  const normalizedSelectedCategory = useMemo(() => {
    if (selectedCategory === "public") {
      return "building";
    }

    return selectedCategory;
  }, [selectedCategory]);

  const visiblePoints = useMemo(() => {
    if (normalizedSelectedCategory === "all") {
      return reports;
    }

    return reports.filter((point) => point.category === normalizedSelectedCategory);
  }, [normalizedSelectedCategory, reports]);

  return (
    <div className="relative h-screen w-full">
      <MapContainer
        center={DANANG_CENTER}
        zoom={14}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <MapController mapRef={mapRef} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {visiblePoints.map((point) => (
          <Marker
            key={point.id}
            position={point.position}
            icon={incidentMarkerIcons[point.category]}
            eventHandlers={{
              click: (event) => event.target.openPopup(),
            }}
          >
            <Popup
              className="incident-popup"
              maxWidth={420}
              minWidth={280}
              autoPan={true}
              keepInView={true}
            >
              <IncidentPopupContent incident={point} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute left-[7.2rem] right-4 top-[5.4rem] z-20">
        <div className="pointer-events-auto flex gap-3 overflow-x-auto scrollbar-hide">
          {CATEGORY_OPTIONS.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold text-white shadow-md transition hover:brightness-95 sm:h-10 sm:px-4"
              style={{
                backgroundColor: category.color,
                opacity: selectedCategory === category.id ? 1 : 0.92,
              }}
            >
              <span className="inline-flex items-center justify-center">
                {category.icon}
              </span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
