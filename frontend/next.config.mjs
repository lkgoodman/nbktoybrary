/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL ?? "http://backend:8000";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
      {
        source: "/static/:path*",
        destination: `${backendUrl}/static/:path*`,
      },
    ];
  },
};
export default nextConfig;
