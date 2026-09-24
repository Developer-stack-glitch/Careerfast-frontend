'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building, User, Mail, Phone, Globe, MapPin, Key, Lock, Eye, EyeOff,
    Shield, Check, Copy, Sparkles, RefreshCw, Calendar, CreditCard,
    AlertCircle, ArrowLeft, Loader2, CheckCircle2, ChevronDown, CheckSquare,
    ExternalLink, Briefcase, FileText, Award, Layers
} from 'lucide-react';
import { getAdminPlans, createAdminRecruiter } from '../ApiService/action';
import toast from 'react-hot-toast';

export default function AddRecruiter() {
    const router = useRouter();

    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Success Modal state
    const [createdModalData, setCreatedModalData] = useState(null);
    const [copied, setCopied] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        // 1. Company Info
        company_name: '',
        company_email: '',
        company_phone: '',
        website: '',
        industry: 'Information Technology',
        company_type: 'Corporate',
        company_logo: '',
        company_description: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        gst_number: '',

        // 2. Recruiter Details
        recruiter_name: '',
        designation: 'HR Manager',
        email: '',
        mobile_number: '',
        username: '',
        password: '',
        confirm_password: '',

        // 3. Subscription
        plan_id: '',
        billing_cycle: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        payment_status: 'Paid',
        payment_notes: '',
        send_welcome_email: true,
        subscription_status: 'Active'
    });

    // Fetch active plans on mount
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                setLoadingPlans(true);
                const res = await getAdminPlans();
                const fetchedPlans = res.data?.data || res.data || [];
                const activePlans = fetchedPlans.filter(p => p.status === 'active' || p.status === 1);
                setPlans(activePlans.length > 0 ? activePlans : fetchedPlans);

                if (fetchedPlans.length > 0) {
                    const defaultPlan = fetchedPlans[0];
                    setFormData(prev => {
                        const nextExpiry = calculateExpiry(prev.start_date, prev.billing_cycle, defaultPlan.validity_days);
                        return {
                            ...prev,
                            plan_id: defaultPlan.id,
                            expiry_date: nextExpiry
                        };
                    });
                }
            } catch (err) {
                console.error("Failed to load plans:", err);
                toast.error("Failed to load subscription plans.");
            } finally {
                setLoadingPlans(false);
            }
        };
        fetchPlans();
    }, []);

    // Calculate expiry helper
    const calculateExpiry = (startDateStr, cycle, planValidity = 30) => {
        if (!startDateStr) return '';
        const d = new Date(startDateStr);
        if (cycle === 'yearly') {
            d.setFullYear(d.getFullYear() + 1);
        } else if (cycle === 'half-yearly') {
            d.setMonth(d.getMonth() + 6);
        } else if (cycle === 'quarterly') {
            d.setMonth(d.getMonth() + 3);
        } else {
            d.setDate(d.getDate() + (Number(planValidity) || 30));
        }
        return d.toISOString().split('T')[0];
    };

    // Update expiry when plan, start_date or cycle changes
    const handlePlanChange = (planId) => {
        const selected = plans.find(p => String(p.id) === String(planId));
        const validity = selected?.validity_days || 30;
        const newExpiry = calculateExpiry(formData.start_date, formData.billing_cycle, validity);
        setFormData(prev => ({
            ...prev,
            plan_id: planId,
            expiry_date: newExpiry
        }));
    };

    const handleBillingCycleChange = (cycle) => {
        const selected = plans.find(p => String(p.id) === String(formData.plan_id));
        const validity = selected?.validity_days || 30;
        const newExpiry = calculateExpiry(formData.start_date, cycle, validity);
        setFormData(prev => ({
            ...prev,
            billing_cycle: cycle,
            expiry_date: newExpiry
        }));
    };

    const handleStartDateChange = (date) => {
        const selected = plans.find(p => String(p.id) === String(formData.plan_id));
        const validity = selected?.validity_days || 30;
        const newExpiry = calculateExpiry(date, formData.billing_cycle, validity);
        setFormData(prev => ({
            ...prev,
            start_date: date,
            expiry_date: newExpiry
        }));
    };

    // Auto-generate credentials helper
    const handleGenerateCredentials = () => {
        const randomStr = Math.random().toString(36).substring(2, 6);
        const special = ['!', '@', '#', '$', '%'][Math.floor(Math.random() * 5)];
        const generatedPassword = `Fast@${randomStr.toUpperCase()}${Math.floor(100 + Math.random() * 900)}${special}`;

        let autoUsername = '';
        if (formData.email) {
            autoUsername = formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        } else if (formData.recruiter_name) {
            autoUsername = formData.recruiter_name.toLowerCase().replace(/\s+/g, '.') + Math.floor(10 + Math.random() * 90);
        } else {
            autoUsername = `recruiter_${Math.floor(1000 + Math.random() * 9000)}`;
        }

        setFormData(prev => ({
            ...prev,
            username: autoUsername,
            password: generatedPassword,
            confirm_password: generatedPassword
        }));

        setShowPassword(true);
        setShowConfirmPassword(true);
        toast.success("Generated secure password & username!");
    };

    const selectedPlan = plans.find(p => String(p.id) === String(formData.plan_id));

    // Form submission
    const handleSubmit = async (e, saveAsDraft = false) => {
        if (e) e.preventDefault();

        // Validation
        if (!formData.company_name.trim()) return toast.error("Company Name is required.");
        if (!formData.company_email.trim()) return toast.error("Company Email is required.");
        if (!formData.company_phone.trim()) return toast.error("Company Phone is required.");
        if (!formData.city.trim()) return toast.error("City is required.");
        if (!formData.state.trim()) return toast.error("State is required.");
        if (!formData.pincode.trim()) return toast.error("Pincode is required.");

        if (!formData.recruiter_name.trim()) return toast.error("Recruiter Full Name is required.");
        if (!formData.email.trim()) return toast.error("Recruiter Official Email is required.");
        if (!formData.mobile_number.trim()) return toast.error("Recruiter Contact Number is required.");
        if (!formData.password) return toast.error("Password is required.");
        if (formData.password !== formData.confirm_password) return toast.error("Passwords do not match.");
        if (!formData.plan_id) return toast.error("Please select a subscription plan.");

        try {
            setSubmitting(true);
            const payload = {
                ...formData,
                subscription_status: saveAsDraft ? 'Inactive' : 'Active'
            };

            const res = await createAdminRecruiter(payload);
            const createdData = res.data?.data || {};

            toast.success(saveAsDraft ? "Recruiter saved as Inactive." : "Recruiter & Subscription created successfully!");

            // Open success credential modal
            setCreatedModalData({
                recruiter_id: createdData.recruiter_id,
                recruiter_name: formData.recruiter_name,
                company_name: formData.company_name,
                email: formData.email,
                username: formData.username || formData.email,
                password: formData.password,
                plan_name: selectedPlan?.name || 'Custom Plan',
                expiry_date: formData.expiry_date,
                status: saveAsDraft ? 'Inactive' : 'Active'
            });
        } catch (err) {
            console.error("Failed to create recruiter:", err);
            const msg = err.response?.data?.message || err.message || "Failed to create recruiter.";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const copyCredentialsToClipboard = () => {
        if (!createdModalData) return;
        const text = `CareerFast Recruiter Portal Credentials:
Company: ${createdModalData.company_name}
Name: ${createdModalData.recruiter_name}
Portal URL: ${window.location.origin}/employer/login
Email: ${createdModalData.email}
Username: ${createdModalData.username}
Password: ${createdModalData.password}
Plan: ${createdModalData.plan_name} (Valid till: ${createdModalData.expiry_date || 'N/A'})`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Credentials copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => router.push('/admin/recruiters')}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                        title="Back to Recruiters"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-gray-900 mb-0">Add New Recruiter & Company</h1>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border-1 border-emerald-200">
                                Direct Setup
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 mb-0">
                            Create company profile, recruiter credentials, and assign a subscription plan.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => handleSubmit(null, true)}
                        disabled={submitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Save as Inactive
                    </button>
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, false)}
                        disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Create Recruiter</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Form Layout (2 Columns: Left 65% Forms, Right 35% Live Plan Preview Card) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left 2 Cols: Form Sections */}
                <div className="lg:col-span-2 space-y-6">
                    {/* SECTION 1: Company Information */}
                    <div className="bg-white p-6 rounded-2xl border-1 border-gray-100 space-y-5">
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                <Building className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900 mb-0">1. Company Information</h2>
                                <p className="text-xs text-gray-500 mb-0">Corporate organization details and billing address</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Company Name <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                    placeholder="e.g. Acme Technologies Pvt Ltd"
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Company Email <span className="text-rose-500">*</span></label>
                                <input
                                    type="email"
                                    required
                                    value={formData.company_email}
                                    onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                                    placeholder="contact@acme.com"
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Company Phone <span className="text-rose-500">*</span></label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.company_phone}
                                    onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Website URL</label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="https://acme.com"
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Industry Type</label>
                                <select
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                >
                                    <option value="Information Technology">Information Technology</option>
                                    <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                                    <option value="BFSI / Banking">BFSI / Banking</option>
                                    <option value="Education / EdTech">Education / EdTech</option>
                                    <option value="Manufacturing & Engineering">Manufacturing & Engineering</option>
                                    <option value="Retail & eCommerce">Retail & eCommerce</option>
                                    <option value="Media & Entertainment">Media & Entertainment</option>
                                    <option value="Staffing & Recruitment">Staffing & Recruitment Agency</option>
                                    <option value="Consulting & Professional Services">Consulting & Professional Services</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Company Type</label>
                                <select
                                    value={formData.company_type}
                                    onChange={(e) => setFormData({ ...formData, company_type: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                >
                                    <option value="Corporate">Corporate / Direct Employer</option>
                                    <option value="Recruitment Agency">Recruitment Agency</option>
                                    <option value="Startup">Startup</option>
                                    <option value="MNC">Multinational Corporation (MNC)</option>
                                    <option value="Consultant">Independent Consultant</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Company Logo URL (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.company_logo}
                                    onChange={(e) => setFormData({ ...formData, company_logo: e.target.value })}
                                    placeholder="https://example.com/logo.png"
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Office Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Tower B, Tech Park, 4th Floor"
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">City <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="e.g. Bangalore"
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">State <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    placeholder="e.g. Karnataka"
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.pincode}
                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                    placeholder="560001"
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">GST Number (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.gst_number}
                                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                                    placeholder="29AAAAA0000A1Z5"
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm uppercase focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Recruiter Account Details */}
                    <div className="bg-white p-6 rounded-2xl border-1 border-gray-100 space-y-5">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 mb-0">2. Recruiter Account & Credentials</h2>
                                    <p className="text-xs text-gray-500 mb-0">Sign-in details and primary point of contact</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGenerateCredentials}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg border border-violet-200 transition-colors"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Auto-Generate Credentials</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name / Contact Person <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={formData.recruiter_name}
                                    onChange={(e) => setFormData({ ...formData, recruiter_name: e.target.value })}
                                    placeholder="e.g. Rahul Sharma"
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Designation</label>
                                <input
                                    type="text"
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    placeholder="e.g. Head of Talent Acquisition"
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Official Email (Username) <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="rahul@acme.com"
                                        className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    />
                                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile / Contact Number <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        required
                                        value={formData.mobile_number}
                                        onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                                        placeholder="+91 99887 76655"
                                        className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    />
                                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Username (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="Leave blank to use email"
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Password <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Min 6 characters"
                                        className="w-full pl-9 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    />
                                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        value={formData.confirm_password}
                                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                                        placeholder="Re-enter password"
                                        className="w-full pl-9 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    />
                                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Send welcome email checkbox */}
                        <div className="pt-2">
                            <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={formData.send_welcome_email}
                                    onChange={(e) => setFormData({ ...formData, send_welcome_email: e.target.checked })}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="font-medium">Send welcome email with credentials directly to recruiter</span>
                            </label>
                        </div>
                    </div>

                    {/* SECTION 3: Subscription Plan Assignment */}
                    <div className="bg-white p-6 rounded-2xl border-1 border-gray-100 space-y-5">
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900 mb-0">3. Subscription Plan Assignment</h2>
                                <p className="text-xs text-gray-500 mb-0">Attach initial quota, duration, and billing parameters</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Subscription Plan <span className="text-rose-500">*</span></label>
                                {loadingPlans ? (
                                    <div className="text-xs text-gray-400 py-2">Loading active plans...</div>
                                ) : (
                                    <select
                                        value={formData.plan_id}
                                        onChange={(e) => handlePlanChange(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    >
                                        {plans.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} — ₹{Number(p.price).toLocaleString()} ({p.plan_type || 'Monthly'})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Billing Cycle</label>
                                <select
                                    value={formData.billing_cycle}
                                    onChange={(e) => handleBillingCycleChange(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                >
                                    <option value="monthly">Monthly (30 Days)</option>
                                    <option value="quarterly">Quarterly (3 Months)</option>
                                    <option value="half-yearly">Half-Yearly (6 Months)</option>
                                    <option value="yearly">Annually (1 Year)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => handleStartDateChange(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Expiry Date (Auto-calculated)</label>
                                <input
                                    type="date"
                                    value={formData.expiry_date}
                                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Status</label>
                                <select
                                    value={formData.payment_status}
                                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                >
                                    <option value="Paid">Paid / Confirmed</option>
                                    <option value="Pending">Payment Pending</option>
                                    <option value="Waived">Waived / Free Trial</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Reference / Notes</label>
                                <input
                                    type="text"
                                    value={formData.payment_notes}
                                    onChange={(e) => setFormData({ ...formData, payment_notes: e.target.value })}
                                    placeholder="e.g. Cheque #49281, Admin Approval, Razorpay ID"
                                    className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right 1 Col: Live Plan Preview Card (Sticky) */}
                <div className="space-y-6 lg:sticky lg:top-6">
                    <div className="bg-white p-6 rounded-2xl border-1 border-gray-100 space-y-5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Assigned Plan Preview</span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border-1 border-blue-200">
                                {selectedPlan ? selectedPlan.name : 'No Plan'}
                            </span>
                        </div>

                        {selectedPlan ? (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-extrabold text-gray-900">
                                            ₹{Number(selectedPlan.price).toLocaleString()}
                                        </span>
                                        <span className="text-xs text-gray-500 mb-0">
                                            / {formData.billing_cycle}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-0 mt-1">
                                        {selectedPlan.description || 'Full recruiter hiring suite.'}
                                    </p>
                                </div>

                                <div className="h-px bg-gray-100" />

                                <div className="space-y-2.5">
                                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Entitlements & Quotas</span>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="p-2.5 bg-gray-50 rounded-xl">
                                            <span className="text-gray-400 block text-[11px]">Monthly Job Posts</span>
                                            <span className="text-sm font-bold text-gray-900">{selectedPlan.job_post_limit} Posts</span>
                                        </div>
                                        <div className="p-2.5 bg-gray-50 rounded-xl">
                                            <span className="text-gray-400 block text-[11px]">Max Active Jobs</span>
                                            <span className="text-sm font-bold text-gray-900">{selectedPlan.active_job_limit} Jobs</span>
                                        </div>
                                        <div className="p-2.5 bg-gray-50 rounded-xl">
                                            <span className="text-gray-400 block text-[11px]">Resume Views</span>
                                            <span className="text-sm font-bold text-gray-900">{selectedPlan.resume_view_limit} Views</span>
                                        </div>
                                        <div className="p-2.5 bg-gray-50 rounded-xl">
                                            <span className="text-gray-400 block text-[11px]">Resume Downloads</span>
                                            <span className="text-sm font-bold text-gray-900">{selectedPlan.resume_download_limit} Downloads</span>
                                        </div>
                                        <div className="p-2.5 bg-gray-50 rounded-xl">
                                            <span className="text-gray-400 block text-[11px]">Featured Jobs</span>
                                            <span className="text-sm font-bold text-gray-900">{selectedPlan.featured_job_limit || 0}</span>
                                        </div>
                                        <div className="p-2.5 bg-gray-50 rounded-xl">
                                            <span className="text-gray-400 block text-[11px]">Urgent Jobs</span>
                                            <span className="text-sm font-bold text-gray-900">{selectedPlan.urgent_job_limit || 0}</span>
                                        </div>
                                        <div className="p-2.5 bg-indigo-50/70 border-1 border-indigo-100 rounded-xl col-span-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-indigo-600 font-semibold block text-[11px]">Sub-Recruiters Allowed</span>
                                                <span className="text-[10px] text-indigo-700 bg-white font-bold px-2 py-0.5 rounded shadow-xs border-1 border-indigo-100">
                                                    Team Access
                                                </span>
                                            </div>
                                            <span className="text-sm font-extrabold text-indigo-950 mt-0.5 block">
                                                {selectedPlan.sub_recruiter_limit || 1} {Number(selectedPlan.sub_recruiter_limit) === 1 ? 'Seat' : 'Seats'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100" />

                                <div className="space-y-2">
                                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">Feature Access</span>
                                    <ul className="space-y-1.5 text-xs text-gray-600">
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-500" />
                                            <span className="text-gray-900 font-medium">
                                                Sub-Recruiter Delegation ({selectedPlan.sub_recruiter_limit || 1} seats included)
                                            </span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className={`w-4 h-4 ${selectedPlan.candidate_search ? 'text-emerald-500' : 'text-gray-300'}`} />
                                            <span className={selectedPlan.candidate_search ? 'text-gray-900 font-medium' : 'text-gray-400 line-through'}>Candidate Database Search</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className={`w-4 h-4 ${selectedPlan.candidate_contact ? 'text-emerald-500' : 'text-gray-300'}`} />
                                            <span className={selectedPlan.candidate_contact ? 'text-gray-900 font-medium' : 'text-gray-400 line-through'}>Direct Candidate Contact</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className={`w-4 h-4 ${selectedPlan.company_branding ? 'text-emerald-500' : 'text-gray-300'}`} />
                                            <span className={selectedPlan.company_branding ? 'text-gray-900 font-medium' : 'text-gray-400 line-through'}>Company Branding Page</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-500" />
                                            <span className="text-gray-900 font-medium">Recruiter Portal Dashboard</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-500" />
                                            <span className="text-gray-900 font-medium">Application Management</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5">
                                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-blue-800 leading-relaxed mb-0">
                                        The recruiter's limits and portal features are governed dynamically by this plan. You can change or extend it at any time.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-xs text-gray-400">
                                Please select a plan to view its quota and feature breakdown.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Success Credential Modal */}
            {createdModalData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 mt-0">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                                <Check className="w-6 h-6 text-white stroke-[3]" />
                            </div>
                            <h3 className="text-xl font-bold">Recruiter Account Created!</h3>
                            <p className="text-xs text-emerald-100 mt-1">
                                Company profile and subscription have been configured.
                            </p>
                        </div>

                        {/* Credentials Card */}
                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 font-mono text-xs">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                    <span className="text-gray-500">Company:</span>
                                    <span className="font-semibold text-gray-900">{createdModalData.company_name}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                    <span className="text-gray-500">Recruiter:</span>
                                    <span className="font-semibold text-gray-900">{createdModalData.recruiter_name}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                    <span className="text-gray-500">Login Email:</span>
                                    <span className="font-semibold text-blue-600">{createdModalData.email}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                    <span className="text-gray-500">Password:</span>
                                    <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                        {createdModalData.password}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Assigned Plan:</span>
                                    <span className="font-semibold text-gray-900">{createdModalData.plan_name}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={copyCredentialsToClipboard}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                <span>{copied ? 'Credentials Copied to Clipboard!' : 'Copy Credentials to Clipboard'}</span>
                            </button>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => router.push(`/admin/recruiters/${createdModalData.recruiter_id}`)}
                                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors text-center"
                                >
                                    View Recruiter Profile
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push('/admin/recruiters')}
                                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors text-center"
                                >
                                    All Recruiters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
