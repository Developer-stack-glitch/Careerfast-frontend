export const generateSlug = (text = "") =>
  String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const generatePreviewToken = (jobId) => {
  if (!jobId) return "";
  const secret = "careerfast_admin_preview_token_2026";
  let hash = 0;
  const str = `job_${jobId}_${secret}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hexPart = Math.abs(hash).toString(16);
  const payload = JSON.stringify({ id: Number(jobId), key: hexPart });
  try {
    if (typeof btoa !== 'undefined') {
      return btoa(payload).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }
    return Buffer.from(payload).toString('base64url');
  } catch (e) {
    return hexPart;
  }
};

export const getJobSlug = (job) => {
  if (!job) return "";
  const safeSlug = (val) => {
    if (!val) return "";
    if (Array.isArray(val)) return val.join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    try {
      if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      }
    } catch (e) {}
    return String(val).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  };

  const id = job.id || job.job_id || job.job_post_id;
  const jobNature = safeSlug(job.job_nature || job.type || "job") || "job";
  const jobTitle = safeSlug(job.job_title || job.title || "job");
  const companyName = safeSlug(job.company_name || job.company || "company");
  const locationSlug = safeSlug(job.work_location || job.raw_location || job.location || "");
  const workplaceType = safeSlug(job.workplace_type || job.raw_workplace_type || "");
  const experienceType = safeSlug(job.experience_type || job.level || "");
  const experienceRequired = safeSlug(job.experience_required || job.raw_experience_required || "");

  const parts = [
    jobNature,
    jobTitle,
    companyName,
    locationSlug,
    workplaceType,
    experienceType,
    experienceRequired,
    id
  ];

  return parts.join("-").replace(/-{3,}/g, "--");
};

export const processDescription = (html) => {
  if (!html) return "";
  let str = String(html)
    .replace(/\u00AD/g, '')
    .replace(/\u200B/g, '');

  // If plain text (no HTML tags), convert newlines to paragraphs
  if (!/<[a-z][\s\S]*>/i.test(str)) {
    str = str
      .split(/\r?\n/)
      .map(line => line.trim() === "" ? "<p><br /></p>" : `<p>${line}</p>`)
      .join("");
  } else {
    // Convert empty paragraphs (<p></p>, <p> </p>, <p>&nbsp;</p>) to <p><br /></p>
    // so empty lines created by pressing Enter always render with height
    str = str.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '<p><br /></p>');
  }

  return str.trim();
};

export const isInternshipOpportunity = (job, context = {}) => {
  if (!job) return false;
  const nature = String(job.job_nature || job.type || "").trim().toLowerCase();
  if (nature.includes("intern")) return true;
  const empType = String(job.employment_type || "").trim().toLowerCase();
  if (empType.includes("intern")) return true;
  const title = String(job.title || job.job_title || "").trim();
  if (/\bintern(?:ship)?s?\b/i.test(title)) return true;
  if (context.jobNatureSelected && String(context.jobNatureSelected).toLowerCase().includes("intern")) return true;
  if (typeof window !== "undefined" && (window.location.pathname.includes("/internship") || window.location.pathname.includes("internships"))) return true;
  return false;
};

export const getJobDetailsUrl = (job, preview = false) => {
  if (!job) return "/jobs";
  const slug = getJobSlug(job);
  const id = job.id || job.job_id || job.job_post_id;
  const isPending = job.approval_status === 'pending' || job.approval_status === 'rejected' || preview;

  const isInternship = isInternshipOpportunity(job);
  const basePath = isInternship ? '/internship-details' : '/job-details';

  if (isPending || preview) {
    const token = generatePreviewToken(id);
    return `${basePath}/${slug}?preview=true&preview_token=${token}`;
  }
  return `${basePath}/${slug}`;
};
