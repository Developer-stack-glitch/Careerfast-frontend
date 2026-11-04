/**
 * Utility for managing user's recent job searches dynamically in CareerFast
 */
import { getJobPosts } from "../ApiService/action";

const RECENT_SEARCHES_KEY = "careerfast_recent_searches";
const MAX_RECENT_SEARCHES = 6;
export const RECENT_SEARCHES_EVENT = "careerfast_recent_searches_updated";

/**
 * Get all saved recent searches from localStorage
 */
export const getRecentSearches = () => {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("Error reading recent searches from localStorage:", e);
        return [];
    }
};

/**
 * Build human-readable display label from search criteria
 */
export const buildSearchLabel = ({ skills = "", location = "", experience = "", job_nature = "" }) => {
    const cleanSkills = (skills || "").trim();
    const cleanLoc = (location || "").trim();
    const cleanExp = experience !== null && experience !== undefined ? String(experience).trim() : "";
    const cleanNature = (job_nature || "").trim();
    const isInternship = cleanExp.toLowerCase() === "internship" || cleanNature.toLowerCase() === "internship";

    if (cleanSkills && cleanLoc) {
        return `${cleanSkills}, ${cleanLoc}`;
    }

    if (cleanSkills) {
        if (isInternship) return `internship, ${cleanSkills}`;
        if (cleanExp) {
            const expLabel = cleanExp === "0" ? "Fresher" : `${cleanExp} ${cleanExp === "1" ? "Year" : "Years"}`;
            return `${cleanSkills} (${expLabel})`;
        }
        return cleanSkills;
    }

    if (cleanLoc) {
        if (isInternship) return `internship, ${cleanLoc}`;
        return `jobs, ${cleanLoc}`;
    }

    if (cleanExp) {
        if (isInternship) return "internship";
        if (cleanExp === "0") return "jobs, Fresher";
        return `jobs (${cleanExp} Yrs Exp)`;
    }

    if (cleanNature) {
        return cleanNature.toLowerCase() === "internship" ? "internship" : "jobs";
    }

    return "Recent Search";
};

/**
 * Build job-filter URL from search criteria
 */
export const buildSearchUrl = ({ skills = "", location = "", experience = "", job_nature = "" }) => {
    const cleanSkills = (skills || "").trim();
    const cleanLoc = (location || "").trim();
    const cleanExp = experience !== null && experience !== undefined ? String(experience).trim() : "";
    const cleanNature = (job_nature || "").trim();

    const queryParams = [];
    if (cleanSkills) queryParams.push(`q=${encodeURIComponent(cleanSkills)}`);
    if (cleanLoc) {
        cleanLoc.split(",").map(l => l.trim()).filter(Boolean).forEach(l => {
            queryParams.push(`l=${encodeURIComponent(l)}`);
        });
    }
    if (cleanExp) {
        if (cleanExp.toLowerCase() === "internship") {
            queryParams.push(`job_nature=Internship`);
        } else {
            queryParams.push(`experience=${encodeURIComponent(cleanExp)}`);
        }
    } else if (cleanNature) {
        queryParams.push(`job_nature=${encodeURIComponent(cleanNature)}`);
    }

    return `/job-filter?${queryParams.join("&")}`;
};

/**
 * Fetch live matching jobs count for a search item
 */
export const fetchLiveCountForSearch = async (item) => {
    if (!item) return null;
    try {
        const payload = { limit: 1 };
        if (item.skills && item.skills.trim()) {
            payload.searchTerm = item.skills.trim();
        }
        if (item.location && item.location.trim()) {
            const locArray = item.location.split(",").map(l => l.trim()).filter(Boolean);
            if (locArray.length > 0) payload.work_location = locArray;
        }
        if (item.experience !== null && item.experience !== undefined && item.experience !== "") {
            const expStr = String(item.experience).toLowerCase();
            if (expStr === "internship") {
                payload.job_nature = "Internship";
            } else if (item.experience === 0 || item.experience === "0") {
                payload.experience_type = "Fresher";
            }
        }
        if (item.job_nature) {
            payload.job_nature = item.job_nature;
        }

        const res = await getJobPosts(payload);
        const total = res?.data?.data?.meta?.total ?? res?.data?.meta?.total ?? res?.data?.total;
        if (typeof total === "number") {
            return total;
        }
        return null;
    } catch (e) {
        console.warn("Could not fetch live count for search:", item.label, e);
        return null;
    }
};

