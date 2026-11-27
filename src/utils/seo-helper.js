import { processDescription } from './slug';

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
      if (rangeMatch[1] === '0' && rangeMatch[2] === '0') return 'Fresher';
      if (rangeMatch[1] === rangeMatch[2]) return `${rangeMatch[1]} years of experience`;
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

/**
 * Parses programmatic SEO filter slugs like:
 * - jobs-in-bangalore
 * - internships-in-chennai
 * - full-stack-development-jobs
 * - fresher-work-from-home-jobs
 * - work-from-home
 */
export function parseFilterSlugMetadata(filterSlug = '', type = 'Jobs') {
  const rawSlug = String(filterSlug || '').trim().toLowerCase();
  const basePath =
    type === 'Internships' ? '/internships' :
    type === 'Scholarships' ? '/scholarship' : '/jobs';

  const toTitleCase = (s) =>
    s
      .split(/[\s-]+/)
      .filter(Boolean)
      .map((w) => {
        if (w === 'ui' || w === 'ux' || w === 'hr' || w === 'ai' || w === 'ml' || w === 'qa' || w === 'it') {
          return w.toUpperCase();
        }
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');

  let headline = type;
  if (rawSlug === 'work-from-home' || rawSlug === 'fresher-work-from-home-jobs') {
    const prefix = rawSlug.startsWith('fresher-') ? 'Fresher ' : '';
    headline = `${prefix}Work From Home ${type}`;
  } else if (rawSlug.includes('-in-')) {
    const [left, loc] = rawSlug.split('-in-');
    const locationName = toTitleCase(loc || 'India');
    const isFresher = left.startsWith('fresher');
    headline = `${isFresher ? 'Fresher ' : ''}${type} in ${locationName}`;
  } else if (rawSlug) {
    const cleaned = rawSlug.replace(/-(jobs|internships|scholarships)$/i, '');
    const topic = toTitleCase(cleaned);
    headline = topic ? `${topic} ${type}` : type;
  }

  return {
    headline,
    title: `${headline} - Apply Online | CareerFast`,
    description: `Explore the latest ${headline.toLowerCase()} from verified companies on CareerFast. Filter by location, salary, and work mode and apply directly.`,
    canonicalUrl: `https://careerfast.in${basePath}/${filterSlug}`,
  };
}

function resolveSeoMediaUrl(url, fallback = 'https://careerfast.in/og-image.png') {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('data:')) return fallback;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 'https://api.careerfast.in';
  if (trimmed.startsWith('/api/')) return `${apiBase}${trimmed}`;
  if (trimmed.startsWith('/')) return `https://careerfast.in${trimmed}`;
  return `${apiBase}/${trimmed}`;
}

function mapEmploymentType(job, type = 'job') {
  const nature = String(job?.job_nature || job?.employment_type || '').toLowerCase();
  if (type === 'internship' || nature.includes('intern')) return 'INTERN';
  if (nature.includes('part')) return 'PART_TIME';
  if (nature.includes('contract') || nature.includes('freelance')) return 'CONTRACTOR';
  if (nature.includes('temp')) return 'TEMPORARY';
  return 'FULL_TIME';
}

function computeValidThrough(job) {
  if (job?.expires_at) {
    const exp = new Date(job.expires_at);
    if (!isNaN(exp.getTime())) return exp.toISOString();
  }
  const created = new Date(job?.created_at || Date.now());
  const baseTime = isNaN(created.getTime()) ? Date.now() : created.getTime();
  const months = Number(job?.expire_in_months);
  const days = !isNaN(months) && months > 0 ? months * 30 : 30;
  return new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();
}

function buildBaseSalary(job) {
  if (!job) return undefined;
  if (String(job.hide_salary) === 'true' || job.hide_salary === true || job.hide_salary === 1) {
    return undefined;
  }
  const minRaw = Number(job.min_salary);
  const maxRaw = Number(job.max_salary);
  const hasMin = !isNaN(minRaw) && minRaw > 0;
  const hasMax = !isNaN(maxRaw) && maxRaw > 0;
  if (!hasMin && !hasMax) return undefined;

  const currency = job.currency || 'INR';
  const isMonthly = String(job.salary_duration || '').toLowerCase() === 'monthly';
  const unitText = isMonthly ? 'MONTH' : 'YEAR';

  const normalizeAmount = (val) => {
    if (currency === 'INR' && !isMonthly && val < 1000) {
      return Math.round(val * 100000);
    }
    return Math.round(val);
  };

  const minValue = hasMin ? normalizeAmount(minRaw) : undefined;
  const maxValue = hasMax ? normalizeAmount(maxRaw) : undefined;

  const valueObj = { '@type': 'QuantitativeValue', unitText };
  if (minValue && maxValue && minValue !== maxValue) {
    valueObj.minValue = Math.min(minValue, maxValue);
    valueObj.maxValue = Math.max(minValue, maxValue);
  } else {
    valueObj.value = minValue || maxValue;
  }

  return {
    '@type': 'MonetaryAmount',
    currency,
    value: valueObj,
  };
}

export function buildJobPostingJsonLd(job, canonicalUrl, type = 'job') {
  if (!job) return null;
  const cleanLocation = formatJobLocation(job);
  const cleanCompany = formatJobCompany(job);
  const workplace = String(job.workplace_type || job.raw_workplace_type || '').toLowerCase();
  const isRemote = workplace.includes('remote') || workplace.includes('work from home') || cleanLocation.toLowerCase() === 'remote';
  const rawHtmlDesc = processDescription(job.job_description || job.description || job.seo_description || '');
  const safeDescription = rawHtmlDesc
    ? rawHtmlDesc.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    : cleanHtmlText(job.seo_description || job.job_title);

  const baseSalary = buildBaseSalary(job);
  const expText = formatJobExperience(job);

  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: cleanHtmlText(job.job_title || job.title || 'Job Opening'),
    description: safeDescription,
    identifier: {
      '@type': 'PropertyValue',
      name: cleanCompany,
      value: String(job.id),
    },
    datePosted: job.created_at,
    validThrough: computeValidThrough(job),
    employmentType: mapEmploymentType(job, type),
    directApply: !job.apply_link,
    url: canonicalUrl,
    hiringOrganization: {
      '@type': 'Organization',
      name: cleanCompany,
      sameAs: 'https://careerfast.in',
      logo: resolveSeoMediaUrl(job.company_logo),
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: cleanLocation,
        addressCountry: 'IN',
      },
    },
  };

  if (isRemote) {
    schema.jobLocationType = 'TELECOMMUTE';
    schema.applicantLocationRequirements = {
      '@type': 'Country',
      name: 'India',
    };
  }

  if (baseSalary) {
    schema.baseSalary = baseSalary;
  }

  if (expText) {
    schema.experienceRequirements = expText;
  }

  return schema;
}

export function buildJobBreadcrumbJsonLd(job, canonicalUrl, type = 'job') {
  if (!job) return null;
  const isInternship = type === 'internship';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://careerfast.in/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: isInternship ? 'Internships' : 'Jobs',
        item: isInternship ? 'https://careerfast.in/internships' : 'https://careerfast.in/jobs',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: cleanHtmlText(job.job_title || job.title || 'Details'),
        item: canonicalUrl,
      },
    ],
  };
}

