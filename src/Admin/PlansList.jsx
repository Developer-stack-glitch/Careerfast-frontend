'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    CreditCard, Plus, Search, MoreVertical, Edit2, Copy, Trash2,
    CheckCircle2, XCircle, Users, Eye, AlertCircle, Sparkles,
    Shield, Briefcase, Zap, Star, ArrowRight, Loader2, Check, X,
    LayoutGrid, Table as TableIcon, RefreshCw, ArrowUpDown,
    TrendingUp, IndianRupee, Layers, Crown, ChevronRight, FileText,
    Download, UserCheck, Flame, ToggleLeft, ToggleRight
} from 'lucide-react';
import {
    getAdminPlans,
    toggleAdminPlanStatus,
    duplicateAdminPlan,
    deleteAdminPlan
} from '../ApiService/action';
import toast from 'react-hot-toast';

export default function PlansList() {
    const router = useRouter();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('default');
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

    // Modals
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [deleteModalPlan, setDeleteModalPlan] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) setRefreshing(true);
            else setLoading(true);
            const res = await getAdminPlans();
            if (res?.data?.success) {
                setPlans(res.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching plans:", error);
            toast.error("Failed to load subscription plans.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleToggleStatus = async (plan) => {
        try {
            const nextStatus = plan.status === 'active' ? 'inactive' : 'active';
            setActionLoading(true);
            const res = await toggleAdminPlanStatus(plan.id, nextStatus);
            if (res?.data?.success) {
                toast.success(`Plan ${nextStatus === 'active' ? 'activated' : 'deactivated'} successfully.`);
                setPlans(plans.map(p => p.id === plan.id ? { ...p, status: nextStatus } : p));
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update plan status.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDuplicate = async (plan) => {
        try {
            setActionLoading(true);
            const res = await duplicateAdminPlan(plan.id);
            if (res?.data?.success) {
                toast.success("Plan duplicated successfully!");
                fetchPlans();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to duplicate plan.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModalPlan) return;
        try {
            setActionLoading(true);
            const res = await deleteAdminPlan(deleteModalPlan.id);
            if (res?.data?.success) {
                toast.success("Plan deleted successfully.");
                setPlans(plans.filter(p => p.id !== deleteModalPlan.id));
                setDeleteModalPlan(null);
            }
        } catch (err) {
            console.error(err);
            const errMsg = err?.response?.data?.message || err?.message || "Failed to delete plan.";
            toast.error(errMsg, { duration: 5000 });
        } finally {
            setActionLoading(false);
        }
    };

    // Metrics calculations
    const stats = useMemo(() => {
        const total = plans.length;
        const active = plans.filter(p => p.status === 'active').length;
        const totalSubscribers = plans.reduce((acc, p) => acc + (Number(p.active_subscribers) || 0), 0);
        const sortedBySubs = [...plans].sort((a, b) => (Number(b.active_subscribers) || 0) - (Number(a.active_subscribers) || 0));
        const mostPopular = sortedBySubs[0]?.name || (plans.length > 0 ? plans[0].name : '—');
        const avgValue = total > 0 ? Math.round(plans.reduce((acc, p) => acc + Number(p.price || 0), 0) / total) : 0;

        return {
            total,
            active,
            totalSubscribers,
            mostPopular,
            avgValue
        };
    }, [plans]);

    // Filter & Sort plans
    const filteredPlans = useMemo(() => {
        let result = plans.filter(plan => {
            const matchesSearch =
                (plan.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (plan.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === 'ALL' || (plan.plan_type || '').toLowerCase() === typeFilter.toLowerCase();
            const matchesStatus = statusFilter === 'ALL' || plan.status === statusFilter;
            return matchesSearch && matchesType && matchesStatus;
        });

        // Sorting
        if (sortBy === 'price-low') {
            result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
        } else if (sortBy === 'price-high') {
            result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
        } else if (sortBy === 'subscribers') {
            result.sort((a, b) => Number(b.active_subscribers || 0) - Number(a.active_subscribers || 0));
        } else if (sortBy === 'name') {
            result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }

        return result;
    }, [plans, searchTerm, typeFilter, statusFilter, sortBy]);

    // Helper for tier badge & icon
    const getPlanStyle = (name = '') => {
        const lower = name.toLowerCase();
        if (lower.includes('enterprise') || lower.includes('ultimate') || lower.includes('premium')) {
            return {
                bg: 'bg-amber-500/10 text-amber-700 border-amber-200/80',
                iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-500/20',
                badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
                icon: Crown,
                tag: 'PREMIUM'
            };
        }
        if (lower.includes('pro') || lower.includes('growth')) {
            return {
                bg: 'bg-blue-500/10 text-blue-700 border-blue-200/80',
                iconBg: 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/20',
                badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
                icon: Zap,
                tag: 'POPULAR'
            };
        }
        return {
            bg: 'bg-slate-100 text-slate-700 border-slate-200',
            iconBg: 'bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-slate-500/20',
            badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
            icon: Briefcase,
            tag: 'STARTER'
        };
    };

    return (
        <div className="w-full max-w-7xl mx-auto font-sans pb-16 px-2 sm:px-4">
            {/* Breadcrumb & Header */}
            <div className="mb-6 pt-2">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
                    <span className="hover:text-slate-600 cursor-pointer transition-colors" onClick={() => router.push('/admin')}>Dashboard</span>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="text-slate-700 font-semibold">Subscription Plans</span>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-0">
                                    Subscription Plans Management
                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                        {plans.length} Tiers
                                    </span>
                                </h1>
                                <p className="text-[13px] text-slate-500 mt-0.5 mb-0">
                                    Configure recruitment tiers, candidate access quotas, posting limits, and enterprise privileges.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                        <button
                            onClick={() => fetchPlans(true)}
                            disabled={refreshing || loading}
                            title="Refresh plans data"
                            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
                        </button>

                        <button
                            onClick={() => router.push('/admin/plans/subscribers')}
                            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl text-[13px] font-semibold transition-all shadow-xs flex items-center gap-2"
                        >
                            <Users className="w-4 h-4 text-slate-500" />
                            <span>Subscribers</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-bold">
                                {stats.totalSubscribers}
                            </span>
                        </button>

                        <button
                            onClick={() => router.push('/admin/plans/create')}
                            className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-[14px] font-medium transition-all shadow-sm hover:shadow-md hover:shadow-blue-500/20 flex items-center gap-2 active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add New Plan</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Metric 1: Total Plans */}
                <div className="bg-white rounded-2xl p-3 border border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <span className="text-[14px] font-semibold text-slate-600">Total Plans</span>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border-1 border-indigo-100 flex items-center justify-center text-indigo-600">
                            <Layers className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900 tracking-tight">{stats.total}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border-1 border-emerald-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {stats.active} Active
                        </span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-1.5 mb-0">
                        Configured subscription tiers
                    </p>
                </div>

                {/* Metric 2: Active Subscribers */}
                <div className="bg-white rounded-2xl p-3 border border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <span className="text-[14px] font-semibold text-slate-600">Active Subscribers</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border-1 border-blue-100 flex items-center justify-center text-blue-600">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-blue-600 tracking-tight">{stats.totalSubscribers}</span>
                        <span className="text-xs font-medium text-slate-400">recruiter orgs</span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-1.5 mb-0">
                        Across recruitment companies
                    </p>
                </div>

                {/* Metric 3: Most Popular Plan */}
                <div className="bg-white rounded-2xl p-3 border border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <span className="text-[14px] font-semibold text-slate-600">Top Performing Tier</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 border-1 border-amber-100 flex items-center justify-center text-amber-600">
                            <Flame className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-2">
                        <span className="text-xl font-bold text-slate-900 truncate tracking-tight">{stats.mostPopular}</span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-1.5 mb-0">
                        Highest active subscriber count
                    </p>
                </div>

                {/* Metric 4: Average Plan Value */}
                <div className="bg-white rounded-2xl p-3 border border-slate-200/70 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                        <span className="text-[14px] font-semibold text-slate-600">Average Plan Value</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border-1 border-emerald-100 flex items-center justify-center text-emerald-600">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-emerald-700 tracking-tight">₹{stats.avgValue.toLocaleString()}</span>
                        <span className="text-xs font-medium text-slate-400">/ package</span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-1.5 mb-0">
                        Monthly benchmark price
                    </p>
                </div>
            </div>

            {/* Filter & Controls Toolbar */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Search & Status Quick Filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search plan name, limits, or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-9 py-2 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Quick Status Chips */}
                    <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl shrink-0">
                        {[
                            { id: 'ALL', label: 'All' },
                            { id: 'active', label: 'Active' },
                            { id: 'inactive', label: 'Inactive' }
                        ].map((chip) => (
                            <button
                                key={chip.id}
                                onClick={() => setStatusFilter(chip.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === chip.id
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dropdowns & View Mode Toggles */}
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between lg:justify-end">
                    {/* Billing Cycle Dropdown */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    >
                        <option value="ALL">All Billing Cycles</option>
                        <option value="monthly">Monthly Billing</option>
                        <option value="yearly">Yearly Billing</option>
                        <option value="custom">Custom Billing</option>
                    </select>

                    {/* Sort Order Dropdown */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    >
                        <option value="default">Sort: Default</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="subscribers">Most Subscribers</option>
                        <option value="name">Name (A-Z)</option>
                    </select>
                </div>
            </div>

            {/* Results Count & Clear Filter Bar (if filters active) */}
            {(searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL' || sortBy !== 'default') && (
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
                    <span>
                        Showing <strong className="text-slate-700">{filteredPlans.length}</strong> of {plans.length} subscription plans
                    </span>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setTypeFilter('ALL');
                            setStatusFilter('ALL');
                            setSortBy('default');
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1"
                    >
                        <X className="w-3.5 h-3.5" /> Clear all filters
                    </button>
                </div>
            )}

            {/* Main Content Area */}
            {loading ? (
                <div className="bg-white rounded-2xl p-16 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-9 h-9 text-blue-600 animate-spin mb-3.5" />
                    <p className="text-[14px] font-semibold text-slate-700">Loading subscription plans...</p>
                    <p className="text-xs text-slate-400 mt-1">Fetching package limits and active assignments</p>
                </div>
            ) : filteredPlans.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 border border-slate-200/80 shadow-xs text-center max-w-lg mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No subscription plans found</h3>
                    <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed mb-0">
                        No subscription plans match your search or filter criteria. Try adjusting your filters or create a new plan package.
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-4">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setTypeFilter('ALL');
                                setStatusFilter('ALL');
                                setSortBy('default');
                            }}
                            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-[14px] font-medium transition-all"
                        >
                            Reset Filters
                        </button>
                        <button
                            onClick={() => router.push('/admin/plans/create')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[14px] font-medium transition-all shadow-xs"
                        >
                            + Create New Plan
                        </button>
                    </div>
                </div>
            ) : viewMode === 'table' ? (
                /* ======================================================== */
                /* MODERN TABLE VIEW                                        */
                /* ======================================================== */
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[13px]">
                            <thead>
                                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="py-3.5 px-4 font-semibold">Plan Details</th>
                                    <th className="py-3.5 px-4 font-semibold">Pricing & Cycle</th>
                                    <th className="py-3.5 px-4 font-semibold">Job Posting Limits</th>
                                    <th className="py-3.5 px-4 font-semibold">Candidate Access</th>
                                    <th className="py-3.5 px-4 font-semibold">Team Seats</th>
                                    <th className="py-3.5 px-4 font-semibold">Subscribers</th>
                                    <th className="py-3.5 px-4 font-semibold">Status</th>
                                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPlans.map((plan) => {
                                    const style = getPlanStyle(plan.name);
                                    const PlanIcon = style.icon;

                                    return (
                                        <tr
                                            key={plan.id}
                                            className="hover:bg-slate-50/80 transition-colors group"
                                        >
                                            {/* Column 1: Plan Details */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3.5">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg} shadow-xs`}>
                                                        <PlanIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                                                                {plan.name}
                                                            </span>
                                                            {Number(plan.active_subscribers) > 0 && (
                                                                <span className="text-[10px] bg-blue-50 text-blue-700 border-1 border-blue-200 px-1.5 py-0.2 rounded-md font-semibold">
                                                                    In-Use
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-[210px]" title={plan.description}>
                                                            {plan.description || `${plan.validity_days || 30} days validity period`}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 2: Pricing & Cycle */}
                                            <td className="py-4 px-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900 text-sm tracking-tight">
                                                        ₹{Number(plan.price || 0).toLocaleString()}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500 font-medium capitalize mt-0.5">
                                                        {plan.plan_type || 'Monthly'} • {plan.validity_days || 30}d
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Column 3: Job Posting Limits */}
                                            <td className="py-4 px-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                        <span>{plan.job_post_limit} Posts</span>
                                                        <span className="text-[11px] text-slate-400 font-normal">/mo</span>
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        Max active: <strong className="text-slate-700">{plan.active_job_limit}</strong>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 4: Candidate Access */}
                                            <td className="py-4 px-4">
                                                <div className="flex flex-col gap-1 text-xs">
                                                    <span className="text-slate-700 font-medium">
                                                        <strong className="text-slate-900">{Number(plan.resume_view_limit || 0).toLocaleString()}</strong> Views
                                                    </span>
                                                    <span className="text-[11px] text-slate-500">
                                                        <strong className="text-slate-700">{Number(plan.resume_download_limit || 0).toLocaleString()}</strong> Downloads
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Column 5: Team Seats */}
                                            <td className="py-4 px-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border-1 border-indigo-100/80">
                                                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                                                    {plan.sub_recruiter_limit || 1} {Number(plan.sub_recruiter_limit) === 1 ? 'Seat' : 'Seats'}
                                                </span>
                                            </td>

                                            {/* Column 6: Subscribers */}
                                            <td className="py-4 px-4">
                                                <button
                                                    onClick={() => router.push(`/admin/plans/${plan.id}/subscribers`)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/70 hover:border-blue-200 transition-all cursor-pointer"
                                                    title="View all recruiters subscribed to this tier"
                                                >
                                                    <UserCheck className="w-3.5 h-3.5" />
                                                    <span>{plan.active_subscribers || 0}</span>
                                                </button>
                                            </td>

                                            {/* Column 7: Status */}
                                            <td className="py-4 px-4">
                                                <button
                                                    onClick={() => handleToggleStatus(plan)}
                                                    disabled={actionLoading}
                                                    title={`Click to ${plan.status === 'active' ? 'Deactivate' : 'Activate'}`}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${plan.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 border-1 border-emerald-200/80 hover:bg-emerald-100'
                                                        : 'bg-slate-100 text-slate-600 border-1 border-slate-200 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${plan.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                    <span className="capitalize">{plan.status === 'active' ? 'Active' : 'Inactive'}</span>
                                                </button>
                                            </td>

                                            {/* Column 8: Actions */}
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => { setSelectedPlan(plan); setViewModalOpen(true); }}
                                                        title="Quick View Details"
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/admin/plans/edit/${plan.id}`)}
                                                        title="Edit Plan"
                                                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDuplicate(plan)}
                                                        title="Duplicate Plan"
                                                        disabled={actionLoading}
                                                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteModalPlan(plan)}
                                                        title="Delete Plan"
                                                        disabled={actionLoading}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* ======================================================== */
                /* MODERN GRID / TIER CARDS VIEW                            */
                /* ======================================================== */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlans.map((plan) => {
                        const style = getPlanStyle(plan.name);
                        const PlanIcon = style.icon;
                        const isPopular = Number(plan.active_subscribers) > 0 || plan.name?.toLowerCase().includes('pro');

                        return (
                            <div
                                key={plan.id}
                                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden group hover:shadow-md ${isPopular
                                    ? 'border-blue-300 ring-1 ring-blue-500/20 shadow-xs'
                                    : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                                    }`}
                            >
                                {isPopular && (
                                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold tracking-wider uppercase py-1 px-3 text-center">
                                        ⭐ Recommended Tier
                                    </div>
                                )}

                                <div className="p-5.5">
                                    {/* Card Top: Icon, Name, and Status */}
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg} shadow-xs`}>
                                                <PlanIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                                                    {plan.name}
                                                </h3>
                                                <span className="text-[11px] font-semibold text-slate-400 capitalize">
                                                    {plan.plan_type || 'Monthly'} Package
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleToggleStatus(plan)}
                                            disabled={actionLoading}
                                            title="Click to toggle status"
                                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${plan.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                                }`}
                                        >
                                            {plan.status === 'active' ? 'Active' : 'Inactive'}
                                        </button>
                                    </div>

                                    {/* Price Banner */}
                                    <div className="mb-4 pb-4 border-b border-slate-100">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                                ₹{Number(plan.price || 0).toLocaleString()}
                                            </span>
                                            <span className="text-xs text-slate-500 font-medium">
                                                / {plan.plan_type === 'yearly' ? 'year' : 'month'}
                                            </span>
                                        </div>
                                        <p className="text-[12px] text-slate-500 mt-1 line-clamp-2 min-h-[34px]">
                                            {plan.description || `${plan.validity_days || 30} days validity period with full candidate access.`}
                                        </p>
                                    </div>

                                    {/* Quota Highlights Grid */}
                                    <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Job Posts</span>
                                            <span className="text-sm font-bold text-slate-800 mt-0.5 block">{plan.job_post_limit} / mo</span>
                                        </div>
                                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Max Active</span>
                                            <span className="text-sm font-bold text-slate-800 mt-0.5 block">{plan.active_job_limit} jobs</span>
                                        </div>
                                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Resume Views</span>
                                            <span className="text-sm font-bold text-slate-800 mt-0.5 block">{Number(plan.resume_view_limit || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Team Seats</span>
                                            <span className="text-sm font-bold text-slate-800 mt-0.5 block">{plan.sub_recruiter_limit || 1} Seat(s)</span>
                                        </div>
                                    </div>

                                    {/* Quick Feature Privileges Chips */}
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {plan.candidate_search && (
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                                                <Check className="w-3 h-3 text-emerald-600" /> Search
                                            </span>
                                        )}
                                        {plan.resume_database && (
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                                                <Check className="w-3 h-3 text-emerald-600" /> Database
                                            </span>
                                        )}
                                        {plan.company_branding && (
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                                                <Check className="w-3 h-3 text-indigo-600" /> Branding
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Card Footer: Subscribers & Action Bar */}
                                <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => router.push(`/admin/plans/${plan.id}/subscribers`)}
                                        className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                                    >
                                        <Users className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{plan.active_subscribers || 0} Subscribers</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => { setSelectedPlan(plan); setViewModalOpen(true); }}
                                            title="View Details"
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => router.push(`/admin/plans/edit/${plan.id}`)}
                                            title="Edit Plan"
                                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDuplicate(plan)}
                                            title="Duplicate Plan"
                                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModalPlan(plan)}
                                            title="Delete Plan"
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ======================================================== */}
            {/* VIEW PLAN DETAILS MODAL                                   */}
            {/* ======================================================== */}
            {viewModalOpen && selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold text-slate-900 mb-0">
                                            {selectedPlan.name} Plan
                                        </h3>
                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${selectedPlan.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-700 border-1 border-emerald-200'
                                            : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {selectedPlan.status}
                                        </span>
                                    </div>
                                    <p className="text-[13px] text-slate-500 mt-0.5 mb-0">
                                        {selectedPlan.description || 'No description provided.'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Price & Validity Cards */}
                        <div className="grid grid-cols-3 gap-3 my-3">
                            <div className="bg-blue-50/70 p-3.5 rounded-xl border-1 border-blue-100">
                                <span className="text-[14px] font-bold text-blue-700">Price</span>
                                <span className="text-xl font-extrabold text-blue-950 mt-0.5 block">
                                    ₹{Number(selectedPlan.price || 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                <span className="text-[13px] font-semibold text-slate-500">Billing Cycle</span>
                                <span className="text-sm font-bold text-slate-800 capitalize mt-1 block">
                                    {selectedPlan.plan_type} ({selectedPlan.validity_days || 30}d)
                                </span>
                            </div>
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                <span className="text-[13px] font-semibold text-slate-500">Subscribers</span>
                                <span className="text-sm font-bold text-slate-800 mt-1 block">
                                    {selectedPlan.active_subscribers || 0} Recruiters
                                </span>
                            </div>
                        </div>

                        {/* Quotas & Limits */}
                        <div className="mb-4">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                                Job Posting & Candidate Limits
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-[13px]">
                                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex justify-between items-center">
                                    <span className="text-slate-600 font-medium">Monthly Job Posts:</span>
                                    <span className="font-bold text-slate-900">{selectedPlan.job_post_limit}</span>
                                </div>
                                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex justify-between items-center">
                                    <span className="text-slate-600 font-medium">Max Active Jobs:</span>
                                    <span className="font-bold text-slate-900">{selectedPlan.active_job_limit}</span>
                                </div>
                                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex justify-between items-center">
                                    <span className="text-slate-600 font-medium">Resume Views:</span>
                                    <span className="font-bold text-slate-900">{Number(selectedPlan.resume_view_limit || 0).toLocaleString()}</span>
                                </div>
                                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex justify-between items-center">
                                    <span className="text-slate-600 font-medium">Resume Downloads:</span>
                                    <span className="font-bold text-slate-900">{Number(selectedPlan.resume_download_limit || 0).toLocaleString()}</span>
                                </div>
                                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex justify-between items-center">
                                    <span className="text-slate-600 font-medium">Featured Job Posts:</span>
                                    <span className="font-bold text-slate-900">{selectedPlan.featured_job_limit || 0}</span>
                                </div>
                                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex justify-between items-center">
                                    <span className="text-slate-600 font-medium">Urgent Job Posts:</span>
                                    <span className="font-bold text-slate-900">{selectedPlan.urgent_job_limit || 0}</span>
                                </div>
                                <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl flex justify-between items-center col-span-2">
                                    <span className="text-indigo-800 font-semibold flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-indigo-600" /> Sub-Recruiter Team Seats:
                                    </span>
                                    <span className="font-extrabold text-indigo-950">
                                        {selectedPlan.sub_recruiter_limit || 1} {Number(selectedPlan.sub_recruiter_limit) === 1 ? 'Seat' : 'Seats'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Feature Permissions */}
                        <div className="mb-6">
                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                                Platform Feature Privileges
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-[12px]">
                                {[
                                    { label: 'Candidate Search', value: selectedPlan.candidate_search },
                                    { label: 'Candidate Contact', value: selectedPlan.candidate_contact },
                                    { label: 'Resume Database Access', value: selectedPlan.resume_database },
                                    { label: 'Interview Management', value: selectedPlan.interview_management },
                                    { label: 'Application Management', value: selectedPlan.application_management },
                                    { label: 'Candidate Shortlisting', value: selectedPlan.shortlisting },
                                    { label: 'Company Profile Customization', value: selectedPlan.company_profile },
                                    { label: 'Company Branding on Listings', value: selectedPlan.company_branding },
                                ].map((feat, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-2 p-2.5 rounded-xl border ${feat.value
                                            ? 'bg-emerald-50/60 border-emerald-100 text-emerald-800 font-medium'
                                            : 'bg-slate-50 border-slate-100 text-slate-400'
                                            }`}
                                    >
                                        {feat.value ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        ) : (
                                            <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                        )}
                                        <span className={feat.value ? '' : 'line-through'}>{feat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setViewModalOpen(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[13px] font-medium transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setViewModalOpen(false);
                                    router.push(`/admin/plans/edit/${selectedPlan.id}`);
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-semibold transition-all shadow-xs flex items-center gap-2"
                            >
                                <Edit2 className="w-3.5 h-3.5" /> Edit This Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* DELETE / DEACTIVATE MODAL                                */}
            {/* ======================================================== */}
            {deleteModalPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Delete Subscription Plan?</h3>
                        <p className="text-[13px] text-slate-500 mt-2 leading-relaxed">
                            Are you sure you want to delete <strong className="text-slate-900">{deleteModalPlan.name}</strong>?
                        </p>

                        {Number(deleteModalPlan.active_subscribers) > 0 ? (
                            <div className="my-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[12px] flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                                <div>
                                    <strong className="block font-bold">Active Subscriptions Warning</strong>
                                    This plan currently has <strong>{deleteModalPlan.active_subscribers}</strong> active subscriber(s). Database integrity forbids deleting a plan currently in use.
                                    Instead, you can <strong>Deactivate</strong> this plan so existing recruiters keep access while blocking new assignments.
                                </div>
                            </div>
                        ) : (
                            <p className="text-[12px] text-slate-400 mt-2">
                                This plan has no active subscribers. This action will permanently remove it from the system.
                            </p>
                        )}

                        <div className="flex items-center justify-end gap-2.5 mt-6">
                            <button
                                onClick={() => setDeleteModalPlan(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[13px] font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            {Number(deleteModalPlan.active_subscribers) > 0 ? (
                                <button
                                    onClick={() => {
                                        handleToggleStatus(deleteModalPlan);
                                        setDeleteModalPlan(null);
                                    }}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[13px] font-semibold transition-all shadow-xs"
                                >
                                    Deactivate Instead
                                </button>
                            ) : (
                                <button
                                    onClick={handleDelete}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[13px] font-semibold transition-all shadow-xs flex items-center gap-2"
                                >
                                    {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Yes, Delete Plan
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
