import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App is fully dynamic (auth-gated); Cache Components/PPR adds no value here.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
