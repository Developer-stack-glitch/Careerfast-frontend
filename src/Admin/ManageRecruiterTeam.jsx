'use client';
import React, { useState, useEffect } from 'react';
import {
    Users, UserPlus, Check, X, Mail, Trash2, Edit3,
    CheckCircle2, XCircle, Loader2, RefreshCw,
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
import toast from 'react-hot-toast';

// Role presets definition
const ROLE_PRESETS = [
    {
        id: 'team_admin',
        title: 'Team Admin',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        desc: 'Full operational access. Can post jobs, manage all applications, search candidates, and update company profile.',
        permissions: {
            can_post_jobs: true,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_manage_applications: true,
            can_edit_company_profile: true
        }
    },
    {
        id: 'recruiter',
        title: 'Standard Recruiter',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        desc: 'Primary hiring role. Can publish vacancies, review applicants, download CVs, and shortlist candidates.',
        permissions: {
            can_post_jobs: true,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_manage_applications: true,
            can_edit_company_profile: false
        }
    },
    {
        id: 'sourcer',
        title: 'Sourcer / Reviewer',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        desc: 'Candidate search and review only. Can search and review applications, but cannot publish new paid jobs.',
        permissions: {
            can_post_jobs: false,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_manage_applications: true,
            can_edit_company_profile: false
        }
    },
    {
        id: 'custom',
        title: 'Custom Access',
        badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
        desc: 'Manually select granular permissions for this sub-recruiter.',
        permissions: {
            can_post_jobs: false,
            can_view_resumes: true,
            can_download_resumes: false,
            can_contact_candidates: false,
            can_manage_applications: false,
            can_edit_company_profile: false
        }
    }
];

export default function ManageRecruiterTeam({ recruiterId, isAdminView = false }) {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [team, setTeam] = useState([]);
    const [stats, setStats] = useState({
        sub_recruiter_limit: 1,
        total_members: 0,
        active_members: 0,
        remaining_seats: 1,
        company_name: 'Company'
    });

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);

    // Form state
    const initialFormState = {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        designation: 'Recruitment Associate',
        role_preset: 'recruiter',
        permissions: { ...ROLE_PRESETS.find(r => r.id === 'recruiter').permissions }
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
                if (res.data.data.stats) {
                    setStats(res.data.data.stats);
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
        const selected = ROLE_PRESETS.find(r => r.id === presetId);
        if (selected) {
            setFormData(prev => ({
                ...prev,
                role_preset: presetId,
                permissions: { ...selected.permissions }
            }));
        }
    };

    const handlePermissionToggle = (key) => {
        setFormData(prev => ({
            ...prev,
            role_preset: 'custom',
            permissions: {
                ...prev.permissions,
                [key]: !prev.permissions[key]
            }
        }));
    };

    const handleCreateSubRecruiter = async (e) => {
        e.preventDefault();
        if (!formData.first_name.trim() || !formData.email.trim() || !formData.password.trim()) {
            toast.error("Please fill in first name, email, and password.");
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                ...formData,
                main_recruiter_id: recruiterId
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
                permissions: editingMember.permissions
            });
            if (res?.data?.success) {
                toast.success("Permissions updated successfully.");
                setEditingMember(null);
                loadTeamData();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update permissions.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (member) => {
        const nextStatus = member.status === 'active' ? 'suspended' : 'active';
        try {
            const res = await toggleSubRecruiterStatus(member.id, nextStatus);
            if (res?.data?.success) {
                toast.success(`Sub-recruiter account ${nextStatus === 'active' ? 'activated' : 'suspended'}.`);
                loadTeamData();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status.");
        }
    };

    const handleDeleteMember = async (member) => {
        if (!confirm(`Are you sure you want to remove ${member.full_name || member.email} from the company team?`)) {
            return;
        }
        try {
            const res = await deleteSubRecruiter(member.id);
            if (res?.data?.success) {
                toast.success("Sub-recruiter removed from team.");
                loadTeamData();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to remove sub-recruiter.");
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
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
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
                            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200/60 shadow-xs">
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
                        <h3 className="text-sm font-bold text-slate-900 mb-0">Team Members List</h3>
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

                                            {/* Designation */}
                                            <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                                                {member.designation || 'Recruiter'}
                                            </td>

                                            {/* Role Preset */}
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${preset.badgeColor}`}>
                                                    {preset.title}
                                                </span>
                                            </td>

                                            {/* Granted Permissions Pills */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-wrap gap-1 max-w-[320px]">
                                                    {perms.can_post_jobs && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                            Post Jobs
                                                        </span>
                                                    )}
                                                    {perms.can_view_resumes && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                            View Resumes
                                                        </span>
                                                    )}
                                                    {perms.can_download_resumes && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-100">
                                                            Downloads
                                                        </span>
                                                    )}
                                                    {perms.can_contact_candidates && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                            Contact
                                                        </span>
                                                    )}
                                                    {perms.can_manage_applications && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                            Shortlisting
                                                        </span>
                                                    )}
                                                    {perms.can_edit_company_profile && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                            Company Profile
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${member.status === 'active' && member.user_active
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
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
                                                        onClick={() => setEditingMember({ ...member })}
                                                        title="Edit Access Permissions"
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>

                                                    {/* Suspend / Activate */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(member)}
                                                        title={member.status === 'active' ? 'Suspend Access' : 'Activate Access'}
                                                        className={`p-1.5 rounded-lg transition-colors border border-transparent ${member.status === 'active'
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
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto mt-0">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 mb-0 flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-blue-600" />
                                    Add New Sub-Recruiter
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5 mb-0">
                                    Creates a dedicated login account with specified permissions under your company quota.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubRecruiter} className="space-y-4 pt-4">
                            {/* Personal & Login Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        placeholder="e.g. Rahul"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        placeholder="e.g. Sharma"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Official Email *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="rahul@company.com"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+91 9876543210"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Designation
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.designation}
                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                        placeholder="e.g. Senior Tech Recruiter"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Temporary Password *
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Role Preset Selector */}
                            <div className="pt-2">
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Select Role Preset
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {ROLE_PRESETS.slice(0, 3).map((r) => (
                                        <div
                                            key={r.id}
                                            onClick={() => handleRolePresetSelect(r.id)}
                                            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${formData.role_preset === r.id
                                                ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-100'
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-900">{r.title}</span>
                                                {formData.role_preset === r.id && (
                                                    <Check className="w-3.5 h-3.5 text-blue-600" />
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 mb-0">
                                                {r.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Granular Permission Toggles */}
                            <div className="pt-2">
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Granular Permissions (Customizable)
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.can_post_jobs}
                                            onChange={() => handlePermissionToggle('can_post_jobs')}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-800 font-medium">Publish & Manage Jobs</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.can_view_resumes}
                                            onChange={() => handlePermissionToggle('can_view_resumes')}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-800 font-medium">View Candidate Resumes</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.can_download_resumes}
                                            onChange={() => handlePermissionToggle('can_download_resumes')}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-800 font-medium">Download Resumes / CVs</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.can_contact_candidates}
                                            onChange={() => handlePermissionToggle('can_contact_candidates')}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-800 font-medium">Contact Candidates Directly</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.can_manage_applications}
                                            onChange={() => handlePermissionToggle('can_manage_applications')}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-800 font-medium">Shortlist & Reject Candidates</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.can_edit_company_profile}
                                            onChange={() => handlePermissionToggle('can_edit_company_profile')}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-800 font-medium">Edit Company Profile</span>
                                    </label>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 mb-0">
                                    Edit Permissions: {editingMember.full_name}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5 mb-0">
                                    Update designations and feature access rights.
                                </p>
                            </div>
                            <button
                                onClick={() => setEditingMember(null)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Designation
                                </label>
                                <input
                                    type="text"
                                    value={editingMember.designation || ''}
                                    onChange={(e) => setEditingMember({ ...editingMember, designation: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Feature Access Toggles
                                </label>
                                <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs">
                                    {[
                                        { key: 'can_post_jobs', label: 'Publish & Manage Job Postings' },
                                        { key: 'can_view_resumes', label: 'View Candidate Profiles & Resumes' },
                                        { key: 'can_download_resumes', label: 'Download Candidate Resumes / CVs' },
                                        { key: 'can_contact_candidates', label: 'Direct Candidate Contact (Email/Phone)' },
                                        { key: 'can_manage_applications', label: 'Shortlist, Schedule Interviews & Reject' },
                                        { key: 'can_edit_company_profile', label: 'Update Company Branding & Profile' }
                                    ].map(({ key, label }) => (
                                        <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(editingMember.permissions?.[key])}
                                                onChange={() => {
                                                    setEditingMember({
                                                        ...editingMember,
                                                        role_preset: 'custom',
                                                        permissions: {
                                                            ...editingMember.permissions,
                                                            [key]: !editingMember.permissions?.[key]
                                                        }
                                                    });
                                                }}
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                            />
                                            <span className="text-slate-800 font-medium">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingMember(null)}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSavePermissions}
                                    disabled={submitting}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2"
                                >
                                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>Save Permissions</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
