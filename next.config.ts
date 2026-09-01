import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow connections from mobile devices on local network for HMR
  allowedDevOrigins: ['192.168.88.4', 'localhost', '127.0.0.1'],
};

export default nextConfig;
