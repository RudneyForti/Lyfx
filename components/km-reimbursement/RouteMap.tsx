"use client";

import { useState, useCallback, useRef } from "react";
import { IconMapPin, IconX } from "@tabler/icons-react";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface RouteMapProps {
  origin: string;
  destination: string;
  onKmChange?: (km: number) => void;
  onClose?: () => void;
}

// ── Lazy loader for Google Maps ───────────────────────────────────────────────

function MapWithDirections({ origin, destination, onKmChange, onClose }: RouteMapProps) {
  // Dynamic import of Google Maps components only when API key is present
  const { GoogleMap, useLoadScript, DirectionsService, DirectionsRenderer } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@react-google-maps/api");

  const { isLoaded } = useLoadScript({ googleMapsApiKey: API_KEY! });
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const requested = useRef(false);

  const handleDirections = useCallback((result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
    if (status === "OK" && result) {
      setDirections(result);
      const km = result.routes[0]?.legs[0]?.distance?.value;
      if (km && onKmChange) onKmChange(Math.round((km / 1000) * 10) / 10);
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
          styles: [{ featureType: "all", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] }],
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
          />
        )}
      </GoogleMap>
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
