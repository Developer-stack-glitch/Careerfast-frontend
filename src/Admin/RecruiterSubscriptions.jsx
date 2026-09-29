'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    CreditCard, Calendar, Clock, AlertTriangle, CheckCircle2,
    Search, Filter, ArrowUpDown, ChevronRight, Eye, RefreshCw,
    Sparkles, Shield, User, Building, AlertCircle, Loader2, ArrowRight
} from 'lucide-react';
import { getAdminSubscriptions, getAdminPlans } from '../ApiService/action';
import toast from 'react-hot-toast';
import ChangePlanModal from './ChangePlanModal';
import ExtendSubscriptionModal from './ExtendSubscriptionModal';
import { getImageUrl } from '../utils/getImageUrl';

export default function RecruiterSubscriptions() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [subscriptions, setSubscriptions] = useState([]);
    const [summary, setSummary] = useState({
        total_active: 0,
        expiring_soon: 0,
        expired: 0,
        suspended: 0
    });
    const [plans, setPlans] = useState([]);

    // Filters
    const [search, setSearch] = useState('');
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    // Modals
    const [selectedRecruiter, setSelectedRecruiter] = useState(null);
    const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
    const [isExtendOpen, setIsExtendOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [subRes, plansRes] = await Promise.all([
                getAdminSubscriptions({
                    search,
                    planId: selectedPlanId,
                    status: selectedStatus
                }),
                getAdminPlans()
            ]);

            const subData = subRes.data?.data || {};
            setSubscriptions(subData.subscriptions || []);
            if (subData.summary) {
                setSummary(subData.summary);
            }

            const pData = plansRes.data?.data || plansRes.data || [];
            setPlans(pData);
        } catch (err) {
            console.error("Failed to fetch subscriptions:", err);
            toast.error("Failed to load recruiter subscriptions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedPlanId, selectedStatus]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchData();
    };

    const getDaysBadge = (days) => {
        if (days === null || days === undefined) return null;
        const d = Number(days);
        if (d <= 0) {
            return (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit">
                    <AlertCircle className="w-3 h-3" />
                    <span>Expired</span>
                </span>
            );
        }
        if (d <= 7) {
            return (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                    <Clock className="w-3 h-3" />
                    <span>{d} Days Left (Urgent)</span>
                </span>
            );
        }
        if (d <= 15) {
            return (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit">
                    <Clock className="w-3 h-3" />
                    <span>{d} Days Left</span>
                </span>
            );
        }
        return (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                <CheckCircle2 className="w-3 h-3" />
                <span>{d} Days Left</span>
            </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 mb-0">Recruiter Subscriptions Master</h1>
                    <p className="text-xs text-gray-500 mt-1 mb-0">
                        Track subscription lifecycles, impending renewals, and manage plan assignments across all recruiters.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => router.push('/admin/recruiters/create')}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                    >
                        <CreditCard className="w-4 h-4" />
                        <span>Assign New Subscription</span>
                    </button>
                </div>
            </div>

            {/* Metric Cards (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                    onClick={() => setSelectedStatus('Active')}
                    className={`p-4 rounded-2xl transition-all cursor-pointer ${selectedStatus === 'Active'
                        ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-600">Active Subscriptions</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-gray-900">{summary.total_active}</span>
                        <span className="text-xs text-emerald-600 font-medium">In Good Standing</span>
                    </div>
                </div>

                <div
                    onClick={() => setSelectedStatus('expiring_soon')}
                    className={`p-4 rounded-2xl transition-all cursor-pointer ${selectedStatus === 'expiring_soon'
                        ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20'
                        : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-600">Expiring in 7 Days</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                            <Clock className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-gray-900">{summary.expiring_soon}</span>
                        <span className="text-xs text-amber-600 font-medium">Action Required</span>
                    </div>
                </div>

                <div
                    onClick={() => setSelectedStatus('Expired')}
                    className={`p-4 rounded-2xl transition-all cursor-pointer ${selectedStatus === 'Expired'
                        ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20'
                        : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-600">Expired (Past Due)</span>
                        <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-gray-900">{summary.expired}</span>
                        <span className="text-xs text-rose-600 font-medium">Pending Renewal</span>
                    </div>
                </div>

                <div
                    onClick={() => setSelectedStatus('Suspended')}
                    className={`p-4 rounded-2xl transition-all cursor-pointer ${selectedStatus === 'Suspended'
                        ? 'bg-gray-100 border-gray-400 ring-2 ring-gray-400/20'
                        : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-600">Suspended / Inactive</span>
                        <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold">
                            <Shield className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-gray-900">{summary.suspended}</span>
                        <span className="text-xs text-gray-500 font-medium">Access Disabled</span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-3 rounded-2xl border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search company or recruiter..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                    />
                </form>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                    <select
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:bg-white focus:border-blue-500"
                    >
                        <option value="">All Plans</option>
                        {plans.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:bg-white focus:border-blue-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="expiring_soon">Expiring Soon (7d)</option>
                        <option value="Expired">Expired</option>
                        <option value="Suspended">Suspended</option>
                    </select>

                    {(search || selectedPlanId || selectedStatus) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setSelectedPlanId('');
                                setSelectedStatus('');
                            }}
                            className="px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors whitespace-nowrap"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Subscriptions Master Table */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider bg-gray-50/50">
                                    <th className="py-3.5 px-5 font-semibold">Recruiter / Company</th>
                                    <th className="py-3.5 px-4 font-semibold">Assigned Plan</th>
                                    <th className="py-3.5 px-4 font-semibold">Cycle & Price</th>
                                    <th className="py-3.5 px-4 font-semibold">Start Date</th>
                                    <th className="py-3.5 px-4 font-semibold">Expiry Date</th>
                                    <th className="py-3.5 px-4 font-semibold">Validity Left</th>
                                    <th className="py-3.5 px-4 font-semibold">Status</th>
                                    <th className="py-3.5 px-5 font-semibold text-right">Quick Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="py-3.5 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                                <div className="space-y-1">
                                                    <div className="h-3.5 w-24 bg-gray-200 rounded"></div>
                                                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4"><div className="h-5 w-20 bg-gray-200 rounded-md"></div></td>
                                        <td className="py-3.5 px-4 space-y-1">
                                            <div className="h-3.5 w-16 bg-gray-200 rounded"></div>
                                            <div className="h-2.5 w-12 bg-gray-200 rounded"></div>
                                        </td>
                                        <td className="py-3.5 px-4"><div className="h-3.5 w-18 bg-gray-200 rounded"></div></td>
                                        <td className="py-3.5 px-4"><div className="h-3.5 w-18 bg-gray-200 rounded"></div></td>
                                        <td className="py-3.5 px-4"><div className="h-4 w-16 bg-gray-200 rounded-full"></div></td>
                                        <td className="py-3.5 px-4"><div className="h-5 w-16 bg-gray-200 rounded-full"></div></td>
                                        <td className="py-3.5 px-5 text-right"><div className="h-7 w-20 bg-gray-200 rounded-lg ml-auto"></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : subscriptions.length === 0 ? (
                    <div className="py-16 text-center space-y-2">
                        <CreditCard className="w-10 h-10 text-gray-300 mx-auto" />
                        <h3 className="text-sm font-bold text-gray-800">No Subscriptions Found</h3>
                        <p className="text-xs text-gray-400">Try adjusting your filters or search term.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider bg-gray-50/50">
                                    <th className="py-3.5 px-5 font-semibold">Recruiter / Company</th>
                                    <th className="py-3.5 px-4 font-semibold">Assigned Plan</th>
                                    <th className="py-3.5 px-4 font-semibold">Cycle & Price</th>
                                    <th className="py-3.5 px-4 font-semibold">Start Date</th>
                                    <th className="py-3.5 px-4 font-semibold">Expiry Date</th>
                                    <th className="py-3.5 px-4 font-semibold">Validity Left</th>
                                    <th className="py-3.5 px-4 font-semibold">Status</th>
                                    <th className="py-3.5 px-5 font-semibold text-right">Quick Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {subscriptions.map(s => (
                                    <tr key={s.subscription_id || s.recruiter_id} className="hover:bg-gray-50/60 transition-colors">
                                        {/* Recruiter / Company */}
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 border border-blue-100 overflow-hidden shadow-2xs">
                                                    {(() => {
                                                        const logoSrc = s.company_logo || s.profile_image || s.user_avatar;
                                                        return logoSrc ? (
                                                            <>
                                                                <img
                                                                    src={getImageUrl(logoSrc)}
                                                                    alt={s.company_name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        if (e.currentTarget.nextElementSibling) {
                                                                            e.currentTarget.nextElementSibling.style.display = 'flex';
                                                                        }
                                                                    }}
                                                                />
                                                                <span className="hidden items-center justify-center w-full h-full font-bold text-xs uppercase">
                                                                    {s.company_name?.charAt(0) || 'C'}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="font-bold text-xs uppercase">{s.company_name?.charAt(0) || 'C'}</span>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="min-w-0">
                                                    <span
                                                        onClick={() => router.push(`/admin/recruiters/${s.recruiter_id}`)}
                                                        className="font-bold text-gray-900 hover:text-blue-600 cursor-pointer truncate block"
                                                    >
                                                        {s.company_name || 'Individual Recruiter'}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 block truncate">
                                                        {s.recruiter_name} • {s.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Assigned Plan */}
                                        <td className="py-4 px-4">
                                            <span className="font-semibold text-gray-900 block">{s.plan_name || 'No Plan'}</span>
                                            <span className="text-[11px] text-gray-400 capitalize">{s.plan_type || 'Custom'}</span>
                                        </td>

                                        {/* Cycle & Price */}
                                        <td className="py-4 px-4">
                                            <span className="font-bold text-gray-900 block">₹{Number(s.price_paid || s.price || 0).toLocaleString()}</span>
                                            <span className="text-[11px] text-gray-400 capitalize">{s.billing_cycle || 'monthly'}</span>
                                        </td>

                                        {/* Start Date */}
                                        <td className="py-4 px-4 text-gray-600">
                                            {s.start_date ? new Date(s.start_date).toLocaleDateString() : 'N/A'}
                                        </td>

                                        {/* Expiry Date */}
                                        <td className="py-4 px-4 text-gray-600 font-medium">
                                            {s.expiry_date ? new Date(s.expiry_date).toLocaleDateString() : 'N/A'}
                                        </td>

                                        {/* Validity Left */}
                                        <td className="py-4 px-4">
                                            {getDaysBadge(s.days_left)}
                                        </td>

                                        {/* Status */}
                                        <td className="py-4 px-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${s.status === 'Active'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : s.status === 'Expired'
                                                    ? 'bg-rose-50 text-rose-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {s.status || 'Active'}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 px-5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => {
                                                        setSelectedRecruiter({
                                                            id: s.recruiter_id,
                                                            name: s.recruiter_name,
                                                            company_name: s.company_name,
                                                            plan_name: s.plan_name,
                                                            subscription_expiry: s.expiry_date
                                                        });
                                                        setIsExtendOpen(true);
                                                    }}
                                                    className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-[11px] font-medium transition-colors"
                                                    title="Extend Validity"
                                                >
                                                    Extend
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedRecruiter({
                                                            id: s.recruiter_id,
                                                            name: s.recruiter_name,
                                                            company_name: s.company_name,
                                                            current_plan_id: s.plan_id,
                                                            plan_name: s.plan_name,
                                                            subscription_expiry: s.expiry_date,
                                                            billing_cycle: s.billing_cycle
                                                        });
                                                        setIsChangePlanOpen(true);
                                                    }}
                                                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-semibold transition-colors"
                                                    title="Change Plan"
                                                >
                                                    Change Plan
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/admin/recruiters/${s.recruiter_id}`)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                                    title="View Full Profile"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {isChangePlanOpen && selectedRecruiter && (
                <ChangePlanModal
                    recruiter={selectedRecruiter}
                    onClose={() => {
                        setIsChangePlanOpen(false);
                        setSelectedRecruiter(null);
                    }}
                    onSuccess={() => {
                        setIsChangePlanOpen(false);
                        setSelectedRecruiter(null);
                        fetchData();
                    }}
                />
            )}

            {isExtendOpen && selectedRecruiter && (
                <ExtendSubscriptionModal
                    recruiter={selectedRecruiter}
                    onClose={() => {
                        setIsExtendOpen(false);
                        setSelectedRecruiter(null);
                    }}
                    onSuccess={() => {
                        setIsExtendOpen(false);
                        setSelectedRecruiter(null);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}
