/**
 * Unified Candidate Profile Completion Calculator
 * 
 * Standard 8 completeness sections matching Candidate Profile UI:
 * 1. Basic information (First Name, Last Name, Email, Phone)
 * 2. Profile summary (About / Summary)
 * 3. Resume (Uploaded document)
 * 4. Key skills (At least 1 skill)
 * 5. Work experience (Companies, Professional entries, or Fresher declaration)
 * 6. Education (At least 1 education entry)
 * 7. Projects (At least 1 project entry)
 * 8. Certifications (At least 1 certification entry)
 */

export const PROFILE_PROGRESS_EVENT = "profileProgressChange";

/**
 * Dispatches a window event so all active components (Header, MainProfile, HomePage)
 * update their percentage in real-time without delay.
 */
export const broadcastProfileProgress = (percentage) => {
  if (typeof window === "undefined") return;
  const num = Math.min(100, Math.max(0, Math.round(Number(percentage) || 0)));
  try {
    localStorage.setItem("profileProgress", num);
    window.dispatchEvent(new CustomEvent(PROFILE_PROGRESS_EVENT, { detail: { percentage: num } }));
  } catch (e) {
    // ignore localStorage errors in private mode
  }
};

/**
 * Returns the standardized 8 completeness checks and status for a profile.
 * Supports both API profile objects and component state.
 */
export const getProfileCompletenessChecks = (profile = {}, extra = {}) => {
  const p = profile || {};
  const e = extra || {};

  // 1. Basic information: First Name, Email, and Phone
  const firstName = String(p.first_name || p.fname || e.fname || e.first_name || "").trim();
  const email = String(p.email || e.email || "").trim();
  const rawPhone = String(p.phone || p.phoneNumber || e.phoneNumber || e.phone || "").trim();
  const phone = rawPhone && !["null", "undefined", "n/a", "-"].includes(rawPhone.toLowerCase()) ? rawPhone : "";
  const hasBasic = Boolean(firstName && email && phone);

  // 2. Profile summary / About
  const about = String(
    p.about ||
    p.displayAbout ||
    p.aboutText ||
    p.aboutTextNew ||
    p.isAbout ||
    p.headline ||
    e.displayAbout ||
    e.about ||
    ""
  ).trim();
  const hasAbout = Boolean(about && about !== "null");

  // 3. Resume
  const rawResume = p.resume !== undefined ? p.resume : e.isResume;
  const hasResume = Boolean(
    rawResume &&
    rawResume !== "null" &&
    rawResume !== "#" &&
    rawResume !== "Resume" &&
    rawResume !== false
  );

  // 4. Key skills
  const skillsList = Array.isArray(p.skills)
    ? p.skills
    : Array.isArray(e.isSkills)
      ? e.isSkills
      : [];
  const hasSkills = Boolean(skillsList && skillsList.length > 0);

  // 5. Work experience
  const companies = Array.isArray(p.companies) ? p.companies : Array.isArray(e.companies) ? e.companies : [];
  const professional = Array.isArray(p.professional) ? p.professional : [];
  const experienceList = Array.isArray(p.experience) ? p.experience : [];
  const hasCompanies = companies.some((c) => !c.isNew && (c.workingCompanyName || c.jobTitle));
  const hasProfList = professional.length > 0 || experienceList.length > 0;
  const isFresher =
    p.user_type === "Fresher" ||
    p.userType === "Fresher" ||
    p.experince_type === "Fresher" ||
    e.isWorkExp === "Fresher" ||
    e.userType === "Fresher" ||
    p.is_fresher === true;
  const totalYears = String(p.total_years || e.total_years || "").trim();
  const hasTotalYears = Boolean(totalYears && totalYears !== "0" && totalYears !== "0 years");
  const hasExperience = Boolean(hasCompanies || hasProfList || isFresher || hasTotalYears);

  // 6. Education
  const eduList = Array.isArray(p.education)
    ? p.education
    : Array.isArray(e.isEducation)
      ? e.isEducation
      : [];
  const hasEducation = Boolean(eduList && eduList.length > 0);

  // 7. Projects
  const projList = Array.isArray(p.projects)
    ? p.projects
    : Array.isArray(e.isProjects)
      ? e.isProjects
      : [];
  const hasProjects = Boolean(projList && projList.length > 0);

  // 8. Certifications
  const certList = Array.isArray(p.certifications)
    ? p.certifications
    : Array.isArray(e.certifications)
      ? e.certifications
      : [];
  const hasCertifications = Boolean(certList && certList.length > 0);

  return [
    { key: "basic", label: "Basic information", done: hasBasic },
    { key: "about", label: "Add profile summary", done: hasAbout },
    { key: "resume", label: "Upload resume", done: hasResume },
    { key: "skills", label: "Add key skills", done: hasSkills },
    { key: "experience", label: "Add work experience", done: hasExperience },
    { key: "education", label: "Add education", done: hasEducation },
    { key: "projects", label: "Add projects", done: hasProjects },
    { key: "certifications", label: "Add certifications", done: hasCertifications },
  ];
};

/**
 * Evaluates completion percentage, completed count, and missing sections.
 */
export const calculateCandidateCompletion = (profile = {}, extra = {}) => {
  const checks = getProfileCompletenessChecks(profile, extra);
  const completedCount = checks.filter((c) => c.done).length;
  const totalCount = checks.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const missing = checks.filter((c) => !c.done);

  return {
    percentage,
    completedCount,
    totalCount,
    checks,
    missing,
  };
};

export default calculateCandidateCompletion;
