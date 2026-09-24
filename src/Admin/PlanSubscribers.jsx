'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, ArrowLeft, Search, Building,
    RefreshCw, Loader2
} from 'lucide-react';
import {
    getAdminPlans,
    getAdminPlanSubscribers,
    getAdminSubscriptions,
    updateAdminRecruiterStatus
} from '../ApiService/action';
import toast from 'react-hot-toast';

export default function PlanSubscribers({ planId = null }) {
    const router = useRouter();
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState(planId || 'ALL');
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        loadPlans();
    }, []);

    useEffect(() => {
        loadSubscribers();
    }, [selectedPlanId]);

    const loadPlans = async () => {
        try {
            const res = await getAdminPlans();
            if (res?.data?.success) {
                setPlans(res.data.data || []);
            }
        } catch (err) {
            console.error("Failed to load plans list:", err);
        }
    };

    const loadSubscribers = async () => {
        try {
            setLoading(true);
            if (selectedPlanId && selectedPlanId !== 'ALL') {
                const res = await getAdminPlanSubscribers(selectedPlanId);
                if (res?.data?.success) {
                    setSubscribers(res.data.data || []);
                }
            } else {
                const res = await getAdminSubscriptions();
                if (res?.data?.success) {
                    setSubscribers(res.data.data || []);
                }
            }
        } catch (error) {
            console.error("Error fetching subscribers:", error);
            toast.error("Failed to load plan subscribers.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (sub) => {
        try {
            const nextActive = sub.status === 'Suspended' ? 1 : 0;
            const res = await updateAdminRecruiterStatus(sub.recruiter_id, { is_active: nextActive });
            if (res?.data?.success) {
                toast.success(`Recruiter status updated.`);
                loadSubscribers();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status.");
        }
    };

    const filteredSubscribers = subscribers.filter(sub => {
        const matchesSearch = (sub.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sub.recruiter_name || `${sub.first_name || ''} ${sub.last_name || ''}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sub.email || sub.recruiter_email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter || sub.subscription_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const currentPlanObj = plans.find(p => String(p.id) === String(selectedPlanId));

    return (
        <div className="w-full max-w-7xl mx-auto font-sans pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/admin/plans')}
                        className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-0 flex items-center gap-2">
                            <Users className="w-6 h-6 text-blue-600" />
                            {currentPlanObj ? `${currentPlanObj.name} Subscribers` : 'All Plan Subscribers'}
                        </h1>
                        <p className="text-[13px] text-gray-500 mt-0.5 mb-0">
                            {filteredSubscribers.length} total active and historical subscriptions
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Plan Selector */}
                    <select
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-700 focus:outline-none focus:border-blue-500"
                    >
                        <option value="ALL">All Plans</option>
                        {plans.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} (₹{Number(p.price).toLocaleString()}/mo)
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={loadSubscribers}
                        className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-3 border border-gray-100 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search company, recruiter, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-700 focus:outline-none focus:bg-white focus:border-blue-500"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Expiring Soon">Expiring Soon</option>
                        <option value="Expired">Expired</option>
                        <option value="Suspended">Suspended</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                    <p className="text-[14px] text-gray-500">Loading subscribers...</p>
                </div>
            ) : filteredSubscribers.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-gray-900">No subscribers found</h3>
                    <p className="text-[13px] text-gray-500 mt-1 max-w-sm mx-auto">
                        There are currently no recruiters assigned to this plan matching your search filter.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[13px]">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/70 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="py-3.5 px-4">Company</th>
                                    <th className="py-3.5 px-4">Recruiter</th>
                                    <th className="py-3.5 px-4">Plan & Billing</th>
                                    <th className="py-3.5 px-4">Start Date</th>
                                    <th className="py-3.5 px-4">Expiry Date</th>
                                    <th className="py-3.5 px-4">Job Usage</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredSubscribers.map((sub) => {
                                    const recruiterName = sub.recruiter_name || `${sub.first_name || ''} ${sub.last_name || ''}`.trim() || 'Recruiter';
                                    const email = sub.recruiter_email || sub.email;
                                    const status = sub.status || sub.subscription_status || 'Active';
                                    const planName = sub.plan_name || currentPlanObj?.name || 'Assigned Plan';

                                    const startDateFormatted = sub.start_date ? new Date(sub.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
                                    const expiryDateFormatted = sub.expiry_date ? new Date(sub.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

                                    return (
                                        <tr key={sub.subscription_id || sub.id} className="hover:bg-gray-50/80 transition-colors">
                                            {/* Company */}
                                            <td className="py-4 px-4 font-semibold text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <Building className="w-4 h-4 text-gray-400" />
                                                    {sub.company_name || 'Individual Recruiter'}
                                                </div>
                                            </td>

                                            {/* Recruiter */}
                                            <td className="py-4 px-4">
                                                <div className="font-medium text-gray-900">{recruiterName}</div>
                                                <div className="text-[11px] text-gray-400">{email}</div>
                                            </td>

                                            {/* Plan & Cycle */}
                                            <td className="py-4 px-4">
                                                <span className="font-semibold text-blue-600">{planName}</span>
                                                <span className="block text-[11px] text-gray-400 capitalize">{sub.billing_cycle || 'monthly'}</span>
                                            </td>

                                            {/* Start Date */}
                                            <td className="py-4 px-4 text-gray-600">
                                                {startDateFormatted}
                                            </td>

                                            {/* Expiry Date */}
                                            <td className="py-4 px-4 text-gray-600">
                                                {expiryDateFormatted}
                                            </td>

                                            {/* Usage */}
                                            <td className="py-4 px-4">
                                                <span className="font-medium text-gray-800">
                                                    {sub.job_posts_used || 0} / {sub.job_post_limit || 15} Posts
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-1 border-emerald-200' :
                                                    status === 'Expired' ? 'bg-red-50 text-red-700 border-1 border-red-200' :
                                                        status === 'Suspended' ? 'bg-amber-50 text-amber-700 border-1 border-amber-200' :
                                                            'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500' :
                                                        status === 'Expired' ? 'bg-red-500' :
                                                            status === 'Suspended' ? 'bg-amber-500' : 'bg-gray-400'
                                                        }`}></span>
                                                    {status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => router.push(`/admin/recruiters/${sub.recruiter_id}`)}
                                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1"
                                                    >
                                                        View Details
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(sub)}
                                                        className={`p-1.5 rounded-lg text-xs font-medium border ${status === 'Suspended'
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                            }`}
                                                        title={status === 'Suspended' ? 'Activate Recruiter' : 'Suspend Recruiter'}
                                                    >
                                                        {status === 'Suspended' ? 'Activate' : 'Suspend'}
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
            )}
        </div>
    );
}
