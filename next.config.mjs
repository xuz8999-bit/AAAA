const nextConfig = {
  devIndicators: false,
  webpack(config) {
    config.resolve.alias = { ...config.resolve.alias, 'konva$': 'konva/lib/index.js' };
    return config;
  },
};
export default nextConfig;
