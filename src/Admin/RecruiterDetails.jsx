'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building, User, Mail, Phone, Globe, MapPin, Lock,
    Sparkles, Calendar, CreditCard,
    AlertCircle, ArrowLeft, Loader2,
    ExternalLink, Users, UserPlus, UserCheck, History, Receipt, ScrollText, ToggleLeft, ToggleRight,
    LogIn,
    Pencil, Sliders,
    CheckCircle2, Clock, Briefcase, BadgeCheck, ShieldCheck, ChevronRight, Layers,
    BarChart2, FileText, Eye, EyeOff, Download, MessageCircle, FileSpreadsheet, Settings, X, Plus
} from 'lucide-react';
import {
    getAdminRecruiterDetails,
    updateAdminRecruiterStatus,
    toggleAdminRecruiterAutoApprove,
    loginAsRecruiter,
    addAdminMasterRecruiter,
    updateAdminMasterRecruiterSeats
} from '../ApiService/action';
import toast from 'react-hot-toast';
import ChangePlanModal from './ChangePlanModal';
import ExtendSubscriptionModal from './ExtendSubscriptionModal';
import ResetPasswordModal from './ResetPasswordModal';
import CustomPlanModal from './CustomPlanModal';
import RecruiterStatusModal from './RecruiterStatusModal';
import ManageRecruiterTeam from './ManageRecruiterTeam';
import { AdminDetailSkeleton } from './AdminSkeletons';
import { getImageUrl } from '../utils/getImageUrl';

