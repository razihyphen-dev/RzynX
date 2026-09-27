/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' }
    ]
  },
  // Service worker + manifest live in /public and are served as static files
};

module.exports = nextConfig;
