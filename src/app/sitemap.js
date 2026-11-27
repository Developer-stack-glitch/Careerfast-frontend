import { getJobSlug, isInternshipOpportunity, generateSlug } from '@/utils/slug';

const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
  if (envUrl && !(process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/i.test(envUrl))) {
    return envUrl;
  }
  return 'https://careerfast.in';
};

const apiBaseUrl = getApiBaseUrl();
const baseUrl = 'https://careerfast.in';

export const revalidate = 3600;

const STATIC_ROUTES = [
  { path: '', changeFrequency: 'daily', priority: 1.0 },
  { path: '/jobs', changeFrequency: 'daily', priority: 0.9 },
  { path: '/internships', changeFrequency: 'daily', priority: 0.9 },
  { path: '/courses', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/blogs', changeFrequency: 'daily', priority: 0.8 },
  { path: '/scholarship', changeFrequency: 'daily', priority: 0.8 },
  { path: '/mentors', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/competitions', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/recruiter-pricing', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/support', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/cookies', changeFrequency: 'yearly', priority: 0.3 },
];

const PROGRAMMATIC_FILTER_ROUTES = [
  '/jobs/work-from-home',
  '/jobs/jobs-in-bangalore',
  '/jobs/jobs-in-delhi',
  '/jobs/jobs-in-hyderabad',
  '/jobs/jobs-in-mumbai',
  '/jobs/jobs-in-pune',
  '/jobs/jobs-in-chennai',
  '/jobs/jobs-in-gurgaon',
  '/jobs/jobs-in-kolkata',
  '/jobs/jobs-in-noida',
  '/jobs/full-stack-development-jobs',
  '/jobs/devops-cloud-computing-jobs',
  '/jobs/data-science-analytics-jobs',
  '/jobs/frontend-development-jobs',
  '/jobs/software-development-jobs',
  '/jobs/ui-ux-design-jobs',
  '/internships/work-from-home',
  '/internships/internships-in-bangalore',
  '/internships/internships-in-delhi',
  '/internships/internships-in-hyderabad',
  '/internships/internships-in-mumbai',
  '/internships/internships-in-chennai',
  '/internships/internships-in-pune',
];

async function fetchAllActiveJobsFallback(signal) {
  const allJobs = [];
  const limit = 500;
  const maxPages = 10;

  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(`${apiBaseUrl}/api/getJobPosts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit, page, is_closed: 0 }),
      signal,
      cache: 'no-store',
    }).catch(() => null);

    if (!res || !res.ok) break;
    const json = await res.json().catch(() => null);
    const batch = json?.data?.data || [];
    if (!Array.isArray(batch) || batch.length === 0) break;

    allJobs.push(...batch);
    const hasMore = json?.data?.meta?.hasMore;
    if (!hasMore || batch.length < limit) break;
  }

  return allJobs;
}

async function fetchSitemapPayload(signal) {
  // Prefer lightweight dedicated SEO endpoint when available
  const seoRes = await fetch(`${apiBaseUrl}/api/seo/sitemap-data`, {
    signal,
    cache: 'no-store',
  }).catch(() => null);

  if (seoRes && seoRes.ok) {
    const seoJson = await seoRes.json().catch(() => null);
    if (seoJson?.success && seoJson?.data) {
      return {
        jobs: seoJson.data.jobs || [],
        blogs: seoJson.data.blogs || [],
        courses: seoJson.data.courses || [],
      };
    }
  }

  // Fallback to standard public endpoints
  const [jobs, blogsRes, coursesRes] = await Promise.all([
    fetchAllActiveJobsFallback(signal),
    fetch(`${apiBaseUrl}/api/blogs/all-blogs`, {
      signal,
      next: { revalidate: 3600 },
    }).catch(() => null),
    fetch(`${apiBaseUrl}/api/courses`, {
      signal,
      cache: 'no-store',
    }).catch(() => null),
  ]);

  const blogsJson = blogsRes && blogsRes.ok ? await blogsRes.json().catch(() => null) : null;
  const coursesJson = coursesRes && coursesRes.ok ? await coursesRes.json().catch(() => null) : null;

  return {
    jobs,
    blogs: Array.isArray(blogsJson) ? blogsJson : (blogsJson?.data || []),
    courses: Array.isArray(coursesJson) ? coursesJson : (coursesJson?.data || []),
  };
}

export default async function sitemap() {
  const now = new Date();

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const filterEntries = PROGRAMMATIC_FILTER_ROUTES.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const baseEntries = [...staticEntries, ...filterEntries];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const { jobs, blogs, courses } = await fetchSitemapPayload(controller.signal);
    clearTimeout(timeoutId);

    const jobEntries = jobs
      .filter((job) => job && job.id && job.is_closed !== 1 && job.is_closed !== true)
      .map((job) => {
        const slug = getJobSlug(job);
        const nature = String(job.job_nature || job.type || '').toLowerCase();
        let detailBasePath = '/job-details';
        if (nature.includes('scholarship')) {
          detailBasePath = '/scholarship-details';
        } else if (isInternshipOpportunity(job)) {
          detailBasePath = '/internship-details';
        }

        return {
          url: `${baseUrl}${detailBasePath}/${slug}`,
          lastModified: new Date(job.updated_at || job.approved_at || job.created_at || Date.now()),
          changeFrequency: 'weekly',
          priority: 0.7,
        };
      });

    const blogEntries = blogs
      .filter((blog) => blog?.blogTitle)
      .map((blog) => ({
        url: `${baseUrl}/blog/${generateSlug(blog.blogTitle)}`,
        lastModified: new Date(blog.updatedDate || blog.createdDate || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));

    const courseEntries = courses
      .filter((course) => course?.slug || course?.title)
      .map((course) => ({
        url: `${baseUrl}/courses/${course.slug || generateSlug(course.title)}`,
        lastModified: new Date(course.updated_at || course.created_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));

    return [...baseEntries, ...jobEntries, ...blogEntries, ...courseEntries];
  } catch (error) {
    console.warn('Sitemap dynamic routes skipped (API unavailable at build time):', error?.message || error);
    return baseEntries;
  }
}