export default function RecruiterDetails({ recruiterId }) {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [recruiterData, setRecruiterData] = useState(null);
    const [activeTab, setActiveTab] = useState('masters'); // 'masters' | 'team' | 'history' | 'payments' | 'audit'

    // Modals
    const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
    const [isExtendOpen, setIsExtendOpen] = useState(false);
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
    const [isCustomPlanOpen, setIsCustomPlanOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);

    // Master Recruiter Management State
    const [isAddMasterOpen, setIsAddMasterOpen] = useState(false);
    const [masterSubmitting, setMasterSubmitting] = useState(false);
    const [showMasterPassword, setShowMasterPassword] = useState(false);
    const [masterFormData, setMasterFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        allocated_seats: 1
    });

    const [editSeatsModal, setEditSeatsModal] = useState({
        isOpen: false,
        master: null,
        seats: 0,
        submitting: false
    });

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
    const masterRecruitersList = r?.master_recruiters || [];
    const totalCompanySeats = Number(r?.total_sub_recruiter_seats || r?.sub_recruiter_limit || 1);
    const totalAllocatedSeats = masterRecruitersList.reduce((acc, m) => acc + Number(m.allocated_seats || 0), 0);
    const availableUnallocatedSeats = Math.max(0, totalCompanySeats - totalAllocatedSeats);

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

    const [autoApproveUpdating, setAutoApproveUpdating] = useState(false);

    // Normalize auto_approve (handles MySQL BIT(1) Buffer { type: 'Buffer', data: [1] }, number, boolean, or string)
    const isAutoApprove = Boolean(
        r?.auto_approve === 1 ||
        r?.auto_approve === true ||
        r?.auto_approve === '1' ||
        (r?.auto_approve?.data && r.auto_approve.data[0] === 1)
    );

    const handleToggleAutoApprove = async () => {
        if (!r) return;
        try {
            setAutoApproveUpdating(true);
            const newStatus = isAutoApprove ? 0 : 1;
            const res = await toggleAdminRecruiterAutoApprove(r.recruiter_id || recruiterId, { auto_approve: newStatus });
            if (res.data?.success) {
                toast.success(res.data.message || `Job auto-approve ${newStatus ? 'enabled' : 'disabled'} successfully.`);
                setRecruiterData(prev => {
                    if (!prev) return prev;
                    if (prev.recruiter) {
                        return {
                            ...prev,
                            recruiter: {
                                ...prev.recruiter,
                                auto_approve: newStatus
                            }
                        };
                    }
                    return {
                        ...prev,
                        auto_approve: newStatus
                    };
                });
            } else {
                toast.error(res.data?.message || "Failed to update auto approve status.");
            }
        } catch (err) {
            console.error("Failed to update auto approve status:", err);
            toast.error("Failed to update auto approve status.");
        } finally {
            setAutoApproveUpdating(false);
        }
    };

    const handleToggleStatus = () => {
        if (!r) return;
        setIsStatusModalOpen(true);
    };

    const handleLoginAsRecruiter = async () => {
        const recName = r?.recruiter_name?.trim() || `${r?.first_name || ''} ${r?.last_name || ''}`.trim() || r?.company_name || 'Recruiter';
        const toastId = toast.loading(`Generating recruiter session for ${recName}...`);
        try {
            const res = await loginAsRecruiter(r?.recruiter_id || recruiterId);
            if (res.data?.success && res.data?.token) {
                toast.success(`Opening Recruiter Portal as ${recName}...`, { id: toastId });
                const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                const defaultHrUrl = isLocalhost ? 'http://localhost:3001' : 'http://recruit.careerfast.in';
                const hrBaseUrl = process.env.NEXT_PUBLIC_HR_PORTAL_URL || defaultHrUrl;
                const rawData = res.data?.data || {};
                const safeData = {
                    id: rawData.id || r?.recruiter_id || recruiterId,
                    first_name: rawData.first_name || 'Recruiter',
                    last_name: rawData.last_name || '',
                    email: rawData.email || '',
                    role_id: rawData.role_id || 3,
                    role_name: rawData.role_name || 'recruiter',
                    company_name: rawData.company_name || r?.company_name || 'Recruiter',
                    organization: rawData.organization || '',
                    company_id: rawData.company_id || null,
                    is_email_verified: 1,
                    impersonated_by_admin: true,
                };
                const targetUrl = `${hrBaseUrl}/login?impersonate_token=${encodeURIComponent(res.data.token)}&impersonate_data=${encodeURIComponent(JSON.stringify(safeData))}&target=/overview`;
                window.open(targetUrl, '_blank');
            } else {
                toast.error(res.data?.message || "Failed to login as recruiter.", { id: toastId });
            }
        } catch (err) {
            console.error("Error in handleLoginAsRecruiter:", err);
            toast.error(err?.response?.data?.message || err?.message || "Failed to login as recruiter.", { id: toastId });
        }
    };

    const handleGenerateMasterPassword = () => {
        const randomStr = Math.random().toString(36).substring(2, 6);
        const special = ['!', '@', '#', '$', '%'][Math.floor(Math.random() * 5)];
        const generatedPassword = `Fast@${randomStr.toUpperCase()}${Math.floor(100 + Math.random() * 900)}${special}`;
        setMasterFormData(prev => ({
            ...prev,
            password: generatedPassword
        }));
        setShowMasterPassword(true);
        toast.success("Generated secure password!");
    };

    const handleAddMasterRecruiter = async (e) => {
        e.preventDefault();
        if (!masterFormData.first_name.trim()) return toast.error("First name is required.");
        if (!masterFormData.email.trim()) return toast.error("Email is required.");
        if (!masterFormData.password || masterFormData.password.length < 6) return toast.error("Password must be at least 6 characters.");

        const reqSeats = Number(masterFormData.allocated_seats || 0);
        if (reqSeats > availableUnallocatedSeats) {
            return toast.error(`Cannot allocate ${reqSeats} seats. Only ${availableUnallocatedSeats} unallocated seats available in company pool.`);
        }

        try {
            setMasterSubmitting(true);
            const res = await addAdminMasterRecruiter(r?.recruiter_id || recruiterId, {
                ...masterFormData,
                allocated_seats: reqSeats
            });
            if (res.data?.success) {
                toast.success("Master Recruiter added successfully!");
                setIsAddMasterOpen(false);
                setMasterFormData({
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    password: '',
                    allocated_seats: 0
                });
                fetchDetails();
            }
        } catch (err) {
            console.error("Failed to add master recruiter:", err);
            toast.error(err?.response?.data?.message || err?.message || "Failed to add master recruiter.");
        } finally {
            setMasterSubmitting(false);
        }
    };

    const handleSaveMasterSeats = async (e) => {
        e.preventDefault();
        if (!editSeatsModal.master) return;
        const newSeats = Number(editSeatsModal.seats || 0);
        const minAllowed = Number(editSeatsModal.master?.sub_recruiters_count || 0);
        const maxAllowed = Number(editSeatsModal.master?.allocated_seats || 0) + availableUnallocatedSeats;

        if (newSeats < minAllowed) {
            return toast.error(`Seats cannot be less than ${minAllowed} (currently active sub-recruiters for this master).`);
        }
        if (newSeats > maxAllowed) {
            return toast.error(`Seats cannot exceed ${maxAllowed} (maximum available in company pool).`);
        }

        try {
            setEditSeatsModal(prev => ({ ...prev, submitting: true }));
            const res = await updateAdminMasterRecruiterSeats(editSeatsModal.master.id, newSeats);
            if (res.data?.success) {
                toast.success("Master Recruiter seat allocation updated!");
                setEditSeatsModal({ isOpen: false, master: null, seats: 0, submitting: false });
                fetchDetails();
            }
        } catch (err) {
            console.error("Failed to update master seats:", err);
            toast.error(err?.response?.data?.message || err?.message || "Failed to update master seats.");
        } finally {
            setEditSeatsModal(prev => ({ ...prev, submitting: false }));
        }
    };

    const handleLoginAsMaster = async (masterId, masterName) => {
        const toastId = toast.loading(`Generating session for ${masterName}...`);
        try {
            const res = await loginAsRecruiter(masterId);
            if (res.data?.success && res.data?.token) {
                toast.success(`Opening recruiter portal as ${masterName}...`, { id: toastId });
                const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                const defaultHrUrl = isLocalhost ? 'http://localhost:3001' : 'http://recruit.careerfast.in';
                const hrBaseUrl = process.env.NEXT_PUBLIC_HR_PORTAL_URL || defaultHrUrl;
                const rawData = res.data?.data || {};
                const safeData = {
                    id: rawData.id || masterId,
                    first_name: rawData.first_name || 'Recruiter',
                    last_name: rawData.last_name || '',
                    email: rawData.email || '',
                    role_id: rawData.role_id || 3,
                    role_name: rawData.role_name || 'recruiter',
                    company_name: rawData.company_name || r?.company_name || 'Recruiter',
                    organization: rawData.organization || '',
                    company_id: rawData.company_id || null,
                    is_email_verified: 1,
                    impersonated_by_admin: true,
                };
                const targetUrl = `${hrBaseUrl}/login?impersonate_token=${encodeURIComponent(res.data.token)}&impersonate_data=${encodeURIComponent(JSON.stringify(safeData))}&target=/overview`;
                window.open(targetUrl, '_blank');
            } else {
                toast.error(res.data?.message || "Failed to login as recruiter.", { id: toastId });
            }
        } catch (err) {
            console.error("Error logging in as master:", err);
            toast.error(err?.response?.data?.message || err?.message || "Failed to login.", { id: toastId });
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

    const historyList = recruiterData?.subscription_history || [];
    const paymentsList = recruiterData?.payments || [];
    const auditLogsList = recruiterData?.audit_logs || [];

    const planName = r.plan_name || '';
    const isCustomRaw = r.plan_type === 'custom' || /custom/i.test(planName);
    const isOnlyJobPostPlan = /only job post/i.test(planName) || (
        isCustomRaw &&
        Number(r.resume_view_limit || 0) === 0 &&
        Number(r.resume_download_limit || 0) === 0 &&
        Number(r.email_limit || 0) === 0 &&
        Number(r.whatsapp_limit || 0) === 0 &&
        Number(r.excel_download_limit || 0) === 0
    );
    const isCustom = isCustomRaw && !isOnlyJobPostPlan;
    const displayPlanName = isOnlyJobPostPlan
        ? 'Only Job Post'
        : isCustomRaw
            ? (planName.replace(/ - User \d+/i, '').trim() || 'Custom Plan')
            : (planName || 'No Plan Assigned');

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

    // Usage Progress helper with themed icons and clean styling
    const renderUsageCard = (label, used, limit, unit, IconComponent, colorTheme = 'blue') => {
        const parsedLimit = Number(limit) || 0;
        const parsedUsed = Number(used) || 0;
        const percentage = parsedLimit > 0 ? Math.min(Math.round((parsedUsed / parsedLimit) * 100), 100) : 0;

        const themes = {
            blue: {
                iconBg: 'bg-blue-50 text-blue-600',
                barColor: 'bg-blue-600',
                textColor: 'text-blue-600',
                glow: 'from-blue-50/40 to-transparent',
            },
            emerald: {
                iconBg: 'bg-emerald-50 text-emerald-600',
                barColor: 'bg-emerald-500',
                textColor: 'text-emerald-600',
                glow: 'from-emerald-50/40 to-transparent',
            },
            purple: {
                iconBg: 'bg-purple-50 text-purple-600',
                barColor: 'bg-purple-500',
                textColor: 'text-purple-600',
                glow: 'from-purple-50/40 to-transparent',
            },
            amber: {
                iconBg: 'bg-amber-50 text-amber-600',
                barColor: 'bg-amber-500',
                textColor: 'text-amber-600',
                glow: 'from-amber-50/40 to-transparent',
            },
            rose: {
                iconBg: 'bg-rose-50 text-rose-500',
                barColor: 'bg-rose-500',
                textColor: 'text-rose-500',
                glow: 'from-rose-50/40 to-transparent',
            },
            sky: {
                iconBg: 'bg-sky-50 text-sky-600',
                barColor: 'bg-sky-500',
                textColor: 'text-sky-600',
                glow: 'from-sky-50/40 to-transparent',
            },
            green: {
                iconBg: 'bg-emerald-50 text-emerald-600',
                barColor: 'bg-emerald-500',
                textColor: 'text-emerald-600',
                glow: 'from-emerald-50/40 to-transparent',
            },
            indigo: {
                iconBg: 'bg-indigo-50 text-indigo-600',
                barColor: 'bg-indigo-500',
                textColor: 'text-indigo-600',
                glow: 'from-indigo-50/40 to-transparent',
            }
        };

        const theme = themes[colorTheme] || themes.blue;

        return (
            <div className="bg-slate-50/80 rounded-2xl px-3.5 py-3 transition-all relative overflow-hidden flex flex-col justify-between space-y-3">
                {/* Soft corner background tint */}
                <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${theme.glow} pointer-events-none`} />

                <div className="flex items-center justify-between relative z-10 mt-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme.iconBg}`}>
                            {IconComponent && <IconComponent className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                            <span className="text-sm font-semibold text-gray-800 block truncate leading-tight">{label}</span>
                            <div className="text-sm font-semibold text-gray-900 mt-0.5">
                                {parsedUsed} <span className="text-xs font-normal text-gray-400">/ {parsedLimit} {unit}</span>
                            </div>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 ml-2" />
                </div>

                <div className="relative z-10">
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${theme.barColor}`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold mt-1.5">
                        <span className={theme.textColor}>{percentage}% utilized</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-16">
            {/* Top Bar with Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/admin/recruiters')}
                        className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                        title="Back to Recruiters List"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl font-bold text-gray-900 mb-0">{r.company_name || 'Recruiter Company'}</h1>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 mb-0">
                            Recruiter ID #{r.recruiter_id} • Member since {r.created_date ? new Date(r.created_date).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Auto Approve Toggle */}
                    <button
                        onClick={handleToggleAutoApprove}
                        disabled={autoApproveUpdating}
                        className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border-1 transition-all cursor-pointer select-none ${isAutoApprove
                            ? 'text-emerald-800 bg-emerald-50/90 border-emerald-300 hover:bg-emerald-100'
                            : 'text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                        title={isAutoApprove ? 'Auto Approve is currently ON (posted jobs go live automatically). Click to turn OFF.' : 'Auto Approve is currently OFF (posted jobs require manual admin review). Click to turn ON.'}
                    >
                        <span className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${isAutoApprove ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${isAutoApprove ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                        </span>
                        <span>Auto Approve: <strong className={isAutoApprove ? 'text-emerald-700' : 'text-slate-600'}>{isAutoApprove ? 'ON' : 'OFF'}</strong></span>
                    </button>

                    <button
                        onClick={handleLoginAsRecruiter}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm group/login cursor-pointer"
                        title="Login to Recruiter Portal as this recruiter"
                    >
                        <LogIn className="w-3.5 h-3.5 group-hover/login:translate-x-0.5 transition-transform" />
                        <span>Login as Recruiter</span>
                        <ExternalLink className="w-3 h-3 text-blue-200 ml-0.5" />
                    </button>
                    <button
                        onClick={() => setIsResetPasswordOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                    >
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                        <span>Reset Password</span>
                    </button>
                    <button
                        onClick={handleToggleStatus}
                        disabled={statusUpdating}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border-1 transition-colors cursor-pointer ${isUserActive
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* 1. Recruiter & Company Overview Card */}
                <div className="bg-white p-6 rounded-2xl flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-2xl overflow-hidden shrink-0 border border-gray-100 shadow-sm bg-gray-50 flex items-center justify-center">
                                {(() => {
                                    const logoSrc = r.company_logo || r.profile_image || r.user_avatar;
                                    return logoSrc ? (
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
                                    ) : null;
                                })()}
                                <div className={`w-full h-full ${r.company_logo || r.profile_image || r.user_avatar ? 'hidden' : 'flex'} items-center justify-center font-bold text-blue-600 text-lg bg-blue-50`}>
                                    {r.company_name?.charAt(0)?.toUpperCase() || 'C'}
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <h2 className="text-base font-bold text-gray-900 truncate mb-0">{r.company_name}</h2>
                                    <BadgeCheck className="w-4 h-4 text-emerald-500 fill-emerald-500 text-white shrink-0" />
                                </div>
                                <p className="text-xs text-gray-400 truncate mt-0.5 mb-1.5 font-normal">
                                    {r.industry_type || 'Technology'} • {r.organization_type || 'Corporate'}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-600 border-1 border-blue-100">
                                        Employer
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border-1 ${isUserActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                        {isUserActive ? 'Active' : 'Suspended'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Contact Person Details */}
                        <div className="space-y-3 text-xs pt-1">
                            <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px] block">Contact Person</span>
                            <div className="flex items-center gap-2.5 text-gray-700">
                                <User className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="font-semibold text-sm text-gray-900">{r.recruiter_name}</span>
                                {r.designation && (
                                    <span className="text-gray-400 text-xs">({r.designation})</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2.5 text-gray-700">
                                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="truncate text-gray-600">{r.email}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-gray-700">
                                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="text-gray-600 font-medium">{r.phone || r.company_phone || 'No Phone provided'}</span>
                            </div>
                            <div className="flex items-start gap-2.5 text-gray-600">
                                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                <span className="text-gray-500 leading-snug">
                                    {[r.address1, r.city, r.state, r.pincode].filter(Boolean).join(', ') || 'No address specified'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Job Auto-Approve Status footer inside left card */}
                    <button
                        type="button"
                        onClick={handleToggleAutoApprove}
                        disabled={autoApproveUpdating}
                        className={`w-full p-2.5 rounded-2xl border-1 transition-all flex items-center justify-between cursor-pointer select-none text-left ${isAutoApprove
                            ? 'bg-emerald-50/70 border-emerald-100 hover:bg-emerald-100/70'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                        title="Click to toggle Job Auto-Approval"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${isAutoApprove ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider block text-gray-400">
                                    Job Auto-Approval
                                </span>
                                <span className={`text-xs font-bold block ${isAutoApprove ? 'text-emerald-700' : 'text-slate-600'}`}>
                                    {isAutoApprove ? 'Auto-Approved' : 'Manual Review'}
                                </span>
                            </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isAutoApprove ? 'text-emerald-600' : 'text-slate-400'}`} />
                    </button>
                </div>

                {/* 2. Current Subscription Card */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl flex flex-col justify-between space-y-5">
                    <div className="space-y-4">
                        {/* Top Header of Subscription */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-purple-50 text-purple-600 border border-purple-100/80 flex items-center justify-center font-bold shrink-0">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-semibold text-gray-900 mb-0">{displayPlanName}</h2>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border-1 border-emerald-100">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : r.subscription_status || 'Active'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 mb-0 flex items-center gap-2">
                                        <span>Billing Cycle: <strong className="capitalize font-medium text-gray-800">{r.billing_cycle || 'monthly'}</strong></span>
                                        <span className="text-gray-300">|</span>
                                        <span>Price: <strong className="font-semibold text-gray-800">₹{Number(r.price_paid || r.plan_price || 0).toLocaleString()}</strong></span>
                                    </p>
                                </div>
                            </div>

                            {/* Right Expiry Banner */}
                            <div className="bg-emerald-50/70 border-1 border-emerald-100/80 rounded-2xl px-3 py-2.5 text-center min-w-[135px]">
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-2xl font-extrabold text-emerald-600 leading-none">
                                        {daysRemaining !== null ? (daysRemaining <= 0 ? 0 : daysRemaining) : '—'}
                                    </span>
                                    <span className="text-xs font-bold text-gray-800">Days Left</span>
                                </div>
                                <div className="text-[11px] text-gray-400 font-medium mt-1">
                                    Expires on {r.subscription_expiry ? new Date(r.subscription_expiry).toLocaleDateString() : 'N/A'}
                                </div>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="space-y-3 pt-1">
                            {/* Row 1: 4 Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {/* 1. Start Date */}
                                <div className="bg-sky-50/70 rounded-2xl p-2.5 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-sky-100 text-blue-600 flex items-center justify-center shrink-0">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-gray-500 block leading-tight">Start Date</span>
                                        <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                                            {r.subscription_start ? new Date(r.subscription_start).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* 2. Expiry Date */}
                                <div className="bg-purple-50/70 rounded-2xl p-2.5 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-gray-500 block leading-tight">Expiry Date</span>
                                        <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                                            {r.subscription_expiry ? new Date(r.subscription_expiry).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* 3. Payment Status */}
                                <div className="bg-emerald-50/70 rounded-2xl p-2.5 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-gray-500 block leading-tight">Payment Status</span>
                                        <span className="text-sm font-bold text-emerald-800 block mt-0.5">
                                            {r.payment_status || 'Paid'}
                                        </span>
                                    </div>
                                </div>

                                {/* 4. Active Jobs Limit */}
                                <div className="bg-amber-50/70 rounded-2xl p-2.5 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                        <Layers className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-gray-500 block leading-tight">Active Jobs Limit</span>
                                        <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                                            {Number(r.active_job_limit || 0).toLocaleString()} Maximum
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Master Login & Sub-Recruiter Seats */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-emerald-50/70 border-1 border-emerald-100/80 rounded-2xl p-2.5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-gray-500 block leading-tight">Master Login Capacity</span>
                                            <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                                                {masterRecruitersList.length || 1} of {r.master_login_limit || 1} Accounts Used
                                            </span>
                                        </div>
                                    </div>
                                    {(masterRecruitersList.length || 1) < (r.master_login_limit || 1) && (
                                        <button
                                            type="button"
                                            onClick={() => setIsAddMasterOpen(true)}
                                            className="px-2.5 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-colors shrink-0"
                                        >
                                            + Add Master
                                        </button>
                                    )}
                                </div>

                                <div className="bg-indigo-50/70 border-1 border-indigo-100 rounded-2xl p-2.5 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-gray-500 block leading-tight">Company Sub-Seat Pool</span>
                                        <span className="text-sm font-semibold text-gray-900 block mt-0.5">
                                            {totalAllocatedSeats} of {totalCompanySeats} Seats Assigned ({availableUnallocatedSeats} Available)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
                        <button
                            onClick={() => {
                                const hasPlan = Boolean(r.plan_name && r.plan_name !== 'No Plan' && r.plan_name !== 'No Plan Assigned' && r.plan_id);
                                if (!hasPlan) {
                                    toast.error("This recruiter has no active plan. Please click 'Change Subscription Plan' to assign a plan first.");
                                    return;
                                }
                                setIsExtendOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-800 bg-white border-1 border-gray-200 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer"
                        >
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span>Extend Validity</span>
                        </button>
                        <button
                            onClick={() => setIsChangePlanOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>Change Subscription Plan</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Section 3: Usage Progress Cards (Real-time vs Plan Limits) */}
            <div className="bg-white p-6 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <BarChart2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-0">Current Quota & Real-time Usage</h3>
                            <p className="text-xs text-gray-400 mt-0.5 mb-0 font-normal">
                                Live custom limits enforced across the Recruiter portal
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isCustomRaw && (
                            <button
                                onClick={() => setIsCustomPlanOpen(true)}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border-1 border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit Custom Limits</span>
                            </button>
                        )}
                        <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-600 border-1 border-blue-200">
                            <Settings className="w-3.5 h-3.5" />
                            <span>{isOnlyJobPostPlan ? 'Only Job Post Plan' : isCustom ? 'Custom Plan Bounds' : 'Standard Job Plan'}</span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    {renderUsageCard('Monthly Job Posts', r.job_posts_used, r.job_post_limit, 'posts', FileText, 'blue')}
                    {renderUsageCard('Active Jobs on Portal', r.active_jobs_count, r.active_job_limit, 'active', Briefcase, 'emerald')}
                    {renderUsageCard('Resume Views', r.resume_views_used, r.resume_view_limit, 'views', Eye, 'purple')}
                    {renderUsageCard('Sub-Recruiter Seats', r.sub_recruiters_count, r.sub_recruiter_limit || 0, 'seats', Users, 'amber')}
                    {renderUsageCard('Resume Downloads', r.resume_downloads_used, r.resume_download_limit, 'resumes', Download, 'rose')}
                    {renderUsageCard('Email Outreach', r.emails_used, r.email_limit, 'emails', Mail, 'sky')}
                    {renderUsageCard('WhatsApp Outreach', r.whatsapp_used, r.whatsapp_limit, 'messages', MessageCircle, 'green')}
                    {renderUsageCard('Excel Export', r.excel_downloads_used, r.excel_download_limit, 'downloads', FileSpreadsheet, 'indigo')}
                </div>
            </div>

            {/* Section 4: Tabbed Team, History, Payments & Audit Logs */}
            <div className="space-y-4">
                {/* Modern Pill Tabs */}
                <div className="bg-slate-100/80 p-1.5 rounded-2xl flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setActiveTab('masters')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'masters'
                            ? 'bg-white text-blue-600 border-1 border-slate-200/80 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                            }`}
                    >
                        <UserCheck className="w-4 h-4" />
                        <span>Master Recruiters</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'masters'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-200/80 text-slate-600'
                            }`}>
                            {masterRecruitersList.length || 1} / {r.master_login_limit || 1}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('team')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'team'
                            ? 'bg-white text-blue-600 border-1 border-slate-200/80'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>Sub-Recruiters & Team</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'history'
                            ? 'bg-white text-blue-600 border-1 border-slate-200/80'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                            }`}
                    >
                        <History className="w-4 h-4" />
                        <span>Subscription History</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'history'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-200/80 text-slate-600'
                            }`}>
                            {historyList.length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('payments')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'payments'
                            ? 'bg-white text-blue-600 border-1 border-slate-200/80'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                            }`}
                    >
                        <Receipt className="w-4 h-4" />
                        <span>Payment History</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'payments'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-200/80 text-slate-600'
                            }`}>
                            {paymentsList.length}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('audit')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'audit'
                            ? 'bg-white text-blue-600 border-1 border-slate-200/80'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                            }`}
                    >
                        <ScrollText className="w-4 h-4" />
                        <span>Admin Audit Trail</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'audit'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-200/80 text-slate-600'
                            }`}>
                            {auditLogsList.length}
                        </span>
                    </button>
                </div>

                {/* Tab: Master Recruiters */}
                {activeTab === 'masters' && (
                    <div className="space-y-4">
                        {/* Master Accounts Capacity Card */}
                        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-base font-semibold text-slate-900 mb-0 flex items-center gap-2">
                                        <Building className="w-5 h-5 text-indigo-600" />
                                        Company Master Recruiters ({r.company_name})
                                    </h3>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Master Logins Meter */}
                                    <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-left">
                                        <span className="text-[10.5px] uppercase font-bold text-slate-400 block tracking-wider">Master Accounts</span>
                                        <span className="text-xs font-bold text-slate-800">
                                            {masterRecruitersList.length || 1} / {r.master_login_limit || 1} Used
                                        </span>
                                    </div>

                                    {/* Sub-Seats Pool Meter */}
                                    <div className="px-3.5 py-2 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-left">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10.5px] uppercase font-bold text-indigo-800 block tracking-wider">Company Sub-Seat Pool</span>
                                            <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-indigo-200/60 text-indigo-900">
                                                {availableUnallocatedSeats} Available
                                            </span>
                                        </div>
                                        <span className="text-xs font-bold text-indigo-950">
                                            {totalAllocatedSeats} / {totalCompanySeats} Seats Assigned
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if ((masterRecruitersList.length || 1) >= (r.master_login_limit || 1)) {
                                                toast.error(`Master Login limit of ${r.master_login_limit || 1} reached. Upgrade plan to add more.`);
                                                return;
                                            }
                                            setMasterFormData({
                                                first_name: '',
                                                last_name: '',
                                                email: '',
                                                phone: '',
                                                password: '',
                                                allocated_seats: Math.min(1, availableUnallocatedSeats)
                                            });
                                            setIsAddMasterOpen(true);
                                        }}
                                        disabled={(masterRecruitersList.length || 1) >= (r.master_login_limit || 1)}
                                        className={`px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${(masterRecruitersList.length || 1) >= (r.master_login_limit || 1)
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                            }`}
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        <span>Add Master Recruiter</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Master Accounts Table */}
                        <div className="bg-white rounded-2xl shadow-xs overflow-hidden border border-slate-200/80">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs min-w-[750px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 uppercase text-[11px] tracking-wider font-bold">
                                            <th className="py-3 px-4">Master Recruiter</th>
                                            <th className="py-3 px-4">Contact Details</th>
                                            <th className="py-3 px-4">Created Date</th>
                                            <th className="py-3 px-4">Sub-Recruiter Quota</th>
                                            <th className="py-3 px-4">Account Status</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(masterRecruitersList.length > 0 ? masterRecruitersList : [r]).map((m, idx) => {
                                            const mName = m.recruiter_name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Master Recruiter';
                                            const isPrimary = idx === 0;
                                            const subQuota = Number(m.allocated_seats || 0);
                                            const subCount = Number(m.sub_recruiters_count || (isPrimary ? r.sub_recruiters_count : 0) || 0);

                                            return (
                                                <tr key={m.id || idx} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                                                                {mName[0]?.toUpperCase() || 'M'}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-semibold text-slate-900 text-[13px]">{mName}</span>
                                                                    {isPrimary && (
                                                                        <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border-1 border-emerald-200">
                                                                            PRIMARY
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[11px] text-slate-400">ID #{m.id}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 space-y-0.5">
                                                        <div className="text-slate-800 font-medium">{m.email}</div>
                                                        <div className="text-slate-400 text-[11px]">{m.phone || 'No phone'}</div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-slate-600">
                                                        {m.created_date ? new Date(m.created_date).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                                                <span>{subCount}</span>
                                                                <span className="text-slate-400 font-normal">/ {subQuota} Seats</span>
                                                            </div>
                                                            <div className="w-24 bg-slate-100 h-1 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-indigo-600 rounded-full"
                                                                    style={{ width: `${Math.min(Math.round((subCount / Math.max(1, subQuota)) * 100), 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border-1 border-emerald-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            Active
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <div className="inline-flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditSeatsModal({
                                                                    isOpen: true,
                                                                    master: m,
                                                                    seats: subQuota,
                                                                    submitting: false
                                                                })}
                                                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
                                                                title="Adjust Sub-Recruiter Seats for this Master"
                                                            >
                                                                <Sliders className="w-3.5 h-3.5" />
                                                                <span>Edit Seats</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleLoginAsMaster(m.id, mName)}
                                                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
                                                                title="Login as this Master Recruiter"
                                                            >
                                                                <LogIn className="w-3.5 h-3.5" />
                                                                <span>Login As</span>
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
                    </div>
                )}

                {/* Tab 0: Team & Sub-Recruiters */}
                {activeTab === 'team' && (
                    <ManageRecruiterTeam recruiterId={recruiterId} isAdminView={true} />
                )}

                {/* Tab 1: Subscription History */}
                {activeTab === 'history' && (
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-0">Subscription Changes & Plan Timeline</h3>
                                <p className="text-xs text-slate-400 mt-0.5 mb-0">
                                    Audited record of all tier changes, manual grants, and upgrades.
                                </p>
                            </div>
                            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200/60">
                                {historyList.length} {historyList.length === 1 ? 'Record' : 'Records'}
                            </span>
                        </div>
                        {historyList.length === 0 ? (
                            <div className="py-14 text-center px-4 flex flex-col items-center justify-center">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
                                    <History className="w-7 h-7" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800 mb-1">No Subscription Changes Recorded</h4>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    Plan upgrades, downgrades, and custom validity updates will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs min-w-[750px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 uppercase text-[12px] tracking-wider font-bold">
                                            <th className="py-3 px-4">Change Type</th>
                                            <th className="py-3 px-4">Previous Plan</th>
                                            <th className="py-3 px-4">New Plan</th>
                                            <th className="py-3 px-4">Effective Date</th>
                                            <th className="py-3 px-4">Expiry Date</th>
                                            <th className="py-3 px-4">Reason</th>
                                            <th className="py-3 px-4">Admin</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {historyList.map(h => (
                                            <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-3 px-4 font-semibold text-slate-800 capitalize">
                                                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${h.change_type === 'upgrade'
                                                        ? 'bg-emerald-50 text-emerald-700 border-1 border-emerald-200'
                                                        : h.change_type === 'downgrade'
                                                            ? 'bg-amber-50 text-amber-700 border-1 border-amber-200'
                                                            : 'bg-blue-50 text-blue-700 border-1 border-blue-200'
                                                        }`}>
                                                        {h.change_type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 font-medium">{h.previous_plan_name || 'None'}</td>
                                                <td className="py-3 px-4 font-bold text-blue-600">{h.new_plan_name || 'Active'}</td>
                                                <td className="py-3 px-4 text-slate-600">
                                                    {h.effective_date ? new Date(h.effective_date).toLocaleDateString() : 'Immediate'}
                                                </td>
                                                <td className="py-3 px-4 text-slate-600">
                                                    {h.expiry_date ? new Date(h.expiry_date).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{h.reason || '—'}</td>
                                                <td className="py-3 px-4 text-slate-700 font-medium">
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
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 mb-0">Payment Invoices & Transactions</h3>
                                <p className="text-xs text-slate-400 mt-0.5 mb-0">
                                    Billing history and completed payments recorded for this account.
                                </p>
                            </div>
                            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200/60">
                                {paymentsList.length} {paymentsList.length === 1 ? 'Invoice' : 'Invoices'}
                            </span>
                        </div>
                        {paymentsList.length === 0 ? (
                            <div className="py-14 text-center px-4 flex flex-col items-center justify-center">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
                                    <Receipt className="w-7 h-7" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800 mb-1">No Invoices Found</h4>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    Online transactions and manual invoice receipts will appear in this ledger.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs min-w-[750px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                                            <th className="py-3 px-4">Payment ID</th>
                                            <th className="py-3 px-4">Amount</th>
                                            <th className="py-3 px-4">Method</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Date</th>
                                            <th className="py-3 px-4">Transaction ID / Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paymentsList.map(p => (
                                            <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-3 px-4 font-mono font-bold text-slate-700">#PAY-{p.id}</td>
                                                <td className="py-3 px-4 font-black text-slate-900">₹{Number(p.amount).toLocaleString()}</td>
                                                <td className="py-3 px-4 text-slate-600 capitalize font-medium">{p.payment_method || 'Online'}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${p.payment_status === 'Paid'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        }`}>
                                                        {p.payment_status || 'Paid'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-500">
                                                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 font-mono text-[11px] truncate max-w-xs">
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
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 mb-0">Administrative Audit Trail</h3>
                                <p className="text-xs text-slate-400 mt-0.5 mb-0">
                                    Traceable events, manual quota edits, and plan overrides by administrators.
                                </p>
                            </div>
                            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200/60">
                                {auditLogsList.length} {auditLogsList.length === 1 ? 'Event' : 'Events'}
                            </span>
                        </div>
                        {auditLogsList.length === 0 ? (
                            <div className="py-14 text-center px-4 flex flex-col items-center justify-center">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
                                    <ScrollText className="w-7 h-7" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-800 mb-1">No Audit Events Logged</h4>
                                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    Admin modifications will be recorded with timestamps and initiator names.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs min-w-[750px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                                            <th className="py-3 px-4">Timestamp</th>
                                            <th className="py-3 px-4">Action</th>
                                            <th className="py-3 px-4">Admin</th>
                                            <th className="py-3 px-4">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {auditLogsList.map(a => (
                                            <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-medium">
                                                    {a.created_at ? new Date(a.created_at).toLocaleString() : 'N/A'}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-slate-800">
                                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-200/60">
                                                        {a.action}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-bold text-slate-900">
                                                    {a.admin_first_name ? `${a.admin_first_name} ${a.admin_last_name || ''}` : 'Super Admin'}
                                                </td>
                                                <td className="py-3 px-4 text-slate-600 max-w-md text-[11px]">
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
                        ...r,
                        id: r.recruiter_id,
                        recruiter_id: r.recruiter_id,
                        name: r.recruiter_name,
                        company_name: r.company_name,
                        current_plan_id: r.plan_id,
                        plan_id: r.plan_id,
                        plan_name: r.plan_name,
                        plan_type: r.plan_type,
                        master_login_limit: r.master_login_limit || r.max_master_recruiters || 1,
                        subscription_expiry: r.subscription_expiry,
                        billing_cycle: r.billing_cycle,
                        job_post_limit: r.job_post_limit,
                        active_job_limit: r.active_job_limit,
                        featured_job_limit: r.featured_job_limit,
                        urgent_job_limit: r.urgent_job_limit,
                        sub_recruiter_limit: r.sub_recruiter_limit,
                        resume_view_limit: r.resume_view_limit,
                        resume_download_limit: r.resume_download_limit,
                        email_limit: r.email_limit,
                        whatsapp_limit: r.whatsapp_limit,
                        excel_download_limit: r.excel_download_limit
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

            {isCustomPlanOpen && (
                <CustomPlanModal
                    isOpen={isCustomPlanOpen}
                    recruiter={{
                        ...r,
                        id: r.recruiter_id,
                        recruiter_id: r.recruiter_id,
                        name: r.recruiter_name,
                        company_name: r.company_name,
                        plan_name: r.plan_name,
                        plan_type: r.plan_type,
                        master_login_limit: r.master_login_limit || r.max_master_recruiters || 1,
                        job_post_limit: r.job_post_limit,
                        active_job_limit: r.active_job_limit,
                        featured_job_limit: r.featured_job_limit,
                        urgent_job_limit: r.urgent_job_limit,
                        resume_view_limit: r.resume_view_limit,
                        resume_download_limit: r.resume_download_limit,
                        sub_recruiter_limit: r.sub_recruiter_limit,
                        email_limit: r.email_limit,
                        whatsapp_limit: r.whatsapp_limit,
                        excel_download_limit: r.excel_download_limit
                    }}
                    onClose={() => setIsCustomPlanOpen(false)}
                    onSuccess={() => {
                        setIsCustomPlanOpen(false);
                        fetchDetails();
                    }}
                />
            )}

            {isStatusModalOpen && (
                <RecruiterStatusModal
                    isOpen={isStatusModalOpen}
                    recruiter={r}
                    onClose={() => setIsStatusModalOpen(false)}
                    onSuccess={() => {
                        setIsStatusModalOpen(false);
                        fetchDetails();
                    }}
                />
            )}

            {/* Add Master Recruiter Modal */}
            {isAddMasterOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs mt-0">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900 mb-0">Add Master Recruiter</h3>
                                    <p className="text-xs text-slate-500 mb-0">Create an additional master login for {r?.company_name}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddMasterOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddMasterRecruiter} className="p-6 space-y-4">
                            <div className="p-3.5 bg-indigo-50/70 border-1 border-indigo-200/60 rounded-xl flex items-start gap-3 text-xs text-indigo-900">
                                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold">Individual Seat Assignment:</span>
                                    <p className="text-indigo-700 mt-0.5 mb-0">
                                        Super Admin allocates independent sub-recruiter seats to this Master Login from the company total pool ({totalCompanySeats} seats total, {availableUnallocatedSeats} seats unallocated).
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                                        First Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={masterFormData.first_name}
                                        onChange={(e) => setMasterFormData({ ...masterFormData, first_name: e.target.value })}
                                        placeholder="e.g. Rahul"
                                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={masterFormData.last_name}
                                        onChange={(e) => setMasterFormData({ ...masterFormData, last_name: e.target.value })}
                                        placeholder="e.g. Sharma"
                                        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Official Email <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={masterFormData.email}
                                    onChange={(e) => setMasterFormData({ ...masterFormData, email: e.target.value })}
                                    placeholder="rahul@company.com"
                                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-1">
                                    <span>Sub-Recruiter Seats to Allocate</span>
                                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                        Max: {availableUnallocatedSeats} Available
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max={availableUnallocatedSeats}
                                    value={masterFormData.allocated_seats}
                                    onChange={(e) => setMasterFormData({ ...masterFormData, allocated_seats: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    {availableUnallocatedSeats} unallocated seats remain in the company total pool of {totalCompanySeats}.
                                </span>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Contact Phone</label>
                                <input
                                    type="tel"
                                    value={masterFormData.phone}
                                    onChange={(e) => setMasterFormData({ ...masterFormData, phone: e.target.value })}
                                    placeholder="+91 9876543210"
                                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-sm font-medium text-slate-700">
                                        Password <span className="text-rose-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleGenerateMasterPassword}
                                        className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        Generate Strong Password
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showMasterPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={masterFormData.password}
                                        onChange={(e) => setMasterFormData({ ...masterFormData, password: e.target.value })}
                                        placeholder="Minimum 6 characters"
                                        className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowMasterPassword(!showMasterPassword)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showMasterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsAddMasterOpen(false)}
                                    disabled={masterSubmitting}
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={masterSubmitting}
                                    className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                    {masterSubmitting ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Adding Account...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            <span>Create Master Recruiter</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Master Recruiter Seats Modal */}
            {editSeatsModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs mt-0">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                    <Sliders className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900 mb-0">Adjust Master Seats</h3>
                                    <p className="text-xs text-slate-500 mb-0">{editSeatsModal.master?.recruiter_name || editSeatsModal.master?.email}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditSeatsModal({ isOpen: false, master: null, seats: 0, submitting: false })}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveMasterSeats} className="p-6 space-y-4">
                            <div className="p-3.5 bg-indigo-50/70 border-1 border-indigo-200/60 rounded-xl space-y-1.5 text-xs text-indigo-900">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600 font-medium">Company Total Pool:</span>
                                    <span className="font-bold text-slate-900">{totalCompanySeats} Seats</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600 font-medium">Currently Active Sub-Recruiters:</span>
                                    <span className="font-bold text-indigo-800">{editSeatsModal.master?.sub_recruiters_count || 0} Members</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600 font-medium">Max Allowed for this Master:</span>
                                    <span className="font-bold text-emerald-700">
                                        {Number(editSeatsModal.master?.allocated_seats || 0) + availableUnallocatedSeats} Seats
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                    Allocated Sub-Recruiter Seats
                                </label>
                                <input
                                    type="number"
                                    min={Number(editSeatsModal.master?.sub_recruiters_count || 0)}
                                    max={Number(editSeatsModal.master?.allocated_seats || 0) + availableUnallocatedSeats}
                                    value={editSeatsModal.seats}
                                    onChange={(e) => setEditSeatsModal({ ...editSeatsModal, seats: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                                    required
                                />
                                <span className="text-[11px] text-slate-400 mt-1 block">
                                    Cannot be less than {editSeatsModal.master?.sub_recruiters_count || 0} active members, or exceed company pool.
                                </span>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditSeatsModal({ isOpen: false, master: null, seats: 0, submitting: false })}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editSeatsModal.submitting}
                                    className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-60 shadow-xs"
                                >
                                    {editSeatsModal.submitting ? "Saving..." : "Save Allocation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
