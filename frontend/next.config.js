/** @type {import('next').NextConfig} */
const backendUrl = (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_ENVIRONMENT_NAME)
  ? "http://backend.railway.internal:8000"
  : (process.env.BACKEND_URL ?? "http://backend:8000");

const nextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backendUrl}/:path*` },
      { source: "/static/:path*", destination: `${backendUrl}/static/:path*` },
    ];
  },
};

module.exports = nextConfig;
