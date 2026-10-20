'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
    X, Mail, Phone, MapPin, Briefcase, Clock, Calendar,
    FileText, Download, Eye, Check, Copy,
    Award, GraduationCap, Globe, Building2, Sparkles, User,
    Compass, DollarSign, Languages, Wallet
} from 'lucide-react';
import { getUserProfile } from '../ApiService/action';
import { downloadResumeFile, viewResumeFile } from '../utils/downloadResume';
import toast from 'react-hot-toast';

// Format relative and exact time
const formatDateTime = (dateString) => {
    if (!dateString) return { relative: 'Not active recently', exact: '' };
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { relative: 'Not active recently', exact: '' };

    const exact = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return { relative: 'Active now', exact };
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return { relative: `${diffMin}m ago`, exact };
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return { relative: `${diffHours}h ago`, exact };
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return { relative: 'Yesterday', exact };
    if (diffDays < 30) return { relative: `${diffDays}d ago`, exact };
    return { relative: exact, exact };
};

// Helper to safely parse strings or arrays of items
const parseList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed.filter(Boolean);
            } catch (e) {
                // fall through
            }
        }
        return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [String(val)];
};

// Safely format language objects or strings into readable text (e.g. "English (Fluent)", "Tamil")
const formatLanguageItem = (item) => {
    if (!item) return '';
    if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                return formatLanguageItem(parsed);
            } catch (e) {
                return trimmed;
            }
        }
        return trimmed;
    }
    if (typeof item === 'object' && item !== null) {
        const name = item.name || item.language || item.lang || item.label || item.value || '';
        const prof = item.proficiency || item.level || '';
        if (name && prof && prof !== name) {
            return `${name} (${prof})`;
        }
        if (name) return String(name);
        const values = Object.values(item).filter(v => typeof v === 'string' && v.trim() && v !== '[object Object]');
        if (values.length > 0) return values[0];
        return '';
    }
    return String(item);
};

// Safely parse location items without mistakenly splitting "Bangalore, India" into two tags
const parseLocationsList = (rawArrayOrString) => {
    if (!rawArrayOrString) return [];
    if (Array.isArray(rawArrayOrString)) {
        return rawArrayOrString.map(String).map(s => s.trim()).filter(Boolean);
    }
    if (typeof rawArrayOrString === 'string') {
        const trimmed = rawArrayOrString.trim();
        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed.map(String).map(s => s.trim()).filter(Boolean);
            } catch (e) {
                // fall through
            }
        }
        // If comma separated, check if every second item is a country or re-combine pairs
        const tokens = trimmed.split(',').map(s => s.trim()).filter(Boolean);
        const reconstructed = [];
        const countryRegex = /^(India|United States|USA|UK|United Kingdom|Canada|Australia|Singapore|UAE|United Arab Emirates|Germany|France|Netherlands|Remote)$/i;
        for (let i = 0; i < tokens.length; i++) {
            const curr = tokens[i];
            const next = tokens[i + 1];
            if (next && countryRegex.test(next)) {
                reconstructed.push(`${curr}, ${next}`);
                i++; // skip next country token
            } else {
                reconstructed.push(curr);
            }
        }
        return reconstructed.length > 0 ? reconstructed : tokens;
    }
    return [String(rawArrayOrString)];
};

