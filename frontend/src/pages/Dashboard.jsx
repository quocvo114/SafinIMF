import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  FileText,
  MapPin,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import HomeOverlayUI from "../components/HomeOverlayUI";
import MapView from "../components/Map/MapView";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { reportApi } from "../services/api/reportApi";
import "../styles/map.css";
import {
  currentLocationMarkerIcon,
  incidentMarkerIcons,
  createCustomMarkerIcon,
  searchLocationMarkerIcon,
} from "../lib/mapIcons";
import { renderToString } from "react-dom/server";
import { INCIDENT_ICON_MAP } from "../components/IncidentTypePopup";
import incidentApi from "../services/api/incidentApi";



const STATUS_CLASS_NAME = Object.freeze({
  "Đang Chờ": "incident-popup__status incident-popup__status--pending",
  "Đang Xử Lý": "incident-popup__status incident-popup__status--processing",
  "Đã Giải Quyết": "incident-popup__status incident-popup__status--resolved",
});

const DANANG_CENTER = [16.0471, 108.2068];
const DASHBOARD_REPORTS_CACHE_KEY = "dashboard-map-reports-cache-v1";
const DASHBOARD_GEOCODE_CACHE_KEY = "dashboard-map-geocode-cache-v1";

const parseCoordinate = (value, min, max) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  if (numericValue < min || numericValue > max) {
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

const getStatusClassName = (status) =>
  STATUS_CLASS_NAME[status] ||
  "incident-popup__status incident-popup__status--pending";

function IncidentPopupContent({ incident }) {
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
            <span>{incident.displayDate}</span>
          </p>
          <p className="incident-popup-card__meta-row">
            <CircleUserRound size={15} />
            <span>{incident.reporterName}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const loadGeocodeCache = () => {
  try {
    const cachedValue = localStorage.getItem(DASHBOARD_GEOCODE_CACHE_KEY);
    if (!cachedValue) {
      return {};
    }

    const parsedValue = JSON.parse(cachedValue);
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch (error) {
    // ✅ Cleanup: Cache reading error handling silenced
    return {};
  }
};

const saveGeocodeCache = (cacheValue) => {
  try {
    localStorage.setItem(
      DASHBOARD_GEOCODE_CACHE_KEY,
      JSON.stringify(cacheValue),
    );
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
  } catch (error) {
    return null;
  }
};

const normalizeReportsForMap = async (rawReports) => {
  const geocodeCache = loadGeocodeCache();
  let geocodeBudget = 10;

  const normalizedReports = await Promise.all(
    rawReports.map(async (report, index) => {
      const incidentType = String(report?.type || report?.reportType || report?.category || "Khác").trim();

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
        type: incidentType,
        position,
        title: report?.title || "Báo cáo sự cố",
        location: report?.location || "",
        description: report?.description || "",
        status: report?.status || "Đang Chờ",
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

const loadCachedReports = () => {
  try {
    const cachedValue = localStorage.getItem(DASHBOARD_REPORTS_CACHE_KEY);
    if (!cachedValue) {
      return [];
    }

    const parsedValue = JSON.parse(cachedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    // ✅ Cleanup: Cache reading error handling silenced
    return [];
  }
};

const saveCachedReports = (reports) => {
  try {
    localStorage.setItem(DASHBOARD_REPORTS_CACHE_KEY, JSON.stringify(reports));
  } catch (error) {
    // ✅ Cleanup: Cache writing error handling silenced
  }
};

function MapController({ mapRef }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);

  return null;
}

function LocationMarker() {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      // ✅ Cleanup: GPS compatibility error handling silenced
      return;
    }

    const options = {
      enableHighAccuracy: false,
      maximumAge: 60000,
      timeout: 10000,
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setPosition(newPos);
      },
      (error) => {
        // ✅ Cleanup: GPS error handling silenced
      },
      options,
    );
  }, []);

  return position === null ? null : (
    <Marker
      position={[position.lat, position.lng]}
      icon={currentLocationMarkerIcon}
    >
      <Popup>📍 Bạn đang ở đây!</Popup>
    </Marker>
  );
}

const Dashboard = () => {
  const defaultCenter = DANANG_CENTER;
  const [selectedCategory, setSelectedCategory] = useState("all");
  const mapRef = useRef(null);
  const [searchMarker, setSearchMarker] = useState(null);
  const [reports, setReports] = useState(() => loadCachedReports());
  const hasCachedReportsRef = useRef(false);
  const { user } = useAuth();

  const userName = user?.full_name || user?.name || null;
  const userAvatar = user?.avatar || null;
  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");


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
    
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    hasCachedReportsRef.current = reports.length > 0;
  }, [reports]);

  useEffect(() => {
    let isMounted = true;

    const fetchReports = async () => {
      try {
        const response = await reportApi.getMapReports();
        const rawReports = Array.isArray(response?.data) ? response.data : [];
        const normalizedReports = await normalizeReportsForMap(rawReports);

        if (isMounted) {
          setReports(normalizedReports);
          saveCachedReports(normalizedReports);
        }
      } catch (error) {
        // ✅ Cleanup: Report fetching error handling silenced
        if (isMounted && !hasCachedReportsRef.current) {
          toast.error("Không thể tải dữ liệu sự cố từ hệ thống");
        }
      }
    };

    fetchReports();

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedSelectedCategory = useMemo(() => {
    if (selectedCategory === "public") {
      return "building";
    }

    return selectedCategory;
  }, [selectedCategory]);

  const filteredIncidents = useMemo(() => {
    if (normalizedSelectedCategory === "all") {
      return reports;
    }

    return reports.filter(
      (incident) => incident.type === normalizedSelectedCategory,
    );
  }, [normalizedSelectedCategory, reports]);

  const handleSearchLocation = useCallback(async (query) => {
    if (!query || !mapRef.current) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}&limit=1&addressdetails=1`,
      );

      const data = await res.json();

      if (!data || data.length === 0) {
        toast.warning("Không tìm thấy địa điểm phù hợp");
        return;
      }

      const place = data[0];
      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);

      mapRef.current.setView([lat, lon], 17);

      setSearchMarker({
        lat,
        lon,
        displayName: place.display_name,
      });
    } catch (error) {
      // ✅ Cleanup: Location search error handling silenced
      toast.error("Có lỗi khi tìm kiếm địa điểm");
    }
  }, []);

  return (
    <div className="w-full h-screen">
      <HomeOverlayUI
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onSearch={handleSearchLocation}
        userName={userName}
        userAvatar={userAvatar}
        mapElement={
          <MapContainer
            center={defaultCenter}
            zoom={13}
            className="w-full h-full"
            zoomControl={true}
          >
            <MapController mapRef={mapRef} />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <LocationMarker />

            {filteredIncidents.map((incident) => {
              const typeObj = incidentTypes.find((t) => t.name === incident.type);
              let mapIcon = incidentMarkerIcons[incident.type];
              
              if (!mapIcon) {
                let svgString = `<svg class="map-marker__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6" fill="currentColor" /></svg>`;
                if (typeObj) {
                  const IconComp = INCIDENT_ICON_MAP[typeObj.iconKey];
                  if (IconComp) {
                    svgString = renderToString(<IconComp className="map-marker__icon" color="currentColor" />);
                  }
                }
                
                mapIcon = createCustomMarkerIcon({
                  backgroundColor: typeObj?.color || "#f97316", // default orange
                  svgIcon: svgString,
                });
              }

              return (
                <Marker
                  key={incident.id}
                  position={incident.position}
                  icon={mapIcon}
                >
                  <Popup className="incident-popup" maxWidth={420} minWidth={280}>
                    <IncidentPopupContent incident={incident} />
                  </Popup>
                </Marker>
              );
            })}

            {searchMarker && (
              <Marker
                position={[searchMarker.lat, searchMarker.lon]}
                icon={searchLocationMarkerIcon}
              >
                <Popup>{searchMarker.displayName}</Popup>
              </Marker>
            )}
          </MapContainer>
        }
      />
    </div>
  );
};

export default Dashboard;
