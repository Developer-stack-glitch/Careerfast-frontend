const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  return 'https://api.careerfast.in';
};

const apiBaseUrl = getApiBaseUrl();
const baseUrl = 'https://careerfast.in';

export default async function sitemap() {
  // Static routes
  const routes = [
    '',
    '/about',
    '/jobs',
    '/internships',
    '/scholarships',
    '/blogs',
    '/login',
    '/register',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.8,
  }));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    // Dynamic Job routes
    const jobsRes = await fetch(`${apiBaseUrl}/api/getJobPosts`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: controller.signal,
      next: { revalidate: 3600 }
    }).catch(() => null);

    const jobsData = jobsRes && jobsRes.ok ? await jobsRes.json().catch(() => null) : null;
    const jobs = jobsData?.data?.data || [];
    
    // Dynamic Blog routes
    const blogsRes = await fetch(`${apiBaseUrl}/api/getBlogs`, {
      signal: controller.signal,
      next: { revalidate: 3600 }
    }).catch(() => null);

    clearTimeout(timeoutId);

    const blogsData = blogsRes && blogsRes.ok ? await blogsRes.json().catch(() => null) : null;
    const blogs = blogsData?.data || [];

    const generateSlug = (text) => (text || '').toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const jobEntries = jobs.map((job) => ({
      url: `${baseUrl}/job-details/${generateSlug(job.job_nature)}-${generateSlug(job.job_title)}-${generateSlug(job.company_name)}-${job.id}`,
      lastModified: new Date(job.created_at || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    const blogEntries = blogs.map((blog) => ({
      url: `${baseUrl}/blog/${generateSlug(blog.blogTitle)}`,
      lastModified: new Date(blog.createdDate || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

    return [...routes, ...jobEntries, ...blogEntries];
  } catch (error) {
    console.warn('Sitemap dynamic routes skipped (API unavailable at build time):', error?.message || error);
    return routes;
  }
}
