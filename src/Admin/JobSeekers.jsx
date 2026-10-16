import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Users, Search,
    MoreVertical, Eye, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    MapPin, GraduationCap, CheckCircle2, XCircle,
    ChevronsUpDown, ChevronUp, ChevronDown, Clock,
    Sparkles, Calendar, UserPlus
} from 'lucide-react';
import { getUsers, getUserProfile, updateUserStatus } from '../ApiService/action';
import toast from 'react-hot-toast';
import AdminDateFilter from './AdminDateFilter';
import CandidateProfileModal from './CandidateProfileModal';

// ── Format Last Active Dynamically ──
const formatLastActive = (dateString) => {
    if (!dateString) return { relative: 'Inactive', exact: '', isOnline: false };
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return { relative: 'Inactive', exact: '', isOnline: false };

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSec = Math.floor(diffInMs / 1000);

    const exact = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
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

// ── Check if Candidate Registered Recently (within 7 days) ──
const isRecentRegistration = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
};

// ── Stat Card Component ──
const StatCard = ({ title, value, icon: Icon, color, bg, accent }) => (
    <div className="bg-white rounded-xl p-4 group transition-all duration-300 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${bg} opacity-60 -translate-y-8 translate-x-8 group-hover:scale-125 transition-transform duration-500`}></div>
        <div className="flex items-start justify-between mb-3 relative z-10">
            <div className={`p-2.5 rounded-xl ${bg} ${color} ring-1 ring-inset ${accent}`}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
            </div>
        </div>
        <div className="relative z-10">
            <h4 className="text-gray-500 text-[14px] font-medium mb-1">{title}</h4>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-0">{value}</h2>
        </div>
    </div>
);

