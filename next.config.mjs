const pages = process.env.BUILD_TARGET === 'pages';
const basePath = pages ? '/AAAA' : '';
const nextConfig = {
  devIndicators: false,
  ...(pages ? { output: 'export', basePath, images: { unoptimized: true } } : {}),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  webpack(config) {
    config.resolve.alias = { ...config.resolve.alias, 'konva$': 'konva/lib/index.js' };
    return config;
  },
};
export default nextConfig;
