import L from "leaflet";

const COLOR_CLASS_BY_HEX = Object.freeze({
  "#f97316": "map-marker--traffic",
  "#eab308": "map-marker--electric",
  "#22c55e": "map-marker--tree",
  "#a855f7": "map-marker--building",
  "#2563eb": "map-marker--current-location",
  "#0ea5e9": "map-marker--search",
});

const normalizeHexColor = (value) => (value ? value.trim().toLowerCase() : "");

const getColorClass = (backgroundColor) => {
  const normalizedColor = normalizeHexColor(backgroundColor);
  return COLOR_CLASS_BY_HEX[normalizedColor] || "map-marker--default";
};

const buildSvg = (paths) =>
  `<svg class="map-marker__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

const TRAFFIC_SVG = buildSvg(
  '<path d="M16.05 10.966a5 2.5 0 0 1-8.1 0" /><path d="m16.923 14.049 4.48 2.04a1 1 0 0 1 .001 1.831l-8.574 3.9a2 2 0 0 1-1.66 0l-8.574-3.91a1 1 0 0 1 0-1.83l4.484-2.04" /><path d="M16.949 14.14a5 2.5 0 1 1-9.9 0L10.063 3.5a2 2 0 0 1 3.874 0z" /><path d="M9.194 6.57a5 2.5 0 0 0 5.61 0" />',
);

const ELECTRIC_SVG = buildSvg(
  '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />',
);

const TREE_SVG = buildSvg(
  '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z" /><path d="M12 22v-3" />',
);

const BUILDING_SVG = buildSvg(
  '<path d="M10 12h4" /><path d="M10 8h4" /><path d="M14 21v-3a2 2 0 0 0-4 0v3" /><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" /><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />',
);

const LOCATION_SVG = buildSvg('<circle cx="12" cy="12" r="5" /><path d="M12 2v3" /><path d="M12 19v3" /><path d="M2 12h3" /><path d="M19 12h3" />');

const SEARCH_SVG = buildSvg('<circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />');

export const createCustomMarkerIcon = ({
  backgroundColor,
  svgIcon,
  pulse = false,
}) => {
  const colorClass = getColorClass(backgroundColor);
  const pulseClass = pulse ? " map-marker--pulse" : "";

  return L.divIcon({
    className: "map-marker-wrapper",
    html: `<div class="map-marker ${colorClass}${pulseClass}">${svgIcon}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

export const trafficMarkerIcon = createCustomMarkerIcon({
  backgroundColor: "#f97316",
  svgIcon: TRAFFIC_SVG,
});

export const electricMarkerIcon = createCustomMarkerIcon({
  backgroundColor: "#eab308",
  svgIcon: ELECTRIC_SVG,
});

export const treeMarkerIcon = createCustomMarkerIcon({
  backgroundColor: "#22c55e",
  svgIcon: TREE_SVG,
});

export const buildingMarkerIcon = createCustomMarkerIcon({
  backgroundColor: "#a855f7",
  svgIcon: BUILDING_SVG,
});

export const currentLocationMarkerIcon = createCustomMarkerIcon({
  backgroundColor: "#2563eb",
  svgIcon: LOCATION_SVG,
  pulse: true,
});

export const searchLocationMarkerIcon = createCustomMarkerIcon({
  backgroundColor: "#0ea5e9",
  svgIcon: SEARCH_SVG,
});

export const incidentMarkerIcons = Object.freeze({
  traffic: trafficMarkerIcon,
  electric: electricMarkerIcon,
  tree: treeMarkerIcon,
  building: buildingMarkerIcon,
});