// ── Actions Dropdown ──
const ActionsDropdown = ({ user, onClose, onDelete, onViewProfile, onToggleStatus, isBottom }) => {
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    return (
        <div ref={ref} className={`absolute right-0 ${isBottom ? 'bottom-full mb-1' : 'top-full mt-1'} w-48 bg-white rounded-xl shadow-lg border border-gray-200/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}>
            <button onClick={() => { onViewProfile(user); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer">
                <Eye className="w-3.5 h-3.5" /> View Profile
            </button>
            <button onClick={() => { onToggleStatus(user); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                {user.status === 'Disabled' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-amber-600" />}
                {user.status === 'Disabled' ? 'Enable User' : 'Disable User'}
            </button>
            <div className="my-1 border-t border-gray-100"></div>
            <button onClick={() => { onDelete(user); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" /> Remove User
            </button>
        </div>
    );
};



export default function JobSeekers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [openDropdown, setOpenDropdown] = useState(null);
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const [selectedCandidateSummary, setSelectedCandidateSummary] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const handleViewProfile = (candidate) => {
        if (!candidate) return;
        const userId = candidate.id || candidate._id;
        setSelectedProfileId(userId);
        setSelectedCandidateSummary({
            id: userId,
            name: candidate.name || `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Candidate',
            email: candidate.email,
            phone: candidate.phone,
            location: candidate.city || candidate.location,
            profileImage: candidate.profile_image || candidate.profileImage || candidate.profile_picture || null,
            status: candidate.status,
            timeRaw: candidate.created_date || candidate.last_active
        });
    };
    const [globalStats, setGlobalStats] = useState({ total: 0, active: 0, pending: 0, recent: 0, new: 0 });
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' }); // 'candidate' | 'education' | 'status' | 'last_login' | 'created_date'
    const [dateFilter, setDateFilter] = useState({ preset: 'All Time', startDate: '', endDate: '', label: 'All Time' });

    // Pagination state
    const [matchedUsers, setMatchedUsers] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    const handleSort = (key) => {
        setSortConfig(prev => {
            if (prev.key === key) {
                if (prev.direction === 'asc') {
                    return { key, direction: 'desc' };
                }
                return { key: null, direction: 'asc' };
            }
            return { key, direction: 'asc' };
        });
        setCurrentPage(1);
    };

    const displayedUsers = useMemo(() => {
        return users;
    }, [users]);

    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchUsers();
    }, [currentPage, debouncedSearch, activeFilter, dateFilter, sortConfig]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const statusFilter = activeFilter === 'Recent' ? 'Recent' : (activeFilter !== 'All' ? activeFilter : '');
            const payload = {
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearch,
                status: statusFilter,
                role: 2,
                start_date: dateFilter.startDate || undefined,
                end_date: dateFilter.endDate || undefined,
                timeFilter: dateFilter.preset !== 'Custom Range' && dateFilter.preset !== 'All Time' ? dateFilter.preset : undefined,
                sortBy: sortConfig.key || (activeFilter === 'Recent' ? 'created_date' : undefined),
                sortOrder: sortConfig.direction || (activeFilter === 'Recent' ? 'desc' : undefined)
            };
            const response = await getUsers(payload);
            const responseData = response?.data?.data;

            let usersArray = [];
            if (responseData && responseData.users) {
                // Paginated response
                usersArray = responseData.users;
                setMatchedUsers(responseData.total);
                setTotalPages(responseData.totalPages || 1);
            } else if (Array.isArray(responseData)) {
                // Fallback if not paginated
                usersArray = responseData;
                setMatchedUsers(usersArray.length);
                setTotalPages(1);
            }

            // Filter for only Candidates and map status 
            // Note: Since we are using backend pagination, if backend doesn't filter role, we might have wrong count.
            // But we already added status and search filter to backend.
            const allCandidates = usersArray.map(u => {
                const isActive = u.is_active?.data ? u.is_active.data[0] === 1 : (u.is_active === 1 || u.is_active === true);
                return {
                    ...u,
                    status: isActive ? 'Active' : 'Disabled'
                };
            });

            const recentCount = allCandidates.filter(u => isRecentRegistration(u.created_date)).length;
            if (!responseData?.users) {
                setGlobalStats({
                    total: allCandidates.length,
                    active: allCandidates.filter(u => u.status === 'Active').length,
                    pending: allCandidates.filter(u => u.status === 'Disabled').length,
                    recent: recentCount,
                    new: allCandidates.length > 5 ? 5 : allCandidates.length
                });
            } else {
                setGlobalStats(prev => ({
                    ...prev,
                    total: responseData.stats?.total || responseData.total || 0,
                    active: responseData.stats?.active || 0,
                    pending: responseData.stats?.pending || 0,
                    recent: responseData.stats?.recent !== undefined ? responseData.stats.recent : (recentCount || prev.recent || 0)
                }));
            }

            setUsers(allCandidates);

        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load job seekers");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = (user) => {
        // Mock delete functionality
        toast.success(`User ${user.first_name || user.name || 'deleted'} successfully`);
        fetchUsers();
    };

    const handleToggleStatus = async (user) => {
        try {
            const newStatus = user.status === 'Active' ? 0 : 1;
            await updateUserStatus(user.id || user._id, { is_active: newStatus });
            toast.success(`User ${newStatus ? 'enabled' : 'disabled'} successfully`);
            fetchUsers();
        } catch (error) {
            console.error("Error toggling user status:", error);
            toast.error("Failed to update user status");
        }
    };

    const filters = ['All', 'Recent', 'Active', 'Disabled'];

    return (
        <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full">
            {/* Header Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Candidates</h1>
                <p className="text-[14px] text-gray-500 mt-0">Manage and monitor all candidates across your platform.</p>
            </div>

            {/* Filters and Search Bar Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">

                {/* Left: Filter Tabs */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
                    {/* All Candidates Tab */}
                    <button
                        onClick={() => { setActiveFilter('All'); setCurrentPage(1); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${activeFilter === 'All'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>All Candidates</span>
                        <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${activeFilter === 'All' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {globalStats.total !== undefined ? globalStats.total : matchedUsers}
                        </span>
                    </button>

                    {/* Recently Registered Tab */}
                    <button
                        onClick={() => { setActiveFilter('Recent'); setCurrentPage(1); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${activeFilter === 'Recent'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span>Recently Registered</span>
                        <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${activeFilter === 'Recent' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {globalStats.recent !== undefined ? globalStats.recent : 0}
                        </span>
                    </button>

                    {/* Active Tab */}
                    <button
                        onClick={() => { setActiveFilter('Active'); setCurrentPage(1); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all ${activeFilter === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Active</span>
                        <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${activeFilter === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {globalStats.active !== undefined ? globalStats.active : 0}
                        </span>
                    </button>

                    {/* Disabled Tab */}
                    <button
                        onClick={() => { setActiveFilter('Disabled'); setCurrentPage(1); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all ${activeFilter === 'Disabled'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>Disabled</span>
                        <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${activeFilter === 'Disabled' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {globalStats.pending !== undefined ? globalStats.pending : 0}
                        </span>
                    </button>
                </div>

                {/* Right: Date Filter and Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <AdminDateFilter
                        value={dateFilter}
                        onChange={(newFilter) => {
                            setDateFilter(newFilter);
                            setCurrentPage(1);
                        }}
                    />
                    <div className="relative group w-full sm:w-[280px]">
                        <input
                            type="text"
                            placeholder="Search candidates..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="pl-4 pr-9 py-2 w-full bg-white border border-gray-200 rounded-xl text-[13px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-2xl overflow-hidden">

                <div className="overflow-x-auto pb-1 min-h-[280px] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-50 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th
                                    onClick={() => handleSort('candidate')}
                                    className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white cursor-pointer hover:text-indigo-600 select-none transition-colors group/th"
                                    title="Click to sort by Candidate"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className={sortConfig.key === 'candidate' ? 'text-indigo-600 font-bold' : ''}>CANDIDATE</span>
                                        {sortConfig.key !== 'candidate' ? (
                                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 text-gray-400 group-hover/th:opacity-70 transition-opacity" />
                                        ) : sortConfig.direction === 'asc' ? (
                                            <ChevronUp className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                                        ) : (
                                            <ChevronDown className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('education')}
                                    className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white cursor-pointer hover:text-indigo-600 select-none transition-colors group/th"
                                    title="Click to sort by Education / Location"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className={sortConfig.key === 'education' ? 'text-indigo-600 font-bold' : ''}>EDUCATION / LOCATION</span>
                                        {sortConfig.key !== 'education' ? (
                                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 text-gray-400 group-hover/th:opacity-70 transition-opacity" />
                                        ) : sortConfig.direction === 'asc' ? (
                                            <ChevronUp className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                                        ) : (
                                            <ChevronDown className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('status')}
                                    className="px-4 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white cursor-pointer hover:text-indigo-600 select-none transition-colors group/th"
                                    title="Click to sort by Status"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className={sortConfig.key === 'status' ? 'text-indigo-600 font-bold' : ''}>STATUS</span>
                                        {sortConfig.key !== 'status' ? (
                                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 text-gray-400 group-hover/th:opacity-70 transition-opacity" />
                                        ) : sortConfig.direction === 'asc' ? (
                                            <ChevronUp className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                                        ) : (
                                            <ChevronDown className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort(activeFilter === 'Recent' ? 'created_date' : 'last_login')}
                                    className="px-4 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white cursor-pointer hover:text-indigo-600 select-none transition-colors group/th"
                                    title="Click to sort by date"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className={sortConfig.key === 'last_login' || sortConfig.key === 'created_date' ? 'text-indigo-600 font-bold' : ''}>
                                            {activeFilter === 'Recent' ? 'REGISTERED DATE' : 'LAST LOGIN / REGISTERED'}
                                        </span>
                                        {sortConfig.key !== 'last_login' && sortConfig.key !== 'created_date' ? (
                                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 text-gray-400 group-hover/th:opacity-70 transition-opacity" />
                                        ) : sortConfig.direction === 'asc' ? (
                                            <ChevronUp className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                                        ) : (
                                            <ChevronDown className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-4 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white text-center">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                                                <div className="space-y-2"><div className="h-4 w-32 bg-gray-200 rounded"></div><div className="h-3 w-24 bg-gray-200 rounded"></div></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 space-y-2"><div className="h-4 w-40 bg-gray-200 rounded"></div><div className="h-3 w-32 bg-gray-200 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-200 rounded-full"></div></td>
                                        <td className="px-6 py-4 space-y-1.5"><div className="h-4 w-24 bg-gray-200 rounded"></div><div className="h-3 w-16 bg-gray-200 rounded"></div></td>
                                        <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-gray-200 rounded-lg ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : displayedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                                            <Users className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-gray-900 font-medium text-base">No candidates found</h3>
                                        <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search term.</p>
                                    </td>
                                </tr>
                            ) : (
                                displayedUsers.map((user, idx) => {
                                    const isBottom = idx >= displayedUsers.length - 2 && displayedUsers.length > 3;
                                    const name = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown';
                                    const activity = formatLastActive(user.last_login || user.created_date);
                                    const candidateAvatar = user.profile_image || user.profileImage || user.profile_picture || user.avatar;

                                    return (
                                        <tr key={user.id || user._id || idx} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        onClick={() => handleViewProfile(user)}
                                                        className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-100 shadow-2xs overflow-hidden cursor-pointer hover:opacity-85 transition-opacity shrink-0"
                                                        title="View candidate profile"
                                                    >
                                                        {candidateAvatar && candidateAvatar !== 'null' && candidateAvatar !== '#' ? (
                                                            <img
                                                                src={candidateAvatar}
                                                                alt={name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    if (e.currentTarget.nextSibling) {
                                                                        e.currentTarget.nextSibling.style.display = 'flex';
                                                                    }
                                                                }}
                                                            />
                                                        ) : null}
                                                        <span
                                                            style={{ display: candidateAvatar && candidateAvatar !== 'null' && candidateAvatar !== '#' ? 'none' : 'flex' }}
                                                            className="w-full h-full items-center justify-center select-none"
                                                        >
                                                            {name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleViewProfile(user)}
                                                                className="font-semibold text-gray-900 text-[14px] hover:text-indigo-600 transition-colors cursor-pointer text-left focus:outline-none block truncate max-w-xs"
                                                                title="View candidate profile"
                                                            >
                                                                {name}
                                                            </button>
                                                            {isRecentRegistration(user.created_date) && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200/80 shrink-0">
                                                                    <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                                                                    New
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[12px] text-gray-500 truncate max-w-xs">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-1.5 text-[13px] text-gray-700">
                                                        <GraduationCap className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        <span className="truncate max-w-[200px]" title={user.display_education || user.education_college || user.education_course || user.college_name || user.college || user.course || user.class || 'Not provided'}>
                                                            {user.display_education || user.education_college || user.education_course || user.college_name || user.college || user.course || user.class || 'Not provided'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                                                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        <span>{user.city || user.location || 'Location N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-semibold ${(user.status === 'Approved' || user.status === 'Active') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${(user.status === 'Approved' || user.status === 'Active') ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                    {user.status || 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    {activity.isOnline ? (
                                                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[12px] font-semibold shadow-2xs">
                                                            <span className="relative flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                            </span>
                                                            Active now
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700">
                                                            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                            <span>{activity.relative}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {user.created_date ? (
                                                    <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-1 pl-0.5">
                                                        <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                                                        <span>Joined: {new Date(user.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                ) : activity.exact && !activity.isOnline ? (
                                                    <span className="text-[11px] text-gray-400 block mt-0.5 pl-5">
                                                        {activity.exact}
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="relative inline-block text-left">
                                                    <button
                                                        onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 transition-all cursor-pointer"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {openDropdown === user.id && (
                                                        <ActionsDropdown
                                                            user={user}
                                                            onClose={() => setOpenDropdown(null)}
                                                            onDelete={handleDeleteUser}
                                                            onViewProfile={handleViewProfile}
                                                            onToggleStatus={handleToggleStatus}
                                                            isBottom={isBottom}
                                                        />
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

                {/* Pagination */}
                {!loading && matchedUsers > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                        <div className="text-[13px] text-gray-500 w-1/3">
                            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, matchedUsers)} to {Math.min(currentPage * itemsPerPage, matchedUsers)} of {matchedUsers.toLocaleString()} candidates
                        </div>
                        <div className="flex items-center justify-center gap-1.5 w-1/3">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                title="Go to first page"
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                title="Previous page"
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 flex items-center justify-center text-[13px] font-medium rounded-lg transition-all cursor-pointer ${currentPage === pageNum
                                            ? 'text-white border border-indigo-600 bg-indigo-600 shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 bg-white border border-transparent hover:border-gray-200'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <span className="text-gray-400 px-1 select-none">...</span>
                            )}
                            {totalPages > 5 && currentPage < totalPages - 2 && (
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    className={`w-8 h-8 flex items-center justify-center text-[13px] font-medium rounded-lg transition-all text-gray-600 hover:bg-gray-50 cursor-pointer`}
                                >
                                    {totalPages}
                                </button>
                            )}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                title="Next page"
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                title="Go to last page"
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-[13px] text-gray-500 w-1/3">
                            <span>Rows per page:</span>
                            <div className="relative">
                                <select className="appearance-none border-none bg-transparent pr-4 font-medium text-gray-700 outline-none cursor-pointer">
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                </select>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronRight className="w-3.5 h-3.5 rotate-90 text-gray-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Modal */}
            {selectedProfileId && (
                <CandidateProfileModal
                    userId={selectedProfileId}
                    candidateSummary={selectedCandidateSummary}
                    onClose={() => {
                        setSelectedProfileId(null);
                        setSelectedCandidateSummary(null);
                    }}
                />
            )}
        </div>
    );
}
