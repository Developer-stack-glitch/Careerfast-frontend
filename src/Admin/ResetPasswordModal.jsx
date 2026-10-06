'use client';
import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, X, Loader2 } from 'lucide-react';
import { resetAdminRecruiterPassword } from '../ApiService/action';
import toast from 'react-hot-toast';

export default function ResetPasswordModal({ recruiter, isOpen = true, onClose }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    if ((isOpen !== undefined && !isOpen) || !recruiter) return null;

    const handleSubmit = async (e) => {
        e?.preventDefault();
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        try {
            setSubmitting(true);
            const res = await resetAdminRecruiterPassword(recruiter.recruiter_id || recruiter.id, {
                new_password: password
            });

            if (res?.data?.success) {
                toast.success("Recruiter password has been reset successfully!");
                onClose();
            }
        } catch (err) {
            console.error(err);
            const errMsg = err?.response?.data?.message || "Failed to reset password.";
            toast.error(errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 mt-0">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 font-sans">
                <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-0">
                            <KeyRound className="w-5 h-5 text-blue-600" />
                            Reset Recruiter Password
                        </h3>
                        <p className="text-[13px] text-gray-500 mt-0.5 mb-0">
                            Set a new security password for <strong>{recruiter.email || recruiter.recruiter_name}</strong>.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 my-0">
                    <div>
                        <label className="block text-[14px] font-semibold text-gray-700 mb-1.5">
                            New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimum 6 characters"
                                required
                                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[14px] font-semibold text-gray-700 mb-1.5">
                            Confirm New Password <span className="text-red-500">*</span>
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat new password"
                            required
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500"
                        />
                    </div>

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
                            disabled={submitting}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-medium transition-colors shadow-sm flex items-center gap-2"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Set Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
