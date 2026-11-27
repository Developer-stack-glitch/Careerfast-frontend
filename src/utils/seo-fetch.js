import { generateSlug } from './slug';

const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
  if (envUrl && !(process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/i.test(envUrl))) {
    return envUrl;
  }
  return 'https://careerfast.in';
};

const apiBaseUrl = getApiBaseUrl();

export const getAbsoluteMediaUrl = (url, fallback = 'https://careerfast.in/og-image.png') => {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('data:')) return fallback;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/api/')) return `${apiBaseUrl}${trimmed}`;
  if (trimmed.startsWith('/')) return `https://careerfast.in${trimmed}`;
  return `${apiBaseUrl}/${trimmed}`;
};

export const fetchJobForSEO = async (jobId, options = {}) => {
  try {
    const payload = { id: jobId };
    if (options.preview) {
      payload.preview = true;
      if (options.preview_token) {
        payload.preview_token = options.preview_token;
      }
    }

    const response = await fetch(`${apiBaseUrl}/api/getJobPosts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: options.preview ? 'no-store' : 'no-cache',
      next: { revalidate: options.preview ? 0 : 60 }
    });
    if (!response.ok) return null;
    const result = await response.json();
    const jobData = result?.data?.data;
    if (Array.isArray(jobData) && jobData.length > 0) {
      return jobData[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching job for SEO:', error);
    return null;
  }
};

export const fetchBlogForSEO = async (blogId) => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/blogs/${blogId}`, {
      next: { revalidate: 3600 }
    });
    if (!response.ok) return null;
    const result = await response.json();
    return result?.data || result || null;
  } catch (error) {
    console.error('Error fetching blog for SEO:', error);
    return null;
  }
};

export const fetchBlogBySlugForSEO = async (slug) => {
  try {
    const listRes = await fetch(`${apiBaseUrl}/api/blogs/all-blogs`, {
      next: { revalidate: 3600 }
    });
    if (!listRes.ok) return null;
    const listJson = await listRes.json();
    const blogs = Array.isArray(listJson) ? listJson : (listJson?.data || []);
    const found = blogs.find((b) => generateSlug(b.blogTitle) === slug);
    if (!found) return null;
    return await fetchBlogForSEO(found.id);
  } catch (error) {
    console.error('Error fetching blog by slug for SEO:', error);
    return null;
  }
};

export const fetchRelatedJobsForSEO = async (excludeJobId, category = null, type = null) => {
  try {
    const payload = { limit: 6 };
    if (category) {
      payload.job_categories = Array.isArray(category) ? category : [category];
    }
    if (type) {
      payload.job_nature = type;
    }
    const response = await fetch(`${apiBaseUrl}/api/getJobPosts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      next: { revalidate: 1800 }
    });
    const result = await response.json();
    let jobs = result?.data?.data || [];
    if (jobs.length <= 1) {
      const fbResponse = await fetch(`${apiBaseUrl}/api/getJobPosts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 6 }),
        next: { revalidate: 1800 }
      });
      const fbResult = await fbResponse.json();
      jobs = fbResult?.data?.data || jobs;
    }
    return jobs.filter(j => String(j.id) !== String(excludeJobId)).slice(0, 4);
  } catch (error) {
    console.error('Error fetching related jobs for SEO:', error);
    return [];
  }
};

export const fetchCoursesForSEO = async (limit = 4) => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/courses?limit=${limit}`, {
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const courses = await response.json();
    return Array.isArray(courses) ? courses.slice(0, 3) : [];
  } catch (error) {
    console.error('Error fetching courses for SEO:', error);
    return [];
  }
};

export const fetchCourseBySlugForSEO = async (slug) => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/courses/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 }
    });
    if (!response.ok) return null;
    const course = await response.json();
    return course && course.title ? course : null;
  } catch (error) {
    console.error('Error fetching course by slug for SEO:', error);
    return null;
  }
};

export const fetchBlogsListForSEO = async () => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/blogs/all-blogs`, {
      next: { revalidate: 1800 }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : (data?.data || []);
  } catch (error) {
    console.error('Error fetching blogs list for SEO:', error);
    return [];
  }
};

export const fetchHomePageDataForSEO = async () => {
  const empty = {
    fresherJobs: [],
    internshipJobs: [],
    companies: [],
    recentBlogs: [],
    coursesList: [],
    stats: null,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const [fresherRes, internshipRes, companiesRes, blogsRes, coursesRes, statsRes] = await Promise.allSettled([
      fetch(`${apiBaseUrl}/api/getJobPosts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 12, experience_type: 'Fresher' }),
        signal: controller.signal,
        next: { revalidate: 300 },
      }),
      fetch(`${apiBaseUrl}/api/getJobPosts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 12, job_nature: 'Internship' }),
        signal: controller.signal,
        next: { revalidate: 300 },
      }),
      fetch(`${apiBaseUrl}/api/getTopCompanies?limit=12`, {
        signal: controller.signal,
        next: { revalidate: 1800 },
      }),
      fetch(`${apiBaseUrl}/api/blogs/all-blogs`, {
        signal: controller.signal,
        next: { revalidate: 1800 },
      }),
      fetch(`${apiBaseUrl}/api/courses?limit=6`, {
        signal: controller.signal,
        cache: 'no-store',
      }),
      fetch(`${apiBaseUrl}/api/getHomePageStats`, {
        signal: controller.signal,
        next: { revalidate: 1800 },
      }),
    ]);

    clearTimeout(timeoutId);

    const parseJson = async (settled) => {
      if (settled.status !== 'fulfilled' || !settled.value?.ok) return null;
      return settled.value.json().catch(() => null);
    };

    const [fresherJson, internshipJson, companiesJson, blogsJson, coursesJson, statsJson] = await Promise.all([
      parseJson(fresherRes),
      parseJson(internshipRes),
      parseJson(companiesRes),
      parseJson(blogsRes),
      parseJson(coursesRes),
      parseJson(statsRes),
    ]);

    const blogs = Array.isArray(blogsJson) ? blogsJson : (blogsJson?.data || []);

    return {
      fresherJobs: fresherJson?.data?.data || [],
      internshipJobs: internshipJson?.data?.data || [],
      companies: companiesJson?.data || [],
      recentBlogs: blogs.slice(0, 3),
      coursesList: Array.isArray(coursesJson) ? coursesJson : [],
      stats: statsJson?.data || null,
    };
  } catch (error) {
    console.warn('Homepage SSR pre-fetch skipped:', error?.message || error);
    return empty;
  }
};
