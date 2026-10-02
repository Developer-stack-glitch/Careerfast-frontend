'use client';
import React, { useState, useEffect } from 'react';
import {
    CreditCard, ArrowRight, ShieldCheck, AlertCircle,
    Check, X, Loader2, Zap, Star, Briefcase, Settings, Sparkles
} from 'lucide-react';
import { getAdminPlans, changeAdminRecruiterPlan } from '../ApiService/action';
import CustomPlanModal from './CustomPlanModal';
import toast from 'react-hot-toast';

export default function ChangePlanModal({ recruiter, isOpen = true, onClose, onSuccess, onOpenCustomPlan }) {
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [effectiveType, setEffectiveType] = useState('immediately'); // 'immediately' | 'next_renewal'
    const [reason, setReason] = useState('Plan updated by Super Admin');
    const [submitting, setSubmitting] = useState(false);
    const [showInternalCustomModal, setShowInternalCustomModal] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPlans();
        }
    }, [isOpen]);

    const fetchPlans = async () => {
        try {
            setLoadingPlans(true);
            const res = await getAdminPlans();
            if (res?.data?.success) {
                const rawList = res.data.data || [];
                // Only show standard subscription plans (exclude custom / user-specific plans)
                const list = rawList.filter(p =>
                    p.plan_type !== 'Custom' &&
                    !p.name.toLowerCase().includes('custom') &&
                    !p.name.toLowerCase().includes('user ')
                );
                setPlans(list);

                // Select first standard plan different from current, or first available
                const currentId = recruiter?.current_plan_id || recruiter?.plan_id;
                const diff = list.find(p => p.id !== currentId) || list[0];
                if (diff) setSelectedPlanId(diff.id);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load available plans.");
        } finally {
            setLoadingPlans(false);
        }
    };

    if ((isOpen !== undefined && !isOpen) || !recruiter) return null;

    const handleTriggerCustomPlan = () => {
        if (onOpenCustomPlan) {
            onClose();
            onOpenCustomPlan(recruiter);
        } else {
            setShowInternalCustomModal(true);
        }
    };

    if (showInternalCustomModal) {
        return (
            <CustomPlanModal
                recruiter={recruiter}
                isOpen={true}
                onClose={() => {
                    setShowInternalCustomModal(false);
                    onClose();
                }}
                onSuccess={() => {
                    setShowInternalCustomModal(false);
                    if (onSuccess) onSuccess();
                    onClose();
                }}
            />
        );
    }

    const currentPlanName = recruiter.plan_name || 'Current Plan';
    const currentExpiryFormatted = recruiter.subscription_expiry ? new Date(recruiter.subscription_expiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    const selectedPlan = plans.find(p => String(p.id) === String(selectedPlanId));

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (selectedPlanId === '__custom__') {
            handleTriggerCustomPlan();
            return;
        }

        if (!selectedPlanId) {
            toast.error("Please select a new subscription plan.");
            return;
        }

        try {
            setSubmitting(true);
            const res = await changeAdminRecruiterPlan(recruiter.recruiter_id || recruiter.id, {
                new_plan_id: Number(selectedPlanId),
                effective_type: effectiveType,
                reason: reason.trim()
            });

            if (res?.data?.success) {
                toast.success(res.data.message || "Subscription plan changed successfully!");
                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (err) {
            console.error(err);
            const errMsg = err?.response?.data?.message || "Failed to change plan.";
            toast.error(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 mt-0">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto font-sans">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            Change Subscription Plan
                        </h3>
                        <p className="text-[13px] text-gray-500 mt-0.5 mb-0">
                            Modify recruitment quotas and feature privileges for <strong>{recruiter.company_name || recruiter.recruiter_name}</strong>.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Current Plan vs New Plan Comparison */}
                <div className="my-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Current Plan Box */}
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Current Plan</span>
                        <h4 className="text-lg font-bold text-gray-900 mt-1 mb-0">{currentPlanName}</h4>
                        <p className="text-[12px] text-gray-500 mt-0.5 mb-0">Expires: <strong>{currentExpiryFormatted}</strong></p>
                        <div className="mt-3 pt-3 border-t border-gray-200/80 text-[12px] space-y-1 text-gray-600">
                            <div>Job Posts: <strong>{recruiter.job_post_limit || 15}/mo</strong></div>
                            <div>Active Jobs: <strong>{recruiter.active_job_limit || 10} max</strong></div>
                            <div>Resume Views: <strong>{recruiter.resume_view_limit || 250}</strong></div>
                        </div>
                    </div>

                    {/* New Selected Plan Preview */}
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Target Plan</span>
                        {selectedPlan ? (
                            <>
                                <h4 className="text-lg font-bold text-blue-900 mt-1 mb-0">
                                    {selectedPlan.name} (₹{Number(selectedPlan.price).toLocaleString()})
                                </h4>
                                <p className="text-[12px] text-blue-700 mt-0.5">
                                    Validity: <strong>{selectedPlan.validity_days || 30} Days</strong>
                                </p>
                                <div className="mt-3 pt-3 border-t border-blue-200 text-[12px] space-y-1 text-blue-900">
                                    <div>Job Posts: <strong>{selectedPlan.job_post_limit}/mo</strong></div>
                                    <div>Active Jobs: <strong>{selectedPlan.active_job_limit} max</strong></div>
                                    <div>Resume Views: <strong>{selectedPlan.resume_view_limit?.toLocaleString()}</strong></div>
                                </div>
                            </>
                        ) : (
                            <p className="text-[13px] text-gray-400 mt-2">Select a plan below</p>
                        )}
                    </div>
                </div>

                {/* Form Controls */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Select Plan Dropdown */}
                    <div>
                        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                            Select New Plan <span className="text-red-500">*</span>
                        </label>
                        {loadingPlans ? (
                            <div className="py-2.5 text-sm text-gray-500 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Loading available plans...
                            </div>
                        ) : (
                            <select
                                value={selectedPlanId}
                                onChange={(e) => {
                                    if (e.target.value === '__custom__') {
                                        handleTriggerCustomPlan();
                                    } else {
                                        setSelectedPlanId(e.target.value);
                                    }
                                }}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-blue-500"
                                required
                            >
                                <optgroup label="Standard Subscription Plans">
                                    {plans.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} – ₹{Number(p.price).toLocaleString()} / {p.plan_type} ({p.job_post_limit} Jobs, {p.active_job_limit} Active)
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Custom Allocation">
                                    <option value="__custom__">⚙️ Custom Plan — Configure Custom Quotas & Limits...</option>
                                </optgroup>
                            </select>
                        )}
                    </div>

                    {/* Custom Plan Quick Option Banner */}
                    <div className="p-3 bg-gradient-to-r from-amber-50 to-amber-100/40 rounded-xl border-1 border-amber-200/90 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-200/70 text-amber-800 flex items-center justify-center shrink-0">
                                <Settings className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-amber-950">Want to assign custom limits?</div>
                                <div className="text-[11px] text-amber-800">Set tailored limits for jobs, resume views, emails, WhatsApp & Excel downloads.</div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleTriggerCustomPlan}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm whitespace-nowrap shrink-0 flex items-center gap-1.5"
                        >
                            <Settings className="w-3.5 h-3.5" />
                            Open Custom Plan
                        </button>
                    </div>

                    {/* Effective Time Choice */}
                    <div>
                        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                            Effective Timing
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 text-[13px] transition-all ${effectiveType === 'immediately' ? 'bg-blue-50/50 border-blue-500 text-blue-900 font-semibold' : 'bg-gray-50 border-gray-200 text-gray-700'
                                }`}>
                                <input
                                    type="radio"
                                    name="effectiveType"
                                    checked={effectiveType === 'immediately'}
                                    onChange={() => setEffectiveType('immediately')}
                                    className="text-blue-600"
                                />
                                <div>
                                    <span>Effective Immediately</span>
                                    <span className="block text-[11px] font-normal text-gray-500">Apply new limits right now</span>
                                </div>
                            </label>

                            <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 text-[13px] transition-all ${effectiveType === 'next_renewal' ? 'bg-blue-50/50 border-blue-500 text-blue-900 font-semibold' : 'bg-gray-50 border-gray-200 text-gray-700'
                                }`}>
                                <input
                                    type="radio"
                                    name="effectiveType"
                                    checked={effectiveType === 'next_renewal'}
                                    onChange={() => setEffectiveType('next_renewal')}
                                    className="text-blue-600"
                                />
                                <div>
                                    <span>Next Renewal</span>
                                    <span className="block text-[11px] font-normal text-gray-500">Apply after current cycle ends</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Reason / Admin Note */}
                    <div>
                        <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                            Reason / Admin Note
                        </label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Customer requested tier upgrade or seasonal quota boost"
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                        />
                    </div>

                    {/* Notice */}
                    <div className="p-3 bg-amber-50 rounded-xl border-1 border-amber-200 text-amber-800 text-[12px] flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                            This action updates feature access and quotas immediately. Historical subscription records will be preserved in subscription history.
                        </span>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[13px] font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-medium transition-colors shadow-sm flex items-center gap-2"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Confirm Plan Change
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
