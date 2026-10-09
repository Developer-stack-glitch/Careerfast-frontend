'use client';
import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Search, Settings,
    Sparkles, Users,
    Rocket, ChevronRight, Bell, PanelLeftClose, PanelLeftOpen, Command,
    Building2, Briefcase, MessageSquare,
    LogOut, Layers, LayoutDashboard,
    Users2, ShieldCheck, BarChart3, FileSpreadsheet
} from 'lucide-react';
import defaultLogo from '../images/careerfastlogofinal.png';
import { getImageUrl } from '../utils/getImageUrl';
import useAdminPermissions from './useAdminPermissions';
import { getSupportTicketStats } from '../ApiService/action';

const mockNavGroups = [
    {
        heading: 'DASHBOARD',
        items: [
            { id: 'dashboard-recruiters', module: 'dashboard_recruiter', title: 'Recruiters', icon: LayoutDashboard, href: '/admin/dashboard/recruiter' },
            { id: 'dashboard-job-seekers', module: 'dashboard_job_seekers', title: 'Job Seekers', icon: Users, href: '/admin/dashboard/job-seekers' },
        ]
    },
    {
        heading: 'RECRUITER MANAGEMENT',
        items: [
            { id: 'all-recruiters', module: 'recruiters', title: 'Recruiters & Companies', icon: Building2, href: '/admin/recruiters' },
            { id: 'job-post', module: 'job_posts', title: 'Job Post', icon: Briefcase, href: '/admin/job-post' },
            { id: 'recruiter-plans', module: 'plans', title: 'Subscriptions', icon: Layers, href: '/admin/plans' },
        ]
    },
    {
        heading: 'TALENT MANAGEMENT',
        items: [
            { id: 'talent-job-seekers', module: 'job_seekers', title: 'Job Seekers', icon: Users, href: '/admin/job-seekers' },
            { id: 'talent-subscriptions', module: 'talent_subscriptions', title: 'Subscriptions', icon: Layers, href: '/admin/talent/subscriptions' },
        ]
    },
    {
        heading: 'REPORT',
        items: [
            { id: 'report-recruiters', module: 'report_recruiters', title: 'Recruiters', icon: Sparkles, href: '/admin/reports/recruiters' },
            { id: 'report-job-seekers', module: 'report_job_seekers', title: 'Job Seekers', icon: FileSpreadsheet, href: '/admin/reports/job-seekers' },
        ]
    },
    {
        heading: 'SYSTEM',
        items: [
            { id: 'support', module: 'support', title: 'Support Tickets', icon: MessageSquare, href: '/admin/support' },
            { id: 'users', module: 'user_management', title: 'Users & Roles', icon: Users2, href: '/admin/users' },
            { id: 'roles-permissions', module: 'roles_permissions', title: 'Roles & Permissions', icon: ShieldCheck, href: '/admin/roles-permissions' },
            { id: 'general', module: 'settings', title: 'Platform Settings', icon: Settings, href: '/admin/general' },
        ]
    }
];

const mockBottomItems = [
    { id: 'logout', title: 'Sign Out', icon: LogOut },
];

const allItems = [
    ...mockNavGroups.flatMap(g => g.items),
    ...mockBottomItems,
    { id: 'getting-started', title: 'Getting started', icon: Rocket }
];

const checkIsActive = (itemHref, currentPath) => {
    if (!itemHref || !currentPath) return false;
    if (itemHref === '/admin/dashboard/recruiter' || itemHref === '/admin') {
        return currentPath === '/admin' || currentPath === '/admin/dashboard/recruiter' || currentPath === '/admin/dashboard/recruiters';
    }
    if (itemHref === '/admin/reports/recruiters') {
        return currentPath === '/admin/reports/recruiters' || currentPath === '/admin/analytics';
    }
    return currentPath === itemHref || currentPath.startsWith(itemHref + '/');
};

const WorkspaceSwitcher = memo(function WorkspaceSwitcher() {
    return (
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
            <Link href="/admin/dashboard/recruiter" className="flex items-center justify-center w-full cursor-pointer group no-underline">
                <div className="flex items-center gap-2">
                    <img src={getImageUrl(defaultLogo)} alt="CareerFast" className="w-[180px] h-auto object-contain" />
                </div>
            </Link>
        </div>
    );
});

