import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import MaintenanceHomeOverlayUI from "../components/MaintenanceHomeOverlayUI";
import IncidentPopupContent from "../components/IncidentPopupContent";
import { useAuth } from "../context/AuthContext";
import { incidentMarkerIcons, searchLocationMarkerIcon } from "../lib/mapIcons";
import { reportApi } from "../services/api/reportApi";
import "../styles/map.css";

const DANANG_CENTER = [16.0471, 108.2068];
const MAINTENANCE_REPORTS_CACHE_KEY = "maintenance-map-reports-cache-v1";
const MAINTENANCE_GEOCODE_CACHE_KEY = "maintenance-map-geocode-cache-v1";

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
  const latFromField = parseCoordinate(report?.lat, -90, 90);
  const lngFromField = parseCoordinate(report?.lng, -180, 180);
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
    const cachedValue = localStorage.getItem(MAINTENANCE_REPORTS_CACHE_KEY);
    if (!cachedValue) {
      return [];
    }

    const parsedValue = JSON.parse(cachedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    console.warn("Không thể đọc cache marker maintenance map:", error);
    return [];
  }
};

const saveCachedReports = (reports) => {
  try {
    localStorage.setItem(MAINTENANCE_REPORTS_CACHE_KEY, JSON.stringify(reports));
  } catch (error) {
    console.warn("Không thể lưu cache marker maintenance map:", error);
  }
};

const loadGeocodeCache = () => {
  try {
    const cachedValue = localStorage.getItem(MAINTENANCE_GEOCODE_CACHE_KEY);
    if (!cachedValue) {
      return {};
    }

    const parsedValue = JSON.parse(cachedValue);
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch (error) {
    console.warn("Không thể đọc cache geocode maintenance map:", error);
    return {};
  }
};

const saveGeocodeCache = (cacheValue) => {
  try {
    localStorage.setItem(MAINTENANCE_GEOCODE_CACHE_KEY, JSON.stringify(cacheValue));
  } catch (error) {
    console.warn("Không thể lưu cache geocode maintenance map:", error);
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
        type,
        position,
        title: report?.title || "Báo cáo sự cố",
        location: report?.location || "",
        description: report?.description || "",
        status: report?.status || "Đang Chờ",
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

// Component để lưu map reference
function MapController({ mapRef }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);

  return null;
}

const MaintenanceDashboard = () => {
  const defaultCenter = DANANG_CENTER;
  const [selectedCategory, setSelectedCategory] = useState("all");

  const mapRef = useRef(null);
  const hasAutoFittedRef = useRef(false);
  const [searchMarker, setSearchMarker] = useState(null);
  const [reports, setReports] = useState(() => loadCachedReports());

  const { user } = useAuth();

  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");

  const userName = currentUser.full_name || currentUser.name || "Người dùng";

  const userAvatar = currentUser.avatar || null;

  useEffect(() => {
    let isMounted = true;

    const fetchReports = async () => {
      try {
        let rawReports = [];

        try {
          const mapResponse = await reportApi.getMapReports();
          rawReports = Array.isArray(mapResponse?.data) ? mapResponse.data : [];
        } catch (mapError) {
          console.warn(
            "Không thể lấy dữ liệu map-view, thử fallback all reports",
            mapError,
          );
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
        console.error("Lỗi tải danh sách marker cho maintenance map:", error);
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

  const filteredIncidents = useMemo(() => {
    if (normalizedSelectedCategory === "all") {
      return reports;
    }

    return reports.filter((incident) => incident.type === normalizedSelectedCategory);
  }, [normalizedSelectedCategory, reports]);

  const handleSearchLocation = async (query) => {
    console.log("Search query: ", query);

    if (!query || !mapRef.current) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}&limit=1&addressdetails=1`,
      );

      const data = await res.json();

      if (!data || data.length === 0) {
        alert("Không tìm thấy địa điểm phù hợp");
        return;
      }

      const place = data[0];

      const lat = parseFloat(place.lat);
      const lon = parseFloat(place.lon);

      if (mapRef.current) {
        mapRef.current.setView([lat, lon], 17);
      }

      setSearchMarker({
        lat,
        lon,
        displayName: place.display_name,
      });
    } catch (error) {
      console.error("Lỗi tìm kiếm địa điểm:", error);
      alert("Có lỗi khi tìm kiếm địa điểm");
    }
  };

  return (
    <div className="w-full h-screen">
      <MaintenanceHomeOverlayUI
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
            ref={mapRef}
          >
            <MapController mapRef={mapRef} />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredIncidents.map((incident) => (
              <Marker
                key={incident.id}
                position={incident.position}
                icon={incidentMarkerIcons[incident.type]}
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
                  <IncidentPopupContent incident={incident} />
                </Popup>
              </Marker>
            ))}

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

export default MaintenanceDashboard;
