'use client';
import React, { useState } from 'react';
import { Calendar, Clock, Plus, AlertCircle, X, Loader2, CheckCircle2 } from 'lucide-react';
import { extendAdminRecruiterSubscription } from '../ApiService/action';
import toast from 'react-hot-toast';

export default function ExtendSubscriptionModal({ recruiter, isOpen = true, onClose, onSuccess }) {
    const [selectedDays, setSelectedDays] = useState(30);
    const [customDays, setCustomDays] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [reason, setReason] = useState('Promotional extension granted by Super Admin');
    const [submitting, setSubmitting] = useState(false);

    if ((isOpen !== undefined && !isOpen) || !recruiter) return null;

    const currentExpiry = recruiter.subscription_expiry ? new Date(recruiter.subscription_expiry) : new Date();
    const now = new Date();
    const baseDate = currentExpiry > now ? currentExpiry : now;

    const effectiveDays = isCustom ? (Number(customDays) || 0) : selectedDays;
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + effectiveDays);

    const formatDate = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const handleQuickSelect = (days) => {
        setSelectedDays(days);
        setIsCustom(false);
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (effectiveDays <= 0) {
            toast.error("Please specify a positive number of days to extend.");
            return;
        }

        try {
            setSubmitting(true);
            const res = await extendAdminRecruiterSubscription(recruiter.recruiter_id || recruiter.id, {
                days: effectiveDays,
                reason: reason.trim()
            });

            if (res?.data?.success) {
                toast.success(`Subscription extended by ${effectiveDays} days!`);
                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (err) {
            console.error(err);
            const errMsg = err?.response?.data?.message || "Failed to extend subscription.";
            toast.error(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 mt-0">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 font-sans">
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-0">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Extend Subscription
                        </h3>
                        <p className="text-[13px] text-gray-500 mt-0.5 mb-0">
                            Extend active validity for <strong>{recruiter.company_name || recruiter.recruiter_name}</strong>.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Expiry calculation preview */}
                <div className="my-3 p-3 bg-gray-50 rounded-xl border border-gray-100 grid grid-cols-2 gap-3 text-center">
                    <div>
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Current Expiry</span>
                        <span className="text-sm font-bold text-gray-800 mt-1 block">
                            {formatDate(currentExpiry)}
                        </span>
                    </div>
                    <div>
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">New Expiry</span>
                        <span className="text-sm font-bold text-blue-700 mt-1 block">
                            {formatDate(newExpiry)}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Quick day buttons */}
                    <div>
                        <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-2">
                            Extend By
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[7, 15, 30, 60, 90].map((days) => (
                                <button
                                    key={days}
                                    type="button"
                                    onClick={() => handleQuickSelect(days)}
                                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${!isCustom && selectedDays === days
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    +{days} Days
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setIsCustom(true)}
                                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${isCustom
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                Custom Days
                            </button>
                        </div>
                    </div>

                    {/* Custom Days Input */}
                    {isCustom && (
                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                                Enter Custom Number of Days
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={customDays}
                                onChange={(e) => setCustomDays(e.target.value)}
                                placeholder="e.g., 45"
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                                required
                            />
                        </div>
                    )}

                    {/* Reason / Note */}
                    <div>
                        <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Reason / Note
                        </label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[13px] font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || effectiveDays <= 0}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-medium transition-colors shadow-sm flex items-center gap-2"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Confirm Extension
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
