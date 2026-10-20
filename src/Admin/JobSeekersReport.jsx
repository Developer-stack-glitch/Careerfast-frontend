'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    BarChart, Bar, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    Users, Briefcase, FileCheck, Building, TrendingUp, TrendingDown,
    Download, CheckCircle2, Clock, Mail, XCircle, MapPin, Sparkles,
    ShieldCheck, Activity, UserCheck, UserX,
    Search, Filter, RefreshCw, Eye, GraduationCap, ChevronLeft,
    ChevronRight, ChevronDown, FileSpreadsheet, Award, AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSuperAdminDashboardStats, getUsers } from '../ApiService/action';
import AdminDateFilter from './AdminDateFilter';
import useAdminPermissions from './useAdminPermissions';
import CandidateProfileModal from './CandidateProfileModal';
import { getImageUrl } from '../utils/getImageUrl';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

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

// Format relative and readable date
const formatRelativeDate = (dateStr) => {
    if (!dateStr) return { relative: 'Never', exact: '' };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { relative: 'Never', exact: '' };

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

// Check if candidate is recently registered (last 7 days)
const isRecentCandidate = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
};

export default function JobSeekersReport() {
    const router = useRouter();
    const { can, isSuperAdmin } = useAdminPermissions();
    const canExport = isSuperAdmin || can('report_job_seekers', 'export_job_seekers_report') || can('analytics', 'export_analytics_data');
    const canViewGrowth = isSuperAdmin || can('report_job_seekers', 'view_candidate_growth_report') || can('analytics', 'user_growth_analysis');
    const canViewTrends = isSuperAdmin || can('report_job_seekers', 'application_submission_trends') || can('analytics', 'job_moderation_trends');
    const canViewSkills = isSuperAdmin || can('report_job_seekers', 'skills_demand_analytics');

    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingCandidates, setLoadingCandidates] = useState(true);
    const [dateFilter, setDateFilter] = useState({ preset: 'All Time', startDate: '', endDate: '', label: 'All Time' });

    // Analytics aggregated data
    const [analyticsData, setAnalyticsData] = useState({
        counts: { candidates: 0, activeCandidates: 0, disabledCandidates: 0, applications: 0, jobsApplied: 0, internshipsApplied: 0 },
        todayCounts: { registerUsers: 0, loggedInUsers: 0, jobsApplied: 0, internshipsApplied: 0 },
        monthlyData: { candidates: [], applications: [] },
        distributions: { workplace: [], status: [], categories: [] },
        userGrowth: [],
        applicationTrends: []
    });

    // Dynamic candidate list state (First 10 candidates only on report page)
    const [candidates, setCandidates] = useState([]);
    const [totalCandidates, setTotalCandidates] = useState(0);
    const [candidateSearch, setCandidateSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Active', 'Disabled', 'Complete', 'Recent'
    const [sortBy, setSortBy] = useState('created_date');
    const [sortOrder, setSortOrder] = useState('DESC');
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    // Fetch aggregated analytics stats
    const fetchAnalytics = useCallback(async () => {
        try {
            setLoadingStats(true);
            const timeFilterParam = dateFilter.preset !== 'Custom Range' && dateFilter.preset !== 'All Time' ? dateFilter.preset : undefined;
            const extraParams = {
                start_date: dateFilter.preset === 'Custom Range' ? (dateFilter.startDate || undefined) : undefined,
                end_date: dateFilter.preset === 'Custom Range' ? (dateFilter.endDate || undefined) : undefined
            };
            const response = await getSuperAdminDashboardStats(timeFilterParam, extraParams);
            const resData = response.data?.data || response.data || {};
            setAnalyticsData(resData);
        } catch (error) {
            console.error('Error fetching jobseeker analytics:', error);
            toast.error('Failed to load job seeker analytics');
        } finally {
            setLoadingStats(false);
        }
    }, [dateFilter]);

    // Fetch dynamic candidate records table (first 10 records)
    const fetchCandidatesList = useCallback(async () => {
        try {
            setLoadingCandidates(true);
            const payload = {
                page: 1,
                limit: 10,
                search: candidateSearch.trim() || undefined,
                status: statusFilter !== 'All' ? statusFilter : undefined,
                role: 2, // Candidate / Job Seeker role
                start_date: dateFilter.preset === 'Custom Range' ? (dateFilter.startDate || undefined) : undefined,
                end_date: dateFilter.preset === 'Custom Range' ? (dateFilter.endDate || undefined) : undefined,
                timeFilter: dateFilter.preset !== 'Custom Range' && dateFilter.preset !== 'All Time' ? dateFilter.preset : undefined,
                sortBy: sortBy,
                sortOrder: sortOrder
            };

            const response = await getUsers(payload);
            const responseData = response?.data?.data;

            if (responseData && responseData.users) {
                setCandidates(responseData.users || []);
                setTotalCandidates(responseData.total || 0);
            } else if (Array.isArray(responseData)) {
                setCandidates(responseData.slice(0, 10));
                setTotalCandidates(responseData.length);
            } else {
                setCandidates([]);
                setTotalCandidates(0);
            }
        } catch (error) {
            console.error('Error fetching dynamic candidates list:', error);
            toast.error('Failed to fetch candidate directory');
        } finally {
            setLoadingCandidates(false);
        }
    }, [candidateSearch, statusFilter, dateFilter, sortBy, sortOrder]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    useEffect(() => {
        fetchCandidatesList();
    }, [fetchCandidatesList]);

    // Export Master Executive Report (CSV)
    const handleExportExecutiveReport = () => {
        const counts = analyticsData?.counts || {};
        const todayCounts = analyticsData?.todayCounts || {};
        const statusData = analyticsData?.distributions?.status || [];
        const workplaceData = analyticsData?.distributions?.workplace || [];

        const totalApplications = counts.applications || ((counts.jobsApplied || 0) + (counts.internshipsApplied || 0));
        const shortlistedItem = statusData.find(s => s.status === 'Shortlisted');
        const shortlistRate = totalApplications > 0 && shortlistedItem ? `${Math.round((shortlistedItem.count / totalApplications) * 100)}%` : '0%';

        const csvRows = [];
        csvRows.push(['JOB SEEKER ANALYTICS & TALENT REPORT']);
        csvRows.push(['Generated At', new Date().toLocaleString()]);
        csvRows.push(['Filter Period', dateFilter.label || dateFilter.preset || 'All Time']);
        csvRows.push([]);

        csvRows.push(['EXECUTIVE SUMMARY METRICS', 'VALUE']);
        csvRows.push(['Total Registered Job Seekers', counts.candidates || 0]);
        csvRows.push(['Active Job Seekers', counts.activeCandidates || (counts.candidates || 0)]);
        csvRows.push(['Disabled / Inactive Candidates', counts.disabledCandidates || 0]);
        csvRows.push(['Total Applications Submitted', totalApplications]);
        csvRows.push(['Jobs Applied', counts.jobsApplied || 0]);
        csvRows.push(['Internships Applied', counts.internshipsApplied || 0]);
        csvRows.push(['Shortlist Placement Conversion Rate', shortlistRate]);
        csvRows.push(['Today Registered Candidates', todayCounts.registerUsers || 0]);
        csvRows.push(['Today Logged In Candidates', todayCounts.loggedInUsers || 0]);
        csvRows.push([]);

        // Status Breakdown
        csvRows.push(['APPLICATION PIPELINE FUNNEL', 'APPLICATIONS', 'SHARE %']);
        statusData.forEach(item => {
            const pct = totalApplications > 0 ? `${Math.round((item.count / totalApplications) * 100)}%` : '0%';
            csvRows.push([item.status, item.count, pct]);
        });
        csvRows.push([]);

        // Workplace Breakdown
        csvRows.push(['PREFERRED WORKPLACE PREFERENCES', 'JOBS APPLIED', 'SHARE %']);
        const totalWp = workplaceData.reduce((acc, curr) => acc + (curr.count || 0), 0) || 1;
        workplaceData.forEach(item => {
            const pct = `${Math.round((item.count / totalWp) * 100)}%`;
            csvRows.push([item.workplace_type || 'Unspecified', item.count, pct]);
        });
        csvRows.push([]);

        // Candidate Growth History
        if (analyticsData?.userGrowth && analyticsData.userGrowth.length > 0) {
            csvRows.push(['REGISTRATION VELOCITY TRENDS', 'NEW CANDIDATES']);
            analyticsData.userGrowth.forEach(item => {
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
        link.setAttribute("download", `job_seekers_analytics_report_${filterSlug}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Executive report downloaded');
    };

    // Export Detailed Candidates List (CSV)
    const handleExportCandidatesList = async () => {
        try {
            toast.loading('Preparing candidate directory export...', { id: 'export-cand' });
            // Fetch all matching candidates without pagination
            const payload = {
                page: 1,
                limit: 1000,
                search: candidateSearch.trim() || undefined,
                status: statusFilter !== 'All' ? statusFilter : undefined,
                role: 2,
                start_date: dateFilter.preset === 'Custom Range' ? (dateFilter.startDate || undefined) : undefined,
                end_date: dateFilter.preset === 'Custom Range' ? (dateFilter.endDate || undefined) : undefined,
                timeFilter: dateFilter.preset !== 'Custom Range' && dateFilter.preset !== 'All Time' ? dateFilter.preset : undefined,
                sortBy: sortBy,
                sortOrder: sortOrder
            };

            const response = await getUsers(payload);
            const exportList = response?.data?.data?.users || response?.data?.data || candidates;

            const csvRows = [];
            csvRows.push([
                'Candidate ID', 'Full Name', 'Email', 'Phone', 'Location',
                'Education', 'Experience', 'Key Skills', 'Profile Completion %',
                'Applications Count', 'Account Status', 'Registered Date', 'Last Active'
            ]);

            exportList.forEach(c => {
                const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Candidate';
                const skillsStr = Array.isArray(c.skills) ? c.skills.join(', ') : (c.skills || '-');
                const isActive = c.is_active?.data ? c.is_active.data[0] === 1 : (c.is_active === 1 || c.is_active === true);
                const regDate = c.created_date ? new Date(c.created_date).toLocaleDateString() : '-';
                const lastActive = c.last_active || c.last_login ? new Date(c.last_active || c.last_login).toLocaleDateString() : '-';

                csvRows.push([
                    c.id,
                    fullName,
                    c.email || '-',
                    c.phone || c.mobile || '-',
                    c.location || 'Not Specified',
                    c.display_education || c.education_course || c.course || '-',
                    c.experince_type || (c.total_years ? `${c.total_years} yrs` : 'Fresher'),
                    skillsStr,
                    `${c.profile_completion || 0}%`,
                    c.applications_count || 0,
                    isActive ? 'Active' : 'Disabled',
                    regDate,
                    lastActive
                ]);
            });

            const csvContent = csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `candidates_directory_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Candidates list downloaded successfully', { id: 'export-cand' });
        } catch (error) {
            console.error('Failed to export candidates list:', error);
            toast.error('Failed to export candidates list', { id: 'export-cand' });
        }
    };

    // Derived statistics calculations
    const counts = analyticsData?.counts || {};
    const todayCounts = analyticsData?.todayCounts || {};
    const totalSeekersCount = counts.candidates || totalCandidates || 0;
    const activeSeekersCount = counts.activeCandidates ?? (counts.candidates || totalCandidates || 0);
    const totalAppsCount = counts.applications || ((counts.jobsApplied || 0) + (counts.internshipsApplied || 0)) || 0;

    const statusData = analyticsData?.distributions?.status || [];
    const totalStatusCount = statusData.reduce((acc, curr) => acc + (curr.count || 0), 0) || totalAppsCount || 1;
    const shortlistedItem = statusData.find(s => s.status === 'Shortlisted');
    const shortlistRate = totalStatusCount > 0 && shortlistedItem ? Math.round((shortlistedItem.count / totalStatusCount) * 100) : 0;

    const appsPerSeeker = totalSeekersCount > 0 ? (totalAppsCount / totalSeekersCount).toFixed(1) : '0.0';
    const activeEngagementRate = totalSeekersCount > 0 ? Math.round((activeSeekersCount / totalSeekersCount) * 100) : 100;

    const statusConfig = {
        'Shortlisted': { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500', pillBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/70' },
        'Mail Sent': { icon: Mail, color: 'text-sky-600', bg: 'bg-sky-500', pillBg: 'bg-sky-50 text-sky-700 border-sky-200/70' },
        'Pending': { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500', pillBg: 'bg-amber-50 text-amber-700 border-amber-200/70' },
        'Rejected': { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-500', pillBg: 'bg-rose-50 text-rose-700 border-rose-200/70' },
    };

    const workplaceData = analyticsData?.distributions?.workplace || [];
    const totalWorkplaceCount = workplaceData.reduce((sum, item) => sum + (item.count || 0), 0) || 1;

    // Monthly Trends Processing
    const userGrowthData = analyticsData?.userGrowth || [];
    const applicationTrendsData = analyticsData?.applicationTrends || [];

    if (loadingStats && !analyticsData?.counts?.candidates) {
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
                        <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h1 className="text-2xl font-semibold text-gray-900 mb-0 tracking-tight">Job Seeker Reports</h1>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-blue-50 text-blue-700 border-1 border-blue-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                Dynamic Talent Intelligence
                            </span>
                        </div>
                        <p className="text-gray-500 text-[13px] mt-0.5 mb-0">
                            Real-time candidate registrations, application submission velocity, pipeline conversions, and talent roster.
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
                            title="Download comprehensive executive metrics CSV"
                        >
                            <Download className="w-4 h-4 text-gray-500" />
                            Download Report
                        </button>
                    )}
                </div>
            </div>

            {/* ── 4 Top Stats Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Job Seekers"
                    value={totalSeekersCount.toLocaleString()}
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    accent="ring-blue-100"
                    trend={todayCounts.registerUsers ? { text: `+${todayCounts.registerUsers} today`, isPositive: true } : null}
                    subtext="registered talent"
                />
                <StatCard
                    title="Active Job Seekers"
                    value={activeSeekersCount.toLocaleString()}
                    icon={UserCheck}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                    accent="ring-emerald-100"
                    trend={{ text: `${activeEngagementRate}% active`, isPositive: true }}
                    subtext="verified profiles"
                />
                <StatCard
                    title="Total Applications"
                    value={totalAppsCount.toLocaleString()}
                    icon={FileCheck}
                    color="text-amber-600"
                    bg="bg-amber-50"
                    accent="ring-amber-100"
                    trend={todayCounts.jobsApplied || todayCounts.internshipsApplied ? { text: `+${(todayCounts.jobsApplied || 0) + (todayCounts.internshipsApplied || 0)} today`, isPositive: true } : null}
                    subtext="across all jobs"
                />
                <StatCard
                    title="Shortlist Placement Rate"
                    value={`${shortlistRate}%`}
                    icon={Sparkles}
                    color="text-purple-600"
                    bg="bg-purple-50"
                    accent="ring-purple-100"
                    trend={shortlistedItem?.count ? { text: `${shortlistedItem.count.toLocaleString()} shortlisted`, isPositive: true } : null}
                    subtext="interview funnel"
                />
            </div>

            {/* ── Charts Row (Line & Bar Charts) ── */}
            {(canViewGrowth || canViewTrends) && (
                <div className={`grid grid-cols-1 ${canViewGrowth && canViewTrends ? 'lg:grid-cols-2' : ''} gap-6 mb-8`}>
                    {/* Candidate Registration Trajectory Chart */}
                    {canViewGrowth && (
                        <div className="bg-white p-6 rounded-2xl shadow-xs">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-[15px] font-semibold text-gray-900 mb-0.5 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-500" />
                                        Job Seeker Registration Trajectory
                                    </h3>
                                    <p className="text-gray-400 text-[12px] mb-0">Candidate onboarding velocity over selected period</p>
                                </div>
                                <span className="text-[11.5px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border-1 border-blue-100">
                                    {userGrowthData.reduce((sum, item) => sum + (item.uv || 0), 0).toLocaleString()} New
                                </span>
                            </div>

                            <div className="h-[280px] w-full">
                                {userGrowthData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="candidateGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-5} />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '13px' }}
                                                formatter={(value) => [`${value} Job Seekers`, 'Registrations']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="uv"
                                                name="New Job Seekers"
                                                stroke="#3b82f6"
                                                strokeWidth={2.5}
                                                fillOpacity={1}
                                                fill="url(#candidateGrowthGrad)"
                                                dot={{ r: 3, strokeWidth: 2, fill: '#fff', stroke: '#3b82f6' }}
                                                activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                                        <Activity className="w-8 h-8 text-gray-300 mb-2" />
                                        <span>No registration trend data for this date filter</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Applications Submitted Bar Chart */}
                    {canViewTrends && (
                        <div className="bg-white p-6 rounded-2xl shadow-xs">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-[15px] font-semibold text-gray-900 mb-0.5 flex items-center gap-2">
                                        <FileCheck className="w-4 h-4 text-amber-500" />
                                        Candidate Applications Submitted
                                    </h3>
                                    <p className="text-gray-400 text-[12px] mb-0">Total job & internship applications sent</p>
                                </div>
                                <span className="text-[11.5px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border-1 border-amber-100">
                                    {applicationTrendsData.reduce((sum, item) => sum + (item.pv || 0), 0).toLocaleString()} Sent
                                </span>
                            </div>

                            <div className="h-[280px] w-full">
                                {applicationTrendsData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={applicationTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-5} />
                                            <RechartsTooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '13px' }}
                                                formatter={(value) => [`${value} Submissions`, 'Applications']}
                                            />
                                            <Bar dataKey="pv" name="Applications" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={28} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                                        <FileCheck className="w-8 h-8 text-gray-300 mb-2" />
                                        <span>No application data available for this range</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── 3-Card Demographics & Pipeline Distribution Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* Card 1: Application Pipeline Funnel */}
                <div className="bg-white p-6 rounded-2xl shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[15px] font-semibold text-gray-900 mb-0 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Application Pipeline Funnel
                            </h3>
                            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {totalAppsCount.toLocaleString()} Total
                            </span>
                        </div>

                        {statusData.length > 0 ? (
                            <div className="space-y-3.5 mt-3">
                                {statusData.map((item, idx) => {
                                    const percent = Math.round(((item.count || 0) / totalStatusCount) * 100);
                                    const cfg = statusConfig[item.status] || { icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-500', pillBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/70' };
                                    const IconComp = cfg.icon;

                                    return (
                                        <div key={idx} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-[12.5px]">
                                                <div className="flex items-center gap-1.5 font-medium text-gray-800">
                                                    <IconComp className={`w-3.5 h-3.5 ${cfg.color}`} />
                                                    <span>{item.status}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-900">{item.count.toLocaleString()}</span>
                                                    <span className="text-gray-400 text-[11px]">({percent}%)</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${cfg.bg}`}
                                                    style={{ width: `${Math.max(percent, 4)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-gray-400 text-sm py-12 text-center">No application status data found</div>
                        )}
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between text-[12px] text-gray-500">
                        <span>Shortlist Conversion Rate</span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            {shortlistRate}%
                        </span>
                    </div>
                </div>

                {/* Card 2: Workplace Preferences Donut */}
                <div className="bg-white p-6 rounded-2xl shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[15px] font-semibold text-gray-900 mb-0 flex items-center gap-2">
                                <Building className="w-4 h-4 text-purple-500" />
                                Workplace Preferences
                            </h3>
                            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border-1 border-purple-100">
                                Talent Mobility
                            </span>
                        </div>
                        <p className="text-gray-400 text-[12px] mb-2">Candidate preference distribution for roles</p>

                        <div className="h-[210px] w-full flex items-center justify-center">
                            {workplaceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={workplaceData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={4}
                                            dataKey="count"
                                            nameKey="workplace_type"
                                            stroke="none"
                                        >
                                            {workplaceData.map((entry, index) => (
                                                <Cell key={`wp-cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                            formatter={(value, name) => [`${value} Jobs (${Math.round((value / totalWorkplaceCount) * 100)}%)`, name || 'Workplace']}
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
                                <div className="text-gray-400 text-sm">No workplace distribution data</div>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 pt-3.5 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                        {workplaceData.slice(0, 3).map((w, idx) => (
                            <div key={idx} className="bg-gray-50/70 p-2 rounded-xl">
                                <span className="text-[10.5px] font-medium text-gray-500 block truncate">{w.workplace_type || 'Mode'}</span>
                                <span className="text-[13px] font-bold text-gray-900 block mt-0.5">
                                    {Math.round((w.count / totalWorkplaceCount) * 100)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 3: Talent Quality & Key Metrics */}
                <div className="bg-white p-6 rounded-2xl shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[15px] font-semibold text-gray-900 mb-0 flex items-center gap-2">
                                <Award className="w-4 h-4 text-blue-500" />
                                Talent Quality & Velocity
                            </h3>
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border-1 border-emerald-200/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Healthy
                            </span>
                        </div>
                        <p className="text-gray-400 text-[12px] mb-4">Core platform candidate engagement benchmarks</p>

                        <div className="space-y-3.5">
                            <div className="p-3 rounded-xl bg-slate-50/80 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-blue-100/70 text-blue-700">
                                        <Briefcase className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-[12px] font-medium text-gray-600 block">Avg Apps / Candidate</span>
                                        <span className="text-[11px] text-gray-400">Application intensity</span>
                                    </div>
                                </div>
                                <span className="text-lg font-bold text-gray-900">{appsPerSeeker}</span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50/80 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-emerald-100/70 text-emerald-700">
                                        <GraduationCap className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-[12px] font-medium text-gray-600 block">Active Engagement</span>
                                        <span className="text-[11px] text-gray-400">Talent market readiness</span>
                                    </div>
                                </div>
                                <span className="text-lg font-bold text-emerald-600">{activeEngagementRate}%</span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50/80 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-lg bg-purple-100/70 text-purple-700">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-[12px] font-medium text-gray-600 block">Total Active Roster</span>
                                        <span className="text-[11px] text-gray-400">Candidate pool size</span>
                                    </div>
                                </div>
                                <span className="text-lg font-bold text-purple-700">{activeSeekersCount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-gray-100 text-[11.5px] text-gray-400 text-center">
                        Updated dynamically based on live database events
                    </div>
                </div>
            </div>

            {/* ── Dynamic Candidate Directory & Report Table ── */}
            <div className="bg-white rounded-2xl shadow-xs overflow-hidden">
                {/* Table Header Controls */}
                <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-gray-900 mb-0">Candidate Roster & Performance</h2>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-bold bg-gray-100 text-gray-700">
                                {totalCandidates.toLocaleString()} Candidates
                            </span>
                        </div>
                        <p className="text-gray-500 text-[13px] mt-0.5 mb-0">
                            Live candidate directory with education, skills, profile completeness, and submission counts.
                        </p>
                    </div>

                    {/* Search & Actions */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Search Input */}
                        <div className="relative min-w-[240px] sm:w-[280px]">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search candidate, email, skill..."
                                value={candidateSearch}
                                onChange={(e) => setCandidateSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-[13px] bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                            />
                            {candidateSearch && (
                                <button
                                    onClick={() => setCandidateSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-0.5"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={() => {
                                fetchCandidatesList();
                                fetchAnalytics();
                            }}
                            className="p-2.5 bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                            title="Refresh Data"
                        >
                            <RefreshCw className={`w-4 h-4 ${loadingCandidates ? 'animate-spin text-blue-600' : ''}`} />
                        </button>

                        {/* Export Candidates CSV */}
                        <button
                            onClick={handleExportCandidatesList}
                            className="flex items-center gap-1.5 bg-emerald-50 border-1 border-emerald-200/80 text-emerald-700 hover:bg-emerald-100/80 px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-colors cursor-pointer select-none"
                            title="Export all matching candidates to CSV"
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
                                <th className="py-3.5 px-4 pl-6">Candidate</th>
                                <th className="py-3.5 px-4">Education & Location</th>
                                <th className="py-3.5 px-4">Key Skills</th>
                                <th className="py-3.5 px-4">Profile Score</th>
                                <th className="py-3.5 px-4 text-center">Applications</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4">Joined Date</th>
                                <th className="py-3.5 px-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-[13px]">
                            {loadingCandidates ? (
                                [...Array(6)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="py-4 px-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                                                <div className="space-y-1.5">
                                                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-36"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                                        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-10 mx-auto"></div></td>
                                        <td className="py-4 px-4"><div className="h-5 bg-gray-200 rounded-full w-16"></div></td>
                                        <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                        <td className="py-4 px-4 pr-6 text-right"><div className="h-7 bg-gray-200 rounded w-16 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : candidates.length > 0 ? (
                                candidates.map((cand) => {
                                    const fullName = `${cand.first_name || ''} ${cand.last_name || ''}`.trim() || 'Candidate';
                                    const isActive = cand.is_active?.data ? cand.is_active.data[0] === 1 : (cand.is_active === 1 || cand.is_active === true);
                                    const completion = Math.min(100, Math.max(0, Math.round(cand.profile_completion || 0)));
                                    const isNew = isRecentCandidate(cand.created_date);
                                    const joinDateInfo = formatRelativeDate(cand.created_date);

                                    // Completion color
                                    const scoreColor = completion >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : completion >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-rose-700 bg-rose-50 border-rose-200';
                                    const scoreBarBg = completion >= 80 ? 'bg-emerald-500' : completion >= 50 ? 'bg-amber-500' : 'bg-rose-500';

                                    // Parse Skills array
                                    const skillsList = Array.isArray(cand.skills) ? cand.skills : [];

                                    return (
                                        <tr
                                            key={cand.id}
                                            className="hover:bg-slate-50/60 transition-colors group"
                                        >
                                            {/* Candidate Column */}
                                            <td className="py-3.5 px-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative shrink-0">
                                                        <img
                                                            src={getImageUrl(cand.profile_image, fullName)}
                                                            alt={fullName}
                                                            className="w-10 h-10 rounded-full object-cover border-1 border-gray-100 shadow-2xs"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = getImageUrl(null, fullName);
                                                            }}
                                                        />
                                                        {isNew && (
                                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white ring-1 ring-blue-400" title="New registration"></span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 max-w-[200px]">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors cursor-pointer" onClick={() => setSelectedCandidate(cand)}>
                                                                {fullName}
                                                            </span>
                                                            {isNew && (
                                                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0">
                                                                    New
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-gray-400 text-[12px] block truncate">{cand.email || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Education & Location */}
                                            <td className="py-3.5 px-4">
                                                <div className="min-w-0 max-w-[180px]">
                                                    <span className="font-medium text-gray-800 block truncate text-[12.5px]">
                                                        {cand.display_education || cand.education_course || cand.course || 'Degree N/A'}
                                                    </span>
                                                    <span className="text-gray-400 text-[11.5px] flex items-center gap-1 mt-0.5 truncate">
                                                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                                        {cand.location || 'Not Specified'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Skills Chips */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-wrap items-center gap-1 max-w-[220px]">
                                                    {skillsList.length > 0 ? (
                                                        <>
                                                            {skillsList.slice(0, 2).map((sk, idx) => (
                                                                <span key={idx} className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 max-w-[100px] truncate">
                                                                    {sk}
                                                                </span>
                                                            ))}
                                                            {skillsList.length > 2 && (
                                                                <span className="text-[10.5px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-md">
                                                                    +{skillsList.length - 2}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400 text-[12px] italic">No skills listed</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Profile Score */}
                                            <td className="py-3.5 px-4">
                                                <div className="w-[100px]">
                                                    <div className="flex items-center justify-between text-[11.5px] font-semibold mb-1">
                                                        <span className={completion >= 80 ? 'text-emerald-700' : completion >= 50 ? 'text-amber-700' : 'text-rose-700'}>
                                                            {completion}%
                                                        </span>
                                                        <span className="text-[10.5px] text-gray-400">score</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-300 ${scoreBarBg}`}
                                                            style={{ width: `${Math.max(completion, 4)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Applications Count */}
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`inline-flex items-center justify-center min-w-[28px] h-6 px-2 text-[12px] font-bold rounded-lg ${Number(cand.applications_count || 0) > 0
                                                    ? 'bg-blue-50 text-blue-700 border-1 border-blue-200/80 shadow-2xs'
                                                    : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                    {cand.applications_count || 0}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold border-1 ${isActive
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                                    : 'bg-rose-50 text-rose-700 border-rose-200/80'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                    {isActive ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>

                                            {/* Joined Date */}
                                            <td className="py-3.5 px-4">
                                                <div>
                                                    <span className="font-medium text-gray-800 block text-[12.5px]">{joinDateInfo.relative}</span>
                                                    <span className="text-gray-400 text-[11px] block">{joinDateInfo.exact}</span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 pr-6 text-right">
                                                <button
                                                    onClick={() => setSelectedCandidate(cand)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 rounded-lg text-[12px] font-medium transition-colors shadow-2xs cursor-pointer select-none"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                                        <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        No candidates found matching current filter or search criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Section Footer: View All Button UI (Navigates to Job Seekers page) */}
                <div className="p-4 sm:p-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-gray-500 bg-gray-50/40">
                    <div className="flex items-center gap-2">
                        <span>
                            Showing <span className="font-semibold text-gray-900">{candidates.length}</span> of <span className="font-semibold text-gray-900">{totalCandidates.toLocaleString()}</span> candidates
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => router.push('/admin/job-seekers')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-800 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded-xl text-[14px] font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer group active:scale-[0.99] select-none"
                    >
                        <span>View All</span>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                </div>
            </div>

            {/* ── Candidate Profile Modal ── */}
            {selectedCandidate && (
                <CandidateProfileModal
                    userId={selectedCandidate.id}
                    candidateSummary={selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                />
            )}
        </div>
    );
}
