'use client';
import React, { useState, useEffect } from 'react';
import { Settings, X, Loader2, Save, Briefcase, Users, Check, Layers } from 'lucide-react';
import { updateAdminRecruiterCustomPlan } from '../ApiService/action';
import AdminSelect from './AdminSelect';
import toast from 'react-hot-toast';

export default function CustomPlanModal({ recruiter, isOpen, onClose, onSuccess }) {
    const [planScope, setPlanScope] = useState('all'); // 'all' | 'only_job_post'
    const [formData, setFormData] = useState({
        job_post_limit: '',
        active_job_limit: '',
        featured_job_limit: '',
        urgent_job_limit: '',
        master_login_limit: 1,
        resume_view_limit: '',
        resume_download_limit: '',
        sub_recruiter_limit: '',
        email_limit: '',
        whatsapp_limit: '',
        excel_download_limit: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && recruiter) {
            const isOnlyJobPostName = /only job post/i.test(recruiter.plan_name || '');
            const hasCandidateQuotas = Number(recruiter.resume_view_limit || 0) > 0 ||
                Number(recruiter.resume_download_limit || 0) > 0 ||
                Number(recruiter.email_limit || 0) > 0 ||
                Number(recruiter.whatsapp_limit || 0) > 0 ||
                Number(recruiter.excel_download_limit || 0) > 0;

            const isOnlyJob = /only job post/i.test(recruiter.plan_name || '') || !hasCandidateQuotas;
            setPlanScope(isOnlyJob ? 'only_job_post' : 'all');

            setFormData({
                job_post_limit: recruiter.job_post_limit ?? 0,
                active_job_limit: recruiter.active_job_limit ?? 0,
                featured_job_limit: recruiter.featured_job_limit ?? 0,
                urgent_job_limit: recruiter.urgent_job_limit ?? 0,
                master_login_limit: recruiter.master_login_limit || 1,
                resume_view_limit: recruiter.resume_view_limit ?? 0,
                resume_download_limit: recruiter.resume_download_limit ?? 0,
                sub_recruiter_limit: recruiter.sub_recruiter_limit || 1,
                email_limit: recruiter.email_limit ?? 0,
                whatsapp_limit: recruiter.whatsapp_limit ?? 0,
                excel_download_limit: recruiter.excel_download_limit ?? 0
            });
        }
    }, [isOpen, recruiter]);

    if (!isOpen || !recruiter) return null;

    const isOnlyJobPost = planScope === 'only_job_post';

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const payload = {
                plan_scope: planScope,
                is_only_job_post: isOnlyJobPost,
                job_post_limit: Number(formData.job_post_limit || 0),
                active_job_limit: Number(formData.active_job_limit || 0),
                featured_job_limit: Number(formData.featured_job_limit || 0),
                urgent_job_limit: Number(formData.urgent_job_limit || 0),
                master_login_limit: Math.max(1, Number(formData.master_login_limit || 1)),
                resume_view_limit: isOnlyJobPost ? 0 : Number(formData.resume_view_limit || 0),
                resume_download_limit: isOnlyJobPost ? 0 : Number(formData.resume_download_limit || 0),
                sub_recruiter_limit: Number(formData.sub_recruiter_limit || 1),
                email_limit: isOnlyJobPost ? 0 : Number(formData.email_limit || 0),
                whatsapp_limit: isOnlyJobPost ? 0 : Number(formData.whatsapp_limit || 0),
                excel_download_limit: isOnlyJobPost ? 0 : Number(formData.excel_download_limit || 0),
                email_sent_count: isOnlyJobPost ? 0 : Number(formData.email_limit || 0),
                whatsapp_message_count: isOnlyJobPost ? 0 : Number(formData.whatsapp_limit || 0),
                excel_download_count: isOnlyJobPost ? 0 : Number(formData.excel_download_limit || 0)
            };

            const res = await updateAdminRecruiterCustomPlan(recruiter.id || recruiter.recruiter_id, payload);

            if (res?.data?.success) {
                toast.success(isOnlyJobPost ? "Job Posting limits applied successfully!" : "Custom limits applied successfully!");
                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Failed to apply custom plan.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200 mt-0">
            <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
                <div className="bg-white rounded-3xl max-w-[850px] w-full p-8 shadow-2xl relative">
                    {/* Header */}
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100/60 mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2.5 mb-0">
                                <Settings className="w-[22px] h-[22px] text-emerald-600" />
                                Custom Plan Limits
                            </h3>
                            <p className="text-[13px] text-slate-500 mt-1.5 mb-0">
                                Set manual quotas for <strong className="text-slate-700">{recruiter.company_name || recruiter.recruiter_name}</strong>.
                            </p>
                        </div>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Plan Customization Scope Dropdown */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-emerald-600" />
                                    <label className="text-[13.5px] font-bold text-slate-800 m-0">
                                        Custom Plan Mode
                                    </label>
                                </div>
                                <p className="text-[12px] text-slate-500 mt-0.5 mb-0">
                                    Choose whether to configure candidate resume quotas or only job postings.
                                </p>
                            </div>
                            <div className="w-full sm:w-72 shrink-0">
                                <AdminSelect
                                    value={planScope}
                                    onChange={(val) => {
                                        setPlanScope(val);
                                        if (val === 'only_job_post') {
                                            setFormData(prev => ({
                                                ...prev,
                                                resume_view_limit: 0,
                                                resume_download_limit: 0,
                                                sub_recruiter_limit: 1,
                                                email_limit: 0,
                                                whatsapp_limit: 0,
                                                excel_download_limit: 0
                                            }));
                                        }
                                    }}
                                    options={[
                                        { value: 'all', label: 'Full Access (Job Posts & Resume Quotas)' },
                                        { value: 'only_job_post', label: 'Only Job Post' }
                                    ]}
                                    placeholder="Select Mode"
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Job Posting Limits Section */}
                        <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center gap-2.5 mb-1.5">
                                <Briefcase className="w-4 h-4 text-emerald-600" />
                                <h4 className="font-bold text-slate-800 text-[15px] mb-0">Job Posting Limits</h4>
                            </div>
                            <p className="text-[13px] text-slate-400 mb-6">Controls how many jobs the company can publish and keep active concurrently.</p>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                                        Monthly Job Posts
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.job_post_limit}
                                        onChange={(e) => setFormData({ ...formData, job_post_limit: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200/80 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                        required
                                    />
                                    <p className="text-[11px] text-slate-400 mt-2 mb-0">Created per cycle</p>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                                        Max Active Jobs
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.active_job_limit}
                                        onChange={(e) => setFormData({ ...formData, active_job_limit: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200/80 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                        required
                                    />
                                    <p className="text-[11px] text-slate-400 mt-2 mb-0">Simultaneously live</p>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                                        Featured Job Posts
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.featured_job_limit}
                                        onChange={(e) => setFormData({ ...formData, featured_job_limit: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200/80 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                        required
                                    />
                                    <p className="text-[11px] text-slate-400 mt-2 mb-0">Priority highlighted</p>
                                </div>
                                <div>
                                    <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                                        Urgent Job Posts
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.urgent_job_limit}
                                        onChange={(e) => setFormData({ ...formData, urgent_job_limit: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200/80 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                        required
                                    />
                                    <p className="text-[11px] text-slate-400 mt-2 mb-0">Urgent tag badge</p>
                                </div>
                            </div>
                        </div>

                        {/* Team & Login Access Section (Visible in all modes) */}
                        <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center gap-2.5 mb-1.5">
                                <Users className="w-4 h-4 text-indigo-600" />
                                <h4 className="font-bold text-slate-800 text-[15px] mb-0">Team & Master Login Access</h4>
                            </div>
                            <p className="text-[13px] text-slate-400 mb-6">Manage allowed concurrent master login sessions and sub-recruiter team seats.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center justify-between text-[13px] font-semibold text-slate-700 mb-2">
                                        Master Login Count
                                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">PRIMARY</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.master_login_limit}
                                        onChange={(e) => setFormData({ ...formData, master_login_limit: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200/80 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all font-semibold"
                                        required
                                    />
                                    <p className="text-[11px] text-slate-400 mt-2 mb-0">Max allowed primary recruiter master logins</p>
                                </div>
                                <div>
                                    <label className="flex items-center justify-between text-[13px] font-semibold text-slate-700 mb-2">
                                        Sub-Recruiter Seats
                                        <span className="bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded text-[10px]">TEAM</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.sub_recruiter_limit}
                                        onChange={(e) => setFormData({ ...formData, sub_recruiter_limit: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200/80 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                        required
                                    />
                                    <p className="text-[11px] text-slate-400 mt-2 mb-0">Max sub-recruiters main recruiter can create</p>
                                </div>
                            </div>
                        </div>

                        {/* Candidate / Resume Quotas Section (Hidden when "Only Job Post" is selected) */}
                        {!isOnlyJobPost && (
                            <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] animate-in fade-in duration-200">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <Briefcase className="w-4 h-4 text-blue-600" />
                                    <h4 className="font-bold text-slate-800 text-[15px] mb-0">Candidate / Resume Quotas</h4>
                                </div>
                                <p className="text-[13px] text-slate-400 mb-6">Quantitative limits for inspecting, contacting, and exporting candidate profiles.</p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                                            Resume Views
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.resume_view_limit}
                                            onChange={(e) => setFormData({ ...formData, resume_view_limit: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-white border border-slate-200/80 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                            required={!isOnlyJobPost}
                                        />
                                        <p className="text-[11px] text-slate-400 mt-2 mb-0">Max full candidate profiles viewable per cycle</p>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                                            Resume Downloads
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.resume_download_limit}
                                            onChange={(e) => setFormData({ ...formData, resume_download_limit: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-white border border-slate-200/80 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                            required={!isOnlyJobPost}
                                        />
                                        <p className="text-[11px] text-slate-400 mt-2 mb-0">Max PDF/DOC resume files downloadable</p>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                                            Excel Download Count
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.excel_download_limit}
                                            onChange={(e) => setFormData({ ...formData, excel_download_limit: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-white border border-slate-200/80 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                            required={!isOnlyJobPost}
                                        />
                                        <p className="text-[11px] text-slate-400 mt-2 mb-0">Max candidate profiles exportable to Excel per cycle</p>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                                            Email Sent Count
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.email_limit}
                                            onChange={(e) => setFormData({ ...formData, email_limit: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-white border border-slate-200/80 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                            required={!isOnlyJobPost}
                                        />
                                        <p className="text-[11px] text-slate-400 mt-2 mb-0">Max candidate emails sendable per cycle</p>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                                            WhatsApp Sent Count
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.whatsapp_limit}
                                            onChange={(e) => setFormData({ ...formData, whatsapp_limit: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-white border border-slate-200/80 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                                            required={!isOnlyJobPost}
                                        />
                                        <p className="text-[11px] text-slate-400 mt-2 mb-0">Max candidate WhatsApp messages sendable per cycle</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button type="button" onClick={onClose} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[14px] font-medium transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting} className="px-7 py-2.5 bg-[#0F9D58] hover:bg-[#0B8043] text-white rounded-2xl text-[14px] font-medium transition-colors shadow-md flex items-center gap-2">
                                {submitting ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Save className="w-[18px] h-[18px]" />}
                                Save Limits
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