// Safely extract candidate job preferences and compensation details
const extractPreferences = (profile) => {
    if (!profile) return {
        roles: [],
        locations: [],
        workModes: [],
        jobTypes: [],
        noticePeriod: null,
        expectedSalary: null,
        currentSalary: null,
        willingToRelocate: null
    };

    let prefObj = {};
    if (profile.preferred_job_type) {
        if (typeof profile.preferred_job_type === 'object') {
            prefObj = profile.preferred_job_type;
        } else if (typeof profile.preferred_job_type === 'string') {
            const trimmed = profile.preferred_job_type.trim();
            if (trimmed.startsWith('{')) {
                try {
                    prefObj = JSON.parse(trimmed);
                } catch (e) {
                    prefObj = { jobType: trimmed };
                }
            } else {
                prefObj = { jobType: trimmed };
            }
        }
    }

    // Prioritize array from prefObj before comma-joined database strings
    const rawRoles = (Array.isArray(prefObj.preferredRoles) && prefObj.preferredRoles.length > 0)
        ? prefObj.preferredRoles
        : (prefObj.roles || profile.preferred_roles || prefObj.preferredRoles);
    const roles = parseList(rawRoles);

    const rawLocs = (Array.isArray(prefObj.preferredLocations) && prefObj.preferredLocations.length > 0)
        ? prefObj.preferredLocations
        : (prefObj.preferredLocation || profile.preferred_locations || prefObj.locations);
    const locations = parseLocationsList(rawLocs);

    const workModes = parseList(prefObj.workMode || prefObj.workModes || profile.workplace_type || profile.work_mode);
    const jobTypes = parseList(prefObj.jobType || prefObj.jobTypes || (typeof prefObj === 'string' ? prefObj : null));

    const noticePeriod = profile.notice_period || prefObj.noticePeriod || null;
    const expectedSalary = profile.expected_salary || prefObj.expectedSalary || null;
    const currentSalary = profile.current_salary || prefObj.currentSalary || null;
    const willingToRelocate = profile.willing_to_relocate !== undefined && profile.willing_to_relocate !== null
        ? profile.willing_to_relocate
        : prefObj.relocation;

    return {
        roles,
        locations,
        workModes,
        jobTypes,
        noticePeriod,
        expectedSalary,
        currentSalary,
        willingToRelocate
    };
};

