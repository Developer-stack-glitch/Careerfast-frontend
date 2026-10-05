import React from 'react';

/**
 * Modern Skeleton Primitives with smooth shimmer animation
 */
export const SkeletonShimmer = ({ className = '' }) => (
    <div className={`animate-pulse bg-slate-200/80 rounded ${className}`} />
);

/**
 * 1. Admin Dashboard / Overview Skeleton
 */
export function AdminDashboardSkeleton() {
    return (
        <div className="w-full max-w-[1600px] mx-auto animate-in fade-in duration-300 space-y-6">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                    <SkeletonShimmer className="h-7 w-48 rounded-lg" />
                    <SkeletonShimmer className="h-4 w-72 rounded-md" />
                </div>
                <div className="flex items-center gap-3">
                    <SkeletonShimmer className="h-10 w-36 rounded-xl" />
                    <SkeletonShimmer className="h-10 w-28 rounded-xl" />
                </div>
            </div>

            {/* KPI Stat Cards Skeleton (5 cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
                        <div className="flex justify-between items-start">
                            <SkeletonShimmer className="w-9 h-9 rounded-xl" />
                            <SkeletonShimmer className="w-12 h-5 rounded-full" />
                        </div>
                        <div className="space-y-1.5 pt-1">
                            <SkeletonShimmer className="h-3.5 w-24 rounded" />
                            <SkeletonShimmer className="h-6 w-16 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Charts Row Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                        <div className="space-y-1">
                            <SkeletonShimmer className="h-5 w-44 rounded-md" />
                            <SkeletonShimmer className="h-3 w-60 rounded" />
                        </div>
                        <SkeletonShimmer className="h-8 w-24 rounded-lg" />
                    </div>
                    <div className="h-[260px] w-full flex items-end gap-3 pt-6 px-2">
                        {[40, 65, 30, 85, 55, 90, 70, 45, 80, 60, 95, 75].map((height, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                <SkeletonShimmer
                                    className="w-full rounded-t-md"
                                    style={{ height: `${height}%` }}
                                />
                                <SkeletonShimmer className="h-2.5 w-6 rounded" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4 flex flex-col justify-between">
                    <div>
                        <SkeletonShimmer className="h-5 w-36 rounded-md mb-1" />
                        <SkeletonShimmer className="h-3 w-48 rounded mb-6" />
                        <div className="flex items-center justify-center my-4">
                            <div className="w-40 h-40 rounded-full border-12 border-slate-100 flex items-center justify-center animate-pulse">
                                <SkeletonShimmer className="w-16 h-16 rounded-full" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-50">
                        <div className="flex justify-between items-center">
                            <SkeletonShimmer className="h-3.5 w-24 rounded" />
                            <SkeletonShimmer className="h-3.5 w-12 rounded" />
                        </div>
                        <div className="flex justify-between items-center">
                            <SkeletonShimmer className="h-3.5 w-28 rounded" />
                            <SkeletonShimmer className="h-3.5 w-10 rounded" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Table Skeleton */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <SkeletonShimmer className="h-5 w-40 rounded-md" />
                    <SkeletonShimmer className="h-8 w-24 rounded-lg" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                            <div className="flex items-center gap-3.5">
                                <SkeletonShimmer className="w-10 h-10 rounded-full" />
                                <div className="space-y-1.5">
                                    <SkeletonShimmer className="h-4 w-36 rounded" />
                                    <SkeletonShimmer className="h-3 w-28 rounded" />
                                </div>
                            </div>
                            <SkeletonShimmer className="h-6 w-20 rounded-full" />
                            <SkeletonShimmer className="h-4 w-28 rounded" />
                            <SkeletonShimmer className="h-8 w-8 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * 2. Admin Table / Listing Page Skeleton (Candidates, Recruiters, Pending Jobs, Applications, etc.)
 */
export function AdminTableSkeleton({
    title = 'Loading Data...',
    subtitle = 'Please wait while we retrieve platform records.',
    showTabs = true,
    rowsCount = 6
}) {
    return (
        <div className="w-full max-w-[1600px] mx-auto animate-in fade-in duration-300 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1.5">
                    <SkeletonShimmer className="h-7 w-48 rounded-lg" />
                    <SkeletonShimmer className="h-4 w-72 rounded-md" />
                </div>
                <div className="flex items-center gap-3">
                    <SkeletonShimmer className="h-10 w-32 rounded-xl" />
                </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {showTabs ? (
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                        <SkeletonShimmer className="h-10 w-32 rounded-xl" />
                        <SkeletonShimmer className="h-10 w-28 rounded-xl" />
                        <SkeletonShimmer className="h-10 w-28 rounded-xl" />
                    </div>
                ) : (
                    <div />
                )}
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <SkeletonShimmer className="h-10 w-44 rounded-xl" />
                    <SkeletonShimmer className="h-10 w-full sm:w-64 rounded-xl" />
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-8 w-full">
                        <SkeletonShimmer className="h-3.5 w-28 rounded" />
                        <SkeletonShimmer className="h-3.5 w-36 rounded" />
                        <SkeletonShimmer className="h-3.5 w-24 rounded" />
                        <SkeletonShimmer className="h-3.5 w-28 rounded" />
                        <SkeletonShimmer className="h-3.5 w-16 rounded ml-auto" />
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {Array.from({ length: rowsCount }).map((_, i) => (
                        <div key={i} className="p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5 w-1/3 min-w-[200px]">
                                <SkeletonShimmer className="w-10 h-10 rounded-full shrink-0" />
                                <div className="space-y-1.5 w-full">
                                    <SkeletonShimmer className="h-4 w-3/4 rounded" />
                                    <SkeletonShimmer className="h-3 w-1/2 rounded" />
                                </div>
                            </div>
                            <div className="space-y-1.5 w-1/4 hidden md:block">
                                <SkeletonShimmer className="h-4 w-4/5 rounded" />
                                <SkeletonShimmer className="h-3 w-3/5 rounded" />
                            </div>
                            <div className="w-24">
                                <SkeletonShimmer className="h-6 w-20 rounded-full" />
                            </div>
                            <div className="space-y-1 w-28 hidden sm:block">
                                <SkeletonShimmer className="h-3.5 w-24 rounded" />
                                <SkeletonShimmer className="h-2.5 w-16 rounded" />
                            </div>
                            <div className="flex items-center gap-2">
                                <SkeletonShimmer className="w-8 h-8 rounded-lg" />
                                <SkeletonShimmer className="w-8 h-8 rounded-lg" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination Skeleton */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <SkeletonShimmer className="h-4 w-36 rounded" />
                    <div className="flex items-center gap-2">
                        <SkeletonShimmer className="h-8 w-8 rounded-lg" />
                        <SkeletonShimmer className="h-8 w-8 rounded-lg" />
                        <SkeletonShimmer className="h-8 w-8 rounded-lg" />
                        <SkeletonShimmer className="h-8 w-8 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * 3. Admin Analytics & Report Skeleton
 */
export function AdminAnalyticsSkeleton() {
    return (
        <div className="w-full max-w-[1600px] mx-auto animate-in fade-in duration-300 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1.5">
                    <SkeletonShimmer className="h-7 w-52 rounded-lg" />
                    <SkeletonShimmer className="h-4 w-80 rounded-md" />
                </div>
                <div className="flex items-center gap-3">
                    <SkeletonShimmer className="h-10 w-44 rounded-xl" />
                    <SkeletonShimmer className="h-10 w-36 rounded-xl" />
                </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center gap-4">
                        <SkeletonShimmer className="w-12 h-12 rounded-xl shrink-0" />
                        <div className="space-y-1.5 flex-1">
                            <SkeletonShimmer className="h-3.5 w-24 rounded" />
                            <SkeletonShimmer className="h-6 w-20 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Two Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-6">
                        <div className="flex items-center gap-3">
                            <SkeletonShimmer className="w-5 h-5 rounded" />
                            <SkeletonShimmer className="h-5 w-48 rounded-md" />
                        </div>
                        <div className="h-[280px] w-full flex items-end gap-3 pt-6">
                            {[30, 45, 60, 40, 75, 50, 85, 70, 95, 65].map((h, idx) => (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                    <SkeletonShimmer className="w-full rounded-t-md" style={{ height: `${h}%` }} />
                                    <SkeletonShimmer className="h-2.5 w-6 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
                    <SkeletonShimmer className="h-5 w-36 rounded-md" />
                    <div className="h-[220px] flex items-center justify-center">
                        <div className="w-36 h-36 rounded-full border-12 border-slate-100 flex items-center justify-center">
                            <SkeletonShimmer className="w-14 h-14 rounded-full" />
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
                    <SkeletonShimmer className="h-5 w-44 rounded-md" />
                    <div className="space-y-3 pt-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70">
                                <div className="space-y-1">
                                    <SkeletonShimmer className="h-4 w-40 rounded" />
                                    <SkeletonShimmer className="h-3 w-28 rounded" />
                                </div>
                                <SkeletonShimmer className="h-6 w-16 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * 4. Admin Cards Grid Skeleton (Subscription Plans, Integrations, Billing, Getting Started)
 */
export function AdminCardsSkeleton({ cardCount = 3 }) {
    return (
        <div className="w-full max-w-[1600px] mx-auto animate-in fade-in duration-300 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1.5">
                    <SkeletonShimmer className="h-7 w-48 rounded-lg" />
                    <SkeletonShimmer className="h-4 w-72 rounded-md" />
                </div>
                <div className="flex items-center gap-3">
                    <SkeletonShimmer className="h-10 w-32 rounded-xl" />
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <SkeletonShimmer className="h-9 w-24 rounded-lg" />
                    <SkeletonShimmer className="h-9 w-24 rounded-lg" />
                    <SkeletonShimmer className="h-9 w-24 rounded-lg" />
                </div>
                <SkeletonShimmer className="h-9 w-64 rounded-lg" />
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: cardCount }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-5">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <SkeletonShimmer className="w-10 h-10 rounded-xl" />
                                <div className="space-y-1">
                                    <SkeletonShimmer className="h-4 w-28 rounded" />
                                    <SkeletonShimmer className="h-3 w-16 rounded" />
                                </div>
                            </div>
                            <SkeletonShimmer className="h-6 w-16 rounded-full" />
                        </div>

                        <div className="space-y-2 py-2 border-y border-slate-50">
                            <SkeletonShimmer className="h-8 w-32 rounded-lg" />
                            <SkeletonShimmer className="h-3.5 w-full rounded" />
                            <SkeletonShimmer className="h-3.5 w-4/5 rounded" />
                        </div>

                        <div className="space-y-2.5">
                            {[1, 2, 3, 4].map((j) => (
                                <div key={j} className="flex items-center gap-2.5">
                                    <SkeletonShimmer className="w-4 h-4 rounded-full shrink-0" />
                                    <SkeletonShimmer className="h-3.5 w-full rounded" />
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 flex items-center gap-3">
                            <SkeletonShimmer className="h-10 flex-1 rounded-xl" />
                            <SkeletonShimmer className="h-10 w-10 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * 5. Admin Detail Page Skeleton (Recruiter Profile, Plan Detail)
 */
export function AdminDetailSkeleton() {
    return (
        <div className="w-full max-w-[1600px] mx-auto animate-in fade-in duration-300 space-y-6">
            {/* Top Navigation & Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SkeletonShimmer className="h-9 w-20 rounded-xl" />
                    <SkeletonShimmer className="h-6 w-48 rounded-lg" />
                </div>
                <div className="flex items-center gap-3">
                    <SkeletonShimmer className="h-9 w-28 rounded-xl" />
                    <SkeletonShimmer className="h-9 w-24 rounded-xl" />
                </div>
            </div>

            {/* Entity Header Banner */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <SkeletonShimmer className="w-16 h-16 rounded-2xl shrink-0" />
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <SkeletonShimmer className="h-6 w-48 rounded-lg" />
                            <SkeletonShimmer className="h-5 w-20 rounded-full" />
                        </div>
                        <div className="flex items-center gap-4">
                            <SkeletonShimmer className="h-3.5 w-32 rounded" />
                            <SkeletonShimmer className="h-3.5 w-28 rounded" />
                            <SkeletonShimmer className="h-3.5 w-36 rounded" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <SkeletonShimmer className="h-9 w-32 rounded-xl" />
                </div>
            </div>

            {/* Main Content 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
                        <SkeletonShimmer className="h-5 w-40 rounded-md" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="space-y-1.5 p-3 rounded-xl bg-slate-50/60">
                                    <SkeletonShimmer className="h-3 w-20 rounded" />
                                    <SkeletonShimmer className="h-4 w-36 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
                        <SkeletonShimmer className="h-5 w-36 rounded-md" />
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <SkeletonShimmer className="h-4 w-44 rounded" />
                                        <SkeletonShimmer className="h-3 w-32 rounded" />
                                    </div>
                                    <SkeletonShimmer className="h-6 w-20 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs space-y-4">
                        <SkeletonShimmer className="h-5 w-32 rounded-md" />
                        <div className="space-y-3">
                            <SkeletonShimmer className="h-10 w-full rounded-xl" />
                            <SkeletonShimmer className="h-10 w-full rounded-xl" />
                            <SkeletonShimmer className="h-10 w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * 6. Admin Form Skeleton (Create Recruiter, Create/Edit Plan, Settings)
 */
export function AdminFormSkeleton() {
    return (
        <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-300 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <SkeletonShimmer className="h-9 w-20 rounded-xl" />
                    <div className="space-y-1">
                        <SkeletonShimmer className="h-6 w-48 rounded-lg" />
                        <SkeletonShimmer className="h-3.5 w-64 rounded" />
                    </div>
                </div>
                <SkeletonShimmer className="h-9 w-28 rounded-xl" />
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs space-y-6">
                <div className="space-y-2 border-b border-slate-100 pb-4">
                    <SkeletonShimmer className="h-5 w-36 rounded-md" />
                    <SkeletonShimmer className="h-3.5 w-72 rounded" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <SkeletonShimmer className="h-3.5 w-24 rounded" />
                        <SkeletonShimmer className="h-11 w-full rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <SkeletonShimmer className="h-3.5 w-28 rounded" />
                        <SkeletonShimmer className="h-11 w-full rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <SkeletonShimmer className="h-3.5 w-20 rounded" />
                        <SkeletonShimmer className="h-11 w-full rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <SkeletonShimmer className="h-3.5 w-32 rounded" />
                        <SkeletonShimmer className="h-11 w-full rounded-xl" />
                    </div>
                </div>

                <div className="space-y-2 pt-2">
                    <SkeletonShimmer className="h-3.5 w-32 rounded" />
                    <SkeletonShimmer className="h-24 w-full rounded-xl" />
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <SkeletonShimmer className="h-10 w-24 rounded-xl" />
                    <SkeletonShimmer className="h-10 w-36 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

/**
 * 7. Admin User Management Page Skeleton
 */
export function AdminUserManagementSkeleton() {
    return (
        <div className="w-full max-w-[1600px] mx-auto animate-in fade-in duration-300 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <SkeletonShimmer className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="space-y-1.5">
                        <SkeletonShimmer className="h-6 w-72 rounded-lg" />
                        <SkeletonShimmer className="h-3.5 w-96 max-w-full rounded-md" />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <SkeletonShimmer className="w-9 h-9 rounded-xl" />
                    <SkeletonShimmer className="h-10 w-44 rounded-xl" />
                </div>
            </div>

            {/* 4 KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 bg-white rounded-2xl shadow-xs space-y-2 border border-slate-100">
                        <SkeletonShimmer className="h-4 w-28 rounded" />
                        <SkeletonShimmer className="h-7 w-16 rounded-md" />
                        <SkeletonShimmer className="h-3 w-24 rounded" />
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                    <SkeletonShimmer className="h-10 w-full rounded-xl" />
                </div>
                <div className="flex items-center gap-3">
                    <SkeletonShimmer className="h-10 w-36 rounded-xl" />
                    <SkeletonShimmer className="h-10 w-36 rounded-xl" />
                </div>
            </div>

            {/* Admins Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="py-3.5 px-6">Administrator</th>
                                <th className="py-3.5 px-4">Role & Department</th>
                                <th className="py-3.5 px-4">Granular Action Scope</th>
                                <th className="py-3.5 px-4">Last Activity</th>
                                <th className="py-3.5 px-4 text-center">Status</th>
                                <th className="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <tr key={i}>
                                    {/* Column 1: Identity */}
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <SkeletonShimmer className="w-9 h-9 rounded-xl shrink-0" />
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <SkeletonShimmer className="h-4 w-32 rounded" />
                                                <SkeletonShimmer className="h-3 w-44 rounded" />
                                            </div>
                                        </div>
                                    </td>

                                    {/* Column 2: Role & Dept */}
                                    <td className="py-4 px-4">
                                        <div className="space-y-1.5">
                                            <SkeletonShimmer className="h-6 w-28 rounded-md" />
                                            <SkeletonShimmer className="h-3 w-20 rounded" />
                                        </div>
                                    </td>

                                    {/* Column 3: Action Scope */}
                                    <td className="py-4 px-4">
                                        <div className="space-y-1.5 max-w-sm">
                                            <div className="flex items-center justify-between">
                                                <SkeletonShimmer className="h-3.5 w-24 rounded" />
                                                <SkeletonShimmer className="h-3 w-16 rounded" />
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                <SkeletonShimmer className="h-5 w-16 rounded-md" />
                                                <SkeletonShimmer className="h-5 w-20 rounded-md" />
                                                <SkeletonShimmer className="h-5 w-14 rounded-md" />
                                            </div>
                                        </div>
                                    </td>

                                    {/* Column 4: Last Activity */}
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2">
                                            <SkeletonShimmer className="w-3.5 h-3.5 rounded-full shrink-0" />
                                            <SkeletonShimmer className="h-3.5 w-20 rounded" />
                                        </div>
                                    </td>

                                    {/* Column 5: Status */}
                                    <td className="py-4 px-4 text-center">
                                        <SkeletonShimmer className="h-6 w-16 rounded-full mx-auto" />
                                    </td>

                                    {/* Column 6: Actions */}
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <SkeletonShimmer className="w-7 h-7 rounded-lg" />
                                            <SkeletonShimmer className="w-7 h-7 rounded-lg" />
                                            <SkeletonShimmer className="w-7 h-7 rounded-lg" />
                                            <SkeletonShimmer className="w-7 h-7 rounded-lg" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <SkeletonShimmer className="h-4 w-36 rounded" />
                    <div className="flex items-center gap-2">
                        <SkeletonShimmer className="h-8 w-16 rounded-xl" />
                        <SkeletonShimmer className="h-8 w-16 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default {
    AdminDashboardSkeleton,
    AdminTableSkeleton,
    AdminAnalyticsSkeleton,
    AdminCardsSkeleton,
    AdminDetailSkeleton,
    AdminFormSkeleton,
    AdminUserManagementSkeleton,
};

