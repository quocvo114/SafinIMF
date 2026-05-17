import { useMemo, useState } from "react";
import { Marker, Popup, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { clusterReports } from "../../utils/clusterReports";
import {
  CLUSTER_RADIUS_M,
  CLUSTER_TIME_WINDOW_H,
  UNCLUSTER_ZOOM_LEVEL,
} from "../../constants/mapConfig";
import {
  incidentMarkerIcons,
  resolveIncidentMarkerIconKey,
} from "../../lib/mapIcons";
import ClusterMarker from "./ClusterMarker";
import ClusterPopup from "./ClusterPopup";
import "../../styles/clusterMarker.css";

const resolvePosition = (report) => {
  if (Array.isArray(report?.position) && report.position.length >= 2) {
    return report.position;
  }

  if (Number.isFinite(report?.lat) && Number.isFinite(report?.lng)) {
    return [report.lat, report.lng];
  }

  return null;
};

const buildSingleCluster = (report, index) => {
  const position = resolvePosition(report);
  if (!position) {
    return null;
  }

  const type = report?.type ?? report?.category;

  return {
    id: `report-${report?.id ?? index}`,
    type,
    reports: [report],
    centerLat: position[0],
    centerLng: position[1],
    count: 1,
  };
};

const mergePopupProps = (defaults, overrides) => ({
  ...defaults,
  ...(overrides || {}),
});

const useZoomLevel = () => {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  return zoom;
};

export default function MapView({
  reports,
  renderPopupContent,
  markerIcons = incidentMarkerIcons,
  unclusterZoomLevel = UNCLUSTER_ZOOM_LEVEL,
  clusterRadiusMeters = CLUSTER_RADIUS_M,
  clusterTimeWindowHours = CLUSTER_TIME_WINDOW_H,
  popupProps,
  clusterPopupProps,
}) {
  const zoomLevel = useZoomLevel();
  const shouldCluster = zoomLevel < unclusterZoomLevel;

  const resolvedPopupProps = useMemo(
    () =>
      mergePopupProps(
        {
          className: "incident-popup",
          maxWidth: 420,
          minWidth: 280,
          autoPan: true,
          keepInView: true,
        },
        popupProps,
      ),
    [popupProps],
  );

  const resolvedClusterPopupProps = useMemo(
    () =>
      mergePopupProps(
        {
          className: "cluster-popup",
          maxWidth: 420,
          minWidth: 260,
          autoPan: true,
          keepInView: true,
        },
        clusterPopupProps,
      ),
    [clusterPopupProps],
  );

  const clusters = useMemo(() => {
    if (!Array.isArray(reports) || reports.length === 0) {
      return [];
    }

    if (!shouldCluster) {
      return reports
        .map(buildSingleCluster)
        .filter(Boolean)
        .map((cluster) => ({
          ...cluster,
          position: [cluster.centerLat, cluster.centerLng],
        }));
    }

    return clusterReports(
      reports,
      clusterRadiusMeters,
      clusterTimeWindowHours,
    ).map((cluster) => ({
      ...cluster,
      position: [cluster.centerLat, cluster.centerLng],
    }));
  }, [reports, shouldCluster, clusterRadiusMeters, clusterTimeWindowHours]);

  if (!clusters.length) {
    return null;
  }

  return (
    <>
      {clusters.map((cluster) => {
        const [report] = cluster.reports;
        const resolvedMarkerKey = markerIcons[cluster.type]
          ? cluster.type
          : resolveIncidentMarkerIconKey({ typeName: cluster.type });
        const markerIcon = resolvedMarkerKey
          ? markerIcons[resolvedMarkerKey]
          : null;
        const isClusterResolved = cluster.reports.every(
          (item) =>
            item?.status === "Đã Giải Quyết" || item?.status === "Đã Hoàn Tất",
        );

        if (cluster.count > 1) {
          return (
            <ClusterMarker
              key={cluster.id}
              type={cluster.type}
              count={cluster.count}
              position={cluster.position}
              isResolved={isClusterResolved}
            >
              <Tooltip sticky={true} offset={[0, -12]}>
                {cluster.count} báo cáo cùng loại trong khu vực này
              </Tooltip>
              <Popup {...resolvedClusterPopupProps}>
                <ClusterPopup type={cluster.type} reports={cluster.reports} />
              </Popup>
            </ClusterMarker>
          );
        }

        if (!report || !markerIcon || !cluster.position) {
          return null;
        }

        return (
          <Marker
            key={cluster.id}
            position={cluster.position}
            icon={markerIcon}
            eventHandlers={{
              click: (event) => event.target.openPopup(),
            }}
          >
            {renderPopupContent ? (
              <Popup {...resolvedPopupProps}>
                {renderPopupContent(report)}
              </Popup>
            ) : null}
          </Marker>
        );
      })}
    </>
  );
}