const NavItem = memo(function NavItem({ item, currentPath, onLogout, badgeCount = 0 }) {
    const isActive = checkIsActive(item.href, currentPath);

    if (item.id === 'logout') {
        return (
            <button
                type="button"
                className="w-[calc(100%-24px)] flex items-center gap-3 px-3 py-2 text-[13px] cursor-pointer transition-colors mx-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-left border-0 bg-transparent"
                onClick={onLogout}
            >
                <item.icon className="w-[16px] h-[16px] text-red-500 shrink-0" strokeWidth={1.5} />
                <span className="truncate">{item.title}</span>
            </button>
        );
    }

    return (
        <Link
            href={item.href || '#'}
            prefetch={true}
            className={`flex items-center gap-3 px-3 py-2 text-[13px] transition-colors mx-3 no-underline
                ${isActive
                    ? 'bg-gray-100/80 text-gray-900 font-medium rounded-lg'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg'}`}
        >
            <item.icon
                className={`w-[16px] h-[16px] shrink-0 ${isActive ? 'text-gray-700' : 'text-gray-400'}`}
                strokeWidth={isActive ? 2 : 1.5}
            />
            <span className="truncate flex-1">{item.title}</span>

            {Boolean(badgeCount && badgeCount > 0) && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[11px] font-bold rounded-full bg-rose-500 text-white shadow-xs leading-none shrink-0 animate-in fade-in">
                    {badgeCount > 99 ? '99+' : badgeCount}
                </span>
            )}
        </Link>
    );
});

export const SidebarNav = memo(function SidebarNav({ className = '', currentPath, onLogout, userPermissions, isSuperAdmin = true, can = null, badges = {} }) {
    // Filter nav groups based on assigned module permissions
    const filteredGroups = useMemo(() => {
        // Super Admin or users without restricting permissions see all modules
        if (isSuperAdmin || !userPermissions || Object.keys(userPermissions).length === 0) {
            return mockNavGroups;
        }

        return mockNavGroups.map(group => {
            const allowedItems = group.items.filter(item => {
                if (!item.module) return true;
                if (typeof can === 'function') {
                    return can(item.module);
                }
                const modPerm = userPermissions?.[item.module];
                if (!modPerm) return false;
                if (modPerm.view) return true;
                return typeof modPerm === 'object' && Object.values(modPerm).some(v => v === true);
            });
            return {
                ...group,
                items: allowedItems
            };
        }).filter(group => group.items.length > 0);
    }, [userPermissions, isSuperAdmin, can]);


    return (
        <div className={`flex flex-col w-[260px] h-full bg-white border-r border-gray-100 font-sans ${className}`}>
            <WorkspaceSwitcher />

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-1 mt-3">
                {filteredGroups.map((group, idx) => (
                    <div key={idx} className="flex flex-col gap-1 mb-4">
                        {group.heading && (
                            <span className="px-6 mb-3 text-[11px] font-semibold tracking-widest text-gray-500/80 uppercase">
                                {group.heading}
                            </span>
                        )}
                        {group.items.map(item => (
                            <NavItem
                                key={item.id}
                                item={item}
                                currentPath={currentPath}
                                onLogout={onLogout}
                                badgeCount={badges[item.id]}
                            />
                        ))}
                    </div>
                ))}
            </div>

            <div className="mt-auto pb-2 flex flex-col gap-1 bg-white pt-2">
                <div className="h-px bg-gray-100/80 w-full mb-2 mt-1" />
                {mockBottomItems.map(item => (
                    <NavItem
                        key={item.id}
                        item={item}
                        currentPath={currentPath}
                        onLogout={onLogout}
                    />
                ))}
            </div>
        </div>
    );
});

