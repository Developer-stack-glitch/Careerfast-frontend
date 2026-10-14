"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Ticket, Search, MoreVertical, Eye, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    MessageSquare, AlertCircle, CheckCircle2, Clock, X, Filter, RefreshCw, Send,
    Building2, Building, User, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminSelect from './AdminSelect';
import {
    getSupportTickets,
    getSupportTicketStats,
    updateSupportTicketStatus,
    addSupportTicketMessage,
    deleteSupportTicket
} from '../ApiService/action';

const PRIORITY_OPTIONS = [
    { value: 'All', label: 'All Priorities' },
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Urgent', label: 'Urgent' }
];

// ── Stat Card Component ──
const StatCard = ({ title, value, icon: Icon, color, bg, accent }) => (
    <div className="bg-white rounded-2xl p-4 group transition-all duration-300 relative overflow-hidden flex items-center gap-4">
        <div className={`p-3 rounded-xl ${bg} ${color} ring-1 ring-inset ${accent}`}>
            <Icon className="w-6 h-6" strokeWidth={1.8} />
        </div>
        <div>
            <h4 className="text-gray-500 text-sm font-medium mb-1">{title}</h4>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">{value}</h2>
        </div>
        <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${bg} opacity-50 group-hover:scale-125 transition-transform duration-500 pointer-events-none`}></div>
    </div>
);

// ── User Type Badge ──
const UserTypeBadge = ({ type, organization }) => {
    const isRecruiter = (type || '').toLowerCase() === 'recruiter';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border-1 ${isRecruiter
            ? 'bg-purple-50 text-purple-700 border-purple-200/70'
            : 'bg-blue-50 text-blue-700 border-blue-200/70'
            }`}>
            {isRecruiter ? <Building2 className="w-3 h-3 text-purple-600" /> : <User className="w-3 h-3 text-blue-600" />}
            <span>{isRecruiter ? 'Recruiter' : 'Candidate'}</span>
        </span>
    );
};

// ── Badge Components ──
const StatusBadge = ({ status }) => {
    const styles = {
        'Open': 'bg-blue-50 text-blue-700 border-blue-100',
        'In Progress': 'bg-amber-50 text-amber-700 border-amber-100',
        'Closed': 'bg-emerald-50 text-emerald-700 border-emerald-100'
    };
    const icons = {
        'Open': <AlertCircle className="w-3.5 h-3.5" />,
        'In Progress': <Clock className="w-3.5 h-3.5" />,
        'Closed': <CheckCircle2 className="w-3.5 h-3.5" />
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || styles['Open']}`}>
            {icons[status] || icons['Open']} {status}
        </span>
    );
};

const PriorityBadge = ({ priority }) => {
    const styles = {
        'Low': 'bg-gray-100 text-gray-700',
        'Medium': 'bg-blue-100 text-blue-700',
        'High': 'bg-orange-100 text-orange-700',
        'Urgent': 'bg-red-100 text-red-700'
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${styles[priority] || styles['Medium']}`}>
            {priority}
        </span>
    );
};

