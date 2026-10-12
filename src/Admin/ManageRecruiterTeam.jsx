'use client';
import React, { useState, useEffect } from 'react';
import {
    Users, UserPlus, Check, X, Mail, Trash2, Edit3,
    CheckCircle2, XCircle, Loader2, RefreshCw, ShieldCheck,
    Shield, Briefcase, UserCheck, Layers, Eye, Download, Sliders, Sparkles,
    AlertTriangle, FileSpreadsheet
} from 'lucide-react';
import {
    getAdminRecruiterTeam,
    createAdminSubRecruiter,
    getRecruiterTeam,
    createSubRecruiter,
    updateSubRecruiterPermissions,
    toggleSubRecruiterStatus,
    deleteSubRecruiter
} from '../ApiService/action';
import AdminSelect from './AdminSelect';
import toast from 'react-hot-toast';

// Role presets definition
const ROLE_PRESETS = [
    {
        id: 'team_admin',
        title: 'Team Admin',
        tag: 'Full Access',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        desc: 'Full operational access. Can post jobs, manage all pipeline stages, export data, and update company profile.',
        icon: ShieldCheck,
        permissions: {
            can_post_jobs: true,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_manage_applications: true,
            can_edit_company_profile: true,
            can_export_excel: true
        }
    },
    {
        id: 'recruiter',
        title: 'Standard Recruiter',
        tag: 'Core Hiring',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        desc: 'Primary hiring role. Can publish vacancies, review applicants, and download candidate CVs & Excel sheets.',
        icon: Briefcase,
        permissions: {
            can_post_jobs: true,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_manage_applications: true,
            can_edit_company_profile: false,
            can_export_excel: true
        }
    },
    {
        id: 'sourcer',
        title: 'Sourcer / Reviewer',
        tag: 'Talent Sourcing',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        desc: 'Candidate search and review only. Can search and review candidate profiles without job posting.',
        icon: UserCheck,
        permissions: {
            can_post_jobs: false,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_manage_applications: true,
            can_edit_company_profile: false,
            can_export_excel: false
        }
    }
];

const ALL_ROLE_PRESET_CARDS = [
    ...ROLE_PRESETS,
    {
        id: 'custom',
        title: 'Custom Access',
        tag: 'Granular',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        desc: 'Manually configure granular operational permissions and quota splits.',
        icon: Sliders
    }
];

const PERMISSION_FIELDS = [
    {
        key: 'can_post_jobs',
        label: 'Publish & Manage Jobs',
        desc: 'Post new vacancies and manage live listings',
        icon: Briefcase
    },
    {
        key: 'can_view_resumes',
        label: 'View Candidate Resumes',
        desc: 'Search candidates and inspect profile details',
        icon: Eye
    },
    {
        key: 'can_download_resumes',
        label: 'Download Resumes / CVs',
        desc: 'Export candidate resume and CV files',
        icon: Download
    },
    {
        key: 'can_contact_candidates',
        label: 'Contact Candidates Directly',
        desc: 'Send outreach emails and message applicants',
        icon: Mail
    },
    {
        key: 'can_manage_applications',
        label: 'Shortlist & Reject Candidates',
        desc: 'Review applicants and update pipeline stage',
        icon: CheckCircle2
    },
    {
        key: 'can_edit_company_profile',
        label: 'Edit Company Profile',
        desc: 'Modify employer branding and profile settings',
        icon: Shield
    },
    {
        key: 'can_export_excel',
        label: 'Excel Candidate Export',
        desc: 'Download candidate reports and profiles in Excel (.xlsx/.csv)',
        icon: FileSpreadsheet
    }
];

