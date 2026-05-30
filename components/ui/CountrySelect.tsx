"use client";

import { useState, useRef, useEffect } from "react";
import { IconChevronDown, IconX } from "@tabler/icons-react";

const COUNTRIES = [
  // Lusófonos primeiro
  "Brasil", "Portugal", "Angola", "Moçambique", "Cabo Verde",
  "Guiné-Bissau", "São Tomé e Príncipe", "Timor-Leste", "Guiné Equatorial",
  // América do Sul
  "Argentina", "Bolívia", "Chile", "Colômbia", "Equador", "Guiana",
  "Guiana Francesa", "Paraguai", "Peru", "Suriname", "Uruguai", "Venezuela",
  // América Central e Caribe
  "Belize", "Costa Rica", "Cuba", "El Salvador", "Guatemala", "Haiti",
  "Honduras", "Jamaica", "México", "Nicarágua", "Panamá",
  "República Dominicana", "Trinidad e Tobago",
  "Antígua e Barbuda", "Bahamas", "Barbados", "Dominica", "Granada",
  "Santa Lúcia", "São Cristóvão e Nevis", "São Vicente e Granadinas",
  // América do Norte
  "Canadá", "Estados Unidos",
  // Europa Ocidental
  "Alemanha", "Andorra", "Áustria", "Bélgica", "Chipre", "Dinamarca",
  "Espanha", "Finlândia", "França", "Grécia", "Irlanda", "Islândia",
  "Itália", "Liechtenstein", "Luxemburgo", "Malta", "Mônaco",
  "Noruega", "Países Baixos", "Reino Unido", "San Marino", "Suécia",
  "Suíça", "Vaticano",
  // Europa Oriental e Central
  "Albânia", "Bielorrússia", "Bósnia e Herzegovina", "Bulgária", "Croácia",
  "Eslováquia", "Eslovênia", "Estônia", "Hungria", "Kosovo", "Letônia",
  "Lituânia", "Macedônia do Norte", "Moldávia", "Montenegro", "Polônia",
  "República Checa", "Romênia", "Rússia", "Sérvia", "Ucrânia",
  // Ásia Ocidental / Oriente Médio
  "Afeganistão", "Arábia Saudita", "Armênia", "Azerbaijão", "Bahrein",
  "Catar", "Emirados Árabes Unidos", "Geórgia", "Iêmen", "Iraque", "Irã",
  "Israel", "Jordânia", "Kuwait", "Líbano", "Omã", "Palestina",
  "Síria", "Turquia",
  // Ásia Central
  "Cazaquistão", "Quirguistão", "Tadjiquistão", "Turcomenistão", "Uzbequistão",
  // Ásia Oriental
  "China", "Coreia do Norte", "Coreia do Sul", "Japão", "Mongólia",
  "Taiwan",
  // Ásia do Sul
  "Bangladesh", "Butão", "Índia", "Maldivas", "Nepal", "Paquistão",
  "Sri Lanka",
  // Sudeste Asiático
  "Brunei", "Camboja", "Filipinas", "Indonésia", "Laos", "Malásia",
  "Mianmar", "Singapura", "Tailândia", "Vietnã",
  // Oceania
  "Austrália", "Fiji", "Ilhas Marshall", "Ilhas Salomão", "Kiribati",
  "Micronésia", "Nauru", "Nova Zelândia", "Palau", "Papua-Nova Guiné",
  "Samoa", "Tonga", "Tuvalu", "Vanuatu",
  // África do Norte
  "Argélia", "Egito", "Líbia", "Marrocos", "Mauritânia", "Sudão",
  "Sudão do Sul", "Tunísia",
  // África Ocidental
  "Benim", "Burkina Fasso", "Camarões", "Costa do Marfim", "Gana",
  "Guiné", "Libéria", "Mali", "Níger", "Nigéria", "Senegal",
  "Serra Leoa", "Togo",
  // África Central
  "Burundi", "Chade", "Congo", "Gabão", "República Centro-Africana",
  "República Democrática do Congo", "Ruanda",
  // África Oriental
  "Comores", "Djibuti", "Eritreia", "Etiópia", "Ilhas Maurício",
  "Quênia", "Madagascar", "Malawi", "Seychelles", "Somália",
  "Tanzânia", "Uganda", "Zâmbia", "Zimbábue",
  // África Austral
  "África do Sul", "Botsuana", "Essuatíni", "Lesoto", "Namíbia",
];

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function CountrySelect({ value, onChange, placeholder = "Ex: Brasil" }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep query in sync when value changes from outside
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        // If user typed something not in the list, treat it as free text
        onChange(query);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, query, onChange]);

  const filtered = query.trim()
    ? COUNTRIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : COUNTRIES;

  function select(country: string) {
    setQuery(country);
    onChange(country);
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    setQuery("");
    onChange("");
    inputRef.current?.focus();
  }

  return (
    <div ref={ref} className="flex flex-col gap-1 relative">
      <label className="text-[11px] font-medium text-[var(--color-f2)]">País</label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[12px] px-3 pr-16 py-[11px] text-[13px] text-[var(--color-f1)] outline-none h-[42px] focus:border-[var(--color-cyan-border)] transition-all placeholder:text-[var(--color-f4)]"
          style={{ borderColor: open ? "var(--color-cyan-border)" : undefined }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button type="button" onClick={clear} className="text-[var(--color-f4)] hover:text-[var(--color-f2)] transition-colors p-0.5 cursor-pointer">
              <IconX size={11} />
            </button>
          )}
          <button
            type="button"
            onClick={() => { setOpen((o) => !o); inputRef.current?.focus(); }}
            className="text-[var(--color-f4)] hover:text-[var(--color-f2)] transition-colors p-0.5 cursor-pointer"
          >
            <IconChevronDown size={13} style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 150ms" }} />
          </button>
        </div>
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-[calc(100%+2px)] left-0 right-0 bg-[var(--color-bg3)] border border-[var(--color-border2)] rounded-[10px] shadow-[0_12px_40px_rgba(0,0,0,0.7)] overflow-hidden">
          <div className="max-h-[200px] overflow-y-auto py-1">
            {filtered.map((country) => (
              <button
                key={country}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(country); }}
                className="w-full text-left px-3 py-[7px] text-[13px] transition-colors cursor-pointer"
                style={{
                  color: country === value ? "var(--color-cyan)" : "var(--color-f2)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {country}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
