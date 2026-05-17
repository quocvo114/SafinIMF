import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Building2, TrafficCone, TreePine, Zap, Layers } from "lucide-react";
import IncidentPopupContent from "../components/IncidentPopupContent";
import MapView from "../components/Map/MapView";
import { incidentMarkerIcons, createCustomMarkerIcon } from "../lib/mapIcons";
import { reportApi } from "../services/api/reportApi";
import incidentApi from "../services/api/incidentApi";
import { INCIDENT_ICON_MAP } from "../components/IncidentTypePopup";
import { renderToString } from "react-dom/server";
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
  if (
    !Number.isFinite(numericValue) ||
    numericValue < min ||
    numericValue > max
  ) {
    return null;
  }

  return numericValue;
};

const extractPositionFromReport = (report) => {
  const latFromField = parseCoordinate(
    report?.lat ?? report?.reportLatitude,
    -90,
    90,
  );
  const lngFromField = parseCoordinate(
    report?.lng ?? report?.reportLongitude,
    -180,
    180,
  );
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
    return [];
  }
};

const saveCachedReports = (reports) => {
  try {
    localStorage.setItem(ADMIN_REPORTS_CACHE_KEY, JSON.stringify(reports));
  } catch (error) {
    // ✅ Cleanup: Cache writing error handling silenced
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
    return {};
  }
};

const saveGeocodeCache = (cacheValue) => {
  try {
    localStorage.setItem(ADMIN_GEOCODE_CACHE_KEY, JSON.stringify(cacheValue));
  } catch (error) {
    // ✅ Cleanup: Cache writing error handling silenced
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
      const type = mapReportTypeToIncidentType(
        report?.type || report?.reportType || report?.category,
      );
      if (!type) {
        return null;
      }

      let position = extractPositionFromReport(report);

      if (!position) {
        const locationKey = String(report?.location || "")
          .trim()
          .toLowerCase();

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
        type,
        position,
        title: report?.title || "Báo cáo sự cố",
        status: report?.status || "Đang Chờ",
        location: report?.location || "",
        description: report?.description || "",
        image: report?.image || "",
        images: Array.isArray(report?.images) ? report.images : [],
        displayDate: parseReportDate(report?.time, report?.createdAt),
        reporterName: getReporterName(report),
        createdAt:
          report?.createdAt || report?.created_at || report?.time || null,
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

// ✅ CATEGORY_OPTIONS với màu sắc đồng bộ UI mềm mại
const CATEGORY_OPTIONS = [
  {
    id: "all",
    label: "Tất Cả",
    icon: <Layers className="h-4 w-4" />,
    color: "#2563EB",
    borderColor: "#1d4ed8",
  },
  {
    id: "traffic",
    label: "Giao Thông",
    icon: <TrafficCone className="h-4 w-4" />,
    color: "#F97316",
    borderColor: "#c2410c",
  },
  {
    id: "electric",
    label: "Điện",
    icon: <Zap className="h-4 w-4" />,
    color: "#FDCA00",
    borderColor: "#AD8D0C",
  },
  {
    id: "tree",
    label: "Cây Xanh",
    icon: <TreePine className="h-4 w-4" />,
    color: "#74C365",
    borderColor: "#15803d",
  },
  {
    id: "public",
    label: "Công Trình Công Cộng",
    icon: <Building2 className="h-4 w-4" />,
    color: "#B78FF2",
    borderColor: "#7e22ce",
  },
];

export default function AdminDashboard() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [reports, setReports] = useState(() => loadCachedReports());
  const mapRef = useRef(null);
  const hasAutoFittedRef = useRef(false);
  const [incidentTypes, setIncidentTypes] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchIncidentTypes = async () => {
      try {
        const response = await incidentApi.getIncidentTypes();
        if (isMounted && response?.success && Array.isArray(response.data)) {
          setIncidentTypes(response.data);
        }
      } catch (error) {
        console.error("Failed to load incident types", error);
      }
    };
    fetchIncidentTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchReports = async () => {
      try {
        let rawReports = [];

        try {
          const mapResponse = await reportApi.getMapReports();
          rawReports = Array.isArray(mapResponse?.data) ? mapResponse.data : [];
        } catch (mapError) {
          // ✅ Cleanup: Map data fallback warning removed
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
        // ✅ Cleanup: Report loading error handling silenced
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

    mapRef.current.fitBounds(
      reports.map((report) => report.position),
      {
        padding: [42, 42],
        maxZoom: 15,
      },
    );
    hasAutoFittedRef.current = true;
  }, [reports]);

  const normalizedSelectedCategory = useMemo(() => {
    if (selectedCategory === "all") {
      return "all";
    }

    if (selectedCategory === "public") {
      return "building";
    }

    const mappedType = mapReportTypeToIncidentType(selectedCategory);
    return mappedType || selectedCategory;
  }, [selectedCategory]);

  const visiblePoints = useMemo(() => {
    if (normalizedSelectedCategory === "all") {
      return reports;
    }
    return reports.filter((point) => point.type === normalizedSelectedCategory);
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

        <MapView
          reports={visiblePoints}
          renderPopupContent={(incident) => (
            <IncidentPopupContent incident={incident} />
          )}
        />
      </MapContainer>

      {/* ✅ Floating Categories - Soft UI Version */}
      <div
        className="pointer-events-none absolute right-6 top-24 z-20"
        style={{ left: "calc(var(--admin-sidebar-offset, 6rem) + 1rem)" }}
      >
        <div className="pointer-events-auto flex flex-wrap gap-3 scrollbar-hide sm:flex-nowrap">
          {[
            {
              id: "all",
              label: "Tất Cả",
              icon: <Layers className="h-4 w-4" />,
              color: "#2563eb",
            },
            ...incidentTypes.map((t) => {
              const IconComp = INCIDENT_ICON_MAP[t.iconKey] || Building2;
              return {
                id: t.name,
                label: t.name,
                icon: <IconComp className="h-4 w-4" />,
                color: t.color || "#f97316",
              };
            }),
          ].map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`
                relative flex items-center gap-2 px-4 h-10 rounded-full text-xs font-medium
                transition-all duration-300 ease-out whitespace-nowrap flex-shrink-0
                ${selectedCategory === category.id ? "z-10" : "hover:opacity-100"}
              `}
              style={{
                backgroundColor:
                  selectedCategory === category.id
                    ? category.color
                    : `${category.color}55`,
                color: "#ffffff",
                border:
                  selectedCategory === category.id
                    ? `2px solid ${category.borderColor || category.color}`
                    : "2px solid transparent",
                boxShadow:
                  selectedCategory === category.id
                    ? `0 4px 90px ${category.color}35, 0 0 0 9px ${category.color}12, inset 0 0px 9px rgba(255,255,255,0.5)`
                    : "none",
                transform:
                  selectedCategory === category.id
                    ? "scale(1.03) translateY(-1px)"
                    : "scale(1)",
              }}
            >
              <span className="inline-flex items-center justify-center">
                {React.isValidElement(category.icon) ? (
                  React.cloneElement(category.icon, {
                    size: 16,
                    color: "#ffffff",
                  })
                ) : (
                  <span className="text-sm leading-none text-white">
                    {String(category.icon ?? "")}
                  </span>
                )}
              </span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}