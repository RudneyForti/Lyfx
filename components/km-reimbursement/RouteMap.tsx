"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { IconMapPin, IconX, IconRefresh } from "@tabler/icons-react";
import { GOOGLE_MAPS_LIBRARIES } from "./AddressAutocomplete";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface RouteMapProps {
  origin: string;
  destination: string;
  onKmChange?: (km: number) => void;
  onClose?: () => void;
  /** Persisted DirectionsResult from previous save — used to extract via_waypoints for route reconstruction */
  initialDirections?: google.maps.DirectionsResult | null;
  /** Called whenever directions are loaded or changed (initial + drag) */
  onDirectionsChange?: (d: google.maps.DirectionsResult) => void;
}

// ── Dark map style ────────────────────────────────────────────────────────────

const DARK_MAP_STYLES = [
  { elementType: "geometry",             stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke",   stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill",     stylers: [{ color: "#6b7a99" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d0d1f" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3a4a6b" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#16213e" }] },
  { featureType: "road.local",    elementType: "geometry.fill",   stylers: [{ color: "#252547" }] },
  { featureType: "road.local",    elementType: "labels.text.fill", stylers: [{ color: "#4a5578" }] },
  { featureType: "road.arterial", elementType: "geometry.fill",   stylers: [{ color: "#2e2e5a" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#7a8ab0" }] },
  { featureType: "road.highway",  elementType: "geometry.fill",   stylers: [{ color: "#3a3a70" }] },
  { featureType: "road.highway",  elementType: "geometry.stroke",  stylers: [{ color: "#1a1a2e" }] },
  { featureType: "road.highway",  elementType: "labels.text.fill", stylers: [{ color: "#9aa5cc" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry.fill", stylers: [{ color: "#464685" }] },
  { featureType: "transit",       elementType: "labels.text.fill", stylers: [{ color: "#4a5578" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#8895bb" }] },
];

// Styles for terrain/satellite modes — no custom coloring, let Google render naturally
const NATURAL_MAP_STYLES: google.maps.MapTypeStyle[] = [];

// ── Map type config ───────────────────────────────────────────────────────────

type MapTypeKey = "roadmap" | "satellite" | "terrain";

const MAP_TYPE_LABELS: Record<MapTypeKey, string> = {
  roadmap:   "Mapa",
  satellite: "Satélite",
  terrain:   "Terreno",
};

// ── Shared overlay button style ───────────────────────────────────────────────

const overlayBtnBase: React.CSSProperties = {
  background: "rgba(0,0,0,0.72)",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.85)",
};

const overlayBtnHover: React.CSSProperties = {
  background: "rgba(34,211,238,0.15)",
  border: "1px solid rgba(34,211,238,0.4)",
  color: "var(--color-cyan)",
};

const overlayBtnActive: React.CSSProperties = {
  background: "rgba(34,211,238,0.2)",
  border: "1px solid rgba(34,211,238,0.6)",
  color: "var(--color-cyan)",
};

const btnCls =
  "w-7 h-7 rounded-[8px] flex items-center justify-center cursor-pointer border-0 transition-colors select-none";

// ── Zoom button ───────────────────────────────────────────────────────────────

function ZoomBtn({ label, onClick }: { label: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={btnCls}
      style={hov ? { ...overlayBtnBase, ...overlayBtnHover } : overlayBtnBase}
    >
      <span className="text-[16px] font-light leading-none">{label}</span>
    </button>
  );
}

function ResetRouteBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      title="Resetar para o caminho mais curto"
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={btnCls}
      style={hov ? { ...overlayBtnBase, ...overlayBtnHover } : overlayBtnBase}
    >
      <IconRefresh size={13} />
    </button>
  );
}

// ── Map type toggle ───────────────────────────────────────────────────────────

function MapTypeToggle({
  value,
  onChange,
}: {
  value: MapTypeKey;
  onChange: (t: MapTypeKey) => void;
}) {
  const [hov, setHov] = useState<MapTypeKey | null>(null);
  return (
    <div
      className="flex items-center rounded-[8px] overflow-hidden"
      style={{
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {(Object.keys(MAP_TYPE_LABELS) as MapTypeKey[]).map((type, i) => {
        const active = value === type;
        const hovering = hov === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            onMouseEnter={() => setHov(type)}
            onMouseLeave={() => setHov(null)}
            className="h-7 px-2.5 text-[9px] font-semibold cursor-pointer border-0 transition-colors select-none tracking-wide"
            style={{
              ...(active
                ? overlayBtnActive
                : hovering
                ? { ...overlayBtnBase, ...overlayBtnHover }
                : { background: "transparent", color: "rgba(255,255,255,0.5)" }),
              borderRadius: 0,
              borderRight: i < 2 ? "1px solid rgba(255,255,255,0.1)" : "none",
            }}
          >
            {MAP_TYPE_LABELS[type]}
          </button>
        );
      })}
    </div>
  );
}

// ── Lazy loader for Google Maps ───────────────────────────────────────────────

function MapWithDirections({
  origin,
  destination,
  onKmChange,
  onClose,
  initialDirections,
  onDirectionsChange,
}: RouteMapProps) {
  const { GoogleMap, useLoadScript, DirectionsService, DirectionsRenderer, OverlayView } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@react-google-maps/api");

  const { isLoaded } = useLoadScript({ googleMapsApiKey: API_KEY!, libraries: GOOGLE_MAPS_LIBRARIES });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [routeKm, setRouteKm] = useState<number | null>(() => {
    const leg = initialDirections?.routes[0]?.legs[0];
    return leg?.distance?.value
      ? Math.round((leg.distance.value / 1000) * 10) / 10
      : null;
  });
  const [mapType, setMapType] = useState<MapTypeKey>("roadmap");
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  // When true, DirectionsService runs without via_waypoints → shortest path
  const [useDefaultRoute, setUseDefaultRoute] = useState(false);

  const requested = useRef(false);
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const skipNextChange = useRef(false);

  // Extract via_waypoints from saved route so DirectionsService reconstructs the custom path
  const savedWaypoints = useMemo(() => {
    if (!initialDirections) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viaPoints: Array<{ lat: number | (() => number); lng: number | (() => number) }> =
      (initialDirections as unknown as {
        routes: { legs: { via_waypoints: Array<{ lat: number | (() => number); lng: number | (() => number) }> }[] }[];
      }).routes?.[0]?.legs?.[0]?.via_waypoints ?? [];
    if (!viaPoints.length) return undefined;
    return viaPoints.map(wp => {
      const lat = typeof wp.lat === "function" ? (wp.lat as () => number)() : (wp.lat as number);
      const lng = typeof wp.lng === "function" ? (wp.lng as () => number)() : (wp.lng as number);
      return { location: { lat, lng }, stopover: false };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDirections]);

  // Compute km balloon position — midpoint of the overview polyline.
  // overview_polyline is typed as string in @types/google.maps (encoded polyline directly).
  const routeMidpoint = useMemo(() => {
    if (!directions) return null;
    const raw = directions.routes?.[0]?.overview_polyline as unknown;
    // Handle both string (JS API) and {points: string} (serialized JSON) shapes
    const encoded =
      typeof raw === "string"
        ? raw
        : (raw as { points?: string })?.points ?? null;
    if (!encoded) return null;
    try {
      const path = google.maps.geometry.encoding.decodePath(encoded);
      if (!path.length) return null;
      const mid = path[Math.floor(path.length / 2)];
      return { lat: mid.lat(), lng: mid.lng() };
    } catch {
      return null;
    }
  }, [directions]);

  // Reset route when addresses change — skip initial mount
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    requested.current = false;
    skipNextChange.current = false;
    setDirections(null);
    setRouteKm(null);
  }, [origin, destination]);

  const updateRouteInfo = useCallback((result: google.maps.DirectionsResult) => {
    if (onDirectionsChange) onDirectionsChange(result);
    const leg = result.routes[0]?.legs[0];
    if (leg?.distance?.value) {
      const km = Math.round((leg.distance.value / 1000) * 10) / 10;
      setRouteKm(km);
      if (onKmChange) onKmChange(km);
    }
  }, [onKmChange, onDirectionsChange]);

  const handleDirections = useCallback((
    result: google.maps.DirectionsResult | null,
    status: google.maps.DirectionsStatus,
  ) => {
    if (status === "OK" && result) {
      skipNextChange.current = true;
      setDirections(result);
      updateRouteInfo(result);
    }
  }, [updateRouteInfo]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg3)] rounded-[12px]">
        <span className="text-[12px] text-[var(--color-f4)]">Carregando mapa...</span>
      </div>
    );
  }

  const isDarkStyle = mapType === "roadmap";

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%", borderRadius: 12 }}
        zoom={10}
        center={{ lat: -23.5505, lng: -46.6333 }}
        onLoad={(map: google.maps.Map) => setMapInstance(map)}
        options={{
          disableDefaultUI: true,
          mapTypeId: mapType,
          // Only apply dark style on roadmap — terrain/satellite look better natural
          styles: isDarkStyle ? DARK_MAP_STYLES : NATURAL_MAP_STYLES,
        }}
      >
        {origin && destination && !requested.current && (
          <DirectionsService
            options={{
              destination,
              origin,
              travelMode: "DRIVING",
              // useDefaultRoute=true → fetch without waypoints (reset to shortest path)
              ...(!useDefaultRoute && savedWaypoints
                ? { waypoints: savedWaypoints, optimizeWaypoints: false }
                : {}),
            }}
            callback={(r: google.maps.DirectionsResult | null, s: google.maps.DirectionsStatus) => {
              requested.current = true;
              handleDirections(r, s);
            }}
          />
        )}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{ draggable: true, suppressMarkers: false }}
            onLoad={(renderer: google.maps.DirectionsRenderer) => { rendererRef.current = renderer; }}
            onDirectionsChanged={() => {
              if (skipNextChange.current) { skipNextChange.current = false; return; }
              const updated = rendererRef.current?.getDirections();
              if (updated) updateRouteInfo(updated);
            }}
          />
        )}

        {/* KM balloon — positioned at polyline midpoint, above the route */}
        {directions && routeMidpoint && routeKm !== null && (
          <OverlayView
            position={routeMidpoint}
            mapPaneName="overlayMouseTarget"
            getPixelPositionOffset={(w: number, h: number) => ({
              x: -(w / 2),
              y: -(h + 6), // 6px gap above the route line
            })}
          >
            <div
              className="pointer-events-none flex flex-col items-center"
              style={{ position: "absolute" }}
            >
              <div
                className="flex items-center gap-1 px-2 py-[5px] rounded-[7px] text-[11px] font-bold"
                style={{
                  background: "rgba(0,0,0,0.82)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(34,211,238,0.45)",
                  color: "var(--color-cyan)",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.6)",
                }}
              >
                <IconMapPin size={10} />
                {routeKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
              </div>
              {/* Arrow pointing down to the route */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "5px solid rgba(34,211,238,0.45)",
                  marginTop: -1,
                }}
              />
            </div>
          </OverlayView>
        )}
      </GoogleMap>

      {/* Map type toggle — top left */}
      <div className="absolute top-2 left-2">
        <MapTypeToggle value={mapType} onChange={t => {
          setMapType(t);
          if (mapInstance) mapInstance.setMapTypeId(t);
        }} />
      </div>

      {/* Zoom + reset — top right */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <ZoomBtn label="+" onClick={() => mapInstance?.setZoom((mapInstance.getZoom() ?? 10) + 1)} />
        <ZoomBtn label="−" onClick={() => mapInstance?.setZoom((mapInstance.getZoom() ?? 10) - 1)} />
        {/* Reset button: only when a route is loaded */}
        {directions && (
          <>
            <div className="h-1" />
            <ResetRouteBtn onClick={() => {
              setUseDefaultRoute(true);
              requested.current = false;
              skipNextChange.current = false;
              setDirections(null);
              setRouteKm(null);
            }} />
          </>
        )}
      </div>

      {/* KM badge — bottom left (persistent, visible even if balloon scrolls off-screen) */}
      {routeKm !== null && (
        <div className="absolute bottom-3 left-3 pointer-events-none">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[12px] font-bold"
            style={{
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(34,211,238,0.35)",
              color: "var(--color-cyan)",
            }}
          >
            <IconMapPin size={12} />
            {routeKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km
          </div>
        </div>
      )}

      {/* Powered by Google Maps — bottom right */}
      <div className="absolute bottom-3 right-3 pointer-events-none">
        <div
          className="px-2 py-1 rounded-[6px] text-[8px] font-medium tracking-wide"
          style={{
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          Powered by Google Maps
        </div>
      </div>

      {/* Close button — top left only when onClose is provided */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`${btnCls} absolute top-2 left-2`}
          style={overlayBtnBase}
        >
          <IconX size={13} />
        </button>
      )}
    </div>
  );
}

// ── Placeholder when no API key ───────────────────────────────────────────────

function MapPlaceholder({ origin, destination }: Pick<RouteMapProps, "origin" | "destination">) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--color-bg3)] rounded-[12px] border border-dashed border-[var(--color-border2)] text-center p-6">
      <IconMapPin size={32} className="text-[var(--color-f4)] mb-3 opacity-50" />
      <div className="text-[12px] font-medium text-[var(--color-f2)] mb-1">Mapa indisponível</div>
      <div className="text-[11px] text-[var(--color-f4)] max-w-xs mb-3">
        Configure <code className="text-[var(--color-cyan)] text-[10px]">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> no arquivo <code className="text-[var(--color-cyan)] text-[10px]">.env</code> para visualizar a rota.
      </div>
      {(origin || destination) && (
        <a
          href={`https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-[var(--color-cyan)] hover:underline"
        >
          Abrir no Google Maps ↗
        </a>
      )}
    </div>
  );
}

// ── Public component ─────────────────────────────────────────────────────────

export function RouteMap(props: RouteMapProps) {
  if (!API_KEY) return <MapPlaceholder origin={props.origin} destination={props.destination} />;
  return <MapWithDirections {...props} />;
}
