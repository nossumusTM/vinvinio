// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   experimental: {
//     appDir: true,
//     serverActions: true,
//   },
//   productionBrowserSourceMaps: true,

//   images: {
//     domains: [
//       "res.cloudinary.com",
//       "avatars.githubusercontent.com",
//       "lh3.googleusercontent.com",
//     ],
//   },
// };

// module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true, // ✅ keep this if you're using Server Actions
  },
  productionBrowserSourceMaps: true,

  images: {
    domains: [
      "res.cloudinary.com",
      "avatars.githubusercontent.com",
      "lh3.googleusercontent.com",
    ],
  },
  transpilePackages: ['maplibre-gl'],
};

module.exports = nextConfig;