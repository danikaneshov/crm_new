import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Разрешаем доступ с вашего телефона и для туннелей (ngrok/localtunnel)
  allowedDevOrigins: ['192.168.1.71', 'localhost:3000', 'swift-llamas-stick.loca.lt', 'rhythm-tracking-pressure-moms.trycloudflare.com', 'valued-april-tribes-mandatory.trycloudflare.com', 'axis-challenges-prince-austin.trycloudflare.com'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
