'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Users2, ShieldCheck, ShieldAlert, KeyRound, Plus, Search, Filter,
    CheckCircle2, XCircle, MoreVertical, Edit3, Trash2, Lock, Unlock,
    Eye, Check, X, RefreshCw, Mail, Phone, Calendar, Clock,
    LayoutDashboard, Sparkles, Layers, Building2, Briefcase, Users,
    MessageSquare, Settings, UserCheck, ChevronDown, AlertCircle, Shield,
    SlidersHorizontal, CheckSquare, Square, Download, FileSpreadsheet,
    ArrowUpDown, LogIn, ExternalLink
} from 'lucide-react';
import {
    getAdminUsers,
    createAdminUser,
    updateAdminUser,
    toggleAdminUserStatus,
    resetAdminUserPassword,
    deleteAdminUser
} from '../ApiService/action';
import AdminSelect from './AdminSelect';
import { AdminUserManagementSkeleton, SkeletonShimmer } from './AdminSkeletons';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

// ── Format Last Active Dynamically ──
const formatLastActive = (dateString) => {
    if (!dateString) return { relative: 'Never', exact: '', isOnline: false };
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { relative: 'Never', exact: '', isOnline: false };

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSec = Math.floor(diffInMs / 1000);

    const exact = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    if (diffInSec < 0 || diffInSec < 60) return { relative: 'Active now', exact, isOnline: true };

    const diffInMin = Math.floor(diffInSec / 60);
    if (diffInMin < 15) return { relative: 'Active now', exact, isOnline: true };
    if (diffInMin < 60) return { relative: `${diffInMin}m ago`, exact, isOnline: false };

    const diffInHours = Math.floor(diffInMin / 60);
    if (diffInHours < 24) return { relative: `${diffInHours}h ago`, exact, isOnline: false };

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return { relative: 'Yesterday', exact, isOnline: false };
    if (diffInDays < 7) return { relative: `${diffInDays}d ago`, exact, isOnline: false };

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return { relative: `${diffInWeeks}w ago`, exact, isOnline: false };

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return { relative: `${diffInMonths}mo ago`, exact, isOnline: false };

    const diffInYears = Math.floor(diffInDays / 365);
    return { relative: `${diffInYears}y ago`, exact, isOnline: false };
};

