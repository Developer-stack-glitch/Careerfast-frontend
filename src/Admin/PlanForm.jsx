'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    CreditCard, ArrowLeft, Check, Sparkles, AlertCircle,
    Briefcase, FileText, Users,
    Shield, Building, MessageSquare, Info, Save, Loader2
} from 'lucide-react';
import {
    createAdminPlan,
    updateAdminPlan,
    getAdminPlanById
} from '../ApiService/action';
import toast from 'react-hot-toast';
import { AdminFormSkeleton } from './AdminSkeletons';

export default function PlanForm({ planId = null }) {
    const router = useRouter();
    const isEdit = Boolean(planId);

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);

    // Form state matching required fields
    const [formData, setFormData] = useState({
        // Basic Info
        name: '',
        description: '',
        plan_type: 'monthly',
        price: '',
        currency: 'INR',
        validity_days: 30,
        status: 'active',

        // Job Posting Limits
        job_post_limit: 5,
        active_job_limit: 3,
        featured_job_limit: 0,
        urgent_job_limit: 0,
        sub_recruiter_limit: 1,

        // Candidate / Resume Limits
        resume_view_limit: 50,
        resume_download_limit: 10,

        // Feature Privileges (Toggles)
        candidate_search: false,
        candidate_contact: false,
        resume_database: false,
        interview_management: true,
        application_management: true,
        shortlisting: true,
        company_profile: true,
        recruiter_dashboard: true,
        email_notifications: true,
        company_branding: false,
    });

    useEffect(() => {
        if (isEdit) {
            fetchPlanData();
        }
    }, [planId]);

    const fetchPlanData = async () => {
        try {
            setLoading(true);
            const res = await getAdminPlanById(planId);
            if (res?.data?.success && res.data.data) {
                const p = res.data.data;
                setFormData({
                    name: p.name || '',
                    description: p.description || '',
                    plan_type: p.plan_type || 'monthly',
                    price: p.price !== undefined ? p.price : '',
                    currency: p.currency || 'INR',
                    validity_days: p.validity_days || 30,
                    status: p.status || 'active',

                    job_post_limit: p.job_post_limit ?? 5,
                    active_job_limit: p.active_job_limit ?? 3,
                    featured_job_limit: p.featured_job_limit ?? 0,
                    urgent_job_limit: p.urgent_job_limit ?? 0,
                    sub_recruiter_limit: p.sub_recruiter_limit ?? 1,

                    resume_view_limit: p.resume_view_limit ?? 50,
                    resume_download_limit: p.resume_download_limit ?? 10,

                    candidate_search: Boolean(p.candidate_search),
                    candidate_contact: Boolean(p.candidate_contact),
                    resume_database: Boolean(p.resume_database),
                    interview_management: Boolean(p.interview_management),
                    application_management: Boolean(p.application_management),
                    shortlisting: Boolean(p.shortlisting),
                    company_profile: Boolean(p.company_profile),
                    recruiter_dashboard: Boolean(p.recruiter_dashboard),
                    email_notifications: Boolean(p.email_notifications),
                    company_branding: Boolean(p.company_branding),
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load plan details.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleToggle = (key) => {
        setFormData(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSubmit = async (e, andAssign = false) => {
        if (e) e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            toast.error("Plan Name is required.");
            return;
        }
        if (formData.price === '' || isNaN(formData.price) || Number(formData.price) < 0) {
            toast.error("A valid price is required.");
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                ...formData,
                price: Number(formData.price),
                validity_days: Number(formData.validity_days),
                job_post_limit: Number(formData.job_post_limit),
                active_job_limit: Number(formData.active_job_limit),
                featured_job_limit: Number(formData.featured_job_limit),
                urgent_job_limit: Number(formData.urgent_job_limit),
                resume_view_limit: Number(formData.resume_view_limit),
                resume_download_limit: Number(formData.resume_download_limit),
            };

            if (isEdit) {
                const res = await updateAdminPlan(planId, payload);
                if (res?.data?.success) {
                    toast.success("Subscription plan updated successfully!");
                    if (andAssign) {
                        router.push(`/admin/recruiters/create?planId=${planId}`);
                    } else {
                        router.push('/admin/plans');
                    }
                }
            } else {
                const res = await createAdminPlan(payload);
                if (res?.data?.success) {
                    toast.success("Subscription plan created successfully!");
                    const newId = res.data.data?.plan_id;
                    if (andAssign && newId) {
                        router.push(`/admin/recruiters/create?planId=${newId}`);
                    } else {
                        router.push('/admin/plans');
                    }
                }
            }
        } catch (error) {
            console.error("Save plan error:", error);
            const errMsg = error?.response?.data?.message || "Failed to save subscription plan.";
            toast.error(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <AdminFormSkeleton />;
    }

    return (
        <div className="w-full max-w-5xl mx-auto font-sans pb-8">
            {/* Top Navigation */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    type="button"
                    onClick={() => router.push('/admin/plans')}
                    className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-0">
                        {isEdit ? `Edit Plan: ${formData.name || ''}` : 'Create Subscription Plan'}
                    </h1>
                    <p className="text-[13px] text-gray-500 mt-0.5 mb-0">
                        Define pricing, limits, and recruiter feature permissions.
                    </p>
                </div>
            </div>

            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                {/* 1. Basic Information */}
                <div className="bg-white rounded-2xl p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        Basic Information
                    </h2>
                    <p className="text-[12px] text-gray-400 mb-4">
                        Core commercial details and identification for this subscription tier.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Plan Name */}
                        <div className="md:col-span-2">
                            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Plan Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Professional or Enterprise Growth"
                                required
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Plan Description */}
                        <div className="md:col-span-2">
                            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Plan Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Summary of what is included and who this plan is tailored for..."
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Plan Type / Billing Cycle */}
                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Plan Type / Billing Cycle
                            </label>
                            <select
                                name="plan_type"
                                value={formData.plan_type}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>

                        {/* Validity in Days */}
                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Validity (in Days)
                            </label>
                            <input
                                type="number"
                                name="validity_days"
                                value={formData.validity_days}
                                onChange={handleChange}
                                min={1}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Price (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="e.g., 9999"
                                min={0}
                                required
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                            >
                                <option value="active">Active (Available for Recruiters)</option>
                                <option value="inactive">Inactive (Hidden)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. Job Posting Limits */}
                <div className="bg-white rounded-2xl p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-emerald-600" />
                        Job Posting Limits
                    </h2>
                    <p className="text-[12px] text-gray-400 mb-4">
                        Controls how many jobs the company can publish and keep active concurrently.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Monthly Job Posts
                            </label>
                            <input
                                type="number"
                                name="job_post_limit"
                                value={formData.job_post_limit}
                                onChange={handleChange}
                                min={0}
                                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                            />
                            <span className="text-[11px] text-gray-400 mt-1 block">Created per cycle</span>
                        </div>

                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Max Active Jobs
                            </label>
                            <input
                                type="number"
                                name="active_job_limit"
                                value={formData.active_job_limit}
                                onChange={handleChange}
                                min={0}
                                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                            />
                            <span className="text-[11px] text-gray-400 mt-1 block">Simultaneously live</span>
                        </div>

                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Featured Job Posts
                            </label>
                            <input
                                type="number"
                                name="featured_job_limit"
                                value={formData.featured_job_limit}
                                onChange={handleChange}
                                min={0}
                                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                            />
                            <span className="text-[11px] text-gray-400 mt-1 block">Priority highlighted</span>
                        </div>

                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Urgent Job Posts
                            </label>
                            <input
                                type="number"
                                name="urgent_job_limit"
                                value={formData.urgent_job_limit}
                                onChange={handleChange}
                                min={0}
                                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                            />
                            <span className="text-[11px] text-gray-400 mt-1 block">Urgent tag badge</span>
                        </div>
                    </div>
                </div>

                {/* 3. Candidate / Resume Limits */}
                <div className="bg-white rounded-2xl p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Candidate / Resume Quotas
                    </h2>
                    <p className="text-[12px] text-gray-400 mb-4">
                        Quantitative limits for inspecting and downloading candidate profiles.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Resume Views
                            </label>
                            <input
                                type="number"
                                name="resume_view_limit"
                                value={formData.resume_view_limit}
                                onChange={handleChange}
                                min={0}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                            />
                            <span className="text-[11px] text-gray-400 mt-1 block">Max full candidate profiles viewable per cycle</span>
                        </div>

                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Resume Downloads
                            </label>
                            <input
                                type="number"
                                name="resume_download_limit"
                                value={formData.resume_download_limit}
                                onChange={handleChange}
                                min={0}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                            />
                            <span className="text-[11px] text-gray-400 mt-1 block">Max PDF/DOC resume files downloadable</span>
                        </div>

                        <div>
                            <label className="block text-[12px] font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                <span>Sub-Recruiter Seats</span>
                                <span className="text-[10px] text-indigo-600 bg-indigo-50 font-semibold px-1.5 py-0.5 rounded">Team</span>
                            </label>
                            <input
                                type="number"
                                name="sub_recruiter_limit"
                                value={formData.sub_recruiter_limit}
                                onChange={handleChange}
                                min={1}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 font-semibold text-slate-800"
                            />
                            <span className="text-[11px] text-gray-400 mt-1 block">Max sub-recruiters main recruiter can create</span>
                        </div>
                    </div>
                </div>

                {/* 4. Additional Feature Switches */}
                <div className="bg-white rounded-2xl p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        Recruiter Features & Privileges
                    </h2>
                    <p className="text-[12px] text-gray-400 mb-4">
                        Toggle specific capabilities ON or OFF. Locked features will show an upgrade prompt to recruiters.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { key: 'candidate_search', title: 'Candidate Search', desc: 'Direct search in the talent pool' },
                            { key: 'candidate_contact', title: 'Candidate Contact', desc: 'Direct email/phone outreach to candidates' },
                            { key: 'resume_database', title: 'Resume Database Access', desc: 'Full Naukri-style candidate database' },
                            { key: 'interview_management', title: 'Interview Management', desc: 'Schedule and manage interviews' },
                            { key: 'application_management', title: 'Application Management', desc: 'Track candidate application pipelines' },
                            { key: 'shortlisting', title: 'Candidate Shortlisting', desc: 'Tag, rate and shortlist applicants' },
                            { key: 'company_profile', title: 'Company Profile Page', desc: 'Custom branding & company details' },
                            { key: 'recruiter_dashboard', title: 'Recruiter Dashboard', desc: 'Full HR dashboard & metric graphs' },
                            { key: 'email_notifications', title: 'Email Notifications', desc: 'Instant alerts on applicant submissions' },
                            { key: 'company_branding', title: 'Company Branding', desc: 'Custom logo, header badges on listings' },
                        ].map((item) => {
                            const isChecked = Boolean(formData[item.key]);
                            return (
                                <div
                                    key={item.key}
                                    onClick={() => handleToggle(item.key)}
                                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isChecked
                                        ? 'bg-blue-50/40 border-blue-200 text-blue-900'
                                        : 'bg-gray-50/60 border-gray-200/70 text-gray-600 hover:bg-gray-100/60'
                                        }`}
                                >
                                    <div>
                                        <p className="font-semibold text-[13px] mb-0">{item.title}</p>
                                        <p className="text-[11px] text-gray-400 mb-0">{item.desc}</p>
                                    </div>

                                    <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${isChecked ? 'bg-blue-600 justify-end' : 'bg-gray-300 justify-start'
                                        }`}>
                                        <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => router.push('/admin/plans')}
                        className="w-full sm:w-auto px-6 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {!isEdit && (
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={(e) => handleSubmit(e, true)}
                                className="w-full sm:w-auto px-4 py-2.5 border-1 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-semibold transition-colors"
                            >
                                Save & Assign to Recruiter
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            <Save className="w-4 h-4" />
                            {isEdit ? 'Update Plan' : 'Save Plan'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
