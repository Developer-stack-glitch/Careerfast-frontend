'use client';
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@/routing-shim";
import { getUserProfile } from "../../ApiService/action";
import { calculateCandidateCompletion, broadcastProfileProgress, PROFILE_PROGRESS_EVENT } from "../../utils/profileCompletion";
import "./CriticalProfileAlert.css";

const CACHE_KEY = "cachedCandidateProfileStats";
const CACHE_TTL = 60000; // 1 minute in ms

export default function CriticalProfileAlert({
  variant = "job-details", // "job-details" | "job-filter" | "applied-jobs" | "watchlist"
  customTitle,
  customSubtitle,
  customCtaText,
  className = "",
  style = {}
}) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [stats, setStats] = useState(() => {
    if (typeof window === "undefined") {
      return { isCandidate: false, completionPercentage: 100, missingItems: [], userName: "", userInitial: "C" };
    }

    try {
      // Check dismissal state in sessionStorage
      const isDismissed = sessionStorage.getItem(`cpa_dismissed_${variant}`);
      if (isDismissed === "true") {
        return { isCandidate: false, completionPercentage: 100, missingItems: [], userName: "", userInitial: "C", dismissed: true };
      }

      // Check login details
      const rawUser = localStorage.getItem("loginDetails");
      if (!rawUser) {
        return { isCandidate: false, completionPercentage: 100, missingItems: [], userName: "", userInitial: "C" };
      }

      const userObj = JSON.parse(rawUser);
      const isCand = !userObj.role_id || Number(userObj.role_id) === 2;
      if (!isCand) {
        return { isCandidate: false, completionPercentage: 100, missingItems: [], userName: "", userInitial: "C" };
      }

      const name = userObj.first_name || userObj.name || "";
      const initial = name ? name.trim().charAt(0).toUpperCase() : "C";

      // Read from cached stats if available
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCached = JSON.parse(cached);
        if (parsedCached && parsedCached.userId === userObj.id) {
          return {
            isCandidate: true,
            completionPercentage: parsedCached.percentage,
            missingItems: parsedCached.missingItems || [],
            userName: name,
            userInitial: initial,
            cachedAt: parsedCached.timestamp
          };
        }
      }

      // Fallback to legacy progress key if present
      const legacyProgress = localStorage.getItem("profileProgress");
      return {
        isCandidate: true,
        completionPercentage: legacyProgress !== null ? Number(legacyProgress) : null,
        missingItems: [],
        userName: name,
        userInitial: initial
      };
    } catch {
      return { isCandidate: false, completionPercentage: 100, missingItems: [], userName: "", userInitial: "C" };
    }
  });

  const fetchProfileDetails = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      const rawUser = localStorage.getItem("loginDetails");
      const token = localStorage.getItem("AccessToken");
      if (!rawUser || !token) return;

      const userObj = JSON.parse(rawUser);
      const isCand = !userObj.role_id || Number(userObj.role_id) === 2;
      if (!isCand) return;

      const res = await getUserProfile({ user_id: userObj.id });
      const rawData = res?.data?.data || {};
      const prof = Array.isArray(rawData) ? rawData[0] : rawData;

      const { percentage, missing } = calculateCandidateCompletion(prof, userObj);
      const firstName = prof?.first_name || userObj.first_name || "";
      const initial = firstName ? firstName.trim().charAt(0).toUpperCase() : "C";

      broadcastProfileProgress(percentage);
      localStorage.setItem("profileProgress", percentage);
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        userId: userObj.id,
        percentage,
        missingItems: missing,
        timestamp: Date.now()
      }));

      setStats({
        isCandidate: true,
        completionPercentage: percentage,
        missingItems: missing,
        userName: firstName,
        userInitial: initial,
        updatedAt: prof?.updated_at || prof?.updatedAt || null
      });
    } catch {
      // Keep existing state on error
    }
  }, []);

  useEffect(() => {
    // Check if dismissed in sessionStorage
    try {
      if (sessionStorage.getItem(`cpa_dismissed_${variant}`) === "true") {
        setDismissed(true);
        return;
      }
    } catch { }

    // If cache is empty or stale, re-fetch
    if (!stats.cachedAt || Date.now() - stats.cachedAt > CACHE_TTL) {
      fetchProfileDetails();
    }

    const handleProgress = (e) => {
      if (e?.detail?.percentage !== undefined) {
        setStats((prev) => ({
          ...prev,
          completionPercentage: Number(e.detail.percentage),
        }));
      }
    };
    window.addEventListener(PROFILE_PROGRESS_EVENT, handleProgress);
    return () => window.removeEventListener(PROFILE_PROGRESS_EVENT, handleProgress);
  }, [variant, stats.cachedAt, fetchProfileDetails]);

  // const handleDismiss = () => {
  //   setDismissed(true);
  //   try {
  //     sessionStorage.setItem(`cpa_dismissed_${variant}`, "true");
  //   } catch { }
  // };

  const handleCompleteProfile = () => {
    navigate("/candidate-profile/mainprofile");
  };

  // Only show to candidates with incomplete profiles who haven't dismissed
  if (
    dismissed ||
    stats.dismissed ||
    !stats.isCandidate ||
    stats.completionPercentage === null ||
    stats.completionPercentage >= 100
  ) {
    return null;
  }

  const missingLabels = stats.missingItems.slice(0, 3).map(m => m.label).join(", ");
  const extraCount = stats.missingItems.length > 3 ? ` +${stats.missingItems.length - 3} more` : "";
  const missingText = missingLabels ? `Missing: ${missingLabels}${extraCount}` : "Missing critical profile sections";

  // Content configurations per variant
  const contentConfig = {
    "job-details": {
      title: customTitle || (
        <>
          Recruiters can't find you, due to <span className="cpa-text-danger">missing critical details</span>
        </>
      ),
      subtitle: customSubtitle || "10k seekers with complete profile details were contacted this week. It takes under a minute.",
      meta: (
        <span className="cpa-meta-text">
          Profile: <strong>{stats.completionPercentage}% complete</strong> • {missingText}
        </span>
      ),
      ctaText: customCtaText || "Complete Profile",
      badgeText: "CRITICAL"
    },
    "job-filter": {
      title: customTitle || (
        <>
          Boost your job search: Recruiters overlook profiles with <span className="cpa-text-danger">missing details</span>
        </>
      ),
      subtitle: customSubtitle || "500+ active recruiters are hiring right now. Complete your profile to appear at the top of recruiter searches.",
      meta: (
        <span className="cpa-meta-text">
          <strong>{stats.completionPercentage}% complete</strong> • {missingText}
        </span>
      ),
      ctaText: customCtaText || "Complete Profile",
      badgeText: "SEARCH BOOST"
    },
    "applied-jobs": {
      title: customTitle || (
        <>
          Your applications are live — <span className="cpa-text-danger">increase your callback rate</span>
        </>
      ),
      subtitle: customSubtitle || "HRs review candidate profiles before scheduling interviews. Incomplete profiles are 3x less likely to be shortlisted.",
      meta: (
        <span className="cpa-meta-text">
          Status: <strong>{stats.completionPercentage}% complete</strong> • {missingText}
        </span>
      ),
      ctaText: customCtaText || "Update Profile Now",
      badgeText: "URGENT REVIEW"
    },
    "watchlist": {
      title: customTitle || (
        <>
          Before you apply: You are <span className="cpa-text-danger">missing critical details</span>
        </>
      ),
      subtitle: customSubtitle || "Ensure your resume & experience are complete so you can 1-click apply when you're ready.",
      meta: (
        <span className="cpa-meta-text">
          Readiness: <strong>{stats.completionPercentage}%</strong> • {missingText}
        </span>
      ),
      ctaText: customCtaText || "Complete Profile",
      badgeText: "ACTION REQUIRED"
    }
  };

  const current = contentConfig[variant] || contentConfig["job-details"];

  return (
    <div
      className={`cpa-root cpa-variant-${variant} ${className}`}
      style={style}
      role="alert"
      aria-live="polite"
    >
      <div className="cpa-card-inner">
        {/* Left Side: Avatar with Warning Badge + Text */}
        <div className="cpa-left-section">
          {/* Avatar with Warning Icon Overlay */}
          <div className="cpa-avatar-container">
            <div className="cpa-avatar-circle" title={stats.userName || "Candidate"}>
              {stats.userInitial}
            </div>
            <div className="cpa-warning-badge" title="Profile Details Recommended">
              <svg
                className="cpa-warning-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" fill="#e54646ff" />
                <path
                  d="M12 7V13"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle
                  cx="12"
                  cy="16.5"
                  r="1.25"
                  fill="#FFFFFF"
                />
              </svg>
            </div>
          </div>

          {/* Text block */}
          <div className="cpa-text-block">
            <div className="cpa-title">
              {current.title}
            </div>
            <div className="cpa-subtitle">
              {current.subtitle}
            </div>
            <div className="cpa-meta-row">
              {current.meta}
            </div>
          </div>
        </div>

        {/* Right Side: Progress Meter, CTA, Dismiss */}
        <div className="cpa-right-section">
          {/* Optional Mini Progress Bar for Job-Filter/Applied-Jobs */}
          {(variant === "job-filter" || variant === "applied-jobs") && (
            <div className="cpa-progress-box">
              <div className="cpa-progress-track">
                <div
                  className="cpa-progress-bar"
                  style={{ width: `${stats.completionPercentage}%` }}
                />
              </div>
              <span className="cpa-progress-num">{stats.completionPercentage}%</span>
            </div>
          )}

          {/* Complete Profile CTA button */}
          <button
            type="button"
            className="cpa-cta-btn"
            onClick={handleCompleteProfile}
          >
            <span>{current.ctaText}</span>
            <svg
              className="cpa-btn-arrow"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 5L16 12L9 19"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Dismiss ✕ Button */}
          {/* <button
            type="button"
            className="cpa-dismiss-btn"
            onClick={handleDismiss}
            title="Dismiss notice for this session"
            aria-label="Dismiss notice"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button> */}
        </div>
      </div>
    </div>
  );
}
