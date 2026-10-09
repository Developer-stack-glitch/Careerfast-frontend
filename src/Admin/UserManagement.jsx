'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
    Users2, ShieldCheck, KeyRound, Plus, Search, Filter,
    CheckCircle2, XCircle, Edit3, Trash2, Lock, Unlock,
    Eye, EyeOff, X, RefreshCw, Mail, Phone, Clock, Sparkles,
    UserCheck, Shield, ExternalLink, ArrowRight
} from 'lucide-react';
import {
    getAdminUsers,
    createAdminUser,
    updateAdminUser,
    toggleAdminUserStatus,
    resetAdminUserPassword,
    deleteAdminUser,
    getAdminRoles
} from '../ApiService/action';
import AdminSelect from './AdminSelect';
import toast from 'react-hot-toast';
import { PORTAL_MODULES } from './RolesPermissions';
import useAdminPermissions from './useAdminPermissions';

// Format Last Active
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
    return { relative: `${diffInMonths}mo ago`, exact, isOnline: false };
};

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

const TOTAL_AVAILABLE_ACTIONS = PORTAL_MODULES.reduce((sum, m) => sum + m.actions.length, 0);

const FALLBACK_DEFAULT_ROLES = [
    {
        id: 1,
        role_name: 'Super Admin',
        role_title: 'Full Super Admin',
        description: 'Unrestricted master access to all modules, actions, platform settings and user permissions.',
        department: 'Executive Management',
        is_super_admin: 1,
        is_system_role: 1,
        permissions: {}
    },
    {
        id: 2,
        role_name: 'Operations Manager',
        role_title: 'Operations Manager',
        description: 'Operational control over recruiters, job listings, talent pool, candidate applications, and support tickets.',
        department: 'Operations',
        is_super_admin: 0,
        is_system_role: 1,
        permissions: {}
    },
    {
        id: 3,
        role_name: 'Content & Job Moderator',
        role_title: 'Content & Job Moderator',
        description: 'Dedicated to reviewing, approving, rejecting, and moderating job postings and incoming tickets.',
        department: 'Moderation & Quality',
        is_super_admin: 0,
        is_system_role: 1,
        permissions: {}
    },
    {
        id: 4,
        role_name: 'Billing & Subscriptions Admin',
        role_title: 'Billing & Subscriptions Admin',
        description: 'Manage pricing tiers, custom recruiter packages, validity extensions, and billing reports.',
        department: 'Finance & Billing',
        is_super_admin: 0,
        is_system_role: 1,
        permissions: {}
    },
    {
        id: 5,
        role_name: 'Customer Support Lead',
        role_title: 'Customer Support Lead',
        description: 'Manage user inquiries, reply to tickets, review candidate records, and resolve recruiter issues.',
        department: 'Customer Support',
        is_super_admin: 0,
        is_system_role: 1,
        permissions: {}
    },
    {
        id: 6,
        role_name: 'Read-Only Auditor',
        role_title: 'Read-Only Auditor',
        description: 'View-only visibility across platform analytics, recruiter records, jobs, and applications.',
        department: 'Executive Management',
        is_super_admin: 0,
        is_system_role: 1,
        permissions: {}
    }
];

