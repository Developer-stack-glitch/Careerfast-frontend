'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
    ShieldCheck, ShieldAlert, KeyRound, Plus, Search, Filter,
    CheckCircle2, XCircle, MoreVertical, Edit3, Trash2, Lock, Unlock,
    Eye, Check, X, RefreshCw, Mail, Phone, Calendar, Clock,
    LayoutDashboard, Sparkles, Layers, Building2, Briefcase, Users,
    MessageSquare, Settings, UserCheck, ChevronDown, AlertCircle, Shield,
    SlidersHorizontal, CheckSquare, Square, Download, FileSpreadsheet,
    ArrowUpDown, LogIn, ExternalLink, Copy, HelpCircle, ArrowRight
} from 'lucide-react';
import {
    getAdminRoles,
    createAdminRole,
    updateAdminRole,
    deleteAdminRole
} from '../ApiService/action';
import AdminSelect from './AdminSelect';
import { AdminUserManagementSkeleton } from './AdminSkeletons';
import toast from 'react-hot-toast';
import useAdminPermissions from './useAdminPermissions';

// ── Navigation Category Groups ──
export const MODULE_CATEGORIES = [
    {
        id: 'DASHBOARD',
        title: 'DASHBOARD',
        description: 'Recruiter overview, candidate statistics, live platform counters & growth curves.',
        color: 'text-blue-700 bg-blue-50 border-blue-200'
    },
    {
        id: 'RECRUITER MANAGEMENT',
        title: 'RECRUITER MANAGEMENT',
        description: 'Corporate accounts, auto-approvals, job listings moderation & pricing subscriptions.',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
        id: 'TALENT MANAGEMENT',
        title: 'TALENT MANAGEMENT',
        description: 'Candidate directory, talent verification, resume downloads & candidate memberships.',
        color: 'text-amber-700 bg-amber-50 border-amber-200'
    },
    {
        id: 'REPORT',
        title: 'REPORT',
        description: 'Business intelligence, employer growth trends, candidate analytics & placement metrics.',
        color: 'text-purple-700 bg-purple-50 border-purple-200'
    },
    {
        id: 'SYSTEM',
        title: 'SYSTEM',
        description: 'Customer helpdesk tickets, staff accounts, dynamic roles & platform settings.',
        color: 'text-slate-700 bg-slate-100 border-slate-200'
    }
];

