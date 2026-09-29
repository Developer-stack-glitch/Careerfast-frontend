'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, ArrowLeft, Search,
    RefreshCw, Loader2, CreditCard, Calendar,
    Clock, CheckCircle2,
    ArrowUpDown, Download, ExternalLink,
    Check, X, ArrowUpRight, Zap,
    BarChart3, UserCheck, UserX, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
    getAdminPlans,
    getAdminPlanSubscribers,
    getAdminSubscriptions,
    updateAdminRecruiterStatus
} from '../ApiService/action';
import ChangePlanModal from './ChangePlanModal';
import ExtendSubscriptionModal from './ExtendSubscriptionModal';
import { getImageUrl } from '../utils/getImageUrl';
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

export default function PlanSubscribers({ planId = null }) {
    const router = useRouter();

    // Data states
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState(planId || 'ALL');
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('expiry_asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Active Action Modals
    const [changePlanRecruiter, setChangePlanRecruiter] = useState(null);
    const [extendRecruiter, setExtendRecruiter] = useState(null);

    // Initial Data Fetch
    useEffect(() => {
        loadData();
    }, [selectedPlanId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const subPromise = selectedPlanId && selectedPlanId !== 'ALL'
                ? getAdminPlanSubscribers(selectedPlanId)
                : getAdminSubscriptions();

            const [planRes, subRes] = await Promise.all([
                plans.length === 0 ? getAdminPlans() : Promise.resolve(null),
                subPromise
            ]);

            if (planRes?.data?.success) {
                setPlans(planRes.data.data || []);
            }

            if (subRes?.data?.success) {
                const data = subRes.data.data;
                const subsList = Array.isArray(data) ? data : (data?.subscriptions || []);
                setSubscribers(subsList);
            }
        } catch (err) {
            console.error("Failed to load plan subscribers data:", err);
            toast.error("Failed to load subscribers. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (sub) => {
        const isCurrentlyActive = sub.user_active === 1 || sub.user_active === true || sub.status === 'Active';
        const nextActive = isCurrentlyActive ? 0 : 1;
        const recruiterId = sub.recruiter_id || sub.user_id || sub.id;

        try {
            setActionLoadingId(recruiterId);
            const res = await updateAdminRecruiterStatus(recruiterId, { is_active: nextActive });
            if (res?.data?.success) {
                toast.success(`Recruiter account ${nextActive ? 'activated' : 'suspended'} successfully.`);
                loadData();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update recruiter account status.");
        } finally {
            setActionLoadingId(null);
        }
    };

    // Calculate days remaining helper
    const getDaysRemaining = (expiryDate) => {
        if (!expiryDate) return null;
        const d = new Date(expiryDate);
        if (isNaN(d.getTime())) return null;
        const now = new Date();
        const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    // Summary KPIs calculation
    const kpiSummary = useMemo(() => {
        const total = subscribers.length;
        let active = 0;
        let expiringSoon = 0;
        let expired = 0;
        let suspended = 0;
        let totalJobsUsed = 0;
        let totalJobsLimit = 0;

        subscribers.forEach(sub => {
            const daysLeft = getDaysRemaining(sub.expiry_date);
            const status = sub.status || sub.subscription_status;

            if (status === 'Suspended' || sub.user_active === 0) {
                suspended++;
            } else if (daysLeft !== null && daysLeft <= 0) {
                expired++;
            } else if (daysLeft !== null && daysLeft <= 7) {
                expiringSoon++;
                active++;
            } else {
                active++;
            }

            totalJobsUsed += Number(sub.job_posts_used || 0);
            totalJobsLimit += Number(sub.job_post_limit || 0);
        });

        return {
            total,
            active,
            expiringSoon,
            expired,
            suspended,
            totalJobsUsed,
            totalJobsLimit,
            quotaHealth: totalJobsLimit > 0 ? Math.round((totalJobsUsed / totalJobsLimit) * 100) : 0
        };
    }, [subscribers]);

    // Filtering and Sorting
    const filteredAndSortedSubscribers = useMemo(() => {
        let result = subscribers.filter(sub => {
            const company = (sub.company_name || '').toLowerCase();
            const recruiter = (sub.recruiter_name || `${sub.first_name || ''} ${sub.last_name || ''}`).toLowerCase();
            const email = (sub.recruiter_email || sub.email || '').toLowerCase();
            const search = searchTerm.toLowerCase();

            const matchesSearch = !searchTerm || company.includes(search) || recruiter.includes(search) || email.includes(search);

            const daysLeft = getDaysRemaining(sub.expiry_date);
            const rawStatus = sub.status || sub.subscription_status || 'Active';

            let matchesStatus = true;
            if (statusFilter === 'Active') {
                matchesStatus = rawStatus === 'Active' && (daysLeft === null || daysLeft > 0) && (sub.user_active !== 0);
            } else if (statusFilter === 'Expiring Soon') {
                matchesStatus = daysLeft !== null && daysLeft > 0 && daysLeft <= 7 && rawStatus !== 'Suspended';
            } else if (statusFilter === 'Expired') {
                matchesStatus = rawStatus === 'Expired' || (daysLeft !== null && daysLeft <= 0);
            } else if (statusFilter === 'Suspended') {
                matchesStatus = rawStatus === 'Suspended' || sub.user_active === 0;
            }

            return matchesSearch && matchesStatus;
        });

        // Sorting
        result.sort((a, b) => {
            if (sortBy === 'expiry_asc') {
                const dateA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
                const dateB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
                return dateA - dateB;
            }
            if (sortBy === 'expiry_desc') {
                const dateA = a.expiry_date ? new Date(a.expiry_date).getTime() : 0;
                const dateB = b.expiry_date ? new Date(b.expiry_date).getTime() : 0;
                return dateB - dateA;
            }
            if (sortBy === 'usage_desc') {
                return (Number(b.job_posts_used) || 0) - (Number(a.job_posts_used) || 0);
            }
            if (sortBy === 'company_asc') {
                return (a.company_name || '').localeCompare(b.company_name || '');
            }
            if (sortBy === 'created_desc') {
                const dateA = a.created_at || a.start_date ? new Date(a.created_at || a.start_date).getTime() : 0;
                const dateB = b.created_at || b.start_date ? new Date(b.created_at || b.start_date).getTime() : 0;
                return dateB - dateA;
            }
            return 0;
        });

        return result;
    }, [subscribers, searchTerm, statusFilter, sortBy]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredAndSortedSubscribers.length / itemsPerPage) || 1;
    const paginatedSubscribers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedSubscribers.slice(start, start + itemsPerPage);
    }, [filteredAndSortedSubscribers, currentPage, itemsPerPage]);

    // Reset pagination on filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, selectedPlanId, sortBy]);

    // Export to CSV functionality
    const handleExportCSV = () => {
        if (filteredAndSortedSubscribers.length === 0) {
            toast.error("No subscriber data to export.");
            return;
        }

        const headers = ["Company Name", "Recruiter Name", "Email", "Phone", "Plan Name", "Billing Cycle", "Price", "Start Date", "Expiry Date", "Days Left", "Jobs Used", "Jobs Limit", "Status"];
        const rows = filteredAndSortedSubscribers.map(sub => {
            const recruiterName = sub.recruiter_name || `${sub.first_name || ''} ${sub.last_name || ''}`.trim() || 'N/A';
            const email = sub.recruiter_email || sub.email || 'N/A';
            const phone = sub.recruiter_phone || sub.phone || 'N/A';
            const days = getDaysRemaining(sub.expiry_date);
            return [
                `"${(sub.company_name || 'Individual').replace(/"/g, '""')}"`,
                `"${recruiterName.replace(/"/g, '""')}"`,
                `"${email}"`,
                `"${phone}"`,
                `"${sub.plan_name || 'Custom'}"`,
                `"${sub.billing_cycle || 'monthly'}"`,
                `"${sub.price_paid || sub.plan_price || 0}"`,
                `"${sub.start_date ? new Date(sub.start_date).toLocaleDateString() : 'N/A'}"`,
                `"${sub.expiry_date ? new Date(sub.expiry_date).toLocaleDateString() : 'N/A'}"`,
                `"${days !== null ? days : 'N/A'}"`,
                `"${sub.job_posts_used || 0}"`,
                `"${sub.job_post_limit || 0}"`,
                `"${sub.status || sub.subscription_status || 'Active'}"`
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `plan_subscribers_${selectedPlanId}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Subscriber directory exported successfully!");
    };

    const currentPlanObj = plans.find(p => String(p.id) === String(selectedPlanId));
    const isFiltered = searchTerm !== '' || statusFilter !== 'ALL' || selectedPlanId !== 'ALL';

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="w-full max-w-7xl mx-auto font-sans pb-16 px-2 sm:px-4 space-y-5">
            {/* Top Navigation & Breadcrumb Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/admin/plans')}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all shadow-xs shrink-0"
                        title="Back to Plans Directory"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight mb-0">
                                {currentPlanObj ? `${currentPlanObj.name} Subscribers` : 'All Plan Subscribers'}
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                                {filteredAndSortedSubscribers.length} {filteredAndSortedSubscribers.length === 1 ? 'Subscription' : 'Subscriptions'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 mb-0">
                            Manage recruiter memberships, usage allocations, renewals and subscription lifecycles.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Plan Filter Dropdown */}
                    <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                        <select
                            value={selectedPlanId}
                            onChange={(e) => setSelectedPlanId(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs sm:text-[13px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                        >
                            <option value="ALL">📦 All Plans ({plans.length})</option>
                            {plans.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} — ₹{Number(p.price).toLocaleString()}/mo
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Export CSV */}
                    <button
                        onClick={handleExportCSV}
                        className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-[13px] font-semibold transition-all shadow-xs flex items-center gap-1.5"
                        title="Export filtered records to CSV"
                    >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Export</span>
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs transition-all shadow-xs disabled:opacity-50"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                </div>
            </div>

            {/* KPI Stat Cards (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Total Subscribers */}
                <div
                    onClick={() => { setStatusFilter('ALL'); setSelectedPlanId('ALL'); }}
                    className={`bg-white p-4 rounded-2xl transition-all cursor-pointer ${statusFilter === 'ALL' && selectedPlanId === 'ALL'
                        ? 'border-blue-500 ring-2 ring-blue-500/10'
                        : 'border-slate-200/80 hover:border-slate-300'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border-1 border-blue-100 flex items-center justify-center text-blue-600">
                            <Users className="w-4 h-4" />
                        </div>
                        <span className="text-[14px] font-semibold text-slate-600">
                            Total Records
                        </span>
                    </div>
                    <div className="mt-2.5">
                        <div className="text-2xl font-bold text-slate-900">{kpiSummary.total}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                            <span>{plans.length} active packages</span>
                            <span className="font-semibold text-blue-600">View All</span>
                        </div>
                    </div>
                </div>

                {/* Active Subscriptions */}
                <div
                    onClick={() => setStatusFilter('Active')}
                    className={`bg-white p-4 rounded-2xl transition-all cursor-pointer ${statusFilter === 'Active'
                        ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/20'
                        : 'border-slate-200/80 hover:border-slate-300'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 border-1 border-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/80 text-emerald-800">
                            {kpiSummary.total > 0 ? `${Math.round((kpiSummary.active / kpiSummary.total) * 100)}%` : '0%'}
                        </span>
                    </div>
                    <div className="mt-2.5">
                        <div className="text-2xl font-bold text-emerald-700">{kpiSummary.active}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                            <span>Active recruiter seats</span>
                            <span className="font-semibold text-emerald-600">Filter</span>
                        </div>
                    </div>
                </div>

                {/* Expiring Soon */}
                <div
                    onClick={() => setStatusFilter('Expiring Soon')}
                    className={`bg-white p-4 rounded-2xl transition-all cursor-pointer ${statusFilter === 'Expiring Soon'
                        ? 'border-amber-500 ring-2 ring-amber-500/10 bg-amber-50/20'
                        : 'border-slate-200/80 hover:border-slate-300'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 border-1 border-amber-100 flex items-center justify-center text-amber-600">
                            <Clock className="w-4 h-4" />
                        </div>
                        {kpiSummary.expiringSoon > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                                Action Needed
                            </span>
                        )}
                    </div>
                    <div className="mt-2.5">
                        <div className="text-2xl font-bold text-amber-700">{kpiSummary.expiringSoon}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                            <span>Expiring within 7 days</span>
                            <span className="font-semibold text-amber-600">Filter</span>
                        </div>
                    </div>
                </div>

                {/* Quota Usage */}
                <div className="bg-white p-4 rounded-2xl border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 border-1 border-purple-100 flex items-center justify-center text-purple-600">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-semibold text-purple-600">
                            {kpiSummary.totalJobsUsed.toLocaleString()} Posts Used
                        </span>
                    </div>
                    <div className="mt-2.5">
                        <div className="flex items-baseline justify-between">
                            <div className="text-2xl font-bold text-slate-900">
                                {kpiSummary.quotaHealth}%
                            </div>
                            <span className="text-[11px] text-slate-400">
                                of {kpiSummary.totalJobsLimit.toLocaleString()} cap
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, kpiSummary.quotaHealth)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Search, Status Tabs & Filters Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Search Field */}
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by company name, recruiter, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-9 py-2 bg-slate-50/90 border border-slate-200 rounded-xl text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Controls (Sort & Clear) */}
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Sort Selector */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
                            >
                                <option value="expiry_asc">Expiry (Soonest)</option>
                                <option value="expiry_desc">Expiry (Furthest)</option>
                                <option value="usage_desc">Usage (Highest)</option>
                                <option value="company_asc">Company (A-Z)</option>
                                <option value="created_desc">Recently Added</option>
                            </select>
                        </div>

                        {/* Clear Filters Button */}
                        {isFiltered && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('ALL');
                                    setSelectedPlanId('ALL');
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>Clear</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Status Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-3 no-scrollbar border-t border-slate-100 mt-3">
                    {[
                        { id: 'ALL', label: 'All Subscribers', count: subscribers.length },
                        { id: 'Active', label: 'Active', count: kpiSummary.active, dot: 'bg-emerald-500' },
                        { id: 'Expiring Soon', label: 'Expiring Soon (≤ 7d)', count: kpiSummary.expiringSoon, dot: 'bg-amber-500' },
                        { id: 'Expired', label: 'Expired', count: kpiSummary.expired, dot: 'bg-rose-500' },
                        { id: 'Suspended', label: 'Suspended', count: kpiSummary.suspended, dot: 'bg-slate-400' }
                    ].map((tab) => {
                        const isActive = statusFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${isActive
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                                    }`}
                            >
                                {tab.dot && (
                                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : tab.dot}`} />
                                )}
                                <span>{tab.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Neat & Compact Table */}
            {loading ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
                        <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Company</th>
                                    <th className="py-3 px-4">Recruiter Lead</th>
                                    <th className="py-3 px-4">Plan & Billing</th>
                                    <th className="py-3 px-4">Expiry Date</th>
                                    <th className="py-3 px-4">Job Usage</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        <td className="py-3 px-4"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                                        <td className="py-3 px-4"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                                        <td className="py-3 px-4"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                                        <td className="py-3 px-4"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                                        <td className="py-3 px-4"><div className="h-4 w-24 bg-slate-200 rounded" /></td>
                                        <td className="py-3 px-4 text-center"><div className="h-5 w-16 bg-slate-200 rounded-full mx-auto" /></td>
                                        <td className="py-3 px-4 text-right"><div className="h-8 w-24 bg-slate-200 rounded-lg ml-auto" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : paginatedSubscribers.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 border border-slate-200/80 shadow-xs text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">No Subscribers Found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                        {isFiltered
                            ? "No subscribers match your search filter criteria. Try adjusting your search query."
                            : "There are currently no recruiters assigned to this subscription tier."}
                    </p>
                    {isFiltered ? (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('ALL');
                                setSelectedPlanId('ALL');
                            }}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all shadow-xs"
                        >
                            Reset All Filters
                        </button>
                    ) : (
                        <button
                            onClick={() => router.push('/admin/recruiters')}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs inline-flex items-center gap-1.5"
                        >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Assign Subscription</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Company</th>
                                    <th className="py-3 px-4">Recruiter Lead</th>
                                    <th className="py-3 px-4">Plan & Billing</th>
                                    <th className="py-3 px-4">Expiry Date</th>
                                    <th className="py-3 px-4">Job Usage</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[13px]">
                                {paginatedSubscribers.map((sub) => {
                                    const recruiterName = sub.recruiter_name || `${sub.first_name || ''} ${sub.last_name || ''}`.trim() || 'Recruiter Lead';
                                    const email = sub.recruiter_email || sub.email || '—';
                                    const companyName = sub.company_name || 'Individual Enterprise';
                                    const planName = sub.plan_name || currentPlanObj?.name || 'Assigned Plan';
                                    const daysLeft = getDaysRemaining(sub.expiry_date);
                                    const rawStatus = sub.status || sub.subscription_status || 'Active';

                                    // Usage calculations
                                    const used = Number(sub.job_posts_used) || 0;
                                    const limit = Number(sub.job_post_limit) || 15;
                                    const usagePct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

                                    const isSuspended = rawStatus === 'Suspended' || sub.user_active === 0;
                                    const isExpired = daysLeft !== null && daysLeft <= 0;
                                    const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

                                    const avatarGradient = getCompanyAvatarGradient(companyName);

                                    return (
                                        <tr
                                            key={sub.subscription_id || sub.id}
                                            className="hover:bg-slate-50/70 transition-colors"
                                        >
                                            {/* 1. Company */}
                                            <td className="py-3 px-4 align-middle">
                                                <div className="flex items-center gap-2.5">
                                                    {(() => {
                                                        const logoSrc = sub.company_logo || sub.profile_image || sub.user_avatar;
                                                        return logoSrc ? (
                                                            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                                                                <img
                                                                    src={getImageUrl(logoSrc)}
                                                                    alt={companyName}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        if (e.currentTarget.nextElementSibling) {
                                                                            e.currentTarget.nextElementSibling.style.display = 'flex';
                                                                        }
                                                                    }}
                                                                />
                                                                <div className={`w-full h-full bg-gradient-to-br ${avatarGradient} text-white hidden items-center justify-center font-bold text-xs uppercase`}>
                                                                    {companyName.slice(0, 2)}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarGradient} text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs shrink-0`}>
                                                                {companyName.slice(0, 2)}
                                                            </div>
                                                        );
                                                    })()}
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-slate-900 truncate flex items-center gap-1">
                                                            <span className="truncate max-w-[140px] sm:max-w-[170px]">{companyName}</span>
                                                            {sub.website_url && (
                                                                <a
                                                                    href={sub.website_url.startsWith('http') ? sub.website_url : `https://${sub.website_url}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                                                                    title="Open Website"
                                                                >
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                                                            {sub.industry_type || 'Corporate Employer'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 2. Recruiter Lead */}
                                            <td className="py-3 px-4 align-middle">
                                                <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                                                    {recruiterName}
                                                </div>
                                                <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                                    {email}
                                                </div>
                                            </td>

                                            {/* 3. Plan & Billing */}
                                            <td className="py-3 px-4 align-middle whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border-1 border-blue-200/80">
                                                        <Zap className="w-3 h-3 text-blue-600" />
                                                        <span>{planName}</span>
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-400 mt-0.5">
                                                    <span className="capitalize">{sub.billing_cycle || 'Monthly'}</span>
                                                    <span> • ₹{Number(sub.price_paid || sub.plan_price || 0).toLocaleString()}</span>
                                                </div>
                                            </td>

                                            {/* 4. Expiry Date & Countdown Badge */}
                                            <td className="py-3 px-4 align-middle whitespace-nowrap">
                                                <div className="font-semibold text-slate-800 text-[12px]">
                                                    {formatDate(sub.expiry_date)}
                                                </div>
                                                <div className="mt-0.5">
                                                    {isSuspended ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                                                            <span>Suspended</span>
                                                        </span>
                                                    ) : isExpired ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                                            <span>Expired {Math.abs(daysLeft)}d ago</span>
                                                        </span>
                                                    ) : isExpiringSoon ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                                            <Clock className="w-2.5 h-2.5" />
                                                            <span>{daysLeft}d left (Urgent)</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border-1 border-emerald-200">
                                                            <Check className="w-2.5 h-2.5" />
                                                            <span>{daysLeft} days left</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 5. Job Usage */}
                                            <td className="py-3 px-4 align-middle whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-900">
                                                        {used.toLocaleString()}{' '}
                                                        <span className="font-normal text-slate-400">/ {limit.toLocaleString()}</span>
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-slate-500">
                                                        {usagePct}%
                                                    </span>
                                                </div>
                                                <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${usagePct >= 90
                                                            ? 'bg-rose-500'
                                                            : usagePct >= 70
                                                                ? 'bg-amber-500'
                                                                : 'bg-blue-600'
                                                            }`}
                                                        style={{ width: `${usagePct}%` }}
                                                    />
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                    {sub.active_jobs_count ? `${sub.active_jobs_count} active postings` : 'Job Posts Quota'}
                                                </div>
                                            </td>

                                            {/* 6. Status Badge */}
                                            <td className="py-3 px-4 align-middle text-center whitespace-nowrap">
                                                {isSuspended ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                                        <span>Suspended</span>
                                                    </span>
                                                ) : isExpired ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                        <span>Expired</span>
                                                    </span>
                                                ) : isExpiringSoon ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                                        <span>Expiring</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border-1 border-emerald-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        <span>Active</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* 7. Actions */}
                                            <td className="py-3 px-4 align-middle text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* View Details Link */}
                                                    <button
                                                        onClick={() => router.push(`/admin/recruiters/${sub.recruiter_id || sub.user_id || sub.id}`)}
                                                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                                                        title="View Recruiter Profile & Team"
                                                    >
                                                        <span>View Details</span>
                                                        <ArrowUpRight className="w-3 h-3" />
                                                    </button>

                                                    {/* Change Plan Button */}
                                                    <button
                                                        onClick={() => setChangePlanRecruiter({
                                                            ...sub,
                                                            id: sub.recruiter_id || sub.user_id || sub.id,
                                                            current_plan_id: sub.plan_id,
                                                            subscription_expiry: sub.expiry_date
                                                        })}
                                                        className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs transition-colors"
                                                        title="Change Subscription Plan"
                                                    >
                                                        <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                                                    </button>

                                                    {/* Extend Subscription */}
                                                    <button
                                                        onClick={() => setExtendRecruiter({
                                                            ...sub,
                                                            id: sub.recruiter_id || sub.user_id || sub.id,
                                                            subscription_expiry: sub.expiry_date
                                                        })}
                                                        className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs transition-colors"
                                                        title="Extend Expiry Date"
                                                    >
                                                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                                                    </button>

                                                    {/* Suspend / Activate Toggle */}
                                                    <button
                                                        onClick={() => handleToggleStatus(sub)}
                                                        disabled={actionLoadingId === (sub.recruiter_id || sub.id)}
                                                        className={`p-1.5 rounded-lg text-xs font-semibold border transition-all ${isSuspended
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                                            }`}
                                                        title={isSuspended ? 'Activate Recruiter' : 'Suspend Recruiter'}
                                                    >
                                                        {actionLoadingId === (sub.recruiter_id || sub.id) ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : isSuspended ? (
                                                            <UserCheck className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <UserX className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination and Table Footer */}
                    <div className="p-3.5 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                            <span>
                                Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                <span className="font-bold text-slate-900">
                                    {Math.min(currentPage * itemsPerPage, filteredAndSortedSubscribers.length)}
                                </span>{' '}
                                of <span className="font-bold text-slate-900">{filteredAndSortedSubscribers.length}</span> entries
                            </span>
                            <span className="text-slate-300">|</span>
                            <div className="flex items-center gap-1">
                                <span>Rows:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                    className="bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    title="Previous Page"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                {Array.from({ length: totalPages }).map((_, idx) => {
                                    const pageNum = idx + 1;
                                    if (
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum
                                                    ? 'bg-blue-600 text-white shadow-2xs'
                                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    } else if (
                                        pageNum === currentPage - 2 ||
                                        pageNum === currentPage + 2
                                    ) {
                                        return <span key={pageNum} className="text-slate-400 px-0.5">...</span>;
                                    }
                                    return null;
                                })}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    title="Next Page"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Change Plan Modal */}
            {changePlanRecruiter && (
                <ChangePlanModal
                    recruiter={changePlanRecruiter}
                    isOpen={Boolean(changePlanRecruiter)}
                    onClose={() => setChangePlanRecruiter(null)}
                    onSuccess={() => {
                        setChangePlanRecruiter(null);
                        loadData();
                    }}
                />
            )}

            {/* Extend Subscription Modal */}
            {extendRecruiter && (
                <ExtendSubscriptionModal
                    recruiter={extendRecruiter}
                    isOpen={Boolean(extendRecruiter)}
                    onClose={() => setExtendRecruiter(null)}
                    onSuccess={() => {
                        setExtendRecruiter(null);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}
