import type { NextConfig } from "next";

// CS-31: Headers de segurança HTTP aplicados em todas as rotas
const securityHeaders = [
  // Impede que o site seja carregado em <iframe> de outro domínio (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Impede que o browser "adivinhe" o MIME type de arquivos (vetor de XSS)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Controla quais informações de URL são enviadas ao navegar para outros sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restringe acesso a APIs sensíveis do browser (câmera, microfone, etc.)
  // geolocation=(self) mantém Google Maps funcionando
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=()",
  },
  // HSTS: força HTTPS por 2 anos em produção (ignorado em HTTP/dev)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Ativa filtro XSS legado em browsers antigos
  { key: "X-XSS-Protection", value: "1; mode=block" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      // KmPlace.routeGoing / routeReturn são DirectionsResult completos (~500 KB cada)
      bodySizeLimit: "5mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
