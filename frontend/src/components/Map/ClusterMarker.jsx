import { useMemo } from "react";
import { Marker } from "react-leaflet";
import { createClusterMarkerIcon } from "../../lib/mapIcons";

export default function ClusterMarker({ type, count, position, children }) {
  const icon = useMemo(
    () => createClusterMarkerIcon({ type, count }),
    [type, count],
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
