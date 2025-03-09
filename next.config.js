/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't attempt to load these server-only modules on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        mammoth: false,
      };
    }

    // Exclude test files from the build
    config.module.rules.push({
      test: /\.(test|spec)\.(ts|tsx)$/,
      loader: "ignore-loader",
    });

    return config;
  },
  serverExternalPackages: [
    "pg",
    "@vercel/blob",
    "bullmq",
    "mammoth",
    "pdf-parse",
  ],
  // Ensure proper static file handling
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Disable tracing to prevent EPERM errors
    outputFileTracingIgnores: [".next/trace"],
    // Enable app directory features
    appDir: true,
  },
};

export default nextConfig;
