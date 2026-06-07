import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      // KmPlace.routeGoing / routeReturn são DirectionsResult completos (~500 KB cada)
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
