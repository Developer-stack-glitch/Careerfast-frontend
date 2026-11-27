/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  turbopack: {},
  env: Object.keys(process.env)
    .filter(key => key.startsWith('REACT_APP_'))
    .reduce((acc, key) => {
      acc[key] = process.env[key];
      return acc;
    }, {}),
  reactStrictMode: false,
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 4,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'react-icons',
      '@ant-design/icons',
      'antd',
      'framer-motion',
      'date-fns',
      'recharts',
      'react-slick',
    ],
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
      };
    }
    return config;
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'careerfast.in' }],
        destination: 'https://www.careerfast.in/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          { type: 'host', value: 'www.careerfast.in' },
          { type: 'header', key: 'x-forwarded-proto', value: 'http' },
        ],
        destination: 'https://www.careerfast.in/:path*',
        permanent: true,
      },
      { source: '/hr-jobs', destination: '/recruiter/overview', permanent: true },
      { source: '/hr-profile', destination: '/recruiter/profile', permanent: true },
      { source: '/post-jobs', destination: '/recruiter/post-job', permanent: true },
      { source: '/my-jobs', destination: '/recruiter/my-jobs', permanent: true },
      { source: '/saved-candidates', destination: '/recruiter/saved-candidates', permanent: true },
      { source: '/create-hr-profile', destination: '/recruiter/profile', permanent: true },
      { source: '/hr-recruit', destination: '/recruiter/recruit', permanent: true },
      { source: '/hr-management', destination: '/recruiter/management', permanent: true },
      { source: '/applicants/:id*', destination: '/recruiter/applicants/:id*', permanent: true },
      { source: '/edit-job/:id*', destination: '/recruiter/edit-job/:id*', permanent: true },
      { source: '/all-candidates', destination: '/recruiter/all-candidates', permanent: true },
      { source: '/settings', destination: '/recruiter/settings', permanent: true },
      { source: '/pro-subscription', destination: '/recruiter/billing', permanent: true },
      { source: '/admin/employers', destination: '/admin/recruiters', permanent: true },
      { source: '/admin/billing', destination: '/admin/plans', permanent: true },
      { source: '/pricing', destination: '/recruiter-pricing', permanent: true },
      { source: '/recruiter/pricing', destination: '/recruiter-pricing', permanent: true },
      { source: '/internship', destination: '/internships', permanent: true },
      { source: '/internship/:filterSlug*', destination: '/internships/:filterSlug*', permanent: true },
      { source: '/job-filter', destination: '/jobs', permanent: true },
      { source: '/internship-filter', destination: '/internships', permanent: true },
      { source: '/help', destination: '/support', permanent: true },
    ];
  },
  async headers() {
    const noindexHeaders = [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
    ];
    return [
      { source: '/admin/:path*', headers: noindexHeaders },
      { source: '/superadmin/:path*', headers: noindexHeaders },
      { source: '/admin-dashboard/:path*', headers: noindexHeaders },
      { source: '/candidate-profile/:path*', headers: noindexHeaders },
      { source: '/login', headers: noindexHeaders },
      { source: '/register', headers: noindexHeaders },
      { source: '/accountsetting', headers: noindexHeaders },
      { source: '/main-profile', headers: noindexHeaders },
      { source: '/profiledetails', headers: noindexHeaders },
    ];
  },
};

module.exports = nextConfig;
