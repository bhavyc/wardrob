import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow connections from mobile devices on local network for HMR
  allowedDevOrigins: [
    '10.76.137.204',
    '10.76.137.158',
    '10.76.137.144',
    '10.49.116.126',
    '192.168.88.6',
    '192.168.88.4',
    '192.168.88.7',
    'localhost',
    '127.0.0.1'
  ],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
