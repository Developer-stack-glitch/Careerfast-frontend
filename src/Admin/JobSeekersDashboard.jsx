'use client';
import React, { useState, useEffect } from 'react';
import {
    Users, Briefcase, TrendingUp, TrendingDown,
    Activity, Building2, Download, FileCheck2, UserCheck,
    Mail, Phone, MapPin, Search,
    Clock, ChevronRight, Building, Sparkles, GraduationCap
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

export default function JobSeekersDashboard() {
    const router = useRouter();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeFilter, setTimeFilter] = useState('This Quarter');

    // Active Tab for Recent Section: 'candidates', 'applications', 'activity'
    const [activeRecentTab, setActiveRecentTab] = useState('candidates');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await getSuperAdminDashboardStats(timeFilter);
                setData(response.data?.data || response.data);
            } catch (err) {
                console.error("Failed to fetch job seekers dashboard stats", err);
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
        csvRows.push(['Total Job Seekers', data.counts.candidates || 0]);
        csvRows.push(['Total Applications', data.counts.applications || 0]);
        csvRows.push(['Available Live Jobs', data.counts.jobs || 0]);
        csvRows.push(['Active Recruiters', data.counts.recruiters || 0]);

        const csvContent = csvRows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `job_seekers_dashboard_stats_${timeFilter.replace(/\s+/g, '_').toLowerCase()}.csv`);
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
                        <div className="h-7 bg-gray-200 rounded-md w-60 animate-pulse"></div>
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

    // Format Stat Cards for Job Seekers / Candidates
    const totalCandidates = counts?.candidates || 0;
    const totalApplications = counts?.applications || 0;
    const totalJobs = counts?.jobs || 0;
    const activeCandidates = (lists?.candidates || []).filter(c => c.is_active).length || totalCandidates;

    // Process Monthly Growth Data for Candidates & Applications
    const processedMonthlyData = [];
    const allMonths = new Set([
        ...(monthlyData?.candidates || []).map(item => item.month),
        ...(monthlyData?.applications || []).map(item => item.month)
    ]);

    Array.from(allMonths).sort().forEach(month => {
        const can = (monthlyData?.candidates || []).find(item => item.month === month);
        const app = (monthlyData?.applications || []).find(item => item.month === month);

        const dateObj = new Date(month + '-01');
        const monthName = dateObj.toLocaleString('default', { month: 'short' });
        const yearNum = dateObj.getFullYear().toString().slice(-2);

        processedMonthlyData.push({
            name: `${monthName} ${yearNum}`,
            candidates: can ? can.count : 0,
            applications: app ? app.count : 0
        });
    });

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

    const statusDistribution = getStatusDistribution();
    const totalStatusCount = statusDistribution.reduce((acc, curr) => acc + curr.value, 0) || totalApplications;

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

    // Formatted Lists for Recent Candidates
    const formattedRecentCandidates = (lists?.candidates || []).map(c => ({
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Candidate',
        email: c.email || '-',
        phone: c.phone || c.mobile || '-',
        location: c.location || 'Not Specified',
        profileImage: c.profile_image || null,
        timeRaw: c.created_date,
        timeAgo: formatTimeAgo(c.created_date),
        status: c.is_active ? 'Active' : 'Pending'
    }));

    // Formatted Lists for Recent Applications
    const formattedRecentApplications = (lists?.applications || []).map(a => ({
        id: a.applied_jobs_id,
        candidateName: `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'Applicant',
        email: a.email || '-',
        jobTitle: a.job_title || 'Applied Position',
        companyName: a.company_name || 'Organization',
        status: a.status || 'Pending',
        timeRaw: a.created_at,
        timeAgo: formatTimeAgo(a.created_at)
    }));

    // Combined Candidate Activity Stream
    const combinedActivity = [
        ...formattedRecentCandidates.map(c => ({
            id: `can_${c.id}`,
            entityType: 'candidate',
            user: c.name,
            title: c.name,
            action: 'Registered as a new candidate',
            target: c.location,
            email: c.email,
            phone: c.phone,
            timeRaw: c.timeRaw,
            timeAgo: c.timeAgo,
            status: c.status,
            profileImage: c.profileImage,
            rawItem: c
        })),
        ...formattedRecentApplications.map(a => ({
            id: `app_${a.id}`,
            entityType: 'application',
            user: a.candidateName,
            title: a.jobTitle,
            action: `Applied for ${a.jobTitle}`,
            target: a.companyName,
            email: a.email,
            phone: '-',
            timeRaw: a.timeRaw,
            timeAgo: a.timeAgo,
            status: a.status,
            profileImage: null,
            rawItem: a
        }))
    ].sort((a, b) => new Date(b.timeRaw) - new Date(a.timeRaw));

    // Filtered lists based on search
    const q = (searchQuery || '').trim().toLowerCase();

    const filteredCandidates = !q ? formattedRecentCandidates : formattedRecentCandidates.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
    );

    const filteredApplications = !q ? formattedRecentApplications : formattedRecentApplications.filter(a =>
        a.candidateName.toLowerCase().includes(q) ||
        a.jobTitle.toLowerCase().includes(q) ||
        a.companyName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
    );

    const filteredActivity = !q ? combinedActivity : combinedActivity.filter(act =>
        act.user.toLowerCase().includes(q) ||
        act.action.toLowerCase().includes(q) ||
        act.target.toLowerCase().includes(q) ||
        act.email.toLowerCase().includes(q)
    );

    return (
        <div className="max-w-[1400px] mx-auto w-full animate-in fade-in duration-300 pb-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 tracking-tight mb-0">Job Seekers Dashboard Overview</h1>
                    <p className="text-[13px] text-gray-500 mt-0.5 mb-0">Monitor candidate registrations, talent pool growth, job application velocity, and career engagements.</p>
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
                    title="Total Job Seekers"
                    value={totalCandidates.toLocaleString()}
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <StatCard
                    title="Total Applications"
                    value={totalApplications.toLocaleString()}
                    icon={FileCheck2}
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
                <StatCard
                    title="Active Talent Pool"
                    value={activeCandidates.toLocaleString()}
                    icon={UserCheck}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
                <StatCard
                    title="Live Job Openings"
                    value={totalJobs.toLocaleString()}
                    icon={Briefcase}
                    color="text-amber-600"
                    bg="bg-amber-50"
                />
                <StatCard
                    title="Talent Engagement"
                    value="99.9%"
                    isPositive={true}
                    icon={Activity}
                    color="text-sky-600"
                    bg="bg-sky-50"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Main Area Chart: Candidates & Applications Growth */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-xs p-4">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            <h3 className="text-[15px] font-semibold text-gray-900 mb-0">Candidate Sign-ups & Application Trends</h3>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Job Seekers
                            </div>
                            <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Applications
                            </div>
                        </div>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={processedMonthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCandidates" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8f9fa" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="candidates" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCandidates)" />
                                <Area type="monotone" dataKey="applications" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorApplications)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart: Application Pipeline Status Breakdown */}
                <div className="bg-white rounded-xl shadow-xs p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <FileCheck2 className="w-4 h-4 text-purple-500" />
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-0">Application Pipeline Statuses</h3>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        {statusDistribution.length > 0 ? (
                            <>
                                <div className="h-[200px] w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={statusDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={95}
                                                paddingAngle={6}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {statusDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value) => [`${value} applications`]}
                                                contentStyle={{ borderRadius: '8px', backgroundColor: "white", border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                                        <span className="text-xl font-bold text-gray-900 leading-none">{totalStatusCount}</span>
                                        <span className="text-[9px] text-gray-500 font-medium uppercase tracking-widest mt-0.5">Applications</span>
                                    </div>
                                </div>
                                <div className="w-full mt-4 space-y-2.5">
                                    {statusDistribution.map((item, index) => (
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
                            <div className="text-gray-400 text-sm py-10">No application data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* RECENT CANDIDATES & APPLICATION ACTIVITY TABS SECTION */}
            <div className="bg-white rounded-2xl shadow-xs overflow-hidden mb-6">
                {/* Section Header with Tabs and Controls */}
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => { setActiveRecentTab('candidates'); setSearchQuery(''); }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${activeRecentTab === 'candidates'
                                ? 'bg-blue-50 text-blue-700 border-1 border-blue-200/80 shadow-2xs'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                                }`}
                        >
                            <Users className="w-4 h-4 text-blue-600" />
                            <span>Recently Registered Candidates</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeRecentTab === 'candidates' ? 'bg-blue-200/70 text-blue-800' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {formattedRecentCandidates.length}
                            </span>
                        </button>

                        <button
                            onClick={() => { setActiveRecentTab('applications'); setSearchQuery(''); }}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${activeRecentTab === 'applications'
                                ? 'bg-purple-50 text-purple-700 border-1 border-purple-200/80 shadow-2xs'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                                }`}
                        >
                            <FileCheck2 className="w-4 h-4 text-purple-600" />
                            <span>Recent Job Applications</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeRecentTab === 'applications' ? 'bg-purple-200/70 text-purple-800' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {formattedRecentApplications.length}
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
                            <span>Candidate Activity Feed</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${activeRecentTab === 'activity' ? 'bg-amber-200/70 text-amber-900' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {combinedActivity.length}
                            </span>
                        </button>
                    </div>

                    {/* Search & View All Actions */}
                    <div className="flex items-center gap-2.5 self-end lg:self-auto w-full lg:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder={`Search ${activeRecentTab}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                        <button
                            onClick={() => {
                                if (activeRecentTab === 'applications') router.push('/admin/applications');
                                else router.push('/admin/job-seekers');
                            }}
                            className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                            <span>View All</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* TAB 1: RECENTLY REGISTERED CANDIDATES TABLE */}
                {activeRecentTab === 'candidates' && (
                    <div className="overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3">Candidate</th>
                                    <th className="px-4 py-3">Email Address</th>
                                    <th className="px-4 py-3">Phone Number</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Registered Time</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredCandidates.map((candidate) => (
                                    <tr key={candidate.id} className="hover:bg-gray-50/60 transition-colors group">
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    onClick={() => router.push('/admin/job-seekers')}
                                                    className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100 shadow-2xs overflow-hidden cursor-pointer hover:opacity-85 transition-opacity"
                                                >
                                                    {candidate.profileImage ? (
                                                        <img src={candidate.profileImage} alt={candidate.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                                    ) : (
                                                        candidate.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <button
                                                        onClick={() => router.push('/admin/job-seekers')}
                                                        className="text-[13px] font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left focus:outline-none cursor-pointer"
                                                    >
                                                        {candidate.name}
                                                    </button>
                                                    <div className="text-[11px] text-gray-400 font-normal">Candidate ID: #{candidate.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-[13px] text-gray-700">
                                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{candidate.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-[13px] text-gray-700">
                                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{candidate.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span>{candidate.location}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1 text-[12px] text-gray-500 font-medium">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{candidate.timeAgo}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${candidate.status === 'Active'
                                                ? 'bg-emerald-50 text-emerald-700 border-1 border-emerald-200/60'
                                                : 'bg-amber-50 text-amber-700 border-1 border-amber-200/60'
                                                }`}>
                                                {candidate.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => router.push('/admin/job-seekers')}
                                                className="text-[12px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                                            >
                                                View Profile
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {filteredCandidates.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-5 py-12 text-center text-gray-500 text-[13px]">
                                            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            No candidates found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TAB 2: RECENT JOB APPLICATIONS TABLE */}
                {activeRecentTab === 'applications' && (
                    <div className="overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3">Applicant Name</th>
                                    <th className="px-4 py-3">Applied Job Position</th>
                                    <th className="px-4 py-3">Company</th>
                                    <th className="px-4 py-3">Email Address</th>
                                    <th className="px-4 py-3">Applied Time</th>
                                    <th className="px-4 py-3">Application Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredApplications.map((app) => (
                                    <tr key={app.id} className="hover:bg-gray-50/60 transition-colors group">
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    onClick={() => router.push('/admin/applications')}
                                                    className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0 border border-purple-100 shadow-2xs cursor-pointer hover:opacity-85 transition-opacity"
                                                >
                                                    {app.candidateName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <button
                                                        onClick={() => router.push('/admin/applications')}
                                                        className="text-[13px] font-semibold text-gray-900 hover:text-purple-600 transition-colors text-left focus:outline-none cursor-pointer"
                                                    >
                                                        {app.candidateName}
                                                    </button>
                                                    <div className="text-[11px] text-gray-400 font-normal">App ID: #{app.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="text-[13px] font-medium text-gray-900">{app.jobTitle}</div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-800">
                                                <Building className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{app.companyName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{app.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1 text-[12px] text-gray-500 font-medium">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{app.timeAgo}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${app.status === 'Shortlisted' || app.status === 'Selected'
                                                ? 'bg-emerald-50 text-emerald-700 border-1 border-emerald-200/60'
                                                : app.status === 'Rejected'
                                                    ? 'bg-rose-50 text-rose-700 border-1 border-rose-200/60'
                                                    : app.status === 'Mail Sent'
                                                        ? 'bg-blue-50 text-blue-700 border-1 border-blue-200/60'
                                                        : 'bg-amber-50 text-amber-700 border-1 border-amber-200/60'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => router.push('/admin/applications')}
                                                className="text-[12px] font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                                            >
                                                View App
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {filteredApplications.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-5 py-12 text-center text-gray-500 text-[13px]">
                                            <FileCheck2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            No job applications found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TAB 3: CANDIDATE ACTIVITY FEED STREAM */}
                {activeRecentTab === 'activity' && (
                    <div className="overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-4 py-3">Candidate / Talent</th>
                                    <th className="px-4 py-3">Event Type</th>
                                    <th className="px-4 py-3">Activity Summary</th>
                                    <th className="px-4 py-3">Target Details</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredActivity.map((act) => (
                                    <tr key={act.id} className="hover:bg-gray-50/60 transition-colors group">
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    onClick={() => router.push(act.entityType === 'application' ? '/admin/applications' : '/admin/job-seekers')}
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 border cursor-pointer hover:opacity-85 transition-opacity ${act.entityType === 'application' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                        'bg-blue-50 text-blue-600 border-blue-100'
                                                        }`}
                                                >
                                                    {act.profileImage ? (
                                                        <img src={act.profileImage} alt={act.user} className="w-full h-full object-cover rounded-full" onError={(e) => { e.target.style.display = 'none'; }} />
                                                    ) : (
                                                        act.user.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => router.push(act.entityType === 'application' ? '/admin/applications' : '/admin/job-seekers')}
                                                    className="text-[13px] font-semibold text-gray-900 hover:text-blue-600 transition-colors focus:outline-none cursor-pointer"
                                                >
                                                    {act.user}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${act.entityType === 'application' ? 'bg-purple-50 text-purple-700 border-1 border-purple-200/60' :
                                                'bg-blue-50 text-blue-700 border-1 border-blue-200/60'
                                                }`}>
                                                {act.entityType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className="text-[13px] text-gray-700 font-medium">
                                                {act.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap text-[12px] text-gray-600">
                                            {act.target}
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap text-[12px] text-gray-600">
                                            {act.email !== '-' ? act.email : act.phone}
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap text-[12px] text-gray-500 font-medium">
                                            {act.timeAgo}
                                        </td>
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${act.status === 'Active' || act.status === 'Shortlisted' || act.status === 'Selected'
                                                ? 'bg-emerald-50 text-emerald-700 border-1 border-emerald-200/60'
                                                : act.status === 'Rejected'
                                                    ? 'bg-rose-50 text-rose-700 border-1 border-rose-200/60'
                                                    : 'bg-amber-50 text-amber-700 border-1 border-amber-200/60'
                                                }`}>
                                                {act.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {filteredActivity.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-5 py-12 text-center text-gray-500 text-[13px]">
                                            <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            No recent candidate activities recorded.
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
                {/* Workplace Preferences */}
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

                {/* Top Job Categories of Interest */}
                <div className="bg-white rounded-xl shadow-xs p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Briefcase className="w-4 h-4 text-purple-500" />
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-0">Top Candidate Interests</h3>
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

                {/* Candidate Talent Quality & Readiness */}
                <div className="bg-white rounded-xl shadow-xs p-4 flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <GraduationCap className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-[15px] font-semibold text-gray-900 mb-0">Talent Readiness Metrics</h3>
                    </div>
                    <div className="flex-1 flex flex-col justify-center space-y-4">
                        <div>
                            <div className="flex justify-between text-[12px] font-semibold mb-1">
                                <span className="text-gray-700">Profile Completion Rate</span>
                                <span className="text-blue-600 font-bold">88.4%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '88.4%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-[12px] font-semibold mb-1">
                                <span className="text-gray-700">Resume Upload Rate</span>
                                <span className="text-purple-600 font-bold">79.2%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '79.2%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-[12px] font-semibold mb-1">
                                <span className="text-gray-700">Application Response Velocity</span>
                                <span className="text-emerald-600 font-bold">94.8%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '94.8%' }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-[12px] font-semibold mb-1">
                                <span className="text-gray-700">Active Job Seeker Retention</span>
                                <span className="text-amber-600 font-bold">82.6%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '82.6%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Summary Cards below for rapid access */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Quick Card 1: Latest Job Seeker */}
                <div className="bg-white rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-blue-700 font-semibold text-[13px]">
                            <Users className="w-4 h-4" />
                            <span>Latest Registered Candidate</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium">
                            {formattedRecentCandidates[0]?.timeAgo || '-'}
                        </span>
                    </div>
                    {formattedRecentCandidates.length > 0 ? (
                        <div
                            onClick={() => router.push('/admin/job-seekers')}
                            className="bg-blue-50/50 hover:bg-blue-50 p-3 rounded-lg border-1 border-blue-100/60 transition-colors cursor-pointer"
                        >
                            <h4 className="text-[13px] font-bold text-gray-900 mb-0.5 truncate">{formattedRecentCandidates[0].name}</h4>
                            <p className="text-[12px] text-gray-600 mb-2 truncate">{formattedRecentCandidates[0].email} • {formattedRecentCandidates[0].location}</p>
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-gray-500">Candidate ID: #{formattedRecentCandidates[0].id}</span>
                                <span className="text-blue-700 font-medium flex items-center gap-0.5">
                                    View Talent <ChevronRight className="w-3 h-3" />
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[12px] text-gray-400 italic">No candidates registered yet</p>
                    )}
                </div>

                {/* Quick Card 2: Latest Job Application */}
                <div className="bg-white rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-purple-700 font-semibold text-[13px]">
                            <FileCheck2 className="w-4 h-4" />
                            <span>Latest Job Application</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium">
                            {formattedRecentApplications[0]?.timeAgo || '-'}
                        </span>
                    </div>
                    {formattedRecentApplications.length > 0 ? (
                        <div
                            onClick={() => router.push('/admin/applications')}
                            className="bg-purple-50/50 hover:bg-purple-50 p-3 rounded-lg border-1 border-purple-100/60 transition-colors cursor-pointer"
                        >
                            <h4 className="text-[13px] font-bold text-gray-900 mb-0.5 truncate">{formattedRecentApplications[0].candidateName}</h4>
                            <p className="text-[12px] text-gray-600 mb-2 truncate">{formattedRecentApplications[0].jobTitle} at {formattedRecentApplications[0].companyName}</p>
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="text-gray-500">Status: {formattedRecentApplications[0].status}</span>
                                <span className="text-purple-700 font-medium flex items-center gap-0.5">
                                    View App <ChevronRight className="w-3 h-3" />
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-[12px] text-gray-400 italic">No applications received yet</p>
                    )}
                </div>

                {/* Quick Card 3: Top Recent Candidate */}
                <div className="bg-white rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-indigo-700 font-semibold text-[13px]">
                            <Sparkles className="w-4 h-4" />
                            <span>Talent Directory Quick Link</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium">
                            Active Pool
                        </span>
                    </div>
                    <div
                        onClick={() => router.push('/admin/job-seekers')}
                        className="bg-indigo-50/50 hover:bg-indigo-50 p-3 rounded-lg border-1 border-indigo-100/60 transition-colors cursor-pointer"
                    >
                        <h4 className="text-[13px] font-bold text-gray-900 mb-0.5 truncate">Explore Complete Talent Pool</h4>
                        <p className="text-[12px] text-gray-600 mb-2 truncate">Filter by skills, location, experience & status</p>
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-indigo-700 font-semibold">{totalCandidates} Candidates Registered</span>
                            <span className="text-indigo-700 font-medium flex items-center gap-0.5">
                                Open Talent Pool <ChevronRight className="w-3 h-3" />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
