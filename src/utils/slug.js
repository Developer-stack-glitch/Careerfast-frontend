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
    if (Array.isArray(val)) return val.join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
    try {
      if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
      }
    } catch (e) { }
    return String(val).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
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
  ].filter(Boolean);

  return parts
    .join("-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const extractSkillsFromDescription = (html) => {
  if (!html) return [];
  const str = String(html);
  const keySkillsMatch = str.match(/(?:<p[^>]*>)?\s*(?:<(?:strong|b)[^>]*>)?\s*Key\s*Skills(?::)?\s*(?:<\/(?:strong|b)>)?\s*(?:<\/p>)?\s*(?:<p[^>]*>)?\s*([A-Za-z0-9\s,\(\)\/\-\+\#\.\&]+?)(?:<\/p>)?\s*(?=(?:<p[^>]*>)?\s*(?:<(?:strong|b)[^>]*>)?\s*(?:(?:(?<!Job\s)Role)|Industry\s*Type|Department|Employment\s*Type|About\s*Company|Company\s*Info)|$)/is);
  if (keySkillsMatch) {
    const rawSkills = keySkillsMatch[1].replace(/<[^>]*>/g, '').trim();
    if (rawSkills.includes(',')) {
      return rawSkills.split(',').map(s => s.trim().replace(/\.$/, '')).filter(Boolean);
    }
  }
  return [];
};

export const processDescription = (html) => {
  if (!html) return "";
  let str = String(html)
    .replace(/\u00AD/g, '')
    .replace(/\u200B/g, '')
    .trim();

  // 1. If plain text (no HTML tags), convert newlines to paragraphs and detect bullet lines
  if (!/<[a-z][\s\S]*>/i.test(str)) {
    const lines = str.split(/\r?\n/).map(l => l.trim());
    const formatted = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) {
        if (inList) {
          formatted.push('</ul>');
          inList = false;
        }
        continue;
      }

      // Check if bullet point (e.g. •, -, *, etc.)
      const bulletMatch = line.match(/^[•\u2022\u25cf\*\-]\s*(.*)$/);
      if (bulletMatch) {
        if (!inList) {
          formatted.push('<ul>');
          inList = true;
        }
        formatted.push(`<li>${bulletMatch[1]}</li>`);
      } else {
        if (inList) {
          formatted.push('</ul>');
          inList = false;
        }
        formatted.push(`<p>${line}</p>`);
      }
    }
    if (inList) {
      formatted.push('</ul>');
    }
    str = formatted.join("");
  } else {
    // If HTML, convert empty paragraphs to <p><br /></p>
    str = str.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '<p><br /></p>');

    // Convert consecutive <p>• ...</p> to clean <ul><li>...</li></ul>
    str = str.replace(/(?:<p[^>]*>\s*[•\u2022\u25cf\*\-]\s*([\s\S]*?)<\/p>\s*)+/gi, (match) => {
      const items = match.match(/<p[^>]*>\s*[•\u2022\u25cf\*\-]\s*([\s\S]*?)<\/p>/gi) || [];
      const lis = items.map(it => {
        const content = it.replace(/^<p[^>]*>\s*[•\u2022\u25cf\*\-]\s*/i, '').replace(/<\/p>$/i, '');
        return `<li>${content}</li>`;
      }).join("");
      return `<ul>${lis}</ul>`;
    });
  }

  // 2. Remove leading redundant "Job Description" header if already present
  str = str.replace(/^\s*(?:<p[^>]*>)?\s*(?:<(?:strong|b|h\d)[^>]*>)?\s*Job\s*Description(?::)?\s*(?:<\/(?:strong|b|h\d)>)?\s*(?:<\/p>)?\s*/i, '');

  // 3. Clean raw embedded Key Skills text block (already extracted to pills)
  const keySkillsMatch = str.match(/(?:<p[^>]*>)?\s*(?:<(?:strong|b)[^>]*>)?\s*Key\s*Skills(?::)?\s*(?:<\/(?:strong|b)>)?\s*(?:<\/p>)?\s*(?:<p[^>]*>)?\s*([A-Za-z0-9\s,\(\)\/\-\+\#\.\&]+?)(?:<\/p>)?\s*(?=(?:<p[^>]*>)?\s*(?:<(?:strong|b)[^>]*>)?\s*(?:(?:(?<!Job\s)Role)|Industry\s*Type|Department|Employment\s*Type|About\s*Company|Company\s*Info)|$)/is);
  if (keySkillsMatch && keySkillsMatch[1].includes(',')) {
    str = str.replace(keySkillsMatch[0], '');
  }

  // 4. Safe cleanup of trailing Naukri metadata footer:
  // Only match standalone footer lines like <p><strong>Role:</strong> ...</p> where "Role" is the exact standalone field name (not "About the Role", etc.)
  // AND it must be followed by at least another footer line (Industry Type or Role Category or Employment Type) towards the very end.
  str = str.replace(/(?:<p[^>]*>)?\s*(?:<(?:strong|b)[^>]*>)?\s*(?:^|(?<=>))\s*Role\s*:\s*[^<]+<\/(?:strong|b|p)>[\s\S]*?(?:Industry\s*Type|Role\s*Category|Employment\s*Type)\s*:[\s\S]*$/i, '');

  // 5. Enhance standard headings into neat subheadings
  str = str.replace(/<p[^>]*>\s*(?:<(?:strong|b)[^>]*>)?\s*(Key\s*Responsibilities|Skills\s*Required|Requirements|Qualifications|What\s*You'll\s*Do|Role\s*Overview|Job\s*Overview|About\s*The\s*Role|Key\s*Skills\s*and\s*Requirements)(?::)?\s*(?:<\/(?:strong|b)>)?\s*<\/p>/gi,
    '<h4 class="njd-subheading">$1</h4>');

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

export const formatExperienceDisplay = (expList, experienceType) => {
  let raw = expList;
  if (typeof raw === 'string' && (raw.startsWith('[') || raw.startsWith('{'))) {
    try {
      raw = JSON.parse(raw);
    } catch (_) {}
  }

  let text = "";
  if (Array.isArray(raw)) {
    const cleaned = raw.filter(x => x !== null && x !== undefined && String(x).trim() !== "" && String(x).trim().toLowerCase() !== "all");
    if (cleaned.length > 0) {
      text = cleaned.join(", ");
    }
  } else if (raw && String(raw).trim() !== "" && String(raw).trim().toLowerCase() !== "all") {
    text = String(raw).trim();
  }

  const expTypeLower = String(experienceType || "").trim().toLowerCase();

  // If text is empty or missing, fallback to experienceType or Fresher
  if (!text) {
    if (expTypeLower === "fresher") return "Fresher";
    if (experienceType && String(experienceType).trim() !== "") return String(experienceType).trim();
    return "Fresher";
  }

  const cleanText = text.replace(/^[\[\]"'\s]+|[\[\]"'\s]+$/g, '').trim();

  // If already "Fresher"
  if (/^fresher$/i.test(cleanText)) {
    return "Fresher";
  }

  // Check for 0-0 or 0 - 0 (e.g. "0-0 Years", "0 - 0 Years", "0-0", "0 - 0", "0-0 yrs")
  if (/^0\s*[-–—to]\s*0(\s*(?:yrs|years?))?$/i.test(cleanText)) {
    return "Fresher";
  }

  // Check for single "0", "0 Years", "0 Year", "0 yrs"
  if (/^0\s*(?:yrs|years?)?$/i.test(cleanText)) {
    return "Fresher";
  }

  // Check for identical range like "2-2 Years" -> "2 Years"
  const sameRangeMatch = cleanText.match(/^(\d+)\s*[-–—to]\s*\1\s*(?:yrs|years?)?$/i);
  if (sameRangeMatch) {
    const n = Number(sameRangeMatch[1]);
    if (n === 0) return "Fresher";
    return `${n} Year${n !== 1 ? 's' : ''}`;
  }

  return cleanText;
};

