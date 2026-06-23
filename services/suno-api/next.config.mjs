/** @type {import('next').NextConfig} */
const serverExternals = [
  'rebrowser-playwright-core',
  '@playwright/browser-chromium',
  'electron',
  'canvas',
  'ghost-cursor-playwright',
];

const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      for (const pkg of serverExternals) {
        config.externals.push(pkg);
      }
    }
    config.module.rules.push({
      test: /\.(ttf|html)$/i,
      type: 'asset/resource',
    });
    return config;
  },
  experimental: {
    serverMinification: false,
    serverComponentsExternalPackages: serverExternals,
  },
};

export default nextConfig;