// ── Superadmin Portal Module Definitions with Fine-Grained Actions ──
const PORTAL_MODULES = [
    {
        id: 'dashboard',
        name: 'Dashboard Page',
        page: '/admin',
        description: 'System overview, KPI cards, real-time activity and platform summary.',
        icon: LayoutDashboard,
        color: 'text-blue-600 bg-blue-50 border-blue-100',
        actions: [
            { id: 'kpi_cards', label: 'Score Board & Top KPI Cards', desc: 'View summary metric cards' },
            { id: 'growth_chart', label: 'Platform Growth Trends Chart', desc: 'Candidates vs Jobs interactive chart' },
            { id: 'demographics_chart', label: 'User Demographics Donut', desc: 'Breakdown of candidate vs recruiter mix' },
            { id: 'activity_feed', label: 'Live Activity Stream', desc: 'Real-time platform activity log' },
            { id: 'date_filter', label: 'Date Range & Period Filter', desc: 'Filter dashboard stats by timeframe' },
            { id: 'export_data', label: 'Download Dashboard Data', desc: 'Export summary stats to Excel / CSV' },
            { id: 'system_status', label: 'System Health & Server Uptime', desc: 'View infrastructure health status' },
        ]
    },
    {
        id: 'analytics',
        name: 'Analytics & Reports Page',
        page: '/admin/analytics',
        description: 'User registration charts, application pipelines and conversion metrics.',
        icon: Sparkles,
        color: 'text-amber-600 bg-amber-50 border-amber-100',
        actions: [
            { id: 'overview_analytics', label: 'Analytics Dashboard Overview', desc: 'Access platform intelligence hub' },
            { id: 'user_growth_analysis', label: 'User Registration Growth Analysis', desc: 'Daily/weekly user trends' },
            { id: 'job_moderation_trends', label: 'Job Posting & Moderation Trends', desc: 'Posting volume metrics' },
            { id: 'recruiter_conversions', label: 'Recruiter Conversion & Retention', desc: 'Employer lifecycle tracking' },
            { id: 'application_pipeline', label: 'Candidate Pipeline & Funnel', desc: 'Application conversion stages' },
            { id: 'export_analytics_data', label: 'Download Analytics Reports', desc: 'Export insights to Excel / PDF' },
        ]
    },
    {
        id: 'plans',
        name: 'Subscription Management Page',
        page: '/admin/plans',
        description: 'Manage pricing tiers, validity, job limits and active subscriber lists.',
        icon: Layers,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        actions: [
            { id: 'view_plans_table', label: 'View Subscription Plans Directory', desc: 'Browse all pricing packages' },
            { id: 'add_plan_button', label: 'Add New Plan Button', desc: 'Create new subscription tier' },
            { id: 'edit_plan_details', label: 'Edit Plan Details & Pricing', desc: 'Modify cost, limits & validity' },
            { id: 'duplicate_plan_action', label: 'Duplicate Subscription Plan', desc: 'Clone plan template' },
            { id: 'toggle_plan_status', label: 'Toggle Plan Active / Inactive Status', desc: 'Control public plan visibility' },
            { id: 'delete_plan_action', label: 'Delete Subscription Plan', desc: 'Purge package from system' },
            { id: 'view_plan_subscribers', label: 'View Active & Expired Subscribers', desc: 'Recruiters on this plan' },
        ]
    },
    {
        id: 'recruiters',
        name: 'Recruiters & Companies Page',
        page: '/admin/recruiters',
        description: 'Manage employer profiles, extend validity, assign custom plans, and auto-approve.',
        icon: Building2,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        actions: [
            { id: 'view_recruiters_directory', label: 'Recruiter Directory & Metrics Table', desc: 'Browse employer accounts' },
            { id: 'add_recruiter_button', label: 'Add Recruiter Button', desc: 'Onboard new employer account' },
            { id: 'view_recruiter_profile', label: 'View Recruiter Profile & Stats', desc: 'Company details and history' },
            { id: 'edit_recruiter_profile', label: 'Edit Recruiter & Company Info', desc: 'Modify corporate profile' },
            { id: 'toggle_recruiter_status', label: 'Toggle Account Active / Suspended', desc: 'Control account access' },
            { id: 'toggle_auto_approve', label: 'Toggle Auto-Approve Job Posts', desc: 'Bypass moderation queue' },
            { id: 'change_plan_modal', label: 'Change Recruiter Plan Modal', desc: 'Upgrade / downgrade subscription' },
            { id: 'assign_custom_plan_modal', label: 'Assign Custom Plan & Feature Quotas', desc: 'Custom jobs, validity & tools' },
            { id: 'extend_subscription_modal', label: 'Extend Subscription Expiry Date', desc: 'Grant validity extension' },
            { id: 'reset_recruiter_password', label: 'Reset Recruiter Password Button', desc: 'Issue new credentials' },
            { id: 'login_as_recruiter_button', label: 'Login As Recruiter (Direct SSO)', desc: 'Impersonate employer dashboard' },
            { id: 'manage_recruiter_team', label: 'Manage Recruiter Sub-Recruiters', desc: 'Team member permissions' },
            { id: 'export_recruiters_data', label: 'Export Recruiter Directory to Excel', desc: 'Download company roster' },
        ]
    },
    {
        id: 'job_posts',
        name: 'Job Listings & Moderation Page',
        page: '/admin/job-post',
        description: 'Review active postings, moderate pending jobs, approve/reject and expire listings.',
        icon: Briefcase,
        color: 'text-violet-600 bg-violet-50 border-violet-100',
        actions: [
            { id: 'view_job_directory', label: 'View Active & Expired Job Postings', desc: 'Browse published jobs' },
            { id: 'view_pending_jobs', label: 'Pending Jobs Moderation Queue Tab', desc: 'Jobs awaiting review' },
            { id: 'approve_single_job', label: 'Approve Single Job Post', desc: 'Publish individual listing' },
            { id: 'bulk_approve_all_jobs', label: 'Bulk Approve All Pending Jobs', desc: 'One-click publish all pending' },
            { id: 'reject_job_post', label: 'Reject / Disapprove Job Post', desc: 'Decline posting with reason' },
            { id: 'view_job_details_modal', label: 'View Full Job Details & Description', desc: 'Inspect full listing' },
            { id: 'edit_job_post', label: 'Edit Job Details & Requirements', desc: 'Modify title, salary & skills' },
            { id: 'toggle_job_active', label: 'Toggle Job Active / Inactive', desc: 'Reactivate expired listings' },
            { id: 'expire_job_post', label: 'Expire Job Post Listing', desc: 'Manually close applications' },
            { id: 'delete_job_post', label: 'Delete Job Post Listing', desc: 'Permanently remove job' },
            { id: 'view_job_applicants', label: 'View Applied Candidates for Job', desc: 'Candidates for this position' },
        ]
    },
    {
        id: 'job_seekers',
        name: 'Job Seekers Directory Page',
        page: '/admin/job-seekers',
        description: 'Candidate talent pool, profile details, resumes, and verification statuses.',
        icon: Users,
        color: 'text-cyan-600 bg-cyan-50 border-cyan-100',
        actions: [
            { id: 'view_seekers_directory', label: 'Candidate Directory & Talent Pool', desc: 'Browse candidate accounts' },
            { id: 'view_seeker_profile', label: 'View Candidate Full Profile Modal', desc: 'Inspect candidate resume & history' },
            { id: 'view_resume_online', label: 'View Candidate Resume Online', desc: 'Preview uploaded PDF' },
            { id: 'download_resume_file', label: 'Download Candidate Resume Button', desc: 'Download resume document' },
            { id: 'toggle_seeker_status', label: 'Toggle Candidate Active / Suspended', desc: 'Control seeker login access' },
            { id: 'delete_seeker_account', label: 'Delete Candidate Account', desc: 'Purge candidate profile' },
            { id: 'export_seekers_data', label: 'Export Candidate Directory to Excel', desc: 'Download talent pool roster' },
        ]
    },
    {
        id: 'applications',
        name: 'Applications Tracking Page',
        page: '/admin/applications',
        description: 'Candidate applications across all job posts with recruiter routing.',
        icon: UserCheck,
        color: 'text-purple-600 bg-purple-50 border-purple-100',
        actions: [
            { id: 'view_applications_table', label: 'All Job Applications Directory', desc: 'Browse submitted applications' },
            { id: 'filter_applications_data', label: 'Filter by Recruiter, Job & Date', desc: 'Narrow down applications' },
            { id: 'view_applicant_details', label: 'View Application & Candidate Details', desc: 'Inspect submission info' },
            { id: 'view_target_job_link', label: 'Open Target Job Details', desc: 'Jump to original job listing' },
            { id: 'download_applied_resume', label: 'Download Applied Resume', desc: 'Download attached resume' },
            { id: 'export_applications_data', label: 'Export Applications Master Data', desc: 'Download applications report' },
        ]
    },
    {
        id: 'support',
        name: 'Support & Help Desk Page',
        page: '/admin/support',
        description: 'Handle user inquiries, dispute tickets, issue resolutions and feedback.',
        icon: MessageSquare,
        color: 'text-rose-600 bg-rose-50 border-rose-100',
        actions: [
            { id: 'view_support_tickets', label: 'Support & Help Desk Tickets List', desc: 'Browse open user queries' },
            { id: 'filter_support_tickets', label: 'Filter Tickets by Priority & Status', desc: 'Sort by severity & state' },
            { id: 'view_ticket_thread', label: 'View Ticket Message Thread', desc: 'Inspect full discussion history' },
            { id: 'reply_support_ticket', label: 'Reply & Send Resolution Note', desc: 'Respond to user issue' },
            { id: 'update_ticket_status', label: 'Update Status (Open/In Progress/Closed)', desc: 'Mark ticket resolution state' },
            { id: 'delete_support_ticket', label: 'Delete / Archive Support Ticket', desc: 'Remove resolved ticket' },
        ]
    },
    {
        id: 'user_management',
        name: 'Admin Team & Roles Page',
        page: '/admin/users',
        description: 'Create sub-administrators, delegate portal modules and manage RBAC permissions.',
        icon: Users2,
        color: 'text-teal-600 bg-teal-50 border-teal-100',
        actions: [
            { id: 'view_admin_directory', label: 'View Administrator & Sub-Admin List', desc: 'Browse admin team roster' },
            { id: 'create_admin_button', label: 'Add New Administrator Button', desc: 'Create sub-admin credentials' },
            { id: 'edit_admin_profile', label: 'Edit Admin Profile & Department', desc: 'Modify admin contact & role' },
            { id: 'manage_permissions_matrix', label: 'Manage Granular Module Permissions', desc: 'Configure feature checkboxes' },
            { id: 'toggle_admin_status', label: 'Toggle Admin Active / Suspended', desc: 'Instantly block/allow access' },
            { id: 'reset_admin_password', label: 'Reset Admin Password Button', desc: 'Issue new password' },
            { id: 'delete_admin_account', label: 'Delete Sub-Admin Account', desc: 'Purge administrator record' },
        ]
    },
    {
        id: 'settings',
        name: 'Platform Settings Page',
        page: '/admin/general',
        description: 'Global site configurations, integrations, email templates and system controls.',
        icon: Settings,
        color: 'text-slate-600 bg-slate-50 border-slate-200',
        actions: [
            { id: 'view_platform_settings', label: 'View Platform Settings Overview', desc: 'Browse system parameters' },
            { id: 'edit_company_branding', label: 'Update Site Logo, Branding & Banner', desc: 'Modify portal branding' },
            { id: 'manage_email_smtp', label: 'Configure SMTP & Email OTP Templates', desc: 'Manage mailer gateways' },
            { id: 'manage_contact_social', label: 'Update Social Media & Support Info', desc: 'Change contact addresses' },
            { id: 'manage_integrations', label: 'Manage Third-Party Integrations', desc: 'Configure Firebase / WhatsApp' },
            { id: 'system_maintenance', label: 'Cache & Database Maintenance', desc: 'Clear cache and diagnostics' },
        ]
    }
];

