"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { IconMapPin, IconX } from "@tabler/icons-react";
import { GOOGLE_MAPS_LIBRARIES } from "./AddressAutocomplete";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface RouteMapProps {
  origin: string;
  destination: string;
  onKmChange?: (km: number) => void;
  onClose?: () => void;
}

// ── Dark map style ────────────────────────────────────────────────────────────

const DARK_MAP_STYLES = [
  // Base — tudo no azul escuro original
  { elementType: "geometry",             stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke",   stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill",     stylers: [{ color: "#6b7a99" }] },
  // Água um tom mais escuro
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d0d1f" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3a4a6b" }] },
  // Parques ligeiramente distintos
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#16213e" }] },
  // ── Vias — tons progressivamente mais claros ──
  { featureType: "road.local",    elementType: "geometry.fill",   stylers: [{ color: "#252547" }] },
  { featureType: "road.local",    elementType: "labels.text.fill", stylers: [{ color: "#4a5578" }] },
  { featureType: "road.arterial", elementType: "geometry.fill",   stylers: [{ color: "#2e2e5a" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#7a8ab0" }] },
  { featureType: "road.highway",  elementType: "geometry.fill",   stylers: [{ color: "#3a3a70" }] },
  { featureType: "road.highway",  elementType: "geometry.stroke",  stylers: [{ color: "#1a1a2e" }] },
  { featureType: "road.highway",  elementType: "labels.text.fill", stylers: [{ color: "#9aa5cc" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry.fill", stylers: [{ color: "#464685" }] },
  // Trânsito / admin
  { featureType: "transit",       elementType: "labels.text.fill", stylers: [{ color: "#4a5578" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#8895bb" }] },
];

// ── Lazy loader for Google Maps ───────────────────────────────────────────────

function MapWithDirections({ origin, destination, onKmChange, onClose }: RouteMapProps) {
  // Dynamic import of Google Maps components only when API key is present
  const { GoogleMap, useLoadScript, DirectionsService, DirectionsRenderer } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@react-google-maps/api");

  const { isLoaded } = useLoadScript({ googleMapsApiKey: API_KEY!, libraries: GOOGLE_MAPS_LIBRARIES });
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [routeKm, setRouteKm] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<string | null>(null);
  const requested = useRef(false);
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Reset route whenever addresses change
  useEffect(() => {
    requested.current = false;
    setDirections(null);
    setRouteKm(null);
    setRouteDuration(null);
  }, [origin, destination]);

  const handleDirections = useCallback((result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
    if (status === "OK" && result) {
      setDirections(result);
      const leg = result.routes[0]?.legs[0];
      if (leg?.distance?.value) {
        const km = Math.round((leg.distance.value / 1000) * 10) / 10;
        setRouteKm(km);
        if (onKmChange) onKmChange(km);
      }
      if (leg?.duration?.text) {
        setRouteDuration(leg.duration.text);
      }
    }
  }, [onKmChange]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg3)] rounded-[12px]">
        <span className="text-[12px] text-[var(--color-f4)]">Carregando mapa...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%", borderRadius: 12 }}
        zoom={10}
        center={{ lat: -23.5505, lng: -46.6333 }}
        options={{
          disableDefaultUI: false,
          styles: DARK_MAP_STYLES,
        }}
      >
        {origin && destination && !requested.current && (
          <DirectionsService
            options={{ destination, origin, travelMode: "DRIVING" }}
            callback={(r: google.maps.DirectionsResult | null, s: google.maps.DirectionsStatus) => {
              requested.current = true;
              handleDirections(r, s);
            }}
          />
        )}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{ draggable: true }}
            onLoad={(renderer: google.maps.DirectionsRenderer) => { rendererRef.current = renderer; }}
            onDirectionsChanged={() => {
              const updated = rendererRef.current?.getDirections();
              if (!updated) return;
              const leg = updated.routes[0]?.legs[0];
              if (leg?.distance?.value) {
                const km = Math.round((leg.distance.value / 1000) * 10) / 10;
                setRouteKm(km);
                if (onKmChange) onKmChange(km);
              }
              if (leg?.duration?.text) {
                setRouteDuration(leg.duration.text);
              }
            }}
          />
        )}
      </GoogleMap>

      {/* KM overlay */}
      {routeKm !== null && (
        <div className="absolute bottom-3 left-3 flex items-center gap-2 pointer-events-none">
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
          {routeDuration && (
            <div
              className="px-2 py-1.5 rounded-[8px] text-[11px] font-medium"
              style={{
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {routeDuration}
            </div>
          )}
        </div>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 rounded-[8px] bg-[rgba(0,0,0,0.7)] flex items-center justify-center text-white hover:bg-[rgba(0,0,0,0.9)] transition-colors cursor-pointer border-0"
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
