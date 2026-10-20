'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import {
    Building2, Building, Briefcase, Layers, Users, TrendingUp, TrendingDown,
    Download, CheckCircle2, Clock, Mail, XCircle, Search, RefreshCw, Eye,
    FileSpreadsheet, Sparkles, ShieldCheck, Activity, Award, ExternalLink,
    ChevronLeft, ChevronRight, Phone, Globe, CreditCard, ChevronDown, Check,
    AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    getAdminRecruiters,
    getAdminPlans,
    getSuperAdminDashboardStats
} from '../ApiService/action';
import AdminDateFilter from './AdminDateFilter';
import AdminSelect from './AdminSelect';
import useAdminPermissions from './useAdminPermissions';
import { getImageUrl } from '../utils/getImageUrl';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

const StatCard = ({ title, value, icon: Icon, color, bg, accent, trend = null, subtext = null }) => (
    <div className="bg-white rounded-2xl p-4 relative overflow-hidden group shadow-xs hover:shadow-sm transition-all duration-300">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${bg} opacity-40 -translate-y-8 translate-x-8 group-hover:scale-110 transition-transform duration-500`}></div>
        <div className="flex items-center justify-between mb-3 relative z-10">
            <div className={`p-2.5 rounded-xl ${bg} ${color} ring-1 ring-inset ${accent} shadow-2xs`}>
                <Icon className="w-5 h-5" strokeWidth={2} />
            </div>
            {trend && (
                <div className={`flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border-1 ${trend.isPositive ? 'text-emerald-700 bg-emerald-50 border-emerald-200/80' : 'text-rose-700 bg-rose-50 border-rose-200/80'}`}>
                    {trend.isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    <span>{trend.text}</span>
                </div>
            )}
        </div>
        <div className="relative z-10">
            <h4 className="text-gray-500 text-[12.5px] font-medium mb-1 tracking-normal">{title}</h4>
            <div className="flex items-baseline gap-2">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-0">{value}</h2>
                {subtext && <span className="text-[11.5px] text-gray-400 font-medium">{subtext}</span>}
            </div>
        </div>
    </div>
);

// Consistent avatar gradient generator for company logos/initials
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
    for (let i = 0; i < (name || '').length; i++) {
        hash = (name || '').charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
};

// Format relative and readable date
const formatRelativeDate = (dateStr) => {
    if (!dateStr) return { relative: 'Never', exact: '-' };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { relative: 'Never', exact: '-' };

    const exact = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return { relative: 'Just now', exact };
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return { relative: `${diffMin}m ago`, exact };
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return { relative: `${diffHours}h ago`, exact };
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return { relative: 'Yesterday', exact };
    if (diffDays < 7) return { relative: `${diffDays}d ago`, exact };
    if (diffDays < 30) return { relative: `${Math.floor(diffDays / 7)}w ago`, exact };
    return { relative: exact, exact };
};

export default function RecruitersReport() {
    const router = useRouter();
    const { can, isSuperAdmin } = useAdminPermissions();
    const canExport = isSuperAdmin || can('report_recruiters', 'export_recruiters_report') || can('analytics', 'export_analytics_data');
    const canViewGrowth = isSuperAdmin || can('report_recruiters', 'view_recruiter_growth_report') || can('analytics', 'user_growth_analysis');
    const canViewJobTrends = isSuperAdmin || can('report_recruiters', 'view_recruiter_job_trends') || can('analytics', 'job_moderation_trends');
    const canViewSubscription = isSuperAdmin || can('report_recruiters', 'view_recruiter_subscription_report') || can('analytics', 'recruiter_conversions');

    const [loading, setLoading] = useState(true);
    const [loadingRecruiters, setLoadingRecruiters] = useState(true);
    const [dateFilter, setDateFilter] = useState({ preset: 'All Time', startDate: '', endDate: '', label: 'All Time' });

    // Raw datasets
    const [recruiters, setRecruiters] = useState([]);
    const [plans, setPlans] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);

    // Table search & filters
    const [searchQuery, setSearchQuery] = useState('');
    const [planFilter, setPlanFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Fetch macro dashboard stats (for monthly recruiter onboarding history & live stats)
    const fetchStats = useCallback(async () => {
        try {
            const timeFilterParam = dateFilter.preset !== 'Custom Range' && dateFilter.preset !== 'All Time' ? dateFilter.preset : undefined;
            const extraParams = {
                start_date: dateFilter.preset === 'Custom Range' ? (dateFilter.startDate || undefined) : undefined,
                end_date: dateFilter.preset === 'Custom Range' ? (dateFilter.endDate || undefined) : undefined
            };
            const response = await getSuperAdminDashboardStats(timeFilterParam, extraParams);
            const resData = response.data?.data || response.data || {};
            setDashboardStats(resData);
        } catch (error) {
            console.error('Error fetching recruiter stats:', error);
        }
    }, [dateFilter]);

    // Fetch live recruiters dataset
    const fetchRecruitersData = useCallback(async () => {
        try {
            setLoadingRecruiters(true);
            const params = {
                startDate: dateFilter.preset === 'Custom Range' ? (dateFilter.startDate || undefined) : undefined,
                endDate: dateFilter.preset === 'Custom Range' ? (dateFilter.endDate || undefined) : undefined
            };
            const [recruitersRes, plansRes] = await Promise.all([
                getAdminRecruiters(params),
                getAdminPlans().catch(() => ({ data: { data: [] } }))
            ]);

            const recList = recruitersRes.data?.data || recruitersRes.data || [];
            setRecruiters(Array.isArray(recList) ? recList : []);

            const planList = plansRes.data?.data || plansRes.data || [];
            setPlans(Array.isArray(planList) ? planList : []);
        } catch (error) {
            console.error('Error fetching recruiter data:', error);
            toast.error('Failed to load recruiter report data');
        } finally {
            setLoadingRecruiters(false);
            setLoading(false);
        }
    }, [dateFilter]);

    useEffect(() => {
        setLoading(true);
        fetchStats();
        fetchRecruitersData();
    }, [fetchStats, fetchRecruitersData]);

    // Recruiter KPI Aggregations
    const totalRecruitersCount = recruiters.length || dashboardStats?.counts?.recruiters || 0;
    const todayRecruitersCount = dashboardStats?.todayCounts?.recruiters || 0;

    const activeSubscriptionsCount = useMemo(() => {
        return recruiters.filter(r => (r.subscription_status || '').toLowerCase() === 'active').length;
    }, [recruiters]);

    const subscriptionActiveRate = totalRecruitersCount > 0
        ? Math.round((activeSubscriptionsCount / totalRecruitersCount) * 100)
        : 0;

    const paidPlansCount = useMemo(() => {
        return recruiters.filter(r => Number(r.price_paid || 0) > 0 || (r.payment_status || '').toLowerCase() === 'paid').length;
    }, [recruiters]);

    const totalJobsPostedCount = useMemo(() => {
        const fromRecruiters = recruiters.reduce((sum, r) => sum + (Number(r.job_posts_used) || 0), 0);
        return Math.max(fromRecruiters, Number(dashboardStats?.counts?.jobs || 0));
    }, [recruiters, dashboardStats]);

    const activeJobsCount = useMemo(() => {
        const fromRecruiters = recruiters.reduce((sum, r) => sum + (Number(r.active_jobs_count) || 0), 0);
        return Math.max(fromRecruiters, Number(dashboardStats?.summary?.activeJobs || 0));
    }, [recruiters, dashboardStats]);

    const totalResumeViews = useMemo(() => {
        return recruiters.reduce((sum, r) => sum + (Number(r.resume_views_used) || 0), 0);
    }, [recruiters]);

    const totalResumeDownloads = useMemo(() => {
        const fromRecruiters = recruiters.reduce((sum, r) => sum + (Number(r.resume_downloads_used) || 0), 0);
        return Math.max(fromRecruiters, Number(dashboardStats?.counts?.resumeDownloads || 0));
    }, [recruiters, dashboardStats]);

    const totalExcelDownloads = useMemo(() => {
        const fromRecruiters = recruiters.reduce((sum, r) => sum + (Number(r.excel_downloads_used) || 0), 0);
        return Math.max(fromRecruiters, Number(dashboardStats?.counts?.excelDownloads || 0));
    }, [recruiters, dashboardStats]);

    const totalSourcingActivity = totalResumeViews + totalResumeDownloads + totalExcelDownloads;

    // Recruiter Onboarding Velocity Trajectory (Line / Area Chart)
    const onboardingVelocityData = useMemo(() => {
        // If dashboardStats has monthlyData.recruiters, format it
        const monthly = dashboardStats?.monthlyData?.recruiters || [];
        if (monthly.length > 0) {
            return monthly.map(m => {
                const dateObj = new Date(m.month + '-01');
                const label = isNaN(dateObj.getTime())
                    ? m.month
                    : dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                return { name: label, uv: Number(m.count) || 0 };
            });
        }

        // Fallback: Group recruiters by creation date month
        const groupMap = {};
        recruiters.forEach(r => {
            if (!r.recruiter_created_date) return;
            const d = new Date(r.recruiter_created_date);
            if (isNaN(d.getTime())) return;
            const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            groupMap[key] = (groupMap[key] || 0) + 1;
        });

        const list = Object.keys(groupMap).map(k => ({ name: k, uv: groupMap[k] }));
        return list.length > 0 ? list : [{ name: 'Current', uv: recruiters.length }];
    }, [dashboardStats, recruiters]);

    // Subscription Plan Distribution (Pie / Donut Chart)
    const subscriptionPlanDistribution = useMemo(() => {
        const counts = {};
        recruiters.forEach(r => {
            const plan = r.plan_name || (r.plan_type ? `${r.plan_type.toUpperCase()} Plan` : 'No Plan / Free');
            counts[plan] = (counts[plan] || 0) + 1;
        });

        return Object.keys(counts).map(planName => ({
            name: planName,
            value: counts[planName]
        }));
    }, [recruiters]);

    // Industry Distribution of Employers
    const industryDistribution = useMemo(() => {
        const indMap = {};
        recruiters.forEach(r => {
            const ind = r.industry_type || 'Unspecified Industry';
            indMap[ind] = (indMap[ind] || 0) + 1;
        });

        return Object.keys(indMap)
            .map(k => ({ name: k, count: indMap[k] }))
            .sort((a, b) => b.count - a.count);
    }, [recruiters]);

    // Recruiter Quota Utilization Aggregates
    const quotaUtilization = useMemo(() => {
        let totalJobPostLimit = 0;
        let totalJobPostUsed = 0;
        let totalResumeViewLimit = 0;
        let totalResumeViewUsed = 0;
        let totalResumeDownloadLimit = 0;
        let totalResumeDownloadUsed = 0;
        let totalSubRecruiterLimit = 0;
        let totalSubRecruitersCount = 0;

        recruiters.forEach(r => {
            totalJobPostLimit += Number(r.job_post_limit || 0);
            totalJobPostUsed += Number(r.job_posts_used || 0);
            totalResumeViewLimit += Number(r.resume_view_limit || 0);
            totalResumeViewUsed += Number(r.resume_views_used || 0);
            totalResumeDownloadLimit += Number(r.resume_download_limit || 0);
            totalResumeDownloadUsed += Number(r.resume_downloads_used || 0);
            totalSubRecruiterLimit += Number(r.sub_recruiter_limit || 1);
            totalSubRecruitersCount += Number(r.sub_recruiters_count || 0);
        });

        const jobPostPct = totalJobPostLimit > 0 ? Math.min(100, Math.round((totalJobPostUsed / totalJobPostLimit) * 100)) : 0;
        const viewPct = totalResumeViewLimit > 0 ? Math.min(100, Math.round((totalResumeViewUsed / totalResumeViewLimit) * 100)) : 0;
        const downloadPct = totalResumeDownloadLimit > 0 ? Math.min(100, Math.round((totalResumeDownloadUsed / totalResumeDownloadLimit) * 100)) : 0;
        const teamPct = totalSubRecruiterLimit > 0 ? Math.min(100, Math.round((totalSubRecruitersCount / totalSubRecruiterLimit) * 100)) : 0;

        return {
            jobPosts: { used: totalJobPostUsed, limit: totalJobPostLimit, pct: jobPostPct },
            resumeViews: { used: totalResumeViewUsed, limit: totalResumeViewLimit, pct: viewPct },
            resumeDownloads: { used: totalResumeDownloadUsed, limit: totalResumeDownloadLimit, pct: downloadPct },
            teamSeats: { used: totalSubRecruitersCount, limit: totalSubRecruiterLimit, pct: teamPct }
        };
    }, [recruiters]);

    // Recruiter Account Health & Team Seats
    const activeAccountRate = useMemo(() => {
        if (recruiters.length === 0) return 100;
        const activeUsers = recruiters.filter(r => Number(r.user_active) === 1).length;
        return Math.round((activeUsers / recruiters.length) * 100);
    }, [recruiters]);

    const avgJobsPerRecruiter = totalRecruitersCount > 0
        ? (totalJobsPostedCount / totalRecruitersCount).toFixed(1)
        : '0.0';

    const totalSubRecruiterSeats = useMemo(() => {
        return recruiters.reduce((sum, r) => sum + (Number(r.sub_recruiters_count) || 0), 0);
    }, [recruiters]);

    // Table Filtering
    const filteredRecruiters = useMemo(() => {
        return recruiters.filter(r => {
            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const companyMatch = (r.company_name || '').toLowerCase().includes(q);
                const nameMatch = (r.recruiter_name || '').toLowerCase().includes(q);
                const emailMatch = (r.email || '').toLowerCase().includes(q);
                const industryMatch = (r.industry_type || '').toLowerCase().includes(q);
                if (!companyMatch && !nameMatch && !emailMatch && !industryMatch) return false;
            }

            // Plan filter
            if (planFilter !== 'All') {
                if (planFilter === 'Custom' && (r.plan_type || '').toLowerCase() !== 'custom') return false;
                if (planFilter !== 'Custom' && String(r.plan_id) !== String(planFilter) && r.plan_name !== planFilter) return false;
            }

            // Status filter
            if (statusFilter !== 'All') {
                if (statusFilter === 'Active' && Number(r.user_active) !== 1) return false;
                if (statusFilter === 'Suspended' && Number(r.user_active) === 1) return false;
                if (statusFilter === 'Subscribed' && (r.subscription_status || '').toLowerCase() !== 'active') return false;
                if (statusFilter === 'Expired' && (r.subscription_status || '').toLowerCase() !== 'expired') return false;
            }

            return true;
        });
    }, [recruiters, searchQuery, planFilter, statusFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredRecruiters.length / pageSize) || 1;
    const paginatedRecruiters = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredRecruiters.slice(start, start + pageSize);
    }, [filteredRecruiters, currentPage, pageSize]);

    // Plan Filter Options
    const planOptions = useMemo(() => {
        const base = [{ value: 'All', label: 'All Plans' }, { value: 'Custom', label: 'Custom Plans' }];
        const dynamic = plans.map(p => ({
            value: String(p.id),
            label: p.name || `Plan #${p.id}`
        }));
        return [...base, ...dynamic];
    }, [plans]);

    // Status Filter Options
    const statusOptions = [
        { value: 'All', label: 'All Statuses' },
        { value: 'Active', label: 'Active Accounts' },
        { value: 'Suspended', label: 'Suspended Accounts' },
        { value: 'Subscribed', label: 'Active Subscriptions' },
        { value: 'Expired', label: 'Expired Subscriptions' },
    ];

    // Executive Recruiter Report Export (CSV)
    const handleExportExecutiveReport = () => {
        const csvRows = [];
        csvRows.push(['RECRUITER & EMPLOYER INTELLIGENCE REPORT']);
        csvRows.push(['Generated At', new Date().toLocaleString()]);
        csvRows.push(['Filter Period', dateFilter.label || dateFilter.preset || 'All Time']);
        csvRows.push([]);

        csvRows.push(['EXECUTIVE HIRING & RECRUITER METRICS', 'VALUE']);
        csvRows.push(['Total Registered Employers & Recruiters', totalRecruitersCount]);
        csvRows.push(['Active Subscriptions Count', activeSubscriptionsCount]);
        csvRows.push(['Subscription Active Coverage Rate', `${subscriptionActiveRate}%`]);
        csvRows.push(['Total Jobs Created by Recruiters', totalJobsPostedCount]);
        csvRows.push(['Active Live Job Vacancies', activeJobsCount]);
        csvRows.push(['Candidate Resume Views by Recruiters', totalResumeViews]);
        csvRows.push(['Candidate Resumes Downloaded', totalResumeDownloads]);
        csvRows.push(['Excel Candidates Sourced', totalExcelDownloads]);
        csvRows.push(['Total Candidate Sourcing Actions', totalSourcingActivity]);
        csvRows.push(['Sub-Recruiter Team Seats Deployed', totalSubRecruiterSeats]);
        csvRows.push(['Recruiter Account Health Rate', `${activeAccountRate}%`]);
        csvRows.push(['Average Jobs Posted per Recruiter', avgJobsPerRecruiter]);
        csvRows.push([]);

        // Subscription Tier Breakdown
        csvRows.push(['SUBSCRIPTION TIER BREAKDOWN', 'COMPANIES', 'SHARE %']);
        subscriptionPlanDistribution.forEach(item => {
            const pct = totalRecruitersCount > 0 ? `${Math.round((item.value / totalRecruitersCount) * 100)}%` : '0%';
            csvRows.push([item.name, item.value, pct]);
        });
        csvRows.push([]);

        // Industry Breakdown
        csvRows.push(['INDUSTRY DISTRIBUTION OF HIRING COMPANIES', 'COMPANIES', 'SHARE %']);
        industryDistribution.forEach(item => {
            const pct = totalRecruitersCount > 0 ? `${Math.round((item.count / totalRecruitersCount) * 100)}%` : '0%';
            csvRows.push([item.name, item.count, pct]);
        });
        csvRows.push([]);

        // Monthly Onboarding Velocity
        if (onboardingVelocityData.length > 0) {
            csvRows.push(['RECRUITER ONBOARDING VELOCITY', 'NEW EMPLOYERS']);
            onboardingVelocityData.forEach(item => {
                csvRows.push([item.name, item.uv]);
            });
            csvRows.push([]);
        }

        const csvContent = csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const filterSlug = (dateFilter.label || dateFilter.preset || 'all_time').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        link.setAttribute("download", `recruiter_analytics_report_${filterSlug}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Executive Recruiter Report downloaded');
    };

    // Full Recruiter Performance Directory Export (CSV)
    const handleExportRecruitersList = () => {
        try {
            const csvRows = [];
            csvRows.push([
                'Recruiter ID', 'Company Name', 'Recruiter Name', 'Email', 'Phone',
                'Industry', 'Organization Type', 'Plan Name', 'Billing Cycle',
                'Subscription Status', 'Payment Status', 'Price Paid',
                'Jobs Posted (Used)', 'Active Jobs Count', 'Resume Views Used',
                'Resume Downloads Used', 'Sub-Recruiters Count', 'Account Status',
                'Registered Date', 'Last Active'
            ]);

            filteredRecruiters.forEach(r => {
                const isActive = Number(r.user_active) === 1;
                const regDate = r.recruiter_created_date ? new Date(r.recruiter_created_date).toLocaleDateString() : '-';
                const lastActive = r.last_active ? new Date(r.last_active).toLocaleDateString() : '-';

                csvRows.push([
                    r.recruiter_id,
                    r.company_name || 'Individual Recruiter',
                    r.recruiter_name || 'Recruiter',
                    r.email || '-',
                    r.phone || '-',
                    r.industry_type || 'Unspecified',
                    r.organization_type || 'Corporate',
                    r.plan_name || 'Free Plan',
                    r.billing_cycle || 'Monthly',
                    r.subscription_status || 'No Plan',
                    r.payment_status || 'Unpaid',
                    r.price_paid || '0.00',
                    r.job_posts_used || 0,
                    r.active_jobs_count || 0,
                    r.resume_views_used || 0,
                    r.resume_downloads_used || 0,
                    r.sub_recruiters_count || 0,
                    isActive ? 'Active' : 'Suspended',
                    regDate,
                    lastActive
                ]);
            });

            const csvContent = csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `recruiters_directory_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Recruiters directory downloaded');
        } catch (error) {
            console.error('Failed to export recruiters list:', error);
            toast.error('Failed to export recruiters list');
        }
    };

    if (loading && recruiters.length === 0) {
        return (
            <div className="w-full animate-pulse pb-12">
                {/* Header Skeleton */}
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="h-8 bg-gray-200 rounded-lg w-56 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-80"></div>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-10 bg-gray-200 rounded-xl w-36"></div>
                        <div className="h-10 bg-gray-200 rounded-xl w-36"></div>
                    </div>
                </div>

                {/* 4 Stat Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-4 shadow-xs">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-200"></div>
                                <div className="w-16 h-5 rounded-full bg-gray-200"></div>
                            </div>
                            <div className="h-3.5 bg-gray-200 rounded w-28 mb-2"></div>
                            <div className="h-7 bg-gray-200 rounded w-20"></div>
                        </div>
                    ))}
                </div>

                {/* Charts Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl h-[360px]"></div>
                    <div className="bg-white p-6 rounded-2xl h-[360px]"></div>
                </div>

                {/* Bottom Row Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl h-[280px]"></div>
                    <div className="bg-white p-6 rounded-2xl h-[280px]"></div>
                    <div className="bg-white p-6 rounded-2xl h-[280px]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full animate-in fade-in duration-500 pb-12">
            {/* ── Page Header ── */}
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h1 className="text-2xl font-semibold text-gray-900 mb-0 tracking-tight">Recruiter Reports</h1>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-blue-50 text-blue-700 border-1 border-blue-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                Dynamic Employer Intelligence
                            </span>
                        </div>
                        <p className="text-gray-500 text-[13px] mt-0.5 mb-0">
                            Real-time employer registrations, active subscriptions, job posting quota utilization, resume sourcing activity, and recruiter roster.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <AdminDateFilter
                        value={dateFilter}
                        onChange={(newFilter) => setDateFilter(newFilter)}
                        presets={['All Time', 'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'This Quarter', 'This Year']}
                    />
                    {canExport && (
                        <button
                            onClick={handleExportExecutiveReport}
                            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 px-4 py-2.5 rounded-xl font-medium text-[13px] transition-colors shadow-xs cursor-pointer select-none"
                            title="Download comprehensive executive recruiter report CSV"
                        >
                            <Download className="w-4 h-4 text-gray-500" />
                            Download Report
                        </button>
                    )}
                </div>
            </div>

            {/* ── 4 Top Stats Cards (Exclusively Recruiter Data) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Employers / Companies"
                    value={totalRecruitersCount.toLocaleString()}
                    icon={Building2}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    accent="ring-blue-100"
                    trend={todayRecruitersCount ? { text: `+${todayRecruitersCount} today`, isPositive: true } : null}
                    subtext="registered hiring accounts"
                />
                <StatCard
                    title="Active Subscriptions"
                    value={activeSubscriptionsCount.toLocaleString()}
                    icon={Layers}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                    accent="ring-emerald-100"
                    trend={{ text: `${subscriptionActiveRate}% active`, isPositive: true }}
                    subtext={`${paidPlansCount} paid plans`}
                />
                <StatCard
                    title="Jobs Posted by Recruiters"
                    value={totalJobsPostedCount.toLocaleString()}
                    icon={Briefcase}
                    color="text-amber-600"
                    bg="bg-amber-50"
                    accent="ring-amber-100"
                    trend={{ text: `${activeJobsCount.toLocaleString()} live vacancies`, isPositive: true }}
                    subtext="across all employers"
                />
                <StatCard
                    title="Candidate Sourcing Activity"
                    value={totalSourcingActivity.toLocaleString()}
                    icon={Sparkles}
                    color="text-purple-600"
                    bg="bg-purple-50"
                    accent="ring-purple-100"
                    trend={totalResumeDownloads ? { text: `${totalResumeDownloads.toLocaleString()} downloads`, isPositive: true } : null}
                    subtext="profiles sourced by recruiters"
                />
            </div>

            {/* ── Velocity & Tier Distribution Charts Row ── */}
            {(canViewGrowth || canViewSubscription) && (
                <div className={`grid grid-cols-1 ${canViewGrowth && canViewSubscription ? 'lg:grid-cols-2' : ''} gap-6 mb-8`}>
                    {/* Employer Onboarding Velocity Trajectory */}
                    {canViewGrowth && (
                        <div className="bg-white p-6 rounded-2xl shadow-xs">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-[15px] font-semibold text-gray-900 mb-0.5 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-blue-500" />
                                        Recruiter & Company Onboarding Trajectory
                                    </h3>
                                    <p className="text-gray-400 text-[12px] mb-0">Employer sign-up velocity over selected period</p>
                                </div>
                                <span className="text-[11.5px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border-1 border-blue-100">
                                    {totalRecruitersCount.toLocaleString()} Total Employers
                                </span>
                            </div>

                            <div className="h-[280px] w-full">
                                {onboardingVelocityData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={onboardingVelocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="recruiterGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-5} />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '13px' }}
                                                formatter={(value) => [`${value} Recruiters`, 'New Onboardings']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="uv"
                                                name="New Employers"
                                                stroke="#3b82f6"
                                                strokeWidth={2.5}
                                                fillOpacity={1}
                                                fill="url(#recruiterGrowthGrad)"
                                                dot={{ r: 3, strokeWidth: 2, fill: '#fff', stroke: '#3b82f6' }}
                                                activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                                        <Activity className="w-8 h-8 text-gray-300 mb-2" />
                                        <span>No onboarding velocity data for this filter</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Subscription Tier Distribution (Donut Pie) */}
                    {canViewSubscription && (
                        <div className="bg-white p-6 rounded-2xl shadow-xs">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-[15px] font-semibold text-gray-900 mb-0.5 flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-emerald-500" />
                                        Subscription Tier Distribution
                                    </h3>
                                    <p className="text-gray-400 text-[12px] mb-0">Distribution of recruiters across active subscription tiers</p>
                                </div>
                                <span className="text-[11.5px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border-1 border-emerald-100">
                                    {subscriptionPlanDistribution.length} Tiers Active
                                </span>
                            </div>

                            <div className="h-[230px] w-full flex items-center justify-center">
                                {subscriptionPlanDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={subscriptionPlanDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={80}
                                                paddingAngle={4}
                                                dataKey="value"
                                                nameKey="name"
                                                stroke="none"
                                            >
                                                {subscriptionPlanDistribution.map((entry, index) => (
                                                    <Cell key={`tier-cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                                formatter={(value, name) => [`${value} Companies (${Math.round((value / totalRecruitersCount) * 100)}%)`, name]}
                                            />
                                            <Legend
                                                layout="horizontal"
                                                verticalAlign="bottom"
                                                align="center"
                                                iconType="circle"
                                                wrapperStyle={{ fontSize: '11.5px', paddingTop: '10px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-gray-400 text-sm">No subscription distribution data</div>
                                )}
                            </div>

                            <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between text-[11.5px] text-gray-500">
                                <span>Active Plan Coverage Rate</span>
                                <span className="font-bold text-emerald-600">{subscriptionActiveRate}% Active</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── 3-Card Operations & Recruiter Quota Breakdown Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* Card 1: Recruiter Quota Utilization */}
                <div className="bg-white p-6 rounded-2xl shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[15px] font-semibold text-gray-900 mb-0 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-500" />
                                Recruiter Quota Utilization
                            </h3>
                            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border-1 border-indigo-100">
                                Operational Limits
                            </span>
                        </div>
                        <p className="text-gray-400 text-[12px] mb-4">Live quota consumption efficiency across active employers</p>

                        <div className="space-y-3.5">
                            {/* Job Posts */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[12.5px]">
                                    <span className="font-medium text-gray-700">Job Posts Quota</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">{quotaUtilization.jobPosts.used.toLocaleString()}</span>
                                        <span className="text-gray-400 text-[11px]">/ {quotaUtilization.jobPosts.limit ? quotaUtilization.jobPosts.limit.toLocaleString() : '∞'} ({quotaUtilization.jobPosts.pct}%)</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 bg-amber-500"
                                        style={{ width: `${Math.max(quotaUtilization.jobPosts.pct, 4)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Resume Views */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[12.5px]">
                                    <span className="font-medium text-gray-700">Resume Views</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">{quotaUtilization.resumeViews.used.toLocaleString()}</span>
                                        <span className="text-gray-400 text-[11px]">/ {quotaUtilization.resumeViews.limit ? quotaUtilization.resumeViews.limit.toLocaleString() : '∞'} ({quotaUtilization.resumeViews.pct}%)</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 bg-blue-500"
                                        style={{ width: `${Math.max(quotaUtilization.resumeViews.pct, 4)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Resume Downloads */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[12.5px]">
                                    <span className="font-medium text-gray-700">Resume Downloads</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">{quotaUtilization.resumeDownloads.used.toLocaleString()}</span>
                                        <span className="text-gray-400 text-[11px]">/ {quotaUtilization.resumeDownloads.limit ? quotaUtilization.resumeDownloads.limit.toLocaleString() : '∞'} ({quotaUtilization.resumeDownloads.pct}%)</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 bg-purple-500"
                                        style={{ width: `${Math.max(quotaUtilization.resumeDownloads.pct, 4)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Team Seats */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[12.5px]">
                                    <span className="font-medium text-gray-700">Sub-Recruiter Seats</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">{quotaUtilization.teamSeats.used.toLocaleString()}</span>
                                        <span className="text-gray-400 text-[11px]">/ {quotaUtilization.teamSeats.limit ? quotaUtilization.teamSeats.limit.toLocaleString() : '1'} ({quotaUtilization.teamSeats.pct}%)</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                                        style={{ width: `${Math.max(quotaUtilization.teamSeats.pct, 4)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-500">
                        <span>Total Sourced Profiles</span>
                        <span className="font-bold text-indigo-600">{totalSourcingActivity.toLocaleString()} Total</span>
                    </div>
                </div>

                {/* Card 2: Hiring Industry Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[15px] font-semibold text-gray-900 mb-0 flex items-center gap-2">
                                <Building className="w-4 h-4 text-purple-500" />
                                Hiring Industry Distribution
                            </h3>
                            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border-1 border-purple-100">
                                Sectors
                            </span>
                        </div>
                        <p className="text-gray-400 text-[12px] mb-4">Breakdown of registered employers by industry</p>

                        <div className="space-y-3">
                            {industryDistribution.slice(0, 4).map((ind, idx) => {
                                const percent = totalRecruitersCount > 0 ? Math.round((ind.count / totalRecruitersCount) * 100) : 0;
                                const barColors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500'];
                                return (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex items-center justify-between text-[12.5px]">
                                            <span className="font-medium text-gray-700 truncate max-w-[200px]">{ind.name}</span>
                                            <span className="font-semibold text-gray-900">{ind.count} ({percent}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${barColors[idx % barColors.length]}`}
                                                style={{ width: `${Math.max(percent, 5)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-gray-100 text-[11.5px] text-gray-400 text-center">
                        Representing {industryDistribution.length} distinct business sectors
                    </div>
                </div>

                {/* Card 3: Platform Hiring Velocity & Account Health */}
                <div className="bg-white p-6 rounded-2xl shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[15px] font-semibold text-gray-900 mb-0 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-blue-500" />
                                Employer Platform Health
                            </h3>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border-1 border-emerald-200/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Healthy
                            </span>
                        </div>
                        <p className="text-gray-400 text-[12px] mb-4">Core recruiter engagement and operational health</p>

                        <div className="space-y-3.5">
                            <div className="p-3 rounded-xl bg-slate-50/80 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-emerald-100/70 text-emerald-700">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-[12px] font-medium text-gray-600 block">Account Good Standing</span>
                                        <span className="text-[11px] text-gray-400">Active recruiter accounts</span>
                                    </div>
                                </div>
                                <span className="text-lg font-bold text-emerald-600">{activeAccountRate}%</span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50/80 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-blue-100/70 text-blue-700">
                                        <Briefcase className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-[12px] font-medium text-gray-600 block">Avg Jobs / Recruiter</span>
                                        <span className="text-[11px] text-gray-400">Posting intensity</span>
                                    </div>
                                </div>
                                <span className="text-lg font-bold text-gray-900">{avgJobsPerRecruiter}</span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50/80 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-purple-100/70 text-purple-700">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-[12px] font-medium text-gray-600 block">Sub-Recruiters Active</span>
                                        <span className="text-[11px] text-gray-400">Team seats deployed</span>
                                    </div>
                                </div>
                                <span className="text-lg font-bold text-purple-700">{totalSubRecruiterSeats.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-gray-100 text-[11.5px] text-gray-400 text-center">
                        Updated dynamically based on live database events
                    </div>
                </div>
            </div>

            {/* ── Dynamic Recruiter Performance Directory & Table ── */}
            <div className="bg-white rounded-2xl shadow-xs overflow-hidden">
                {/* Table Header Controls */}
                <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-gray-900 mb-0">Recruiter Roster & Hiring Performance</h2>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-bold bg-gray-100 text-gray-700">
                                {filteredRecruiters.length.toLocaleString()} Recruiters
                            </span>
                        </div>
                        <p className="text-gray-500 text-[13px] mt-0.5 mb-0">
                            Live recruiter directory with subscription tier, job posting activity, resume views, and team seats.
                        </p>
                    </div>

                    {/* Search & Actions */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Search Input */}
                        <div className="relative min-w-[220px] sm:w-[260px]">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search company, recruiter, email..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-0.5"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Plan Filter Dropdown */}
                        <AdminSelect
                            value={planFilter}
                            onChange={(val) => {
                                setPlanFilter(val);
                                setCurrentPage(1);
                            }}
                            options={planOptions}
                            placeholder="Filter Plan"
                            size="sm"
                            className="min-w-[140px]"
                        />

                        {/* Status Filter Dropdown */}
                        <AdminSelect
                            value={statusFilter}
                            onChange={(val) => {
                                setStatusFilter(val);
                                setCurrentPage(1);
                            }}
                            options={statusOptions}
                            placeholder="Filter Status"
                            size="sm"
                            className="min-w-[140px]"
                        />

                        {/* Export Recruiters CSV */}
                        <button
                            onClick={handleExportRecruitersList}
                            className="flex items-center gap-1.5 bg-emerald-50 border-1 border-emerald-200/80 text-emerald-700 hover:bg-emerald-100/80 px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-colors cursor-pointer select-none"
                            title="Export all matching recruiters to CSV"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/70 border-b border-gray-100 text-[11.5px] font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-3.5 px-4 pl-6">Company & Recruiter</th>
                                <th className="py-3.5 px-4">Industry / Type</th>
                                <th className="py-3.5 px-4">Subscription Plan</th>
                                <th className="py-3.5 px-4">Plan Status</th>
                                <th className="py-3.5 px-4 text-center">Job Posting</th>
                                <th className="py-3.5 px-4 text-center">Resume Sourcing</th>
                                <th className="py-3.5 px-4 text-center">Team Seats</th>
                                <th className="py-3.5 px-4">Joined Date</th>
                                <th className="py-3.5 px-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-[13px]">
                            {loadingRecruiters ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="py-4 px-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-200"></div>
                                                <div className="space-y-1.5">
                                                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-36"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                                        <td className="py-4 px-4"><div className="h-5 bg-gray-200 rounded-full w-16"></div></td>
                                        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div></td>
                                        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div></td>
                                        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div></td>
                                        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                        <td className="py-4 px-4 pr-6 text-right"><div className="h-7 bg-gray-200 rounded w-16 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : paginatedRecruiters.length > 0 ? (
                                paginatedRecruiters.map((r) => {
                                    const companyName = r.company_name || 'Individual Recruiter';
                                    const recruiterName = r.recruiter_name || 'Recruiter';
                                    const subStatus = (r.subscription_status || 'No Plan').toLowerCase();
                                    const isSubActive = subStatus === 'active';
                                    const isUserActive = Number(r.user_active) === 1;
                                    const joinDateInfo = formatRelativeDate(r.recruiter_created_date);

                                    return (
                                        <tr
                                            key={r.recruiter_id}
                                            className="hover:bg-slate-50/60 transition-colors group"
                                        >
                                            {/* Company & Recruiter Column */}
                                            <td className="py-3.5 px-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative shrink-0">
                                                        {r.company_logo ? (
                                                            <img
                                                                src={getImageUrl(r.company_logo)}
                                                                alt={companyName}
                                                                className="w-10 h-10 rounded-xl object-contain border border-gray-100 bg-white p-0.5 shadow-2xs"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getCompanyAvatarGradient(companyName)} flex items-center justify-center text-white font-bold text-sm shadow-2xs`}>
                                                                {(companyName[0] || 'C').toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 max-w-[210px]">
                                                        <div className="flex items-center gap-1.5">
                                                            <span
                                                                className="font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors cursor-pointer"
                                                                onClick={() => router.push(`/admin/recruiters/${r.recruiter_id}`)}
                                                            >
                                                                {companyName}
                                                            </span>
                                                            {!isUserActive && (
                                                                <span className="text-[9.5px] font-bold text-rose-700 bg-rose-50 border border-rose-200/60 px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0">
                                                                    Suspended
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-gray-500 text-[12px] block truncate">{recruiterName}</span>
                                                        <span className="text-gray-400 text-[11px] block truncate">{r.email || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Industry / Type */}
                                            <td className="py-3.5 px-4">
                                                <div className="min-w-0 max-w-[160px]">
                                                    <span className="font-medium text-gray-800 block truncate text-[12.5px]">
                                                        {r.industry_type || 'Unspecified'}
                                                    </span>
                                                    <span className="text-gray-400 text-[11px] block truncate mt-0.5">
                                                        {r.organization_type || 'Corporate'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Subscription Plan */}
                                            <td className="py-3.5 px-4">
                                                <div className="min-w-0 max-w-[180px]">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11.5px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60 truncate max-w-full">
                                                        {r.plan_name || 'Free Plan'}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                                                        <span className="capitalize">{r.billing_cycle || 'monthly'}</span>
                                                        {Number(r.price_paid || 0) > 0 && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="font-medium text-gray-600">₹{Number(r.price_paid).toLocaleString()}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Plan Status */}
                                            <td className="py-3.5 px-4">
                                                {isSubActive ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                        {r.subscription_status || 'No Plan'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Job Posting Usage */}
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="font-bold text-gray-900 text-[13px]">
                                                        {Number(r.job_posts_used || 0).toLocaleString()}
                                                        <span className="text-gray-400 font-normal text-[11.5px]"> / {r.job_post_limit || '∞'}</span>
                                                    </span>
                                                    {Number(r.active_jobs_count || 0) > 0 && (
                                                        <span className="text-[10.5px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-md mt-0.5">
                                                            {r.active_jobs_count} live
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Resume Sourcing */}
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100" title="Resumes Viewed">
                                                        <Eye className="w-3 h-3 text-blue-500" />
                                                        {r.resume_views_used || 0}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100" title="Resumes Downloaded">
                                                        <Download className="w-3 h-3 text-purple-500" />
                                                        {r.resume_downloads_used || 0}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Team Seats */}
                                            <td className="py-3.5 px-4 text-center">
                                                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-700">
                                                    <Users className="w-3.5 h-3.5 text-gray-400" />
                                                    {r.sub_recruiters_count || 0} seats
                                                </span>
                                            </td>

                                            {/* Joined Date */}
                                            <td className="py-3.5 px-4">
                                                <div className="text-[12px]">
                                                    <span className="font-medium text-gray-800 block">{joinDateInfo.relative}</span>
                                                    <span className="text-gray-400 text-[11px] block">{joinDateInfo.exact}</span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 pr-6 text-right">
                                                <button
                                                    onClick={() => router.push(`/admin/recruiters/${r.recruiter_id}`)}
                                                    className="inline-flex items-center gap-1 bg-white hover:bg-blue-50 text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                                                >
                                                    <span>View</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-gray-400 text-sm">
                                        <Building2 className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                        <span>No recruiters found matching the selected filters</span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredRecruiters.length)} of {filteredRecruiters.length} recruiters
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-semibold px-2 text-gray-700">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
