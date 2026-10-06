'use client';
import React, { useState, useEffect } from 'react';
import {
    Briefcase, FileText, TrendingUp, TrendingDown,
    Activity, Building2, Download, FileCheck2,
    Mail, Phone, MapPin,
    Clock, ChevronRight, Building, Sparkles
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { getSuperAdminDashboardStats } from '../ApiService/action';
import { useRouter } from 'next/navigation';
import AdminSelect from './AdminSelect';

const StatCard = ({ title, value, change, isPositive, icon: Icon, color, bg }) => (
    <div className="bg-white rounded-xl shadow-xs p-4 transition-all hover:shadow-sm">
        <div className="flex items-start justify-between mb-3">
            <div className={`p-2 rounded-lg ${bg} ${color}`}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </div>
            {change && (
                <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {change}
                </div>
            )}
        </div>
        <div>
            <h4 className="text-gray-500 text-[12px] font-medium mb-0.5">{title}</h4>
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-0">{value}</h2>
        </div>
    </div>
);

// Helper for relative time
const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function Overview() {
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeFilter, setTimeFilter] = useState('This Quarter');

    // Active Tab for Recent Section: 'recruiters', 'jobs', 'activity'
    const [activeRecentTab, setActiveRecentTab] = useState('recruiters');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await getSuperAdminDashboardStats(timeFilter);
                setData(response.data?.data || response.data);
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
                setError("Failed to load dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [timeFilter]);

    const handleExport = () => {
        if (!data || !data.counts) return;

        const csvRows = [];
        csvRows.push(['Metric', 'Count']);
        csvRows.push(['Active Recruiters', data.counts.recruiters || 0]);
        csvRows.push(['Live Job Postings', data.counts.jobs || 0]);
        csvRows.push(['Total Applications', data.counts.applications || 0]);

        const csvContent = csvRows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `recruiter_dashboard_stats_${timeFilter.replace(/\s+/g, '_').toLowerCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-300 pb-8">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center mb-6">
                    <div className="space-y-2">
                        <div className="h-7 bg-gray-200 rounded-md w-56 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-80 animate-pulse"></div>
                    </div>
                    <div className="flex gap-3">
                        <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                </div>

                {/* KPI Cards Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-white rounded-xl shadow-xs p-4 h-[140px]">
                            <div className="flex justify-between items-start mb-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Area Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-xs p-4 h-[360px]">
                        <div className="h-5 bg-gray-200 rounded w-40 animate-pulse mb-6"></div>
                        <div className="w-full h-[280px] bg-gray-100 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="bg-white rounded-xl shadow-xs p-4 h-[360px] flex flex-col">
                        <div className="h-5 bg-gray-200 rounded w-36 animate-pulse mb-6"></div>
                        <div className="flex-1 flex flex-col items-center justify-center gap-6">
                            <div className="w-48 h-48 rounded-full border-[20px] border-gray-100 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Recent Section Skeleton */}
                <div className="bg-white rounded-xl shadow-xs p-5 mb-6">
                    <div className="h-6 bg-gray-200 rounded w-60 animate-pulse mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-[1400px] mx-auto w-full h-[600px] flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-100">
                    {error}
                </div>
            </div>
        );
    }

    const { counts, lists, monthlyData, distributions } = data || {};

    // Format Stat Cards
    const activeRecruiters = counts?.recruiters || 0;
    const liveJobs = counts?.jobs || 0;
    const totalApplications = counts?.applications || 0;
    const totalOpenings = (lists?.jobs || []).reduce((acc, j) => acc + (Number(j.openings) || 1), 0) || liveJobs;

    // Process Chart Data strictly for Recruiters and Jobs
    const processedMonthlyData = [];
    const allMonths = new Set([
        ...(monthlyData?.recruiters || []).map(item => item.month),
        ...(monthlyData?.jobs || []).map(item => item.month)
    ]);

    Array.from(allMonths).sort().forEach(month => {
        const rec = (monthlyData?.recruiters || []).find(item => item.month === month);
        const job = (monthlyData?.jobs || []).find(item => item.month === month);

        const dateObj = new Date(month + '-01');
        const monthName = dateObj.toLocaleString('default', { month: 'short' });
        const yearNum = dateObj.getFullYear().toString().slice(-2);

        processedMonthlyData.push({
            name: `${monthName} ${yearNum}`,
            recruiters: rec ? rec.count : 0,
            jobs: job ? job.count : 0
        });
    });

    // Parse Job Nature / Hiring Types for Donut Chart
    const getJobNatureData = () => {
        const natureCounts = {};
        (lists?.jobs || []).forEach(j => {
            const nature = j.job_nature || 'Full-time';
            natureCounts[nature] = (natureCounts[nature] || 0) + 1;
        });
        const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];
        const totalCount = Object.values(natureCounts).reduce((a, b) => a + b, 0) || 1;
        const entries = Object.entries(natureCounts);
        if (entries.length === 0) {
            return [
                { name: 'Full-time', value: 100, count: 0, color: '#10b981' }
            ];
        }
        return entries.map(([name, count], idx) => ({
            name,
            count,
            value: Math.round((count / totalCount) * 100),
            color: colors[idx % colors.length]
        }));
    };

    const jobNatureData = getJobNatureData();

    // Parse Categories for BarChart
    const getCategoryData = () => {
        if (!distributions?.categories) return [];
        const countsMap = {};
        distributions.categories.forEach(item => {
            try {
                const cats = typeof item.job_category === 'string' ? JSON.parse(item.job_category) : item.job_category;
                if (Array.isArray(cats)) {
                    cats.forEach(cat => { if (cat) countsMap[cat] = (countsMap[cat] || 0) + 1; });
                }
            } catch (e) {
                if (item.job_category) countsMap[item.job_category] = (countsMap[item.job_category] || 0) + 1;
            }
        });
        return Object.entries(countsMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    };

    // Parse Workplace stats for Donut Chart
    const getWorkplaceData = () => {
        if (!distributions?.workplace) return [];
        const colors = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];
        return distributions.workplace.map((item, idx) => ({
            name: item.workplace_type || "Unknown",
            value: item.count,
            color: colors[idx % colors.length]
        }));
    };

    // Parse Status distribution for Status Donut Chart
    const getStatusDistribution = () => {
        if (!distributions?.status) return [];
        const colors = {
            Shortlisted: "#10b981",
            Rejected: "#ef4444",
            "Mail Sent": "#0ea5e9",
            Pending: "#f59e0b",
        };
        return distributions.status.map(item => ({
            name: item.status || "Pending",
            value: item.count,
            color: colors[item.status] || "#6366f1"
        }));
    };

    // Formatted Lists for Recent Elements
    const formattedRecentJobs = (lists?.jobs || []).map(j => {
        let loc = '-';
        if (j.work_location) {
            try {
                const parsed = typeof j.work_location === 'string' ? JSON.parse(j.work_location) : j.work_location;
                loc = Array.isArray(parsed) ? parsed.join(', ') : parsed;
            } catch (e) {
                loc = j.work_location;
            }
        }
        const isClosed = j.is_closed?.data
            ? j.is_closed.data[0] === 1
            : (typeof j.is_closed === 'object' && j.is_closed !== null
                ? Boolean(j.is_closed[0])
                : Number(j.is_closed) === 1 || j.is_closed === true || j.is_closed === '1');

        const jobStatus = isClosed
            ? 'Closed'
            : (j.approval_status === 'pending' || j.approval_status === 'Pending'
                ? 'Pending Approval'
                : 'Active');

        return {
            id: j.id,
            title: j.job_title || 'Untitled Job',
            companyName: j.company_name || 'Organization',
            companyLogo: j.company_logo || null,
            workplace_type: j.workplace_type || 'On-site',
            job_nature: j.job_nature || 'Full-time',
            location: loc,
            openings: j.openings || 1,
            recruiterName: j.recruiter_name || 'Recruiter',
            recruiterEmail: j.recruiter_email || '-',
            timeRaw: j.created_at,
            timeAgo: formatTimeAgo(j.created_at),
            status: jobStatus
        };
    });

    const formattedRecentRecruiters = (lists?.recruiters || []).map(r => ({
        id: r.id,
        name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Recruiter',
        organization: r.organization || 'Company',
        email: r.email || '-',
        phone: r.phone || r.mobile || '-',
        location: r.location || '-',
        jobs_count: r.jobs_count || 0,
        profileImage: r.profile_image || null,
        timeRaw: r.created_date,
        timeAgo: formatTimeAgo(r.created_date),
        status: r.is_active ? 'Active' : 'Pending'
    }));

    // Combined Recruiter & Job Activity Stream
    const combinedActivity = [
        ...formattedRecentJobs.map(j => ({
            id: `job_${j.id}`,
            entityType: 'job',
            user: j.companyName,
            title: j.title,
            action: 'Posted a new job opening',
            target: j.title,
            company: j.companyName,
            email: j.recruiterEmail,
            phone: '-',
            timeRaw: j.timeRaw,
            timeAgo: j.timeAgo,
            status: j.status,
            profileImage: j.companyLogo,
            rawItem: j
        })),
        ...formattedRecentRecruiters.map(r => ({
            id: `rec_${r.id}`,
            entityType: 'recruiter',
            user: r.name,
            title: r.name,
            action: 'Registered as recruiter / employer',
            target: r.organization,
            company: r.organization,
            email: r.email,
            phone: r.phone,
            timeRaw: r.timeRaw,
            timeAgo: r.timeAgo,
            status: r.status,
            profileImage: r.profileImage,
            rawItem: r
        }))
    ].sort((a, b) => new Date(b.timeRaw) - new Date(a.timeRaw));

    // Filtered lists
    const q = (searchQuery || '').trim().toLowerCase();

    const filteredJobs = !q ? formattedRecentJobs : formattedRecentJobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.companyName.toLowerCase().includes(q) ||
        j.recruiterName.toLowerCase().includes(q) ||
        j.job_nature.toLowerCase().includes(q) ||
        j.workplace_type.toLowerCase().includes(q)
    );

    const filteredRecruiters = !q ? formattedRecentRecruiters : formattedRecentRecruiters.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.organization.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
    );

    const filteredActivity = !q ? combinedActivity : combinedActivity.filter(a =>
        a.user.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        a.target.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q)
    );

    return (
        <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-300 pb-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 tracking-tight mb-0"> Recruiters Dashboard Overview</h1>
                    <p className="text-[13px] text-gray-500 mt-0.5 mb-0">Monitor recruiter metrics, company onboarding, active job postings, and employer activity.</p>
                </div>
                <div className="flex items-center gap-3">
                    <AdminSelect
                        value={timeFilter}
                        onChange={(val) => setTimeFilter(val)}
                        options={[
                            { value: 'Last 7 Days', label: 'Last 7 Days' },
                            { value: 'Last 30 Days', label: 'Last 30 Days' },
                            { value: 'This Quarter', label: 'This Quarter' },
                            { value: 'This Year', label: 'This Year' },
                            { value: 'All Time', label: 'All Time' },
                        ]}
                        className="w-36"
                    />
                    <button
                        onClick={handleExport}
                        className="bg-[#3b82f6] hover:bg-blue-600 text-white px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer h-[42px]"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                <StatCard
                    title="Active Recruiters"
                    value={activeRecruiters.toLocaleString()}
                    icon={Building2}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
                <StatCard
                    title="Live Job Postings"
                    value={liveJobs.toLocaleString()}
                    icon={Briefcase}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
                <StatCard
                    title="Total Job Openings"
                    value={totalOpenings.toLocaleString()}
                    icon={FileText}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <StatCard
                    title="Total Applications"
                    value={totalApplications.toLocaleString()}
                    icon={FileCheck2}
                    color="text-rose-600"
                    bg="bg-rose-50"
                />
                <StatCard
                    title="System Health"
                    value="99.9%"
                    isPositive={true}
                    icon={Activity}
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Main Area Chart: Recruiter & Job Growth */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-xs p-4">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <h3 className="text-[15px] font-semibold text-gray-900 mb-0">Recruiter Onboarding & Job Trends</h3>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Recruiters
                            </div>
                            <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Jobs Posted
                            </div>
                        </div>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={processedMonthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRecruiters" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8f9fa" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="recruiters" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRecruiters)" />
                                <Area type="monotone" dataKey="jobs" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorJobs)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart: Hiring Nature Breakdown */}
                <div className="bg-white rounded-xl shadow-xs p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Briefcase className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-0">Hiring Nature Breakdown</h3>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        <div className="h-[200px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={jobNatureData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={95}
                                        paddingAngle={6}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {jobNatureData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name, props) => [`${value}% (${props?.payload?.count || 0} jobs)`, props?.payload?.name]}
                                        contentStyle={{ borderRadius: '8px', backgroundColor: "white", border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                                <span className="text-xl font-bold text-gray-900 leading-none">{liveJobs}</span>
                                <span className="text-[9px] text-gray-500 font-medium uppercase tracking-widest mt-0.5">Live Jobs</span>
                            </div>
                        </div>
                        <div className="w-full mt-4 space-y-2.5">
                            {jobNatureData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-[13px] text-gray-600">{item.name}</span>
                                    </div>
                                    <span className="text-[13px] font-semibold text-gray-900">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* RECENT RECRUITER & JOB ACTIVITY TABS SECTION */}
            <div className="bg-white rounded-2xl shadow-xs overflow-hidden mb-6">
                {/* Section Header with Tabs and Controls */}
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => { setActiveRecentTab('recruiters'); setSearchQuery(''); }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${activeRecentTab === 'recruiters'
                                ? 'bg-emerald-50 text-emerald-700 border-1 border-emerald-200/80 shadow-2xs'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                                }`}
                        >
                            <Building2 className="w-4 h-4 text-emerald-600" />
                            <span>Recently Registered Recruiters</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeRecentTab === 'recruiters' ? 'bg-emerald-200/70 text-emerald-800' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {formattedRecentRecruiters.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setActiveRecentTab('jobs'); setSearchQuery(''); }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${activeRecentTab === 'jobs'
                                ? 'bg-purple-50 text-purple-700 border-1 border-purple-200/80 shadow-2xs'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                                }`}
                        >
                            <Briefcase className="w-4 h-4 text-purple-600" />
                            <span>Recently Posted Jobs</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeRecentTab === 'jobs' ? 'bg-purple-200/70 text-purple-800' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {formattedRecentJobs.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setActiveRecentTab('activity'); setSearchQuery(''); }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${activeRecentTab === 'activity'
                                ? 'bg-amber-50 text-amber-800 border-1 border-amber-200/80 shadow-2xs'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                                }`}
                        >
                            <Activity className="w-4 h-4 text-amber-600" />
                            <span>Recruiter Activity Feed</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeRecentTab === 'activity' ? 'bg-amber-200/70 text-amber-900' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {combinedActivity.length}
                            </span>
                        </button>
                    </div>

                    {/* Search & View All Actions */}
                    <div className="flex items-center gap-2.5 self-end lg:self-auto w-full lg:w-auto">
                        <button
                            onClick={() => {
                                if (activeRecentTab === 'jobs') router.push('/admin/job-post');
                                else router.push('/admin/recruiters');
                            }}
                            className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                            <span>View All</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* TAB 1: RECENTLY REGISTERED RECRUITERS TABLE */}
                {activeRecentTab === 'recruiters' && (
                    <div className="overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3">Recruiter</th>
                                    <th className="px-4 py-3">Organization / Company</th>
                                    <th className="px-4 py-3">Email Address</th>
                                    <th className="px-4 py-3">Phone Number</th>
                                    <th className="px-4 py-3">Jobs Posted</th>
                                    <th className="px-4 py-3">Registered Time</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRecruiters.map((recruiter) => (
                                    <tr key={recruiter.id} className="hover:bg-gray-50/60 transition-colors group">
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    onClick={() => router.push(`/admin/recruiters/${recruiter.id}`)}
                                                    className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-100 shadow-2xs overflow-hidden cursor-pointer hover:opacity-85 transition-opacity"
                                                >
                                                    {recruiter.profileImage ? (
                                                        <img src={recruiter.profileImage} alt={recruiter.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                                    ) : (
                                                        recruiter.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <button
                                                        onClick={() => router.push(`/admin/recruiters/${recruiter.id}`)}
                                                        className="text-[13px] font-semibold text-gray-900 hover:text-emerald-600 transition-colors text-left focus:outline-none cursor-pointer"
                                                    >
                                                        {recruiter.name}
                                                    </button>
                                                    <div className="text-[11px] text-gray-400 font-normal">Recruiter ID: #{recruiter.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-800">
                                                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{recruiter.organization}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-[13px] text-gray-700">
                                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{recruiter.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-[13px] text-gray-700">
                                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{recruiter.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-purple-50 text-purple-700 rounded-full border-1 border-purple-100">
                                                {recruiter.jobs_count} job{recruiter.jobs_count === 1 ? '' : 's'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1 text-[12px] text-gray-500 font-medium">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{recruiter.timeAgo}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${recruiter.status === 'Active'
                                                ? 'bg-emerald-50 text-emerald-700 border-1 border-emerald-200/60'
                                                : 'bg-amber-50 text-amber-700 border-1 border-amber-200/60'
                                                }`}>
                                                {recruiter.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {filteredRecruiters.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-5 py-12 text-center text-gray-500 text-[13px]">
                                            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            No recruiters found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TAB 2: RECENTLY POSTED JOBS TABLE */}
                {activeRecentTab === 'jobs' && (
                    <div className="overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3">Job Details</th>
                                    <th className="px-4 py-3">Company</th>
                                    <th className="px-4 py-3">Posted By Recruiter</th>
                                    <th className="px-4 py-3">Workplace & Nature</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Posted Time</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredJobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-gray-50/60 transition-colors group">
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    onClick={() => router.push('/admin/job-post')}
                                                    className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0 border border-purple-100/80 shadow-2xs cursor-pointer hover:opacity-85 transition-opacity"
                                                >
                                                    {job.companyLogo ? (
                                                        <img src={job.companyLogo} alt={job.title} className="w-full h-full object-contain rounded-xl p-1" onError={(e) => { e.target.style.display = 'none'; }} />
                                                    ) : (
                                                        job.title.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <button
                                                        onClick={() => router.push('/admin/job-post')}
                                                        className="text-[13px] font-semibold text-gray-900 hover:text-purple-600 transition-colors text-left focus:outline-none flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <span>{job.title}</span>
                                                    </button>
                                                    <div className="text-[11px] text-gray-500 font-normal flex items-center gap-2 mt-0.5">
                                                        <span>ID: #{job.id}</span>
                                                        <span>•</span>
                                                        <span>{job.openings} opening{job.openings > 1 ? 's' : ''}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-800">
                                                <Building className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{job.companyName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div>
                                                <div className="text-[13px] font-medium text-gray-900">{job.recruiterName}</div>
                                                <div className="text-[11px] text-gray-500 truncate max-w-[180px]">{job.recruiterEmail}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <span className="px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 rounded-md border-1 border-blue-100">
                                                    {job.workplace_type}
                                                </span>
                                                <span className="px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-700 rounded-md">
                                                    {job.job_nature}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-[12px] text-gray-600 max-w-[160px] truncate">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span className="truncate">{job.location || 'Not specified'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1 text-[12px] text-gray-500 font-medium">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{job.timeAgo}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${job.status === 'Active'
                                                ? 'bg-emerald-50 text-emerald-700 border-1 border-emerald-200/60'
                                                : job.status === 'Closed'
                                                    ? 'bg-rose-50 text-rose-700 border-1 border-rose-200/60'
                                                    : 'bg-amber-50 text-amber-700 border-1 border-amber-200/60'
                                                }`}>
                                                {job.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {filteredJobs.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-5 py-12 text-center text-gray-500 text-[13px]">
                                            <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            No job postings found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TAB 3: ALL RECRUITER ACTIVITY FEED STREAM */}
                {activeRecentTab === 'activity' && (
                    <div className="overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3">Recruiter / Employer</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Action Description</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3">Organization</th>
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredActivity.map((activity) => (
                                    <tr key={activity.id} className="hover:bg-gray-50/60 transition-colors group">
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    onClick={() => {
                                                        if (activity.entityType === 'job') {
                                                            router.push('/admin/job-post');
                                                        } else {
                                                            const recId = activity.rawItem?.id || activity.id.replace('rec_', '');
                                                            router.push(`/admin/recruiters/${recId}`);
                                                        }
                                                    }}
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 border cursor-pointer hover:opacity-85 transition-opacity ${activity.entityType === 'job' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        }`}
                                                >
                                                    {activity.profileImage ? (
                                                        <img src={activity.profileImage} alt={activity.user} className="w-full h-full object-cover rounded-full" onError={(e) => { e.target.style.display = 'none'; }} />
                                                    ) : (
                                                        activity.user.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (activity.entityType === 'job') {
                                                            router.push('/admin/job-post');
                                                        } else {
                                                            const recId = activity.rawItem?.id || activity.id.replace('rec_', '');
                                                            router.push(`/admin/recruiters/${recId}`);
                                                        }
                                                    }}
                                                    className="text-[13px] font-semibold text-gray-900 hover:text-emerald-600 transition-colors focus:outline-none cursor-pointer"
                                                >
                                                    {activity.user}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${activity.entityType === 'job' ? 'bg-purple-50 text-purple-700 border-1 border-purple-200/60' :
                                                'bg-emerald-50 text-emerald-700 border-1 border-emerald-200/60'
                                                }`}>
                                                {activity.entityType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className="text-[13px] text-gray-700 font-medium">
                                                {activity.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap text-[12px] text-gray-600">
                                            {activity.email !== '-' ? activity.email : activity.phone}
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap text-[12px] text-gray-600">
                                            {activity.company !== '-' ? activity.company : activity.target}
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap text-[12px] text-gray-500 font-medium">
                                            {activity.timeAgo}
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${activity.status === 'Active' || activity.status === 'Approved' || activity.status === 'Verified'
                                                ? 'bg-emerald-50 text-emerald-700 border-1 border-emerald-200/60'
                                                : 'bg-amber-50 text-amber-700 border-1 border-amber-200/60'
                                                }`}>
                                                {activity.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {filteredActivity.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-5 py-12 text-center text-gray-500 text-[13px]">
                                            <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            No recent employer activities recorded.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Additional Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Application Statuses */}
                <div className="bg-white rounded-xl shadow-xs p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <FileCheck2 className="w-4 h-4 text-rose-500" />
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-0">Application Pipeline Statuses</h3>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        {getStatusDistribution().length > 0 ? (
                            <>
                                <div className="h-[200px] w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={getStatusDistribution()}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={85}
                                                paddingAngle={4}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {getStatusDistribution().map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => [`${value} applications`]}
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-full mt-4 space-y-2.5">
                                    {getStatusDistribution().map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-[13px] text-gray-600">{item.name}</span>
                                            </div>
                                            <span className="text-[13px] font-semibold text-gray-900">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-gray-400 text-sm py-10">No data available</div>
                        )}
                    </div>
                </div>

                {/* Top Job Categories */}
                <div className="bg-white rounded-xl shadow-xs p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Briefcase className="w-4 h-4 text-purple-500" />
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-0">Top Job Categories</h3>
                    </div>
                    <div className="flex-1">
                        {getCategoryData().length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={getCategoryData()} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8f9fa" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11 }} width={100} />
                                    <Tooltip
                                        cursor={{ fill: '#f8f9fa' }}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-400 text-sm text-center py-10">No data available</div>
                        )}
                    </div>
                </div>

                {/* Workplace Distribution */}
                <div className="bg-white rounded-xl shadow-xs p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-0">Workplace Distribution</h3>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        {getWorkplaceData().length > 0 ? (
                            <>
                                <div className="h-[200px] w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={getWorkplaceData()}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={85}
                                                paddingAngle={4}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {getWorkplaceData().map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => [`${value} jobs`]}
                                                contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="w-full mt-4 space-y-2.5">
                                    {getWorkplaceData().map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-[13px] text-gray-600">{item.name}</span>
                                            </div>
                                            <span className="text-[13px] font-semibold text-gray-900">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-gray-400 text-sm py-10">No data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Summary Cards below for rapid access */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Quick Card 1: Latest Job */}
                <div className="bg-white rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-purple-700 font-semibold text-[13px]">
                            <Briefcase className="w-4 h-4" />
                            <span>Latest Job Posted</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium">
                            {formattedRecentJobs[0]?.timeAgo || '-'}
                        </span>
                    </div>
                    {formattedRecentJobs.length > 0 ? (
                        <div
                            onClick={() => router.push('/admin/job-post')}
                            className="bg-purple-50/50 hover:bg-purple-50 p-3 rounded-lg border-1 border-purple-100/60 transition-colors cursor-pointer"
                        >
                            <h4 className="text-[13px] font-bold text-gray-900 mb-0.5 truncate">{formattedRecentJobs[0].title}</h4>
                            <p className="text-[12px] text-gray-600 mb-2 truncate">{formattedRecentJobs[0].companyName} • {formattedRecentJobs[0].workplace_type}</p>
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-gray-500">By {formattedRecentJobs[0].recruiterName}</span>
                                <span className="text-purple-700 font-medium flex items-center gap-0.5">
                                    View <ChevronRight className="w-3 h-3" />
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[12px] text-gray-400 italic">No job postings yet</p>
                    )}
                </div>

                {/* Quick Card 2: Latest Recruiter */}
                <div className="bg-white rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-emerald-700 font-semibold text-[13px]">
                            <Building2 className="w-4 h-4" />
                            <span>Latest Recruiter</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium">
                            {formattedRecentRecruiters[0]?.timeAgo || '-'}
                        </span>
                    </div>
                    {formattedRecentRecruiters.length > 0 ? (
                        <div
                            onClick={() => router.push(`/admin/recruiters/${formattedRecentRecruiters[0].id}`)}
                            className="bg-emerald-50/50 hover:bg-emerald-50 p-3 rounded-lg border-1 border-emerald-100/60 transition-colors cursor-pointer"
                        >
                            <h4 className="text-[13px] font-bold text-gray-900 mb-0.5 truncate">{formattedRecentRecruiters[0].name}</h4>
                            <p className="text-[12px] text-gray-600 mb-2 truncate">{formattedRecentRecruiters[0].organization}</p>
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-gray-500">{formattedRecentRecruiters[0].jobs_count} jobs posted</span>
                                <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                                    View <ChevronRight className="w-3 h-3" />
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[12px] text-gray-400 italic">No registered recruiters yet</p>
                    )}
                </div>

                {/* Quick Card 3: Top Employer by Postings */}
                <div className="bg-white rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-indigo-700 font-semibold text-[13px]">
                            <Sparkles className="w-4 h-4" />
                            <span>Top Recruiter by Postings</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium">
                            Active
                        </span>
                    </div>
                    {formattedRecentRecruiters.length > 0 ? (
                        (() => {
                            const topRecruiter = [...formattedRecentRecruiters].sort((a, b) => (b.jobs_count || 0) - (a.jobs_count || 0))[0];
                            return (
                                <div
                                    onClick={() => router.push(`/admin/recruiters/${topRecruiter.id}`)}
                                    className="bg-indigo-50/50 hover:bg-indigo-50 p-3 rounded-lg border-1 border-indigo-100/60 transition-colors cursor-pointer"
                                >
                                    <h4 className="text-[13px] font-bold text-gray-900 mb-0.5 truncate">{topRecruiter.organization || topRecruiter.name}</h4>
                                    <p className="text-[12px] text-gray-600 mb-2 truncate">{topRecruiter.name} • {topRecruiter.location}</p>
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-gray-500 font-semibold text-indigo-700">{topRecruiter.jobs_count} jobs posted</span>
                                        <span className="text-indigo-700 font-medium flex items-center gap-0.5">
                                            View <ChevronRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        <p className="text-[12px] text-gray-400 italic">No recruiters data available</p>
                    )}
                </div>
            </div>
        </div>
    );
}
