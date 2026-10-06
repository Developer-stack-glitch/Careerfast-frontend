'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    Layers, ArrowLeft, Construction, Sparkles, 
    ChevronRight, CheckCircle2, ShieldAlert
} from 'lucide-react';

export default function EmptyAdminPage({
    title = 'Page Under Development',
    module = 'Admin Module',
    description = 'This section is currently being configured. Features and metrics for this module will be available soon.',
    icon: Icon = Construction,
    badgeText = 'Empty Page / Placeholder',
    suggestedLinks = [
        { label: 'Recruiters Dashboard', href: '/admin' },
        { label: 'Recruiters & Companies', href: '/admin/recruiters' },
        { label: 'Job Postings', href: '/admin/job-post' },
        { label: 'Support Tickets', href: '/admin/support' },
    ]
}) {
    const router = useRouter();

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Top Breadcrumb & Back Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        <span>Admin</span>
                        <ChevronRight className="w-3 h-3 text-gray-300" />
                        <span className="text-gray-600">{module}</span>
                        <ChevronRight className="w-3 h-3 text-gray-300" />
                        <span className="text-blue-600 font-bold">{title}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
                </div>

                <button
                    type="button"
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer w-fit"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Go Back
                </button>
            </div>

            {/* Empty State Banner Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden p-8 sm:p-12 text-center">
                <div className="max-w-md mx-auto flex flex-col items-center">
                    {/* Icon with soft glow */}
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5 shadow-xs">
                        <Icon className="w-8 h-8" strokeWidth={1.75} />
                    </div>

                    {/* Status Badge */}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        {badgeText}
                    </span>

                    {/* Title & Description */}
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
                    <p className="text-sm text-gray-500 leading-relaxed mb-8">
                        {description}
                    </p>

                    {/* Helpful Quick Links */}
                    {suggestedLinks && suggestedLinks.length > 0 && (
                        <div className="w-full pt-6 border-t border-gray-100">
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-3">
                                Available Admin Modules
                            </span>
                            <div className="flex flex-wrap justify-center gap-2">
                                {suggestedLinks.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.href}
                                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-700 border border-gray-200/60 hover:border-blue-200 transition-colors no-underline"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
