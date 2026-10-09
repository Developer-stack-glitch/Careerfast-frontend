"use client";
import React, { useState, useEffect } from 'react';
import {
    Briefcase, Search, Calendar, ChevronLeft, ChevronRight, CheckCircle, XCircle, Eye, Loader, MapPin, ArrowUpDown, User, Clock, MoreVertical, ChevronDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getPendingJobs, approveJobPost, rejectJobPost, approveAllPendingJobs, loginAsRecruiter } from '../ApiService/action';
import { getImageUrl } from '../utils/getImageUrl';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Modal } from 'antd';
import AdminDateFilter from './AdminDateFilter';
import { getJobDetailsUrl } from '../utils/slug';

const getCompanyAvatarGradient = (name = '') => {
    const gradients = [
        'from-blue-600 to-indigo-600',
        'from-emerald-600 to-teal-600',
        'from-purple-600 to-pink-600',
        'from-amber-500 to-orange-600',
        'from-cyan-600 to-blue-600',
        'from-rose-500 to-red-600',
        'from-violet-600 to-purple-700',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
};

const formatCleanText = (val, fallback = 'Not Specified') => {
    if (val === null || val === undefined) return fallback;
    let parsed = val;
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (!trimmed || trimmed === '[]' || trimmed === 'null' || trimmed === '[""]' || trimmed === '[" "]' || trimmed === '[null]') {
            return fallback;
        }
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            try {
                parsed = JSON.parse(trimmed);
            } catch (e) {
                parsed = trimmed;
            }
        }
    }
    if (Array.isArray(parsed)) {
        const filtered = parsed
            .map(item => (typeof item === 'string' ? item.trim() : item))
            .filter(item => item !== null && item !== undefined && item !== '' && item !== 'null' && item !== 'undefined');
        return filtered.length > 0 ? filtered.join(', ') : fallback;
    }
    if (typeof parsed === 'string') {
        const cleaned = parsed.replace(/^[\["'\s]+|[\]"'\s]+$/g, '').trim();
        return cleaned || fallback;
    }
    return String(parsed || fallback);
};

const PendingJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [actionModal, setActionModal] = useState({ isOpen: false, type: '', id: null, title: '' });
    const [rejectReason, setRejectReason] = useState('');
    const [dateFilter, setDateFilter] = useState({ preset: 'All Time', startDate: '', endDate: '', label: 'All Time' });

    const fetchPendingJobs = async () => {
        try {
            setLoading(true);
            const extraParams = {
                search: debouncedSearch || undefined,
                start_date: dateFilter.startDate || undefined,
                end_date: dateFilter.endDate || undefined
            };
            const res = await getPendingJobs(limit, page, extraParams);

            // JobsModel.getJobPosts returns { data, meta } inside the res.data.data object
            const jobsData = res.data?.data?.data || res.data?.data || [];
            const meta = res.data?.data?.meta || {};

            setJobs(jobsData);
            setTotal(meta.total || jobsData.length || 0);
        } catch (error) {
            console.error("Error fetching pending jobs:", error);
            toast.error("Failed to load pending jobs");
        } finally {
            setLoading(false);
        }
    };

    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchPendingJobs();
    }, [page, limit, dateFilter, debouncedSearch]);

    const openModal = (type, id, title) => {
        setActionModal({ isOpen: true, type, id, title });
    };

    const handleConfirmAction = async () => {
        const { type, id } = actionModal;
        if (type === 'reject' && !rejectReason.trim()) {
            toast.error("Please provide a reason for rejection.");
            return;
        }
        try {
            if (type === 'approve') {
                const res = await approveJobPost(id);
                toast.success(res?.data?.message || "Job approved successfully!");
            } else if (type === 'reject') {
                const res = await rejectJobPost(id, rejectReason);
                toast.success(res?.data?.message || "Job rejected.");
            } else if (type === 'approveAll') {
                const res = await approveAllPendingJobs();
                toast.success(res?.data?.message || "All pending jobs approved successfully!", { duration: 5000 });
            }
            fetchPendingJobs();
        } catch (error) {
            console.error(`${type} error:`, error);
            const errMsg = error.response?.data?.details || error.response?.data?.message || `Failed to ${type} job.`;
            toast.error(errMsg, { duration: 6000 });
        } finally {
            setActionModal({ isOpen: false, type: '', id: null, title: '' });
            setRejectReason('');
        }
    };

    const handleViewPreview = async (job) => {
        const recruiterId = job.user_id || job.recruiter_id;
        const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const defaultHrUrl = isLocalhost ? 'http://localhost:3001' : 'http://recruit.careerfast.in';
        const hrBaseUrl = process.env.NEXT_PUBLIC_HR_PORTAL_URL || defaultHrUrl;

        if (!recruiterId) {
            window.open(`${hrBaseUrl}/applicants/${job.id}`, '_blank');
            return;
        }

        const recName = job.recruiter_name?.trim() || job.company_name || 'Recruiter';
        const toastId = toast.loading(`Generating recruiter session for ${recName}...`);
        try {
            const res = await loginAsRecruiter(recruiterId);
            if (res.data?.success && res.data?.token) {
                toast.success(`Opening Recruiter Portal (Applicants #${job.id})...`, { id: toastId });
                const rawData = res.data?.data || {};
                const safeData = {
                    id: rawData.id || recruiterId,
                    first_name: rawData.first_name || 'Recruiter',
                    last_name: rawData.last_name || '',
                    email: rawData.email || '',
                    role_id: rawData.role_id || 3,
                    role_name: rawData.role_name || 'recruiter',
                    company_name: rawData.company_name || job.company_name || 'Recruiter',
                    organization: rawData.organization || '',
                    company_id: rawData.company_id || null,
                    is_email_verified: 1,
                    impersonated_by_admin: true,
                };
                const targetPath = `/applicants/${job.id}`;
                const targetUrl = `${hrBaseUrl}/login?impersonate_token=${encodeURIComponent(res.data.token)}&impersonate_data=${encodeURIComponent(JSON.stringify(safeData))}&target=${encodeURIComponent(targetPath)}`;
                window.open(targetUrl, '_blank');
            } else {
                toast.error(res.data?.message || "Failed to login as recruiter. Opening page directly.", { id: toastId });
                window.open(`${hrBaseUrl}/applicants/${job.id}`, '_blank');
            }
        } catch (err) {
            console.error("Error in handleViewPreview:", err);
            toast.error(err?.response?.data?.message || err?.message || "Failed to login as recruiter. Opening page directly.", { id: toastId });
            window.open(`${hrBaseUrl}/applicants/${job.id}`, '_blank');
        }
    };

    const totalPages = Math.ceil(total / limit) || 1;

    // Filter by search term and date locally if backend doesn't support search/date on this endpoint yet
    const filteredJobs = jobs.filter(job => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = !term || 
            job.job_title?.toLowerCase().includes(term) ||
            job.company_name?.toLowerCase().includes(term);
        
        let matchesDate = true;
        if (dateFilter?.startDate && dateFilter?.endDate) {
            const d = new Date(job.created_at);
            if (!isNaN(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const jobDateStr = `${year}-${month}-${day}`;
                matchesDate = jobDateStr >= dateFilter.startDate && jobDateStr <= dateFilter.endDate;
            }
        }

        return matchesSearch && matchesDate;
    });

    return (
        <div className="min-h-screen">
            {/* Header Section */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-0">
                        <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        Approval Pending Jobs
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 font-medium mb-0">
                        Review and approve job postings submitted by recruiters.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    {jobs.length > 0 && (
                        <button
                            onClick={() => openModal('approveAll')}
                            className="w-full sm:w-auto px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-green-500/20 flex items-center justify-center gap-2 shrink-0"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Approve All
                        </button>
                    )}
                    <AdminDateFilter
                        value={dateFilter}
                        onChange={(newFilter) => {
                            setDateFilter(newFilter);
                            setPage(1);
                        }}
                    />
                    <div className="relative group w-full sm:w-72">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search jobs or companies..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Jobs List */}
            <div className="bg-white rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-gray-50">
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">JOB DETAILS</th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">TYPE / LOCATION</th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">POSTED DATE</th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 animate-pulse">
                                {[...Array(5)].map((_, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0"></div>
                                                <div className="flex flex-col gap-2 w-full mt-1">
                                                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                                    <div className="h-3 bg-slate-200 rounded w-1/2 mt-0.5"></div>
                                                    <div className="h-3 bg-slate-200 rounded w-1/3 mt-1.5"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col gap-2.5 mt-1">
                                                <div className="h-6 w-20 bg-slate-200 rounded-md"></div>
                                                <div className="h-3.5 w-32 bg-slate-200 rounded mt-0.5"></div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col gap-2.5 mt-1">
                                                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                                <div className="h-3.5 w-20 bg-slate-200 rounded mt-0.5"></div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right align-middle">
                                            <div className="flex items-center justify-end gap-3 mt-1">
                                                <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
                                                <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
                                                <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="w-24 h-24 mb-6 rounded-full bg-emerald-50 flex items-center justify-center relative shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                            <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" style={{ animationDuration: '2s' }}></div>
                            <CheckCircle className="w-12 h-12 text-emerald-500 relative z-10 drop-shadow-sm" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2 mt-3">No pending jobs</h3>
                        <p className="text-slate-500 text-sm max-w-[250px] leading-relaxed">
                            You're all caught up! There are currently no job postings waiting for approval.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-gray-50">
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-700 w-fit">
                                            JOB DETAILS
                                        </div>
                                    </th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-700 w-fit">
                                            TYPE / LOCATION
                                        </div>
                                    </th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-700 w-fit">
                                            POSTED DATE
                                        </div>
                                    </th>
                                    <th className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredJobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-3 px-4">
                                            <div className="flex items-start gap-4">
                                                {(() => {
                                                    const logoSrc = job.company_logo || job.logo;
                                                    const compName = job.company_name || 'Company';
                                                    const grad = getCompanyAvatarGradient(compName);
                                                    return logoSrc ? (
                                                        <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                                                            <img
                                                                src={getImageUrl(logoSrc)}
                                                                alt={compName}
                                                                className="w-full h-full object-contain"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    if (e.currentTarget.nextElementSibling) {
                                                                        e.currentTarget.nextElementSibling.style.display = 'flex';
                                                                    }
                                                                }}
                                                            />
                                                            <div className={`w-full h-full rounded-lg bg-gradient-to-br ${grad} text-white hidden items-center justify-center font-bold text-base uppercase`}>
                                                                {compName.slice(0, 2)}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} text-white shadow-2xs flex items-center justify-center font-bold text-base uppercase shrink-0`}>
                                                            {compName.slice(0, 2)}
                                                        </div>
                                                    );
                                                })()}
                                                <div className="flex flex-col gap-0.5 min-w-0">
                                                    <a
                                                        href={getJobDetailsUrl(job, true)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="no-underline hover:no-underline inline-block max-w-full"
                                                    >
                                                        <h3 className="text-[15px] font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 mb-0 cursor-pointer">{job.job_title}</h3>
                                                    </a>
                                                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                                        <p className="text-sm font-semibold text-slate-700 mb-0">{job.company_name}</p>
                                                        {job.recruiter_plan_name && (
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${job.recruiter_can_approve === false
                                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                                                                }`}>
                                                                {job.recruiter_can_approve === false ? '⚠️ Limit Reached: ' : ''}
                                                                {job.recruiter_plan_name} Plan ({job.recruiter_active_count ?? 0}/{job.recruiter_active_limit ?? 3} Active)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-medium">
                                                        <User className="w-3.5 h-3.5" />
                                                        <span>{job.recruiter_name ? `Posted by ${job.recruiter_name}` : 'Posted by Recruiter'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col gap-2">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] font-semibold bg-indigo-50 text-indigo-600 w-fit">
                                                    <Briefcase className="w-3.5 h-3.5" />
                                                    {job.job_nature || job.employment_type || 'Job'}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    <span className="truncate max-w-[200px]">
                                                        {formatCleanText(job.work_location, 'Not Specified')}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-col gap-2 text-[12px] text-slate-700 font-semibold">
                                                <div className="flex items-center gap-2.5">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {new Date(job.created_at).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </div>
                                                <div className="flex items-center gap-2.5 text-slate-400 text-[13px] font-medium">
                                                    <Clock className="w-4 h-4" />
                                                    {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right align-middle">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => handleViewPreview(job)}
                                                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12.5px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" /> Preview
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (job.recruiter_can_approve === false) {
                                                            toast.error(
                                                                `Cannot approve: Recruiter "${job.company_name || 'Recruiter'}" has reached their ${job.recruiter_plan_name || 'plan'} active limit (${job.recruiter_active_count}/${job.recruiter_active_limit} slots used). The recruiter must upgrade their plan or close an active job first.`,
                                                                { duration: 6000 }
                                                            );
                                                            return;
                                                        }
                                                        openModal('approve', job.id, job.job_title);
                                                    }}
                                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[12.5px] font-semibold rounded-lg transition-colors ${job.recruiter_can_approve === false
                                                        ? 'text-slate-400 bg-slate-100 hover:bg-slate-200 cursor-not-allowed'
                                                        : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                                                        }`}
                                                    title={job.recruiter_can_approve === false ? `Active limit reached (${job.recruiter_active_count}/${job.recruiter_active_limit})` : "Approve job post"}
                                                >
                                                    <CheckCircle className="w-4 h-4" /> Approve
                                                </button>
                                                <button
                                                    onClick={() => openModal('reject', job.id, job.job_title)}
                                                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[12.5px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    <XCircle className="w-4 h-4" /> Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && total > 0 && (
                    <div className="px-6 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 gap-4">
                        <span className="text-sm text-slate-500 font-medium">
                            Showing {total === 0 ? 0 : ((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} pending job{total !== 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center gap-5">
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .map((p, idx, arr) => {
                                        return (
                                            <React.Fragment key={p}>
                                                {idx > 0 && arr[idx - 1] !== p - 1 && (
                                                    <span className="text-slate-400 px-1">...</span>
                                                )}
                                                <button
                                                    onClick={() => setPage(p)}
                                                    className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-semibold transition-colors border ${page === p
                                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                        : 'border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            </React.Fragment>
                                        );
                                    })}

                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                Rows per page:
                                <select
                                    className="px-2 py-1.5 border border-slate-200 rounded-md text-slate-700 text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                    value={limit}
                                    onChange={(e) => {
                                        setLimit(Number(e.target.value));
                                        setPage(1);
                                    }}
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            <Modal
                title={actionModal.type === 'approveAll' ? 'Approve All Pending Jobs' : (actionModal.type === 'approve' ? 'Approve Job Post' : 'Reject Job Post')}
                open={actionModal.isOpen}
                centered
                onOk={handleConfirmAction}
                onCancel={() => {
                    setActionModal({ isOpen: false, type: '', id: null, title: '' });
                    setRejectReason('');
                }}
                okText={actionModal.type === 'approveAll' ? 'Yes, Approve All' : (actionModal.type === 'approve' ? 'Yes, Approve' : 'Yes, Reject')}
                okButtonProps={{
                    className: (actionModal.type === 'approve' || actionModal.type === 'approveAll')
                        ? '!bg-emerald-500 hover:!bg-emerald-600 !border-emerald-500 hover:!border-emerald-600 !text-white'
                        : '!bg-red-500 hover:!bg-red-600 !border-red-500 hover:!border-red-600 !text-white',
                    style: { boxShadow: 'none' }
                }}
                cancelButtonProps={{
                    className: 'hover:!border-slate-400 hover:!text-slate-700 !text-slate-600 !border-slate-300',
                    style: { boxShadow: 'none' }
                }}
            >
                <div className="py-2">
                    <p className="mb-4 text-slate-600">
                        {actionModal.type === 'approveAll'
                            ? `Are you sure you want to approve all ${total} pending jobs? They will become public immediately.`
                            : (actionModal.type === 'approve'
                                ? `Are you sure you want to approve "${actionModal.title}"? It will become public immediately.`
                                : `Are you sure you want to reject "${actionModal.title}"? Please provide a reason.`)}
                    </p>

                    {actionModal.type === 'reject' && (
                        <textarea
                            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm resize-none"
                            rows={3}
                            placeholder="Enter rejection reason here... (Required)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            required
                        ></textarea>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default PendingJobs;