// Department Options
const DEPARTMENTS = [
    'Operations',
    'Moderation & Quality',
    'Finance & Billing',
    'Customer Support',
    'Talent Acquisition',
    'Executive Management',
    'Technology & IT'
];

const DEPARTMENT_OPTIONS = [
    { value: 'all', label: 'All Departments' },
    ...DEPARTMENTS.map(d => ({ value: d, label: d }))
];

const MODAL_DEPARTMENT_OPTIONS = DEPARTMENTS.map(d => ({ value: d, label: d }));

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Accounts' },
    { value: '1', label: 'Active Only' },
    { value: '0', label: 'Suspended Only' }
];

// Calculate Total Available Actions across all modules
const TOTAL_AVAILABLE_ACTIONS = PORTAL_MODULES.reduce((sum, m) => sum + m.actions.length, 0);

// Role Preset Configurations
const ROLE_PRESETS = [
    {
        id: 'super_admin',
        title: 'Full Super Admin',
        desc: 'Unrestricted access to all modules, actions, settings and sub-admin management.',
        isSuper: true,
        generate: () => {
            const perms = {};
            PORTAL_MODULES.forEach(mod => {
                const modPerms = { view: true, create_edit: true, delete: true };
                mod.actions.forEach(act => {
                    modPerms[act.id] = true;
                });
                perms[mod.id] = modPerms;
            });
            return perms;
        }
    },
    {
        id: 'operations_manager',
        title: 'Operations Manager',
        desc: 'Full operational control over Recruiters, Job Posts, Talent Directory, Applications and Support.',
        isSuper: false,
        generate: () => {
            const perms = {};
            PORTAL_MODULES.forEach(mod => {
                const modPerms = { view: false, create_edit: false, delete: false };
                if (['dashboard', 'recruiters', 'job_posts', 'job_seekers', 'applications', 'support'].includes(mod.id)) {
                    modPerms.view = true;
                    modPerms.create_edit = true;
                    mod.actions.forEach(act => {
                        if (!act.id.includes('delete') && !act.id.includes('purge')) {
                            modPerms[act.id] = true;
                        }
                    });
                }
                perms[mod.id] = modPerms;
            });
            return perms;
        }
    },
    {
        id: 'content_moderator',
        title: 'Content & Job Moderator',
        desc: 'Dedicated to reviewing, approving, rejecting and managing job post listings and queue.',
        isSuper: false,
        generate: () => {
            const perms = {};
            PORTAL_MODULES.forEach(mod => {
                const modPerms = { view: false, create_edit: false, delete: false };
                if (mod.id === 'job_posts') {
                    modPerms.view = true;
                    modPerms.create_edit = true;
                    mod.actions.forEach(act => {
                        modPerms[act.id] = true;
                    });
                } else if (['dashboard', 'recruiters'].includes(mod.id)) {
                    modPerms.view = true;
                    mod.actions.forEach(act => {
                        if (act.id.startsWith('view_')) modPerms[act.id] = true;
                    });
                }
                perms[mod.id] = modPerms;
            });
            return perms;
        }
    },
    {
        id: 'billing_specialist',
        title: 'Billing & Subscriptions Admin',
        desc: 'Manage subscription tiers, assign custom employer plans, validity extensions and invoices.',
        isSuper: false,
        generate: () => {
            const perms = {};
            PORTAL_MODULES.forEach(mod => {
                const modPerms = { view: false, create_edit: false, delete: false };
                if (['plans', 'dashboard'].includes(mod.id)) {
                    modPerms.view = true;
                    modPerms.create_edit = true;
                    mod.actions.forEach(act => {
                        modPerms[act.id] = true;
                    });
                } else if (mod.id === 'recruiters') {
                    modPerms.view = true;
                    modPerms.change_plan_modal = true;
                    modPerms.assign_custom_plan_modal = true;
                    modPerms.extend_subscription_modal = true;
                    modPerms.view_recruiters_directory = true;
                    modPerms.view_recruiter_profile = true;
                }
                perms[mod.id] = modPerms;
            });
            return perms;
        }
    },
    {
        id: 'read_only_auditor',
        title: 'Read-Only Auditor',
        desc: 'View-only visibility across analytics, statistics, recruiters, jobs and applications.',
        isSuper: false,
        generate: () => {
            const perms = {};
            PORTAL_MODULES.forEach(mod => {
                const modPerms = { view: false, create_edit: false, delete: false };
                if (!['user_management', 'settings'].includes(mod.id)) {
                    modPerms.view = true;
                    mod.actions.forEach(act => {
                        if (act.id.startsWith('view_') || act.id.startsWith('kpi_') || act.id.includes('chart')) {
                            modPerms[act.id] = true;
                        }
                    });
                }
                perms[mod.id] = modPerms;
            });
            return perms;
        }
    }
];

