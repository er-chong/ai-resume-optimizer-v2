/** @type {import('next').NextConfig} */
const nextConfig = {
  // 确保 pdf-parse 和 mammoth 只在服务器端使用
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

module.exports = nextConfig;
