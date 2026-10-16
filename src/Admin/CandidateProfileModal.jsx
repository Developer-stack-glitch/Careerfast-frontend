'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
    X, Mail, Phone, MapPin, Briefcase, Clock, Calendar,
    FileText, Download, Eye, Check, Copy, ExternalLink,
    Award, GraduationCap, Globe, Building2, Sparkles, User, AlertCircle,
    Compass, DollarSign, Timer
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
    const displayLocation = profile?.location || candidateSummary?.location || 'Not Specified';
    const displayImage = profile?.profile_image || candidateSummary?.profileImage || null;
    const displayRole = profile?.role_name || profile?.headline || 'CANDIDATE';
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

    const hasPreferencesOrComp = Boolean(
        preferences.noticePeriod ||
        preferences.expectedSalary ||
        preferences.currentSalary ||
        preferences.jobTypes.length > 0 ||
        preferences.workModes.length > 0 ||
        preferences.roles.length > 0 ||
        preferences.locations.length > 0 ||
        (preferences.willingToRelocate !== undefined && preferences.willingToRelocate !== null)
    );

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
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                            <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[16px] font-bold text-gray-900 leading-tight mb-0 truncate">Candidate Profile</h2>
                            <p className="text-[11px] text-gray-400 font-medium mb-0">Candidate ID: #{userId}</p>
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

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto overflow-x-hidden flex-1 hide-scrollbar space-y-6 min-w-0">
                    {/* Top Hero Banner */}
                    <div className="relative rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 p-3 sm:p-5 overflow-hidden">
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
                                <div className="flex flex-wrap items-center gap-2 mb-1">
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
                                <p className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-1.5 truncate">
                                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{displayRole}</span>
                                    {profile?.career_level && (
                                        <span className="text-gray-400 font-normal truncate">• {profile.career_level}</span>
                                    )}
                                </p>

                                {/* Location & Experience tags */}
                                <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-600">
                                    <span className="flex items-center gap-1 truncate">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <span className="truncate">{displayLocation}</span>
                                    </span>
                                    {profile?.experince_type && (
                                        <span className="flex items-center gap-1">
                                            <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span>{profile.experince_type} {profile.total_years ? `(${profile.total_years} yrs)` : ''}</span>
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <span>Last active: {lastActiveInfo.relative}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Resume Quick Action */}
                            {profile?.resume && profile.resume !== 'Resume' && profile.resume !== '#' && profile.resume !== 'null' && (
                                <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => viewResumeFile(profile.resume)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-blue-700 border-1 border-blue-200/90 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer w-full"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        View Resume
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => downloadResumeFile(profile.resume, displayName)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer w-full"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Download
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact & Meta Quick Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="bg-slate-50/80 rounded-2xl p-3 flex items-center justify-between min-w-0">
                            <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[12px] font-semibold text-gray-600 mb-0">Email</p>
                                    <p className="text-[13px] font-semibold text-gray-800 truncate mb-0" title={displayEmail}>
                                        {displayEmail || 'Not Provided'}
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

                        <div className="bg-slate-50/80 rounded-2xl p-3 flex items-center gap-3 min-w-0">
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

                        <div className="bg-slate-50/80 rounded-2xl p-3 flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-purple-100/70 text-purple-600 flex items-center justify-center shrink-0">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-gray-600 mb-0">Registered Date</p>
                                <p className="text-[13px] font-semibold text-gray-800 truncate mb-0">
                                    {profile?.created_date ? new Date(profile.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
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
                                    <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs hover:border-blue-300 transition-colors min-w-0">
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
                                    <div className="bg-slate-50 rounded-2xl p-3 text-center">
                                        <p className="text-xs text-gray-400 mb-0 italic">No resume document uploaded by this candidate yet.</p>
                                    </div>
                                )}
                            </div>

                            {/* Preferences & Compensation Section */}
                            {hasPreferencesOrComp && (
                                <div className="bg-slate-50/60 rounded-2xl p-3 space-y-4 min-w-0">
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
                                                    Candidate availability, salary targets, and working conditions
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

                                    {/* Key Attributes Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                        {preferences.noticePeriod && (
                                            <div className="bg-white rounded-xl p-2 flex items-center gap-3 shadow-2xs hover:border-slate-300 transition-colors min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-[13px] font-semibold text-gray-600 block">Notice Period</span>
                                                    <span className="text-[14px] font-semibold text-gray-900 block truncate">{preferences.noticePeriod}</span>
                                                </div>
                                            </div>
                                        )}

                                        {preferences.expectedSalary && (
                                            <div className="bg-white rounded-xl p-2 flex items-center gap-3 shadow-2xs hover:border-slate-300 transition-colors min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                    <DollarSign className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-[13px] font-semibold text-gray-600 block">Expected Salary</span>
                                                    <span className="text-[13px] font-bold text-emerald-700 block truncate">{preferences.expectedSalary}</span>
                                                </div>
                                            </div>
                                        )}

                                        {preferences.currentSalary && (
                                            <div className="bg-white rounded-xl p-2 flex items-center gap-3 shadow-2xs hover:border-slate-300 transition-colors min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                                    <DollarSign className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-[13px] font-semibold text-gray-600 block">Current Salary</span>
                                                    <span className="text-[14px] font-semibold text-gray-900 block truncate">{preferences.currentSalary}</span>
                                                </div>
                                            </div>
                                        )}

                                        {preferences.workModes.length > 0 && (
                                            <div className="bg-white rounded-xl p-2 flex items-center gap-3 shadow-2xs hover:border-slate-300 transition-colors min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-[13px] font-semibold text-gray-600 block">Work Mode</span>
                                                    <span className="text-[14px] font-semibold text-gray-900 block truncate" title={preferences.workModes.join(', ')}>
                                                        {preferences.workModes.join(', ')}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {preferences.willingToRelocate !== undefined && preferences.willingToRelocate !== null && (
                                            <div className="bg-white rounded-xl p-2 flex items-center gap-3 shadow-2xs hover:border-slate-300 transition-colors min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                                                    <Globe className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-[13px] font-semibold text-gray-600 block">Willing to Relocate</span>
                                                    <span className="text-[14px] font-semibold text-gray-900 block truncate">
                                                        {preferences.willingToRelocate === true || preferences.willingToRelocate === 1 || preferences.willingToRelocate === 'Yes' ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {preferences.jobTypes.length > 0 && (
                                            <div className="sm:hidden bg-white border border-slate-200/70 rounded-xl p-3 flex items-center gap-3 shadow-2xs min-w-0">
                                                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                                    <Briefcase className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-[13px] font-semibold text-gray-600 block">Job Type</span>
                                                    <span className="text-[14px] font-semibold text-gray-900 block truncate">
                                                        {preferences.jobTypes.join(', ')}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Roles & Locations Side-by-Side Cards */}
                                    {(preferences.roles.length > 0 || preferences.locations.length > 0) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                            {preferences.roles.length > 0 && (
                                                <div className="bg-white rounded-xl p-4 min-w-0 shadow-2xs">
                                                    <div className="flex items-center gap-1.5 mb-2.5">
                                                        <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                                            Target Job Roles
                                                        </span>
                                                        <span className="ml-auto text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                            {preferences.roles.length}
                                                        </span>
                                                    </div>
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
                                                </div>
                                            )}

                                            {preferences.locations.length > 0 && (
                                                <div className="bg-white rounded-xl p-4 min-w-0 shadow-2xs">
                                                    <div className="flex items-center gap-1.5 mb-2.5">
                                                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                                            Preferred Locations
                                                        </span>
                                                        <span className="ml-auto text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                                                            {preferences.locations.length}
                                                        </span>
                                                    </div>
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
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* About / Bio */}
                            {profile?.about && (
                                <div className="min-w-0">
                                    <h4 className="text-[14px] font-semibold text-gray-900 mb-2">About Candidate</h4>
                                    <p className="text-[13px] text-gray-600 leading-relaxed bg-slate-50/70 p-3 rounded-2xl mb-0 break-words">
                                        {profile.about}
                                    </p>
                                </div>
                            )}

                            {/* Skills Section */}
                            {profile?.skills && profile.skills.length > 0 && (
                                <div className="min-w-0">
                                    <h4 className="text-[14px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Award className="w-4 h-4 text-indigo-600" />
                                        Skills & Competencies
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.skills.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-blue-50/70 text-blue-700 rounded-xl text-xs font-semibold border-1 border-blue-200/60"
                                            >
                                                {typeof skill === 'object' ? skill.name || JSON.stringify(skill) : skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Education Timeline */}
                            {profile?.education && profile.education.length > 0 && (
                                <div className="min-w-0">
                                    <h4 className="text-[14px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4 text-emerald-600" />
                                        Education Background
                                    </h4>
                                    <div className="space-y-3">
                                        {profile.education.map((edu, idx) => (
                                            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-xs relative overflow-hidden pl-4 min-w-0">
                                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-r"></div>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1 min-w-0">
                                                    <h5 className="font-semibold text-[14px] text-gray-900 mb-0 truncate">
                                                        {edu.qualification} {edu.course ? `- ${edu.course}` : ''}
                                                    </h5>
                                                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1 shrink-0">
                                                        <Calendar className="w-3 h-3" />
                                                        {edu.start_date ? new Date(edu.start_date).getFullYear() : ''}
                                                        {edu.start_date || edu.end_date ? ' – ' : ''}
                                                        {edu.end_date ? new Date(edu.end_date).getFullYear() : (edu.start_date ? 'Present' : '')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mb-1 truncate">{edu.college}</p>
                                                {(edu.cgpa || edu.percentage) && (
                                                    <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border-1 border-emerald-100">
                                                        Score: {edu.cgpa ? `${edu.cgpa} CGPA` : `${edu.percentage}%`}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Professional Experience */}
                            {profile?.professional && profile.professional.length > 0 && (
                                <div className="min-w-0">
                                    <h4 className="text-[14px] font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-blue-600" />
                                        Professional Experience
                                    </h4>
                                    <div className="space-y-3">
                                        {profile.professional.map((exp, idx) => (
                                            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs relative overflow-hidden pl-5 min-w-0">
                                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-r"></div>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1 min-w-0">
                                                    <h5 className="font-semibold text-[14px] text-gray-900 mb-0 truncate">{exp.job_title}</h5>
                                                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1 shrink-0">
                                                        <Calendar className="w-3 h-3" />
                                                        {exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                                                        {' – '}
                                                        {exp.currently_working ? 'Present' : (exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '')}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-semibold text-gray-700 mb-1 truncate">{exp.company_name} {exp.location ? `• ${exp.location}` : ''}</p>
                                                {exp.description && (
                                                    <p className="text-[12px] text-gray-500 mt-2 mb-0 leading-relaxed break-words">{exp.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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