export default function UserManagement() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Permission search filter inside modal
    const [permSearchQuery, setPermSearchQuery] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        phone_code: '+91',
        password: '',
        role_title: 'Operations Admin',
        department: 'Operations',
        is_super_admin: false,
        permissions: {}
    });

    const [newPassword, setNewPassword] = useState('');

    // Fetch list
    const fetchAdminList = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getAdminUsers({
                search,
                department: departmentFilter !== 'all' ? departmentFilter : '',
                status: statusFilter !== 'all' ? statusFilter : '',
                page,
                limit: 20
            });
            if (res?.data?.success) {
                setAdmins(res.data.data.users || []);
                setTotalCount(res.data.data.total || 0);
            }
        } catch (err) {
            console.error('Error fetching admin users:', err);
            toast.error(err.response?.data?.message || 'Failed to load administrator accounts');
        } finally {
            setLoading(false);
        }
    }, [search, departmentFilter, statusFilter, page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAdminList();
        }, 250);
        return () => clearTimeout(timer);
    }, [fetchAdminList]);

    // KPI Summary Metrics
    const stats = useMemo(() => {
        const total = admins.length;
        const active = admins.filter(a => a.is_active === 1).length;
        const superAdmins = admins.filter(a => a.is_super_admin).length;
        const subAdmins = total - superAdmins;
        return { total, active, superAdmins, subAdmins };
    }, [admins]);

    // Open Form for Create
    const handleOpenCreate = () => {
        const defaultPerms = {};
        PORTAL_MODULES.forEach(m => {
            const modPerms = { view: true, create_edit: false, delete: false };
            m.actions.forEach(a => {
                if (a.id.startsWith('view_') || a.id.startsWith('kpi_') || a.id.includes('chart')) {
                    modPerms[a.id] = true;
                }
            });
            defaultPerms[m.id] = modPerms;
        });

        setSelectedAdmin(null);
        setPermSearchQuery('');
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            phone_code: '+91',
            password: '',
            role_title: 'Operations Admin',
            department: 'Operations',
            is_super_admin: false,
            permissions: defaultPerms
        });
        setIsFormOpen(true);
    };

    // Open Form for Edit
    const handleOpenEdit = (admin) => {
        setSelectedAdmin(admin);
        setPermSearchQuery('');
        let existingPerms = {};
        if (admin.permissions) {
            try {
                existingPerms = typeof admin.permissions === 'string' ? JSON.parse(admin.permissions) : admin.permissions;
            } catch (e) {
                existingPerms = {};
            }
        }

        const isSuperRole = admin.role_title === 'Full Super Admin' || (Boolean(admin.is_super_admin) && admin.role_title === 'Master Super Admin');

        setFormData({
            first_name: admin.first_name || '',
            last_name: admin.last_name || '',
            email: admin.email || '',
            phone: admin.phone || '',
            phone_code: admin.phone_code || '+91',
            password: '',
            role_title: admin.role_title || 'Admin',
            department: admin.department || 'Operations',
            is_super_admin: isSuperRole,
            permissions: existingPerms
        });
        setIsFormOpen(true);
    };

    // Apply a Preset to the Form
    const handleApplyPreset = (preset) => {
        setFormData(prev => ({
            ...prev,
            is_super_admin: preset.isSuper,
            role_title: preset.title,
            permissions: preset.generate()
        }));
        toast.success(`Applied "${preset.title}" clearance preset`);
    };

    // Toggle a specific fine-grained action checkbox
    const handleToggleAction = (moduleId, actionId) => {
        setFormData(prev => {
            const currentMod = prev.permissions?.[moduleId] || { view: false };
            const isCurrentlyChecked = Boolean(currentMod[actionId]);
            const newChecked = !isCurrentlyChecked;

            const updatedMod = {
                ...currentMod,
                [actionId]: newChecked
            };

            // Check if any action in this module is now checked
            const anyActionActive = Object.keys(updatedMod).some(k => k !== 'view' && updatedMod[k] === true);
            if (anyActionActive) {
                updatedMod.view = true;
            }

            return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [moduleId]: updatedMod
                }
            };
        });
    };

    // Toggle all actions inside a specific module
    const handleToggleModuleAll = (moduleId) => {
        const mod = PORTAL_MODULES.find(m => m.id === moduleId);
        if (!mod) return;

        setFormData(prev => {
            const currentMod = prev.permissions?.[moduleId] || {};
            // Determine if all are currently active
            const allActive = mod.actions.every(act => Boolean(currentMod[act.id]));

            const updatedMod = {
                view: !allActive,
                create_edit: !allActive,
                delete: !allActive
            };

            mod.actions.forEach(act => {
                updatedMod[act.id] = !allActive;
            });

            return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [moduleId]: updatedMod
                }
            };
        });
    };

    // Global Bulk Actions (Grant All / Clear All)
    const handleGlobalBulk = (type) => {
        setFormData(prev => {
            const newPerms = {};
            PORTAL_MODULES.forEach(m => {
                const modPerms = {
                    view: type === 'grant_all',
                    create_edit: type === 'grant_all',
                    delete: type === 'grant_all'
                };
                m.actions.forEach(a => {
                    modPerms[a.id] = type === 'grant_all';
                });
                newPerms[m.id] = modPerms;
            });
            return {
                ...prev,
                permissions: newPerms
            };
        });
    };

    // Count enabled permissions
    const activeActionsCount = useMemo(() => {
        if (formData.is_super_admin) return TOTAL_AVAILABLE_ACTIONS;
        let count = 0;
        PORTAL_MODULES.forEach(mod => {
            const modPerm = formData.permissions?.[mod.id] || {};
            mod.actions.forEach(act => {
                if (modPerm[act.id]) count++;
            });
        });
        return count;
    }, [formData.permissions, formData.is_super_admin]);

    // Save Admin User
    const handleSaveAdmin = async (e) => {
        e.preventDefault();
        if (!formData.first_name.trim() || !formData.last_name.trim()) {
            toast.error('First and last name are required');
            return;
        }
        if (!formData.email.trim()) {
            toast.error('Official email is required');
            return;
        }
        if (!selectedAdmin && (!formData.password || formData.password.length < 6)) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            setActionLoading(true);
            if (selectedAdmin) {
                await updateAdminUser(selectedAdmin.id, {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    phone_code: formData.phone_code,
                    role_title: formData.role_title,
                    department: formData.department,
                    is_super_admin: formData.is_super_admin,
                    permissions: formData.permissions
                });

                // Immediately sync local storage if current session is the one being modified
                try {
                    const stored = localStorage.getItem("loginDetails");
                    if (stored) {
                        const current = JSON.parse(stored);
                        if (current.id === selectedAdmin.id) {
                            const updated = {
                                ...current,
                                first_name: formData.first_name,
                                last_name: formData.last_name,
                                phone: formData.phone,
                                phone_code: formData.phone_code,
                                role_title: formData.role_title,
                                admin_role_title: formData.role_title,
                                department: formData.department,
                                admin_department: formData.department,
                                is_super_admin: formData.is_super_admin ? 1 : 0,
                                permissions: formData.permissions,
                                admin_permissions: formData.permissions
                            };
                            localStorage.setItem("loginDetails", JSON.stringify(updated));
                        }
                    }
                    localStorage.setItem("admin_perms_timestamp", Date.now().toString());
                    window.dispatchEvent(new CustomEvent('admin_permissions_updated', {
                        detail: { userId: selectedAdmin.id, permissions: formData.permissions }
                    }));
                } catch (e) { }

                toast.success('Admin permissions and profile updated successfully');
            } else {
                await createAdminUser(formData);
                toast.success('New administrator account created successfully');
            }
            setIsFormOpen(false);
            fetchAdminList();
        } catch (err) {
            console.error('Error saving admin:', err);
            toast.error(err.response?.data?.message || 'Failed to save administrator');
        } finally {
            setActionLoading(false);
        }
    };

    // Toggle Active Status
    const handleToggleStatus = async (admin) => {
        if (admin.id === 1) {
            toast.error('Master Super Admin account cannot be suspended');
            return;
        }
        const newStatus = admin.is_active === 1 ? 0 : 1;
        try {
            await toggleAdminUserStatus(admin.id, newStatus);
            toast.success(`Admin account ${newStatus === 1 ? 'activated' : 'suspended'}`);
            fetchAdminList();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update admin status');
        }
    };

    // Password Reset
    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        try {
            setActionLoading(true);
            await resetAdminUserPassword(selectedAdmin.id, newPassword);
            toast.success(`Password for ${selectedAdmin.email} has been updated`);
            setIsPasswordModalOpen(false);
            setNewPassword('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setActionLoading(false);
        }
    };

    // Delete Admin
    const handleDeleteAdmin = async () => {
        if (!selectedAdmin) return;
        try {
            setActionLoading(true);
            await deleteAdminUser(selectedAdmin.id);
            toast.success(`Admin account ${selectedAdmin.email} removed`);
            setIsDeleteModalOpen(false);
            setSelectedAdmin(null);
            fetchAdminList();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete admin');
        } finally {
            setActionLoading(false);
        }
    };

    // Filter modules based on live search in modal
    const filteredModalModules = useMemo(() => {
        if (!permSearchQuery.trim()) return PORTAL_MODULES;
        const q = permSearchQuery.toLowerCase();
        return PORTAL_MODULES.map(mod => {
            const matchesMod = mod.name.toLowerCase().includes(q) || mod.description.toLowerCase().includes(q);
            const filteredActions = mod.actions.filter(a => a.label.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
            if (matchesMod || filteredActions.length > 0) {
                return {
                    ...mod,
                    actions: matchesMod ? mod.actions : filteredActions
                };
            }
            return null;
        }).filter(Boolean);
    }, [permSearchQuery]);

    if (loading && admins.length === 0) {
        return <AdminUserManagementSkeleton />;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
            {/* Header with Title & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Users2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 mb-0">
                                Administrator & Sub-Admin Management
                            </h1>
                            <p className="text-xs text-gray-500 mt-0.5 mb-0">
                                Create portal administrators, assign role clearances, and manage module-wise granular permissions.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAdminList}
                        className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                        title="Refresh list"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New Administrator</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-xs">
                    <span className="text-[14px] font-semibold text-gray-400 block">Total Administrators</span>
                    <span className="text-2xl font-extrabold text-gray-900 mt-1 block">{stats.total}</span>
                    <span className="text-[11px] text-gray-500 mt-0.5 block">Portal credentials</span>
                </div>
                <div className="p-4 bg-white rounded-2xl shadow-xs">
                    <span className="text-[14px] font-semibold text-emerald-600 block">Active Accounts</span>
                    <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{stats.active}</span>
                    <span className="text-[11px] text-gray-500 mt-0.5 block">Ready to log in</span>
                </div>
                <div className="p-4 bg-white rounded-2xl shadow-xs">
                    <span className="text-[14px] font-semibold text-indigo-600 block">Full Super Admins</span>
                    <span className="text-2xl font-extrabold text-indigo-900 mt-1 block">{stats.superAdmins}</span>
                    <span className="text-[11px] text-gray-500 mt-0.5 block">Unrestricted clearance</span>
                </div>
                <div className="p-4 bg-white rounded-2xl shadow-xs">
                    <span className="text-[14px] font-semibold text-amber-600 block">Delegated Sub-Admins</span>
                    <span className="text-2xl font-extrabold text-amber-900 mt-1 block">{stats.subAdmins}</span>
                    <span className="text-[11px] text-gray-500 mt-0.5 block">Custom module scopes</span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search administrators by name, email, phone..."
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-gray-50/80 border border-gray-200 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* Department Filter */}
                    <AdminSelect
                        value={departmentFilter}
                        onChange={(val) => { setDepartmentFilter(val); setPage(1); }}
                        options={DEPARTMENT_OPTIONS}
                        placeholder="All Departments"
                    />

                    {/* Status Filter */}
                    <AdminSelect
                        value={statusFilter}
                        onChange={(val) => { setStatusFilter(val); setPage(1); }}
                        options={STATUS_OPTIONS}
                        placeholder="All Accounts"
                    />
                </div>
            </div>

            {/* Admins Table */}
            <div className="bg-white rounded-2xl shadow-xs overflow-hidden">
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
                        <tbody className="divide-y divide-gray-100 text-xs">
                            {loading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <tr key={i}>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <SkeletonShimmer className="w-9 h-9 rounded-xl shrink-0" />
                                                <div className="space-y-1.5 flex-1 min-w-0">
                                                    <SkeletonShimmer className="h-4 w-32 rounded" />
                                                    <SkeletonShimmer className="h-3 w-44 rounded" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="space-y-1.5">
                                                <SkeletonShimmer className="h-6 w-28 rounded-md" />
                                                <SkeletonShimmer className="h-3 w-20 rounded" />
                                            </div>
                                        </td>
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
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <SkeletonShimmer className="w-3.5 h-3.5 rounded-full shrink-0" />
                                                <SkeletonShimmer className="h-3.5 w-20 rounded" />
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <SkeletonShimmer className="h-6 w-16 rounded-full mx-auto" />
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <SkeletonShimmer className="w-7 h-7 rounded-lg" />
                                                <SkeletonShimmer className="w-7 h-7 rounded-lg" />
                                                <SkeletonShimmer className="w-7 h-7 rounded-lg" />
                                                <SkeletonShimmer className="w-7 h-7 rounded-lg" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : admins.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400">
                                        <Users2 className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                        <span className="font-semibold text-gray-600 block text-sm">No administrators found</span>
                                        <span className="text-xs text-gray-400 mt-1 block">Try adjusting your filters or add a new administrator.</span>
                                    </td>
                                </tr>
                            ) : (
                                admins.map((admin) => {
                                    const isMaster = Number(admin.id) === 1;
                                    let adminPerms = {};
                                    if (admin.permissions) {
                                        try {
                                            adminPerms = typeof admin.permissions === 'string' ? JSON.parse(admin.permissions) : admin.permissions;
                                        } catch (e) {
                                            adminPerms = {};
                                        }
                                    }

                                    const isFullSuper = admin.role_title === 'Full Super Admin' || (Boolean(admin.is_super_admin) && admin.role_title === 'Master Super Admin');

                                    // Count active modules and granted actions
                                    const activeModules = PORTAL_MODULES.filter(m => {
                                        if (isFullSuper) return true;
                                        const p = adminPerms[m.id];
                                        return Boolean(p?.view || (p && Object.values(p).some(Boolean)));
                                    });

                                    let grantedActionsCount = 0;
                                    if (isFullSuper) {
                                        grantedActionsCount = TOTAL_AVAILABLE_ACTIONS;
                                    } else {
                                        PORTAL_MODULES.forEach(m => {
                                            const p = adminPerms[m.id] || {};
                                            m.actions.forEach(a => {
                                                if (p[a.id]) grantedActionsCount++;
                                            });
                                        });
                                    }

                                    return (
                                        <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                                            {/* Column 1: Admin Identity */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${isFullSuper
                                                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs'
                                                        : 'bg-blue-50 text-blue-700'
                                                        }`}>
                                                        {admin.first_name ? admin.first_name.charAt(0).toUpperCase() : 'A'}
                                                        {admin.last_name ? admin.last_name.charAt(0).toUpperCase() : ''}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-gray-900 truncate">
                                                                {admin.first_name} {admin.last_name}
                                                            </span>
                                                            {isMaster && (
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border-1 border-amber-200">
                                                                    Master
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5 truncate">
                                                            <span className="font-mono text-gray-600 truncate">{admin.email}</span>
                                                            {admin.phone && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{admin.phone_code || '+91'} {admin.phone}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 2: Role & Department */}
                                            <td className="py-4 px-4">
                                                <div className="space-y-1">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold ${isFullSuper
                                                        ? 'bg-indigo-50 text-indigo-700 border-1 border-indigo-100'
                                                        : 'bg-slate-100 text-slate-800'
                                                        }`}>
                                                        <Shield className="w-3 h-3 text-indigo-500" />
                                                        <span>{admin.role_title || 'Administrator'}</span>
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 block font-medium">
                                                        {admin.department || 'Operations'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Column 3: Module Permissions Chips */}
                                            <td className="py-4 px-4">
                                                {isFullSuper ? (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border-1 border-emerald-200 text-xs font-semibold">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span>Full Clearance (All 10 Modules • {TOTAL_AVAILABLE_ACTIONS} Actions)</span>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1.5 max-w-sm">
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className="font-bold text-gray-700">
                                                                {activeModules.length} Modules Active
                                                            </span>
                                                            <span className="text-gray-500 font-mono text-[10px]">
                                                                {grantedActionsCount} / {TOTAL_AVAILABLE_ACTIONS} actions
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {activeModules.slice(0, 4).map(m => (
                                                                <span
                                                                    key={m.id}
                                                                    className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-medium"
                                                                >
                                                                    {m.name.replace(' Page', '')}
                                                                </span>
                                                            ))}
                                                            {activeModules.length > 4 && (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-medium">
                                                                    +{activeModules.length - 4} more
                                                                </span>
                                                            )}
                                                            {activeModules.length === 0 && (
                                                                <span className="text-[11px] text-rose-500 italic">
                                                                    No modules assigned
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Column 4: Last Active */}
                                            <td className="py-4 px-4 text-gray-500">
                                                {(() => {
                                                    const rawDate = admin.last_active || admin.updated_at || admin.created_date || admin.permission_updated_at;
                                                    const { relative, exact, isOnline } = formatLastActive(rawDate);
                                                    return (
                                                        <div className="flex items-center gap-1.5" title={exact ? `Last Active: ${exact}` : ''}>
                                                            {isOnline ? (
                                                                <span className="relative flex h-2 w-2">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                                </span>
                                                            ) : (
                                                                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                            )}
                                                            <span className={`text-[11px] ${isOnline ? 'font-bold text-emerald-700' : 'text-gray-600'}`}>
                                                                {relative}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>

                                            {/* Column 5: Status */}
                                            <td className="py-4 px-4 text-center">
                                                {admin.is_active === 1 ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border-1 border-emerald-200">
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                        <span>Active</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <XCircle className="w-3 h-3 text-rose-600" />
                                                        <span>Suspended</span>
                                                    </span>
                                                )}
                                            </td>

                                            {/* Column 6: Actions */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenEdit(admin)}
                                                        className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                                        title="Edit Permissions & Details"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedAdmin(admin);
                                                            setNewPassword('');
                                                            setIsPasswordModalOpen(true);
                                                        }}
                                                        className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                                        title="Reset Password"
                                                    >
                                                        <KeyRound className="w-4 h-4" />
                                                    </button>

                                                    {!isMaster && (
                                                        <>
                                                            <button
                                                                onClick={() => handleToggleStatus(admin)}
                                                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${admin.is_active === 1
                                                                    ? 'text-gray-500 hover:text-amber-600 hover:bg-amber-50'
                                                                    : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                                                                    }`}
                                                                title={admin.is_active === 1 ? 'Suspend Account' : 'Activate Account'}
                                                            >
                                                                {admin.is_active === 1 ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setSelectedAdmin(admin);
                                                                    setIsDeleteModalOpen(true);
                                                                }}
                                                                className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                                title="Delete Administrator"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ============================================================ */}
            {/* 🛡️ MODAL: MANAGE PERMISSION & ADMINISTRATOR WORKFLOW */}
            {/* ============================================================ */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200 mt-0">
                    <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-gray-100 my-6 overflow-hidden flex flex-col max-h-[92vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsFormOpen(false)}
                                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <h3 className="text-lg font-bold text-gray-900 mb-0 flex items-center gap-2">
                                    <span>Manage Permission</span>
                                </h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                    Role: <span className="text-gray-900">{formData.is_super_admin ? 'Full Super Admin' : (formData.role_title || 'Sub-Admin')}</span>
                                </span>
                                {!formData.is_super_admin && (
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                        {activeActionsCount} / {TOTAL_AVAILABLE_ACTIONS} Actions Granted
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Modal Body & Sticky Footer */}
                        <form onSubmit={handleSaveAdmin} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Step 1: Personal Profile & Credentials */}
                                <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                        1. Administrator Credentials & Assignment
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-[13px] font-semibold text-gray-700 mb-1">First Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.first_name}
                                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                placeholder="e.g. Rahul"
                                                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-semibold text-gray-700 mb-1">Last Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.last_name}
                                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                placeholder="e.g. Sharma"
                                                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-semibold text-gray-700 mb-1">Official Email *</label>
                                            <input
                                                type="email"
                                                required
                                                disabled={Boolean(selectedAdmin)}
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="e.g. admin@careerfast.in"
                                                className={`w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-blue-500 ${selectedAdmin ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-semibold text-gray-700 mb-1">Phone Number</label>
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="e.g. 9876543210"
                                                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-semibold text-gray-700 mb-1">Role Title *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.role_title}
                                                onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                                                placeholder="e.g. HR / Moderator"
                                                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[13px] font-semibold text-gray-700 mb-1">Department *</label>
                                            <AdminSelect
                                                value={formData.department}
                                                onChange={(val) => setFormData({ ...formData, department: val })}
                                                options={MODAL_DEPARTMENT_OPTIONS}
                                                placeholder="Select Department"
                                                className="w-full"
                                            />
                                        </div>
                                        {!selectedAdmin && (
                                            <div className="sm:col-span-2">
                                                <label className="block text-[13px] font-semibold text-gray-700 mb-1">Initial Password *</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    placeholder="Min 6 characters initial password"
                                                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step 2: One-Click Clearance Presets */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0">
                                            2. Role Presets (Quick Setup)
                                        </h4>
                                        <span className="text-[11px] text-gray-400">Click a preset to quickly prefill permission checkboxes</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
                                        {ROLE_PRESETS.map((preset) => {
                                            const isSelected = preset.isSuper ? formData.is_super_admin : (!formData.is_super_admin && formData.role_title === preset.title);
                                            return (
                                                <div
                                                    key={preset.id}
                                                    onClick={() => handleApplyPreset(preset)}
                                                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${isSelected
                                                        ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/10 shadow-xs'
                                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <span className="text-sm font-bold text-gray-900 truncate">{preset.title}</span>
                                                        {isSelected && <Check className="w-3 h-3 text-blue-600 shrink-0" />}
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 line-clamp-2 mb-0 leading-tight">
                                                        {preset.desc}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Step 3: Module-Wise Action Grid */}
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0">
                                                3. Module-Wise Permissions Checklist
                                            </h4>
                                        </div>
                                        {!formData.is_super_admin && (
                                            <div className="flex items-center gap-3">
                                                <div className="relative min-w-[200px]">
                                                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                                    <input
                                                        type="text"
                                                        value={permSearchQuery}
                                                        onChange={(e) => setPermSearchQuery(e.target.value)}
                                                        placeholder="Filter actions (e.g. Approve, Resume, Delete)..."
                                                        className="w-full pl-8 pr-3 py-1 text-[11px] rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleGlobalBulk('grant_all')}
                                                    className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer border-0"
                                                >
                                                    Select All
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleGlobalBulk('clear')}
                                                    className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer border-0"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {formData.is_super_admin ? (
                                        <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-center gap-3 text-indigo-900">
                                            <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0" />
                                            <div>
                                                <strong className="block font-bold text-sm">Full Super Admin Clearance Active</strong>
                                                <span className="text-xs text-indigo-700">This administrator has unrestricted master clearance to view and execute every single feature and action across all 10 portal modules.</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {filteredModalModules.map((mod) => {
                                                const modPerms = formData.permissions?.[mod.id] || {};
                                                const allModActive = mod.actions.length > 0 && mod.actions.every(a => Boolean(modPerms[a.id]));
                                                const someModActive = mod.actions.some(a => Boolean(modPerms[a.id]));

                                                return (
                                                    <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs hover:border-gray-200 transition-colors">
                                                        {/* Module Section Header with Blue Accent Bar */}
                                                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100/80">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-1 h-5 bg-blue-600 rounded-full" />
                                                                <div className="flex items-center gap-2">
                                                                    <h5 className="text-sm font-bold text-gray-900 mb-0">
                                                                        {mod.name}
                                                                    </h5>
                                                                    <span className="text-[11px] text-gray-400 font-mono">
                                                                        ({mod.page})
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleModuleAll(mod.id)}
                                                                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline bg-transparent border-0 cursor-pointer"
                                                                >
                                                                    {allModActive ? 'Deselect All' : 'Select All'}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Actions Checkbox Grid (3 Columns Responsive) */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {mod.actions.map((act) => {
                                                                const isChecked = Boolean(modPerms[act.id]);
                                                                return (
                                                                    <label
                                                                        key={act.id}
                                                                        className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${isChecked
                                                                            ? 'bg-blue-50/50 border-blue-200/90 text-gray-900 shadow-xs ring-1 ring-blue-500/10'
                                                                            : 'bg-gray-50/40 border-gray-200/60 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                                                            }`}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isChecked}
                                                                            onChange={() => handleToggleAction(mod.id, act.id)}
                                                                            className="w-4 h-4 text-blue-600 rounded-md border-gray-300 focus:ring-blue-500 cursor-pointer mt-0.5 shrink-0"
                                                                        />
                                                                        <div className="min-w-0 flex-1">
                                                                            <span className={`text-xs block leading-tight ${isChecked ? 'font-semibold text-blue-900' : 'font-medium text-gray-700'}`}>
                                                                                {act.label}
                                                                            </span>
                                                                            <span className="text-[10px] text-gray-400 block mt-0.5 line-clamp-1">
                                                                                {act.desc}
                                                                            </span>
                                                                        </div>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pinned Sticky Modal Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-white rounded-b-3xl">
                                <div className="text-xs text-gray-500 font-normal">
                                    {!formData.is_super_admin ? (
                                        <span>Configured <strong className="text-gray-900 font-bold">{activeActionsCount}</strong> specific permissions</span>
                                    ) : (
                                        <span className="text-indigo-600 font-semibold">Unrestricted Master Super Admin Clearance</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsFormOpen(false)}
                                        className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer border-0"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[#5252d4] hover:bg-[#4343b8] text-white text-sm font-bold rounded-xl transition-all shadow-md cursor-pointer border-0"
                                    >
                                        {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                                        <span>Save</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* 🔑 MODAL: RESET PASSWORD */}
            {/* ============================================================ */}
            {isPasswordModalOpen && selectedAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200 mt-0">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                    <KeyRound className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-0">Reset Password</h3>
                                    <p className="text-[11px] text-gray-400 mb-0">{selectedAdmin.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsPasswordModalOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">New Secure Password</label>
                            <input
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password (min 6 chars)"
                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500 font-mono"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">
                                The administrator will use this new password to log in to the Super Admin portal.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                onClick={() => setIsPasswordModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResetPassword}
                                disabled={actionLoading}
                                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl shadow-xs"
                            >
                                {actionLoading ? 'Updating...' : 'Confirm Reset Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* 🗑️ MODAL: DELETE CONFIRMATION */}
            {/* ============================================================ */}
            {isDeleteModalOpen && selectedAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200 mt-0">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mx-auto">
                            <Trash2 className="w-6 h-6" />
                        </div>

                        <div className="text-center">
                            <h3 className="text-base font-bold text-gray-900 mb-1">Delete Administrator?</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Are you sure you want to permanently delete account for <strong className="text-gray-900">{selectedAdmin.first_name} {selectedAdmin.last_name}</strong> (<span className="font-mono">{selectedAdmin.email}</span>)? This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAdmin}
                                disabled={actionLoading}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
                            >
                                {actionLoading ? 'Deleting...' : 'Delete Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
