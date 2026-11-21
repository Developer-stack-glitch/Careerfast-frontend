const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  return 'https://careerfast.in'; // Production fallback
};

const apiBaseUrl = getApiBaseUrl();

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
    const response = await fetch(`${apiBaseUrl}/api/getBlogById/${blogId}`, {
      next: { revalidate: 3600 }
    });
    const result = await response.json();
    return result?.data || null;
  } catch (error) {
    console.error('Error fetching blog for SEO:', error);
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
      next: { revalidate: 3600 }
    });
    const courses = await response.json();
    return Array.isArray(courses) ? courses.slice(0, 3) : [];
  } catch (error) {
    console.error('Error fetching courses for SEO:', error);
    return [];
  }
};
