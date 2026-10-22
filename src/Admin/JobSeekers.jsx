import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Users, Search,
    MoreVertical, Eye, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    MapPin, GraduationCap, CheckCircle2, XCircle,
    ChevronsUpDown, ChevronUp, ChevronDown, Clock,
    Sparkles, Calendar, AlertTriangle, AlertCircle, X, Loader2
} from 'lucide-react';
import { getUsers, updateUserStatus, deleteUser } from '../ApiService/action';
import toast from 'react-hot-toast';
import AdminDateFilter from './AdminDateFilter';
import CandidateProfileModal from './CandidateProfileModal';

// ── Helper to safely parse Date Strings (handles 'YYYY-MM-DD HH:MM:SS' and ISO) ──
const parseDateSafe = (dateString) => {
    if (!dateString) return null;
    const date = new Date(typeof dateString === 'string' ? dateString.replace(' ', 'T') : dateString);
    return isNaN(date.getTime()) ? null : date;
};

// ── Format Date and Hour/Time Cleanly ──
const formatDateTime = (dateString) => {
    const date = parseDateSafe(dateString);
    if (!date) return { date: '—', time: '—' };

    const dateFormatted = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    const timeFormatted = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    return { date: dateFormatted, time: timeFormatted };
};

// ── Format Last Active Dynamically ──
const formatLastActive = (dateString) => {
    const date = parseDateSafe(dateString);
    if (!date) return { relative: 'Inactive', exact: '—', time: '—', isOnline: false };

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSec = Math.floor(diffInMs / 1000);

    const exact = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    const time = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    if (diffInSec < 0 || diffInSec < 60) return { relative: 'Active now', exact, time, isOnline: true };

    const diffInMin = Math.floor(diffInSec / 60);
    if (diffInMin < 15) return { relative: 'Active now', exact, time, isOnline: true };
    if (diffInMin < 60) return { relative: `${diffInMin}m ago`, exact, time, isOnline: false };

    const diffInHours = Math.floor(diffInMin / 60);
    if (diffInHours < 24) return { relative: `${diffInHours}h ago`, exact, time, isOnline: false };

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return { relative: 'Yesterday', exact, time, isOnline: false };
    if (diffInDays < 7) return { relative: `${diffInDays}d ago`, exact, time, isOnline: false };

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return { relative: `${diffInWeeks}w ago`, exact, time, isOnline: false };

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return { relative: `${diffInMonths}mo ago`, exact, time, isOnline: false };

    const diffInYears = Math.floor(diffInDays / 365);
    return { relative: `${diffInYears}y ago`, exact, time, isOnline: false };
};

// ── Check if Candidate Registered Recently (within 7 days) ──
const isRecentRegistration = (dateString) => {
    const date = parseDateSafe(dateString);
    if (!date) return false;
    const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
};

// ── Calculate candidate profile completion percentage (0 - 100) ──
export const calculateCandidateCompletion = (u) => {
    if (!u) return 0;
    if (u.profile_completion !== undefined && u.profile_completion !== null && !isNaN(Number(u.profile_completion))) {
        return Math.min(100, Math.max(0, Math.round(Number(u.profile_completion))));
    }

    let score = 0;
    // 1. Basic details (Name, Email, Phone) - 20%
    const hasName = Boolean((u.name || `${u.first_name || ''} ${u.last_name || ''}`).trim());
    const hasEmail = Boolean((u.email || '').trim());
    const rawPhone = String(u.phone || '').trim().toLowerCase();
    const hasPhone = Boolean(rawPhone && !['null', 'undefined', 'n/a', '-', ''].includes(rawPhone));
    if (hasName && hasEmail && hasPhone) score += 20;
    else if (hasName && (hasEmail || hasPhone)) score += 10;

    // 2. Profile Photo - 10%
    const avatar = u.profile_image || u.profileImage || u.profile_picture || u.avatar;
    if (avatar && avatar !== 'null' && avatar !== '#' && avatar !== 'default.png') score += 10;

    // 3. Location - 10%
    const loc = u.location || u.city || u.preferred_locations;
    if (loc && !['Location N/A', 'Not Specified', 'N/A', 'null', ''].includes(String(loc).trim())) score += 10;

    // 4. Headline or Summary/About - 10%
    if ((u.headline && u.headline.trim()) || (u.about && u.about.trim())) score += 10;

    // 5. Experience / Fresher status - 15%
    const hasExp = Boolean(u.experince_type || u.experience_type || u.experience || u.is_fresher || Number(u.total_years) > 0);
    if (hasExp) score += 15;

    // 6. Education - 15%
    const hasEdu = Boolean(u.display_education || u.education_college || u.education_course || u.college || u.course || u.qualification);
    if (hasEdu && !['Not provided', 'N/A', 'null', ''].includes(String(u.display_education || '').trim())) score += 15;

    // 7. Skills - 10%
    const rawSkills = u.skills;
    if (rawSkills && rawSkills !== '[]' && rawSkills !== 'null' && (Array.isArray(rawSkills) ? rawSkills.length > 0 : String(rawSkills).trim().length > 2)) {
        score += 10;
    }

    // 8. Resume - 10%
    const resume = u.resume;
    if (resume && resume !== 'Resume' && resume !== '#' && resume !== 'null') score += 10;

    return Math.min(100, Math.max(0, score));
};

