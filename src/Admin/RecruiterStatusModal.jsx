'use client';
import React, { useState } from 'react';
import {
    AlertTriangle, CheckCircle2, X, Loader2,
    Building, Mail, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { updateAdminRecruiterStatus } from '../ApiService/action';
import toast from 'react-hot-toast';

export default function RecruiterStatusModal({
    recruiter,
    isOpen = true,
    onClose,
    onSuccess
}) {
    const [submitting, setSubmitting] = useState(false);
    const [reason, setReason] = useState('');

    if ((isOpen !== undefined && !isOpen) || !recruiter) return null;

    // Determine current active status
    const isCurrentlyActive = Boolean(
        recruiter.user_active === 1 ||
        recruiter.user_active === true ||
        recruiter.user_active === '1' ||
        (recruiter.user_active?.data && recruiter.user_active.data[0] === 1) ||
        recruiter.is_active === 1 ||
        recruiter.is_active === true ||
        (recruiter.is_active?.data && recruiter.is_active.data[0] === 1)
    );

    const isSuspending = isCurrentlyActive;
    const companyName = recruiter.company_name || recruiter.recruiter_name || recruiter.email || 'this recruiter';
    const email = recruiter.email || recruiter.contact_email || '—';

    const handleConfirm = async () => {
        try {
            setSubmitting(true);
            const nextActive = isSuspending ? 0 : 1;
            const newStatus = nextActive ? 'active' : 'suspended';
            const defaultReason = isSuspending ? 'Suspended by Super Admin' : 'Reactivated by Super Admin';

            const res = await updateAdminRecruiterStatus(recruiter.recruiter_id || recruiter.id, {
                is_active: nextActive,
                status: newStatus,
                reason: reason.trim() || defaultReason
            });

            if (res?.data?.success || res?.status === 200) {
                toast.success(`Account for "${companyName}" has been ${isSuspending ? 'suspended' : 'activated'}.`);
                if (onSuccess) onSuccess(nextActive);
                onClose();
            } else {
                toast.error(res?.data?.message || `Failed to ${isSuspending ? 'suspend' : 'activate'} account.`);
            }
        } catch (err) {
            console.error("Error toggling recruiter status:", err);
            const msg = err?.response?.data?.message || err?.message || `Failed to ${isSuspending ? 'suspend' : 'activate'} account.`;
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 mt-0">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 font-sans relative transform transition-all animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={submitting}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon Badge */}
                <div className="flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm mb-3.5 ${isSuspending
                        ? 'bg-rose-50 border-1 border-rose-100 text-rose-600 shadow-rose-100/50'
                        : 'bg-emerald-50 border-1 border-emerald-100 text-emerald-600 shadow-emerald-100/50'
                        }`}>
                        {isSuspending ? <ShieldAlert className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
                    </div>

                    <h3 className="text-xl font-semibold text-slate-900 mb-1">
                        {isSuspending ? 'Suspend Recruiter Account?' : 'Activate Recruiter Account?'}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-sm mb-0">
                        {isSuspending ? (
                            <>Are you sure you want to suspend <span className="font-semibold text-slate-800">{companyName}</span>? They will lose login and portal access immediately.</>
                        ) : (
                            <>Are you sure you want to reactivate <span className="font-semibold text-slate-800">{companyName}</span>? They will regain full portal access.</>
                        )}
                    </p>
                </div>

                {/* Recruiter Details Card */}
                <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" /> Company
                        </span>
                        <span className="font-semibold text-slate-800 max-w-[200px] truncate">{companyName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> Email
                        </span>
                        <span className="font-medium text-slate-700 max-w-[200px] truncate">{email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400">Current Status</span>
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${isCurrentlyActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                            {isCurrentlyActive ? 'Active' : 'Suspended'}
                        </span>
                    </div>
                </div>

                {/* Impact Notice Box */}
                <div className={`mt-3.5 p-3.5 border-1 rounded-2xl text-left ${isSuspending
                    ? 'bg-amber-50/80 border-amber-200/80 text-amber-900'
                    : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900'
                    }`}>
                    <div className="flex items-start gap-2.5">
                        {isSuspending ? (
                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        )}
                        <div className="text-xs leading-relaxed">
                            <span className="font-semibold block mb-0.5">
                                {isSuspending ? 'Immediate Access Revocation' : 'Immediate Access Restoration'}
                            </span>
                            {isSuspending
                                ? 'Team members will be logged out, and posted jobs will be temporarily suppressed from candidate search until reactivated.'
                                : 'The recruiter and sub-recruiters will immediately be able to log in, manage applications, and post new jobs.'}
                        </div>
                    </div>
                </div>

                {/* Optional Note / Reason */}
                <div className="mt-3.5">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Reason / Audit Note <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={isSuspending ? "e.g. Terms violation or requested account pause" : "e.g. Account verified and reactivated"}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                    />
                </div>

                {/* Actions */}
                <div className="mt-5 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={submitting}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-white shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 ${isSuspending
                            ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                            }`}
                    >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>{isSuspending ? 'Suspend Account' : 'Activate Account'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
