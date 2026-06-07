"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { IconMapPin } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Stable reference — MUST be module-level to avoid re-loading the script
// "geometry" is needed by RouteMap to decode overview_polyline for km balloon midpoint
export const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  autoFocus?: boolean;
}

// ── Inner component (only rendered when API key exists) ───────────────────────

function AutocompleteInner({ value, onChange, placeholder, className, required, autoFocus }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useLoadScript } = require("@react-google-maps/api");
  const { isLoaded } = useLoadScript({ googleMapsApiKey: API_KEY!, libraries: GOOGLE_MAPS_LIBRARIES });

  const [inputVal, setInputVal] = useState(value);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when parent value changes (e.g. form reset)
  useEffect(() => { setInputVal(value); }, [value]);

  // Init Places service once maps is loaded
  useEffect(() => {
    if (isLoaded && !serviceRef.current) {
      serviceRef.current = new google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  const fetchSuggestions = useCallback((text: string) => {
    if (!serviceRef.current || text.length < 3) {
      setSuggestions([]); setOpen(false); return;
    }
    serviceRef.current.getPlacePredictions(
      { input: text, language: "pt-BR", componentRestrictions: { country: "br" } },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions.slice(0, 3));
          setOpen(true);
          setActiveIdx(-1);
        } else {
          setSuggestions([]); setOpen(false);
        }
      }
    );
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputVal(val);
    setActiveIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 280);
  }

  function handleSelect(pred: google.maps.places.AutocompletePrediction) {
    const address = pred.description;
    setInputVal(address);
    setSuggestions([]); setOpen(false);
    onChange(address);
  }

  function handleBlur() {
    // Delay so mouseDown on suggestion fires first
    setTimeout(() => {
      setOpen(false);
      onChange(inputVal);
    }, 160);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); handleSelect(suggestions[activeIdx]); }
    if (e.key === "Escape") { setOpen(false); setActiveIdx(-1); }
  }

  return (
    <div className="relative w-full">
      <input
        className={className}
        value={inputVal}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        autoComplete="off"
      />

      {open && suggestions.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 z-[100] mt-1 rounded-[10px] overflow-hidden shadow-2xl"
          style={{ background: "var(--color-bg2)", border: "1px solid var(--color-border)" }}
        >
          {suggestions.map((s, i) => (
            <button
              key={s.place_id}
              type="button"
              onMouseDown={() => handleSelect(s)}
              className={cn(
                "w-full text-left px-3 py-2.5 flex items-start gap-2 cursor-pointer border-0 border-b transition-colors",
                "last:border-0",
                i === activeIdx
                  ? "bg-[rgba(34,211,238,0.1)] text-[var(--color-f1)]"
                  : "bg-transparent text-[var(--color-f2)] hover:bg-[var(--color-bg3)]"
              )}
              style={{ borderColor: "var(--color-border)" }}
            >
              <IconMapPin size={11} className="text-[var(--color-cyan)] flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[11px] font-medium truncate">
                  {s.structured_formatting.main_text}
                </div>
                <div className="text-[10px] text-[var(--color-f4)] truncate">
                  {s.structured_formatting.secondary_text}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Public component — falls back to plain input without API key ───────────────

export function AddressAutocomplete(props: Props) {
  if (!API_KEY) {
    return (
      <input
        className={props.className}
        value={props.value}
        onChange={e => props.onChange(e.target.value)}
        onBlur={e => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        required={props.required}
        autoFocus={props.autoFocus}
        autoComplete="off"
      />
    );
  }
  return <AutocompleteInner {...props} />;
}
