'use client';
import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Loader2, Building, Mail, ShieldAlert } from 'lucide-react';
import { deleteAdminRecruiter } from '../ApiService/action';
import toast from 'react-hot-toast';

export default function DeleteRecruiterModal({ recruiter, isOpen = true, onClose, onSuccess }) {
    const [deleting, setDeleting] = useState(false);

    if ((isOpen !== undefined && !isOpen) || !recruiter) return null;

    const companyName = recruiter.company_name || recruiter.recruiter_name || recruiter.email || 'this recruiter';
    const rawPlan = recruiter.plan_name || 'Free Plan';
    const planName = /custom/i.test(rawPlan) || /user\s*\d+/i.test(rawPlan) ? 'Custom Plan' : rawPlan.replace(/\s*-\s*User\s*\d+/i, '').trim();

    const handleDelete = async () => {
        try {
            setDeleting(true);
            const res = await deleteAdminRecruiter(recruiter.recruiter_id);
            if (res?.data?.success) {
                toast.success(`Account for "${companyName}" deleted successfully.`);
                if (onSuccess) onSuccess();
                onClose();
            } else {
                toast.error(res?.data?.message || "Failed to delete recruiter account.");
            }
        } catch (err) {
            console.error("Error deleting recruiter:", err);
            toast.error(err?.response?.data?.message || err?.message || "Failed to delete recruiter account.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 font-sans relative transform transition-all animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={deleting}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Warning Icon Badge */}
                <div className="flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 border-1 border-rose-100 flex items-center justify-center text-rose-600 shadow-sm shadow-rose-100/50 mb-3.5">
                        <Trash2 className="w-7 h-7" />
                    </div>

                    <h3 className="text-xl font-semibold text-slate-900 mb-1">
                        Delete Recruiter Account?
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-sm mb-0">
                        Are you sure you want to permanently delete the account for <span className="font-semibold text-slate-800">{companyName}</span>?
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
                        <span className="text-slate-400">Current Plan</span>
                        <span className="px-2 py-0.5 rounded-md font-semibold bg-white border border-slate-200 text-slate-700 text-[11px]">
                            {planName}
                        </span>
                    </div>
                </div>

                {/* Permanent Warning Box */}
                <div className="mt-3.5 p-3.5 bg-rose-50/80 border-1 border-rose-100 rounded-2xl text-left">
                    <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                        <div className="text-xs text-rose-900 leading-relaxed">
                            <span className="font-semibold block mb-0.5 text-rose-950">This action is irreversible</span>
                            All active subscriptions, job postings, team seats, candidate unlock quotas, and company profile records will be permanently removed.
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] shadow-md shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                    >
                        {deleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Deleting...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                <span>Delete Account</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
