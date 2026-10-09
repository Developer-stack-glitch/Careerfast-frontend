
const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  return 'https://api.careerfast.in'; // Production fallback
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
      next: { revalidate: options.preview ? 0 : 3600 }
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