export default function UserManagement() {
    const { isSuperAdmin: currentIsSuper, currentUser } = useAdminPermissions();

    const [admins, setAdmins] = useState([]);
    const [roles, setRoles] = useState(FALLBACK_DEFAULT_ROLES);
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

    // Form state for Adding / Editing User
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        phone_code: '+91',
        password: '',
        selectedRoleId: '2',
        role_title: 'Operations Manager',
        department: 'Operations',
        is_super_admin: false,
        permissions: {}
    });

    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);

    // Fetch dynamic roles
    const fetchRoles = useCallback(async () => {
        try {
            const res = await getAdminRoles();
            if (res?.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
                setRoles(res.data.data);
                return;
            }
        } catch (e) {
            // Silently fallback without throwing
        }
        setRoles(FALLBACK_DEFAULT_ROLES);
    }, []);

    // Fetch admin users list
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
        fetchRoles();
    }, [fetchRoles]);

    useEffect(() => {
        fetchAdminList();
    }, [fetchAdminList]);

    // Handle Open Create User Modal
    const handleOpenCreate = () => {
        setSelectedAdmin(null);
        // Find default role if available
        const defaultRole = roles.find(r => r.role_title === 'Operations Manager' || r.role_name === 'Operations Manager') || roles[0];

        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            phone_code: '+91',
            password: '',
            selectedRoleId: defaultRole ? String(defaultRole.id) : '',
            role_title: defaultRole ? (defaultRole.role_title || defaultRole.role_name) : 'Operations Manager',
            department: defaultRole ? (defaultRole.department || 'Operations') : 'Operations',
            is_super_admin: defaultRole ? Boolean(defaultRole.is_super_admin) : false,
            permissions: defaultRole ? (defaultRole.permissions || {}) : {}
        });
        setShowPassword(false);
        setIsFormOpen(true);
    };

    // Handle Open Edit User Modal
    const handleOpenEdit = (admin) => {
        setSelectedAdmin(admin);

        // Find matching role in dynamic roles list
        const matchedRole = roles.find(r =>
            (r.role_title && r.role_title.toLowerCase() === (admin.role_title || '').toLowerCase()) ||
            (r.role_name && r.role_name.toLowerCase() === (admin.role_title || '').toLowerCase())
        );

        setFormData({
            first_name: admin.first_name || '',
            last_name: admin.last_name || '',
            email: admin.email || '',
            phone: admin.phone || '',
            phone_code: admin.phone_code || '+91',
            password: '',
            selectedRoleId: matchedRole ? String(matchedRole.id) : (roles[0] ? String(roles[0].id) : ''),
            role_title: admin.role_title || 'Administrator',
            department: admin.department || 'Operations',
            is_super_admin: Boolean(admin.is_super_admin),
            permissions: admin.permissions || {}
        });
        setIsFormOpen(true);
    };

    // Handle Role Selection change inside Modal
    const handleRoleSelectChange = (roleId) => {
        const found = roles.find(r => String(r.id) === String(roleId));
        if (found) {
            setFormData(prev => ({
                ...prev,
                selectedRoleId: String(found.id),
                role_title: found.role_title || found.role_name,
                department: found.department || prev.department,
                is_super_admin: Boolean(found.is_super_admin),
                permissions: found.permissions || {}
            }));
            toast.success(`Assigned Role: ${found.role_title || found.role_name}`);
        }
    };

    // Selected role metadata for preview
    const selectedRoleMeta = useMemo(() => {
        return roles.find(r => String(r.id) === String(formData.selectedRoleId)) || null;
    }, [roles, formData.selectedRoleId]);

    // Save User Form (Create / Edit)
    const handleSaveAdmin = async (e) => {
        e.preventDefault();
        if (!formData.first_name || !formData.last_name || !formData.email) {
            toast.error('Please fill in all required name and email fields.');
            return;
        }

        if (!selectedAdmin && (!formData.password || formData.password.length < 6)) {
            toast.error('Initial password must be at least 6 characters long.');
            return;
        }

        try {
            setActionLoading(true);

            // Ensure permissions come from selected dynamic role if available
            let assignedPermissions = formData.permissions;
            if (selectedRoleMeta && selectedRoleMeta.permissions) {
                assignedPermissions = selectedRoleMeta.permissions;
            }

            const payload = {
                first_name: formData.first_name.trim(),
                last_name: formData.last_name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                phone_code: formData.phone_code,
                role_title: formData.role_title,
                department: formData.department,
                is_super_admin: formData.is_super_admin,
                permissions: assignedPermissions
            };

            if (selectedAdmin) {
                // Update
                await updateAdminUser(selectedAdmin.id, payload);
                toast.success(`Administrator ${formData.first_name} updated successfully!`);
            } else {
                // Create
                payload.password = formData.password;
                await createAdminUser(payload);
                toast.success(`Administrator ${formData.first_name} created successfully!`);
            }

            setIsFormOpen(false);
            fetchAdminList();
            fetchRoles();
        } catch (err) {
            console.error('Save admin error:', err);
            toast.error(err.response?.data?.message || 'Failed to save administrator account.');
        } finally {
            setActionLoading(false);
        }
    };

    // Toggle Account Status
    const handleToggleStatus = async (admin) => {
        if (admin.id === 1) {
            toast.error('Master Super Admin cannot be suspended.');
            return;
        }
        try {
            const nextStatus = admin.is_active === 1 ? 0 : 1;
            await toggleAdminUserStatus(admin.id, nextStatus);
            toast.success(`Account ${nextStatus === 1 ? 'activated' : 'suspended'} successfully.`);
            fetchAdminList();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to toggle account status.');
        }
    };

    // Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!selectedAdmin) return;
        if (!newPassword || newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long.');
            return;
        }
        try {
            setActionLoading(true);
            await resetAdminUserPassword(selectedAdmin.id, newPassword);
            toast.success(`Password reset for ${selectedAdmin.first_name} ${selectedAdmin.last_name}!`);
            setIsPasswordModalOpen(false);
            setNewPassword('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setActionLoading(false);
        }
    };

    // Delete User
    const handleDeleteUser = async () => {
        if (!selectedAdmin) return;
        try {
            setActionLoading(true);
            await deleteAdminUser(selectedAdmin.id);
            toast.success(`Administrator account deleted.`);
            setIsDeleteModalOpen(false);
            fetchAdminList();
            fetchRoles();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete administrator.');
        } finally {
            setActionLoading(false);
        }
    };

    // Role options for select dropdown
    const roleOptions = useMemo(() => {
        return roles.map(r => ({
            value: String(r.id),
            label: `${r.role_title || r.role_name} (${r.department || 'General'})${r.is_super_admin ? ' • Full Access' : ''}`
        }));
    }, [roles]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">System</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Users & Roles</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2 mb-0">
                        <Users2 className="w-6 h-6 text-blue-600" />
                        Administrator User Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5 mb-0">
                        Manage internal administrators, credentials, account statuses, and assign dynamic security roles.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/roles-permissions"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border-1 border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl shadow-xs transition-all no-underline"
                    >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        Roles & Permissions
                    </Link>

                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-xl shadow-xs shadow-blue-500/20 transition-all cursor-pointer border-0"
                    >
                        <Plus className="w-4 h-4" />
                        Add New User
                    </button>
                </div>
            </div>

            {/* Quick Banner Linking to Roles */}
            <div className="bg-blue-50/70 border-1 border-blue-100 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-600 text-white rounded-md shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-blue-900">
                        Roles and granular permissions are managed dynamically. Need to define new permissions or edit a role?
                    </span>
                </div>
                <Link
                    href="/admin/roles-permissions"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800 bg-white px-3 py-1 rounded-lg border-1 border-blue-200 shadow-xs no-underline whitespace-nowrap"
                >
                    Manage Dynamic Roles
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-3.5 rounded-xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by name, email, phone or role..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/60 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-lg text-sm outline-none transition-all"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs border-0 bg-transparent cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <div className="w-44">
                        <AdminSelect
                            value={departmentFilter}
                            onChange={setDepartmentFilter}
                            options={DEPARTMENT_OPTIONS}
                            icon={Filter}
                            size="sm"
                        />
                    </div>

                    <div className="w-36">
                        <AdminSelect
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={STATUS_OPTIONS}
                            size="sm"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => { fetchAdminList(); fetchRoles(); }}
                        className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                        title="Refresh List"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                                <th className="py-3 px-4">Administrator</th>
                                <th className="py-3 px-4">Department</th>
                                <th className="py-3 px-4">Assigned Dynamic Role</th>
                                <th className="py-3 px-4">Last Active</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                                        <span>Loading administrators...</span>
                                    </td>
                                </tr>
                            ) : admins.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400">
                                        <UserCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm font-semibold text-gray-700 mb-0">No administrators found</p>
                                        <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria or add a new user.</p>
                                    </td>
                                </tr>
                            ) : (
                                admins.map(admin => {
                                    const isMaster = admin.id === 1;
                                    const isSuper = Boolean(admin.is_super_admin) || isMaster;
                                    const dateInfo = formatLastActive(admin.last_active || admin.created_date);

                                    // Count actions
                                    let grantedCount = 0;
                                    if (isSuper) {
                                        grantedCount = TOTAL_AVAILABLE_ACTIONS;
                                    } else if (admin.permissions) {
                                        Object.values(admin.permissions).forEach(mod => {
                                            if (typeof mod === 'object' && mod !== null) {
                                                Object.entries(mod).forEach(([k, v]) => {
                                                    if (v === true && k !== 'view' && k !== 'create_edit' && k !== 'delete') {
                                                        grantedCount++;
                                                    }
                                                });
                                            }
                                        });
                                    }

                                    return (
                                        <tr key={admin.id} className="hover:bg-gray-50/60 transition-colors">
                                            {/* Administrator Info */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs shrink-0">
                                                        {(admin.first_name || 'A').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                                                            <span className='text-sm'>{admin.first_name} {admin.last_name}</span>
                                                            {isMaster && (
                                                                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                                                                    Master
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[13px] text-gray-600 flex items-center gap-2 mt-0.5">
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="w-3 h-3 text-gray-400" />
                                                                {admin.email}
                                                            </span>
                                                            {admin.phone && (
                                                                <span className="flex items-center gap-1">
                                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                                    {admin.phone_code} {admin.phone}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Department */}
                                            <td className="py-3.5 px-4">
                                                <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-medium text-[13px]">
                                                    {admin.department || 'Operations'}
                                                </span>
                                            </td>

                                            {/* Assigned Role */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-2">
                                                    {isSuper ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-bold text-[11px] border-1 border-purple-200">
                                                            <Sparkles className="w-3 h-3 text-purple-600" />
                                                            {admin.role_title || 'Full Super Admin'}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200">
                                                            <Shield className="w-3 h-3 text-blue-600" />
                                                            {admin.role_title || 'Custom Role'}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-gray-400">
                                                        ({isSuper ? `${TOTAL_AVAILABLE_ACTIONS}/${TOTAL_AVAILABLE_ACTIONS}` : `${grantedCount}/${TOTAL_AVAILABLE_ACTIONS}`})
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Last Active */}
                                            <td className="py-3.5 px-4 text-gray-500">
                                                <div className="flex items-center gap-1.5" title={dateInfo.exact}>
                                                    {dateInfo.isOnline ? (
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0 animate-pulse"></span>
                                                    ) : (
                                                        <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    )}
                                                    <span className={dateInfo.isOnline ? 'font-bold text-emerald-700' : 'text-gray-600'}>
                                                        {dateInfo.relative}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3.5 px-4 text-center">
                                                {admin.is_active === 1 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border-1 border-emerald-200">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border-1 border-rose-200">
                                                        <XCircle className="w-3 h-3" />
                                                        Suspended
                                                    </span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEdit(admin)}
                                                        className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer border-0 bg-transparent"
                                                        title="Edit User & Role"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedAdmin(admin);
                                                            setNewPassword('');
                                                            setShowResetPassword(false);
                                                            setIsPasswordModalOpen(true);
                                                        }}
                                                        className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer border-0 bg-transparent"
                                                        title="Reset Password"
                                                    >
                                                        <KeyRound className="w-3.5 h-3.5" />
                                                    </button>

                                                    {!isMaster && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleStatus(admin)}
                                                                className={`p-1.5 rounded-lg transition-colors cursor-pointer border-0 bg-transparent ${admin.is_active === 1
                                                                    ? 'text-gray-500 hover:text-amber-600 hover:bg-amber-50'
                                                                    : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                                title={admin.is_active === 1 ? 'Suspend Account' : 'Activate Account'}
                                                            >
                                                                {admin.is_active === 1 ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedAdmin(admin);
                                                                    setIsDeleteModalOpen(true);
                                                                }}
                                                                className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border-0 bg-transparent"
                                                                title="Delete Administrator"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
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

            {/* Modal: Add / Edit User (Focused on User Details & Dynamic Role Assignment) */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-150 mt-0">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-0">
                                    {selectedAdmin ? `Edit Administrator: ${selectedAdmin.first_name}` : 'Add New Administrator'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5 mb-0">
                                    Enter user profile credentials and assign a dynamic security role.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <form id="userForm" onSubmit={handleSaveAdmin} className="p-6 overflow-y-auto space-y-4 pb-10">
                            {/* Personal Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        First Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Rahul"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        required
                                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 focus:border-blue-500 rounded-lg text-sm outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Last Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Sharma"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        required
                                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 focus:border-blue-500 rounded-lg text-sm outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Official Email <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="e.g. admin@careerfast.in"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        disabled={Boolean(selectedAdmin)}
                                        required
                                        className={`w-full px-3.5 py-2.5 bg-white border border-gray-200 focus:border-blue-500 rounded-lg text-sm outline-none transition-all ${selectedAdmin ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 9876543210"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-gray-200 focus:border-blue-500 rounded-lg text-sm outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Role Selection Dropdown (Dynamic) */}
                            <div className="pt-2 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Assign Dynamic Role <span className="text-rose-500">*</span>
                                    </label>
                                    <Link
                                        href="/admin/roles-permissions"
                                        target="_blank"
                                        className="text-[13px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 no-underline"
                                    >
                                        + Create New Role
                                        <ExternalLink className="w-3 h-3" />
                                    </Link>
                                </div>

                                <AdminSelect
                                    value={formData.selectedRoleId}
                                    onChange={handleRoleSelectChange}
                                    options={roleOptions}
                                    placeholder="Select a dynamic role..."
                                    className="w-full"
                                />

                                {/* Selected Role Preview Card */}
                                {selectedRoleMeta && (
                                    <div className="mt-3 p-3 rounded-xl bg-blue-50/60 border-1 border-blue-100 flex items-start gap-3">
                                        <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <span className="text-sm font-bold text-gray-900">
                                                    {selectedRoleMeta.role_title || selectedRoleMeta.role_name}
                                                </span>
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                                    {selectedRoleMeta.department || 'Operations'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-600 line-clamp-2 mb-0">
                                                {selectedRoleMeta.description || 'All standard module clearances and permissions for this role will be inherited.'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Department Override & Initial Password */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Department <span className="text-rose-500">*</span>
                                    </label>
                                    <AdminSelect
                                        value={formData.department}
                                        onChange={(d) => setFormData({ ...formData, department: d })}
                                        options={MODAL_DEPARTMENT_OPTIONS}
                                        className="w-full"
                                    />
                                </div>

                                {!selectedAdmin && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Initial Password <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Min 6 characters"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                required={!selectedAdmin}
                                                className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-gray-200 focus:border-blue-500 rounded-lg text-sm outline-none transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 cursor-pointer transition-colors bg-transparent border-0 flex items-center justify-center"
                                                title={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-gray-500" />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="px-4 py-2 bg-white border-1 border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl shadow-xs cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                form="userForm"
                                disabled={actionLoading}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-xs shadow-blue-500/20 transition-all cursor-pointer border-0 disabled:opacity-50 flex items-center gap-2"
                            >
                                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                {selectedAdmin ? 'Update Administrator' : 'Create Administrator'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Reset Password */}
            {isPasswordModalOpen && selectedAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-150 mt-0">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                            <KeyRound className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Reset Password</h3>
                        <p className="text-xs text-gray-600 leading-relaxed mb-4">
                            Set a new password for administrator <strong>{selectedAdmin.first_name} {selectedAdmin.last_name}</strong> ({selectedAdmin.email}).
                        </p>

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showResetPassword ? "text" : "password"}
                                        placeholder="Enter at least 6 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-gray-200 focus:border-blue-500 rounded-lg text-sm outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowResetPassword(!showResetPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 cursor-pointer transition-colors bg-transparent border-0 flex items-center justify-center"
                                        title={showResetPassword ? "Hide password" : "Show password"}
                                    >
                                        {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-gray-500" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg border-0 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg border-0 cursor-pointer shadow-xs shadow-amber-500/20 disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Delete User */}
            {isDeleteModalOpen && selectedAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-150 mt-0">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-150">
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">Delete Administrator?</h3>
                        <p className="text-xs text-gray-600 leading-relaxed mb-4">
                            Are you sure you want to permanently delete administrator account <strong>"{selectedAdmin.first_name} {selectedAdmin.last_name}"</strong>? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg border-0 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteUser}
                                disabled={actionLoading}
                                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg border-0 cursor-pointer shadow-xs shadow-rose-500/20 disabled:opacity-50"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
