import withPWAInit from '@ducanh2912/next-pwa';

const nextConfig = {
  serverExternalPackages: ['puppeteer', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth'],
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('puppeteer', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth');
    }
    return config;
  },
};

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWA(nextConfig);
