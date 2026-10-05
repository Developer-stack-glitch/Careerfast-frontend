'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building, Users, Search, Plus,
    Eye, CreditCard, Clock, CheckCircle2, XCircle,
    KeyRound, RefreshCw, X, MoreVertical, Edit3, Sliders,
    ArrowUpDown, AlertTriangle, Check, Mail, MessageSquare, FileSpreadsheet,
    LogIn, ExternalLink, ChevronDown, Trash2
} from 'lucide-react';
import {
    getAdminRecruiters,
    getAdminPlans,
    updateAdminRecruiterStatus,
    toggleAdminRecruiterAutoApprove,
    changeAdminRecruiterPlan,
    loginAsRecruiter,
    deleteAdminRecruiter
} from '../ApiService/action';
import AdminDateFilter from './AdminDateFilter';
import AdminSelect from './AdminSelect';
import CustomPlanModal from './CustomPlanModal';
import ChangePlanModal from './ChangePlanModal';
import ExtendSubscriptionModal from './ExtendSubscriptionModal';
import ResetPasswordModal from './ResetPasswordModal';
import DeleteRecruiterModal from './DeleteRecruiterModal';
import { getImageUrl } from '../utils/getImageUrl';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

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

const ActionsDropdown = ({ rec, router, setChangePlanRecruiter, setCustomPlanRecruiter, handleToggleStatus, handleDeleteRecruiter, handleLoginAsRecruiter, onClose, isBottom }) => {
    const ref = useRef(null);
    const [openUp, setOpenUp] = useState(isBottom);

    React.useLayoutEffect(() => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 20 || isBottom) {
                setOpenUp(true);
            }
        }
    }, [isBottom]);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    return (
        <div
            ref={ref}
            className={`absolute right-0 ${openUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} w-56 bg-white rounded-xl shadow-2xl border border-slate-200/90 py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150`}
        >
            {/* 1. View Details */}
            <button
                onClick={() => { router.push(`/admin/recruiters/${rec.recruiter_id}`); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>View Details</span>
            </button>

            {/* 2. Edit Plan */}
            <button
                onClick={() => {
                    if (rec.plan_type === 'custom' || /custom/i.test(rec.plan_name || '')) {
                        setCustomPlanRecruiter(rec);
                    } else {
                        setChangePlanRecruiter(rec);
                    }
                    onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
            >
                <Edit3 className="w-3.5 h-3.5 text-purple-600" />
                <span>Edit Plan</span>
            </button>

            <div className="my-1 border-t border-slate-100"></div>

            {/* 3. Suspend / Activate Account */}
            <button
                onClick={() => { handleToggleStatus(rec); onClose(); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium transition-colors ${rec.user_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
            >
                {rec.user_active ? <XCircle className="w-3.5 h-3.5 text-amber-600" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{rec.user_active ? 'Suspend Account' : 'Activate Account'}</span>
            </button>

            {/* 4. Delete Account */}
            <button
                onClick={() => { handleDeleteRecruiter(rec); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Account</span>
            </button>

            <div className="my-1 border-t border-slate-100"></div>

            {/* 5. Login as Recruiter */}
            <button
                onClick={() => { handleLoginAsRecruiter(rec); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-semibold text-blue-700 bg-blue-50/60 hover:bg-blue-100/80 transition-colors group/login"
            >
                <LogIn className="w-3.5 h-3.5 text-blue-600 group-hover/login:translate-x-0.5 transition-transform" />
                <span>Login as Recruiter</span>
                <ExternalLink className="w-3 h-3 text-blue-400 ml-auto" />
            </button>
        </div>
    );
};

export default function RecruitersList() {
    const router = useRouter();
    const [recruiters, setRecruiters] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [openPlanDropdown, setOpenPlanDropdown] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'start_date', direction: 'desc' });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState({ preset: 'All Time', startDate: '', endDate: '', label: 'All Time' });

    // Modals
    const [changePlanRecruiter, setChangePlanRecruiter] = useState(null);
    const [extendRecruiter, setExtendRecruiter] = useState(null);
    const [resetPassRecruiter, setResetPassRecruiter] = useState(null);
    const [customPlanRecruiter, setCustomPlanRecruiter] = useState(null);
    const [deleteRecruiterModal, setDeleteRecruiterModal] = useState(null);

    // Horizontal scroll state for responsive sticky column shrinking
    const [isScrolledX, setIsScrolledX] = useState(false);

    const handleTableScroll = (e) => {
        const scrollLeft = e?.currentTarget?.scrollLeft || 0;
        if (scrollLeft > 25 && !isScrolledX) {
            setIsScrolledX(true);
        } else if (scrollLeft <= 25 && isScrolledX) {
            setIsScrolledX(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedPlanId, statusFilter, subscriptionStatusFilter, dateFilter.startDate, dateFilter.endDate]);

    const loadData = async () => {
        try {
            setLoading(true);
            const promises = [
                getAdminRecruiters({
                    search: searchTerm,
                    planId: selectedPlanId,
                    status: statusFilter,
                    subscriptionStatus: subscriptionStatusFilter,
                    startDate: dateFilter.startDate,
                    endDate: dateFilter.endDate
                })
            ];
            if (plans.length === 0) {
                promises.push(getAdminPlans());
            }

            const [recRes, planRes] = await Promise.all(promises);

            if (recRes?.data?.success) {
                setRecruiters(recRes.data.data || []);
            }
            if (planRes?.data?.success) {
                setPlans(planRes.data.data || []);
            }
        } catch (error) {
            console.error("Error loading recruiters list:", error);
            toast.error("Failed to load recruiters directory.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.plan-dropdown-container')) {
                setOpenPlanDropdown(null);
            }
            if (!e.target.closest('.action-dropdown-container')) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleSearchSubmit = (e) => {
        e?.preventDefault();
        loadData();
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedPlanId('');
        setStatusFilter('');
        setSubscriptionStatusFilter('');
        setDateFilter({ preset: 'All Time', startDate: '', endDate: '', label: 'All Time' });
    };

    const hasActiveFilters = Boolean(searchTerm || selectedPlanId || statusFilter || subscriptionStatusFilter || dateFilter.startDate || dateFilter.endDate);

    const sortedRecruiters = React.useMemo(() => {
        let sortable = [...recruiters];
        if (sortConfig.key) {
            sortable.sort((a, b) => {
                let aValue, bValue;
                switch (sortConfig.key) {
                    case 'company':
                        aValue = (a.company_name || 'Individual Recruiter').toLowerCase();
                        bValue = (b.company_name || 'Individual Recruiter').toLowerCase();
                        break;
                    case 'recruiter':
                        aValue = (a.recruiter_name || a.first_name || '').toLowerCase();
                        bValue = (b.recruiter_name || b.first_name || '').toLowerCase();
                        break;
                    case 'plan':
                        aValue = (a.plan_name || 'No Plan').toLowerCase();
                        bValue = (b.plan_name || 'No Plan').toLowerCase();
                        break;
                    case 'status':
                        aValue = (!a.user_active ? 'suspended' : (a.subscription_status || 'active')).toLowerCase();
                        bValue = (!b.user_active ? 'suspended' : (b.subscription_status || 'active')).toLowerCase();
                        break;
                    case 'sub_recruiters':
                        aValue = Number(a.sub_recruiter_limit || 0);
                        bValue = Number(b.sub_recruiter_limit || 0);
                        break;
                    case 'job_post':
                        aValue = Number(a.job_post_limit || 0);
                        bValue = Number(b.job_post_limit || 0);
                        break;
                    case 'resume_views':
                        aValue = Number(a.resume_view_limit || 0);
                        bValue = Number(b.resume_view_limit || 0);
                        break;
                    case 'resume_downloads':
                        aValue = Number(a.resume_download_limit || 0);
                        bValue = Number(b.resume_download_limit || 0);
                        break;
                    case 'email':
                        aValue = Number(a.email_limit || 0);
                        bValue = Number(b.email_limit || 0);
                        break;
                    case 'whatsapp':
                        aValue = Number(a.whatsapp_limit || 0);
                        bValue = Number(b.whatsapp_limit || 0);
                        break;
                    case 'excel':
                        aValue = Number(a.excel_downloads_used || 0);
                        bValue = Number(b.excel_downloads_used || 0);
                        break;
                    case 'start_date':
                        aValue = a.subscription_start ? new Date(a.subscription_start).getTime() : 0;
                        bValue = b.subscription_start ? new Date(b.subscription_start).getTime() : 0;
                        break;
                    case 'expiry_date':
                        aValue = a.subscription_expiry ? new Date(a.subscription_expiry).getTime() : 0;
                        bValue = b.subscription_expiry ? new Date(b.subscription_expiry).getTime() : 0;
                        break;
                    default:
                        aValue = '';
                        bValue = '';
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortable;
    }, [recruiters, sortConfig]);

    const handleToggleStatus = async (recruiter) => {
        try {
            const nextActive = recruiter.user_active ? 0 : 1;
            const res = await updateAdminRecruiterStatus(recruiter.recruiter_id, { is_active: nextActive });
            if (res?.data?.success) {
                toast.success(`Recruiter account ${nextActive ? 'activated' : 'suspended'}.`);
                loadData();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status.");
        }
    };

    const handleToggleAutoApprove = async (rec) => {
        try {
            const newStatus = rec.auto_approve ? 0 : 1;
            const res = await toggleAdminRecruiterAutoApprove(rec.recruiter_id, { auto_approve: newStatus });
            if (res.data?.success) {
                toast.success(res.data.message || `Auto approve ${newStatus ? 'enabled' : 'disabled'} successfully.`);
                setRecruiters(recruiters.map(r => r.recruiter_id === rec.recruiter_id ? { ...r, auto_approve: newStatus } : r));
            } else {
                toast.error(res.data?.message || "Failed to update auto approve status.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update auto approve status.");
        }
    };

    const handleLoginAsRecruiter = async (rec) => {
        const recName = rec.recruiter_name?.trim() || `${rec.first_name || ''} ${rec.last_name || ''}`.trim() || rec.company_name || 'Recruiter';
        const toastId = toast.loading(`Generating recruiter session for ${recName}...`);
        try {
            const res = await loginAsRecruiter(rec.recruiter_id);
            if (res.data?.success && res.data?.token) {
                toast.success(`Opening Recruiter Portal as ${recName}...`, { id: toastId });
                const hrBaseUrl = process.env.NEXT_PUBLIC_HR_PORTAL_URL || 'http://localhost:3001';
                const targetUrl = `${hrBaseUrl}/login?impersonate_token=${encodeURIComponent(res.data.token)}&impersonate_data=${encodeURIComponent(JSON.stringify(res.data.data))}&target=/overview`;
                window.open(targetUrl, '_blank');
            } else {
                toast.error(res.data?.message || "Failed to login as recruiter.", { id: toastId });
            }
        } catch (err) {
            console.error("Error in handleLoginAsRecruiter:", err);
            toast.error(err?.response?.data?.message || err?.message || "Failed to login as recruiter.", { id: toastId });
        }
    };

    const handleDeleteRecruiter = (rec) => {
        setDeleteRecruiterModal(rec);
    };

    const handleQuickChangePlan = async (rec, planId) => {
        try {
            const res = await changeAdminRecruiterPlan(rec.recruiter_id, {
                new_plan_id: planId,
                effective_type: 'immediately',
                reason: 'Quick plan change via table dropdown'
            });
            if (res?.data?.success) {
                toast.success(res.data.message || "Plan updated successfully!");
                loadData();
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Failed to change plan.");
        }
    };

    // Format dates cleanly without wrapping
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Check expiry proximity
    const getDaysRemaining = (expiryDate) => {
        if (!expiryDate) return null;
        const d = new Date(expiryDate);
        if (isNaN(d.getTime())) return null;
        const diff = Math.ceil((d.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    // Format relative time
    const formatRelativeTime = (dateString) => {
        if (!dateString) return null;
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return null;
            return formatDistanceToNow(d, { addSuffix: true });
        } catch (e) {
            return null;
        }
    };

    return (
        <div className="w-full max-w-9xl mx-auto font-sans pb-16 px-1 sm:px-2">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border-1 border-blue-100 flex items-center justify-center text-blue-600">
                            <Building className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-0">
                                Recruiters & Companies
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5 mb-0">
                                Manage corporate recruiters, subscription quotas, and account statuses
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => router.push('/admin/recruiters/create')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Recruiter</span>
                    </button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
                {/* Total Recruiters */}
                <div className="bg-white rounded-2xl p-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Total Recruiters</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">{recruiters.length}</span>
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border-1 border-emerald-100">
                            {recruiters.filter(r => r.user_active).length} Active
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 mb-0">Registered hiring accounts</p>
                </div>

                {/* Paid Subscriptions */}
                <div className="bg-white rounded-2xl p-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Active Plans</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CreditCard className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-emerald-600">
                            {recruiters.filter(r => r.subscription_status === 'Active').length}
                        </span>
                        <span className="text-[11px] text-slate-500">plan holders</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 mb-0">Currently active billing</p>
                </div>

                {/* Expiring Soon */}
                <div className="bg-white rounded-2xl p-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Expiring Soon</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-amber-600">
                            {recruiters.filter(r => {
                                const diff = getDaysRemaining(r.subscription_expiry);
                                return diff !== null && diff > 0 && diff <= 7;
                            }).length}
                        </span>
                        <span className="text-[11px] text-amber-600 font-medium">Within 7 days</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 mb-0">May require renewal</p>
                </div>

                {/* Suspended / Expired */}
                <div className="bg-white rounded-2xl p-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-600">Attention Needed</span>
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-rose-600">
                            {recruiters.filter(r => r.subscription_status === 'Expired' || !r.user_active).length}
                        </span>
                        <span className="text-[11px] text-rose-600 font-medium">Suspended / Expired</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 mb-0">Requires administrator review</p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl p-3 mb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search company, recruiter name, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm('');
                                loadData();
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </form>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Plan Filter */}
                    <AdminSelect
                        value={selectedPlanId}
                        onChange={setSelectedPlanId}
                        options={[
                            { value: '', label: 'All Plans' },
                            ...plans.filter(p => p.plan_type !== 'Custom' && !p.name.toLowerCase().includes('custom')).map(p => ({ value: p.id, label: p.name })),
                            { value: 'custom', label: 'Custom' }
                        ]}
                        placeholder="All Plans"
                    />

                    {/* Recruiter Login Status */}
                    <AdminSelect
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                            { value: '', label: 'All Accounts' },
                            { value: 'Active', label: 'Active Only' },
                            { value: 'Suspended', label: 'Suspended Only' },
                            { value: 'AutoApprove', label: 'Auto Approve Only' }
                        ]}
                        placeholder="All Accounts"
                    />

                    {/* Subscription Status Filter */}
                    <AdminSelect
                        value={subscriptionStatusFilter}
                        onChange={setSubscriptionStatusFilter}
                        options={[
                            { value: '', label: 'All Subscriptions' },
                            { value: 'Active', label: 'Active' },
                            { value: 'Trial', label: 'Trial' },
                            { value: 'Expired', label: 'Expired' },
                            { value: 'Suspended', label: 'Suspended' }
                        ]}
                        placeholder="All Subscriptions"
                    />

                    {/* Date Filter */}
                    <AdminDateFilter value={dateFilter} onChange={setDateFilter} />

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors whitespace-nowrap"
                        >
                            Reset
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={loadData}
                        className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl text-slate-600 transition-colors"
                        title="Reload directory"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Recruiters Master Table Container */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xs">
                {loading ? (
                    <div className="overflow-x-auto relative">
                        <table className="w-full text-left border-collapse min-w-[1620px]">
                            <thead className="sticky top-0 z-20 bg-slate-50 shadow-xs">
                                <tr className="border-b border-slate-200/80 bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="sticky top-0 left-0 z-30 bg-slate-50 py-3.5 px-4 w-[210px] min-w-[210px]">Company</th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[185px]">Recruiter</th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[125px]">Plan & Cycle</th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[155px]">Job Posts</th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[115px]">Sub-Recruiters</th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[115px]">Resume View</th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[125px]">Resume Download</th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[110px]">Email</th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[110px]">WhatsApp</th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[120px]">Excel Export</th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[130px]">Validity</th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 text-right w-[65px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="sticky left-0 z-10 bg-white py-4 px-4 w-[210px] min-w-[210px]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0"></div>
                                                <div className="space-y-1.5 flex-1">
                                                    <div className="h-4 w-28 bg-slate-200 rounded"></div>
                                                    <div className="h-3 w-20 bg-slate-200 rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 space-y-1.5">
                                            <div className="h-4 w-32 bg-slate-200 rounded"></div>
                                            <div className="h-3 w-24 bg-slate-200 rounded"></div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="h-6 w-20 bg-slate-200 rounded-lg"></div>
                                        </td>
                                        <td className="py-4 px-4 space-y-1">
                                            <div className="h-3.5 w-16 bg-slate-200 rounded"></div>
                                            <div className="h-2 w-20 bg-slate-200 rounded-full"></div>
                                        </td>
                                        <td className="py-4 px-4 space-y-1.5">
                                            <div className="h-3.5 w-24 bg-slate-200 rounded"></div>
                                            <div className="h-2 w-28 bg-slate-200 rounded-full"></div>
                                            <div className="h-5 w-24 bg-slate-200 rounded-lg"></div>
                                        </td>
                                        <td className="py-4 px-4 space-y-1">
                                            <div className="h-3.5 w-16 bg-slate-200 rounded"></div>
                                            <div className="h-2 w-20 bg-slate-200 rounded-full"></div>
                                        </td>
                                        <td className="py-4 px-4 space-y-1">
                                            <div className="h-3.5 w-16 bg-slate-200 rounded"></div>
                                            <div className="h-2 w-20 bg-slate-200 rounded-full"></div>
                                        </td>
                                        <td className="py-4 px-4 space-y-1">
                                            <div className="h-3.5 w-16 bg-slate-200 rounded"></div>
                                            <div className="h-2 w-20 bg-slate-200 rounded-full"></div>
                                        </td>
                                        <td className="py-4 px-4 space-y-1">
                                            <div className="h-3.5 w-16 bg-slate-200 rounded"></div>
                                            <div className="h-2 w-20 bg-slate-200 rounded-full"></div>
                                        </td>
                                        <td className="py-4 px-4 space-y-1">
                                            <div className="h-3.5 w-16 bg-slate-200 rounded"></div>
                                            <div className="h-2 w-20 bg-slate-200 rounded-full"></div>
                                        </td>
                                        <td className="py-4 px-4 space-y-1.5">
                                            <div className="h-3.5 w-20 bg-slate-200 rounded"></div>
                                            <div className="h-3 w-16 bg-slate-200 rounded"></div>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="w-8 h-8 rounded-lg bg-slate-200 ml-auto"></div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : recruiters.length === 0 ? (
                    <div className="py-20 text-center px-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                            <Building className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">No recruiters found</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            {hasActiveFilters
                                ? "No recruiter matches the current search or filter criteria. Try resetting the filters."
                                : "You haven't added any recruiters yet. Click below to add one."}
                        </p>
                        {hasActiveFilters ? (
                            <button
                                onClick={handleClearFilters}
                                className="mt-3 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                            >
                                Clear All Filters
                            </button>
                        ) : (
                            <button
                                onClick={() => router.push('/admin/recruiters/create')}
                                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                + Add Recruiter Now
                            </button>
                        )}
                    </div>
                ) : (
                    <div
                        onScroll={handleTableScroll}
                        className="overflow-x-auto pb-3 relative scroll-smooth"
                    >
                        <table className="w-full text-left border-collapse min-w-[1620px]">
                            <thead className="sticky top-0 z-20 bg-slate-50 shadow-xs">
                                <tr className="border-b border-slate-200/80 bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider select-none">
                                    <th
                                        className={`sticky top-0 left-0 z-30 bg-slate-50 py-3.5 cursor-pointer hover:bg-slate-100/60 transition-all duration-300 ${isScrolledX ? 'w-[155px] min-w-[155px] px-3' : 'w-[210px] min-w-[210px] px-4'
                                            }`}
                                        onClick={() => setSortConfig({ key: 'company', direction: sortConfig.key === 'company' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                        title="Sort by Company"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <Building className="w-3.5 h-3.5 opacity-60 shrink-0" />
                                            <span className="whitespace-nowrap">Company</span>
                                            <ArrowUpDown className="w-3 h-3 opacity-50 shrink-0" />
                                        </div>
                                    </th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[185px] cursor-pointer hover:bg-slate-100/50" onClick={() => setSortConfig({ key: 'recruiter', direction: sortConfig.key === 'recruiter' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        <div className="flex items-center gap-1">Recruiter <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                                    </th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[125px] cursor-pointer hover:bg-slate-100/50" onClick={() => setSortConfig({ key: 'plan', direction: sortConfig.key === 'plan' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        <div className="flex items-center gap-1">Plan & Cycle <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                                    </th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[155px] cursor-pointer hover:bg-slate-100/50" onClick={() => setSortConfig({ key: 'job_post', direction: sortConfig.key === 'job_post' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        <div className="flex items-center gap-1">Job Posts <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                                    </th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[115px] cursor-pointer hover:bg-slate-100/50" onClick={() => setSortConfig({ key: 'sub_recruiters', direction: sortConfig.key === 'sub_recruiters' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        <div className="flex items-center gap-1">Sub-Recruiters <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                                    </th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[115px] cursor-pointer hover:bg-slate-100/50" onClick={() => setSortConfig({ key: 'resume_views', direction: sortConfig.key === 'resume_views' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        <div className="flex items-center gap-1">Resume View <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                                    </th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[125px] cursor-pointer hover:bg-slate-100/50" onClick={() => setSortConfig({ key: 'resume_downloads', direction: sortConfig.key === 'resume_downloads' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        <div className="flex items-center gap-1">Resume Download <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                                    </th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[110px] cursor-pointer hover:bg-slate-100/50" onClick={() => setSortConfig({ key: 'email', direction: sortConfig.key === 'email' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        <div className="flex items-center gap-1">Email <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                                    </th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[110px] cursor-pointer hover:bg-slate-100/50" onClick={() => setSortConfig({ key: 'whatsapp', direction: sortConfig.key === 'whatsapp' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        <div className="flex items-center gap-1">WhatsApp <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                                    </th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[120px] cursor-pointer hover:bg-slate-100/50" onClick={() => setSortConfig({ key: 'excel', direction: sortConfig.key === 'excel' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        <div className="flex items-center gap-1">Excel Export <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                                    </th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 w-[130px] cursor-pointer hover:bg-slate-100/50" onClick={() => setSortConfig({ key: 'expiry_date', direction: sortConfig.key === 'expiry_date' && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                                        <div className="flex items-center gap-1">Validity <ArrowUpDown className="w-3 h-3 opacity-50" /></div>
                                    </th>
                                    <th className="sticky top-0 z-20 bg-slate-50 py-3.5 px-4 text-right w-[65px] whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedRecruiters.map((rec, idx) => {
                                    const isBottom = idx >= Math.max(1, sortedRecruiters.length - 4) || (sortedRecruiters.length <= 6 && idx >= 2);
                                    const recruiterName = rec.recruiter_name?.trim() || `${rec.first_name || ''} ${rec.last_name || ''}`.trim() || 'Recruiter';
                                    const companyName = rec.company_name || 'Individual Recruiter';
                                    const hasPlan = Boolean(rec.plan_name && rec.plan_name !== 'No Plan');
                                    const planName = hasPlan ? rec.plan_name : 'No Plan';

                                    const jobPostsUsed = Number(rec.job_posts_used || 0);
                                    const jobPostLimit = Number(rec.job_post_limit || 0);
                                    const jobPercent = jobPostLimit > 0 ? Math.round((jobPostsUsed / jobPostLimit) * 100) : 0;
                                    const activeJobsCount = Number(rec.active_jobs_count || 0);
                                    const activeJobLimit = Number(rec.active_job_limit || 0);

                                    const resumeUsed = Number(rec.resume_views_used || 0);
                                    const resumeLimit = Number(rec.resume_view_limit || 0);
                                    const resumePercent = resumeLimit > 0 ? Math.round((resumeUsed / resumeLimit) * 100) : 0;

                                    const resumeDownloadsUsed = Number(rec.resume_downloads_used || 0);
                                    const resumeDownloadLimit = Number(rec.resume_download_limit || 0);
                                    const resumeDownloadPercent = resumeDownloadLimit > 0 ? Math.round((resumeDownloadsUsed / resumeDownloadLimit) * 100) : 0;

                                    const subRecruitersCount = Number(rec.sub_recruiters_count || 0);
                                    const subRecruiterLimit = hasPlan ? Number(rec.sub_recruiter_limit || 1) : 0;
                                    const subPercent = subRecruiterLimit > 0 ? Math.round((subRecruitersCount / subRecruiterLimit) * 100) : 0;

                                    const emailsUsed = Number(rec.emails_used || 0);
                                    const emailLimit = Number(rec.email_limit || 0);
                                    const emailPercent = emailLimit > 0 ? Math.round((emailsUsed / emailLimit) * 100) : 0;

                                    const whatsappUsed = Number(rec.whatsapp_used || 0);
                                    const whatsappLimit = Number(rec.whatsapp_limit || 0);
                                    const whatsappPercent = whatsappLimit > 0 ? Math.round((whatsappUsed / whatsappLimit) * 100) : 0;

                                    const excelUsed = Number(rec.excel_downloads_used || 0);
                                    const excelLimit = Number(rec.excel_download_limit || 0);
                                    const excelPercent = excelLimit > 0 ? Math.round((excelUsed / excelLimit) * 100) : 0;
                                    const excelLeft = Math.max(0, excelLimit - excelUsed);

                                    const isSubActive = rec.subscription_status === 'Active';
                                    const isSubExpired = rec.subscription_status === 'Expired';
                                    const isSubSuspended = rec.subscription_status === 'Suspended';
                                    const isSubTrial = rec.subscription_status === 'Trial';
                                    const isUserActive = Boolean(rec.user_active);

                                    const daysRemaining = getDaysRemaining(rec.subscription_expiry);

                                    // Plan badge styling
                                    const isCustom = /custom/i.test(planName);
                                    const displayPlanName = isCustom ? 'Custom' : planName;
                                    const isPremium = /premium|enterprise|vip|gold/i.test(planName);
                                    const isStandard = /standard|silver|growth|pro/i.test(planName);

                                    return (
                                        <tr
                                            key={rec.recruiter_id}
                                            className="hover:bg-slate-50/75 transition-colors group"
                                        >
                                            {/* 1. Company (Shrinks smoothly while keeping name & logo visible) */}
                                            <td
                                                className={`sticky left-0 z-10 bg-white group-hover:bg-slate-50 transition-all duration-300 py-3.5 ${isScrolledX ? 'w-[155px] min-w-[155px] px-3' : 'w-[210px] min-w-[210px] px-4'
                                                    }`}
                                            >
                                                <div className={`flex items-center ${isScrolledX ? 'gap-2' : 'gap-3'} transition-all duration-300`}>
                                                    {/* Company Logo / Avatar */}
                                                    <div
                                                        onClick={() => router.push(`/admin/recruiters/${rec.recruiter_id}`)}
                                                        className="relative shrink-0 cursor-pointer"
                                                        title={companyName}
                                                    >
                                                        {(() => {
                                                            const logoSrc = rec.company_logo || rec.profile_image || rec.user_avatar;
                                                            return logoSrc ? (
                                                                <div className={`rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-2xs border border-slate-100 p-0.5 transition-all duration-300 ${isScrolledX ? 'w-8 h-8 rounded-lg' : 'w-11 h-11 rounded-xl'
                                                                    }`}>
                                                                    <img
                                                                        src={getImageUrl(logoSrc)}
                                                                        alt={companyName}
                                                                        className="w-full h-full object-cover rounded-md"
                                                                        onError={(e) => {
                                                                            e.currentTarget.parentElement.classList.remove('bg-white', 'border', 'border-slate-100');
                                                                            e.currentTarget.parentElement.classList.add('bg-gradient-to-br', ...getCompanyAvatarGradient(companyName).split(' '));
                                                                            e.currentTarget.replaceWith(document.createTextNode(companyName[0]?.toUpperCase() || 'C'));
                                                                        }}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className={`flex items-center justify-center font-bold text-white shadow-2xs shrink-0 overflow-hidden bg-gradient-to-br ${getCompanyAvatarGradient(companyName)} transition-all duration-300 ${isScrolledX ? 'w-8 h-8 rounded-lg text-xs' : 'w-11 h-11 rounded-xl text-sm'
                                                                    }`}>
                                                                    {companyName[0]?.toUpperCase() || 'C'}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>

                                                    {/* Company Name & Status */}
                                                    <div className="min-w-0 flex-1 relative group/comp">
                                                        <div
                                                            onClick={() => router.push(`/admin/recruiters/${rec.recruiter_id}`)}
                                                            className={`font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-all duration-300 truncate ${isScrolledX ? 'text-xs max-w-[95px]' : 'text-sm max-w-[145px]'
                                                                }`}
                                                            title={companyName}
                                                        >
                                                            {companyName}
                                                        </div>

                                                        {/* Elegant Floating Tooltip on Hover */}
                                                        <div className="pointer-events-none absolute left-0 bottom-full mb-2 z-[100] hidden group-hover/comp:flex flex-col items-start bg-slate-900 text-white rounded-xl py-1.5 px-3 shadow-2xl shadow-slate-900/30 border border-slate-700/60 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                                                            <span className="text-xs font-medium text-white">{companyName}</span>
                                                            {rec.email && (
                                                                <span className="text-[10.5px] text-slate-300 font-normal">{rec.email}</span>
                                                            )}
                                                            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-900" />
                                                        </div>

                                                        {/* Status with Indication */}
                                                        <div className={`flex items-center gap-1 mt-0.5 whitespace-nowrap transition-all duration-300 ${isScrolledX ? 'text-[10px]' : 'text-[11px]'
                                                            }`}>
                                                            {!isUserActive ? (
                                                                <>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                                                    <span className="font-semibold text-rose-600">Suspended</span>
                                                                </>
                                                            ) : isSubActive ? (
                                                                <>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                                    <span className="font-semibold text-emerald-600">Active</span>
                                                                </>
                                                            ) : isSubTrial ? (
                                                                <>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                                                    <span className="font-semibold text-blue-600">Trial</span>
                                                                </>
                                                            ) : isSubExpired ? (
                                                                <>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                                                    <span className="font-semibold text-amber-600">Expired</span>
                                                                </>
                                                            ) : isSubSuspended ? (
                                                                <>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                                                    <span className="font-semibold text-amber-600">Suspended</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                                                    <span className="font-medium text-slate-500">No Plan</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 2. Recruiter */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-xs text-slate-900 truncate max-w-[185px]">
                                                    {recruiterName}
                                                </div>
                                                <div className="text-[11px] text-slate-400 truncate max-w-[185px] mt-0.5 font-mono" title={rec.email}>
                                                    {rec.email || '—'}
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${rec.last_active && (new Date().getTime() - new Date(rec.last_active).getTime()) < 3600000 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                    <span className="truncate">
                                                        {rec.last_active ? `Active ${formatRelativeTime(rec.last_active)}` : 'No recent login'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* 3. Plan & Cycle */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="relative inline-block plan-dropdown-container">
                                                    {hasPlan ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setOpenPlanDropdown(openPlanDropdown === idx ? null : idx)}
                                                            className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer select-none transition-all duration-150 border-1 shadow-2xs hover:shadow-xs active:scale-95 ${isCustom
                                                                ? 'bg-amber-50 text-amber-800 border-amber-200/90 hover:bg-amber-100 hover:border-amber-300'
                                                                : isPremium
                                                                    ? 'bg-purple-50 text-purple-800 border-purple-200/90 hover:bg-purple-100 hover:border-purple-300'
                                                                    : isStandard
                                                                        ? 'bg-blue-50 text-blue-800 border-blue-200/90 hover:bg-blue-100 hover:border-blue-300'
                                                                        : 'bg-emerald-50 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100 hover:border-emerald-300'
                                                                }`}
                                                            title="Click to switch or change plan"
                                                        >
                                                            <span>{displayPlanName}</span>
                                                            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${openPlanDropdown === idx ? 'rotate-180 text-slate-800' : 'opacity-60 group-hover:opacity-100'}`} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setOpenPlanDropdown(openPlanDropdown === idx ? null : idx)}
                                                            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border-1 border-slate-200 cursor-pointer select-none hover:bg-slate-200 shadow-2xs active:scale-95"
                                                            title="Click to assign a plan"
                                                        >
                                                            <span>No Plan</span>
                                                            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${openPlanDropdown === idx ? 'rotate-180 text-slate-800' : 'opacity-60 group-hover:opacity-100'}`} />
                                                        </button>
                                                    )}

                                                    {/* Plan Dropdown */}
                                                    {openPlanDropdown === idx && (
                                                        <div
                                                            className="absolute left-0 mt-1 w-44 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 z-[100] whitespace-normal"
                                                            style={{
                                                                bottom: isBottom ? '100%' : 'auto',
                                                                top: isBottom ? 'auto' : '100%',
                                                                marginBottom: isBottom ? '0.25rem' : '0'
                                                            }}
                                                        >
                                                            <div className="px-3.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
                                                                Change Plan
                                                            </div>
                                                            {plans.filter(p => p.plan_type !== 'Custom' && !p.name.toLowerCase().includes('custom')).map(p => (
                                                                <button
                                                                    key={p.id}
                                                                    onClick={() => { setOpenPlanDropdown(null); handleQuickChangePlan(rec, p.id); }}
                                                                    className="block w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                                                >
                                                                    {p.name}
                                                                </button>
                                                            ))}
                                                            <div className="border-t border-gray-100 my-1"></div>
                                                            <div
                                                                onClick={() => { setOpenPlanDropdown(null); setCustomPlanRecruiter(rec); }}
                                                                className="group/custom relative flex items-center justify-between w-full text-left px-3.5 py-1.5 text-xs hover:bg-blue-50 transition-colors cursor-pointer"
                                                            >
                                                                <button className="text-slate-700 group-hover/custom:text-blue-700 flex-1 text-left">
                                                                    Custom
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setOpenPlanDropdown(null); setCustomPlanRecruiter(rec); }}
                                                                    className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors ml-2 shadow-sm"
                                                                    title="Edit Custom Limits"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 4. Job Posts (Primary Quota for All Plans) */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="text-xs">
                                                    <span className="font-bold text-slate-800">{jobPostsUsed}</span>
                                                    <span className="text-slate-400 font-normal"> / {jobPostLimit} Jobs</span>
                                                </div>
                                                <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${jobPercent >= 90
                                                            ? 'bg-rose-500'
                                                            : jobPercent >= 75
                                                                ? 'bg-amber-500'
                                                                : 'bg-blue-600'
                                                            }`}
                                                        style={{ width: `${Math.min(jobPercent, 100)}%` }}
                                                    />
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-1">
                                                    <span className="font-semibold text-slate-600">{activeJobsCount}</span> active {activeJobLimit > 0 ? `(${activeJobLimit} max)` : ''}
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                                                    <span className="text-slate-400">Last post: </span>
                                                    <span className="text-slate-600 font-semibold">
                                                        {rec.last_job_posted ? formatRelativeTime(rec.last_job_posted) : 'None yet'}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex items-center">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleAutoApprove(rec);
                                                        }}
                                                        className={`group inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer border-1 select-none shadow-2xs hover:shadow-xs active:scale-95 ${rec.auto_approve === 1
                                                            ? 'bg-emerald-50/90 text-emerald-800 border-emerald-300/80 hover:bg-emerald-100 hover:border-emerald-400'
                                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                                                            }`}
                                                        title={rec.auto_approve === 1 ? 'Auto Approve is currently ON (click to turn OFF)' : 'Auto Approve is currently OFF (click to turn ON)'}
                                                    >
                                                        {/* Modern Toggle Switch Slider */}
                                                        <span
                                                            className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${rec.auto_approve === 1 ? 'bg-emerald-500' : 'bg-slate-300'
                                                                }`}
                                                        >
                                                            <span
                                                                className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${rec.auto_approve === 1 ? 'translate-x-3.5' : 'translate-x-0.5'
                                                                    }`}
                                                            />
                                                        </span>
                                                        <span className="text-[10px] tracking-tight">
                                                            Auto Approve: <span className={`font-bold ${rec.auto_approve === 1 ? 'text-emerald-700' : 'text-slate-500'}`}>{rec.auto_approve === 1 ? 'ON' : 'OFF'}</span>
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>

                                            {/* 5. Sub-Recruiters (Custom Plan Only) */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {isCustom ? (
                                                    <>
                                                        <div className="text-xs">
                                                            <span className="font-bold text-slate-800">{subRecruitersCount}</span>
                                                            <span className="text-slate-400 font-normal"> / {subRecruiterLimit} Seats</span>
                                                        </div>
                                                        <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${subPercent >= 100
                                                                    ? 'bg-rose-500'
                                                                    : subPercent >= 75
                                                                        ? 'bg-amber-500'
                                                                        : 'bg-indigo-600'
                                                                    }`}
                                                                style={{ width: `${Math.min(subPercent, 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-1">
                                                            Team logins
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-300 text-sm font-semibold select-none" title="Requires Custom Plan">—</span>
                                                )}
                                            </td>



                                            {/* 7. Resume View (Custom Plan Only) */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {isCustom ? (
                                                    <>
                                                        <div className="text-xs">
                                                            <span className="font-bold text-slate-800">{resumeUsed}</span>
                                                            <span className="text-slate-400 font-normal"> / {resumeLimit} Views</span>
                                                        </div>
                                                        <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${resumePercent >= 90
                                                                    ? 'bg-rose-500'
                                                                    : resumePercent >= 75
                                                                        ? 'bg-amber-500'
                                                                        : 'bg-teal-500'
                                                                    }`}
                                                                style={{ width: `${Math.min(resumePercent, 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-[10px] text-teal-700 font-medium mt-1">
                                                            {Math.max(0, resumeLimit - resumeUsed)} left
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-300 text-sm font-semibold select-none" title="Requires Custom Plan">—</span>
                                                )}
                                            </td>

                                            {/* 8. Resume Download (Custom Plan Only) */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {isCustom ? (
                                                    <>
                                                        <div className="text-xs">
                                                            <span className="font-bold text-slate-800">{resumeDownloadsUsed}</span>
                                                            <span className="text-slate-400 font-normal"> / {resumeDownloadLimit} DLs</span>
                                                        </div>
                                                        <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${resumeDownloadPercent >= 90
                                                                    ? 'bg-rose-500'
                                                                    : resumeDownloadPercent >= 75
                                                                        ? 'bg-amber-500'
                                                                        : 'bg-purple-600'
                                                                    }`}
                                                                style={{ width: `${Math.min(resumeDownloadPercent, 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-[10px] text-purple-700 font-medium mt-1">
                                                            {Math.max(0, resumeDownloadLimit - resumeDownloadsUsed)} left
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-300 text-sm font-semibold select-none" title="Requires Custom Plan">—</span>
                                                )}
                                            </td>

                                            {/* 9. Email (Custom Plan Only) */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {isCustom ? (
                                                    <>
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                                                            <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                            <span className="font-bold text-slate-800">{emailsUsed}</span>
                                                            <span className="text-slate-400 font-normal"> / {emailLimit}</span>
                                                        </div>
                                                        <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${emailPercent >= 90
                                                                    ? 'bg-rose-500'
                                                                    : emailPercent >= 75
                                                                        ? 'bg-amber-500'
                                                                        : 'bg-blue-500'
                                                                    }`}
                                                                style={{ width: `${Math.min(emailPercent, 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-[10px] text-blue-700 font-medium mt-1">
                                                            {Math.max(0, emailLimit - emailsUsed)} left
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-300 text-sm font-semibold select-none" title="Requires Custom Plan">—</span>
                                                )}
                                            </td>

                                            {/* 10. WhatsApp (Custom Plan Only) */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {isCustom ? (
                                                    <>
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                                                            <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                            <span className="font-bold text-slate-800">{whatsappUsed}</span>
                                                            <span className="text-slate-400 font-normal"> / {whatsappLimit}</span>
                                                        </div>
                                                        <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${whatsappPercent >= 90
                                                                    ? 'bg-rose-500'
                                                                    : whatsappPercent >= 75
                                                                        ? 'bg-amber-500'
                                                                        : 'bg-emerald-500'
                                                                    }`}
                                                                style={{ width: `${Math.min(whatsappPercent, 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-[10px] text-emerald-700 font-medium mt-1">
                                                            {Math.max(0, whatsappLimit - whatsappUsed)} left
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-300 text-sm font-semibold select-none" title="Requires Custom Plan">—</span>
                                                )}
                                            </td>

                                            {/* 11. Excel Export (Custom Plan Only) */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {isCustom ? (
                                                    <>
                                                        <div className="flex items-center gap-1.5 text-xs">
                                                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                            <span className="font-bold text-slate-800">{excelUsed}</span>
                                                            <span className="text-slate-400 font-normal"> / {excelLimit}</span>
                                                        </div>
                                                        <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${excelPercent >= 90
                                                                    ? 'bg-rose-500'
                                                                    : excelPercent >= 75
                                                                        ? 'bg-amber-500'
                                                                        : 'bg-emerald-500'
                                                                    }`}
                                                                style={{ width: `${Math.min(excelPercent, 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-[10px] text-emerald-700 font-medium mt-1">
                                                            {excelLeft} left
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-300 text-sm font-semibold select-none" title="Requires Custom Plan">—</span>
                                                )}
                                            </td>

                                            {/* 12. Validity (Start & Expiry cleanly unified) */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="text-xs font-semibold text-slate-800">
                                                    {rec.subscription_expiry ? formatDate(rec.subscription_expiry) : 'No Expiry'}
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                    From: {rec.subscription_start ? formatDate(rec.subscription_start) : '—'}
                                                </div>
                                                {daysRemaining !== null && daysRemaining > 0 && (
                                                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-1 border-emerald-200/90 px-2 py-0.5 rounded-full">
                                                        <Check className="w-3 h-3" /> {daysRemaining} days left
                                                    </span>
                                                )}
                                                {daysRemaining !== null && daysRemaining <= 0 && isSubExpired && (
                                                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/90 px-2 py-0.5 rounded-full">
                                                        <X className="w-3 h-3" /> Expired
                                                    </span>
                                                )}
                                            </td>

                                            {/* 13. Actions */}
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <div className="relative inline-block text-left action-dropdown-container">
                                                    <button
                                                        onClick={() => setOpenDropdown(openDropdown === rec.recruiter_id ? null : rec.recruiter_id)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {openDropdown === rec.recruiter_id && (
                                                        <ActionsDropdown
                                                            rec={rec}
                                                            router={router}
                                                            setChangePlanRecruiter={setChangePlanRecruiter}
                                                            setCustomPlanRecruiter={setCustomPlanRecruiter}
                                                            handleToggleStatus={handleToggleStatus}
                                                            handleDeleteRecruiter={handleDeleteRecruiter}
                                                            handleLoginAsRecruiter={handleLoginAsRecruiter}
                                                            onClose={() => setOpenDropdown(null)}
                                                            isBottom={isBottom}
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Table Footer with Summary */}
                {!loading && recruiters.length > 0 && (
                    <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
                        <span>
                            Showing <strong className="text-slate-700">{recruiters.length}</strong> {recruiters.length === 1 ? 'recruiter' : 'recruiters'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                            Use action buttons to manage plans, extend validity, or toggle access.
                        </span>
                    </div>
                )}
            </div>

            {/* Change Plan Modal */}
            <ChangePlanModal
                recruiter={changePlanRecruiter}
                isOpen={Boolean(changePlanRecruiter)}
                onClose={() => setChangePlanRecruiter(null)}
                onSuccess={loadData}
                onOpenCustomPlan={(rec) => {
                    setChangePlanRecruiter(null);
                    setCustomPlanRecruiter(rec);
                }}
            />

            {/* Custom Plan Modal */}
            <CustomPlanModal
                recruiter={customPlanRecruiter}
                isOpen={Boolean(customPlanRecruiter)}
                onClose={() => setCustomPlanRecruiter(null)}
                onSuccess={loadData}
            />

            {/* Extend Subscription Modal */}
            <ExtendSubscriptionModal
                recruiter={extendRecruiter}
                isOpen={Boolean(extendRecruiter)}
                onClose={() => setExtendRecruiter(null)}
                onSuccess={loadData}
            />

            {/* Reset Password Modal */}
            <ResetPasswordModal
                recruiter={resetPassRecruiter}
                isOpen={Boolean(resetPassRecruiter)}
                onClose={() => setResetPassRecruiter(null)}
            />

            {/* Delete Confirmation Modal */}
            <DeleteRecruiterModal
                recruiter={deleteRecruiterModal}
                isOpen={Boolean(deleteRecruiterModal)}
                onClose={() => setDeleteRecruiterModal(null)}
                onSuccess={loadData}
            />
        </div>
    );
}

