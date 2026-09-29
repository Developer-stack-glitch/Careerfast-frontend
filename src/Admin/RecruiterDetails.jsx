'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building, User, Mail, Phone, Globe, MapPin, Lock,
    Sparkles, Calendar, CreditCard,
    AlertCircle, ArrowLeft, Loader2,
    ExternalLink, Users, History, Receipt, ScrollText, ToggleLeft, ToggleRight
} from 'lucide-react';
import {
    getAdminRecruiterDetails,
    updateAdminRecruiterStatus
} from '../ApiService/action';
import toast from 'react-hot-toast';
import ChangePlanModal from './ChangePlanModal';
import ExtendSubscriptionModal from './ExtendSubscriptionModal';
import ResetPasswordModal from './ResetPasswordModal';
import ManageRecruiterTeam from './ManageRecruiterTeam';
import { AdminDetailSkeleton } from './AdminSkeletons';
import { getImageUrl } from '../utils/getImageUrl';

export default function RecruiterDetails({ recruiterId }) {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [recruiterData, setRecruiterData] = useState(null);
    const [activeTab, setActiveTab] = useState('team'); // 'team' | 'history' | 'payments' | 'audit'

    // Modals
    const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
    const [isExtendOpen, setIsExtendOpen] = useState(false);
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const res = await getAdminRecruiterDetails(recruiterId);
            const raw = res.data?.data || res.data;
            if (raw) {
                if (raw.recruiter) {
                    setRecruiterData(raw);
                } else {
                    setRecruiterData({
                        recruiter: raw,
                        subscription_history: raw.subscription_history || [],
                        payments: raw.payments || [],
                        audit_logs: raw.audit_logs || []
                    });
                }
            } else {
                setRecruiterData(null);
            }
        } catch (err) {
            console.error("Failed to load recruiter details:", err);
            toast.error("Failed to load recruiter profile details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (recruiterId) {
            fetchDetails();
        }
    }, [recruiterId]);

    const r = recruiterData?.recruiter || (recruiterData?.recruiter_id ? recruiterData : null);

    // Normalize user_active (handles MySQL BIT(1) Buffer { type: 'Buffer', data: [1] }, number, boolean, or string)
    const isUserActive = Boolean(
        r?.user_active === 1 ||
        r?.user_active === true ||
        r?.user_active === '1' ||
        (r?.user_active?.data && r.user_active.data[0] === 1) ||
        r?.is_active === 1 ||
        r?.is_active === true ||
        (r?.is_active?.data && r.is_active.data[0] === 1)
    );

    const handleToggleStatus = async () => {
        if (!r) return;
        const currentActive = isUserActive;
        const nextActive = currentActive ? 0 : 1;
        const newStatus = nextActive ? 'active' : 'suspended';
        const confirmMsg = currentActive
            ? "Are you sure you want to suspend this recruiter? They will not be able to log in or post jobs."
            : "Are you sure you want to activate this recruiter?";

        if (!window.confirm(confirmMsg)) return;

        try {
            setStatusUpdating(true);
            await updateAdminRecruiterStatus(r.recruiter_id || recruiterId, {
                is_active: nextActive,
                status: newStatus,
                reason: currentActive ? 'Suspended by Super Admin' : 'Reactivated by Super Admin'
            });
            toast.success(`Recruiter has been ${nextActive ? 'activated' : 'suspended'}.`);
            fetchDetails();
        } catch (err) {
            console.error("Failed to update status:", err);
            const msg = err?.response?.data?.message || "Failed to update recruiter status.";
            toast.error(msg);
        } finally {
            setStatusUpdating(false);
        }
    };

    if (loading) {
        return <AdminDetailSkeleton />;
    }

    if (!recruiterData || !r) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-xl mx-auto space-y-4">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <h2 className="text-lg font-bold text-gray-900">Recruiter Not Found</h2>
                <p className="text-sm text-gray-500">The requested recruiter profile does not exist or was removed.</p>
                <button
                    onClick={() => router.push('/admin/recruiters')}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700"
                >
                    Back to All Recruiters
                </button>
            </div>
        );
    }

    const historyList = recruiterData.subscription_history || [];
    const paymentsList = recruiterData.payments || [];
    const auditLogsList = recruiterData.audit_logs || [];

    // Calculate days remaining
    let daysRemaining = null;
    let isExpiringSoon = false;
    let isExpired = false;
    if (r.subscription_expiry) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exp = new Date(r.subscription_expiry);
        exp.setHours(0, 0, 0, 0);
        const diffTime = exp - today;
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysRemaining <= 0) {
            isExpired = true;
        } else if (daysRemaining <= 7) {
            isExpiringSoon = true;
        }
    }

    // Usage Progress helper
    const renderUsageMeter = (label, used, limit, unit = '') => {
        const parsedLimit = Number(limit) || 0;
        const parsedUsed = Number(used) || 0;
        const percentage = parsedLimit > 0 ? Math.min(Math.round((parsedUsed / parsedLimit) * 100), 100) : 0;
        const isNearLimit = percentage >= 80;
        const isOverLimit = percentage >= 100;

        return (
            <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">{label}</span>
                    <span className="font-bold text-gray-900">
                        {parsedUsed} <span className="text-gray-400 font-normal">/ {parsedLimit} {unit}</span>
                    </span>
                </div>
                <div className="w-full h-2 bg-gray-200/80 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${isOverLimit
                            ? 'bg-rose-500'
                            : isNearLimit
                                ? 'bg-amber-500'
                                : 'bg-blue-600'
                            }`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{percentage}% utilized</span>
                    {isNearLimit && (
                        <span className={`font-semibold ${isOverLimit ? 'text-rose-600' : 'text-amber-600'}`}>
                            {isOverLimit ? 'Quota Reached' : 'Approaching Limit'}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-16">
            {/* Top Bar with Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/admin/recruiters')}
                        className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        title="Back to Recruiters List"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl font-bold text-gray-900 mb-0">{r.company_name || 'Recruiter Company'}</h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isUserActive
                                ? 'bg-emerald-50 text-emerald-700 border-1 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-1 border-rose-200'
                                }`}>
                                {isUserActive ? 'Active Account' : 'Suspended'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 mb-0">
                            Recruiter ID #{r.recruiter_id} • Member since {r.created_date ? new Date(r.created_date).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsResetPasswordOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                        <span>Reset Password</span>
                    </button>
                    <button
                        onClick={handleToggleStatus}
                        disabled={statusUpdating}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${isUserActive
                            ? 'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100'
                            : 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            }`}
                    >
                        {isUserActive ? (
                            <>
                                <ToggleRight className="w-4 h-4" />
                                <span>Suspend Access</span>
                            </>
                        ) : (
                            <>
                                <ToggleLeft className="w-4 h-4" />
                                <span>Activate Access</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Top Row: 2 Cards (Company/Recruiter Overview & Current Subscription) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Recruiter & Company Overview Card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-xl overflow-hidden shrink-0 shadow-xs">
                            {(() => {
                                const logoSrc = r.company_logo || r.profile_image || r.user_avatar;
                                return logoSrc ? (
                                    <>
                                        <img
                                            src={getImageUrl(logoSrc)}
                                            alt={r.company_name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                if (e.currentTarget.nextElementSibling) {
                                                    e.currentTarget.nextElementSibling.style.display = 'flex';
                                                }
                                            }}
                                        />
                                        <div className="w-full h-full hidden items-center justify-center font-bold text-blue-600 text-xl bg-blue-50">
                                            {r.company_name?.charAt(0)?.toUpperCase() || 'C'}
                                        </div>
                                    </>
                                ) : (
                                    <span>{r.company_name?.charAt(0)?.toUpperCase() || 'C'}</span>
                                );
                            })()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base font-bold text-gray-900 truncate mb-0">{r.company_name}</h2>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 mb-0">
                                <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="truncate">{r.industry_type || 'Technology'} • {r.organization_type || 'Corporate'}</span>
                            </p>
                            {r.website_url && (
                                <a
                                    href={r.website_url.startsWith('http') ? r.website_url : `https://${r.website_url}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1 font-medium"
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    <span>{r.website_url}</span>
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Contact Person Details */}
                    <div className="space-y-2.5 text-xs">
                        <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Contact Person</span>
                        <div className="flex items-center gap-2 text-gray-700">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900">{r.recruiter_name}</span>
                            {r.designation && (
                                <span className="text-gray-500">({r.designation})</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="truncate font-mono">{r.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{r.phone || r.company_phone || 'No Phone provided'}</span>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Address & GST */}
                    <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                            <span>
                                {[r.address1, r.city, r.state, r.pincode].filter(Boolean).join(', ') || 'No address specified'}
                            </span>
                        </div>
                        {r.gst_number && (
                            <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-gray-500">
                                <span className="font-semibold text-gray-700">GST:</span> {r.gst_number}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Current Subscription Card */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-gray-900 mb-0">{r.plan_name || 'No Plan Assigned'}</h2>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${r.subscription_status === 'Active'
                                            ? isExpiringSoon
                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : isExpired
                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                                            }`}>
                                            {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : r.subscription_status || 'Active'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5 mb-0">
                                        Billing Cycle: <span className="capitalize font-medium text-gray-700">{r.billing_cycle || 'monthly'}</span> • Price: ₹{Number(r.price_paid || r.plan_price || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                {daysRemaining !== null && (
                                    <div className={`text-sm font-bold ${isExpired
                                        ? 'text-rose-600'
                                        : isExpiringSoon
                                            ? 'text-amber-600'
                                            : 'text-emerald-600'
                                        }`}>
                                        {isExpired ? 'Plan Expired' : `${daysRemaining} Days Left`}
                                    </div>
                                )}
                                <span className="text-[11px] text-gray-400">
                                    Expires {r.subscription_expiry ? new Date(r.subscription_expiry).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </div>

                        {/* Dates grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs">
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <span className="text-gray-400 block text-[11px]">Start Date</span>
                                <span className="font-semibold text-gray-800">
                                    {r.subscription_start ? new Date(r.subscription_start).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <span className="text-gray-400 block text-[11px]">Expiry Date</span>
                                <span className="font-semibold text-gray-800">
                                    {r.subscription_expiry ? new Date(r.subscription_expiry).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <span className="text-gray-400 block text-[11px]">Payment Status</span>
                                <span className={`font-semibold ${r.payment_status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'
                                    }`}>
                                    {r.payment_status || 'Paid'}
                                </span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <span className="text-gray-400 block text-[11px]">Active Jobs Limit</span>
                                <span className="font-semibold text-gray-800">
                                    {r.active_job_limit} Maximum
                                </span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <span className="text-gray-400 block text-[11px]">Sub-Recruiter Seats</span>
                                <span className="font-semibold text-gray-800">
                                    {r.sub_recruiter_limit || 1} Allowed
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-end gap-3">
                        <button
                            onClick={() => {
                                const hasPlan = Boolean(r.plan_name && r.plan_name !== 'No Plan' && r.plan_name !== 'No Plan Assigned' && r.plan_id);
                                if (!hasPlan) {
                                    toast.error("This recruiter has no active plan. Please click 'Change Subscription Plan' to assign a plan first.");
                                    return;
                                }
                                setIsExtendOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>Extend Validity</span>
                        </button>
                        <button
                            onClick={() => setIsChangePlanOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Change Subscription Plan</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Section 3: Usage Progress Cards (Real-time vs Plan Limits) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 mb-0">Current Quota & Real-time Usage</h3>
                        <p className="text-xs text-gray-500 mb-0">Live limits enforced across the Recruiter portal</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border-1 border-blue-100">
                        Dynamic Plan Bounds
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    {renderUsageMeter('Monthly Job Posts', r.job_posts_used, r.job_post_limit, 'posts')}
                    {renderUsageMeter('Active Jobs on Portal', r.active_jobs_count, r.active_job_limit, 'active')}
                    {renderUsageMeter('Resume Views', r.resume_views_used, r.resume_view_limit, 'views')}
                    {renderUsageMeter('Sub-Recruiter Seats', r.sub_recruiters_count, r.sub_recruiter_limit || 1, 'seats')}
                    {renderUsageMeter('Resume Downloads', r.resume_downloads_used, r.resume_download_limit, 'resumes')}
                    {renderUsageMeter('Candidate Contacts', r.candidate_contacts_used, r.candidate_contact ? 100 : 0, 'contacts')}
                    {renderUsageMeter('Featured Job Credits', r.featured_jobs_used, r.featured_job_limit, 'credits')}
                </div>
            </div>

            {/* Section 4: Tabbed Team, History, Payments & Audit Logs */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Tabs */}
                <div className="flex flex-wrap border-b border-gray-100 px-6 pt-2">
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`flex items-center gap-2 py-2 px-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'team'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>Team & Sub-Recruiters</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 py-4 px-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'history'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <History className="w-4 h-4" />
                        <span>Subscription History ({historyList.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('payments')}
                        className={`flex items-center gap-2 py-4 px-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'payments'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <Receipt className="w-4 h-4" />
                        <span>Payment History ({paymentsList.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`flex items-center gap-2 py-4 px-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'audit'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <ScrollText className="w-4 h-4" />
                        <span>Admin Audit Trail ({auditLogsList.length})</span>
                    </button>
                </div>

                {/* Tab 0: Team & Sub-Recruiters */}
                {activeTab === 'team' && (
                    <div className="p-6">
                        <ManageRecruiterTeam recruiterId={recruiterId} isAdminView={true} />
                    </div>
                )}

                {/* Tab 1: Subscription History */}
                {activeTab === 'history' && (
                    <div className="p-6">
                        {historyList.length === 0 ? (
                            <div className="py-12 text-center text-xs text-gray-400">
                                No past subscription changes recorded yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                                            <th className="py-3 px-4 font-semibold">Change Type</th>
                                            <th className="py-3 px-4 font-semibold">Previous Plan</th>
                                            <th className="py-3 px-4 font-semibold">New Plan</th>
                                            <th className="py-3 px-4 font-semibold">Effective Date</th>
                                            <th className="py-3 px-4 font-semibold">Expiry Date</th>
                                            <th className="py-3 px-4 font-semibold">Reason</th>
                                            <th className="py-3 px-4 font-semibold">Admin</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {historyList.map(h => (
                                            <tr key={h.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="py-3 px-4 font-semibold text-gray-800 capitalize">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${h.change_type === 'upgrade'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : h.change_type === 'downgrade'
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : 'bg-blue-50 text-blue-700'
                                                        }`}>
                                                        {h.change_type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-500">{h.previous_plan_name || 'None'}</td>
                                                <td className="py-3 px-4 font-semibold text-blue-600">{h.new_plan_name || 'Active'}</td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    {h.effective_date ? new Date(h.effective_date).toLocaleDateString() : 'Immediate'}
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    {h.expiry_date ? new Date(h.expiry_date).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{h.reason || '—'}</td>
                                                <td className="py-3 px-4 text-gray-700 font-medium">
                                                    {h.admin_first_name ? `${h.admin_first_name} ${h.admin_last_name || ''}` : 'Super Admin'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2: Payment History */}
                {activeTab === 'payments' && (
                    <div className="p-6">
                        {paymentsList.length === 0 ? (
                            <div className="py-12 text-center text-xs text-gray-400">
                                No payment invoices found for this recruiter.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                                            <th className="py-3 px-4 font-semibold">Payment ID</th>
                                            <th className="py-3 px-4 font-semibold">Amount</th>
                                            <th className="py-3 px-4 font-semibold">Method</th>
                                            <th className="py-3 px-4 font-semibold">Status</th>
                                            <th className="py-3 px-4 font-semibold">Date</th>
                                            <th className="py-3 px-4 font-semibold">Transaction ID / Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {paymentsList.map(p => (
                                            <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="py-3 px-4 font-mono font-semibold text-gray-700">#PAY-{p.id}</td>
                                                <td className="py-3 px-4 font-bold text-gray-900">₹{Number(p.amount).toLocaleString()}</td>
                                                <td className="py-3 px-4 text-gray-600 capitalize">{p.payment_method || 'Online'}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.payment_status === 'Paid'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                        }`}>
                                                        {p.payment_status || 'Paid'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-500">
                                                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="py-3 px-4 text-gray-500 font-mono text-[11px] truncate max-w-xs">
                                                    {p.transaction_id || p.notes || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 3: Admin Audit Logs */}
                {activeTab === 'audit' && (
                    <div className="p-6">
                        {auditLogsList.length === 0 ? (
                            <div className="py-12 text-center text-xs text-gray-400">
                                No audit events logged for this recruiter.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-gray-400 uppercase text-[10px] tracking-wider">
                                            <th className="py-3 px-4 font-semibold">Timestamp</th>
                                            <th className="py-3 px-4 font-semibold">Action</th>
                                            <th className="py-3 px-4 font-semibold">Admin</th>
                                            <th className="py-3 px-4 font-semibold">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {auditLogsList.map(a => (
                                            <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                                                    {a.created_at ? new Date(a.created_at).toLocaleString() : 'N/A'}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-gray-800">
                                                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[11px]">
                                                        {a.action}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-medium text-gray-900">
                                                    {a.admin_first_name ? `${a.admin_first_name} ${a.admin_last_name || ''}` : 'Super Admin'}
                                                </td>
                                                <td className="py-3 px-4 text-gray-600 max-w-md">
                                                    {typeof a.details === 'object' ? JSON.stringify(a.details) : a.details || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {isChangePlanOpen && (
                <ChangePlanModal
                    isOpen={isChangePlanOpen}
                    recruiter={{
                        id: r.recruiter_id,
                        recruiter_id: r.recruiter_id,
                        name: r.recruiter_name,
                        company_name: r.company_name,
                        current_plan_id: r.plan_id,
                        plan_id: r.plan_id,
                        plan_name: r.plan_name,
                        subscription_expiry: r.subscription_expiry,
                        billing_cycle: r.billing_cycle,
                        job_post_limit: r.job_post_limit,
                        active_job_limit: r.active_job_limit,
                        resume_view_limit: r.resume_view_limit,
                        resume_download_limit: r.resume_download_limit
                    }}
                    onClose={() => setIsChangePlanOpen(false)}
                    onSuccess={() => {
                        setIsChangePlanOpen(false);
                        fetchDetails();
                    }}
                />
            )}

            {isExtendOpen && (
                <ExtendSubscriptionModal
                    isOpen={isExtendOpen}
                    recruiter={{
                        id: r.recruiter_id,
                        recruiter_id: r.recruiter_id,
                        name: r.recruiter_name,
                        company_name: r.company_name,
                        plan_name: r.plan_name,
                        subscription_expiry: r.subscription_expiry
                    }}
                    onClose={() => setIsExtendOpen(false)}
                    onSuccess={() => {
                        setIsExtendOpen(false);
                        fetchDetails();
                    }}
                />
            )}

            {isResetPasswordOpen && (
                <ResetPasswordModal
                    isOpen={isResetPasswordOpen}
                    recruiter={{
                        id: r.recruiter_id,
                        recruiter_id: r.recruiter_id,
                        name: r.recruiter_name,
                        email: r.email,
                        company_name: r.company_name
                    }}
                    onClose={() => setIsResetPasswordOpen(false)}
                    onSuccess={() => {
                        setIsResetPasswordOpen(false);
                    }}
                />
            )}
        </div>
    );
}
