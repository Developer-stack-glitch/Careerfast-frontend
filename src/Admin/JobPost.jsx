import React, { useState, useEffect, useRef } from 'react';
import {
    Briefcase, Building2, MapPin, Search,
    MoreVertical, CheckCircle2, CheckCircle, XCircle, FileText, Download,
    Eye, Trash2, ExternalLink, ChevronLeft, ChevronRight, SlidersHorizontal, Clock,
    ChevronsUpDown, Folder, GraduationCap, ClipboardList, Users, User, Calendar,
    Layers, Filter, RotateCcw, ChevronDown, Sparkles
} from 'lucide-react';
import {
    getJobPosts,
    deleteJobPost,
    expireJobPost,
    makeJobActive,
    approveJobPost,
    rejectJobPost,
    approveAllPendingJobs,
    loginAsRecruiter
} from '../ApiService/action';
import { getImageUrl } from '../utils/getImageUrl';
import toast from 'react-hot-toast';
import AdminDateFilter from './AdminDateFilter';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { getJobDetailsUrl } from '../utils/slug';
import { Modal } from 'antd';

// Consistent color gradient generator for company logos/initials
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

// Robust text/array parser to handle JSON strings, arrays, empty arrays, and nulls
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

// ── Stat Card Component ──
const StatCard = ({ title, value, icon: Icon, color, bg, accent }) => (
    <div className="bg-white rounded-xl p-4 group transition-all duration-300 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${bg} opacity-60 -translate-y-8 translate-x-8 group-hover:scale-125 transition-transform duration-500`}></div>
        <div className="flex items-start justify-between mb-3 relative z-10">
            <div className={`p-2.5 rounded-xl ${bg} ${color} ring-1 ring-inset ${accent}`}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </div>
        </div>
        <div className="relative z-10">
            <h4 className="text-gray-500 text-[14px] font-medium mb-1">{title}</h4>
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-0">{value}</h2>
        </div>
    </div>
);

