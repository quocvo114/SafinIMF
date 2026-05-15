import { useMemo } from "react";
import { Marker } from "react-leaflet";
import { createClusterMarkerIcon } from "../../lib/mapIcons";

export default function ClusterMarker({
  type,
  count,
  position,
  isResolved = false,
  children,
}) {
  const icon = useMemo(
    () => createClusterMarkerIcon({ type, count, isResolved }),
    [type, count, isResolved],
  );

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: (event) => event.target.openPopup(),
      }}
    >
      {children}
    </Marker>
  );
}
