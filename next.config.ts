import withPWA from 'next-pwa';
// @ts-expect-error - next-pwa/cache does not include exported types
import defaultCache from 'next-pwa/cache';

const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'transformers-wasm-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    ...defaultCache,
  ],
});

const nextConfig = pwaConfig({
  webpack: (config: any, { isServer, dev }: { isServer: boolean; dev: boolean }) => {
    if (dev) {
      config.devtool = 'cheap-module-source-map';
    }
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        canvas: false,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }
    return config;
  },
});

export default nextConfig;