// ── Actions Dropdown ──
const ActionsDropdown = ({ ticket, onClose, onDelete, onViewDetails, onUpdateStatus, isBottom }) => {
    const ref = useRef(null);
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    return (
        <div ref={ref} className={`absolute right-0 ${isBottom ? 'bottom-full mb-1' : 'top-full mt-1'} w-48 bg-white rounded-xl shadow-xl border border-gray-200/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}>
            <button onClick={() => { onViewDetails(ticket); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                <Eye className="w-4 h-4" /> View Details
            </button>
            <div className="my-1 border-t border-gray-100"></div>
            <div className="px-3.5 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Update Status</div>
            {['Open', 'In Progress', 'Closed'].map(status => (
                <button key={status} onClick={() => { onUpdateStatus(ticket.id, status); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-1.5 text-[13px] text-gray-600 hover:bg-gray-50 transition-colors">
                    <div className={`w-2 h-2 rounded-full ${status === 'Open' ? 'bg-blue-500' : status === 'In Progress' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                    Mark as {status}
                </button>
            ))}
            <div className="my-1 border-t border-gray-100"></div>
            <button onClick={() => { onDelete(ticket); onClose(); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" /> Delete Ticket
            </button>
        </div>
    );
};

// ── Ticket Details Modal Component ──
const TicketModal = ({ ticket, onClose, onUpdateStatus, onAddReply }) => {
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    if (!ticket) return null;

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!replyText.trim()) return;
        setSending(true);
        try {
            await onAddReply(ticket.id, replyText.trim());
            setReplyText('');
        } catch (err) {
            console.error('Failed to send reply:', err);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50/70">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-0">
                            #{ticket.ticket_number || ticket.id}
                            <PriorityBadge priority={ticket.priority} />
                            {ticket.category && (
                                <span className="bg-purple-50 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border-1 border-purple-100">
                                    {ticket.category}
                                </span>
                            )}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1 mb-0">
                            Logged on {new Date(ticket.createdAt || ticket.created_at).toLocaleString()}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30 space-y-6">
                    {/* Subject & Status selector */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Subject</span>
                            <h3 className="text-lg font-semibold text-gray-900 mb-0">{ticket.subject}</h3>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Status</span>
                            <div className="w-36 inline-block">
                                <AdminSelect
                                    value={ticket.status}
                                    onChange={(val) => onUpdateStatus(ticket.id, val)}
                                    options={[
                                        { value: 'Open', label: 'Open' },
                                        { value: 'In Progress', label: 'In Progress' },
                                        { value: 'Closed', label: 'Closed' }
                                    ]}
                                    size="sm"
                                    align="right"
                                />
                            </div>
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="bg-white p-3.5 rounded-xl flex items-center justify-between mt-0 border border-gray-100 shadow-2xs">
                        <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-base border overflow-hidden shrink-0 shadow-2xs ${(ticket.user_type || '').toLowerCase() === 'recruiter' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                                }`}>
                                {ticket.user?.avatar ? (
                                    <img
                                        src={ticket.user.avatar}
                                        alt={ticket.user?.name || ticket.name}
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
                                    style={{ display: ticket.user?.avatar ? 'none' : 'flex' }}
                                    className="w-full h-full items-center justify-center select-none"
                                >
                                    {(ticket.user?.name || ticket.name || 'U').charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900 text-sm">{ticket.user?.name || ticket.name}</span>
                                    <UserTypeBadge type={ticket.user_type} organization={ticket.user?.organization} />
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <span>{ticket.user?.email || ticket.email}</span>
                                    {ticket.user?.organization && (
                                        <>
                                            <span className="text-gray-300">•</span>
                                            <span className="inline-flex items-center gap-1 font-medium text-purple-700 bg-purple-50/60 px-1.5 py-0.2 rounded text-[11px]">
                                                <Building className="w-3 h-3 text-purple-500" />
                                                {ticket.user.organization}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        {(ticket.user?.phone || ticket.phone) && (
                            <div className="text-xs text-gray-500 font-medium">
                                📞 {ticket.user?.phone || ticket.phone}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Original Issue Description</h4>
                        <div className="bg-white p-3.5 rounded-xl text-sm text-gray-700 leading-relaxed border border-gray-100 whitespace-pre-wrap">
                            {ticket.description}
                        </div>
                    </div>

                    {/* Discussion Thread */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-indigo-600" />
                            <span>Conversation History ({ticket.messages?.length || 0})</span>
                        </h4>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {ticket.messages && ticket.messages.length > 0 ? (
                                ticket.messages.map((msg, idx) => (
                                    <div key={idx} className={`flex flex-col ${msg.sender === 'Admin' ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-gray-600">
                                                {msg.sender === 'Admin' ? '🛡️ Admin Support' : `👤 ${msg.sender_name || 'User'}`}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {msg.time ? new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                        <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${msg.sender === 'Admin'
                                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'}`}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-gray-400 italic text-center py-2">No discussion messages yet.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Reply Box */}
                <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Type an admin reply to the user..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        />
                        <button
                            type="submit"
                            disabled={sending || !replyText.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                        >
                            {sending ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>Send</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function SupportTicket() {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState({ total: 0, open: 0, inprogress: 0, closed: 0, recruiter: { total: 0, open: 0, inprogress: 0, closed: 0 }, candidate: { total: 0, open: 0, inprogress: 0, closed: 0 } });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeUserType, setActiveUserType] = useState('All'); // 'All' | 'recruiter' | 'candidate'
    const [activeStatusFilter, setActiveStatusFilter] = useState('All');
    const [activePriorityFilter, setActivePriorityFilter] = useState('All');

    const [openDropdown, setOpenDropdown] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 10;

    // Fetch dynamic tickets and stats from backend
    const fetchTicketsData = useCallback(async () => {
        setLoading(true);
        try {
            const [ticketsRes, statsRes] = await Promise.all([
                getSupportTickets({
                    search: searchTerm,
                    status: activeStatusFilter,
                    priority: activePriorityFilter,
                    user_type: activeUserType
                }),
                getSupportTicketStats()
            ]);

            if (ticketsRes?.data?.success && ticketsRes.data.data) {
                setTickets(ticketsRes.data.data);
            }
            if (statsRes?.data?.success && statsRes.data.data) {
                setStats(statsRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching support tickets:', error);
            toast.error('Failed to load tickets from server.');
        } finally {
            setLoading(false);
        }
    }, [searchTerm, activeStatusFilter, activePriorityFilter, activeUserType]);

    useEffect(() => {
        fetchTicketsData();
    }, [fetchTicketsData]);

    const handleDeleteTicket = async (ticket) => {
        try {
            const res = await deleteSupportTicket(ticket.id || ticket.ticket_number);
            if (res?.data?.success) {
                setTickets(prev => prev.filter(t => t.id !== ticket.id));
                toast.success(`Ticket #${ticket.id} deleted successfully`);
                // Update stats
                fetchTicketsData();
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('support_ticket_changed'));
                }
            }
        } catch (error) {
            console.error('Error deleting ticket:', error);
            toast.error('Failed to delete ticket.');
        }
    };

    const handleUpdateStatus = async (ticketId, newStatus) => {
        try {
            const res = await updateSupportTicketStatus(ticketId, newStatus);
            if (res?.data?.success) {
                setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
                if (selectedTicket && selectedTicket.id === ticketId) {
                    setSelectedTicket(prev => ({ ...prev, status: newStatus }));
                }
                toast.success(`Ticket #${ticketId} status updated to ${newStatus}`);
                fetchTicketsData();
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('support_ticket_changed'));
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update ticket status.');
        }
    };

    const handleAddAdminReply = async (ticketId, text) => {
        try {
            const res = await addSupportTicketMessage(ticketId, {
                sender: 'Admin',
                sender_name: 'Super Admin',
                text
            });
            if (res?.data?.success) {
                const newMsg = {
                    sender: 'Admin',
                    sender_name: 'Super Admin',
                    text,
                    time: new Date().toISOString()
                };
                setTickets(prev => prev.map(t => {
                    if (t.id === ticketId) {
                        return { ...t, messages: [...(t.messages || []), newMsg] };
                    }
                    return t;
                }));
                if (selectedTicket && selectedTicket.id === ticketId) {
                    setSelectedTicket(prev => ({
                        ...prev,
                        messages: [...(prev.messages || []), newMsg]
                    }));
                }
                toast.success('Reply sent successfully!');
            }
        } catch (error) {
            console.error('Error posting admin message:', error);
            toast.error('Failed to post reply message.');
            throw error;
        }
    };

    // Calculate active stats dynamically for current user type selection
    const currentStats = activeUserType === 'recruiter'
        ? (stats.recruiter || { total: 0, open: 0, inprogress: 0, closed: 0 })
        : activeUserType === 'candidate'
            ? (stats.candidate || { total: 0, open: 0, inprogress: 0, closed: 0 })
            : stats;

    // Filter Logic for client-side search fine tuning if any
    const filteredTickets = tickets.filter(ticket => {
        const matchType = activeUserType === 'All' || (ticket.user_type || 'candidate').toLowerCase() === activeUserType.toLowerCase();
        const matchSearch = (ticket.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ticket.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ticket.user?.name || ticket.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ticket.user?.email || ticket.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ticket.user?.organization || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = activeStatusFilter === 'All' || ticket.status === activeStatusFilter;
        const matchPriority = activePriorityFilter === 'All' || ticket.priority === activePriorityFilter;
        return matchType && matchSearch && matchStatus && matchPriority;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage) || 1;
    const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeStatusFilter, activePriorityFilter, activeUserType]);

    return (
        <div className="animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full p-2 md:p-4 lg:p-4">
            {/* Header Section */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-2xl font-semibold text-gray-900 mb-1">Support Tickets</h1>
                    <p className="text-sm text-gray-500 mb-0">Manage user inquiries, issues, and support requests in real-time.</p>
                </div>
                <button
                    type="button"
                    onClick={() => fetchTicketsData()}
                    className="inline-flex items-center gap-2 bg-white border-1 border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-semibold transition-all self-start sm:self-auto cursor-pointer"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
                    <span>Refresh Data</span>
                </button>
            </div>

            {/* Dynamic Recruiter vs Candidate Type Selector Tabs */}
            <div className="mb-6 flex flex-wrap items-center gap-2.5 p-1.5 bg-gray-100/80 rounded-2xl w-fit border border-gray-200/60 shadow-2xs">
                <button
                    type="button"
                    onClick={() => { setActiveUserType('All'); setActiveStatusFilter('All'); }}
                    className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${activeUserType === 'All'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <Ticket className="w-4 h-4 text-gray-500" />
                    <span>All Tickets</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeUserType === 'All' ? 'bg-gray-100 text-gray-800' : 'bg-gray-200/70 text-gray-600'
                        }`}>
                        {stats.total || 0}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => { setActiveUserType('recruiter'); setActiveStatusFilter('All'); }}
                    className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${activeUserType === 'recruiter'
                        ? 'bg-white text-purple-700 shadow-sm ring-1 ring-purple-100'
                        : 'text-gray-500 hover:text-purple-700'
                        }`}
                >
                    <Building2 className={`w-4 h-4 ${activeUserType === 'recruiter' ? 'text-purple-600' : 'text-gray-400'}`} />
                    <span>Recruiter Tickets</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeUserType === 'recruiter' ? 'bg-purple-100 text-purple-800' : 'bg-gray-200/70 text-gray-600'
                        }`}>
                        {stats.recruiter?.total || 0}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => { setActiveUserType('candidate'); setActiveStatusFilter('All'); }}
                    className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${activeUserType === 'candidate'
                        ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-100'
                        : 'text-gray-500 hover:text-blue-700'
                        }`}
                >
                    <User className={`w-4 h-4 ${activeUserType === 'candidate' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span>Candidate Tickets</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeUserType === 'candidate' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200/70 text-gray-600'
                        }`}>
                        {stats.candidate?.total || 0}
                    </span>
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                <StatCard
                    title={activeUserType === 'recruiter' ? 'Recruiter Tickets' : activeUserType === 'candidate' ? 'Candidate Tickets' : 'Total Tickets'}
                    value={currentStats.total || 0}
                    icon={activeUserType === 'recruiter' ? Building2 : activeUserType === 'candidate' ? User : Ticket}
                    color={activeUserType === 'recruiter' ? 'text-purple-600' : activeUserType === 'candidate' ? 'text-blue-600' : 'text-indigo-600'}
                    bg={activeUserType === 'recruiter' ? 'bg-purple-50' : activeUserType === 'candidate' ? 'bg-blue-50' : 'bg-indigo-50'}
                    accent={activeUserType === 'recruiter' ? 'ring-purple-100' : activeUserType === 'candidate' ? 'ring-blue-100' : 'ring-indigo-100'}
                />
                <StatCard title="Open" value={currentStats.open || 0} icon={AlertCircle} color="text-blue-600" bg="bg-blue-50" accent="ring-blue-100" />
                <StatCard title="In Progress" value={currentStats.inprogress || 0} icon={Clock} color="text-amber-600" bg="bg-amber-50" accent="ring-amber-100" />
                <StatCard title="Closed" value={currentStats.closed || 0} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" accent="ring-emerald-100" />
            </div>

            {/* Filters and Search Bar Row */}
            <div className="bg-white p-4 rounded-2xl mb-6 flex flex-col lg:flex-row gap-4 justify-between lg:items-center">

                {/* Status Filters */}
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                    {['All', 'Open', 'In Progress', 'Closed'].map(status => {
                        const count = status === 'All' ? currentStats.total : currentStats[status.toLowerCase().replace(' ', '')];
                        return (
                            <button
                                key={status}
                                onClick={() => setActiveStatusFilter(status)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${activeStatusFilter === status
                                    ? activeUserType === 'recruiter' ? 'bg-purple-600 text-white shadow-sm' : 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                {status} {`(${count || 0})`}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Priority Filter */}
                    <div className="">
                        <AdminSelect
                            value={activePriorityFilter}
                            onChange={setActivePriorityFilter}
                            options={PRIORITY_OPTIONS}
                            placeholder="All Priorities"
                        />
                    </div>

                    {/* Search */}
                    <div className="relative group w-full sm:w-[260px]">
                        <input
                            type="text"
                            placeholder="Search by ID, subject or user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-4 pr-10 py-2.5 w-full bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className={`bg-white rounded-2xl ${openDropdown !== null ? '' : 'overflow-hidden'}`}>
                <div className={`min-h-[300px] ${openDropdown !== null ? '' : 'overflow-x-auto'}`}>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/70 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Ticket Details
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    User / Sender
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Priority
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4">
                                            <div className="space-y-2"><div className="h-4 w-40 bg-gray-200 rounded"></div><div className="h-3 w-24 bg-gray-200 rounded"></div></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                                <div className="space-y-2"><div className="h-4 w-24 bg-gray-200 rounded"></div><div className="h-3 w-32 bg-gray-200 rounded"></div></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><div className="h-5 w-20 bg-gray-200 rounded-full"></div></td>
                                        <td className="px-6 py-4"><div className="h-5 w-16 bg-gray-200 rounded"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-200 rounded-full"></div></td>
                                        <td className="px-6 py-4 text-center"><div className="h-8 w-8 bg-gray-200 rounded-lg mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : paginatedTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4 border border-gray-100">
                                            <Ticket className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-gray-900 font-semibold text-lg">No tickets found</h3>
                                        <p className="text-gray-500 text-sm mt-1">Try adjusting your type tabs, filters or search criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedTickets.map((ticket, idx) => {
                                    const isBottom = idx >= paginatedTickets.length - 2 && paginatedTickets.length > 3;
                                    const isRecruiter = (ticket.user_type || '').toLowerCase() === 'recruiter';

                                    return (
                                        <tr key={ticket.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1 cursor-pointer hover:text-indigo-600" onClick={() => setSelectedTicket(ticket)}>
                                                    {ticket.subject}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                                                    <span className="text-indigo-600 font-semibold">#{ticket.ticket_number || ticket.id}</span>
                                                    •
                                                    <span>{new Date(ticket.createdAt || ticket.created_at).toLocaleDateString()}</span>
                                                    {ticket.category && (
                                                        <>
                                                            •
                                                            <span className="text-gray-400">{ticket.category}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border overflow-hidden shrink-0 shadow-2xs ${isRecruiter ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                                                        }`}>
                                                        {ticket.user?.avatar ? (
                                                            <img
                                                                src={ticket.user.avatar}
                                                                alt={ticket.user?.name || ticket.name}
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
                                                            style={{ display: ticket.user?.avatar ? 'none' : 'flex' }}
                                                            className="w-full h-full items-center justify-center select-none"
                                                        >
                                                            {(ticket.user?.name || ticket.name || 'U').charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 text-sm">{ticket.user?.name || ticket.name}</div>
                                                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                            <span>{ticket.user?.email || ticket.email}</span>
                                                            {ticket.user?.organization && (
                                                                <>
                                                                    <span className="text-gray-300">•</span>
                                                                    <span className="inline-flex items-center gap-1 font-medium text-purple-700 bg-purple-50/60 px-1.5 py-0.2 rounded text-[11px]">
                                                                        <Building className="w-3 h-3 text-purple-500" />
                                                                        {ticket.user.organization}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <UserTypeBadge type={ticket.user_type} organization={ticket.user?.organization} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <PriorityBadge priority={ticket.priority} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={ticket.status} />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="relative inline-block text-left">
                                                    <button
                                                        onClick={() => setOpenDropdown(openDropdown === ticket.id ? null : ticket.id)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all focus:outline-none cursor-pointer"
                                                    >
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>
                                                    {openDropdown === ticket.id && (
                                                        <ActionsDropdown
                                                            ticket={ticket}
                                                            onClose={() => setOpenDropdown(null)}
                                                            onDelete={handleDeleteTicket}
                                                            onViewDetails={setSelectedTicket}
                                                            onUpdateStatus={handleUpdateStatus}
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
                {!loading && filteredTickets.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                        <div className="text-sm text-gray-500">
                            Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filteredTickets.length)}</span> of <span className="font-medium text-gray-900">{filteredTickets.length}</span> tickets
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                title="Go to first page"
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:hover:bg-transparent border border-transparent hover:border-gray-200 cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                title="Previous page"
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:hover:bg-transparent border border-transparent hover:border-gray-200 cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (currentPage <= 3) pageNum = i + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = currentPage - 2 + i;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 flex items-center justify-center text-sm font-semibold rounded-lg transition-all cursor-pointer ${currentPage === pageNum
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                title="Next page"
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:hover:bg-transparent border border-transparent hover:border-gray-200 cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                title="Go to last page"
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-40 disabled:hover:bg-transparent border border-transparent hover:border-gray-200 cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Ticket Details Modal */}
            <TicketModal
                ticket={selectedTicket}
                onClose={() => setSelectedTicket(null)}
                onUpdateStatus={handleUpdateStatus}
                onAddReply={handleAddAdminReply}
            />
        </div>
    );
}