// ── Dynamic Progress Styling based on Completion Percentage ──
export const getCompletionConfig = (percent) => {
    if (percent >= 80) {
        return {
            bg: 'bg-emerald-500',
            badgeBg: 'bg-emerald-50',
            badgeBorder: 'border-emerald-200/80',
            textColor: 'text-emerald-700',
            label: 'All-Star',
            barGradient: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
        };
    }
    if (percent >= 50) {
        return {
            bg: 'bg-amber-500',
            badgeBg: 'bg-amber-50',
            badgeBorder: 'border-amber-200/80',
            textColor: 'text-amber-700',
            label: 'Intermediate',
            barGradient: 'linear-gradient(90deg, #ea580c 0%, #f59e0b 100%)',
        };
    }
    return {
        bg: 'bg-rose-500',
        badgeBg: 'bg-rose-50',
        badgeBorder: 'border-rose-200/80',
        textColor: 'text-rose-700',
        label: 'Basic',
        barGradient: 'linear-gradient(90deg, #e11d48 0%, #fb7185 100%)',
    };
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
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeletingUser, setIsDeletingUser] = useState(false);

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
            timeRaw: candidate.created_date || candidate.last_active,
            completionPercentage: candidate.completionPercentage
        });
    };
    const [globalStats, setGlobalStats] = useState({ total: 0, active: 0, pending: 0, recent: 0, new: 0, new_registered: 0, last_login: 0, completed: 0, uncompleted: 0 });
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
            const statusFilter = (activeFilter !== 'All') ? activeFilter : '';
            const payload = {
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearch,
                status: statusFilter,
                role: 2,
                start_date: dateFilter.startDate || undefined,
                end_date: dateFilter.endDate || undefined,
                timeFilter: dateFilter.preset !== 'Custom Range' && dateFilter.preset !== 'All Time' ? dateFilter.preset : undefined,
                sortBy: sortConfig.key || undefined,
                sortOrder: sortConfig.direction || undefined
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

            // Filter for only Candidates, map status and calculate profile completion
            const allCandidates = usersArray.map(u => {
                const isActive = u.is_active?.data ? u.is_active.data[0] === 1 : (u.is_active === 1 || u.is_active === true);
                const completion = calculateCandidateCompletion(u);
                return {
                    ...u,
                    status: isActive ? 'Active' : 'Disabled',
                    completionPercentage: completion
                };
            });

            const completedCount = allCandidates.filter(u => u.completionPercentage >= 80).length;
            const uncompletedCount = allCandidates.filter(u => u.completionPercentage < 80).length;

            if (!responseData?.users) {
                setGlobalStats({
                    total: allCandidates.length,
                    active: allCandidates.filter(u => u.status === 'Active').length,
                    pending: allCandidates.filter(u => u.status === 'Disabled').length,
                    completed: completedCount,
                    uncompleted: uncompletedCount,
                    new: allCandidates.length > 5 ? 5 : allCandidates.length
                });
            } else {
                setGlobalStats(prev => ({
                    ...prev,
                    total: responseData.stats?.total || responseData.total || 0,
                    active: responseData.stats?.active || 0,
                    pending: responseData.stats?.pending || 0,
                    completed: responseData.stats?.completed !== undefined ? responseData.stats.completed : (completedCount || prev.completed || 0),
                    uncompleted: responseData.stats?.uncompleted !== undefined ? responseData.stats.uncompleted : (uncompletedCount || prev.uncompleted || 0),
                    recent: responseData.stats?.new_registered !== undefined ? responseData.stats.new_registered : (responseData.stats?.recent || 0),
                    new_registered: responseData.stats?.new_registered !== undefined ? responseData.stats.new_registered : (responseData.stats?.recent || 0),
                    last_login: responseData.stats?.last_login !== undefined ? responseData.stats.last_login : 0
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
        setUserToDelete(user);
        setOpenDropdown(null);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            setIsDeletingUser(true);
            const userId = userToDelete.id || userToDelete._id;
            await deleteUser(userId);
            const userName = userToDelete.name || `${userToDelete.first_name || ''} ${userToDelete.last_name || ''}`.trim() || 'Candidate';
            toast.success(`User ${userName} and login account removed successfully`);
            setUserToDelete(null);
            fetchUsers();
        } catch (error) {
            console.error("Error removing candidate:", error);
            const errorMsg = error.response?.data?.details || error.response?.data?.message || "Failed to remove candidate. Please try again.";
            toast.error(errorMsg);
        } finally {
            setIsDeletingUser(false);
        }
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
        <div className="animate-in fade-in duration-500 w-full">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                    <Users className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-0">Job Seekers</h1>
                    <p className="text-[13px] text-gray-500 mt-0.5 mb-0">Manage and monitor all candidates across your platform.</p>
                </div>
            </div>

            {/* Filters and Search Bar Row */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">

                {/* Left: Filter Tabs */}
                <div className="flex items-center gap-2.5 overflow-x-auto py-1 hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {/* All Candidates Tab */}
                    <button
                        onClick={() => { setActiveFilter('All'); setCurrentPage(1); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${activeFilter === 'All'
                            ? 'bg-indigo-50 text-indigo-700 border-1 border-indigo-100 shadow-2xs'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <Users className="w-4 h-4 shrink-0" />
                        <span className="whitespace-nowrap">All Candidates</span>
                        <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${activeFilter === 'All' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {globalStats.total !== undefined ? globalStats.total : matchedUsers}
                        </span>
                    </button>

                    {/* Active Tab */}
                    <button
                        onClick={() => { setActiveFilter('Active'); setCurrentPage(1); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${activeFilter === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-1 border-emerald-100 shadow-2xs'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                        <span className="whitespace-nowrap">Active</span>
                        <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${activeFilter === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {globalStats.active !== undefined ? globalStats.active : 0}
                        </span>
                    </button>

                    {/* New Registered Tab */}
                    <button
                        onClick={() => { setActiveFilter('New Registered'); setCurrentPage(1); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${activeFilter === 'New Registered'
                            ? 'bg-blue-50 text-blue-700 border-1 border-blue-200 shadow-2xs'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="whitespace-nowrap">New Registered</span>
                        <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${activeFilter === 'New Registered' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {globalStats.new_registered !== undefined ? globalStats.new_registered : (globalStats.recent || 0)}
                        </span>
                    </button>

                    {/* Last Login Tab */}
                    <button
                        onClick={() => { setActiveFilter('Last Login'); setCurrentPage(1); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${activeFilter === 'Last Login'
                            ? 'bg-violet-50 text-violet-700 border-1 border-violet-200 shadow-2xs'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <Clock className="w-4 h-4 text-violet-600 shrink-0" />
                        <span className="whitespace-nowrap">Last Login</span>
                        <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${activeFilter === 'Last Login' ? 'bg-violet-100 text-violet-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {globalStats.last_login !== undefined ? globalStats.last_login : 0}
                        </span>
                    </button>

                    {/* Complete Profile Tab */}
                    <button
                        onClick={() => { setActiveFilter('Complete'); setCurrentPage(1); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${activeFilter === 'Complete'
                            ? 'bg-emerald-50 text-emerald-700 border-1 border-emerald-200 shadow-2xs'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="whitespace-nowrap">Complete Profile</span>
                        <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${activeFilter === 'Complete' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {globalStats.completed !== undefined ? globalStats.completed : 0}
                        </span>
                    </button>

                    {/* Uncompleted Profile Tab */}
                    <button
                        onClick={() => { setActiveFilter('Uncompleted'); setCurrentPage(1); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${activeFilter === 'Uncompleted'
                            ? 'bg-rose-50 text-rose-700 border-1 border-rose-200 shadow-2xs'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="whitespace-nowrap">Uncompleted Profile</span>
                        <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${activeFilter === 'Uncompleted' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {globalStats.uncompleted !== undefined ? globalStats.uncompleted : 0}
                        </span>
                    </button>

                    {/* Disabled Tab */}
                    <button
                        onClick={() => { setActiveFilter('Disabled'); setCurrentPage(1); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${activeFilter === 'Disabled'
                            ? 'bg-amber-50 text-amber-700 border-1 border-amber-100 shadow-2xs'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                        <span className="whitespace-nowrap">Disabled</span>
                        <span className={`px-2 py-0.5 rounded-md text-[12px] font-bold ${activeFilter === 'Disabled' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {globalStats.pending !== undefined ? globalStats.pending : 0}
                        </span>
                    </button>
                </div>

                {/* Right: Date Filter and Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto shrink-0">
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
                    <table className="w-full min-w-[1050px] text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th
                                    onClick={() => handleSort('candidate')}
                                    className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white cursor-pointer hover:text-indigo-600 select-none transition-colors group/th"
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
                                    className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white cursor-pointer hover:text-indigo-600 select-none transition-colors group/th"
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
                                    onClick={() => handleSort('completion')}
                                    className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white cursor-pointer hover:text-indigo-600 select-none transition-colors group/th"
                                    title="Click to sort by Profile Completion"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className={sortConfig.key === 'completion' ? 'text-indigo-600 font-bold' : ''}>PROFILE COMPLETION</span>
                                        {sortConfig.key !== 'completion' ? (
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
                                    className="px-3.5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white cursor-pointer hover:text-indigo-600 select-none transition-colors group/th"
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
                                    onClick={() => handleSort('created_date')}
                                    className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white cursor-pointer hover:text-indigo-600 select-none transition-colors group/th whitespace-nowrap"
                                    title="Click to sort by Registered Date"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className={sortConfig.key === 'created_date' ? 'text-indigo-600 font-bold' : ''}>
                                            REGISTERED DATE
                                        </span>
                                        {sortConfig.key !== 'created_date' ? (
                                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 text-gray-400 group-hover/th:opacity-70 transition-opacity" />
                                        ) : sortConfig.direction === 'asc' ? (
                                            <ChevronUp className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                                        ) : (
                                            <ChevronDown className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('last_login')}
                                    className="px-4 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white cursor-pointer hover:text-indigo-600 select-none transition-colors group/th whitespace-nowrap"
                                    title="Click to sort by Last Login"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className={sortConfig.key === 'last_login' ? 'text-indigo-600 font-bold' : ''}>
                                            LAST LOGIN
                                        </span>
                                        {sortConfig.key !== 'last_login' ? (
                                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 text-gray-400 group-hover/th:opacity-70 transition-opacity" />
                                        ) : sortConfig.direction === 'asc' ? (
                                            <ChevronUp className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                                        ) : (
                                            <ChevronDown className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-3.5 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white text-center">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                                                <div className="space-y-2"><div className="h-4 w-32 bg-gray-200 rounded"></div><div className="h-3 w-24 bg-gray-200 rounded"></div></div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 space-y-2"><div className="h-4 w-40 bg-gray-200 rounded"></div><div className="h-3 w-32 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-3.5 space-y-2"><div className="h-3 w-20 bg-gray-200 rounded"></div><div className="h-2 w-28 bg-gray-200 rounded"></div></td>
                                        <td className="px-3.5 py-3.5"><div className="h-6 w-20 bg-gray-200 rounded-full"></div></td>
                                        <td className="px-4 py-3.5 space-y-1.5"><div className="h-4 w-24 bg-gray-200 rounded"></div><div className="h-3 w-16 bg-gray-200 rounded"></div></td>
                                        <td className="px-4 py-3.5 space-y-1.5"><div className="h-4 w-24 bg-gray-200 rounded"></div><div className="h-3 w-16 bg-gray-200 rounded"></div></td>
                                        <td className="px-3.5 py-3.5 text-right"><div className="h-8 w-8 bg-gray-200 rounded-lg ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : displayedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
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
                                    const regInfo = formatDateTime(user.created_date);
                                    const activity = formatLastActive(user.last_login || user.last_active);
                                    const candidateAvatar = user.profile_image || user.profileImage || user.profile_picture || user.avatar;
                                    const completion = user.completionPercentage !== undefined
                                        ? user.completionPercentage
                                        : calculateCandidateCompletion(user);
                                    const compConfig = getCompletionConfig(completion);

                                    return (
                                        <tr key={user.id || user._id || idx} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        onClick={() => handleViewProfile(user)}
                                                        className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm border-1 border-indigo-100 shadow-2xs overflow-hidden cursor-pointer hover:opacity-85 transition-opacity shrink-0"
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
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-indigo-50 text-indigo-600 border-1 border-indigo-200/80 shrink-0">
                                                                    <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                                                                    New
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[12px] text-gray-500 truncate max-w-xs">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
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
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-col gap-1.5 w-28 sm:w-32">
                                                    <div className="flex items-center justify-between text-[11px] font-bold leading-none">
                                                        <span className={compConfig.textColor}>
                                                            {completion}%
                                                        </span>
                                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border-1 ${compConfig.badgeBg} ${compConfig.badgeBorder} ${compConfig.textColor}`}>
                                                            {compConfig.label}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-300"
                                                            style={{
                                                                width: `${Math.max(6, completion)}%`,
                                                                background: compConfig.barGradient
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3.5 py-3.5">
                                                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-semibold ${(user.status === 'Approved' || user.status === 'Active') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${(user.status === 'Approved' || user.status === 'Active') ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                    {user.status || 'Disabled'}
                                                </span>
                                            </td>
                                            {/* REGISTERED DATE */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                {user.created_date ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-800">
                                                            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                            <span>{regInfo.date}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pl-5">
                                                            <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                                                            <span>{regInfo.time}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[12px] text-gray-400">—</span>
                                                )}
                                            </td>
                                            {/* LAST LOGIN */}
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                {activity.isOnline ? (
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold shadow-2xs">
                                                            <span className="relative flex h-2 w-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                            </span>
                                                            Active now
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pl-1">
                                                            <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                                                            <span>{activity.time}</span>
                                                        </div>
                                                    </div>
                                                ) : (user.last_login || user.last_active) ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-800">
                                                            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                            <span>{activity.exact}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pl-5">
                                                            <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                                                            <span>{activity.time}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[12px] text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-3.5 py-3.5 text-center">
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

            {/* Remove User & Login Confirmation Popup */}
            {userToDelete && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col">
                        {/* Header with Close */}
                        <div className="p-4 pb-0 flex items-start justify-between">
                            <div className="w-11 h-11 rounded-2xl bg-rose-50 border-1 border-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <button
                                onClick={() => !isDeletingUser && setUserToDelete(null)}
                                disabled={isDeletingUser}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body Content */}
                        <div className="p-4 pt-3">
                            <h3 className="text-base font-bold text-gray-900 mb-1">
                                Remove Candidate & Login Account?
                            </h3>
                            <p className="text-[13px] text-gray-500 mb-4 leading-relaxed">
                                Are you sure you want to remove this user? This will delete their login credentials, active sessions, and all platform profile data.
                            </p>

                            {/* Candidate Summary Card */}
                            <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3 flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden">
                                    {userToDelete.profile_image || userToDelete.profileImage ? (
                                        <img
                                            src={userToDelete.profile_image || userToDelete.profileImage}
                                            alt={userToDelete.name || userToDelete.first_name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    ) : (
                                        (userToDelete.name || userToDelete.first_name || 'C').charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-[13px] font-semibold text-gray-900 truncate">
                                        {userToDelete.name || `${userToDelete.first_name || ''} ${userToDelete.last_name || ''}`.trim() || 'Candidate'}
                                    </div>
                                    <div className="text-[11.5px] text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
                                        <span>{userToDelete.email || 'No email provided'}</span>
                                        <span>•</span>
                                        <span className="font-mono text-gray-400">ID: #{userToDelete.id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Warning Note */}
                            <div className="bg-amber-50/70 border-1 border-amber-200/60 rounded-xl p-3 text-[12px] text-amber-800 flex items-start gap-2.5">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-semibold text-amber-900">Notice:</span> All application history, login credentials, and saved profile content will be completely removed. This action cannot be undone.
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer Buttons */}
                        <div className="px-4 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setUserToDelete(null)}
                                disabled={isDeletingUser}
                                className="px-4 py-2 rounded-xl text-[15px] font-medium text-gray-700 hover:bg-gray-200/70 bg-white border border-gray-200 transition-colors disabled:opacity-40 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteUser}
                                disabled={isDeletingUser}
                                className="px-4 py-2 rounded-xl text-[15px] font-medium text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {isDeletingUser ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Removing User...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        <span>Yes, Remove User</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