// ── Master Portal Permissions Matrix (12 Modules, Grouped per Page Structure) ──
export const PORTAL_MODULES = [
    // ── DASHBOARD ──
    {
        id: 'dashboard_recruiter',
        group: 'DASHBOARD',
        name: 'Recruiters Dashboard',
        page: '/admin/dashboard/recruiter',
        description: 'Executive overview, corporate KPIs, platform growth trajectories, recruiter demographics and live activity.',
        icon: LayoutDashboard,
        color: 'text-blue-600 bg-blue-50 border-blue-100',
        actions: [
            { id: 'scoreboard_kpis', label: 'Score Board & Top KPI Cards', desc: 'Total users, active jobs, applications counters' },
            { id: 'growth_trends', label: 'Platform Growth Trends Chart', desc: 'Monthly/Weekly user signup trajectories' },
            { id: 'demographics_breakdown', label: 'User Demographics Donut', desc: 'Job seekers vs recruiter ratios & breakdown' },
            { id: 'recent_activity_feed', label: 'Recent Platform Activity Stream', desc: 'Live actions, registrations, posts feed' },
            { id: 'export_dashboard_pdf', label: 'Export Executive Dashboard Report', desc: 'Download PDF/CSV snapshot' },
            { id: 'realtime_stat_refresh', label: 'Realtime Manual Refresh Action', desc: 'Force reload dashboard metrics' },
        ]
    },
    {
        id: 'dashboard_job_seekers',
        group: 'DASHBOARD',
        name: 'Job Seekers Dashboard',
        page: '/admin/dashboard/job-seekers',
        description: 'Candidate talent analytics, registration growth curves, skill breakdowns and application flow.',
        icon: Users,
        color: 'text-sky-600 bg-sky-50 border-sky-100',
        actions: [
            { id: 'job_seekers_kpis', label: 'Candidate Score Board & Top KPIs', desc: 'Total talent, active applicants, verified profiles' },
            { id: 'talent_registration_chart', label: 'Talent Registration & Growth Chart', desc: 'Candidate acquisition trajectory curves' },
            { id: 'skills_education_breakdown', label: 'Skills & Education Distribution', desc: 'Candidate specialization donut charts' },
            { id: 'recent_talent_activity', label: 'Recent Talent Activity Stream', desc: 'New registrations, profile updates, applications' },
            { id: 'export_talent_stats', label: 'Export Talent Dashboard Snapshot', desc: 'Download candidate metrics summary' },
            { id: 'realtime_talent_refresh', label: 'Realtime Manual Refresh Action', desc: 'Force reload candidate metrics' },
        ]
    },

    // ── RECRUITER MANAGEMENT ──
    {
        id: 'recruiters',
        group: 'RECRUITER MANAGEMENT',
        name: 'Recruiters & Companies',
        page: '/admin/recruiters',
        description: 'Manage employer profiles, extend subscription validity, assign custom plans, and auto-approve posts.',
        icon: Building2,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        actions: [
            { id: 'view_recruiters_directory', label: 'Recruiter Directory & Metrics Table', desc: 'Browse employer accounts and profiles' },
            { id: 'add_recruiter_button', label: 'Add Recruiter Button', desc: 'Onboard new employer account manually' },
            { id: 'view_recruiter_profile', label: 'View Recruiter Profile & Stats', desc: 'Company details, jobs and history' },
            { id: 'edit_recruiter_profile', label: 'Edit Recruiter & Company Info', desc: 'Modify corporate details & branding' },
            { id: 'toggle_recruiter_status', label: 'Toggle Account Active / Suspended', desc: 'Control employer account access' },
            { id: 'toggle_auto_approve', label: 'Toggle Auto-Approve Job Posts', desc: 'Bypass job moderation queue' },
            { id: 'change_plan_modal', label: 'Change Recruiter Plan Modal', desc: 'Upgrade / downgrade subscription package' },
            { id: 'assign_custom_plan_modal', label: 'Assign Custom Plan & Feature Quotas', desc: 'Custom jobs, validity & tools limits' },
            { id: 'extend_subscription_modal', label: 'Extend Subscription Expiry Date', desc: 'Grant validity extension to employer' },
            { id: 'reset_recruiter_password', label: 'Reset Recruiter Password Button', desc: 'Issue new password credentials' },
            { id: 'login_as_recruiter_button', label: 'Login As Recruiter (Direct SSO)', desc: 'Impersonate employer dashboard' },
            { id: 'manage_recruiter_team', label: 'Manage Recruiter Sub-Recruiters', desc: 'Team member permissions & access' },
            { id: 'export_recruiters_data', label: 'Export Recruiter Directory to Excel', desc: 'Download company roster file' },
        ]
    },
    {
        id: 'job_posts',
        group: 'RECRUITER MANAGEMENT',
        name: 'Job Listings & Moderation',
        page: '/admin/job-post',
        description: 'Review active postings, moderate pending jobs queue, bulk approve, reject with notes, and expire listings.',
        icon: Briefcase,
        color: 'text-violet-600 bg-violet-50 border-violet-100',
        actions: [
            { id: 'view_job_directory', label: 'View Active & Expired Job Postings', desc: 'Browse published jobs directory' },
            { id: 'view_pending_jobs', label: 'Pending Jobs Moderation Queue Tab', desc: 'Review jobs awaiting admin approval' },
            { id: 'approve_single_job', label: 'Approve Single Job Post', desc: 'Publish individual listing to portal' },
            { id: 'bulk_approve_all_jobs', label: 'Bulk Approve All Pending Jobs', desc: 'One-click publish all pending listings' },
            { id: 'reject_job_post', label: 'Reject / Disapprove Job Post', desc: 'Decline posting with rejection reason' },
            { id: 'view_job_details_modal', label: 'View Full Job Details & Description', desc: 'Inspect full job post specifications' },
            { id: 'edit_job_post', label: 'Edit Job Details & Requirements', desc: 'Modify title, salary, location & skills' },
            { id: 'toggle_job_active', label: 'Toggle Job Active / Inactive', desc: 'Reactivate expired job listings' },
            { id: 'expire_job_post', label: 'Expire Job Post Listing', desc: 'Manually close candidate applications' },
            { id: 'delete_job_post', label: 'Delete Job Post Listing', desc: 'Permanently remove job from system' },
            { id: 'view_job_applicants', label: 'View Applied Candidates for Job', desc: 'Inspect candidates for this opening' },
        ]
    },
    {
        id: 'plans',
        group: 'RECRUITER MANAGEMENT',
        name: 'Recruiter Subscriptions',
        page: '/admin/plans',
        description: 'Manage employer pricing packages, validity duration, job posting limits, and active subscriber rosters.',
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

    // ── TALENT MANAGEMENT ──
    {
        id: 'job_seekers',
        group: 'TALENT MANAGEMENT',
        name: 'Job Seekers & Talent Pool',
        page: '/admin/job-seekers',
        description: 'Browse candidate talent directory, review credentials, verify trust badges, download resumes, and moderate accounts.',
        icon: Users,
        color: 'text-amber-600 bg-amber-50 border-amber-100',
        actions: [
            { id: 'view_seekers_directory', label: 'View Job Seekers Directory', desc: 'Browse candidate profiles table' },
            { id: 'view_candidate_profile_full', label: 'View Full Candidate Profile Details', desc: 'Inspect candidate portfolio & career data' },
            { id: 'download_candidate_resume', label: 'Download Candidate Resume / CV', desc: 'Access candidate documents' },
            { id: 'verify_candidate_profile_badge', label: 'Verify / Unverify Candidate Badge', desc: 'Trust badge moderation' },
            { id: 'toggle_candidate_account_status', label: 'Toggle Job Seeker Active / Suspended', desc: 'Ban / unban candidates' },
            { id: 'export_candidates_roster', label: 'Export Candidate Directory to Excel', desc: 'Export job seekers data file' },
            { id: 'delete_candidate_profile', label: 'Delete Candidate Account Permanently', desc: 'Purge candidate profile from system' },
        ]
    },
    {
        id: 'talent_subscriptions',
        group: 'TALENT MANAGEMENT',
        name: 'Talent Subscriptions',
        page: '/admin/talent/subscriptions',
        description: 'Manage candidate premium membership tiers, resume spotlight features, and candidate subscription history.',
        icon: Layers,
        color: 'text-teal-600 bg-teal-50 border-teal-100',
        actions: [
            { id: 'view_talent_subscriptions', label: 'View Talent Memberships & Plans', desc: 'Browse candidate pro tiers' },
            { id: 'manage_talent_tiers', label: 'Add & Edit Talent Subscription Tiers', desc: 'Configure pricing & perks' },
            { id: 'view_talent_subscribers', label: 'View Active Pro Job Seekers', desc: 'Browse paid candidate subscribers' },
            { id: 'grant_talent_pro_access', label: 'Grant Complimentary Pro Validity', desc: 'Manual activation for candidates' },
            { id: 'export_talent_subscriptions', label: 'Export Talent Subscription Records', desc: 'Download CSV financial data' },
        ]
    },

    // ── REPORT ──
    {
        id: 'report_recruiters',
        group: 'REPORT',
        name: 'Recruiter Reports & Analytics',
        page: '/admin/reports/recruiters',
        description: 'Comprehensive business intelligence, employer acquisition, job post moderation trends and pipeline data.',
        icon: Sparkles,
        color: 'text-purple-600 bg-purple-50 border-purple-100',
        actions: [
            { id: 'view_growth_charts', label: 'User Growth & Velocity Analysis', desc: 'Deep dive user trajectory graphs' },
            { id: 'recruiter_metrics', label: 'Recruiter Activity & Conversion', desc: 'Employer onboarding and retention rates' },
            { id: 'jobs_performance_analytics', label: 'Job Moderation & Status Trends', desc: 'Category-wise posting distribution' },
            { id: 'applications_pipeline_funnel', label: 'Applications Pipeline Funnel', desc: 'Applicant conversion metrics' },
            { id: 'export_analytics_excel', label: 'Export Analytics to Excel / CSV', desc: 'Raw analytical data export' },
            { id: 'user_retention_cohorts', label: 'Retention & Cohort Heatmap', desc: 'Monthly user retention analysis' },
            { id: 'revenue_forecasts', label: 'Revenue & Subscription Forecasts', desc: 'Financial estimations' },
        ]
    },
    {
        id: 'report_job_seekers',
        group: 'REPORT',
        name: 'Job Seeker Reports',
        page: '/admin/reports/job-seekers',
        description: 'Candidate demographics, application submission rates, job seeker search analytics, and placement metrics reports.',
        icon: FileSpreadsheet,
        color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100',
        actions: [
            { id: 'view_candidate_growth_report', label: 'Candidate Registration & Growth Trajectory', desc: 'Signups by region and channel' },
            { id: 'skills_demand_analytics', label: 'Skills Demand vs Talent Supply Analytics', desc: 'Market matching intelligence' },
            { id: 'application_submission_trends', label: 'Application Submission & Placement Rates', desc: 'Candidate success metrics' },
            { id: 'resume_download_audit_report', label: 'Resume Downloads & Profile Views Report', desc: 'Recruiter engagement with talent' },
            { id: 'export_job_seekers_report', label: 'Export Job Seekers Report to Excel', desc: 'Download detailed talent analytics' },
        ]
    },

    // ── SYSTEM ──
    {
        id: 'support',
        group: 'SYSTEM',
        name: 'Support Tickets & Help Desk',
        page: '/admin/support',
        description: 'Manage incoming user inquiries, reply to tickets, assign agents, and close issues.',
        icon: MessageSquare,
        color: 'text-rose-600 bg-rose-50 border-rose-100',
        actions: [
            { id: 'view_all_tickets', label: 'View All Support Inquiries & Tickets', desc: 'Access helpdesk queue' },
            { id: 'filter_by_ticket_status', label: 'Filter Tickets by Open / Pending / Closed', desc: 'Sort inquiries' },
            { id: 'reply_to_ticket_thread', label: 'Reply & Send Response to Ticket', desc: 'Official customer messaging' },
            { id: 'change_ticket_priority_status', label: 'Update Priority & Ticket Category', desc: 'Triage ticket urgency' },
            { id: 'assign_ticket_to_agent', label: 'Assign Ticket to Sub-Admin Agent', desc: 'Delegate support tasks' },
            { id: 'close_resolve_ticket', label: 'Mark Ticket Resolved / Closed', desc: 'Complete issue lifecycle' },
            { id: 'delete_support_ticket', label: 'Delete Support Ticket Record', desc: 'Purge obsolete inquiries' },
        ]
    },
    {
        id: 'user_management',
        group: 'SYSTEM',
        name: 'Users & Roles Management',
        page: '/admin/users',
        description: 'Create sub-administrators, assign security clearances, configure staff accounts.',
        icon: UserCheck,
        color: 'text-sky-600 bg-sky-50 border-sky-100',
        actions: [
            { id: 'view_subadmin_roster', label: 'View Administrator Directory', desc: 'Browse internal staff accounts' },
            { id: 'create_subadmin_account', label: 'Create New Sub-Administrator Account', desc: 'Add new staff members' },
            { id: 'edit_subadmin_details', label: 'Edit Administrator Info & Role', desc: 'Update title and profile' },
            { id: 'modify_security_permissions', label: 'Configure Granular Security Permissions', desc: 'Access control checklist' },
            { id: 'suspend_subadmin_account', label: 'Suspend / Reactivate Administrator Access', desc: 'Freeze staff login' },
            { id: 'reset_subadmin_password', label: 'Reset Administrator Password', desc: 'Issue new password' },
            { id: 'delete_subadmin_account', label: 'Delete Administrator Account', desc: 'Permanently remove staff' },
            { id: 'export_audit_logs', label: 'Export Security Audit Logs', desc: 'Download system actions' },
        ]
    },
    {
        id: 'roles_permissions',
        group: 'SYSTEM',
        name: 'Roles & Permissions',
        page: '/admin/roles-permissions',
        description: 'Design dynamic roles, define granular module permissions, manage security access templates.',
        icon: ShieldCheck,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        actions: [
            { id: 'view_roles_matrix', label: 'View Roles Directory & Permission Matrix', desc: 'Browse configured dynamic roles' },
            { id: 'create_custom_role', label: 'Create New Dynamic Custom Role', desc: 'Build custom role templates' },
            { id: 'edit_role_permissions', label: 'Edit Role Info & Module Permissions', desc: 'Modify security checklists' },
            { id: 'clone_role_template', label: 'Clone / Duplicate Existing Role', desc: 'Fast-track role creation' },
            { id: 'delete_custom_role', label: 'Delete Dynamic Custom Role', desc: 'Remove unused roles' },
            { id: 'export_roles_overview', label: 'Export Roles & Clearances Report', desc: 'Download security clearance PDF/Excel' },
        ]
    },
    {
        id: 'settings',
        group: 'SYSTEM',
        name: 'Platform Settings & Config',
        page: '/admin/general',
        description: 'System configurations, company branding, SMTP delivery, and maintenance tools.',
        icon: Settings,
        color: 'text-slate-600 bg-slate-50 border-slate-100',
        actions: [
            { id: 'view_system_settings', label: 'View General Platform Settings', desc: 'Inspect configurations' },
            { id: 'modify_company_info', label: 'Update Company Branding & Support Email', desc: 'Branding adjustments' },
            { id: 'configure_smtp_email', label: 'Configure SMTP & Delivery Gateways', desc: 'Transactional mail config' },
            { id: 'manage_integrations', label: 'Manage Third-Party Integrations', desc: 'Configure Firebase / WhatsApp' },
            { id: 'system_maintenance', label: 'Cache & Database Maintenance', desc: 'Clear cache and diagnostics' },
        ]
    }
];

const TOTAL_AVAILABLE_ACTIONS = PORTAL_MODULES.reduce((sum, m) => sum + m.actions.length, 0);

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

// Quick Preset Templates
const PRESET_TEMPLATES = [
    {
        title: 'Full Super Admin',
        desc: 'Unrestricted master clearance across all 5 navigation groups and modules',
        isSuper: true,
        generate: () => {
            const perms = {};
            PORTAL_MODULES.forEach(mod => {
                const modPerms = { view: true, create_edit: true, delete: true };
                mod.actions.forEach(act => { modPerms[act.id] = true; });
                perms[mod.id] = modPerms;
            });
            return perms;
        }
    },
    {
        title: 'Operations Manager',
        desc: 'Dashboards, Recruiters, Job Posts, Subscriptions, Talent Pool & Support',
        isSuper: false,
        generate: () => {
            const perms = {};
            const opMods = ['dashboard_recruiter', 'dashboard_job_seekers', 'recruiters', 'job_posts', 'plans', 'job_seekers', 'talent_subscriptions', 'support'];
            PORTAL_MODULES.forEach(mod => {
                const isOp = opMods.includes(mod.id);
                const modPerms = { view: isOp, create_edit: isOp, delete: false };
                mod.actions.forEach(act => {
                    if (isOp && !act.id.includes('delete') && !act.id.includes('reset')) {
                        modPerms[act.id] = true;
                    }
                });
                perms[mod.id] = modPerms;
            });
            return perms;
        }
    },
    {
        title: 'Job & Content Moderator',
        desc: 'Job listings moderation queue, approval/rejection, candidate badges, and support tickets',
        isSuper: false,
        generate: () => {
            const perms = {};
            const modMods = ['dashboard_recruiter', 'job_posts', 'job_seekers', 'support'];
            PORTAL_MODULES.forEach(mod => {
                const isMod = modMods.includes(mod.id);
                const modPerms = { view: isMod, create_edit: isMod, delete: false };
                mod.actions.forEach(act => {
                    if (['view_job_directory', 'view_pending_jobs', 'approve_single_job', 'bulk_approve_all_jobs', 'reject_job_post', 'view_job_details_modal', 'view_seekers_directory', 'view_candidate_profile_full', 'verify_candidate_profile_badge', 'view_all_tickets', 'reply_to_ticket_thread', 'scoreboard_kpis'].includes(act.id)) {
                        modPerms[act.id] = true;
                    }
                });
                perms[mod.id] = modPerms;
            });
            return perms;
        }
    },
    {
        title: 'Billing & Subscriptions Admin',
        desc: 'Recruiter & candidate subscription packages, quotas, validity extension & revenue reports',
        isSuper: false,
        generate: () => {
            const perms = {};
            const billMods = ['dashboard_recruiter', 'plans', 'talent_subscriptions', 'recruiters', 'report_recruiters'];
            PORTAL_MODULES.forEach(mod => {
                const isBill = billMods.includes(mod.id);
                const modPerms = { view: isBill, create_edit: isBill, delete: false };
                mod.actions.forEach(act => {
                    if (['view_plans_table', 'add_plan_button', 'edit_plan_details', 'duplicate_plan_action', 'view_plan_subscribers', 'view_talent_subscriptions', 'manage_talent_tiers', 'view_talent_subscribers', 'grant_talent_pro_access', 'export_talent_subscriptions', 'change_plan_modal', 'assign_custom_plan_modal', 'extend_subscription_modal', 'export_recruiters_data', 'view_recruiters_directory', 'scoreboard_kpis', 'recruiter_metrics', 'revenue_forecasts'].includes(act.id)) {
                        modPerms[act.id] = true;
                    }
                });
                perms[mod.id] = modPerms;
            });
            return perms;
        }
    },
    {
        title: 'Customer Support Lead',
        desc: 'Support inquiries queue, ticket replies, triage status, and candidate/employer profile viewing',
        isSuper: false,
        generate: () => {
            const perms = {};
            const supMods = ['dashboard_recruiter', 'support', 'job_seekers', 'recruiters'];
            PORTAL_MODULES.forEach(mod => {
                const isSup = supMods.includes(mod.id);
                const modPerms = { view: isSup, create_edit: isSup, delete: false };
                mod.actions.forEach(act => {
                    if (['view_all_tickets', 'filter_by_ticket_status', 'reply_to_ticket_thread', 'change_ticket_priority_status', 'assign_ticket_to_agent', 'close_resolve_ticket', 'view_seekers_directory', 'view_candidate_profile_full', 'view_recruiters_directory', 'view_recruiter_profile', 'scoreboard_kpis'].includes(act.id)) {
                        modPerms[act.id] = true;
                    }
                });
                perms[mod.id] = modPerms;
            });
            return perms;
        }
    },
    {
        title: 'Read-Only Auditor',
        desc: 'View-only visibility across platform reports, dashboards, jobs and candidate rosters',
        isSuper: false,
        generate: () => {
            const perms = {};
            PORTAL_MODULES.forEach(mod => {
                const modPerms = { view: true, create_edit: false, delete: false };
                mod.actions.forEach(act => {
                    if (act.id.startsWith('view_') || act.id.includes('metrics') || act.id.includes('scoreboard') || act.id.includes('chart') || act.id.includes('analytics') || act.id.includes('report')) {
                        modPerms[act.id] = true;
                    }
                });
                perms[mod.id] = modPerms;
            });
            return perms;
        }
    }
];

export default function RolesPermissions() {
    const { isSuperAdmin, currentUser } = useAdminPermissions();

    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');

    // Modal state for Create / Edit Role
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [roleTitle, setRoleTitle] = useState('');
    const [department, setDepartment] = useState('Operations');
    const [description, setDescription] = useState('');
    const [isSuperRole, setIsSuperRole] = useState(false);
    const [permissions, setPermissions] = useState({});
    const [searchPermissionQuery, setSearchPermissionQuery] = useState('');
    const [selectedPreset, setSelectedPreset] = useState(null);

    // Delete confirmation modal
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, role: null });

    // Fetch Roles
    const fetchRoles = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getAdminRoles();
            if (res?.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
                setRoles(res.data.data);
                return;
            }
        } catch (error) {
            // Silently fallback to preset template roles
        } finally {
            setLoading(false);
        }

        // Fallback default roles if backend is restarting
        const fallbackList = PRESET_TEMPLATES.map((t, idx) => ({
            id: idx + 1,
            role_name: t.title,
            role_title: t.title,
            description: t.desc,
            department: idx === 0 || idx === 4 ? 'Executive Management' : idx === 1 ? 'Operations' : idx === 2 ? 'Moderation & Quality' : 'Finance & Billing',
            is_super_admin: t.isSuper ? 1 : 0,
            is_system_role: 1,
            permissions: t.generate(),
            user_count: 0
        }));
        setRoles(fallbackList);
    }, []);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    // Open Modal for Create
    const handleOpenCreateModal = () => {
        setEditingRole(null);
        setRoleTitle('');
        setDepartment('Operations');
        setDescription('');
        setIsSuperRole(false);
        setSelectedPreset(null);

        // Initialize default empty permissions
        const initialPerms = {};
        PORTAL_MODULES.forEach(mod => {
            initialPerms[mod.id] = { view: false, create_edit: false, delete: false };
        });
        setPermissions(initialPerms);
        setSearchPermissionQuery('');
        setIsRoleModalOpen(true);
    };

    // Open Modal for Edit
    const handleOpenEditModal = (role) => {
        setEditingRole(role);
        setRoleTitle(role.role_title || role.role_name);
        setDepartment(role.department || 'Operations');
        setDescription(role.description || '');
        setIsSuperRole(Boolean(role.is_super_admin));

        const matchedPreset = PRESET_TEMPLATES.find(
            p => p.title.toLowerCase() === (role.role_title || role.role_name || '').toLowerCase()
        );
        setSelectedPreset(matchedPreset ? matchedPreset.title : (Boolean(role.is_super_admin) ? 'Full Super Admin' : null));

        let existingPerms = role.permissions || {};
        if (typeof existingPerms === 'string') {
            try { existingPerms = JSON.parse(existingPerms); } catch (e) { existingPerms = {}; }
        }
        setPermissions(existingPerms);
        setSearchPermissionQuery('');
        setIsRoleModalOpen(true);
    };

    // Apply Preset
    const applyPreset = (preset) => {
        setSelectedPreset(preset.title);
        const generated = preset.generate();
        setPermissions(generated);
        setIsSuperRole(Boolean(preset.isSuper));
        setRoleTitle(preset.title);
        if (!description || description.trim() === '') {
            setDescription(preset.desc);
        }
        toast.success(`Loaded permissions from "${preset.title}" preset`);
    };

    // Toggle specific action permission
    const toggleAction = (moduleId, actionId) => {
        if (isSuperRole) return;
        setPermissions(prev => {
            const currentMod = prev[moduleId] || { view: false, create_edit: false, delete: false };
            const isCurrentlyChecked = Boolean(currentMod[actionId]);
            const newChecked = !isCurrentlyChecked;

            const updatedMod = {
                ...currentMod,
                [actionId]: newChecked,
            };

            // If action enabled, ensure module view is enabled
            if (newChecked) {
                updatedMod.view = true;
            }

            return {
                ...prev,
                [moduleId]: updatedMod
            };
        });
    };

    // Toggle entire module
    const toggleModuleAll = (moduleId, enableAll) => {
        if (isSuperRole) return;
        setPermissions(prev => {
            const modConfig = PORTAL_MODULES.find(m => m.id === moduleId);
            if (!modConfig) return prev;

            const updatedMod = {
                view: enableAll,
                create_edit: enableAll,
                delete: enableAll
            };

            modConfig.actions.forEach(act => {
                updatedMod[act.id] = enableAll;
            });

            return {
                ...prev,
                [moduleId]: updatedMod
            };
        });
    };

    // Toggle all modules in a specific Navigation Group
    const toggleGroupAll = (groupId, enableAll) => {
        if (isSuperRole) return;
        setPermissions(prev => {
            const next = { ...prev };
            PORTAL_MODULES.filter(m => m.group === groupId).forEach(mod => {
                const updatedMod = {
                    view: enableAll,
                    create_edit: enableAll,
                    delete: enableAll
                };
                mod.actions.forEach(act => {
                    updatedMod[act.id] = enableAll;
                });
                next[mod.id] = updatedMod;
            });
            return next;
        });
    };

    // Select All across all modules
    const handleSelectAllGlobal = () => {
        if (isSuperRole) return;
        const allPerms = {};
        PORTAL_MODULES.forEach(mod => {
            const modPerms = { view: true, create_edit: true, delete: true };
            mod.actions.forEach(act => { modPerms[act.id] = true; });
            allPerms[mod.id] = modPerms;
        });
        setPermissions(allPerms);
        toast.success('Granted all permissions');
    };

    // Clear All across all modules
    const handleClearAllGlobal = () => {
        if (isSuperRole) return;
        const emptyPerms = {};
        PORTAL_MODULES.forEach(mod => {
            emptyPerms[mod.id] = { view: false, create_edit: false, delete: false };
        });
        setPermissions(emptyPerms);
        toast.success('Cleared all permissions');
    };

    // Count currently granted actions in modal
    const currentGrantedCount = useMemo(() => {
        if (isSuperRole) return TOTAL_AVAILABLE_ACTIONS;
        let count = 0;
        PORTAL_MODULES.forEach(mod => {
            const modPerms = permissions[mod.id] || {};
            mod.actions.forEach(act => {
                if (modPerms[act.id]) count++;
            });
        });
        return count;
    }, [permissions, isSuperRole]);

    // Submit Role Form
    const handleSaveRole = async (e) => {
        e.preventDefault();
        if (!roleTitle.trim()) {
            toast.error('Please enter a role title.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                role_name: roleTitle.trim(),
                role_title: roleTitle.trim(),
                department,
                description: description.trim(),
                is_super_admin: isSuperRole ? 1 : 0,
                permissions: permissions
            };

            if (editingRole) {
                await updateAdminRole(editingRole.id, payload);
                toast.success(`Role "${roleTitle}" updated successfully!`);
            } else {
                await createAdminRole(payload);
                toast.success(`New Role "${roleTitle}" created successfully!`);
            }

            setIsRoleModalOpen(false);
            fetchRoles();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to save role.');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Delete Role
    const handleConfirmDelete = async () => {
        if (!deleteModal.role) return;
        try {
            await deleteAdminRole(deleteModal.role.id);
            toast.success(`Role "${deleteModal.role.role_title}" deleted.`);
            setDeleteModal({ isOpen: false, role: null });
            fetchRoles();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete role.');
        }
    };

    // Filter roles
    const filteredRoles = useMemo(() => {
        return roles.filter(r => {
            const matchSearch = (r.role_title || r.role_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.department || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchDept = selectedDepartment === 'all' || r.department === selectedDepartment;
            return matchSearch && matchDept;
        });
    }, [roles, searchTerm, selectedDepartment]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">System</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Roles & Permissions</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2 mb-0">
                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                        Roles & Permissions Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5 mb-0">
                        Create custom dynamic roles and configure module-level security clearances. Dynamic roles created here can be assigned directly to administrators.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/users"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border-1 border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl shadow-xs transition-all no-underline"
                    >
                        <Users className="w-3.5 h-3.5 text-gray-500" />
                        Manage Users
                    </Link>

                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-xl shadow-xs shadow-blue-500/20 transition-all cursor-pointer border-0"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Role
                    </button>
                </div>
            </div>

            {/* Quick Helper Banner */}
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-1 border-blue-100 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5 sm:mt-0">
                        <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold mb-0 text-gray-900">How Dynamic Role Assignment Works</h4>
                        <p className="text-xs text-gray-600 mt-0.5 mb-0">
                            Roles defined below appear automatically in the <strong>Role Selection Dropdown</strong> when creating or editing administrators in <Link href="/admin/users" className="text-blue-600 font-semibold underline">Users & Roles</Link>.
                        </p>
                    </div>
                </div>
                <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap bg-white px-3 py-1.5 rounded-lg border-1 border-blue-200/80 shadow-xs no-underline"
                >
                    Go to Users & Roles
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-3.5 rounded-xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search roles by title, department or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/60 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-sm outline-none transition-all"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs border-0 bg-transparent cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="w-48">
                        <AdminSelect
                            value={selectedDepartment}
                            onChange={setSelectedDepartment}
                            options={DEPARTMENT_OPTIONS}
                            icon={Filter}
                            size="sm"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={fetchRoles}
                        className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                        title="Refresh Roles"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Roles Grid Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                        <div key={n} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                            <div className="h-5 bg-gray-100 rounded w-1/2 mb-3"></div>
                            <div className="h-4 bg-gray-100 rounded w-3/4 mb-4"></div>
                            <div className="h-8 bg-gray-50 rounded w-full"></div>
                        </div>
                    ))}
                </div>
            ) : filteredRoles.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">No Roles Found</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                        {searchTerm || selectedDepartment !== 'all'
                            ? 'No roles matched your search query or department filter.'
                            : 'No dynamic roles exist in the database yet.'}
                    </p>
                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer border-0"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Create First Role
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRoles.map(role => {
                        const isSuper = Boolean(role.is_super_admin);
                        const isSystem = Boolean(role.is_system_role);
                        const grantedCount = isSuper ? TOTAL_AVAILABLE_ACTIONS : (role.granted_actions_count || 0);
                        const percentage = Math.round((grantedCount / TOTAL_AVAILABLE_ACTIONS) * 100);

                        return (
                            <div
                                key={role.id}
                                className="bg-white rounded-xl shadow-xs transition-all flex flex-col justify-between overflow-hidden group"
                            >
                                <div className="p-4">
                                    {/* Top Row: Department & Status Badges */}
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200/60">
                                            {role.department || 'Operations'}
                                        </span>

                                        {isSuper ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border-1 border-purple-200">
                                                <Sparkles className="w-3 h-3 text-purple-600" />
                                                Full Master Access
                                            </span>
                                        ) : isSystem ? (
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border1 border-blue-200">
                                                System Default Role
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border-1 border-emerald-200">
                                                Custom Dynamic Role
                                            </span>
                                        )}
                                    </div>

                                    {/* Role Name */}
                                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex items-center gap-2 mb-1.5">
                                        {role.role_title || role.role_name}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3 min-h-[36px]">
                                        {role.description || 'Custom administrative role configured with tailored module clearances.'}
                                    </p>

                                    {/* Permission Progress & Metrics */}
                                    <div className="bg-gray-50/80 rounded-xl">
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="text-gray-500 font-medium">Security Clearance</span>
                                            <span className="font-bold text-gray-900">
                                                {isSuper ? `All ${TOTAL_AVAILABLE_ACTIONS} Actions` : `${grantedCount} / ${TOTAL_AVAILABLE_ACTIONS}`}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${isSuper ? 'bg-purple-600' : percentage > 60 ? 'bg-blue-600' : percentage > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${isSuper ? 100 : percentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Assigned users counter */}
                                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 text-gray-400" />
                                            <span>
                                                Assigned to <strong className="text-gray-900">{role.user_count || 0}</strong> admin(s)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="px-3 py-2 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenEditModal(role)}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-transparent border-0 cursor-pointer p-1"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        Configure Permissions
                                    </button>

                                    {!isSuper && role.id !== 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setDeleteModal({ isOpen: true, role })}
                                            className="text-gray-400 hover:text-rose-600 p-1 bg-transparent border-0 cursor-pointer transition-colors"
                                            title="Delete Role"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal: Create / Edit Dynamic Role */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-150 mt-0">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-bold uppercase tracking-wider">
                                        Role Builder
                                    </span>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs font-bold text-blue-700 bg-blue-50/70 px-2.5 py-0.5 rounded-full border-1 border-blue-200/60">
                                        {isSuperRole ? `${TOTAL_AVAILABLE_ACTIONS} / ${TOTAL_AVAILABLE_ACTIONS} Full Master Actions` : `${currentGrantedCount} / ${TOTAL_AVAILABLE_ACTIONS} Actions Granted`}
                                    </span>
                                </div>
                                <h2 className="text-lg font-bold text-gray-900 mt-1 mb-0">
                                    {editingRole ? `Edit Role: ${editingRole.role_title}` : 'Create New Dynamic Role'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsRoleModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Scrollable Body */}
                        <form id="roleForm" onSubmit={handleSaveRole} className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Section 1: Role Identity */}
                            <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/80 space-y-4">
                                <span className="text-sm font-semibold text-gray-900">
                                    1. Role Credentials & Identity
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Role Title / Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Operations Lead, Content Auditor..."
                                            value={roleTitle}
                                            onChange={(e) => setRoleTitle(e.target.value)}
                                            required
                                            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 focus:border-blue-500 rounded-lg text-sm outline-none transition-all font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Department <span className="text-rose-500">*</span>
                                        </label>
                                        <AdminSelect
                                            value={department}
                                            onChange={setDepartment}
                                            options={MODAL_DEPARTMENT_OPTIONS}
                                            size="sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Role Description / Responsibilities
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Brief description of duties and authorized platform operations..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 focus:border-blue-500 rounded-lg text-sm outline-none transition-all"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <label className="relative flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={isSuperRole}
                                            onChange={(e) => {
                                                const val = e.target.checked;
                                                setIsSuperRole(val);
                                                if (val) {
                                                    setSelectedPreset('Full Super Admin');
                                                    const allPerms = {};
                                                    PORTAL_MODULES.forEach(mod => {
                                                        const modPerms = { view: true, create_edit: true, delete: true };
                                                        mod.actions.forEach(act => { modPerms[act.id] = true; });
                                                        allPerms[mod.id] = modPerms;
                                                    });
                                                    setPermissions(allPerms);
                                                } else {
                                                    if (selectedPreset === 'Full Super Admin') {
                                                        setSelectedPreset(null);
                                                    }
                                                }
                                            }}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <span className="text-xs font-semibold text-gray-900">
                                            Grant Full Super Admin Access (Bypasses granular action checks)
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Section 2: Quick Preset Templates */}
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-900">
                                        2. Role Presets (Quick Template Setup)
                                    </span>
                                    <span className="text-[11px] text-gray-400">Click a preset to quickly prefill checklist</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {PRESET_TEMPLATES.map((preset, idx) => {
                                        const isSelected = selectedPreset === preset.title;
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => applyPreset(preset)}
                                                className={`p-3 text-left rounded-xl border transition-all cursor-pointer group relative ${isSelected
                                                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                                                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 bg-white'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-sm font-semibold transition-colors ${isSelected ? 'text-blue-700 font-bold' : 'text-gray-900 group-hover:text-blue-700'
                                                        }`}>
                                                        {preset.title}
                                                    </span>
                                                    {isSelected ? (
                                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white shrink-0 animate-in zoom-in-75">
                                                            <Check className="w-3 h-3 stroke-[3]" />
                                                        </span>
                                                    ) : (
                                                        <Sparkles className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500" />
                                                    )}
                                                </div>
                                                <p className={`text-[12px] line-clamp-2 leading-tight mb-0 transition-colors ${isSelected ? 'text-blue-800/80 font-medium' : 'text-gray-500'
                                                    }`}>
                                                    {preset.desc}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Section 3: Granular Checklist by Navigation Groups */}
                            <div className="space-y-5 pt-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-[-30px] bg-white py-2 z-10 border-b border-gray-100">
                                    <div>
                                        <span className="text-sm font-semibold text-gray-900 block">
                                            3. Navigation Structure & Module Permissions
                                        </span>
                                        <span className="text-[11px] text-gray-500">
                                            Clearances structured across the 5 primary platform navigation sections.
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                placeholder="Filter actions..."
                                                value={searchPermissionQuery}
                                                onChange={(e) => setSearchPermissionQuery(e.target.value)}
                                                className="pl-8 pr-3 py-2 bg-gray-50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-lg text-xs outline-none w-44"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleSelectAllGlobal}
                                            disabled={isSuperRole}
                                            className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border-0 cursor-pointer disabled:opacity-50"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleClearAllGlobal}
                                            disabled={isSuperRole}
                                            className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg border-0 cursor-pointer disabled:opacity-50"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>

                                {isSuperRole ? (
                                    <div className="p-8 text-center bg-purple-50/60 rounded-xl border border-purple-200">
                                        <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                                        <h4 className="text-sm font-bold text-purple-900 mb-1">Full Super Admin Mode Enabled</h4>
                                        <p className="text-xs text-purple-700 max-w-md mx-auto">
                                            This role possesses master clearance across all 5 navigation groups, 12 modules and {TOTAL_AVAILABLE_ACTIONS} fine-grained actions. Uncheck the Super Admin option above to configure customized actions.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {MODULE_CATEGORIES.map(category => {
                                            const categoryModules = PORTAL_MODULES.filter(m => m.group === category.id);

                                            // Check if category has any modules matching search
                                            const matchingModules = categoryModules.filter(mod => {
                                                if (!searchPermissionQuery.trim()) return true;
                                                const matchesMod = mod.name.toLowerCase().includes(searchPermissionQuery.toLowerCase()) ||
                                                    mod.description.toLowerCase().includes(searchPermissionQuery.toLowerCase()) ||
                                                    mod.page.toLowerCase().includes(searchPermissionQuery.toLowerCase());
                                                const matchesAction = mod.actions.some(a =>
                                                    a.label.toLowerCase().includes(searchPermissionQuery.toLowerCase()) ||
                                                    a.desc.toLowerCase().includes(searchPermissionQuery.toLowerCase()) ||
                                                    a.id.toLowerCase().includes(searchPermissionQuery.toLowerCase())
                                                );
                                                return matchesMod || matchesAction;
                                            });

                                            if (matchingModules.length === 0) return null;

                                            // Check if all actions in this entire category are selected
                                            const allActionsInCategory = categoryModules.flatMap(m => m.actions.map(a => ({ modId: m.id, actId: a.id })));
                                            const isAllCategorySelected = allActionsInCategory.every(item => Boolean(permissions[item.modId]?.[item.actId]));

                                            return (
                                                <div key={category.id} className="space-y-3 bg-gray-50/50 p-3.5 rounded-2xl border border-gray-200/80">
                                                    {/* Category Section Header */}
                                                    <div className="flex items-center justify-between px-1 py-0.5">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase ${category.color}`}>
                                                                {category.title}
                                                            </span>
                                                            <span className="text-xs text-gray-500 hidden sm:inline">
                                                                {category.description}
                                                            </span>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => toggleGroupAll(category.id, !isAllCategorySelected)}
                                                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-white border border-blue-200 shadow-xs px-2.5 py-1 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                                                        >
                                                            {isAllCategorySelected ? 'Deselect Section' : 'Select All in Section'}
                                                        </button>
                                                    </div>

                                                    {/* Modules in this Category */}
                                                    <div className="space-y-3.5">
                                                        {matchingModules.map(mod => {
                                                            const modPerms = permissions[mod.id] || {};
                                                            const filteredActions = searchPermissionQuery.trim()
                                                                ? mod.actions.filter(a =>
                                                                    a.label.toLowerCase().includes(searchPermissionQuery.toLowerCase()) ||
                                                                    a.desc.toLowerCase().includes(searchPermissionQuery.toLowerCase()) ||
                                                                    a.id.toLowerCase().includes(searchPermissionQuery.toLowerCase())
                                                                )
                                                                : mod.actions;

                                                            const allActionsSelectedInMod = mod.actions.every(a => Boolean(modPerms[a.id]));

                                                            return (
                                                                <div
                                                                    key={mod.id}
                                                                    className="bg-white rounded-xl border border-gray-200/90 overflow-hidden shadow-xs"
                                                                >
                                                                    {/* Module Title Bar */}
                                                                    <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div className={`p-1.5 rounded-lg ${mod.color}`}>
                                                                                <mod.icon className="w-4 h-4" />
                                                                            </div>
                                                                            <div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <h4 className="text-sm font-semibold text-gray-900 mb-0">
                                                                                        {mod.name}
                                                                                    </h4>
                                                                                    <span className="text-[11px] text-gray-400 font-mono">
                                                                                        ({mod.page})
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-[11px] text-gray-500 mb-0 mt-0.5">
                                                                                    {mod.description}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleModuleAll(mod.id, !allActionsSelectedInMod)}
                                                                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-transparent border-0 cursor-pointer px-2 py-1 hover:bg-blue-50 rounded"
                                                                            >
                                                                                {allActionsSelectedInMod ? 'Deselect Module' : 'Select All in Module'}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Actions Grid */}
                                                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                                        {filteredActions.map(act => {
                                                                            const isChecked = Boolean(modPerms[act.id]);

                                                                            return (
                                                                                <div
                                                                                    key={act.id}
                                                                                    role="button"
                                                                                    tabIndex={0}
                                                                                    onClick={() => toggleAction(mod.id, act.id)}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === ' ' || e.key === 'Enter') {
                                                                                            e.preventDefault();
                                                                                            toggleAction(mod.id, act.id);
                                                                                        }
                                                                                    }}
                                                                                    className={`flex items-start gap-2.5 p-3 rounded-xl border-1 text-left cursor-pointer transition-all select-none
                                                                                        ${isChecked
                                                                                            ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-xs'
                                                                                            : 'bg-white border-gray-200/80 text-gray-700 hover:bg-gray-50/90 hover:border-gray-300'}`}
                                                                                >
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={isChecked}
                                                                                        readOnly
                                                                                        tabIndex={-1}
                                                                                        className="w-4 h-4 mt-0.5 rounded text-blue-600 border-gray-300 focus:ring-0 shrink-0 pointer-events-none cursor-pointer"
                                                                                    />
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <span className="text-xs font-semibold block leading-tight">
                                                                                            {act.label}
                                                                                        </span>
                                                                                        <span className="text-[11px] text-gray-500 block truncate mt-0.5">
                                                                                            {act.desc}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </form>

                        {/* Modal Sticky Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                            <span className="text-xs text-gray-500">
                                Configured <strong className="text-gray-900">{isSuperRole ? TOTAL_AVAILABLE_ACTIONS : currentGrantedCount}</strong> of <strong className="text-gray-900">{TOTAL_AVAILABLE_ACTIONS}</strong> specific permissions
                            </span>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRoleModalOpen(false)}
                                    className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg shadow-xs cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    form="roleForm"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-xs shadow-blue-500/20 transition-all cursor-pointer border-0 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    {editingRole ? 'Save Changes' : 'Create Role'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Delete Confirmation */}
            {deleteModal.isOpen && deleteModal.role && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-150 mt-0">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">Delete Role?</h3>
                        <p className="text-xs text-gray-600 leading-relaxed mb-4">
                            Are you sure you want to delete role <strong>"{deleteModal.role.role_title}"</strong>? This will permanently remove this dynamic role.
                        </p>
                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setDeleteModal({ isOpen: false, role: null })}
                                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg border-0 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg border-0 cursor-pointer shadow-xs shadow-rose-500/20"
                            >
                                Delete Role
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