/**
 * Save a new search criteria to recent searches dynamically
 */
export const saveRecentSearch = ({ skills = "", location = "", experience = "", job_nature = "", count = null }) => {
    if (typeof window === "undefined") return [];

    const cleanSkills = (skills || "").trim();
    const cleanLoc = (location || "").trim();
    const cleanExp = experience !== null && experience !== undefined ? String(experience).trim() : "";
    const cleanNature = (job_nature || "").trim();

    if (!cleanSkills && !cleanLoc && !cleanExp && !cleanNature) return [];

    const label = buildSearchLabel({ skills: cleanSkills, location: cleanLoc, experience: cleanExp, job_nature: cleanNature });
    const url = buildSearchUrl({ skills: cleanSkills, location: cleanLoc, experience: cleanExp, job_nature: cleanNature });

    try {
        const existing = getRecentSearches();

        // Deduplicate against existing by label (case-insensitive) or url
        const normLabel = label.toLowerCase();
        const filtered = existing.filter(item => {
            const itemLabel = (item.label || "").toLowerCase();
            return itemLabel !== normLabel && item.url !== url;
        });

        const newEntry = {
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            label,
            skills: cleanSkills,
            location: cleanLoc,
            experience: cleanExp,
            job_nature: cleanNature,
            url,
            count: typeof count === "number" ? count : null,
            isNew: true,
            isUserRecent: true,
            timestamp: Date.now()
        };

        const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));

        window.dispatchEvent(new CustomEvent(RECENT_SEARCHES_EVENT, { detail: updated }));

        // Asynchronously update count if not provided
        if (newEntry.count === null) {
            fetchLiveCountForSearch(newEntry).then(liveCount => {
                if (typeof liveCount === "number") {
                    updateRecentSearchCount(newEntry.id, liveCount);
                }
            }).catch(() => {});
        }

        return updated;
    } catch (e) {
        console.error("Error saving recent search:", e);
        return [];
    }
};

/**
 * Update the count of an existing recent search entry
 */
export const updateRecentSearchCount = (id, count) => {
    if (typeof window === "undefined" || !id || typeof count !== "number") return;
    try {
        const existing = getRecentSearches();
        let changed = false;
        const updated = existing.map(item => {
            if (item.id === id && item.count !== count) {
                changed = true;
                return { ...item, count };
            }
            return item;
        });
        if (changed) {
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent(RECENT_SEARCHES_EVENT, { detail: updated }));
        }
    } catch (e) {
        console.error("Error updating recent search count:", e);
    }
};

/**
 * Remove an individual search from recent searches
 */
export const removeRecentSearch = (idOrLabel) => {
    if (typeof window === "undefined" || !idOrLabel) return [];
    try {
        const existing = getRecentSearches();
        const updated = existing.filter(item => item.id !== idOrLabel && item.label !== idOrLabel);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent(RECENT_SEARCHES_EVENT, { detail: updated }));
        return updated;
    } catch (e) {
        console.error("Error removing recent search:", e);
        return [];
    }
};

/**
 * Clear all recent searches
 */
export const clearRecentSearches = () => {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(RECENT_SEARCHES_KEY);
        window.dispatchEvent(new CustomEvent(RECENT_SEARCHES_EVENT, { detail: [] }));
    } catch (e) {
        console.error("Error clearing recent searches:", e);
    }
};

