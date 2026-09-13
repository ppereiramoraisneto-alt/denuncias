import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Suporta o envio de múltiplos anexos (até 5 arquivos de 10MB) numa
      // única chamada de Server Action.
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
