import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    Users, Briefcase, FileCheck, Building, TrendingUp, Download,
    CheckCircle2, Clock, Mail, XCircle, MapPin, Sparkles, ShieldCheck,
    Activity, ArrowUpRight, Layers
} from 'lucide-react';
import { getSuperAdminDashboardStats } from '../ApiService/action';
import AdminDateFilter from './AdminDateFilter';
import useAdminPermissions from './useAdminPermissions';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatCard = ({ title, value, icon: Icon, color, bg, accent, trend = null }) => (
    <div className="bg-white rounded-2xl p-4 relative overflow-hidden group shadow-xs">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${bg} opacity-50 -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-500`}></div>
        <div className="flex items-center justify-between mb-3 relative z-10">
            <div className={`p-2.5 rounded-lg ${bg} ${color} ring-1 ring-inset ${accent}`}>
                <Icon className="w-5 h-5" strokeWidth={2} />
            </div>
            {trend && (
                <div className="flex items-center text-[12px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>{trend}</span>
                </div>
            )}
        </div>
        <div className="relative z-10">
            <h4 className="text-gray-500 text-[13px] font-medium mb-1">{title}</h4>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-0">{value}</h2>
        </div>
    </div>
);

export default function AnalyticsReport() {
    const { can, isSuperAdmin } = useAdminPermissions();
    const canExport = can('analytics', 'export_analytics_data');
    const canViewGrowth = can('analytics', 'user_growth_analysis');
    const canViewJobTrends = can('analytics', 'job_moderation_trends');
    const canViewPipeline = can('analytics', 'application_pipeline');
    const canViewRecruiterConversion = can('analytics', 'recruiter_conversions');

    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState({ preset: 'All Time', startDate: '', endDate: '', label: 'All Time' });
    const [data, setData] = useState({
        summary: { totalUsers: 0, activeJobs: 0, totalApplications: 0, totalEmployers: 0 },
        userGrowth: [],
        applicationTrends: [],
        jobsByCategory: [],
        distributions: { workplace: [], status: [], categories: [] }
    });

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const timeFilter = dateFilter.preset !== 'Custom Range' && dateFilter.preset !== 'All Time' ? dateFilter.preset : undefined;
                const extraParams = {
                    start_date: dateFilter.startDate || undefined,
                    end_date: dateFilter.endDate || undefined
                };
                const response = await getSuperAdminDashboardStats(timeFilter, extraParams);

                if (response.data && response.data.data) {
                    setData(response.data.data);
                } else if (response.data) {
                    setData(response.data);
                }
            } catch (error) {
                console.error("Error fetching analytics data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [dateFilter]);

    const handleExport = () => {
        if (!data || !data.summary) return;

        const csvRows = [];
        csvRows.push(['Metric', 'Count']);
        csvRows.push(['Total Users', data.summary.totalUsers || 0]);
        csvRows.push(['Active Jobs', data.summary.activeJobs || 0]);
        csvRows.push(['Total Applications', data.summary.totalApplications || 0]);
        csvRows.push(['Total Employers', data.summary.totalEmployers || 0]);

        // Add User Growth Trends
        if (data.userGrowth && data.userGrowth.length > 0) {
            csvRows.push([]);
            csvRows.push(['User Growth Month', 'New Users']);
            data.userGrowth.forEach(item => {
                csvRows.push([item.name, item.uv]);
            });
        }

        const csvContent = csvRows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "analytics_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="w-full animate-pulse">
                {/* Header Skeleton */}
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-72"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-36"></div>
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-200"></div>
                                <div className="w-16 h-6 rounded-full bg-gray-200"></div>
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                        </div>
                    ))}
                </div>

                {/* Charts Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl">
                            <div className="flex items-center mb-6">
                                <div className="w-4 h-4 rounded-full bg-gray-200 mr-2"></div>
                                <div className="h-5 bg-gray-200 rounded w-48"></div>
                            </div>
                            <div className="h-[300px] w-full bg-gray-100 rounded-lg"></div>
                        </div>
                    ))}
                </div>

                {/* Bottom Row Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl">
                            <div className="h-5 bg-gray-200 rounded w-40 mb-6"></div>
                            <div className="h-[220px] bg-gray-100 rounded-xl"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Calculations for status pipeline
    const statusData = data?.distributions?.status || [];
    const totalAppsCount = data?.summary?.totalApplications || statusData.reduce((sum, item) => sum + (item.count || 0), 0) || 1;

    const statusConfig = {
        'Shortlisted': { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500', pillBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/70' },
        'Mail Sent': { icon: Mail, color: 'text-sky-600', bg: 'bg-sky-500', pillBg: 'bg-sky-50 text-sky-700 border-sky-200/70' },
        'Pending': { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500', pillBg: 'bg-amber-50 text-amber-700 border-amber-200/70' },
        'Rejected': { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-500', pillBg: 'bg-rose-50 text-rose-700 border-rose-200/70' },
    };

    // Calculations for workplace distribution
    const workplaceData = data?.distributions?.workplace || [];
    const totalWorkplaceCount = workplaceData.reduce((sum, item) => sum + (item.count || 0), 0) || 1;
    const workplaceColors = {
        'On-site': { bg: 'bg-purple-500', text: 'text-purple-700', pill: 'bg-purple-50 border-purple-100' },
        'Remote': { bg: 'bg-blue-500', text: 'text-blue-700', pill: 'bg-blue-50 border-blue-100' },
        'Hybrid': { bg: 'bg-emerald-500', text: 'text-emerald-700', pill: 'bg-emerald-50 border-emerald-100' },
    };

    // Platform KPI Highlights
    const totalJobs = data?.summary?.activeJobs || 1;
    const appsPerJob = ((data?.summary?.totalApplications || 0) / totalJobs).toFixed(1);
    const candidateToRecruiterRatio = (data?.summary?.totalEmployers || 0) > 0
        ? Math.round((data?.summary?.totalUsers || 0) / (data?.summary?.totalEmployers || 1))
        : (data?.summary?.totalUsers || 0);

    return (
        <div className="w-full animate-in fade-in duration-500 pb-8">
            {/* Page Header */}
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-0">Platform Analytics</h1>
                    <p className="text-gray-500 text-[14px] mt-1 mb-0">Comprehensive overview of platform growth and activity.</p>
                </div>
                <div className="flex items-center gap-3">
                    <AdminDateFilter
                        value={dateFilter}
                        onChange={(newFilter) => setDateFilter(newFilter)}
                        presets={['All Time', 'Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month', 'This Quarter', 'This Year']}
                    />
                    {canExport && (
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 px-4 py-2.5 rounded-xl font-medium text-[13px] transition-colors shadow-xs cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            Download Report
                        </button>
                    )}
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Users"
                    value={data.summary.totalUsers.toLocaleString()}
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    accent="ring-blue-100"
                />
                <StatCard
                    title="Active Jobs"
                    value={data.summary.activeJobs.toLocaleString()}
                    icon={Briefcase}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                    accent="ring-emerald-100"
                />
                <StatCard
                    title="Total Applications"
                    value={data.summary.totalApplications.toLocaleString()}
                    icon={FileCheck}
                    color="text-amber-600"
                    bg="bg-amber-50"
                    accent="ring-amber-100"
                />
                <StatCard
                    title="Total Employers"
                    value={data.summary.totalEmployers.toLocaleString()}
                    icon={Building}
                    color="text-purple-600"
                    bg="bg-purple-50"
                    accent="ring-purple-100"
                />
            </div>

            {/* Charts Row */}
            {(canViewGrowth || canViewJobTrends) && (
                <div className={`grid grid-cols-1 ${canViewGrowth && canViewJobTrends ? 'lg:grid-cols-2' : ''} gap-6 mb-6`}>
                    {/* User Growth Line Chart */}
                    {canViewGrowth && (
                        <div className="bg-white p-6 rounded-2xl shadow-xs">
                            <h3 className="text-[15px] font-semibold text-gray-900 mb-6 flex items-center">
                                <Users className="w-4 h-4 mr-2 text-blue-500" />
                                User Registration Trends
                            </h3>
                            <div className="h-[300px] w-full">
                                {data.userGrowth.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={data.userGrowth}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Line type="monotone" dataKey="uv" name="New Users" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">No user growth data available</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Applications Bar Chart */}
                    {canViewJobTrends && (
                        <div className="bg-white p-6 rounded-2xl shadow-xs">
                            <h3 className="text-[15px] font-semibold text-gray-900 mb-6 flex items-center">
                                <FileCheck className="w-4 h-4 mr-2 text-amber-500" />
                                Applications Received
                            </h3>
                            <div className="h-[300px] w-full">
                                {data.applicationTrends.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.applicationTrends}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                                            <RechartsTooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="pv" name="Applications" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">No application data available</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Grid (Full Width & Rich Analytics) */}
            {(canViewJobTrends || canViewPipeline || canViewRecruiterConversion) && (
                <div className={`grid grid-cols-1 ${[canViewJobTrends, canViewPipeline, canViewRecruiterConversion].filter(Boolean).length === 2 ? 'lg:grid-cols-2' : [canViewJobTrends, canViewPipeline, canViewRecruiterConversion].filter(Boolean).length === 3 ? 'lg:grid-cols-3' : ''} gap-6`}>
                    {/* Card 1: Jobs by Nature Pie Chart */}
                    {canViewJobTrends && (
                        <div className="bg-white p-6 rounded-2xl shadow-xs flex flex-col">
                            <h3 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center">
                                <Briefcase className="w-4 h-4 mr-2 text-purple-500" />
                                Jobs by Nature
                            </h3>
                            <div className="h-[250px] w-full flex items-center justify-center flex-1">
                                {data.jobsByCategory.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.jobsByCategory}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {data.jobsByCategory.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend
                                                layout="horizontal"
                                                verticalAlign="bottom"
                                                align="center"
                                                iconType="circle"
                                                wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-gray-400 text-sm">No job distribution data</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Card 2: Application Pipeline & Conversion Breakdown */}
                    {canViewPipeline && (
                        <div className="bg-white p-6 rounded-2xl shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[15px] font-semibold text-gray-900 mb-0 flex items-center">
                                        <FileCheck className="w-4 h-4 mr-2 text-emerald-500" />
                                        Application Pipeline
                                    </h3>
                                    <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {data?.summary?.totalApplications?.toLocaleString() || 0} Total
                                    </span>
                                </div>

                                {statusData.length > 0 ? (
                                    <div className="space-y-3.5 mt-2">
                                        {statusData.map((item, idx) => {
                                            const percent = Math.round(((item.count || 0) / totalAppsCount) * 100);
                                            const cfg = statusConfig[item.status] || { icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-500', pillBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/70' };
                                            const IconComponent = cfg.icon;

                                            return (
                                                <div key={idx} className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-[12px]">
                                                        <div className="flex items-center gap-1.5 font-medium text-gray-800">
                                                            <IconComponent className={`w-3.5 h-3.5 ${cfg.color}`} />
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
                                    <div className="text-gray-400 text-sm py-12 text-center">No application status data</div>
                                )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                                <span>Shortlist Conversion Rate</span>
                                <span className="font-bold text-emerald-600">
                                    {totalAppsCount > 0 && statusData.find(s => s.status === 'Shortlisted')
                                        ? `${Math.round(((statusData.find(s => s.status === 'Shortlisted')?.count || 0) / totalAppsCount) * 100)}%`
                                        : '0%'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Card 3: Workplace Types & Platform Highlights */}
                    {canViewRecruiterConversion && (
                        <div className="bg-white p-6 rounded-2xl shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[15px] font-semibold text-gray-900 mb-0 flex items-center">
                                        <Building className="w-4 h-4 mr-2 text-blue-500" />
                                        Workplace & Platform Health
                                    </h3>
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        99.9% Uptime
                                    </span>
                                </div>

                                {/* Workplace Breakdown Bars */}
                                <div className="space-y-3 mb-5 mt-2">
                                    {workplaceData.map((item, idx) => {
                                        const percent = Math.round(((item.count || 0) / totalWorkplaceCount) * 100);
                                        const cfg = workplaceColors[item.workplace_type] || { bg: 'bg-indigo-500', text: 'text-indigo-700', pill: 'bg-indigo-50 border-indigo-100' };

                                        return (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex items-center justify-between text-[12px]">
                                                    <span className="font-medium text-gray-700">{item.workplace_type || 'Other'}</span>
                                                    <span className="font-semibold text-gray-900">{item.count} jobs ({percent}%)</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${cfg.bg}`}
                                                        style={{ width: `${Math.max(percent, 4)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Key Metric Highlights Grid */}
                            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-gray-100">
                                <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                                    <span className="text-[11px] font-medium text-gray-500 block">Avg Apps / Job</span>
                                    <span className="text-base font-bold text-gray-900 mt-0.5 block">{appsPerJob}</span>
                                </div>
                                <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                                    <span className="text-[11px] font-medium text-gray-500 block">Candidates / Recruiter</span>
                                    <span className="text-base font-bold text-gray-900 mt-0.5 block">{candidateToRecruiterRatio}:1</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