export default function CandidateProfileModal({ userId, candidateSummary, onClose }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copiedEmail, setCopiedEmail] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        if (!userId) return;

        let isMounted = true;
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const res = await getUserProfile({ user_id: userId });
                if (isMounted) {
                    setProfile(res?.data?.data || null);
                }
            } catch (err) {
                console.error('Failed to fetch candidate profile details:', err);
                if (isMounted) {
                    toast.error('Failed to load candidate details.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchDetails();
        return () => {
            isMounted = false;
        };
    }, [userId]);

    const preferences = useMemo(() => extractPreferences(profile), [profile]);

    // Parse list of skills
    const parsedSkills = useMemo(() => {
        const raw = profile?.skills || candidateSummary?.skills;
        if (!raw) return [];
        const list = parseList(raw);
        return list.map(item => {
            if (!item) return '';
            if (typeof item === 'object' && item !== null) {
                return item.skill || item.name || item.label || item.value || '';
            }
            if (typeof item === 'string') {
                const trimmed = item.trim();
                if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                    try {
                        const parsed = JSON.parse(trimmed);
                        return parsed.skill || parsed.name || parsed.label || parsed.value || trimmed;
                    } catch (e) {
                        return trimmed;
                    }
                }
                return trimmed;
            }
            return String(item);
        }).filter(Boolean);
    }, [profile?.skills, candidateSummary]);

    // Parse list of languages cleanly into readable strings (e.g. 'English', 'Tamil')
    const parsedLanguages = useMemo(() => {
        const raw = profile?.languages || candidateSummary?.languages;
        if (!raw) return [];
        const list = parseList(raw);
        return list.map(formatLanguageItem).filter(Boolean);
    }, [profile?.languages, candidateSummary]);

    // Determine whether candidate is Fresher or Experienced
    const isExperienced = useMemo(() => {
        const rawType = (profile?.experince_type || profile?.experience_type || candidateSummary?.experience || '').trim().toLowerCase();
        if (rawType.includes('fresher') || profile?.is_fresher) return false;
        if (rawType.includes('exp') || Number(profile?.total_years || 0) > 0 || (profile?.professional && profile.professional.length > 0)) {
            return true;
        }
        return false;
    }, [profile, candidateSummary]);

    // Formatted experience text matching Image 2 (e.g. '12y 6m', '2 Years', 'Fresher')
    const experienceDisplay = useMemo(() => {
        if (!isExperienced) return 'Fresher';

        const rawYears = profile?.total_years !== undefined && profile?.total_years !== null
            ? String(profile.total_years).trim()
            : (candidateSummary?.experience ? String(candidateSummary.experience).trim() : '');
        const rawMonths = profile?.total_months !== undefined && profile?.total_months !== null
            ? String(profile.total_months).trim()
            : '';

        const yearsNum = parseInt(rawYears.replace(/\D/g, ''), 10);
        const monthsNum = parseInt(rawMonths.replace(/\D/g, ''), 10);

        if (!isNaN(yearsNum) && yearsNum > 0 && !isNaN(monthsNum) && monthsNum > 0) {
            return `${yearsNum}y ${monthsNum}m`;
        }
        if (!isNaN(yearsNum) && yearsNum > 0) {
            return `${yearsNum} ${yearsNum === 1 ? 'Year' : 'Years'}`;
        }
        if (rawYears && !['null', 'undefined', 'n/a', '-', 'fresher'].includes(rawYears.toLowerCase())) {
            return rawYears;
        }
        return 'Experienced';
    }, [isExperienced, profile, candidateSummary]);

    // Formatted salary display matching Image 2 (e.g. '₹ 6 Lac', '₹ 15 LPA', 'N/A')
    const salaryDisplay = useMemo(() => {
        const rawSalary = preferences.expectedSalary || preferences.currentSalary || profile?.expected_salary || profile?.current_salary || profile?.salary || candidateSummary?.salary || candidateSummary?.expectedSalary || candidateSummary?.currentSalary;
        if (!rawSalary || ['null', 'undefined', 'n/a', '-', '', 'not specified'].includes(String(rawSalary).trim().toLowerCase())) {
            return 'N/A';
        }
        const str = String(rawSalary).trim();
        if (str.startsWith('₹') || str.startsWith('$')) return str;
        const num = Number(str.replace(/,/g, ''));
        if (!isNaN(num) && num >= 100000) {
            const lacs = (num / 100000).toFixed(num % 100000 === 0 ? 0 : 1);
            return `₹ ${lacs} Lac`;
        }
        return `₹ ${str}`;
    }, [preferences, profile, candidateSummary]);

    // Formatted notice period matching Image 2 (e.g. 'Immediate Joiner' highlighted in orange)
    const noticePeriodDisplay = useMemo(() => {
        const rawNotice = preferences.noticePeriod || profile?.notice_period || candidateSummary?.notice_period || candidateSummary?.noticePeriod;
        if (!rawNotice || ['null', 'undefined', 'n/a', '-', '', 'not specified'].includes(String(rawNotice).trim().toLowerCase())) {
            return { text: 'N/A', isImmediate: false };
        }
        const str = String(rawNotice).trim();
        const isImmediate = str.toLowerCase().includes('immediate');
        return {
            text: isImmediate ? 'Immediate Joiner' : str,
            isImmediate
        };
    }, [preferences, profile, candidateSummary]);

    // Calculate candidate profile completion percentage
    const completionPercentage = useMemo(() => {
        if (!profile && !candidateSummary) return 0;
        let score = 0;

        // 1. Basic details (Name, Email, Phone) - 20%
        const hasName = Boolean((profile?.first_name || candidateSummary?.name || '').trim());
        const hasEmail = Boolean((profile?.email || candidateSummary?.email || '').trim());
        const rawPhone = String(profile?.phone || candidateSummary?.phone || '').trim().toLowerCase();
        const hasPhone = Boolean(rawPhone && !['null', 'undefined', 'n/a', '-', ''].includes(rawPhone));
        if (hasName && hasEmail && hasPhone) score += 20;
        else if (hasName && (hasEmail || hasPhone)) score += 10;

        // 2. Profile Photo - 5%
        if (profile?.profile_image || candidateSummary?.profileImage) score += 5;

        // 3. Location / Demographics - 5%
        const loc = profile?.location || candidateSummary?.location;
        if (loc && loc !== 'Not Specified' && loc !== 'N/A') score += 5;

        // 4. Headline or Summary/Bio - 10%
        if (profile?.headline?.trim() || profile?.about?.trim()) score += 10;

        // 5. Experience / Fresher status marked - 15%
        const hasExpType = Boolean(profile?.experince_type || profile?.experience_type || profile?.is_fresher || candidateSummary?.experience);
        const hasWorkExp = profile?.professional && profile.professional.length > 0;
        if (hasWorkExp || hasExpType) score += 15;

        // 6. Education Background - 15%
        if (profile?.education && profile.education.length > 0) score += 15;

        // 7. Skills & Competencies - 15%
        if (parsedSkills.length > 0) score += 15;

        // 8. Resume Document - 15%
        const hasResume = profile?.resume && profile.resume !== 'Resume' && profile.resume !== '#' && profile.resume !== 'null';
        if (hasResume) score += 15;

        return Math.min(100, Math.max(0, score));
    }, [profile, candidateSummary, parsedSkills]);

    // Dynamic progress styling based on completion percentage
    const progressConfig = useMemo(() => {
        if (completionPercentage >= 80) {
            return {
                gradient: 'linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%)',
                textColor: 'text-emerald-600',
                label: 'All-Star Profile ⭐',
            };
        }
        if (completionPercentage >= 50) {
            return {
                gradient: 'linear-gradient(90deg, #ff5722 0%, #f97316 45%, #f59e0b 80%, #fbbf24 100%)',
                textColor: 'text-amber-600',
                label: 'Intermediate 🚀',
            };
        }
        return {
            gradient: 'linear-gradient(90deg, #e11d48 0%, #f43f5e 50%, #fb923c 100%)',
            textColor: 'text-rose-600',
            label: 'Basic Profile 🎯',
        };
    }, [completionPercentage]);

    if (!userId) return null;

    // Merge summary data for instant visual rendering while loading
    const displayName = profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Candidate'
        : candidateSummary?.name || 'Candidate Details';

    const displayEmail = profile?.email || candidateSummary?.email || '';

    // Format phone number cleanly; show 'N/A' if missing, empty, or only country code
    const getFormattedPhone = () => {
        const rawPhone = profile?.phone !== undefined && profile?.phone !== null
            ? String(profile.phone).trim()
            : (candidateSummary?.phone ? String(candidateSummary.phone).trim() : '');

        const phoneCode = profile?.phone_code
            ? String(profile.phone_code).trim()
            : (candidateSummary?.phone_code ? String(candidateSummary.phone_code).trim() : '');

        // If explicitly empty, null, undefined, n/a strings, or dash
        if (!rawPhone || ['null', 'undefined', 'n/a', '-', 'none', ''].includes(rawPhone.toLowerCase())) {
            return 'N/A';
        }

        // Extract digits only
        const phoneDigits = rawPhone.replace(/\D/g, '');
        const codeDigits = phoneCode.replace(/\D/g, '');

        // If no phone digits exist, or the digits only match the country code
        if (!phoneDigits || phoneDigits.length === 0 || phoneDigits === codeDigits) {
            return 'N/A';
        }

        // Need at least 5 digits for a valid telephone number, and not all zeroes
        if (phoneDigits.length < 5 || /^0+$/.test(phoneDigits)) {
            return 'N/A';
        }

        // If phone already starts with '+' or includes the country code
        if (rawPhone.startsWith('+')) {
            return rawPhone;
        }

        if (phoneCode) {
            return `${phoneCode} ${rawPhone}`;
        }

        return rawPhone;
    };

    const displayPhone = getFormattedPhone();
    const displayLocation = profile?.location || candidateSummary?.location || 'N/A';
    const displayImage = profile?.profile_image || candidateSummary?.profileImage || null;
    const displayStatus = profile?.is_active !== undefined
        ? (profile.is_active ? 'Active' : 'Pending')
        : (candidateSummary?.status || 'Active');

    const lastActiveInfo = formatDateTime(profile?.last_active || candidateSummary?.timeRaw);

    const handleCopyEmail = (e) => {
        e.stopPropagation();
        if (!displayEmail) return;
        navigator.clipboard.writeText(displayEmail);
        setCopiedEmail(true);
        toast.success('Email copied to clipboard!');
        setTimeout(() => setCopiedEmail(false), 2000);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 min-w-0"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header Bar */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-20 gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-blue-500/20">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[20px] font-semibold text-gray-900 leading-tight mb-0 truncate">Candidate Profile</h2>
                            <p className="text-[11px] text-gray-400 font-medium mb-0">Candidate ID: #{userId}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                        {/* Profile Completed Percentage Bar (Matching Image 2 design) */}
                        <div className="flex flex-col justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50/80 shadow-2xs w-48 sm:w-64 shrink-0">
                            <div className="flex items-center justify-between gap-1.5 leading-none">
                                <span className="text-[11px] font-bold text-slate-800">
                                    Profile Completed
                                </span>
                                <span className={`text-[10px] font-bold ${progressConfig.textColor}`}>
                                    {progressConfig.label}
                                </span>
                            </div>
                            {/* Horizontal Progress Bar matching Image 2 */}
                            <div className="w-full h-3.5 sm:h-4 bg-slate-200/80 rounded-full overflow-hidden relative shadow-inner">
                                {completionPercentage > 0 ? (
                                    <div
                                        className="h-full rounded-full transition-all duration-500 flex items-center justify-center relative shadow-xs"
                                        style={{
                                            width: `${Math.max(14, completionPercentage)}%`,
                                            background: progressConfig.gradient
                                        }}
                                    >
                                        <span className="text-[11px] font-medium text-white leading-none drop-shadow-xs px-1 select-none">
                                            {completionPercentage}%
                                        </span>
                                    </div>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <span className="text-[9px] font-bold text-slate-400 leading-none">0%</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0"
                            title="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 hide-scrollbar space-y-6 min-w-0">
                    {/* Top Hero Banner */}
                    <div className="relative rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 p-4 sm:p-5 overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 relative z-10 min-w-0">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                {displayImage ? (
                                    <img
                                        src={displayImage}
                                        alt={displayName}
                                        className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover border-3 border-white shadow-md bg-white"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-extrabold border-3 border-white shadow-md">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${displayStatus === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            </div>

                            {/* Main Details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight mb-0 truncate">
                                        {displayName}
                                    </h3>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border-1 ${displayStatus === 'Active'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                        {displayStatus}
                                    </span>
                                </div>

                                {profile?.headline && (
                                    <p className="text-[12px] font-medium text-slate-500 mb-2 truncate max-w-lg">
                                        {profile.headline}
                                        {profile?.career_level && <span> • {profile.career_level}</span>}
                                    </p>
                                )}

                                {/* Naukri-style neat metadata row with icons matching Image 2 */}
                                <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2 text-[13px] text-gray-700 pt-0.5">
                                    {/* Experience */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className="font-semibold text-gray-800">{experienceDisplay}</span>
                                    </div>

                                    {/* Salary */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Wallet className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className="font-semibold text-gray-800">{salaryDisplay}</span>
                                    </div>

                                    {/* Notice Period */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className={`font-semibold ${noticePeriodDisplay.isImmediate ? 'text-orange-600' : 'text-gray-800'}`}>
                                            {noticePeriodDisplay.text}
                                        </span>
                                    </div>

                                    {/* Location */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className="font-semibold text-gray-800 truncate max-w-[200px]">{displayLocation}</span>
                                    </div>

                                    {/* Last active info */}
                                    {lastActiveInfo.relative && (
                                        <div className="flex items-center gap-1.5 shrink-0 text-gray-400 text-[12px]">
                                            <span className="text-gray-300 hidden sm:inline">•</span>
                                            <span className="text-gray-500 font-normal">Last active: {lastActiveInfo.relative}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact & Personal Meta Quick Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Email Card */}
                        <div className="bg-slate-50/80 rounded-2xl p-2.5 flex items-center justify-between min-w-0">
                            <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[12px] font-semibold text-gray-600 mb-0">Email</p>
                                    <p className="text-[13px] font-semibold text-gray-800 truncate mb-0" title={displayEmail}>
                                        {displayEmail || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            {displayEmail && (
                                <button
                                    onClick={handleCopyEmail}
                                    title="Copy Email"
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
                                >
                                    {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                </button>
                            )}
                        </div>

                        {/* Phone Card */}
                        <div className="bg-slate-50/80 rounded-2xl p-2.5 flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0">
                                <Phone className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-gray-600 mb-0">Phone</p>
                                <p className="text-[13px] font-semibold text-gray-800 truncate mb-0">
                                    {displayPhone || 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Registered Date Card */}
                        <div className="bg-slate-50/80 rounded-2xl p-2.5 flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-purple-100/70 text-purple-600 flex items-center justify-center shrink-0">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-gray-600 mb-0">Registered Date</p>
                                <p className="text-[13px] font-semibold text-gray-800 truncate mb-0">
                                    {profile?.created_date ? new Date(profile.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Gender Card */}
                        <div className="bg-slate-50/80 rounded-2xl p-2.5 flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-gray-600 mb-0">Gender</p>
                                <p className="text-[13px] font-semibold text-gray-800 truncate mb-0">
                                    {profile?.gender ? (profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)) : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Date of Birth Card */}
                        <div className="bg-slate-50/80 rounded-2xl p-2.5 flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-cyan-100/70 text-cyan-600 flex items-center justify-center shrink-0">
                                <Clock className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-gray-600 mb-0">Date of Birth</p>
                                <p className="text-[13px] font-semibold text-gray-800 truncate mb-0">
                                    {profile?.dob ? new Date(profile.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Languages Card */}
                        <div className="bg-slate-50/80 rounded-2xl p-2.5 flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center shrink-0">
                                <Languages className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-gray-600 mb-0">Languages</p>
                                <p className="text-[13px] font-semibold text-gray-800 truncate mb-0" title={parsedLanguages.join(', ')}>
                                    {parsedLanguages.length > 0 ? parsedLanguages.join(', ') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                            <p className="text-sm font-medium text-gray-500">Loading complete candidate background...</p>
                        </div>
                    ) : (
                        <>
                            {/* Resume Document Card */}
                            <div>
                                <h4 className="text-[14px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    Resume Document
                                </h4>
                                {profile?.resume && profile.resume !== 'Resume' && profile.resume !== '#' && profile.resume !== 'null' ? (
                                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs hover:border-blue-300 transition-colors min-w-0">
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 border-1 border-red-100 flex items-center justify-center shrink-0 shadow-2xs">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <h5 className="text-[13px] font-semibold text-gray-900 mb-0.5 truncate max-w-sm">
                                                    {typeof profile.resume === 'string' && !profile.resume.startsWith('data:')
                                                        ? (profile.resume.split('/').pop().split('\\').pop() || `${displayName}_Resume.pdf`)
                                                        : `${displayName}_Resume.pdf`}
                                                </h5>
                                                <p className="text-[11px] text-gray-500 mb-0 flex items-center gap-2">
                                                    <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 border-1 border-emerald-200/60 px-1.5 py-0.5 rounded text-[10px]">
                                                        PDF DOCUMENT
                                                    </span>
                                                    <span>Verified candidate attachment</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => viewResumeFile(profile.resume)}
                                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                View
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => downloadResumeFile(profile.resume, displayName)}
                                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50/80 rounded-2xl p-3 text-center">
                                        <p className="text-xs text-slate-400 italic mb-0">No resume document uploaded by this candidate yet. (Status: N/A)</p>
                                    </div>
                                )}
                            </div>

                            {/* Preferences & Compensation Section - Always Show Details (with N/A fallback) */}
                            <div className="bg-slate-50/70 rounded-2xl p-4 space-y-4 min-w-0">
                                {/* Section Title Bar */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/70 min-w-0">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
                                            <Compass className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-[14px] font-bold text-gray-900 leading-tight mb-0">
                                                Preferences & Compensation
                                            </h4>
                                            <p className="text-[11px] text-gray-500 font-medium mb-0">
                                                Candidate availability, salary expectations, and work preferences
                                            </p>
                                        </div>
                                    </div>
                                    {preferences.jobTypes.length > 0 && (
                                        <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 bg-white border-1 border-indigo-200/80 text-indigo-700 rounded-full text-[11px] font-semibold shadow-2xs">
                                            <Briefcase className="w-3 h-3 text-indigo-500" />
                                            {preferences.jobTypes.join(', ')}
                                        </span>
                                    )}
                                </div>

                                {/* Key Attributes Grid - Showing N/A when not filled */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {/* Notice Period */}
                                    <div className="bg-white rounded-xl p-2.5 flex items-center gap-3 shadow-2xs min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-[11px] font-semibold text-gray-500 block">Notice Period</span>
                                            <span className={`text-[13px] font-semibold block truncate ${preferences.noticePeriod ? 'text-gray-900' : 'text-gray-400 font-normal'}`}>
                                                {preferences.noticePeriod || 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Expected Salary */}
                                    <div className="bg-white rounded-xl p-2.5 flex items-center gap-3 shadow-2xs min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                            <DollarSign className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-[11px] font-semibold text-gray-500 block">Expected Salary</span>
                                            <span className={`text-[13px] font-semibold block truncate ${preferences.expectedSalary ? 'text-emerald-700' : 'text-gray-400 font-normal'}`}>
                                                {preferences.expectedSalary || 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Current Salary */}
                                    <div className="bg-white rounded-xl p-2.5 flex items-center gap-3 shadow-2xs min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                            <DollarSign className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-[11px] font-semibold text-gray-500 block">Current Salary</span>
                                            <span className={`text-[13px] font-semibold block truncate ${preferences.currentSalary ? 'text-gray-900' : 'text-gray-400 font-normal'}`}>
                                                {preferences.currentSalary || 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Work Mode */}
                                    <div className="bg-white rounded-xl p-2.5 flex items-center gap-3 shadow-2xs min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-[11px] font-semibold text-gray-500 block">Work Mode</span>
                                            <span className={`text-[13px] font-semibold block truncate ${preferences.workModes.length > 0 ? 'text-gray-900' : 'text-gray-400 font-normal'}`} title={preferences.workModes.join(', ')}>
                                                {preferences.workModes.length > 0 ? preferences.workModes.join(', ') : 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Willing to Relocate */}
                                    <div className="bg-white rounded-xl p-2.5 flex items-center gap-3 shadow-2xs min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-[11px] font-semibold text-gray-500 block">Willing to Relocate</span>
                                            <span className={`text-[13px] font-semibold block truncate ${preferences.willingToRelocate !== undefined && preferences.willingToRelocate !== null ? 'text-gray-900' : 'text-gray-400 font-normal'}`}>
                                                {preferences.willingToRelocate !== undefined && preferences.willingToRelocate !== null
                                                    ? (preferences.willingToRelocate === true || preferences.willingToRelocate === 1 || preferences.willingToRelocate === 'Yes' ? 'Yes' : 'No')
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Job Type */}
                                    <div className="bg-white rounded-xl p-2.5 flex items-center gap-3 shadow-2xs min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                            <Briefcase className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-[11px] font-semibold text-gray-500 block">Job Type</span>
                                            <span className={`text-[13px] font-semibold block truncate ${preferences.jobTypes.length > 0 ? 'text-gray-900' : 'text-gray-400 font-normal'}`} title={preferences.jobTypes.join(', ')}>
                                                {preferences.jobTypes.length > 0 ? preferences.jobTypes.join(', ') : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Target Job Roles & Preferred Locations */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                    {/* Roles Card */}
                                    <div className="bg-white rounded-xl p-3.5 min-w-0 shadow-2xs">
                                        <div className="flex items-center gap-1.5 mb-2.5">
                                            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                                Target Job Roles
                                            </span>
                                            {preferences.roles.length > 0 && (
                                                <span className="ml-auto text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                    {preferences.roles.length}
                                                </span>
                                            )}
                                        </div>
                                        {preferences.roles.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {preferences.roles.map((role, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2.5 py-1 bg-blue-50/70 text-blue-800 border-1 border-blue-200/70 rounded-lg text-xs font-semibold"
                                                    >
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic mb-0">N/A — No preferred job roles specified</p>
                                        )}
                                    </div>

                                    {/* Locations Card */}
                                    <div className="bg-white rounded-xl p-3.5 min-w-0 shadow-2xs">
                                        <div className="flex items-center gap-1.5 mb-2.5">
                                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                                Preferred Locations
                                            </span>
                                            {preferences.locations.length > 0 && (
                                                <span className="ml-auto text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                                                    {preferences.locations.length}
                                                </span>
                                            )}
                                        </div>
                                        {preferences.locations.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {preferences.locations.map((loc, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-800 border-1 border-slate-200/90 rounded-lg text-xs font-medium"
                                                    >
                                                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                                        {loc}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic mb-0">N/A — No preferred locations specified</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* About Candidate Section - Always Show */}
                            <div className="min-w-0">
                                <h4 className="text-[14px] font-semibold text-gray-900 mb-2">About Candidate</h4>
                                {profile?.about ? (
                                    <p className="text-[13px] text-gray-700 leading-relaxed bg-slate-50/80 p-3.5 rounded-2xl mb-0 break-words">
                                        {profile.about}
                                    </p>
                                ) : (
                                    <div className="bg-slate-50/80 rounded-2xl p-3.5 text-center">
                                        <p className="text-xs text-slate-400 italic mb-0">N/A — Candidate has not written an about summary yet.</p>
                                    </div>
                                )}
                            </div>

                            {/* Skills & Competencies Section - Always Show */}
                            <div className="min-w-0">
                                <h4 className="text-[14px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Award className="w-4 h-4 text-indigo-600" />
                                    Skills & Competencies
                                    {parsedSkills.length > 0 && (
                                        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                            {parsedSkills.length}
                                        </span>
                                    )}
                                </h4>
                                {parsedSkills.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {parsedSkills.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-blue-50/70 text-blue-700 rounded-xl text-xs font-semibold border-1 border-blue-200/60"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50/80 rounded-2xl p-4 text-center">
                                        <p className="text-xs text-slate-400 italic mb-0">N/A — No key skills or competencies added yet.</p>
                                    </div>
                                )}
                            </div>

                            {/* Education Background Timeline - Always Show */}
                            <div className="min-w-0">
                                <h4 className="text-[14px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                                    Education Background
                                    {profile?.education?.length > 0 && (
                                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                            {profile.education.length}
                                        </span>
                                    )}
                                </h4>
                                {profile?.education && profile.education.length > 0 ? (
                                    <div className="space-y-3">
                                        {profile.education.map((edu, idx) => (
                                            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-xs relative overflow-hidden pl-4 min-w-0">
                                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-r"></div>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1 min-w-0">
                                                    <h5 className="font-semibold text-[14px] text-gray-900 mb-0 truncate">
                                                        {edu.qualification || 'Qualification'} {edu.course ? `- ${edu.course}` : ''}
                                                    </h5>
                                                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1 shrink-0">
                                                        <Calendar className="w-3 h-3" />
                                                        {edu.start_date ? new Date(edu.start_date).getFullYear() : ''}
                                                        {edu.start_date || edu.end_date ? ' – ' : ''}
                                                        {edu.end_date ? new Date(edu.end_date).getFullYear() : (edu.start_date ? 'Present' : '')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mb-1 truncate">{edu.college || 'College / University N/A'}</p>
                                                {(edu.cgpa || edu.percentage) && (
                                                    <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border-1 border-emerald-100">
                                                        Score: {edu.cgpa ? `${edu.cgpa} CGPA` : `${edu.percentage}%`}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50/80 rounded-2xl p-4 text-center">
                                        <p className="text-xs text-slate-400 italic mb-0">N/A — No educational qualifications added yet.</p>
                                    </div>
                                )}
                            </div>

                            {/* Professional Experience Timeline - Always Show */}
                            <div className="min-w-0">
                                <h4 className="text-[14px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                    Professional Experience
                                    {profile?.professional?.length > 0 && (
                                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                            {profile.professional.length}
                                        </span>
                                    )}
                                </h4>
                                {profile?.professional && profile.professional.length > 0 ? (
                                    <div className="space-y-3">
                                        {profile.professional.map((exp, idx) => (
                                            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs relative overflow-hidden pl-5 min-w-0">
                                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-r"></div>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1 min-w-0">
                                                    <h5 className="font-semibold text-[14px] text-gray-900 mb-0 truncate">{exp.job_title || 'Role / Title'}</h5>
                                                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1 shrink-0">
                                                        <Calendar className="w-3 h-3" />
                                                        {exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                                                        {' – '}
                                                        {exp.currently_working ? 'Present' : (exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '')}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-semibold text-gray-700 mb-1 truncate">{exp.company_name || 'Company N/A'} {exp.location ? `• ${exp.location}` : ''}</p>
                                                {exp.description && (
                                                    <p className="text-[12px] text-gray-500 mt-2 mb-0 leading-relaxed break-words">{exp.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50/80 rounded-2xl p-4 text-center">
                                        <p className="text-xs text-slate-400 italic mb-0">
                                            {isExperienced ? 'N/A — No work history details added yet.' : 'Fresher — No prior professional employment history.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-xs text-gray-400 font-medium">Careerfast Admin Portal</span>
                </div>
            </div>
        </div>
    );
}