export default function ManageRecruiterTeam({ recruiterId, isAdminView = false }) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [team, setTeam] = useState([]);
    const [masterRecruiters, setMasterRecruiters] = useState([]);
    const [stats, setStats] = useState({
        sub_recruiter_limit: 1,
        total_members: 0,
        active_members: 0,
        remaining_seats: 1,
        company_name: 'Company',
        pool: {
            job_posts: { total: 0, used: 0, remaining_pool: 0, allocated_to_team: 0, unallocated: 0 },
            resume_views: { total: 0, used: 0, remaining_pool: 0, allocated_to_team: 0, unallocated: 0 },
            resume_downloads: { total: 0, used: 0, remaining_pool: 0, allocated_to_team: 0, unallocated: 0 },
            emails: { total: 0, used: 0, remaining_pool: 0, allocated_to_team: 0, unallocated: 0 },
            excel_downloads: { total: 0, used: 0, remaining_pool: 0, allocated_to_team: 0, unallocated: 0 }
        }
    });

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [deleteModalMember, setDeleteModalMember] = useState(null);
    const [statusModalMember, setStatusModalMember] = useState(null);

    // Form state
    const initialFormState = {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        master_recruiter_id: '',
        designation: 'Recruitment Associate',
        role_preset: 'recruiter',
        permissions: {
            ...ROLE_PRESETS.find(r => r.id === 'recruiter').permissions,
            quota_mode: 'shared',
            allocated_job_posts: 0,
            allocated_resume_views: 0,
            allocated_resume_downloads: 0,
            allocated_emails: 0,
            allocated_excel_downloads: 0
        }
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        loadTeamData();
    }, [recruiterId]);

    const loadTeamData = async () => {
        try {
            setLoading(true);
            const res = isAdminView && recruiterId
                ? await getAdminRecruiterTeam(recruiterId)
                : await getRecruiterTeam(recruiterId ? { recruiter_id: recruiterId } : {});

            if (res?.data?.success && res.data.data) {
                setTeam(res.data.data.team || []);
                const masters = res.data.data.master_recruiters || res.data.data.stats?.master_recruiters || [];
                setMasterRecruiters(masters);
                if (res.data.data.stats) {
                    setStats(res.data.data.stats);
                }
                if (masters.length > 0) {
                    const firstAvail = masters.find(m => m.available_seats > 0) || masters[0];
                    setFormData(prev => ({
                        ...prev,
                        master_recruiter_id: prev.master_recruiter_id || String(firstAvail?.id || '')
                    }));
                }
            }
        } catch (err) {
            console.error("Failed to load recruiter team:", err);
            toast.error("Failed to load sub-recruiter team members.");
        } finally {
            setLoading(false);
        }
    };

    const handleRolePresetSelect = (presetId) => {
        if (presetId === 'custom') {
            setFormData(prev => ({
                ...prev,
                role_preset: 'custom'
            }));
            return;
        }
        const selected = ROLE_PRESETS.find(r => r.id === presetId);
        if (selected) {
            setFormData(prev => ({
                ...prev,
                role_preset: presetId,
                permissions: {
                    ...prev.permissions,
                    ...selected.permissions
                }
            }));
        }
    };

    const handlePermissionToggle = (key) => {
        setFormData(prev => {
            const nextPerms = {
                ...prev.permissions,
                [key]: !prev.permissions[key]
            };
            const matched = ROLE_PRESETS.find(p =>
                Boolean(p.permissions.can_post_jobs) === Boolean(nextPerms.can_post_jobs) &&
                Boolean(p.permissions.can_view_resumes) === Boolean(nextPerms.can_view_resumes) &&
                Boolean(p.permissions.can_download_resumes) === Boolean(nextPerms.can_download_resumes) &&
                Boolean(p.permissions.can_contact_candidates) === Boolean(nextPerms.can_contact_candidates) &&
                Boolean(p.permissions.can_manage_applications) === Boolean(nextPerms.can_manage_applications) &&
                Boolean(p.permissions.can_edit_company_profile) === Boolean(nextPerms.can_edit_company_profile) &&
                Boolean(p.permissions.can_export_excel) === Boolean(nextPerms.can_export_excel)
            );
            return {
                ...prev,
                role_preset: matched ? matched.id : 'custom',
                permissions: nextPerms
            };
        });
    };

    const handleQuotaModeToggle = (mode) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                quota_mode: mode
            }
        }));
    };

    const handleQuotaNumberChange = (field, val) => {
        let num = Math.max(0, parseInt(val) || 0);
        if (field === 'allocated_job_posts') {
            const max = stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0;
            num = Math.min(num, max);
        } else if (field === 'allocated_resume_views') {
            const max = stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0;
            num = Math.min(num, max);
        } else if (field === 'allocated_resume_downloads') {
            const max = stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0;
            num = Math.min(num, max);
        } else if (field === 'allocated_emails') {
            const max = stats.pool?.emails?.available_to_allocate ?? stats.pool?.emails?.unallocated ?? 0;
            num = Math.min(num, max);
        } else if (field === 'allocated_excel_downloads') {
            const max = stats.pool?.excel_downloads?.available_to_allocate ?? stats.pool?.excel_downloads?.unallocated ?? 0;
            num = Math.min(num, max);
        }
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [field]: num
            }
        }));
    };

    const handleEditRolePresetSelect = (presetId) => {
        if (presetId === 'custom') {
            setEditingMember(prev => ({
                ...prev,
                role_preset: 'custom'
            }));
            return;
        }
        const selected = ROLE_PRESETS.find(r => r.id === presetId);
        if (selected && editingMember) {
            setEditingMember(prev => ({
                ...prev,
                role_preset: presetId,
                permissions: {
                    ...prev.permissions,
                    ...selected.permissions
                }
            }));
        }
    };

    const handleEditPermissionToggle = (key) => {
        setEditingMember(prev => {
            if (!prev) return prev;
            const nextPerms = {
                ...prev.permissions,
                [key]: !prev.permissions?.[key]
            };
            const matched = ROLE_PRESETS.find(p =>
                Boolean(p.permissions.can_post_jobs) === Boolean(nextPerms.can_post_jobs) &&
                Boolean(p.permissions.can_view_resumes) === Boolean(nextPerms.can_view_resumes) &&
                Boolean(p.permissions.can_download_resumes) === Boolean(nextPerms.can_download_resumes) &&
                Boolean(p.permissions.can_contact_candidates) === Boolean(nextPerms.can_contact_candidates) &&
                Boolean(p.permissions.can_manage_applications) === Boolean(nextPerms.can_manage_applications) &&
                Boolean(p.permissions.can_edit_company_profile) === Boolean(nextPerms.can_edit_company_profile) &&
                Boolean(p.permissions.can_export_excel) === Boolean(nextPerms.can_export_excel)
            );
            return {
                ...prev,
                role_preset: matched ? matched.id : 'custom',
                permissions: nextPerms
            };
        });
    };

    const handleCreateSubRecruiter = async (e) => {
        e.preventDefault();
        if (!formData.first_name.trim() || !formData.email.trim() || !formData.password.trim()) {
            toast.error("Please fill in first name, email, and password.");
            return;
        }

        if (masterRecruiters.length > 0 && !formData.master_recruiter_id) {
            toast.error("Please select a Master Recruiter to assign this sub-recruiter to.");
            return;
        }

        const chosenMaster = masterRecruiters.find(m => String(m.id) === String(formData.master_recruiter_id));
        if (chosenMaster && chosenMaster.available_seats <= 0) {
            toast.error(`Master Recruiter ${chosenMaster.name} has no available sub-seats (${chosenMaster.sub_recruiters_count}/${chosenMaster.allocated_seats} used). Please allocate more seats in the Masters tab or select another Master.`);
            return;
        }

        try {
            setSubmitting(true);
            const targetMasterId = formData.master_recruiter_id || recruiterId;
            const payload = {
                ...formData,
                master_recruiter_id: targetMasterId,
                main_recruiter_id: targetMasterId
            };

            const res = isAdminView && recruiterId
                ? await createAdminSubRecruiter(recruiterId, payload)
                : await createSubRecruiter(payload);

            if (res?.data?.success) {
                toast.success("Sub-recruiter account created successfully!");
                setIsAddModalOpen(false);
                setFormData(initialFormState);
                loadTeamData();
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || err.message || "Failed to create sub-recruiter.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSavePermissions = async () => {
        if (!editingMember) return;
        try {
            setSubmitting(true);
            const res = await updateSubRecruiterPermissions(editingMember.id, {
                designation: editingMember.designation,
                role_preset: editingMember.role_preset,
                permissions: editingMember.permissions,
                master_recruiter_id: editingMember.main_recruiter_id
            });
            if (res?.data?.success) {
                toast.success("Permissions updated successfully.");
                setEditingMember(null);
                loadTeamData();
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Failed to update permissions.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = (member) => {
        setStatusModalMember(member);
    };

    const confirmToggleStatus = async () => {
        if (!statusModalMember) return;
        const nextStatus = statusModalMember.status === 'active' ? 'suspended' : 'active';
        try {
            setSubmitting(true);
            const res = await toggleSubRecruiterStatus(statusModalMember.id, nextStatus);
            if (res?.data?.success) {
                toast.success(`Sub-recruiter account ${nextStatus === 'active' ? 'activated' : 'suspended'}.`);
                setStatusModalMember(null);
                loadTeamData();
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Failed to update status.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteMember = (member) => {
        setDeleteModalMember(member);
    };

    const confirmDeleteMember = async () => {
        if (!deleteModalMember) return;
        try {
            setSubmitting(true);
            const res = await deleteSubRecruiter(deleteModalMember.id);
            if (res?.data?.success) {
                toast.success("Sub-recruiter removed from team.");
                setDeleteModalMember(null);
                loadTeamData();
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Failed to remove sub-recruiter.");
        } finally {
            setSubmitting(false);
        }
    };

    const percentUsed = stats.sub_recruiter_limit > 0
        ? Math.round((stats.total_members / stats.sub_recruiter_limit) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Team Seat Quota & Overview Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border-1 border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 tracking-tight mb-0">
                                Sub-Recruiters & Team Seats
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5 mb-0">
                                Delegate recruitment tasks to team members with custom permission controls.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={loadTeamData}
                            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-colors shadow-xs"
                            title="Refresh team"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (stats.remaining_seats <= 0) {
                                    toast.error(`Team seat limit of ${stats.sub_recruiter_limit} reached. Upgrade plan for more seats.`);
                                    return;
                                }
                                setIsAddModalOpen(true);
                            }}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all shadow-sm ${stats.remaining_seats <= 0
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20 active:scale-[0.98]'
                                }`}
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Add Sub-Recruiter</span>
                        </button>
                    </div>
                </div>

                {/* Quota & Stat Cards Grid */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Card 1: Allocation Progress */}
                    <div className="bg-slate-50/80 p-4 rounded-xl flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-sm text-slate-700">Team Seat Allocation</span>
                            <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200/60 shadow-xs">
                                {stats.total_members} / {stats.sub_recruiter_limit} Seats
                            </span>
                        </div>
                        <div className="my-2.5">
                            <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${percentUsed >= 100
                                        ? 'bg-amber-500'
                                        : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                        }`}
                                    style={{ width: `${Math.min(percentUsed, 100)}%` }}
                                />
                            </div>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                            {stats.remaining_seats > 0
                                ? `✓ ${stats.remaining_seats} seat${stats.remaining_seats === 1 ? '' : 's'} available to invite`
                                : 'All team seats occupied under current plan'}
                        </span>
                    </div>

                    {/* Card 2: Active Logins */}
                    <div className="bg-emerald-50/40 p-4 rounded-xl flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-sm text-emerald-900">Active Logins</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100/80 text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black text-emerald-600">{stats.active_members}</span>
                            <span className="text-xs text-slate-400 font-medium">members active</span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">Team credentials enabled</span>
                    </div>

                    {/* Card 3: Plan Quota */}
                    <div className="bg-indigo-50/40 p-4 rounded-xl flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-sm text-indigo-900">Plan Quota</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100/80 text-indigo-700">
                                Max Limit
                            </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-1.5">
                            <span className="text-2xl font-semibold text-slate-900">{stats.sub_recruiter_limit}</span>
                            <span className="text-xs text-slate-500 font-semibold">Total Seats</span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 block">Included in subscription</span>
                    </div>
                </div>
            </div>

            {/* Sub-Recruiters Table */}
            <div className="bg-white rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-0">Team Members List</h3>
                        <p className="text-xs text-slate-400 mt-0.5 mb-0">
                            Sub-recruiters share company quotas and log in using their own credentials.
                        </p>
                    </div>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200/60">
                        {team.length} {team.length === 1 ? 'Member' : 'Members'}
                    </span>
                </div>

                {loading ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Member Name & Contact</th>
                                    <th className="py-3 px-4">Assigned Master</th>
                                    <th className="py-3 px-4">Designation</th>
                                    <th className="py-3 px-4">Role Preset</th>
                                    <th className="py-3 px-4">Granted Permissions</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
                                                <div className="space-y-1">
                                                    <div className="h-3.5 w-28 bg-slate-200 rounded"></div>
                                                    <div className="h-3 w-36 bg-slate-200 rounded"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4"><div className="h-3.5 w-24 bg-slate-200 rounded"></div></td>
                                        <td className="py-3.5 px-4"><div className="h-3.5 w-24 bg-slate-200 rounded"></div></td>
                                        <td className="py-3.5 px-4"><div className="h-5 w-24 bg-slate-200 rounded-md"></div></td>
                                        <td className="py-3.5 px-4"><div className="h-5 w-40 bg-slate-200 rounded-md"></div></td>
                                        <td className="py-3.5 px-4"><div className="h-5 w-16 bg-slate-200 rounded-full"></div></td>
                                        <td className="py-3.5 px-4 text-right"><div className="h-7 w-16 bg-slate-200 rounded-lg ml-auto"></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : team.length === 0 ? (
                    <div className="py-14 text-center px-4 flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50/80 border-1 border-indigo-100/80 flex items-center justify-center text-indigo-500 mb-3 shadow-xs">
                            <Users className="w-7 h-7" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-800 mb-1">No Sub-Recruiters Added Yet</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4 leading-relaxed">
                            You can create sub-recruiter accounts for hiring managers, talent sourcers, or recruiters and define what they can do.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-blue-500/25 active:scale-95 flex items-center gap-1.5"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>+ Add First Sub-Recruiter</span>
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Member Name & Contact</th>
                                    <th className="py-3 px-4">Assigned Master</th>
                                    <th className="py-3 px-4">Designation</th>
                                    <th className="py-3 px-4">Role Preset</th>
                                    <th className="py-3 px-4">Granted Permissions</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {team.map((member) => {
                                    const preset = ROLE_PRESETS.find(r => r.id === member.role_preset) || ROLE_PRESETS[3];
                                    const perms = member.permissions || {};

                                    return (
                                        <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                                            {/* Member Name */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                                                        {member.first_name ? member.first_name[0].toUpperCase() : 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-xs text-slate-900">
                                                            {member.full_name || 'Sub-Recruiter'}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                            <Mail className="w-3 h-3 text-slate-400" />
                                                            <span>{member.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Assigned Master */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-xs text-slate-900 truncate max-w-[155px]">
                                                    {member.master_name || `${member.master_first_name || ''} ${member.master_last_name || ''}`.trim() || 'Master Recruiter'}
                                                </div>
                                                <div className="text-[11px] text-slate-400 truncate max-w-[155px]">
                                                    {member.master_email || `ID #${member.main_recruiter_id}`}
                                                </div>
                                            </td>

                                            {/* Designation */}
                                            <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                                                {member.designation || 'Recruiter'}
                                            </td>

                                            {/* Role Preset */}
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border-1 ${preset.badgeColor}`}>
                                                    {preset.title}
                                                </span>
                                            </td>

                                            {/* Granted Permissions Pills */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-wrap gap-1 max-w-[320px]">
                                                    {perms.can_post_jobs && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border-1 border-blue-100">
                                                            Post Jobs
                                                        </span>
                                                    )}
                                                    {perms.can_view_resumes && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border-1 border-emerald-100">
                                                            View Resumes
                                                        </span>
                                                    )}
                                                    {perms.can_download_resumes && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700 border-1 border-teal-100">
                                                            Downloads
                                                        </span>
                                                    )}
                                                    {perms.can_contact_candidates && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border-1 border-indigo-100">
                                                            Contact
                                                        </span>
                                                    )}
                                                    {perms.can_manage_applications && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border-1 border-amber-100">
                                                            Shortlisting
                                                        </span>
                                                    )}
                                                    {perms.can_edit_company_profile && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border-1 border-purple-100">
                                                            Company Profile
                                                        </span>
                                                    )}
                                                    {perms.can_export_excel && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border-1 border-emerald-100">
                                                            Excel Export
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${member.status === 'active' && member.user_active
                                                    ? 'bg-emerald-50 text-emerald-700 border-1 border-emerald-200'
                                                    : 'bg-rose-50 text-rose-700 border-1 border-rose-200'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' && member.user_active ? 'bg-emerald-500' : 'bg-rose-500'
                                                        }`} />
                                                    {member.status === 'active' && member.user_active ? 'Active' : 'Suspended'}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Edit Permissions */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const perms = member.permissions || {};
                                                            const curPerms = {
                                                                can_post_jobs: Boolean(perms.can_post_jobs),
                                                                can_view_resumes: Boolean(perms.can_view_resumes !== false),
                                                                can_download_resumes: Boolean(perms.can_download_resumes),
                                                                can_contact_candidates: Boolean(perms.can_contact_candidates),
                                                                can_manage_applications: Boolean(perms.can_manage_applications !== false),
                                                                can_edit_company_profile: Boolean(perms.can_edit_company_profile),
                                                                can_export_excel: Boolean(perms.can_export_excel)
                                                            };
                                                            const matched = ROLE_PRESETS.find(p =>
                                                                Boolean(p.permissions.can_post_jobs) === curPerms.can_post_jobs &&
                                                                Boolean(p.permissions.can_view_resumes) === curPerms.can_view_resumes &&
                                                                Boolean(p.permissions.can_download_resumes) === curPerms.can_download_resumes &&
                                                                Boolean(p.permissions.can_contact_candidates) === curPerms.can_contact_candidates &&
                                                                Boolean(p.permissions.can_manage_applications) === curPerms.can_manage_applications &&
                                                                Boolean(p.permissions.can_edit_company_profile) === curPerms.can_edit_company_profile &&
                                                                Boolean(p.permissions.can_export_excel) === curPerms.can_export_excel
                                                            );
                                                            setEditingMember({
                                                                ...member,
                                                                role_preset: matched ? matched.id : (member.role_preset || 'custom'),
                                                                permissions: {
                                                                    ...curPerms,
                                                                    quota_mode: perms.quota_mode || 'shared',
                                                                    allocated_job_posts: Number(perms.allocated_job_posts || 0),
                                                                    allocated_resume_views: Number(perms.allocated_resume_views || 0),
                                                                    allocated_resume_downloads: Number(perms.allocated_resume_downloads || 0),
                                                                    allocated_emails: Number(perms.allocated_emails || 0),
                                                                    allocated_excel_downloads: Number(perms.allocated_excel_downloads || 0),
                                                                    used_job_posts: Number(perms.used_job_posts || 0),
                                                                    used_resume_views: Number(perms.used_resume_views || 0),
                                                                    used_resume_downloads: Number(perms.used_resume_downloads || 0),
                                                                    used_emails: Number(perms.used_emails || 0),
                                                                    used_excel_downloads: Number(perms.used_excel_downloads || 0)
                                                                }
                                                            });
                                                        }}
                                                        title="Edit Access Permissions"
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-1 border-transparent hover:border-blue-100 cursor-pointer"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>

                                                    {/* Suspend / Activate */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(member)}
                                                        title={member.status === 'active' ? 'Suspend Access' : 'Activate Access'}
                                                        className={`p-1.5 rounded-lg transition-colors border-1 border-transparent ${member.status === 'active'
                                                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100'
                                                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100'
                                                            }`}
                                                    >
                                                        {member.status === 'active' ? (
                                                            <XCircle className="w-4 h-4" />
                                                        ) : (
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        )}
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteMember(member)}
                                                        title="Remove from Team"
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border-1 border-transparent hover:border-rose-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal: Add Sub-Recruiter */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs mt-0">
                    <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 pb-4 border-b border-slate-100 shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-0 flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-blue-600" />
                                    Add New Sub-Recruiter
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5 mb-0">
                                    Creates a dedicated login account with specified permissions under your company quota.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Scrollable Form Body */}
                        <form onSubmit={handleCreateSubRecruiter} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="p-4 overflow-y-auto space-y-4 flex-1">
                                {/* Master Recruiter Assignment */}
                                <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                            Assign to Master Recruiter <span className="text-rose-600">*</span>
                                        </span>
                                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border-1 border-indigo-200 uppercase tracking-wide">
                                            Per-Master Quota
                                        </span>
                                    </label>
                                    <AdminSelect
                                        value={String(formData.master_recruiter_id || '')}
                                        onChange={(val) => setFormData(prev => ({ ...prev, master_recruiter_id: val }))}
                                        options={masterRecruiters.map((m) => {
                                            const isFull = m.available_seats <= 0;
                                            return {
                                                value: String(m.id),
                                                label: `${m.name} (${m.email}) — ${m.sub_recruiters_count}/${m.allocated_seats} seats used ${isFull ? '(Quota Full - 0 left)' : `(${m.available_seats} available)`}`,
                                                subLabel: isFull
                                                    ? 'Maximum sub-recruiter seats reached for this master account'
                                                    : `${m.available_seats} of ${m.allocated_seats} allocated seats available`,
                                                disabled: isFull
                                            };
                                        })}
                                        placeholder="-- Choose Master Recruiter --"
                                        className="w-full"
                                    />
                                    {(() => {
                                        const selectedM = masterRecruiters.find(m => String(m.id) === String(formData.master_recruiter_id));
                                        return selectedM ? (
                                            <p className="text-[11px] text-slate-500 mt-2 mb-0 flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                                                <span>Quota: <strong className="text-slate-800">{selectedM.allocated_seats} seats</strong> &bull; Active: <strong className="text-slate-800">{selectedM.sub_recruiters_count}</strong></span>
                                                <span className={`font-semibold ${selectedM.available_seats > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {selectedM.available_seats} seats remaining
                                                </span>
                                            </p>
                                        ) : (
                                            <span className="text-[11px] text-slate-400 mt-1 block">
                                                Select which Master Recruiter this team member is attached to. Seats are consumed from that Master's quota.
                                            </span>
                                        );
                                    })()}
                                </div>

                                {/* Personal & Login Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                                            First Name <span className="text-rose-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            placeholder="e.g. Rahul"
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            placeholder="e.g. Sharma"
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                                            Official Email <span className="text-rose-600">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="rahul@company.com"
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+91 9876543210"
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                                            Designation
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.designation}
                                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                            placeholder="e.g. Senior Tech Recruiter"
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                                            Temporary Password <span className="text-rose-600">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* 1. Role Preset & Access Level */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                                                <Shield className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold mb-0 text-slate-900 leading-tight">
                                                    Role Preset & Access Level
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-0.5 mb-0">
                                                    Choose a predefined role or tailor granular privileges below.
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            {formData.role_preset === 'custom' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                                                    <Sliders className="w-3 h-3 text-amber-600" /> Custom Access
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border-1 border-blue-200/80">
                                                    <Sparkles className="w-3 h-3 text-blue-600" /> Preset Applied
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                                        {ALL_ROLE_PRESET_CARDS.map((preset) => {
                                            const isSelected = formData.role_preset === preset.id;
                                            const PresetIcon = preset.icon || ShieldCheck;
                                            return (
                                                <div
                                                    key={preset.id}
                                                    onClick={() => handleRolePresetSelect(preset.id)}
                                                    className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${isSelected
                                                        ? 'border-2 border-blue-600 bg-gradient-to-b from-blue-50/70 to-white shadow-xs ring-2 ring-blue-500/10'
                                                        : 'border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50 bg-white shadow-2xs'
                                                        }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isSelected
                                                                ? 'bg-blue-600 text-white shadow-xs'
                                                                : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/70'
                                                                }`}>
                                                                <PresetIcon className="w-4 h-4" />
                                                            </div>
                                                            {isSelected ? (
                                                                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                                                    <Check className="w-3 h-3" strokeWidth={3} />
                                                                </div>
                                                            ) : (
                                                                <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-slate-300" />
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-900 block leading-tight">
                                                            {preset.title}
                                                        </span>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${preset.badgeColor} border inline-block mt-1.5`}>
                                                            {preset.tag}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 leading-snug line-clamp-2 mt-2 mb-0">
                                                        {preset.desc}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 2. Operational Permissions */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
                                                <Sliders className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="mb-0 text-sm font-semibold text-slate-900 leading-tight">
                                                    Operational Permissions
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-0.5 mb-0">
                                                    Granular privileges granted to this sub-recruiter profile.
                                                </p>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                                            {Object.keys(formData.permissions || {}).filter(k => k.startsWith('can_') && formData.permissions[k]).length} of 6 Enabled
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {PERMISSION_FIELDS.map((perm) => {
                                            const isChecked = Boolean(formData.permissions[perm.key]);
                                            const PermIcon = perm.icon || Briefcase;
                                            return (
                                                <div
                                                    key={perm.key}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handlePermissionToggle(perm.key);
                                                    }}
                                                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group select-none ${isChecked
                                                        ? 'border-blue-300 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/10'
                                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70'
                                                            }`}>
                                                            <PermIcon className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h5 className="text-xs font-semibold text-slate-900 truncate leading-snug mb-0">
                                                                {perm.label}
                                                            </h5>
                                                            <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5 mb-0">
                                                                {perm.desc}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center transition-all shrink-0 ${isChecked
                                                        ? 'bg-[#0A66C2] border border-[#0A66C2] text-white shadow-2xs'
                                                        : 'bg-white border-2 border-slate-300 group-hover:border-slate-400'
                                                        }`}>
                                                        {isChecked && (
                                                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 3. Quota Splitting & Allocation (Dedicated Split vs Shared Pool) */}
                                <div className="bg-slate-50/80 p-3 sm:p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                                                <Layers className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="mb-0 text-sm font-semibold text-slate-900 leading-tight">
                                                    Quota Allocation & Drawing Mode
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-0.5 mb-0">
                                                    Assign dedicated allowances from company pool or draw from shared pool.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="inline-flex p-1 bg-slate-200/70 rounded-xl border border-slate-300/40 shrink-0 self-start sm:self-auto">
                                            <button
                                                type="button"
                                                onClick={() => handleQuotaModeToggle('shared')}
                                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${formData.permissions.quota_mode === 'shared'
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                                                    }`}
                                            >
                                                Shared Pool
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleQuotaModeToggle('split')}
                                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${formData.permissions.quota_mode === 'split'
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                                                    }`}
                                            >
                                                Dedicated Split
                                            </button>
                                        </div>
                                    </div>

                                    {formData.permissions.quota_mode === 'split' ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                                            {/* Job Posts Limit */}
                                            <div className={`p-3.5 bg-white rounded-xl border transition-all ${(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0
                                                ? 'bg-amber-50/40 border-amber-200'
                                                : 'border-slate-200 hover:border-slate-300'
                                                }`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                                                        <span className="text-xs font-semibold text-slate-800">Job Posts</span>
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0
                                                            ? 'Full (0 Avail)'
                                                            : `Avail: ${stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0}`}
                                                    </span>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0}
                                                        value={formData.permissions.allocated_job_posts || 0}
                                                        onChange={(e) => handleQuotaNumberChange('allocated_job_posts', e.target.value)}
                                                        disabled={(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0}
                                                        className={`w-full px-3 py-2 text-sm font-bold border rounded-lg outline-none transition-all ${(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0
                                                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                                            : 'bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                                            }`}
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                        posts
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                    {(stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0) <= 0
                                                        ? `Plan limit reached (${stats.pool?.job_posts?.used || 0}/${stats.pool?.job_posts?.total || 5} used).`
                                                        : 'Max active jobs this recruiter can publish'}
                                                </span>
                                            </div>

                                            {/* Resume Views Limit */}
                                            {(() => {
                                                const viewsAvail = stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0;
                                                const isViewsFull = viewsAvail <= 0;
                                                return (
                                                    <div className={`p-3.5 bg-white rounded-xl border transition-all ${isViewsFull ? 'bg-amber-50/40 border-amber-200' : 'border-slate-200 hover:border-slate-300'
                                                        }`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                                                <span className="text-xs font-semibold text-slate-800">Resume Views</span>
                                                            </div>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isViewsFull ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                {isViewsFull ? 'Full (0 Avail)' : `Avail: ${viewsAvail}`}
                                                            </span>
                                                        </div>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={viewsAvail}
                                                                value={formData.permissions.allocated_resume_views || 0}
                                                                onChange={(e) => handleQuotaNumberChange('allocated_resume_views', e.target.value)}
                                                                disabled={isViewsFull}
                                                                className={`w-full px-3 py-2 text-sm font-bold border rounded-lg outline-none transition-all ${isViewsFull
                                                                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                                                    : 'bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                                                    }`}
                                                            />
                                                            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                                views
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                            {isViewsFull
                                                                ? `Plan limit reached (${stats.pool?.resume_views?.used || 0}/${stats.pool?.resume_views?.total || 50} used).`
                                                                : 'Candidate profiles they can unlock'}
                                                        </span>
                                                    </div>
                                                );
                                            })()}

                                            {/* CV Downloads Limit */}
                                            {(() => {
                                                const downloadsAvail = stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0;
                                                const isDownloadsFull = downloadsAvail <= 0;
                                                return (
                                                    <div className={`p-3.5 bg-white rounded-xl border transition-all ${isDownloadsFull ? 'bg-amber-50/40 border-amber-200' : 'border-slate-200 hover:border-slate-300'
                                                        }`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <Download className="w-3.5 h-3.5 text-purple-600" />
                                                                <span className="text-xs font-semibold text-slate-800">CV Downloads</span>
                                                            </div>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDownloadsFull ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                {isDownloadsFull ? 'Full (0 Avail)' : `Avail: ${downloadsAvail}`}
                                                            </span>
                                                        </div>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={downloadsAvail}
                                                                value={formData.permissions.allocated_resume_downloads || 0}
                                                                onChange={(e) => handleQuotaNumberChange('allocated_resume_downloads', e.target.value)}
                                                                disabled={isDownloadsFull}
                                                                className={`w-full px-3 py-2 text-sm font-bold border rounded-lg outline-none transition-all ${isDownloadsFull
                                                                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                                                    : 'bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                                                    }`}
                                                            />
                                                            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                                files
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                            {isDownloadsFull
                                                                ? `Plan limit reached (${stats.pool?.resume_downloads?.used || 0}/${stats.pool?.resume_downloads?.total || 10} used).`
                                                                : 'Candidate CV files they can download'}
                                                        </span>
                                                    </div>
                                                );
                                            })()}

                                            {/* Mail Outreach Limit */}
                                            {(() => {
                                                const emailsAvail = stats.pool?.emails?.available_to_allocate ?? stats.pool?.emails?.unallocated ?? 0;
                                                const isEmailsFull = emailsAvail <= 0;
                                                return (
                                                    <div className={`p-3.5 bg-white rounded-xl border transition-all ${isEmailsFull ? 'bg-amber-50/40 border-amber-200' : 'border-slate-200 hover:border-slate-300'
                                                        }`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <Mail className="w-3.5 h-3.5 text-sky-600" />
                                                                <span className="text-xs font-semibold text-slate-800">Mail Outreach</span>
                                                            </div>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isEmailsFull ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                {isEmailsFull ? 'Full (0 Avail)' : `Avail: ${emailsAvail}`}
                                                            </span>
                                                        </div>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={emailsAvail}
                                                                value={formData.permissions.allocated_emails || 0}
                                                                onChange={(e) => handleQuotaNumberChange('allocated_emails', e.target.value)}
                                                                disabled={isEmailsFull}
                                                                className={`w-full px-3 py-2 text-sm font-bold border rounded-lg outline-none transition-all ${isEmailsFull
                                                                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                                                    : 'bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                                                    }`}
                                                            />
                                                            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                                mails
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                            {isEmailsFull ? 'Email outreach quota exhausted' : 'Candidate outreach emails quota'}
                                                        </span>
                                                    </div>
                                                );
                                            })()}

                                            {/* Excel Candidate Exports Limit */}
                                            {(() => {
                                                const excelAvail = stats.pool?.excel_downloads?.available_to_allocate ?? stats.pool?.excel_downloads?.unallocated ?? 0;
                                                const isExcelFull = excelAvail <= 0;
                                                return (
                                                    <div className={`p-3.5 bg-white rounded-xl border transition-all ${isExcelFull ? 'bg-amber-50/40 border-amber-200' : 'border-slate-200 hover:border-slate-300'
                                                        }`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                                                <span className="text-xs font-semibold text-slate-800">Excel Exports</span>
                                                            </div>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isExcelFull ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                {isExcelFull ? 'Full (0 Avail)' : `Avail: ${excelAvail}`}
                                                            </span>
                                                        </div>
                                                        <div className="relative">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={excelAvail}
                                                                value={formData.permissions.allocated_excel_downloads || 0}
                                                                onChange={(e) => handleQuotaNumberChange('allocated_excel_downloads', e.target.value)}
                                                                disabled={isExcelFull}
                                                                className={`w-full px-3 py-2 text-sm font-bold border rounded-lg outline-none transition-all ${isExcelFull
                                                                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                                                    : 'bg-white text-slate-900 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                                                                    }`}
                                                            />
                                                            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                                exports
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                            {isExcelFull ? 'Excel candidate export quota exhausted' : 'Candidate profiles they can export to Excel'}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white border-1 border-blue-100 rounded-xl space-y-2.5">
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900 mb-0.5">
                                                        Dynamic Shared Pool Mode
                                                    </p>
                                                    <p className="text-xs text-slate-600 leading-relaxed mb-0">
                                                        This team member draws directly from your company's shared subscription balance without individual seat limits until total plan quotas are reached.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-blue-100/70 flex flex-wrap items-center gap-2 text-[11px]">
                                                <span className="text-slate-500 font-medium">Company Pool Balance:</span>
                                                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                    <Briefcase className="w-3 h-3 text-blue-600" />
                                                    Jobs: <strong>{stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0} avail</strong>
                                                </span>
                                                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                    <Eye className="w-3 h-3 text-indigo-600" />
                                                    Views: <strong>{stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0} avail</strong>
                                                </span>
                                                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                    <Download className="w-3 h-3 text-purple-600" />
                                                    Downloads: <strong>{stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0} avail</strong>
                                                </span>
                                                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                    <Mail className="w-3 h-3 text-sky-600" />
                                                    Mail: <strong>{stats.pool?.emails?.available_to_allocate ?? stats.pool?.emails?.unallocated ?? 0} avail</strong>
                                                </span>
                                                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                    <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                                                    Excel: <strong>{stats.pool?.excel_downloads?.available_to_allocate ?? stats.pool?.excel_downloads?.unallocated ?? 0} avail</strong>
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pinned Action Buttons Footer */}
                            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl flex items-center justify-end gap-2.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-white transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>Create Sub-Recruiter</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Permissions */}
            {editingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs mt-0">
                    <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between p-4 pb-3 border-b border-slate-100 shrink-0">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 mb-0">
                                    Edit Permissions & Quotas
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5 mb-0">
                                    {editingMember.full_name} &bull; {editingMember.email}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingMember(null)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto space-y-4 flex-1">
                            {/* Assigned Master Recruiter */}
                            {masterRecruiters.length > 0 && (
                                <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5">
                                            <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                            Assigned Master Recruiter
                                        </span>
                                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border-1 border-indigo-200 uppercase tracking-wide">
                                            Reassign
                                        </span>
                                    </label>
                                    <AdminSelect
                                        value={String(editingMember.main_recruiter_id || '')}
                                        onChange={(val) => setEditingMember(prev => ({ ...prev, main_recruiter_id: val }))}
                                        options={masterRecruiters.map((m) => {
                                            const isCurrentMaster = String(m.id) === String(editingMember.main_recruiter_id);
                                            const isFull = m.available_seats <= 0 && !isCurrentMaster;
                                            return {
                                                value: String(m.id),
                                                label: `${m.name} (${m.email}) — ${m.sub_recruiters_count}/${m.allocated_seats} seats used ${isCurrentMaster ? '(Currently Assigned)' : isFull ? '(Full)' : `(${m.available_seats} available)`}`,
                                                subLabel: isCurrentMaster
                                                    ? 'Currently assigned Master account'
                                                    : isFull
                                                        ? 'Quota full for this master'
                                                        : `${m.available_seats} seats available`,
                                                disabled: isFull
                                            };
                                        })}
                                        placeholder="Choose Master Recruiter"
                                        className="w-full"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                                    Designation
                                </label>
                                <input
                                    type="text"
                                    value={editingMember.designation || ''}
                                    onChange={(e) => setEditingMember({ ...editingMember, designation: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* 1. Role Preset & Access Level */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-0 text-slate-900 leading-tight">
                                                Role Preset & Access Level
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5 mb-0">
                                                Choose a predefined role or tailor granular privileges below.
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        {editingMember.role_preset === 'custom' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                                                <Sliders className="w-3 h-3 text-amber-600" /> Custom Access
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border-1 border-blue-200/80">
                                                <Sparkles className="w-3 h-3 text-blue-600" /> Preset Applied
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                                    {ALL_ROLE_PRESET_CARDS.map((preset) => {
                                        const isSelected = editingMember.role_preset === preset.id;
                                        const PresetIcon = preset.icon || ShieldCheck;
                                        return (
                                            <div
                                                key={preset.id}
                                                onClick={() => handleEditRolePresetSelect(preset.id)}
                                                className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${isSelected
                                                    ? 'border-2 border-blue-600 bg-gradient-to-b from-blue-50/70 to-white shadow-xs ring-2 ring-blue-500/10'
                                                    : 'border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50 bg-white shadow-2xs'
                                                    }`}
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isSelected
                                                            ? 'bg-blue-600 text-white shadow-xs'
                                                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/70'
                                                            }`}>
                                                            <PresetIcon className="w-4 h-4" />
                                                        </div>
                                                        {isSelected ? (
                                                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                                                <Check className="w-3 h-3" strokeWidth={3} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-slate-300" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-900 block leading-tight">
                                                        {preset.title}
                                                    </span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${preset.badgeColor} border inline-block mt-1.5`}>
                                                        {preset.tag}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-snug line-clamp-2 mt-2 mb-0">
                                                    {preset.desc}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 2. Operational Permissions */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
                                            <Sliders className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="mb-0 text-sm font-semibold text-slate-900 leading-tight">
                                                Operational Permissions
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5 mb-0">
                                                Granular privileges granted to this sub-recruiter profile.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                                        {Object.keys(editingMember.permissions || {}).filter(k => k.startsWith('can_') && editingMember.permissions[k]).length} of 7 Enabled
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {PERMISSION_FIELDS.map((perm) => {
                                        const isChecked = Boolean(editingMember.permissions?.[perm.key]);
                                        const PermIcon = perm.icon || Briefcase;
                                        return (
                                            <div
                                                key={perm.key}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleEditPermissionToggle(perm.key);
                                                }}
                                                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group select-none ${isChecked
                                                    ? 'border-blue-300 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/10'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70'
                                                        }`}>
                                                        <PermIcon className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h5 className="text-xs font-semibold text-slate-900 truncate leading-snug mb-0">
                                                            {perm.label}
                                                        </h5>
                                                        <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5 mb-0">
                                                            {perm.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center transition-all shrink-0 ${isChecked
                                                    ? 'bg-[#0A66C2] border border-[#0A66C2] text-white shadow-2xs'
                                                    : 'bg-white border-2 border-slate-300 group-hover:border-slate-400'
                                                    }`}>
                                                    {isChecked && (
                                                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. Quota Splitting & Allocation */}
                            <div className="bg-slate-50/80 p-3 sm:p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
                                            <Layers className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="mb-0 text-sm font-semibold text-slate-900 leading-tight">
                                                Quota Allocation & Drawing Mode
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5 mb-0">
                                                Dedicated sub-recruiter allowance vs company shared pool.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="inline-flex p-1 bg-slate-200/70 rounded-xl border border-slate-300/40 shrink-0 self-start sm:self-auto">
                                        <button
                                            type="button"
                                            onClick={() => setEditingMember({
                                                ...editingMember,
                                                permissions: {
                                                    ...editingMember.permissions,
                                                    quota_mode: 'shared'
                                                }
                                            })}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${editingMember.permissions?.quota_mode === 'shared'
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                                                }`}
                                        >
                                            Shared Pool
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingMember({
                                                ...editingMember,
                                                permissions: {
                                                    ...editingMember.permissions,
                                                    quota_mode: 'split'
                                                }
                                            })}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${editingMember.permissions?.quota_mode === 'split'
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                                                }`}
                                        >
                                            Dedicated Split
                                        </button>
                                    </div>
                                </div>

                                {editingMember.permissions?.quota_mode === 'split' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                                        {/* Job Posts Limit */}
                                        <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                                                    <span className="text-xs font-semibold text-slate-800">Job Posts</span>
                                                </div>
                                                {(() => {
                                                    const poolAvail = stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_job_posts || 0;
                                                    const maxAlloc = poolAvail + curAlloc;
                                                    return (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                            Max: {maxAlloc}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={editingMember.permissions?.used_job_posts || 0}
                                                    max={(() => {
                                                        const poolAvail = stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0;
                                                        const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_job_posts || 0;
                                                        return poolAvail + curAlloc;
                                                    })()}
                                                    value={editingMember.permissions?.allocated_job_posts || 0}
                                                    onChange={(e) => setEditingMember({
                                                        ...editingMember,
                                                        permissions: {
                                                            ...editingMember.permissions,
                                                            allocated_job_posts: Math.max(0, parseInt(e.target.value) || 0)
                                                        }
                                                    })}
                                                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                    posts
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                Already consumed: <strong>{editingMember.permissions?.used_job_posts || 0}</strong> jobs
                                            </span>
                                        </div>

                                        {/* Resume Views */}
                                        <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                                    <span className="text-xs font-semibold text-slate-800">Resume Views</span>
                                                </div>
                                                {(() => {
                                                    const poolAvail = stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_resume_views || 0;
                                                    const maxAlloc = poolAvail + curAlloc;
                                                    return (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                            Max: {maxAlloc}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={editingMember.permissions?.used_resume_views || 0}
                                                    value={editingMember.permissions?.allocated_resume_views || 0}
                                                    onChange={(e) => setEditingMember({
                                                        ...editingMember,
                                                        permissions: {
                                                            ...editingMember.permissions,
                                                            allocated_resume_views: Math.max(0, parseInt(e.target.value) || 0)
                                                        }
                                                    })}
                                                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                    views
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                Already consumed: <strong>{editingMember.permissions?.used_resume_views || 0}</strong> views
                                            </span>
                                        </div>

                                        {/* CV Downloads */}
                                        <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Download className="w-3.5 h-3.5 text-purple-600" />
                                                    <span className="text-xs font-semibold text-slate-800">CV Downloads</span>
                                                </div>
                                                {(() => {
                                                    const poolAvail = stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_resume_downloads || 0;
                                                    const maxAlloc = poolAvail + curAlloc;
                                                    return (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                            Max: {maxAlloc}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={editingMember.permissions?.used_resume_downloads || 0}
                                                    value={editingMember.permissions?.allocated_resume_downloads || 0}
                                                    onChange={(e) => setEditingMember({
                                                        ...editingMember,
                                                        permissions: {
                                                            ...editingMember.permissions,
                                                            allocated_resume_downloads: Math.max(0, parseInt(e.target.value) || 0)
                                                        }
                                                    })}
                                                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                    files
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                Already consumed: <strong>{editingMember.permissions?.used_resume_downloads || 0}</strong> files
                                            </span>
                                        </div>

                                        {/* Mail Outreach */}
                                        <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <Mail className="w-3.5 h-3.5 text-sky-600" />
                                                    <span className="text-xs font-semibold text-slate-800">Mail Outreach</span>
                                                </div>
                                                {(() => {
                                                    const poolAvail = stats.pool?.emails?.available_to_allocate ?? stats.pool?.emails?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_emails || 0;
                                                    const maxAlloc = poolAvail + curAlloc;
                                                    return (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                            Max: {maxAlloc}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={editingMember.permissions?.used_emails || 0}
                                                    value={editingMember.permissions?.allocated_emails || 0}
                                                    onChange={(e) => setEditingMember({
                                                        ...editingMember,
                                                        permissions: {
                                                            ...editingMember.permissions,
                                                            allocated_emails: Math.max(0, parseInt(e.target.value) || 0)
                                                        }
                                                    })}
                                                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                    mails
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                Already consumed: <strong>{editingMember.permissions?.used_emails || 0}</strong> mails
                                            </span>
                                        </div>

                                        {/* Excel Exports */}
                                        <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1.5">
                                                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span className="text-xs font-semibold text-slate-800">Excel Exports</span>
                                                </div>
                                                {(() => {
                                                    const poolAvail = stats.pool?.excel_downloads?.available_to_allocate ?? stats.pool?.excel_downloads?.unallocated ?? 0;
                                                    const curAlloc = team.find(t => t.id === editingMember.id)?.permissions?.allocated_excel_downloads || 0;
                                                    const maxAlloc = poolAvail + curAlloc;
                                                    return (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                            Max: {maxAlloc}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={editingMember.permissions?.used_excel_downloads || 0}
                                                    value={editingMember.permissions?.allocated_excel_downloads || 0}
                                                    onChange={(e) => setEditingMember({
                                                        ...editingMember,
                                                        permissions: {
                                                            ...editingMember.permissions,
                                                            allocated_excel_downloads: Math.max(0, parseInt(e.target.value) || 0)
                                                        }
                                                    })}
                                                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                                                    exports
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-slate-500 mt-1.5 block">
                                                Already consumed: <strong>{editingMember.permissions?.used_excel_downloads || 0}</strong> exports
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white border-1 border-blue-100 rounded-xl space-y-2.5">
                                        <div className="flex items-start gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                <Sparkles className="w-3.5 h-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 mb-0.5">
                                                    Dynamic Shared Pool Mode
                                                </p>
                                                <p className="text-xs text-slate-600 leading-relaxed mb-0">
                                                    This team member draws directly from your company's shared subscription balance without individual seat limits until total plan quotas are reached.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-blue-100/70 flex flex-wrap items-center gap-2 text-[11px]">
                                            <span className="text-slate-500 font-medium">Company Pool Balance:</span>
                                            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                <Briefcase className="w-3 h-3 text-blue-600" />
                                                Jobs: <strong>{stats.pool?.job_posts?.available_to_allocate ?? stats.pool?.job_posts?.unallocated ?? 0} avail</strong>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                <Eye className="w-3 h-3 text-indigo-600" />
                                                Views: <strong>{stats.pool?.resume_views?.available_to_allocate ?? stats.pool?.resume_views?.unallocated ?? 0} avail</strong>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                <Download className="w-3 h-3 text-purple-600" />
                                                Downloads: <strong>{stats.pool?.resume_downloads?.available_to_allocate ?? stats.pool?.resume_downloads?.unallocated ?? 0} avail</strong>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                <Mail className="w-3 h-3 text-sky-600" />
                                                Mail: <strong>{stats.pool?.emails?.available_to_allocate ?? stats.pool?.emails?.unallocated ?? 0} avail</strong>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-700 flex items-center gap-1">
                                                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                                                Excel: <strong>{stats.pool?.excel_downloads?.available_to_allocate ?? stats.pool?.excel_downloads?.unallocated ?? 0} avail</strong>
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl flex items-center justify-end gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => setEditingMember(null)}
                                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-white cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSavePermissions}
                                disabled={submitting}
                                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                <span>Save Permissions</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* 🗑️ Modal: Revoke Seat & Delete Confirmation                  */}
            {/* ============================================================ */}
            {deleteModalMember && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 mt-0">
                    <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 p-6 shadow-2xl text-center">
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                            Remove Team Member?
                        </h3>
                        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                            Are you sure you want to remove <strong className="text-slate-800">{deleteModalMember.full_name || `${deleteModalMember.first_name || ''} ${deleteModalMember.last_name || ''}`.trim() || deleteModalMember.email}</strong>? Their login will be deactivated, all individual quota allocations will return to the company pool, and 1 seat will be freed up.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteModalMember(null)}
                                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteMember}
                                disabled={submitting}
                                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                <span>Yes, Remove Member</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* 🔄 Modal: Suspend / Activate Account Confirmation             */}
            {/* ============================================================ */}
            {statusModalMember && (() => {
                const isSuspending = statusModalMember.status === 'active';
                const memberName = statusModalMember.full_name || `${statusModalMember.first_name || ''} ${statusModalMember.last_name || ''}`.trim() || statusModalMember.email;
                return (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                        <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 p-6 shadow-2xl text-center">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-2xs ${isSuspending
                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                {isSuspending ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                                {isSuspending ? 'Suspend Sub-Recruiter Access?' : 'Activate Sub-Recruiter Access?'}
                            </h3>
                            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                                {isSuspending ? (
                                    <>
                                        Are you sure you want to suspend <strong className="text-slate-800">{memberName}</strong>? This will temporarily revoke their login access and pause their recruitment activities.
                                    </>
                                ) : (
                                    <>
                                        Are you sure you want to activate <strong className="text-slate-800">{memberName}</strong>? Their login access will be immediately restored with their assigned permissions and quotas.
                                    </>
                                )}
                            </p>
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStatusModalMember(null)}
                                    className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmToggleStatus}
                                    disabled={submitting}
                                    className={`px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2 ${isSuspending
                                        ? 'bg-amber-600 hover:bg-amber-700'
                                        : 'bg-emerald-600 hover:bg-emerald-700'
                                        }`}
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <span>{isSuspending ? 'Yes, Suspend Account' : 'Yes, Activate Account'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
