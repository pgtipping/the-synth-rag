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

    // Add specific handling for Firebase
    config.externals = [...(config.externals || []), { encoding: "encoding" }];

    return config;
  },
  // External packages that should be transpiled
  transpilePackages: ["firebase", "@firebase/auth", "@firebase/app"],
  serverExternalPackages: [
    "pg",
    "@vercel/blob",
    "bullmq",
    "mammoth",
    "pdf-parse",
  ],
  // Disable the X-Powered-By header
  poweredByHeader: false,
  // Enable React strict mode
  reactStrictMode: true,
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