// ── Actions Dropdown (for Standard Table) ──
const ActionsDropdown = ({ job, onClose, onDelete, onToggleStatus, onApprove, onReject, onViewPreview, isBottom }) => {
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    const isActive = job.is_closed === 0;
    const isPending = job.approval_status === 'pending' || !job.approval_status;

    return (
        <div ref={ref} className={`absolute right-0 ${isBottom ? 'bottom-full mb-1' : 'top-full mt-1'} w-48 bg-white rounded-xl shadow-lg border border-gray-200/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}>
            <button onClick={() => { onViewPreview(job); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                <Eye className="w-3.5 h-3.5 text-blue-500" /> View / Preview
            </button>
            <button onClick={() => { window.location.href = `/admin/applications?search=${encodeURIComponent(job.job_title || '')}`; onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <Users className="w-3.5 h-3.5 text-indigo-500" /> View Applied ({job.applicants_count || 0})
            </button>
            <button onClick={() => { window.open(job.apply_link || getJobDetailsUrl(job, true), '_blank'); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Open Apply Link
            </button>

            {isPending && (
                <>
                    <div className="my-1 border-t border-gray-100"></div>
                    <button
                        onClick={() => {
                            onApprove(job);
                            onClose();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Approve Job
                    </button>
                    <button
                        onClick={() => {
                            onReject(job);
                            onClose();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                        <XCircle className="w-3.5 h-3.5 text-amber-500" /> Reject Job
                    </button>
                </>
            )}

            <div className="my-1 border-t border-gray-100"></div>
            <button onClick={() => { onToggleStatus(job.id, isActive); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-700 hover:bg-gray-100 transition-colors">
                {isActive ? <XCircle className="w-3.5 h-3.5 text-gray-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                {isActive ? 'Close Job' : 'Open Job'}
            </button>
            <div className="my-1 border-t border-gray-100"></div>
            <button onClick={() => { onDelete(job.id); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Remove Post
            </button>
        </div>
    );
};

export default function JobPost() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [openDropdown, setOpenDropdown] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [matchedJobs, setMatchedJobs] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [globalStats, setGlobalStats] = useState({ total: 0, active: 0, closed: 0, approved: 0, autoApproved: 0, pending: 0, companies: 0 });
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [dateFilter, setDateFilter] = useState({ preset: 'All Time', startDate: '', endDate: '', label: 'All Time' });
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [selectedNature, setSelectedNature] = useState('All');
    const [selectedWorkplace, setSelectedWorkplace] = useState('All');
    const [selectedExperience, setSelectedExperience] = useState('All');

    // Approval action modals
    const [actionModal, setActionModal] = useState({ isOpen: false, type: '', id: null, title: '' });
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchJobs();
    }, [currentPage, itemsPerPage, debouncedSearch, activeFilter, dateFilter, sortConfig, selectedNature, selectedWorkplace, selectedExperience]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const payload = {
                limit: itemsPerPage,
                page: currentPage,
                include_stats: true,
            };
            if (debouncedSearch) payload.searchTerm = debouncedSearch;
            if (activeFilter === 'Active') {
                payload.is_closed = 0;
                payload.approval_status = 'approved';
            } else if (activeFilter === 'Closed') {
                payload.is_closed = 1;
                payload.approval_status = 'all';
            } else if (activeFilter === 'Approved') {
                payload.approval_status = 'approved';
            } else if (activeFilter === 'Auto Approved') {
                payload.approval_status = 'auto_approved';
            } else if (activeFilter === 'Pending') {
                payload.approval_status = 'pending';
            } else {
                payload.approval_status = 'all';
            }

            if (selectedNature === 'Walk-in') {
                payload.is_walk_in = 1;
            } else if (selectedNature !== 'All') {
                payload.job_nature = selectedNature;
            }

            if (selectedWorkplace !== 'All') {
                payload.workplace_type = [selectedWorkplace];
            }

            if (selectedExperience !== 'All') {
                payload.experience_type = selectedExperience;
            }

            if (dateFilter.startDate) payload.start_date = dateFilter.startDate;
            if (dateFilter.endDate) payload.end_date = dateFilter.endDate;
            if (sortConfig.key) {
                payload.sort_key = sortConfig.key;
                payload.sort_direction = sortConfig.direction || 'asc';
            }

            const response = await getJobPosts(payload);
            const responseData = response?.data?.data || response?.data || {};
            const jobsArray = responseData.data || [];
            setJobs(Array.isArray(jobsArray) ? jobsArray : []);

            const meta = responseData.meta;
            if (meta) {
                setTotalPages(meta.totalPages || 1);
                setMatchedJobs(meta.total || 0);
                if (meta.stats) {
                    setGlobalStats({
                        total: Number(meta.stats.totalJobs || 0),
                        active: Number(meta.stats.activeJobs || 0),
                        closed: Number(meta.stats.closedJobs || 0),
                        approved: Number(meta.stats.approvedJobs || 0),
                        autoApproved: Number(meta.stats.autoApprovedJobs || 0),
                        pending: Number(meta.stats.pendingJobs || 0),
                        companies: Number(meta.stats.uniqueCompanies || 0)
                    });
                }
            }
        } catch (error) {
            console.error("Failed to fetch jobs:", error);
            toast.error("Failed to load jobs data");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteJob = (jobId) => {
        setJobToDelete(jobId);
        setDeleteModalOpen(true);
    };

    const confirmDeleteJob = async () => {
        if (!jobToDelete) return;
        try {
            setIsDeleting(true);
            await deleteJobPost({ id: jobToDelete });
            setJobs(jobs.filter(j => j.id !== jobToDelete));
            fetchJobs();
            setDeleteModalOpen(false);
            setJobToDelete(null);
            toast.success("Job post deleted successfully!");
        } catch (error) {
            console.error("Failed to delete job post", error);
            toast.error("Failed to delete job post.");
        } finally {
            setIsDeleting(false);
        }
    };

    const openModal = (type, id = null, title = '') => {
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
            fetchJobs();
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

    const handleExport = async () => {
        try {
            const toastId = toast.loading('Generating export...');
            const payload = {
                limit: 10000,
                page: 1,
            };
            if (searchTerm) payload.searchTerm = searchTerm;
            if (activeFilter === 'Active') payload.is_closed = 0;
            if (activeFilter === 'Closed') payload.is_closed = 1;
            if (activeFilter === 'Approved') payload.approval_status = 'approved';
            if (activeFilter === 'Pending') payload.approval_status = 'pending';
            if (selectedNature === 'Walk-in') payload.is_walk_in = 1;
            else if (selectedNature !== 'All') payload.job_nature = selectedNature;
            if (selectedWorkplace !== 'All') payload.workplace_type = [selectedWorkplace];
            if (selectedExperience !== 'All') payload.experience_type = selectedExperience;

            const response = await getJobPosts(payload);
            const responseData = response?.data?.data || response?.data || {};
            const exportJobs = responseData.data || [];

            if (exportJobs.length === 0) {
                toast.error('No data to export', { id: toastId });
                return;
            }

            const csvRows = [];
            csvRows.push(['Job Title', 'Company', 'Type', 'Location', 'Date Posted', 'Date Approved', 'Status']);

            exportJobs.forEach(job => {
                const title = `"${(job.job_title || '').replace(/"/g, '""')}"`;
                const company = `"${(job.company_name || '').replace(/"/g, '""')}"`;
                const type = `"${formatCleanText(job.job_category, 'General').replace(/"/g, '""')}"`;
                const location = `"${formatCleanText(job.work_location, 'Not Specified').replace(/"/g, '""')}"`;
                const datePosted = `"${new Date(job.created_at || new Date()).toLocaleDateString()}"`;
                const dateApproved = `"${job.approved_at ? new Date(job.approved_at).toLocaleDateString() : 'Pending'}"`;
                const status = job.is_closed === 0 ? 'Active' : 'Closed';
                csvRows.push([title, company, type, location, datePosted, dateApproved, status]);
            });

            const csvContent = csvRows.map(e => e.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `job_postings_${activeFilter.toLowerCase()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Export completed', { id: toastId });
        } catch (error) {
            console.error("Export error:", error);
            toast.dismiss();
            toast.error('Failed to generate export');
        }
    };

    const handleToggleStatus = async (jobId, currentIsActive) => {
        // Optimistic UI update immediately
        const newIsClosed = currentIsActive ? 1 : 0;
        setJobs(prev => prev.map(j => (j.id === jobId || j._id === jobId) ? { ...j, is_closed: newIsClosed } : j));
        setGlobalStats(prev => ({
            ...prev,
            active: currentIsActive ? Math.max(0, prev.active - 1) : prev.active + 1,
            closed: currentIsActive ? prev.closed + 1 : Math.max(0, prev.closed - 1)
        }));

        try {
            if (currentIsActive) {
                await expireJobPost({ id: jobId });
                toast.success("Job post marked as closed.");
            } else {
                await makeJobActive({ id: jobId });
                toast.success("Job post marked as active.");
            }
            fetchJobs();
        } catch (error) {
            console.error("Failed to change job status", error);
            toast.error("Failed to update job status.");
            fetchJobs();
        }
    };

    const handleSort = (key) => {
        setSortConfig(prev => {
            if (prev.key !== key) return { key, direction: 'asc' };
            if (prev.direction === 'asc') return { key, direction: 'desc' };
            return { key: null, direction: null };
        });
    };

    const paginatedJobs = jobs;

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeFilter]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatRelativeTime = (dateString) => {
        if (!dateString) return '';
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch (e) {
            return '';
        }
    };

    // Filter tabs definition
    const filterTabs = [
        {
            label: 'Pending',
            count: globalStats.pending,
            color: { text: 'text-amber-600', border: 'border-amber-600', badgeBg: 'bg-amber-100', badgeText: 'text-amber-700' }
        },
        {
            label: 'All',
            count: globalStats.total,
            color: { text: 'text-blue-600', border: 'border-blue-600', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700' }
        },
        {
            label: 'Active',
            count: globalStats.active,
            color: { text: 'text-emerald-600', border: 'border-emerald-600', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700' }
        },
        {
            label: 'Approved',
            count: globalStats.approved,
            color: { text: 'text-indigo-600', border: 'border-indigo-600', badgeBg: 'bg-indigo-100', badgeText: 'text-indigo-700' }
        },
        {
            label: 'Auto Approved',
            count: globalStats.autoApproved,
            color: { text: 'text-violet-600', border: 'border-violet-600', badgeBg: 'bg-violet-100', badgeText: 'text-violet-700' }
        },
        {
            label: 'Closed',
            count: globalStats.closed,
            color: { text: 'text-rose-600', border: 'border-rose-600', badgeBg: 'bg-rose-100', badgeText: 'text-rose-700' }
        },
    ];

    const getJobNatureBadge = (nature) => {
        const normalized = (nature || '').toLowerCase();
        if (normalized.includes('intern'))
            return { bg: 'bg-orange-50', text: 'text-orange-600', icon: GraduationCap };
        if (normalized.includes('full') || normalized === 'job')
            return { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: Briefcase };
        if (normalized.includes('part'))
            return { bg: 'bg-violet-50', text: 'text-violet-600', icon: Clock };
        if (normalized.includes('contract'))
            return { bg: 'bg-cyan-50', text: 'text-cyan-600', icon: ClipboardList };
        return { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: Briefcase };
    };

    return (
        <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-0">
                        {activeFilter === 'Pending' ? 'Approval Pending Jobs' : 'Job Postings'}
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5 mb-0">
                        {activeFilter === 'Pending'
                            ? 'Review and approve job postings submitted by recruiters.'
                            : 'Manage all jobs posted by recruiters across the platform.'}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    {/* Approve All button when in Pending tab */}
                    {activeFilter === 'Pending' && (globalStats.pending > 0 || paginatedJobs.length > 0) && (
                        <button
                            onClick={() => openModal('approveAll')}
                            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 shrink-0 active:scale-[0.98]"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Approve All
                        </button>
                    )}

                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search jobs or companies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>
                    <AdminDateFilter
                        value={dateFilter}
                        onChange={(newFilter) => {
                            setDateFilter(newFilter);
                            setCurrentPage(1);
                        }}
                    />
                    <button
                        onClick={handleExport}
                        className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all flex items-center justify-center gap-2 shrink-0 active:scale-[0.98]"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* KPI Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <StatCard
                    title="Total Postings"
                    value={globalStats.total.toLocaleString()}
                    icon={Briefcase}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    accent="ring-blue-100"
                />
                <StatCard
                    title="Active Jobs"
                    value={globalStats.active.toLocaleString()}
                    icon={CheckCircle2}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                    accent="ring-emerald-100"
                />
                <StatCard
                    title="Auto Approved"
                    value={globalStats.autoApproved.toLocaleString()}
                    icon={CheckCircle2}
                    color="text-violet-600"
                    bg="bg-violet-50"
                    accent="ring-violet-100"
                />
                <StatCard
                    title="Approval Pending"
                    value={globalStats.pending.toLocaleString()}
                    icon={Clock}
                    color="text-amber-600"
                    bg="bg-amber-50"
                    accent="ring-amber-100"
                />
                <StatCard
                    title="Closed Jobs"
                    value={globalStats.closed.toLocaleString()}
                    icon={XCircle}
                    color="text-rose-600"
                    bg="bg-rose-50"
                    accent="ring-rose-100"
                />
            </div>

            {/* ── Quick Filter Boxes (Jobs, Internships, Walk-ins, Attributes) ── */}
            <div className="bg-white rounded-xl p-3 sm:p-4 mb-5 border border-slate-200/80 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                    {/* Left: Nature Type Filter Boxes */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1.5">
                            <Filter className="w-3.5 h-3.5" /> Type:
                        </span>
                        {[
                            { label: 'All Types', value: 'All', icon: Layers },
                            { label: 'Jobs', value: 'Job', icon: Briefcase },
                            { label: 'Internships', value: 'Internship', icon: GraduationCap },
                            { label: 'Walk-in Drives', value: 'Walk-in', icon: Calendar },
                        ].map((t) => {
                            const isSelected = selectedNature === t.value;
                            const Icon = t.icon;
                            return (
                                <button
                                    key={t.value}
                                    onClick={() => {
                                        setSelectedNature(t.value);
                                        setCurrentPage(1);
                                    }}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all shrink-0 active:scale-95 cursor-pointer ${
                                        isSelected
                                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                                    <span>{t.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right: Dropdown Select Boxes & Reset */}
                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                        {/* Workplace Select */}
                        <div className="relative">
                            <select
                                value={selectedWorkplace}
                                onChange={(e) => {
                                    setSelectedWorkplace(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="appearance-none pl-3 pr-8 py-2 text-[12.5px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                            >
                                <option value="All">All Workplace</option>
                                <option value="Work from office">🏢 On-site / Office</option>
                                <option value="Hybrid">⚡ Hybrid</option>
                                <option value="Remote">🌐 Remote</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Experience Select */}
                        <div className="relative">
                            <select
                                value={selectedExperience}
                                onChange={(e) => {
                                    setSelectedExperience(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="appearance-none pl-3 pr-8 py-2 text-[12.5px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                            >
                                <option value="All">All Experience</option>
                                <option value="Fresher">🌱 Fresher</option>
                                <option value="Experienced">💼 Experienced</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        {/* Reset Button (only if active filters applied) */}
                        {(selectedNature !== 'All' || selectedWorkplace !== 'All' || selectedExperience !== 'All' || searchTerm) && (
                            <button
                                onClick={() => {
                                    setSelectedNature('All');
                                    setSelectedWorkplace('All');
                                    setSelectedExperience('All');
                                    setSearchTerm('');
                                    setCurrentPage(1);
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200/60 transition-all cursor-pointer"
                                title="Reset all filters"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-xs overflow-hidden">
                {/* Filter Tabs */}
                <div className="px-6 pt-2 border-b border-gray-100 flex items-center justify-between mb-0">
                    <div className="flex gap-7 sm:gap-10 -mb-px overflow-x-auto">
                        {filterTabs.map((tab) => {
                            const isPending = tab.label === 'Pending';
                            const isPendingWithCount = isPending && tab.count > 0;
                            const isActive = activeFilter === tab.label;

                            return (
                                <button
                                    key={tab.label}
                                    onClick={() => setActiveFilter(tab.label)}
                                    className={`py-3.5 text-[14px] font-semibold transition-all border-b-2 shrink-0 group flex items-center gap-2 ${isActive
                                        ? `${tab.color.border} ${tab.color.text}`
                                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                                        }`}
                                >
                                    <span>{tab.label}</span>
                                    <span
                                        className={`text-[11.5px] font-bold px-2 py-1 rounded-full transition-all flex items-center gap-1.5 leading-none ${isPendingWithCount
                                            ? isActive
                                                ? 'bg-amber-100 text-amber-800 border-1 border-amber-300'
                                                : 'bg-amber-50 text-amber-700 border-1 border-amber-200/90'
                                            : isActive
                                                ? `${tab.color.badgeBg} ${tab.color.badgeText}`
                                                : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                                            }`}
                                    >
                                        {isPendingWithCount && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                        )}
                                        <span>{tab.count}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── CONDITIONAL TABLE: PENDING VIEW vs STANDARD VIEW ── */}
                {activeFilter === 'Pending' ? (
                    /* ─── PENDING JOBS VIEW (Matches Approval Pending Jobs page) ─── */
                    <div className="overflow-x-auto pb-1 min-h-[280px]">
                        {loading ? (
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/70">
                                        <th className="py-3.5 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">JOB DETAILS</th>
                                        <th className="py-3.5 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">TYPE / LOCATION</th>
                                        <th className="py-3.5 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">POSTED DATE</th>
                                        <th className="py-3.5 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 animate-pulse">
                                    {[...Array(5)].map((_, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3.5 px-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0"></div>
                                                    <div className="flex flex-col gap-2 w-full mt-1">
                                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                        <div className="h-3 bg-gray-200 rounded w-1/2 mt-0.5"></div>
                                                        <div className="h-3 bg-gray-200 rounded w-1/3 mt-1.5"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-6">
                                                <div className="flex flex-col gap-2.5 mt-1">
                                                    <div className="h-6 w-20 bg-gray-200 rounded-md"></div>
                                                    <div className="h-3.5 w-32 bg-gray-200 rounded mt-0.5"></div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-6">
                                                <div className="flex flex-col gap-2.5 mt-1">
                                                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                                    <div className="h-3.5 w-20 bg-gray-200 rounded mt-0.5"></div>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-6 text-right align-middle">
                                                <div className="flex items-center justify-end gap-3 mt-1">
                                                    <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
                                                    <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
                                                    <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : paginatedJobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                <div className="w-20 h-20 mb-5 rounded-full bg-emerald-50 flex items-center justify-center relative shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                                    <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" style={{ animationDuration: '2s' }}></div>
                                    <CheckCircle className="w-10 h-10 text-emerald-500 relative z-10" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900 mb-1.5">No pending jobs</h3>
                                <p className="text-gray-500 text-sm max-w-sm leading-relaxed mb-0">
                                    You're all caught up! There are currently no job postings waiting for approval.
                                </p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/70">
                                        <th className="py-3.5 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">JOB DETAILS</th>
                                        <th className="py-3.5 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">TYPE / LOCATION</th>
                                        <th className="py-3.5 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">POSTED DATE</th>
                                        <th className="py-3.5 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedJobs.map((job) => {
                                        const logoSrc = job.company_logo || job.logo;
                                        const compName = job.company_name || 'Company';
                                        const grad = getCompanyAvatarGradient(compName);
                                        const badgeStyle = getJobNatureBadge(job.job_nature);

                                        return (
                                            <tr key={job.id || job._id} className="hover:bg-slate-50/60 transition-colors group">
                                                {/* 1. Job Details */}
                                                <td className="py-3.5 px-6 max-w-[420px]">
                                                    <div className="flex items-start gap-4">
                                                        {logoSrc ? (
                                                            <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-gray-100 flex items-center justify-center p-1 shrink-0 overflow-hidden">
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
                                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} text-white shadow-xs flex items-center justify-center font-bold text-base uppercase shrink-0`}>
                                                                {compName.slice(0, 2)}
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col gap-0.5 min-w-0">
                                                            <h3 className="text-[15px] font-bold text-blue-950 group-hover:text-blue-600 transition-colors line-clamp-1 mb-0">
                                                                {job.job_title}
                                                            </h3>
                                                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                                                <p className="text-sm font-semibold text-gray-700 mb-0">{compName}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 font-medium">
                                                                <User className="w-3.5 h-3.5" />
                                                                <span>{job.recruiter_name ? `Posted by ${job.recruiter_name}` : 'Posted by Recruiter'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 2. Type / Location */}
                                                <td className="py-3.5 px-6">
                                                    <div className="flex flex-col gap-2">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12.5px] font-semibold ${badgeStyle.bg} ${badgeStyle.text} w-fit`}>
                                                            <Briefcase className="w-3.5 h-3.5" />
                                                            {job.job_nature || job.employment_type || 'Job'}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-[13px] text-gray-500 font-medium">
                                                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className="truncate max-w-[200px]">
                                                                {formatCleanText(job.work_location, 'Not Specified')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 3. Posted Date */}
                                                <td className="py-3.5 px-6">
                                                    <div className="flex flex-col gap-1.5 text-[12.5px] text-gray-800 font-semibold">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                            {formatDate(job.created_at || job.createdAt)}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-gray-400 text-[12px] font-medium">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {formatRelativeTime(job.created_at || job.createdAt)}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 4. Actions */}
                                                <td className="py-3.5 px-6 text-right align-middle">
                                                    <div className="flex items-center justify-end gap-2.5">
                                                        <button
                                                            onClick={() => handleViewPreview(job)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors active:scale-95"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> Preview
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
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold rounded-lg transition-colors active:scale-95 ${job.recruiter_can_approve === false
                                                                ? 'text-gray-400 bg-gray-100 hover:bg-gray-200 cursor-not-allowed'
                                                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                                                }`}
                                                            title={job.recruiter_can_approve === false ? `Active limit reached (${job.recruiter_active_count}/${job.recruiter_active_limit})` : "Approve job post"}
                                                        >
                                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Approve
                                                        </button>
                                                        <button
                                                            onClick={() => openModal('reject', job.id, job.job_title)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors active:scale-95"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5 text-rose-500" /> Reject
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                ) : (
                    /* ─── STANDARD TABLE VIEW (All, Active, Approved, Closed) ─── */
                    <div className="overflow-x-auto pb-1 min-h-[280px]">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/70">
                                    <th onClick={() => handleSort('job_title')} className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 select-none transition-colors">
                                        <div className="flex items-center gap-2">JOB TITLE <ChevronsUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'job_title' ? 'text-blue-600' : 'opacity-50'}`} /></div>
                                    </th>
                                    <th onClick={() => handleSort('company_name')} className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 select-none transition-colors">
                                        <div className="flex items-center gap-2">COMPANY <ChevronsUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'company_name' ? 'text-blue-600' : 'opacity-50'}`} /></div>
                                    </th>
                                    <th onClick={() => handleSort('job_nature')} className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 select-none transition-colors">
                                        <div className="flex items-center gap-2">TYPE <ChevronsUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'job_nature' ? 'text-blue-600' : 'opacity-50'}`} /></div>
                                    </th>
                                    <th onClick={() => handleSort('job_location')} className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 select-none transition-colors">
                                        <div className="flex items-center gap-2">LOCATION <ChevronsUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'job_location' ? 'text-blue-600' : 'opacity-50'}`} /></div>
                                    </th>
                                    <th onClick={() => handleSort('created_at')} className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 select-none transition-colors">
                                        <div className="flex items-center gap-2">DATE POSTED <ChevronsUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'created_at' ? 'text-blue-600' : 'opacity-50'}`} /></div>
                                    </th>
                                    <th onClick={() => handleSort('approved_at')} className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 select-none transition-colors">
                                        <div className="flex items-center gap-2">DATE APPROVED <ChevronsUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'approved_at' ? 'text-blue-600' : 'opacity-50'}`} /></div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('applicants_count')}
                                        className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 select-none transition-colors"
                                        title="Click to sort by applied candidates count"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span>APPLIED CANDIDATES</span>
                                            <ChevronsUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'applicants_count' ? 'text-blue-600' : 'opacity-50'}`} />
                                        </div>
                                    </th>
                                    <th onClick={() => handleSort('is_closed')} className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 select-none transition-colors">
                                        <div className="flex items-center gap-2">STATUS <ChevronsUpDown className={`w-3.5 h-3.5 ${sortConfig.key === 'is_closed' ? 'text-blue-600' : 'opacity-50'}`} /></div>
                                    </th>
                                    <th className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    [...Array(6)].map((_, i) => (
                                        <tr key={i} className="animate-pulse bg-white">
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-100"></div>
                                                    <div>
                                                        <div className="h-4 bg-gray-100 rounded-lg w-36 mb-2"></div>
                                                        <div className="h-3 bg-gray-50 rounded-lg w-24"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5"><div className="h-4 bg-gray-100 rounded-lg w-28"></div></td>
                                            <td className="px-4 py-3.5"><div className="h-6 bg-gray-100 rounded-full w-20"></div></td>
                                            <td className="px-4 py-3.5"><div className="h-4 bg-gray-100 rounded-lg w-24"></div></td>
                                            <td className="px-4 py-3.5"><div className="h-4 bg-gray-100 rounded-lg w-20"></div></td>
                                            <td className="px-4 py-3.5"><div className="h-4 bg-gray-100 rounded-lg w-20"></div></td>
                                            <td className="px-4 py-3.5"><div className="h-6 bg-gray-100 rounded-full w-20"></div></td>
                                            <td className="px-4 py-3.5"><div className="h-6 bg-gray-100 rounded-full w-16"></div></td>
                                            <td className="px-4 py-3.5 text-center"><div className="h-8 w-8 bg-gray-100 rounded-lg inline-block"></div></td>
                                        </tr>
                                    ))
                                ) : paginatedJobs.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-16 text-center bg-white">
                                            <div className="flex flex-col items-center justify-center text-gray-500">
                                                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
                                                    <Briefcase className="w-7 h-7 text-gray-300" />
                                                </div>
                                                <h3 className="text-sm font-semibold text-gray-900 mb-1">No job postings found</h3>
                                                <p className="text-[13px] text-gray-500 max-w-sm mb-0">
                                                    {searchTerm
                                                        ? `No results for "${searchTerm}". Try adjusting your search or filters.`
                                                        : 'There are currently no jobs matching your criteria.'
                                                    }
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedJobs.map((job, index) => {
                                        const badgeStyle = getJobNatureBadge(job.job_nature);
                                        const isActive = job.is_closed === 0;
                                        const jobTitleText = job.job_title || 'Untitled Role';
                                        const companyNameText = job.company_name || '-';
                                        const jobCategoryText = formatCleanText(job.job_category, 'General');
                                        const workLocationText = formatCleanText(job.work_location, 'Not Specified');
                                        const logoSrc = job.company_logo || job.logo;
                                        const grad = getCompanyAvatarGradient(companyNameText);

                                        return (
                                            <tr
                                                key={job.id || job._id}
                                                className="hover:bg-gray-50/60 transition-all duration-200 group bg-white"
                                            >
                                                {/* Job Role */}
                                                <td className="px-4 py-3.5 max-w-[280px]">
                                                    <div className="flex items-center gap-3.5">
                                                        {logoSrc ? (
                                                            <div className="w-12 h-12 p-1 rounded-xl bg-white shadow-xs border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                                <img
                                                                    src={getImageUrl(logoSrc)}
                                                                    alt={companyNameText}
                                                                    className="w-full h-full object-contain"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        if (e.currentTarget.nextElementSibling) {
                                                                            e.currentTarget.nextElementSibling.style.display = 'flex';
                                                                        }
                                                                    }}
                                                                />
                                                                <div className={`w-full h-full rounded-lg bg-gradient-to-br ${grad} text-white hidden items-center justify-center font-bold text-base uppercase`}>
                                                                    {companyNameText.slice(0, 2)}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} text-white shadow-xs flex items-center justify-center font-bold text-base uppercase shrink-0`}>
                                                                {companyNameText.slice(0, 2)}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 flex flex-col justify-center">
                                                            <div className="relative group/title inline-block min-w-0">
                                                                <a
                                                                    href={getJobDetailsUrl(job, true)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="no-underline hover:no-underline group/link inline-block max-w-full"
                                                                >
                                                                    <h3 className="text-[14px] font-bold text-blue-950 group-hover/link:text-blue-600 hover:text-blue-600 transition-colors truncate mb-0 cursor-pointer">
                                                                        {jobTitleText}
                                                                    </h3>
                                                                </a>
                                                                <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/title:block bg-gray-900 text-white text-[11px] font-medium rounded-lg py-1.5 px-2.5 z-[100] whitespace-nowrap shadow-xl pointer-events-none">
                                                                    {jobTitleText}
                                                                    <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                                                </div>
                                                            </div>
                                                            <div className="text-[13px] text-gray-500 mt-0 flex items-center gap-1.5 relative group/cat min-w-0">
                                                                <Folder className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                                                <span className="truncate">{jobCategoryText}</span>
                                                                <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/cat:block bg-gray-900 text-white text-[11px] font-medium rounded-lg py-1.5 px-2.5 z-[100] whitespace-nowrap shadow-xl">
                                                                    {jobCategoryText}
                                                                    <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Company */}
                                                <td className="px-4 py-3.5 max-w-[200px]">
                                                    <div className="flex items-center gap-2 text-[13px] text-gray-600 font-medium relative group/comp min-w-0">
                                                        <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                                                        <span className="truncate">{companyNameText}</span>
                                                        <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/comp:block bg-gray-900 text-white text-[11px] font-medium rounded-lg py-1.5 px-2.5 z-[100] whitespace-nowrap shadow-xl">
                                                            {companyNameText}
                                                            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Type Badge */}
                                                <td className="px-4 py-3.5">
                                                    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full ${badgeStyle.bg} ${badgeStyle.text}`}>
                                                        <badgeStyle.icon className="w-3.5 h-3.5" />
                                                        {job.job_nature || 'Job'}
                                                    </span>
                                                </td>

                                                {/* Location */}
                                                <td className="px-4 py-3.5 max-w-[200px]">
                                                    <div className="flex items-center gap-2 text-[13px] text-gray-600 relative group/loc min-w-0">
                                                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                                        <span className="truncate">{workLocationText}</span>
                                                        <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/loc:block bg-gray-900 text-white text-[11px] font-medium rounded-lg py-1.5 px-2.5 z-[100] whitespace-nowrap shadow-xl">
                                                            {workLocationText}
                                                            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Date Posted */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <div className="flex flex-col justify-center">
                                                        <span className="text-[13px] text-gray-900 font-semibold">
                                                            {formatDate(job.created_at || job.createdAt)}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Date Approved */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {(job.approved_at || job.approval_status === 'approved') ? (
                                                        <div className="flex flex-col justify-center">
                                                            <span className="text-[13px] text-gray-900 font-semibold">
                                                                {formatDate(job.approved_at || job.created_at || job.createdAt)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-semibold text-amber-700 bg-amber-50 rounded-full border-1 border-amber-200/60">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Applied Candidates Count */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <a
                                                        href={`/admin/applications?search=${encodeURIComponent(jobTitleText)}`}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all ${(Number(job.applicants_count) > 0)
                                                            ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border-1 border-indigo-200/80 shadow-2xs'
                                                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200/60'
                                                            }`}
                                                        title={`View ${job.applicants_count || 0} applied candidates`}
                                                    >
                                                        <Users className={`w-3.5 h-3.5 ${Number(job.applicants_count) > 0 ? 'text-indigo-600' : 'text-gray-400'}`} />
                                                        <span>{job.applicants_count || 0}</span>
                                                        <span className="text-[11px] font-medium opacity-80">
                                                            Applied
                                                        </span>
                                                    </a>
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-full ${isActive
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                                        {isActive ? 'Active' : 'Closed'}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3.5 whitespace-nowrap text-center">
                                                    <div className="relative inline-block text-left">
                                                        <button
                                                            onClick={() => setOpenDropdown(openDropdown === (job.id || job._id) ? null : (job.id || job._id))}
                                                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all focus:outline-none"
                                                        >
                                                            <MoreVertical className="w-5 h-5" />
                                                        </button>
                                                        {openDropdown === (job.id || job._id) && (
                                                            <ActionsDropdown
                                                                job={job}
                                                                onClose={() => setOpenDropdown(null)}
                                                                onDelete={handleDeleteJob}
                                                                onToggleStatus={handleToggleStatus}
                                                                onApprove={(j) => openModal('approve', j.id, j.job_title)}
                                                                onReject={(j) => openModal('reject', j.id, j.job_title)}
                                                                onViewPreview={handleViewPreview}
                                                                isBottom={index >= paginatedJobs.length - 2 && paginatedJobs.length > 2}
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && matchedJobs > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between bg-white gap-4">
                        <div className="text-[13px] text-gray-500 sm:w-1/3">
                            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, matchedJobs)} to {Math.min(currentPage * itemsPerPage, matchedJobs)} of {matchedJobs.toLocaleString()} {activeFilter === 'Pending' ? 'pending jobs' : 'jobs'}
                        </div>
                        <div className="flex items-center justify-center gap-1.5 sm:w-1/3">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 flex items-center justify-center text-[13px] font-medium rounded-lg transition-all ${currentPage === pageNum
                                            ? 'text-indigo-600 border border-indigo-200 bg-indigo-50 font-bold'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <span className="text-gray-400 px-1">...</span>
                            )}
                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    className={`w-8 h-8 flex items-center justify-center text-[13px] font-medium rounded-lg transition-all text-gray-600 hover:bg-gray-50`}
                                >
                                    {totalPages}
                                </button>
                            )}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-[13px] text-gray-500 sm:w-1/3">
                            <span>Rows per page:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="border border-gray-200 rounded-lg px-2 py-1 font-medium text-gray-700 outline-none bg-white cursor-pointer hover:border-gray-300 transition-colors"
                            >
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 grid place-items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Job Post</h3>
                            <p className="text-gray-500 text-sm mb-0">
                                Are you sure you want to remove this job post? This action cannot be undone.
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-between gap-3 rounded-b-2xl">
                            <button
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setJobToDelete(null);
                                }}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteJob}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Post'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approval / Rejection Modal */}
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
                        ? '!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 hover:!border-emerald-700 !text-white'
                        : '!bg-red-600 hover:!bg-red-700 !border-red-600 hover:!border-red-700 !text-white',
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
                            ? `Are you sure you want to approve all ${globalStats.pending} pending jobs? They will become active and public immediately.`
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
}