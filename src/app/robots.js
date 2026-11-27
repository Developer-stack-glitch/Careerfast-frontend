export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/superadmin',
          '/superadmin/*',
          '/admin-dashboard',
          '/admin-dashboard/*',
          '/candidate-profile',
          '/candidate-profile/*',
          '/all-candidates',
          '/applied-candidates-all',
          '/accountsetting',
          '/main-profile',
          '/profiledetails',
          '/bookmark',
          '/watchlist',
          '/recently-viewed',
          '/settings',
          '/manage-notification',
          '/add-blog',
          '/post-course',
          '/post-events',
          '/post-workshop',
          '/login',
          '/register',
          '/*?*preview=true',
        ],
      },
    ],
    sitemap: 'https://www.careerfast.in/sitemap.xml',
  };
}
