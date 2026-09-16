const nextConfig = {
  output: 'standalone',
  env: Object.keys(process.env)
    .filter(key => key.startsWith('REACT_APP_'))
    .reduce((acc, key) => {
      acc[key] = process.env[key];
      return acc;
    }, {}),
  compiler: {
    styledComponents: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-icons', '@ant-design/icons', 'antd'],
  },
  async redirects() {
    return [
      { source: '/hr-jobs', destination: '/recruiter/overview', permanent: true },
      { source: '/hr-profile', destination: '/recruiter/profile', permanent: true },
      { source: '/post-jobs', destination: '/recruiter/post-job', permanent: true },
      { source: '/my-jobs', destination: '/recruiter/my-jobs', permanent: true },
      { source: '/saved-candidates', destination: '/recruiter/saved-candidates', permanent: true },
      { source: '/create-hr-profile', destination: '/recruiter/create-profile', permanent: true },
      { source: '/hr-recruit', destination: '/recruiter/recruit', permanent: true },
      { source: '/hr-management', destination: '/recruiter/management', permanent: true },
      { source: '/applicants/:id*', destination: '/recruiter/applicants/:id*', permanent: true },
      { source: '/edit-job/:id*', destination: '/recruiter/edit-job/:id*', permanent: true },
      { source: '/all-candidates', destination: '/recruiter/all-candidates', permanent: true },
      { source: '/settings', destination: '/recruiter/settings', permanent: true },
      { source: '/pro-subscription', destination: '/recruiter/billing', permanent: true },
    ]
  },
};

module.exports = nextConfig;
