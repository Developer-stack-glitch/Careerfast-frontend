'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building, User, Users, Mail, Phone, Lock, Eye, EyeOff,
    Check, Copy, Sparkles, CreditCard,
    AlertCircle, ArrowLeft, ArrowRight, Loader2, CheckCircle2,
    Settings, X, Plus, Trash2, ShieldCheck, Briefcase, UserCheck,
    Sliders, ChevronRight, Globe, MapPin, Layers, Award
} from 'lucide-react';
import { getAdminPlans, createAdminRecruiter } from '../ApiService/action';
import AdminSelect from './AdminSelect';
import toast from 'react-hot-toast';

// Sub-recruiter role presets
const ROLE_PRESETS = [
    {
        id: 'team_admin',
        title: 'Team Admin',
        tag: 'Full Access',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        desc: 'Full operational access. Can post jobs, manage pipeline, download CVs, and edit company profile.',
        icon: ShieldCheck,
        permissions: {
            can_post_jobs: true,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_manage_applications: true,
            can_edit_company_profile: true,
            can_export_excel: true
        }
    },
    {
        id: 'recruiter',
        title: 'Standard Recruiter',
        tag: 'Core Hiring',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        desc: 'Primary recruiter. Can publish jobs, review applicants, and download candidate CVs & Excel sheets.',
        icon: Briefcase,
        permissions: {
            can_post_jobs: true,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_manage_applications: true,
            can_edit_company_profile: false,
            can_export_excel: true
        }
    },
    {
        id: 'sourcer',
        title: 'Sourcer / Reviewer',
        tag: 'Sourcing Only',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        desc: 'Candidate search and review only. Can browse profiles without publishing vacancies.',
        icon: UserCheck,
        permissions: {
            can_post_jobs: false,
            can_view_resumes: true,
            can_download_resumes: true,
            can_contact_candidates: true,
            can_manage_applications: true,
            can_edit_company_profile: false,
            can_export_excel: false
        }
    },
    {
        id: 'custom',
        title: 'Custom',
        tag: 'Granular',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        desc: 'Configure custom operational permissions for this recruiter.',
        icon: Sliders
    }
];