export default function AdminLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    const [isOpen, setIsOpen] = useState(true);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [openTicketCount, setOpenTicketCount] = useState(0);
    const { currentUser, isSuperAdmin, userPermissions, can } = useAdminPermissions();

    const fetchTicketStats = useCallback(async () => {
        try {
            const res = await getSupportTicketStats();
            if (res?.data?.success && res.data.data) {
                setOpenTicketCount(res.data.data.open || 0);
            }
        } catch (e) {
            // Ignore if logged out or endpoint fails
        }
    }, []);

    useEffect(() => {
        fetchTicketStats();
        // Polling every 20s for real-time ticket notification
        const interval = setInterval(fetchTicketStats, 20000);
        const handleTicketChange = () => fetchTicketStats();
        window.addEventListener('support_ticket_changed', handleTicketChange);

        return () => {
            clearInterval(interval);
            window.removeEventListener('support_ticket_changed', handleTicketChange);
        };
    }, [fetchTicketStats]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("loginDetails");
            if (!stored) {
                window.location.href = "/superadmin/login";
                return;
            }
            const loginDetails = JSON.parse(stored);
            if (loginDetails?.role_id !== 1 && loginDetails?.role_name !== 'SUPERADMIN' && loginDetails?.role_name !== 'SUPER-ADMIN') {
                window.location.href = "/superadmin/login";
                return;
            }
        } catch (e) {
            window.location.href = "/superadmin/login";
        }
    }, []);

    const activeItem = useMemo(() => {
        return allItems.find(i => checkIsActive(i.href, pathname));
    }, [pathname]);

    const activeTitle = activeItem ? activeItem.title : 'Dashboard';

    const handleLogout = () => {
        localStorage.removeItem("AccessToken");
        localStorage.removeItem("loginDetails");
        document.cookie = "AccessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "loginDetails=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/superadmin/login";
    };

    const userInitials = useMemo(() => {
        if (!currentUser) return 'SA';
        const f = currentUser.first_name ? currentUser.first_name.charAt(0).toUpperCase() : '';
        const l = currentUser.last_name ? currentUser.last_name.charAt(0).toUpperCase() : '';
        return (f + l) || 'SA';
    }, [currentUser]);

    return (
        <div className="flex h-screen w-full bg-white font-sans overflow-hidden text-gray-900">
            <div
                className={`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-white ${isOpen ? 'w-[260px] opacity-100' : 'w-0 opacity-0 border-none'
                    }`}
            >
                <SidebarNav
                    className="w-[260px] border-none"
                    currentPath={pathname}
                    onLogout={handleLogout}
                    userPermissions={userPermissions}
                    isSuperAdmin={isSuperAdmin}
                    can={can}
                    badges={{ support: openTicketCount }}
                />
            </div>

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 bg-white border-l border-gray-100">
                <div className="h-[72px] flex items-center px-6 justify-between bg-white shrink-0 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors border-0 bg-transparent cursor-pointer"
                            aria-label="Toggle sidebar"
                        >
                            {isOpen ? <PanelLeftClose className="w-[18px] h-[18px]" /> : <PanelLeftOpen className="w-[18px] h-[18px]" />}
                        </button>
                        <div className="flex items-center text-[13px] text-gray-500">
                            <Link href="/admin/dashboard/recruiter" className="cursor-pointer hover:text-gray-900 text-gray-500 no-underline font-medium">
                                Superadmin
                            </Link>
                            <ChevronRight className="w-3.5 h-3.5 mx-2 text-gray-300" />
                            <span className="font-semibold text-gray-900">{activeTitle}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="relative hidden md:flex items-center group">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 group-hover:text-gray-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search"
                                className="pl-9 pr-4 py-2 bg-gray-50 hover:bg-gray-100/80 border border-transparent hover:border-gray-200 transition-all rounded-full text-[13px] focus:outline-none focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100/50 w-64 cursor-text"
                                onClick={() => setIsSearchOpen(true)}
                                readOnly
                            />
                        </div>

                        <div className="flex items-center gap-3 ml-2">
                            <Link href="/admin/support" className="text-gray-400 hover:text-gray-600 transition-colors border-0 bg-transparent p-0 cursor-pointer relative no-underline flex items-center justify-center">
                                <Bell className="w-5 h-5" />
                                {openTicketCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center leading-none ring-2 ring-white animate-in zoom-in">
                                        {openTicketCount > 99 ? '99+' : openTicketCount}
                                    </span>
                                )}
                            </Link>

                            <div className="flex items-center gap-2">
                                <div suppressHydrationWarning className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[12px] font-bold shadow-xs tracking-wide">
                                    {userInitials}
                                </div>
                                <div className="hidden lg:flex flex-col text-left">
                                    <span suppressHydrationWarning className="text-xs font-bold text-gray-900 leading-tight">
                                        {currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : 'Super Admin'}
                                    </span>
                                    <span suppressHydrationWarning className="text-[10px] text-gray-400 font-semibold">
                                        {isSuperAdmin ? 'Super Admin' : (currentUser?.admin_role_title || currentUser?.role_title || 'Sub-Admin')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-1 bg-[#f5f5f5]">
                    {children}
                </div>

                {isSearchOpen && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/20 backdrop-blur-sm px-4">
                        <div className="absolute inset-0" onClick={() => setIsSearchOpen(false)} />
                        <div className="relative w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center px-4 border-b border-gray-100">
                                <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
                                <input
                                    autoFocus
                                    className="flex-1 bg-transparent py-4 outline-none text-[15px] text-gray-900 placeholder:text-gray-400 border-0"
                                    placeholder="Search..."
                                />
                                <kbd
                                    onClick={() => setIsSearchOpen(false)}
                                    className="hidden sm:inline-flex items-center justify-center h-6 px-2 ml-2 text-[11px] font-medium font-mono text-gray-500 bg-gray-100 border border-gray-200 rounded-md cursor-pointer hover:text-gray-900 hover:bg-gray-200 transition-colors"
                                >
                                    ESC
                                </kbd>
                            </div>
                            <div className="p-4 py-12 flex flex-col items-center justify-center">
                                <Command className="w-8 h-8 text-gray-200 mb-3" />
                                <p className="text-[14px] text-gray-500">No recent searches</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
