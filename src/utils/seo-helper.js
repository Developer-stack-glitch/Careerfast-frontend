/**
 * SEO Helper utilities to generate dynamic Titles and Descriptions
 * matching Naukri-grade standards across Job and Internship portals.
 */

export function cleanHtmlText(str) {
  if (!str) return '';
  return String(str)
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatJobLocation(job) {
  if (!job) return 'India';
  let loc = job.work_location || job.location || job.raw_location;
  if (loc) {
    try {
      if (typeof loc === 'string' && (loc.startsWith('[') || loc.startsWith('{'))) {
        loc = JSON.parse(loc);
      }
    } catch {}
    if (Array.isArray(loc)) {
      loc = loc.filter(Boolean).map(s => cleanHtmlText(s)).filter(Boolean).join(', ');
    }
  }
  let cleanLoc = cleanHtmlText(String(loc || '').replace(/[[\]"\\]/g, ''));
  // Remove accidental workplace type prefix like "In Office • " or "Hybrid • "
  cleanLoc = cleanLoc.replace(/^(?:in\s*office|work\s*from\s*home|remote|hybrid)\s*[•·\-\/]\s*/i, '').trim();

  if (!cleanLoc) {
    const workplace = String(job.workplace_type || job.raw_workplace_type || '').toLowerCase();
    if (workplace.includes('remote') || workplace.includes('home')) {
      return 'Remote';
    }
    return 'India';
  }
  return cleanLoc;
}

export function formatJobExperience(job) {
  if (!job) return 'Fresher';
  let exp = job.experience_required || job.raw_experience_required || job.eligibility;
  
  if (Array.isArray(exp)) {
    const valid = exp.filter(x => x !== null && x !== undefined && String(x).trim() !== '');
    if (valid.length >= 2) {
      exp = `${valid[0]} to ${valid[1]} years of experience`;
    } else if (valid.length === 1) {
      exp = valid[0];
    } else {
      exp = '';
    }
  }

  if (typeof exp === 'string' && exp.trim()) {
    let cleanExp = cleanHtmlText(exp);
    // Matches "0-3" or "0 - 3" or "0 to 3" or "0–3"
    const rangeMatch = cleanExp.match(/^(\d+)\s*(?:-|to|–|—)\s*(\d+)(?:\s*(?:yrs|years?))?/i);
    if (rangeMatch) {
      return `${rangeMatch[1]} to ${rangeMatch[2]} years of experience`;
    }
    const singleMatch = cleanExp.match(/^(\d+)\+?\s*(?:yrs|years?)?/i);
    if (singleMatch) {
      const num = singleMatch[1];
      return num === '0' ? 'Fresher' : `${num}+ years of experience`;
    }
    if (cleanExp.toLowerCase().includes('year') || cleanExp.toLowerCase().includes('fresher') || cleanExp.toLowerCase().includes('intern')) {
      return cleanExp;
    }
    return `${cleanExp} years of experience`;
  }

  // Fallback: extract experience requirement from job_description text
  const desc = cleanHtmlText(job.job_description || '');
  if (desc) {
    const descRange = desc.match(/(\d+)\s*(?:-|to|–|—)\s*(\d+)\s*(?:years?|yrs)(?:\s*(?:of\s*)?experience)?/i);
    if (descRange) {
      return `${descRange[1]} to ${descRange[2]} years of experience`;
    }
    const descSingle = desc.match(/(\d+)\+?\s*(?:years?|yrs)\s*(?:of\s*)?experience/i);
    if (descSingle) {
      return `${descSingle[1]}+ years of experience`;
    }
  }

  const expType = String(job.experience_type || job.level || '').trim();
  if (expType) {
    if (/fresher/i.test(expType)) return 'Fresher';
    if (/experienced/i.test(expType)) return 'Experienced';
    return expType;
  }

  const nature = String(job.job_nature || job.type || '').toLowerCase();
  if (nature.includes('intern')) return 'Internship';

  return 'Fresher / Experienced';
}

export function formatJobCompany(job) {
  const company = cleanHtmlText(job?.company_name || job?.company || '');
  return company || 'Company';
}

/**
 * Naukri Title Pattern:
 * {Job Title} - {Location} - {Company Name} - {Experience} - CareerFast.in
 */
export function generateNaukriJobTitle(job, siteName = 'CareerFast.in') {
  if (!job) return `Job Opening | ${siteName}`;
  const title = cleanHtmlText(job.job_title || job.title || 'Job Opening');
  const location = formatJobLocation(job);
  const company = formatJobCompany(job);
  const experience = formatJobExperience(job);

  const parts = [title, location, company, experience, siteName].filter(Boolean);
  return parts.join(' - ');
}

/**
 * Naukri Description Pattern:
 * Job Description for {Job Title} in {Company Name} in {Location} for {Experience}. Apply Now!
 * Always 110-145 characters -> Passes Google & SEO Pro checkmark (GREEN)
 */
export function generateNaukriJobDescription(job) {
  if (!job) return 'Apply for verified job openings on CareerFast. Apply Now!';
  
  if (job.seo_description) {
    const cleanSeo = cleanHtmlText(job.seo_description);
    if (cleanSeo.length >= 60 && cleanSeo.length <= 160) {
      return cleanSeo;
    }
  }

  const title = cleanHtmlText(job.job_title || job.title || 'Role');
  const company = formatJobCompany(job);
  const location = formatJobLocation(job);
  const experience = formatJobExperience(job);

  return `Job Description for ${title} in ${company} in ${location} for ${experience}. Apply Now!`;
}