export default function AddRecruiter() {
    const router = useRouter();

    // Workflow Steps: 1: Company & Plan, 2: Master Recruiter, 3: Sub-Recruiters, 4: Review & Submit
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState([]);

    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Password visibility for primary master recruiter
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Success Modal state
    const [createdModalData, setCreatedModalData] = useState(null);
    const [copied, setCopied] = useState(false);

    // Custom Limits for "Custom" plan
    const [customLimits, setCustomLimits] = useState({
        job_post_limit: '',
        active_job_limit: '',
        featured_job_limit: '',
        urgent_job_limit: '',
        master_login_limit: 1,
        resume_view_limit: '',
        resume_download_limit: '',
        sub_recruiter_limit: 5,
        email_sent_count: '',
        whatsapp_message_count: ''
    });

    // Form data (Company Profile, Primary Recruiter, Subscription)
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

        // 2. Primary Master Recruiter Details
        recruiter_name: '',
        designation: 'Head of Talent Acquisition',
        email: '',
        mobile_number: '',
        username: '',
        password: '',
        confirm_password: '',
        send_welcome_email: true,

        // 3. Subscription & Limits
        plan_id: '',
        billing_cycle: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        payment_status: 'Paid',
        payment_notes: '',
        subscription_status: 'Active',
        master_login_limit: 1,
        sub_recruiter_limit: 5
    });

    // Additional Master Recruiters (when master_login_limit > 1)
    const [additionalMasters, setAdditionalMasters] = useState([]);

    // Sub-Recruiters (Step 3)
    const [subRecruiters, setSubRecruiters] = useState([]);

    // Helper to generate secure random password
    const generateSecurePassword = () => {
        const randomStr = Math.random().toString(36).substring(2, 6);
        const special = ['!', '@', '#', '$', '%'][Math.floor(Math.random() * 5)];
        return `Fast@${randomStr.toUpperCase()}${Math.floor(100 + Math.random() * 900)}${special}`;
    };

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

    // Fetch active plans on mount
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                setLoadingPlans(true);
                const res = await getAdminPlans();
                const fetchedPlans = res.data?.data || res.data || [];
                const filteredPlans = fetchedPlans.filter(p => !/custom/i.test(p.name));
                const activePlans = filteredPlans.filter(p => p.status === 'active' || p.status === 1);
                const finalPlans = activePlans.length > 0 ? activePlans : fetchedPlans;

                finalPlans.push({
                    id: 'custom',
                    name: 'Custom (Build your own plan)',
                    price: 0,
                    plan_type: 'Custom',
                    validity_days: 30,
                    master_login_limit: 1,
                    sub_recruiter_limit: 5
                });

                setPlans(finalPlans);

                if (fetchedPlans.length > 0) {
                    const defaultPlan = fetchedPlans[0];
                    const defMaster = defaultPlan.master_login_limit || 1;
                    const defSub = defaultPlan.sub_recruiter_limit !== undefined ? defaultPlan.sub_recruiter_limit : 5;
                    setFormData(prev => {
                        const nextExpiry = calculateExpiry(prev.start_date, prev.billing_cycle, defaultPlan.validity_days);
                        return {
                            ...prev,
                            plan_id: defaultPlan.id,
                            expiry_date: nextExpiry,
                            master_login_limit: defMaster,
                            sub_recruiter_limit: defSub
                        };
                    });
                    setCustomLimits(prev => ({
                        ...prev,
                        master_login_limit: defMaster,
                        sub_recruiter_limit: defSub
                    }));
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

    // Handle Plan Selection Change
    const handlePlanChange = (planId) => {
        const selected = plans.find(p => String(p.id) === String(planId));
        const validity = selected?.validity_days || 30;
        const newExpiry = calculateExpiry(formData.start_date, formData.billing_cycle, validity);
        const mLimit = selected?.master_login_limit || 1;
        const sLimit = selected?.sub_recruiter_limit !== undefined ? selected.sub_recruiter_limit : 5;

        setFormData(prev => ({
            ...prev,
            plan_id: planId,
            expiry_date: newExpiry,
            master_login_limit: mLimit,
            sub_recruiter_limit: sLimit
        }));
        setCustomLimits(prev => ({
            ...prev,
            master_login_limit: mLimit,
            sub_recruiter_limit: sLimit
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

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 1024 * 1024) {
            toast.error("Company logo must be under 1MB.");
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, company_logo: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    // Auto-generate credentials for primary master recruiter
    const handleGeneratePrimaryCredentials = () => {
        const generatedPassword = generateSecurePassword();
        let autoUsername = '';
        if (formData.email) {
            autoUsername = formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        } else if (formData.recruiter_name) {
            autoUsername = formData.recruiter_name.toLowerCase().replace(/\s+/g, '.') + Math.floor(10 + Math.random() * 90);
        } else {
            autoUsername = `master_${Math.floor(1000 + Math.random() * 9000)}`;
        }

        setFormData(prev => ({
            ...prev,
            username: autoUsername,
            password: generatedPassword,
            confirm_password: generatedPassword
        }));

        setShowPassword(true);
        setShowConfirmPassword(true);
        toast.success("Generated secure password for Primary Master!");
    };

    // Additional Master Recruiters Handlers
    const handleAddAdditionalMaster = () => {
        const maxMasters = Math.max(1, Number(formData.master_login_limit) || 1);
        const currentTotal = 1 + additionalMasters.length;
        if (currentTotal >= maxMasters) {
            return toast.error(`Plan limit reached: Only ${maxMasters} Master Recruiter login(s) allowed. Increase limit in Step 1 to add more.`);
        }

        const newPass = generateSecurePassword();
        setAdditionalMasters(prev => [
            ...prev,
            {
                id: `master-${Date.now()}-${Math.random()}`,
                name: '',
                designation: 'Master Recruiter',
                email: '',
                phone: '',
                password: newPass,
                confirm_password: newPass,
                showPassword: true,
                allocated_seats: formData.sub_recruiter_limit || 5
            }
        ]);
    };

    const handleUpdateAdditionalMaster = (index, field, value) => {
        setAdditionalMasters(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleRemoveAdditionalMaster = (index) => {
        setAdditionalMasters(prev => prev.filter((_, i) => i !== index));
        // Also re-assign any sub-recruiters pointing to this master back to primary
        setSubRecruiters(prev => prev.map(s => {
            if (s.master_index === index + 1) {
                return { ...s, master_index: 0 };
            } else if (s.master_index > index + 1) {
                return { ...s, master_index: s.master_index - 1 };
            }
            return s;
        }));
    };

    // Sub-Recruiter Handlers
    const handleAddSubRecruiter = () => {
        const newPass = generateSecurePassword();
        setSubRecruiters(prev => [
            ...prev,
            {
                id: `sub-${Date.now()}-${Math.random()}`,
                name: '',
                email: '',
                phone: '',
                password: newPass,
                confirm_password: newPass,
                showPassword: true,
                designation: 'Recruiter',
                master_index: 0, // 0 = Primary Master, 1..N = Additional Masters
                role_preset: 'recruiter',
                permissions: {
                    can_post_jobs: true,
                    can_view_resumes: true,
                    can_download_resumes: true,
                    can_contact_candidates: true,
                    can_export_excel: true,
                    can_manage_applications: true,
                    can_edit_company_profile: false,
                    quota_mode: 'shared'
                }
            }
        ]);
    };

    const handleUpdateSubRecruiter = (index, field, value) => {
        setSubRecruiters(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleUpdateSubRolePreset = (index, presetId) => {
        const preset = ROLE_PRESETS.find(p => p.id === presetId);
        setSubRecruiters(prev => {
            const updated = [...prev];
            const currentSub = updated[index];
            if (preset && preset.permissions) {
                updated[index] = {
                    ...currentSub,
                    role_preset: presetId,
                    permissions: {
                        ...currentSub.permissions,
                        ...preset.permissions
                    }
                };
            } else {
                updated[index] = {
                    ...currentSub,
                    role_preset: presetId
                };
            }
            return updated;
        });
    };

    const handleToggleSubPermission = (index, permKey) => {
        setSubRecruiters(prev => {
            const updated = [...prev];
            const currentSub = updated[index];
            updated[index] = {
                ...currentSub,
                permissions: {
                    ...currentSub.permissions,
                    [permKey]: !currentSub.permissions?.[permKey]
                }
            };
            return updated;
        });
    };

    const handleRemoveSubRecruiter = (index) => {
        setSubRecruiters(prev => prev.filter((_, i) => i !== index));
    };

    // Master Recruiter Options for assigning Sub-Recruiters
    const allMasterOptions = useMemo(() => {
        const list = [
            {
                index: 0,
                name: formData.recruiter_name ? `${formData.recruiter_name} (Primary Master)` : 'Primary Master Recruiter',
                email: formData.email,
                allocated_seats: formData.sub_recruiter_limit || 0
            }
        ];
        additionalMasters.forEach((m, idx) => {
            list.push({
                index: idx + 1,
                name: m.name ? `${m.name} (Master #${idx + 2})` : `Master Recruiter #${idx + 2}`,
                email: m.email,
                allocated_seats: m.allocated_seats || formData.sub_recruiter_limit || 0
            });
        });
        return list;
    }, [formData.recruiter_name, formData.email, formData.sub_recruiter_limit, additionalMasters]);

    // Validation for Step 1
    const validateStep1 = () => {
        if (!formData.company_name.trim()) {
            toast.error("Company Name is required.");
            return false;
        }
        if (!formData.company_email.trim()) {
            toast.error("Company Official Email is required.");
            return false;
        }
        if (!formData.company_phone.trim()) {
            toast.error("Company Contact Phone is required.");
            return false;
        }
        if (!formData.city.trim()) {
            toast.error("Company City is required.");
            return false;
        }
        if (!formData.state.trim()) {
            toast.error("Company State is required.");
            return false;
        }
        if (!formData.pincode.trim()) {
            toast.error("Company Pincode is required.");
            return false;
        }
        if (!formData.plan_id) {
            toast.error("Please select a subscription plan.");
            return false;
        }
        return true;
    };

    // Validation for Step 2
    const validateStep2 = () => {
        // Validate primary master
        if (!formData.recruiter_name.trim()) {
            toast.error("Primary Master Recruiter Name is required.");
            return false;
        }
        if (!formData.email.trim()) {
            toast.error("Primary Master Official Email is required.");
            return false;
        }
        if (!formData.mobile_number.trim()) {
            toast.error("Primary Master Mobile Number is required.");
            return false;
        }
        if (!formData.password) {
            toast.error("Password is required for Primary Master Recruiter.");
            return false;
        }
        if (formData.password !== formData.confirm_password) {
            toast.error("Passwords do not match for Primary Master Recruiter.");
            return false;
        }

        // Validate additional masters
        const emails = [formData.email.trim().toLowerCase()];
        for (let i = 0; i < additionalMasters.length; i++) {
            const m = additionalMasters[i];
            if (!m.name.trim()) {
                toast.error(`Name is required for Master Recruiter #${i + 2}.`);
                return false;
            }
            if (!m.email.trim()) {
                toast.error(`Email is required for Master Recruiter #${i + 2}.`);
                return false;
            }
            if (!m.password) {
                toast.error(`Password is required for Master Recruiter #${i + 2}.`);
                return false;
            }
            const lowEmail = m.email.trim().toLowerCase();
            if (emails.includes(lowEmail)) {
                toast.error(`Duplicate email "${m.email}" used for Master Recruiter #${i + 2}. Each account must have a unique email.`);
                return false;
            }
            emails.push(lowEmail);
        }

        return true;
    };

    // Validation for Step 3
    const validateStep3 = () => {
        const allEmails = [
            formData.email.trim().toLowerCase(),
            ...additionalMasters.map(m => m.email.trim().toLowerCase())
        ];

        for (let i = 0; i < subRecruiters.length; i++) {
            const s = subRecruiters[i];
            if (!s.name.trim()) {
                toast.error(`Full Name is required for Sub-Recruiter #${i + 1}.`);
                return false;
            }
            if (!s.email.trim()) {
                toast.error(`Official Email is required for Sub-Recruiter #${i + 1}.`);
                return false;
            }
            if (!s.password) {
                toast.error(`Password is required for Sub-Recruiter #${i + 1}.`);
                return false;
            }
            const lowEmail = s.email.trim().toLowerCase();
            if (allEmails.includes(lowEmail)) {
                toast.error(`Duplicate email "${s.email}" used for Sub-Recruiter #${i + 1}. Each login account must have a unique email.`);
                return false;
            }
            allEmails.push(lowEmail);
        }
        return true;
    };

    // Navigation Step handlers
    const goToStep = (stepNumber) => {
        if (stepNumber < currentStep) {
            setCurrentStep(stepNumber);
            return;
        }
        if (currentStep === 1) {
            if (!validateStep1()) return;
            setCompletedSteps(prev => Array.from(new Set([...prev, 1])));
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (!validateStep2()) return;
            setCompletedSteps(prev => Array.from(new Set([...prev, 1, 2])));
            setCurrentStep(3);
        } else if (currentStep === 3) {
            if (!validateStep3()) return;
            setCompletedSteps(prev => Array.from(new Set([...prev, 1, 2, 3])));
            setCurrentStep(4);
        }
    };

    const handleNextStep = () => {
        if (currentStep === 1) {
            if (validateStep1()) {
                setCompletedSteps(prev => Array.from(new Set([...prev, 1])));
                setCurrentStep(2);
            }
        } else if (currentStep === 2) {
            if (validateStep2()) {
                setCompletedSteps(prev => Array.from(new Set([...prev, 1, 2])));
                setCurrentStep(3);
            }
        } else if (currentStep === 3) {
            if (validateStep3()) {
                setCompletedSteps(prev => Array.from(new Set([...prev, 1, 2, 3])));
                setCurrentStep(4);
            }
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const selectedPlan = plans.find(p => String(p.id) === String(formData.plan_id));

    // Final Form Submission
    const handleSubmit = async (saveAsDraft = false) => {
        if (!validateStep1() || !validateStep2() || !validateStep3()) {
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                ...formData,
                master_login_limit: Math.max(1, Number(formData.master_login_limit) || 1),
                sub_recruiter_limit: Math.max(0, Number(formData.sub_recruiter_limit) || 0),
                subscription_status: saveAsDraft ? 'Inactive' : 'Active',
                custom_limits: formData.plan_id === 'custom' ? {
                    ...customLimits,
                    master_login_limit: Math.max(1, Number(formData.master_login_limit) || 1),
                    sub_recruiter_limit: Math.max(0, Number(formData.sub_recruiter_limit) || 0)
                } : {
                    master_login_limit: Math.max(1, Number(formData.master_login_limit) || 1),
                    sub_recruiter_limit: Math.max(0, Number(formData.sub_recruiter_limit) || 0)
                },
                additional_master_recruiters: additionalMasters.map(m => ({
                    name: m.name.trim(),
                    email: m.email.trim(),
                    phone: m.phone.trim(),
                    password: m.password,
                    designation: m.designation || 'Master Recruiter',
                    allocated_seats: Math.max(0, Number(m.allocated_seats) || Number(formData.sub_recruiter_limit) || 0)
                })),
                sub_recruiters: subRecruiters.map(s => ({
                    name: s.name.trim(),
                    email: s.email.trim(),
                    phone: s.phone.trim(),
                    password: s.password,
                    designation: s.designation || 'Recruiter',
                    master_index: s.master_index,
                    master_email: s.master_index === 0 ? formData.email : (additionalMasters[s.master_index - 1]?.email || formData.email),
                    role_preset: s.role_preset,
                    permissions: s.permissions
                }))
            };

            const res = await createAdminRecruiter(payload);
            const createdData = res.data?.data || {};

            toast.success(saveAsDraft ? "Company & Recruiter accounts saved as Inactive." : "Company and Recruiter logins created successfully!");

            // Prepare Modal Data
            setCreatedModalData({
                recruiter_id: createdData.recruiter_id,
                company_name: formData.company_name,
                plan_name: selectedPlan?.name || 'Custom Plan',
                expiry_date: formData.expiry_date,
                status: saveAsDraft ? 'Inactive' : 'Active',
                master_login_limit: Math.max(1, Number(formData.master_login_limit) || 1),
                sub_recruiter_limit: Math.max(0, Number(formData.sub_recruiter_limit) || 0),
                created_masters: createdData.created_masters || [
                    {
                        name: formData.recruiter_name,
                        email: formData.email,
                        password: formData.password,
                        designation: formData.designation,
                        allocated_seats: formData.sub_recruiter_limit,
                        is_primary: true
                    },
                    ...additionalMasters.map(m => ({
                        name: m.name,
                        email: m.email,
                        password: m.password,
                        designation: m.designation,
                        allocated_seats: m.allocated_seats,
                        is_primary: false
                    }))
                ],
                created_sub_recruiters: createdData.created_sub_recruiters || subRecruiters.map(s => ({
                    name: s.name,
                    email: s.email,
                    password: s.password,
                    designation: s.designation,
                    role_preset: s.role_preset,
                    master_name: s.master_index === 0 ? formData.recruiter_name : (additionalMasters[s.master_index - 1]?.name || 'Primary Master')
                }))
            });
        } catch (err) {
            console.error("Failed to create company and recruiters:", err);
            const msg = err.response?.data?.message || err.message || "Failed to create recruiter account.";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // Copy all generated credentials to clipboard
    const copyAllCredentialsToClipboard = () => {
        if (!createdModalData) return;
        const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        const defaultHrUrl = isLocalhost ? 'http://localhost:3001' : 'http://recruit.careerfast.in';
        const hrPortalUrl = process.env.NEXT_PUBLIC_HR_PORTAL_URL || defaultHrUrl;

        let text = `=========================================\n`;
        text += `CAREERFAST RECRUITER PORTAL ACCESS\n`;
        text += `=========================================\n`;
        text += `Company: ${createdModalData.company_name}\n`;
        text += `Assigned Plan: ${createdModalData.plan_name} (Valid till: ${createdModalData.expiry_date || 'N/A'})\n`;
        text += `Portal Login URL: ${hrPortalUrl}/login\n\n`;

        text += `--- 👑 MASTER RECRUITER LOGINS ---\n`;
        createdModalData.created_masters?.forEach((m, i) => {
            text += `[${i + 1}] ${m.name} (${m.designation || 'Master Recruiter'})\n`;
            text += `    Email: ${m.email}\n`;
            text += `    Password: ${m.password}\n`;
            text += `    Sub-Recruiter Seats: ${m.allocated_seats || 0} Seats\n\n`;
        });

        if (createdModalData.created_sub_recruiters && createdModalData.created_sub_recruiters.length > 0) {
            text += `--- 👥 SUB-RECRUITER LOGINS ---\n`;
            createdModalData.created_sub_recruiters.forEach((s, i) => {
                text += `[${i + 1}] ${s.name} (${s.designation || 'Recruiter'})\n`;
                text += `    Email: ${s.email}\n`;
                text += `    Password: ${s.password}\n`;
                text += `    Assigned Master: ${s.master_name}\n`;
                text += `    Role Preset: ${s.role_preset}\n\n`;
            });
        }

        text += `=========================================\n`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("All login credentials copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
    };

    // Step definitions for visual progress
    const STEPS = [
        { num: 1, title: 'Company & Plan', icon: Building, desc: 'Profile & Subscription' },
        { num: 2, title: 'Master Recruiter', icon: User, desc: 'Company Admin Credentials' },
        { num: 3, title: 'Sub-Recruiters', icon: Users, desc: 'Team Members (Optional)' },
        { num: 4, title: 'Review & Launch', icon: Award, desc: 'Verify & Provision' }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {/* Top Navigation & Workflow Stepper Header */}
            <div className="bg-white p-6 rounded-2xl shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.push('/admin/recruiters')}
                            className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                            title="Back to Recruiters List"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold text-gray-900 mb-0">Create Company & Recruiter Logins</h1>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border-1 border-blue-200">
                                    Step {currentStep} of 4: {STEPS[currentStep - 1].title}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-0">
                                Structured provisioning: create company first, configure master recruiter admin logins, and add sub-recruiter team seats.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Progress Stepper Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                    {STEPS.map((s) => {
                        const Icon = s.icon;
                        const isActive = currentStep === s.num;
                        const isDone = completedSteps.includes(s.num) || currentStep > s.num;

                        return (
                            <button
                                key={s.num}
                                type="button"
                                onClick={() => goToStep(s.num)}
                                className={`flex items-center gap-3 p-3 rounded-xl border-1 text-left transition-all cursor-pointer ${isActive
                                    ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                                    : isDone
                                        ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50/80 text-emerald-950'
                                        : 'bg-gray-50/60 border-gray-200 hover:bg-gray-50 text-gray-400 opacity-80'
                                    }`}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm ${isActive
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : isDone
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                    }`}>
                                    {isDone && !isActive ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-sm font-bold ${isActive ? 'text-blue-900' : isDone ? 'text-emerald-900' : 'text-gray-700'}`}>
                                            {s.num}. {s.title}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 truncate mb-0">{s.desc}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* STEP 1: Company Profile & Subscription Plan */}
            {currentStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-200">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Section: Company Profile */}
                        <div className="bg-white p-6 rounded-2xl shadow-xs space-y-5">
                            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    <Building className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900 mb-0">1. Company Profile Details</h2>
                                    <p className="text-xs text-gray-500 mb-0">Enter the employer organization details, address, and branding</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Employer Name <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.company_name}
                                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                        placeholder="e.g. Acme Technologies Pvt Ltd"
                                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Company Official Email <span className="text-rose-500">*</span></label>
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
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Company Contact Phone <span className="text-rose-500">*</span></label>
                                    <input
                                        type="tel"
                                        required
                                        maxLength={20}
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
                                    <AdminSelect
                                        value={formData.industry}
                                        onChange={(val) => setFormData({ ...formData, industry: val })}
                                        options={[
                                            { label: 'Information Technology', value: 'Information Technology' },
                                            { label: 'Healthcare & Pharma', value: 'Healthcare & Pharma' },
                                            { label: 'BFSI / Banking', value: 'BFSI / Banking' },
                                            { label: 'Education / EdTech', value: 'Education / EdTech' },
                                            { label: 'Manufacturing & Engineering', value: 'Manufacturing & Engineering' },
                                            { label: 'Retail & eCommerce', value: 'Retail & eCommerce' },
                                            { label: 'Media & Entertainment', value: 'Media & Entertainment' },
                                            { label: 'Staffing & Recruitment Agency', value: 'Staffing & Recruitment' },
                                            { label: 'Consulting & Professional Services', value: 'Consulting & Professional Services' },
                                            { label: 'Other', value: 'Other' }
                                        ]}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Company Type</label>
                                    <AdminSelect
                                        value={formData.company_type}
                                        onChange={(val) => setFormData({ ...formData, company_type: val })}
                                        options={[
                                            { label: 'Corporate / Direct Employer', value: 'Corporate' },
                                            { label: 'Recruitment Agency', value: 'Recruitment Agency' },
                                            { label: 'Startup', value: 'Startup' },
                                            { label: 'Multinational Corporation (MNC)', value: 'MNC' },
                                            { label: 'Independent Consultant', value: 'Consultant' }
                                        ]}
                                        className="w-full"
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

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Company Logo</label>
                                    <div className="flex items-center gap-4">
                                        {formData.company_logo && formData.company_logo.startsWith('data:image') ? (
                                            <div className="relative w-12 h-12 rounded-xl border border-gray-200 overflow-hidden shrink-0 group">
                                                <img src={formData.company_logo} alt="Logo preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, company_logo: '' })}
                                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-4 h-4 text-white" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                                                <Building className="w-5 h-5 text-gray-400" />
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Office Address Line</label>
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
                                        placeholder="e.g. Chennai"
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
                                        placeholder="e.g. Tamil Nadu"
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
                                        placeholder="600001"
                                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Country</label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Subscription & Plan Assignment */}
                        <div className="bg-white p-6 rounded-2xl shadow-xs space-y-5">
                            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900 mb-0">2. Subscription Plan & Account Quotas</h2>
                                    <p className="text-xs text-gray-500 mb-0">Configure plan validity, master login limit, and sub-recruiter seat capacity</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Select Subscription Plan <span className="text-rose-500">*</span></label>
                                    {loadingPlans ? (
                                        <div className="text-xs text-gray-400 py-2">Loading active plans...</div>
                                    ) : (
                                        <AdminSelect
                                            value={formData.plan_id}
                                            onChange={(val) => handlePlanChange(val)}
                                            options={plans.map(p => ({
                                                label: p.name,
                                                value: String(p.id)
                                            }))}
                                            className="w-full"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Billing Cycle</label>
                                    <AdminSelect
                                        value={formData.billing_cycle}
                                        onChange={(val) => handleBillingCycleChange(val)}
                                        options={[
                                            { label: 'Monthly (30 Days)', value: 'monthly' },
                                            { label: 'Quarterly (3 Months)', value: 'quarterly' },
                                            { label: 'Half-Yearly (6 Months)', value: 'half-yearly' },
                                            { label: 'Annually (1 Year)', value: 'yearly' }
                                        ]}
                                        className="w-full"
                                    />
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
                                    <AdminSelect
                                        value={formData.payment_status}
                                        onChange={(val) => setFormData({ ...formData, payment_status: val })}
                                        options={[
                                            { label: 'Paid / Confirmed', value: 'Paid' },
                                            { label: 'Payment Pending', value: 'Pending' },
                                            { label: 'Waived / Free Trial', value: 'Waived' }
                                        ]}
                                        className="w-full"
                                    />
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

                                {/* Capacity Limits */}
                                <div className="p-4 bg-emerald-50/60 rounded-xl border-1 border-emerald-100">
                                    <label className="flex items-center justify-between text-xs font-semibold text-emerald-900 mb-1">
                                        <span>Master Login Count <span className="text-rose-500">*</span></span>
                                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded">COMPANY LIMIT</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={formData.master_login_limit}
                                        onChange={(e) => {
                                            const val = Math.max(1, parseInt(e.target.value) || 1);
                                            setFormData(prev => ({ ...prev, master_login_limit: val }));
                                            setCustomLimits(prev => ({ ...prev, master_login_limit: val }));
                                        }}
                                        className="w-full px-3 py-2 bg-white border-1 border-emerald-200 rounded-lg text-sm font-bold text-emerald-950 focus:outline-none focus:border-emerald-500"
                                    />
                                    <span className="text-[11px] text-emerald-700 mt-1 block">Maximum independent Master Recruiter logins allowed</span>
                                </div>

                                <div className="p-4 bg-indigo-50/60 rounded-xl border-1 border-indigo-100">
                                    <label className="flex items-center justify-between text-xs font-semibold text-indigo-900 mb-1">
                                        <span>Sub-Recruiter Seats per Master <span className="text-rose-500">*</span></span>
                                        <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-100 px-2 py-0.5 rounded">PER MASTER LOGIN</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={formData.sub_recruiter_limit}
                                        onChange={(e) => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                            setFormData(prev => ({ ...prev, sub_recruiter_limit: val }));
                                            setCustomLimits(prev => ({ ...prev, sub_recruiter_limit: val }));
                                        }}
                                        className="w-full px-3 py-2 bg-white border-1 border-indigo-200 rounded-lg text-sm font-bold text-indigo-950 focus:outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-[11px] text-indigo-700 mt-1 block">Team member seats each Master Recruiter can invite</span>
                                </div>
                            </div>
                        </div>

                        {/* Custom limits if custom plan selected */}
                        {formData.plan_id === 'custom' && (
                            <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200 space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b border-amber-200/80">
                                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                                        <Settings className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-amber-950 mb-0">Custom Plan Entitlements & Quotas</h2>
                                        <p className="text-xs text-amber-800 mb-0">Define specific hiring limits for this custom subscription</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">Monthly Job Posts</label>
                                        <input
                                            type="number" min="0" value={customLimits.job_post_limit}
                                            onChange={(e) => setCustomLimits({ ...customLimits, job_post_limit: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">Max Active Jobs</label>
                                        <input
                                            type="number" min="0" value={customLimits.active_job_limit}
                                            onChange={(e) => setCustomLimits({ ...customLimits, active_job_limit: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">Resume Views</label>
                                        <input
                                            type="number" min="0" value={customLimits.resume_view_limit}
                                            onChange={(e) => setCustomLimits({ ...customLimits, resume_view_limit: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-gray-700 mb-1">Resume Downloads</label>
                                        <input
                                            type="number" min="0" value={customLimits.resume_download_limit}
                                            onChange={(e) => setCustomLimits({ ...customLimits, resume_download_limit: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg font-semibold"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sticky Preview Card */}
                    <div className="space-y-6 lg:sticky lg:top-6">
                        <div className="bg-white p-6 rounded-2xl shadow-xs space-y-5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Assigned Plan Preview</span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border-1 border-blue-200">
                                    {selectedPlan ? selectedPlan.name : 'No Plan'}
                                </span>
                            </div>

                            {selectedPlan ? (
                                <div className="space-y-4">
                                    <p className="text-xs text-gray-500 mb-0">
                                        {selectedPlan.description || 'Full recruiter hiring suite.'}
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="p-2.5 bg-gray-50 rounded-xl">
                                            <span className="text-gray-400 block text-[11px]">Monthly Job Posts</span>
                                            <span className="text-sm font-semibold text-gray-900">{formData.plan_id === 'custom' ? customLimits.job_post_limit || 0 : selectedPlan.job_post_limit} Posts</span>
                                        </div>
                                        <div className="p-2.5 bg-gray-50 rounded-xl">
                                            <span className="text-gray-400 block text-[11px]">Max Active Jobs</span>
                                            <span className="text-sm font-semibold text-gray-900">{formData.plan_id === 'custom' ? customLimits.active_job_limit || 0 : selectedPlan.active_job_limit} Jobs</span>
                                        </div>
                                        <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                                            <span className="text-emerald-700 font-semibold block text-[11px]">Master Logins</span>
                                            <span className="text-sm font-bold text-emerald-950 mt-0.5 block">
                                                {formData.master_login_limit || 1} Accounts
                                            </span>
                                        </div>
                                        <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                                            <span className="text-indigo-600 font-semibold block text-[11px]">Seats / Master</span>
                                            <span className="text-sm font-bold text-indigo-950 mt-0.5 block">
                                                {formData.sub_recruiter_limit || 0} Seats
                                            </span>
                                        </div>
                                        <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl col-span-2 flex items-center justify-between text-xs">
                                            <span className="text-slate-500 font-medium">Total Company Capacity:</span>
                                            <span className="font-bold text-slate-900">
                                                {Number(formData.master_login_limit || 1) * Number(formData.sub_recruiter_limit || 0)} Total Team Seats
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-8 text-center text-xs text-gray-400">
                                    Select a plan to preview entitlements.
                                </div>
                            )}

                            <div className="p-3 bg-blue-50/70 border-1 border-blue-100 rounded-xl flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-blue-800 leading-relaxed mb-0">
                                    Next step will prompt you to create Master Recruiter login credentials for this company.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: Master Recruiter Logins */}
            {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Step context banner */}
                    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-4 rounded-2xl border-1 border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base font-bold text-gray-900 mb-0">
                                        Configure Master Recruiter Logins for {formData.company_name || 'Company'}
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                        Allowed: {formData.master_login_limit} Master Accounts
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-0.5 mb-0">
                                    Master Recruiters have administrative authority, own their job posts, and can manage Sub-Recruiter team members.
                                </p>
                            </div>
                        </div>

                        {1 + additionalMasters.length < (formData.master_login_limit || 1) && (
                            <button
                                type="button"
                                onClick={handleAddAdditionalMaster}
                                className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors shrink-0 shadow-xs cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Another Master Recruiter</span>
                            </button>
                        )}
                    </div>

                    {/* Card 1: Primary Master Recruiter */}
                    <div className="bg-white p-6 rounded-2xl shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                    #1
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-gray-900 mb-0">Primary Master Recruiter Account</h2>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border-1 border-emerald-200">
                                            PRIMARY ADMIN
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-0">Main contact person and primary portal administrator</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGeneratePrimaryCredentials}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg border border-violet-200 transition-colors w-fit cursor-pointer"
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
                                        maxLength={20}
                                        value={formData.mobile_number}
                                        onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                                        placeholder="+91 99887 76655"
                                        className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    />
                                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                </div>
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
                                        className="w-full pl-9 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all font-mono"
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
                                        className="w-full pl-9 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all font-mono"
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

                        <div className="pt-2">
                            <label className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={formData.send_welcome_email}
                                    onChange={(e) => setFormData({ ...formData, send_welcome_email: e.target.checked })}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="font-medium">Send welcome email with login credentials directly to primary recruiter</span>
                            </label>
                        </div>
                    </div>

                    {/* Additional Master Recruiter Cards */}
                    {additionalMasters.map((master, idx) => (
                        <div key={master.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5 animate-in fade-in duration-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                                        #{idx + 2}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-sm font-bold text-gray-900 mb-0">
                                                Master Recruiter #{idx + 2} Account
                                            </h2>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                CO-ADMIN
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-0">Independent master login for this company</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newPass = generateSecurePassword();
                                            handleUpdateAdditionalMaster(idx, 'password', newPass);
                                            handleUpdateAdditionalMaster(idx, 'confirm_password', newPass);
                                            handleUpdateAdditionalMaster(idx, 'showPassword', true);
                                            toast.success(`Generated password for Master #${idx + 2}`);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg border border-violet-200 transition-colors cursor-pointer"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>Auto-Generate</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveAdditionalMaster(idx)}
                                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                        title="Remove Master Recruiter"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={master.name}
                                        onChange={(e) => handleUpdateAdditionalMaster(idx, 'name', e.target.value)}
                                        placeholder="e.g. Priya Sundaram"
                                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Designation</label>
                                    <input
                                        type="text"
                                        value={master.designation}
                                        onChange={(e) => handleUpdateAdditionalMaster(idx, 'designation', e.target.value)}
                                        placeholder="e.g. Technical Hiring Lead"
                                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Official Email <span className="text-rose-500">*</span></label>
                                    <input
                                        type="email"
                                        required
                                        value={master.email}
                                        onChange={(e) => handleUpdateAdditionalMaster(idx, 'email', e.target.value)}
                                        placeholder="priya@acme.com"
                                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number</label>
                                    <input
                                        type="tel"
                                        maxLength={20}
                                        value={master.phone}
                                        onChange={(e) => handleUpdateAdditionalMaster(idx, 'phone', e.target.value)}
                                        placeholder="+91 98111 22334"
                                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Password <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type={master.showPassword ? "text" : "password"}
                                            required
                                            value={master.password}
                                            onChange={(e) => handleUpdateAdditionalMaster(idx, 'password', e.target.value)}
                                            className="w-full px-3.5 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleUpdateAdditionalMaster(idx, 'showPassword', !master.showPassword)}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            {master.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Allocated Sub-Recruiter Seats</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={master.allocated_seats}
                                        onChange={(e) => handleUpdateAdditionalMaster(idx, 'allocated_seats', Math.max(0, parseInt(e.target.value) || 0))}
                                        className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Master Count Status Banner */}
                    <div className="p-4 bg-gray-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">Configured Master Logins:</span>
                            <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                                {1 + additionalMasters.length} of {formData.master_login_limit || 1} Accounts
                            </span>
                        </div>
                        {1 + additionalMasters.length < (formData.master_login_limit || 1) ? (
                            <span className="text-blue-600 font-medium">
                                You can configure {Number(formData.master_login_limit) - (1 + additionalMasters.length)} more Master Recruiter account(s).
                            </span>
                        ) : (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Master account capacity fully assigned.
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* STEP 3: Sub-Recruiter Logins (Optional Team Members) */}
            {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Step context banner */}
                    <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-4 rounded-2xl border-1 border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base font-bold text-gray-900 mb-0">
                                        Provision Sub-Recruiter Team Logins (Optional)
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                        {subRecruiters.length} Sub-Recruiter(s) Added
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 mt-0.5 mb-0">
                                    Create sub-recruiter team seats right now under your master recruiter(s), or skip this step to let master recruiters invite them later.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddSubRecruiter}
                            className="flex items-center gap-2 px-3.5 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 transition-colors shrink-0 shadow-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Sub-Recruiter Login</span>
                        </button>
                    </div>

                    {/* Master Seat Distribution Tracker */}
                    <div className="bg-white p-4 rounded-2xl border-1 border-gray-100 shadow-xs">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                            Master Recruiter Seat Allocations
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {allMasterOptions.map(m => {
                                const usedCount = subRecruiters.filter(s => s.master_index === m.index).length;
                                return (
                                    <div key={m.index} className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-xs flex items-center justify-between">
                                        <div className="truncate pr-2">
                                            <span className="font-semibold text-gray-900 block truncate">{m.name}</span>
                                            <span className="text-[11px] text-gray-400 truncate block">{m.email || 'Email set'}</span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                                {usedCount} Assigned
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sub-Recruiters List or Empty State */}
                    {subRecruiters.length === 0 ? (
                        <div className="bg-white p-8 rounded-2xl shadow-xs text-center space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                                <Users className="w-6 h-6" />
                            </div>
                            <div className="max-w-md mx-auto">
                                <h4 className="text-sm font-bold text-gray-900 mb-1">No Sub-Recruiters Added Yet</h4>
                                <p className="text-xs text-gray-500 mb-0">
                                    You can provision team members now with granular permissions, or skip this step. The Master Recruiter can invite them from their portal at any time.
                                </p>
                            </div>
                            <div className="flex items-center justify-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleAddSubRecruiter}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add First Sub-Recruiter</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNextStep()}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                >
                                    Skip & Review
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {subRecruiters.map((sub, idx) => (
                                <div key={sub.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5 animate-in fade-in duration-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                                                #{idx + 1}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-sm font-bold text-gray-900 mb-0">Sub-Recruiter #{idx + 1}</h2>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                                        TEAM SEAT
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-0">Credentials & operational role for this team member</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newPass = generateSecurePassword();
                                                    handleUpdateSubRecruiter(idx, 'password', newPass);
                                                    handleUpdateSubRecruiter(idx, 'showPassword', true);
                                                    toast.success(`Generated password for Sub-Recruiter #${idx + 1}`);
                                                }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg border border-violet-200 transition-colors cursor-pointer"
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                                <span>Auto-Generate</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSubRecruiter(idx)}
                                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                title="Remove Sub-Recruiter"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Assigned Master Recruiter <span className="text-rose-500">*</span>
                                            </label>
                                            <AdminSelect
                                                value={String(sub.master_index)}
                                                onChange={(val) => handleUpdateSubRecruiter(idx, 'master_index', Number(val))}
                                                options={allMasterOptions.map(m => ({
                                                    label: m.name,
                                                    value: String(m.index)
                                                }))}
                                                className="w-full"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name <span className="text-rose-500">*</span></label>
                                            <input
                                                type="text"
                                                required
                                                value={sub.name}
                                                onChange={(e) => handleUpdateSubRecruiter(idx, 'name', e.target.value)}
                                                placeholder="e.g. Arun Kumar"
                                                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-teal-500 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Official Email <span className="text-rose-500">*</span></label>
                                            <input
                                                type="email"
                                                required
                                                value={sub.email}
                                                onChange={(e) => handleUpdateSubRecruiter(idx, 'email', e.target.value)}
                                                placeholder="arun@acme.com"
                                                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-teal-500 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Designation</label>
                                            <input
                                                type="text"
                                                value={sub.designation}
                                                onChange={(e) => handleUpdateSubRecruiter(idx, 'designation', e.target.value)}
                                                placeholder="e.g. Talent Acquisition Specialist"
                                                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-teal-500 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number</label>
                                            <input
                                                type="tel"
                                                maxLength={20}
                                                value={sub.phone}
                                                onChange={(e) => handleUpdateSubRecruiter(idx, 'phone', e.target.value)}
                                                placeholder="+91 97777 88888"
                                                className="w-full px-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-teal-500 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Password <span className="text-rose-500">*</span></label>
                                            <div className="relative">
                                                <input
                                                    type={sub.showPassword ? "text" : "password"}
                                                    required
                                                    value={sub.password}
                                                    onChange={(e) => handleUpdateSubRecruiter(idx, 'password', e.target.value)}
                                                    className="w-full px-3.5 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:bg-white focus:border-teal-500 transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateSubRecruiter(idx, 'showPassword', !sub.showPassword)}
                                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                                >
                                                    {sub.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Role Presets */}
                                    <div className="pt-2 border-t border-gray-100">
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">Role & Access Level Preset</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                            {ROLE_PRESETS.map((p) => {
                                                const Icon = p.icon;
                                                const isSelected = sub.role_preset === p.id;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => handleUpdateSubRolePreset(idx, p.id)}
                                                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                                                            ? 'border-teal-500 bg-teal-50/70 ring-2 ring-teal-500/20'
                                                            : 'border-gray-200 bg-gray-50/60 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900">
                                                                <Icon className="w-3.5 h-3.5 text-teal-600" />
                                                                <span>{p.title}</span>
                                                            </div>
                                                            {isSelected && <Check className="w-3.5 h-3.5 text-teal-600" />}
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 line-clamp-2 mb-0">{p.desc}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Granular Permissions Toggle (Visible if Custom) */}
                                    {sub.role_preset === 'custom' && (
                                        <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 text-xs space-y-2">
                                            <span className="font-bold text-amber-950 block">Custom Permissions:</span>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {[
                                                    { key: 'can_post_jobs', label: 'Post & Manage Jobs' },
                                                    { key: 'can_view_resumes', label: 'View Candidate Resumes' },
                                                    { key: 'can_download_resumes', label: 'Download Resumes / CVs' },
                                                    { key: 'can_contact_candidates', label: 'Contact Candidates' },
                                                    { key: 'can_export_excel', label: 'Export Candidate Excel' },
                                                    { key: 'can_edit_company_profile', label: 'Edit Company Profile' }
                                                ].map(item => (
                                                    <label key={item.key} className="flex items-center gap-2 cursor-pointer select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(sub.permissions?.[item.key])}
                                                            onChange={() => handleToggleSubPermission(idx, item.key)}
                                                            className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500 border-gray-300"
                                                        />
                                                        <span className="text-gray-800 font-medium">{item.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* STEP 4: Review & Submit */}
            {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 rounded-2xl shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 uppercase tracking-wider">
                                    Final Review
                                </span>
                                <h2 className="text-xl font-bold mt-2 mb-1">Ready to Create Company & Recruiter Logins</h2>
                                <p className="text-xs sm:text-sm text-blue-100 mb-0">
                                    Please review company details, subscription parameters, and all login credentials before final creation.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Company & Subscription Summary Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-xs space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    <Building className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-0">{formData.company_name}</h3>
                                    <p className="text-xs text-gray-500 mb-0">{formData.industry} • {formData.company_type}</p>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-1 border-b border-gray-100">
                                    <span className="text-gray-500">Contact Email:</span>
                                    <span className="font-semibold text-gray-900">{formData.company_email}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-gray-100">
                                    <span className="text-gray-500">Contact Phone:</span>
                                    <span className="font-semibold text-gray-900">{formData.company_phone}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-gray-100">
                                    <span className="text-gray-500">Location:</span>
                                    <span className="font-semibold text-gray-900">{formData.city}, {formData.state}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-gray-100">
                                    <span className="text-gray-500">Subscription Plan:</span>
                                    <span className="font-bold text-blue-600">{selectedPlan?.name || 'Custom Plan'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-gray-100">
                                    <span className="text-gray-500">Billing Cycle:</span>
                                    <span className="font-semibold text-gray-900 uppercase">{formData.billing_cycle}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-gray-100">
                                    <span className="text-gray-500">Plan Validity:</span>
                                    <span className="font-semibold text-gray-900">{formData.start_date} to {formData.expiry_date}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-500">Total Company Capacity:</span>
                                    <span className="font-bold text-emerald-700">
                                        {Number(formData.master_login_limit || 1) * Number(formData.sub_recruiter_limit || 0)} Total Team Seats
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
                            >
                                Edit Company & Plan
                            </button>
                        </div>

                        {/* Master Recruiters Summary Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-xs space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 mb-0">Master Recruiters</h3>
                                        <p className="text-xs text-gray-500 mb-0">{1 + additionalMasters.length} of {formData.master_login_limit} Configured</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                                >
                                    Edit
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="p-3 bg-purple-50/50 rounded-xl border-1 border-purple-100 text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-purple-950">{formData.recruiter_name}</span>
                                        <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-semibold">Primary</span>
                                    </div>
                                    <div className="text-gray-600 truncate">{formData.email}</div>
                                    <div className="flex justify-between text-gray-500 pt-1 border-t border-purple-100">
                                        <span>Seats: {formData.sub_recruiter_limit || 0}</span>
                                        <span className="font-mono text-purple-900">Pass: ••••••••</span>
                                    </div>
                                </div>

                                {additionalMasters.map((m, i) => (
                                    <div key={m.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-gray-900">{m.name}</span>
                                            <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-semibold">Master #{i + 2}</span>
                                        </div>
                                        <div className="text-gray-600 truncate">{m.email}</div>
                                        <div className="flex justify-between text-gray-500 pt-1 border-t border-gray-200">
                                            <span>Seats: {m.allocated_seats || formData.sub_recruiter_limit}</span>
                                            <span className="font-mono text-gray-700">Pass: ••••••••</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sub-Recruiters Summary Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-xs space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 mb-0">Sub-Recruiters</h3>
                                        <p className="text-xs text-gray-500 mb-0">{subRecruiters.length} Team Members</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(3)}
                                    className="text-xs font-semibold text-teal-600 hover:text-teal-800 cursor-pointer"
                                >
                                    Edit
                                </button>
                            </div>

                            {subRecruiters.length === 0 ? (
                                <div className="py-6 text-center text-xs text-gray-400">
                                    No sub-recruiter team seats added in this batch. (Can be added later).
                                </div>
                            ) : (
                                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                    {subRecruiters.map((s) => (
                                        <div key={s.id} className="p-2.5 bg-teal-50/40 rounded-xl border border-teal-100 text-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-teal-950 truncate">{s.name}</span>
                                                <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-semibold uppercase">
                                                    {s.role_preset}
                                                </span>
                                            </div>
                                            <div className="text-gray-500 truncate">{s.email}</div>
                                            <div className="text-[11px] text-teal-700 mt-1">
                                                Under: {s.master_index === 0 ? (formData.recruiter_name || 'Primary Master') : (additionalMasters[s.master_index - 1]?.name || 'Master')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Navigation & Action Bar */}
            <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:px-6 border border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 font-bold">
                        {currentStep}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-900">
                                {formData.company_name.trim() ? formData.company_name : 'New Recruiter Setup'}
                            </span>
                            {selectedPlan && (
                                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    {selectedPlan.name}
                                </span>
                            )}
                            <span className="text-[11px] font-medium text-gray-500">
                                • {formData.master_login_limit} Master Logins / {formData.sub_recruiter_limit} Seats per Master
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 mb-0">
                            Step {currentStep} of 4: {STEPS[currentStep - 1].desc}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={handlePrevStep}
                            disabled={submitting}
                            className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                        >
                            Back
                        </button>
                    )}

                    {currentStep < 4 ? (
                        <button
                            type="button"
                            onClick={handleNextStep}
                            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                            <span>Continue to {STEPS[currentStep].title}</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => handleSubmit(true)}
                                disabled={submitting}
                                className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                            >
                                Save as Inactive
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSubmit(false)}
                                disabled={submitting}
                                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Creating Accounts...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                        <span>Confirm & Create Company & Logins</span>
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Success Credential Modal */}
            {createdModalData && (
                <div className="fixed inset-0 mt-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center shrink-0">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                                <Check className="w-6 h-6 text-white stroke-[3]" />
                            </div>
                            <h3 className="text-xl font-bold mb-0">Company & Recruiter Logins Created!</h3>
                            <p className="text-xs sm:text-sm text-emerald-100 mt-1 mb-0">
                                {createdModalData.company_name} is successfully onboarded with {createdModalData.created_masters?.length || 1} Master and {createdModalData.created_sub_recruiters?.length || 0} Sub-Recruiter account(s).
                            </p>
                        </div>

                        {/* Credentials Body (Scrollable) */}
                        <div className="p-6 space-y-5 overflow-y-auto">
                            {/* Summary Banner */}
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-gray-500">Plan:</span>{' '}
                                    <span className="font-bold text-gray-900">{createdModalData.plan_name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Valid Until:</span>{' '}
                                    <span className="font-semibold text-gray-900">{createdModalData.expiry_date}</span>
                                </div>
                            </div>

                            {/* Master Recruiter Credentials */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                                    <User className="w-4 h-4" />
                                    <span>Master Recruiter Logins ({createdModalData.created_masters?.length || 1})</span>
                                </h4>
                                <div className="space-y-2">
                                    {createdModalData.created_masters?.map((m, i) => (
                                        <div key={i} className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200 text-xs font-mono space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-purple-950 font-sans">{m.name} ({m.designation || 'Master Recruiter'})</span>
                                                <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded font-sans font-bold">
                                                    {m.is_primary ? 'PRIMARY MASTER' : 'MASTER'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-gray-700">
                                                <span>Email: <strong className="text-blue-600">{m.email}</strong></span>
                                                <span>Pass: <strong className="text-emerald-700 bg-white px-2 py-0.5 rounded border border-purple-200">{m.password}</strong></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sub-Recruiter Credentials (if any) */}
                            {createdModalData.created_sub_recruiters && createdModalData.created_sub_recruiters.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                                        <Users className="w-4 h-4" />
                                        <span>Sub-Recruiter Team Logins ({createdModalData.created_sub_recruiters.length})</span>
                                    </h4>
                                    <div className="space-y-2">
                                        {createdModalData.created_sub_recruiters.map((s, i) => (
                                            <div key={i} className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200 text-xs font-mono space-y-1.5">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-teal-950 font-sans">{s.name} ({s.designation || 'Recruiter'})</span>
                                                    <span className="text-[10px] bg-teal-200 text-teal-800 px-2 py-0.5 rounded font-sans font-bold uppercase">
                                                        {s.role_preset}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-gray-700">
                                                    <span>Email: <strong className="text-blue-600">{s.email}</strong></span>
                                                    <span>Pass: <strong className="text-emerald-700 bg-white px-2 py-0.5 rounded border border-teal-200">{s.password}</strong></span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Copy All Button */}
                            <button
                                type="button"
                                onClick={copyAllCredentialsToClipboard}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors cursor-pointer"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                <span>{copied ? 'All Credentials Copied to Clipboard!' : 'Copy All Login Credentials to Clipboard'}</span>
                            </button>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => router.push(`/admin/recruiters/${createdModalData.recruiter_id}`)}
                                className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors text-center cursor-pointer"
                            >
                                View Company Profile
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push('/admin/recruiters')}
                                className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors text-center cursor-pointer"
                            >
                                All Recruiters & Companies
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
