'use client';

import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import '../css/recruiter-pricing.css';
import { getPublicPricingPlans, getBillingPlans } from '../ApiService/action';
import { message } from 'antd';
import {
  Package,
  BarChart2,
  Rocket,
  Gem,
  Users,
  FileText,
  Building2,
  Zap,
  Shield,
  Headphones,
  Check,
  Minus,
  Plus,
  X,
  Sparkles,
  Sliders,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function RecruiterPricing() {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(0); // First item open by default
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Custom Plan interactive state
  const [customHiringVolume, setCustomHiringVolume] = useState('25-50 hires/month');
  const [selectedModules, setSelectedModules] = useState([
    'postings',
    'resumes',
    'ats',
    'manager',
  ]);

  const [quoteFormData, setQuoteFormData] = useState({
    fullName: '',
    companyName: '',
    workEmail: '',
    phone: '',
    hiringVolume: '25-50 hires/month',
    notes: '',
  });

  const hrPortalUrl =
    process.env.NEXT_PUBLIC_HR_PORTAL_URL ||
    (typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3001'
      : 'http://recruit.careerfast.in');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      let rawData = [];
      try {
        const res = await getPublicPricingPlans();
        if (res?.data?.success && Array.isArray(res.data.data)) {
          rawData = res.data.data;
        }
      } catch (err) {
        console.warn('Fallback to getBillingPlans:', err?.message);
        const res2 = await getBillingPlans();
        const data2 = res2?.data?.data || res2?.data?.plans || res2?.data;
        if (Array.isArray(data2)) {
          rawData = data2;
        }
      }

      // Filter active plans
      const activePlans = rawData.filter(
        (p) => p.status === 'active' || p.status === 1 || p.status === '1'
      );

      if (activePlans.length > 0) {
        setPlans(processPlans(activePlans));
      } else {
        setPlans(getDefaultMockPlans());
      }
    } catch (error) {
      console.error('Error fetching recruiter plans:', error);
      setPlans(getDefaultMockPlans());
    } finally {
      setLoading(false);
    }
  };

  const processPlans = (dbPlans) => {
    return dbPlans.map((plan, index) => {
      const priceNum = Number(plan.price) || 0;
      const isFree = priceNum === 0 || plan.slug === 'free';
      const monthlyPrice = priceNum;
      const annualPrice = isFree ? 0 : Math.round(priceNum * 0.8); // 20% discount on annual

      const jobPosts = plan.active_job_limit || plan.job_post_limit || (isFree ? 20 : 50);
      const resumeAccess = plan.resume_view_limit
        ? Number(plan.resume_view_limit).toLocaleString('en-IN')
        : (isFree ? '50' : '5,000');

      // Dynamic Feature Checklist based on DB properties
      const features = [];
      features.push(`Post up to ${jobPosts} active jobs`);
      features.push(`Access ${resumeAccess} verified resumes`);
      if (plan.featured_job_limit > 0) {
        features.push(`${plan.featured_job_limit} Featured Job postings`);
      }
      if (plan.urgent_job_limit > 0) {
        features.push(`${plan.urgent_job_limit} Urgent Hiring badges`);
      }
      if (plan.resume_download_limit > 0) {
        features.push(`${plan.resume_download_limit} direct resume downloads`);
      }
      if (plan.candidate_search) {
        features.push('Advanced candidate search filters');
      } else {
        features.push('Standard candidate search');
      }
      if (plan.interview_management) {
        features.push('Application management & tracking');
      }
      if (plan.email_limit > 0) {
        features.push(`${plan.email_limit} candidate email notifications`);
      }
      if (plan.whatsapp_limit > 0) {
        features.push(`${plan.whatsapp_limit} candidate WhatsApp notifications`);
      }
      if (plan.excel_download_limit > 0) {
        features.push(`${plan.excel_download_limit} candidate data exports (Excel)`);
      }
      if (plan.sub_recruiter_limit > 1) {
        features.push(`Team collaboration (${plan.sub_recruiter_limit} recruiters)`);
      } else {
        features.push('1 Master Recruiter account');
      }
      features.push(isFree ? 'Email support' : 'Priority recruiter support');

      const icons = [
        <Package key="pkg" size={22} />,
        <BarChart2 key="chart" size={22} />,
        <Rocket key="rkt" size={22} />,
        <Zap key="zap" size={22} />,
      ];

      return {
        id: plan.id,
        slug: plan.slug,
        name: plan.name,
        tagline:
          plan.description ||
          (isFree
            ? 'Get started with essential hiring tools at zero cost.'
            : 'For professional recruiters and rapidly scaling hiring teams.'),
        monthlyPrice,
        annualPrice,
        description: isFree ? 'Perfect for individual recruiters to explore CareerFast.' : null,
        isPopular: !isFree && (plan.is_popular || plan.slug === 'job-posting' || index === 1),
        icon: icons[index % icons.length],
        quotas: {
          jobPosts,
          resumeAccess,
        },
        features,
        ctaText: isFree ? 'Get Started Free' : `Choose ${plan.name}`,
        ctaStyle: isFree ? 'outline' : 'solid',
        targetUrl: isFree
          ? `${hrPortalUrl}/register?plan=${plan.slug}`
          : `${hrPortalUrl}/login?redirect=subscription&plan=${plan.slug}`,
        rawPlan: plan,
      };
    });
  };

  const getDefaultMockPlans = () => [
    {
      id: 'free-plan',
      slug: 'free',
      name: 'Free Plan',
      tagline: 'Get started with essential hiring tools at zero cost.',
      monthlyPrice: 0,
      annualPrice: 0,
      description: 'Perfect for individual recruiters to explore CareerFast.',
      icon: <Package size={22} />,
      quotas: { jobPosts: 20, resumeAccess: 50 },
      features: [
        'Post up to 20 jobs',
        'Access 50 resumes',
        'Basic candidate search',
        'Application management & shortlisting',
        'Email notifications',
        'Email support',
        'Standard access to platform',
      ],
      ctaText: 'Get Started Free',
      ctaStyle: 'outline',
      targetUrl: `${hrPortalUrl}/register?plan=free`,
    },
    {
      id: 'job-posting-pro',
      slug: 'job-posting',
      name: 'Job Posting Pro',
      tagline: 'For professional recruiters and growing teams.',
      monthlyPrice: 5000,
      annualPrice: 4000,
      isPopular: true,
      icon: <BarChart2 size={22} />,
      quotas: { jobPosts: 50, resumeAccess: '5,000' },
      features: [
        'Post up to 50 jobs',
        'Access 5,000 resumes',
        '10 Featured Job postings',
        '10 Urgent Hiring tags',
        '50 Candidate email alerts',
        '50 Candidate WhatsApp alerts',
        'Team collaboration (up to 5 users)',
        'Priority support',
      ],
      ctaText: 'Choose Job Posting Pro',
      ctaStyle: 'solid',
      targetUrl: `${hrPortalUrl}/login?redirect=subscription&plan=job-posting`,
    },
  ];

  const handleAction = (plan) => {
    if (!plan.targetUrl) {
      openCustomQuoteModal();
      return;
    }
    const billingParam = billingCycle === 'annual' ? '&billing=annual' : '&billing=monthly';
    const finalUrl = plan.targetUrl.includes('?')
      ? `${plan.targetUrl}${billingParam}`
      : `${plan.targetUrl}?billing=${billingCycle}`;
    window.location.href = finalUrl;
  };

  const toggleModule = (moduleId) => {
    if (selectedModules.includes(moduleId)) {
      if (selectedModules.length === 1) {
        message.info('Select at least one module for your custom plan.');
        return;
      }
      setSelectedModules(selectedModules.filter((m) => m !== moduleId));
    } else {
      setSelectedModules([...selectedModules, moduleId]);
    }
  };

  const openCustomQuoteModal = (hiringVol = customHiringVolume) => {
    const modulesLabels = {
      postings: 'High-Volume Job Postings (100 - 1,000+)',
      resumes: 'Full Talent Pool Database Access',
      ats: 'Custom ATS & HRMS API Sync',
      seats: 'Multi-Recruiter Seats & Team Permissions',
      branding: 'Custom Employer Branding & Sponsored Hiring',
      manager: 'Dedicated Account Director & Priority SLA',
    };

    const chosenModulesText = selectedModules.map((id) => modulesLabels[id] || id).join(', ');

    setQuoteFormData((prev) => ({
      ...prev,
      hiringVolume: hiringVol,
      notes: `Configured Modules: ${chosenModulesText}`,
    }));
    setIsQuoteModalOpen(true);
  };

  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    if (!quoteFormData.fullName || !quoteFormData.workEmail || !quoteFormData.phone) {
      message.error('Please complete all required fields.');
      return;
    }

    setSubmittingQuote(true);
    setTimeout(() => {
      setSubmittingQuote(false);
      setIsQuoteModalOpen(false);
      message.success(
        'Thank you! Your customized recruitment requirement has been received. Our Enterprise Account Director will reach out to you within 2 hours.'
      );
      setQuoteFormData({
        fullName: '',
        companyName: '',
        workEmail: '',
        phone: '',
        hiringVolume: customHiringVolume,
        notes: '',
      });
    }, 900);
  };

  const customModulesConfig = [
    {
      id: 'postings',
      title: 'High-Volume Job Postings',
      desc: '100 - 1,000+ active job posts with custom expiration and renewal rules.',
      icon: <Layers size={18} />,
    },
    {
      id: 'resumes',
      title: 'Unlimited Talent Database',
      desc: 'Unrestricted candidate search, direct contacts, skills & resume downloads.',
      icon: <FileText size={18} />,
    },
    {
      id: 'ats',
      title: 'ATS & HRMS API Sync',
      desc: 'Native webhooks and API sync for Greenhouse, Workday, Lever & SAP.',
      icon: <Zap size={18} />,
    },
    {
      id: 'seats',
      title: 'Multi-Recruiter Team Seats',
      desc: 'Configurable sub-recruiter logins, activity audit logs and seat controls.',
      icon: <Users size={18} />,
    },
    {
      id: 'branding',
      title: 'Employer Branding Suite',
      desc: 'Featured company profile, verified badge, and dedicated hiring campaigns.',
      icon: <Building2 size={18} />,
    },
    {
      id: 'manager',
      title: 'Dedicated Account Director',
      desc: '1-on-1 account manager, personalized onboarding and 2-hour priority SLA.',
      icon: <Headphones size={18} />,
    },
  ];

  const faqs = [
    {
      q: 'Can I change or upgrade my plan later?',
      a: 'Yes, you can upgrade your plan at any time. When you upgrade, your new limits apply instantly. If you downgrade, changes take effect from your next billing cycle.',
    },
    {
      q: 'How does the Customize Plan work?',
      a: 'Our Customize Plan allows you to tailor job posting volumes, candidate resume database access, API connectors, and multi-user seats. Simply select your requirements and our Enterprise team will prepare a custom proposal within 2 hours.',
    },
    {
      q: 'How does resume database access work?',
      a: 'Resume access lets you view verified candidate resumes, full contact details (phone, email), work history, portfolio links, and skill verifications from our talent pool.',
    },
    {
      q: 'Can we integrate CareerFast with our company ATS?',
      a: 'Yes, with our Enterprise & Customized Plans, we provide full REST APIs and webhooks for integration with major ATS solutions including Workday, Greenhouse, Lever, and SAP SuccessFactors.',
    },
    {
      q: 'What payment methods do you support?',
      a: 'We accept all major Credit/Debit Cards, UPI, Net Banking, and corporate invoicing (NEFT/RTGS) for customized enterprise packages.',
    },
    {
      q: 'How can I contact the enterprise recruiter sales team?',
      a: 'You can reach our dedicated recruiter support desk 24/7 via email at careerfastcontact@gmail.com, or phone/WhatsApp at +91 81227 38034.',
    },
  ];

  return (
    <div className="rp-page-wrapper">
      <Header />

      <main className="rp-main-container">
        {/* ================= HERO SECTION ================= */}
        <section className="rp-hero-section">
          {/* Eyebrow Pill */}
          <div className="rp-eyebrow-pill">
            <Sparkles size={14} style={{ color: 'var(--rp-theme)' }} />
            RECRUITER &amp; EMPLOYER PRICING
          </div>

          {/* Heading */}
          <h1 className="rp-hero-heading">
            Hire Faster With Precision, <br />
            Scale Your Team With <span className="rp-theme-word">Confidence</span>
          </h1>

          {/* Subtitle */}
          <p className="rp-hero-subtitle">
            Choose the right plan to access top talent, streamline your hiring process
            and grow your business with CareerFast.
          </p>

          {/* Stats Bar */}
          <div className="rp-stats-row">
            <div className="rp-stat-item">
              <div className="rp-stat-icon-wrap">
                <Users size={20} />
              </div>
              <div>
                <div className="rp-stat-number">10,000+</div>
                <div className="rp-stat-label">Recruiters Hire with Us</div>
              </div>
            </div>

            <div className="rp-stat-item">
              <div className="rp-stat-icon-wrap">
                <FileText size={20} />
              </div>
              <div>
                <div className="rp-stat-number">5M+</div>
                <div className="rp-stat-label">Verified Resumes</div>
              </div>
            </div>

            <div className="rp-stat-item">
              <div className="rp-stat-icon-wrap">
                <Building2 size={20} />
              </div>
              <div>
                <div className="rp-stat-number">1,000+</div>
                <div className="rp-stat-label">Companies Trust CareerFast</div>
              </div>
            </div>
          </div>

          {/* Billing Switcher */}
          <div className="rp-toggle-wrapper">
            <div className="rp-toggle-pill-box">
              <button
                type="button"
                className={`rp-toggle-choice-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`rp-toggle-choice-btn ${billingCycle === 'annual' ? 'active' : ''}`}
                onClick={() => setBillingCycle('annual')}
              >
                Annual
              </button>
            </div>
            <span className="rp-save-badge">Save up to 20%</span>
          </div>
        </section>

        {/* ================= DYNAMIC PRICING CARDS ================= */}
        {loading ? (
          <div className="rp-cards-loading-wrap">
            <div className="rp-skeleton-card"></div>
            <div className="rp-skeleton-card"></div>
          </div>
        ) : (
          <section className="rp-cards-grid" id="pricing-plans">
            {plans.map((plan) => {
              const displayPrice =
                plan.monthlyPrice === null
                  ? null
                  : billingCycle === 'annual'
                    ? plan.annualPrice
                    : plan.monthlyPrice;

              return (
                <div
                  key={plan.id}
                  className={`rp-price-card ${plan.isPopular ? 'popular' : ''}`}
                >
                  {/* Floating "MOST POPULAR" Badge */}
                  {plan.isPopular && (
                    <div className="rp-popular-top-badge">MOST POPULAR</div>
                  )}

                  <div>
                    {/* Card Icon */}
                    <div className="rp-card-icon-box">{plan.icon}</div>

                    {/* Title & Tagline */}
                    <h3 className="rp-card-title">{plan.name}</h3>
                    <p className="rp-card-tagline">{plan.tagline}</p>

                    {/* Price */}
                    <div className="rp-card-price-block">
                      <span className="rp-card-price-value">
                        ₹{displayPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="rp-card-price-period">/month</span>
                    </div>

                    {/* Description / Subtext */}
                    {plan.description && (
                      <p className="rp-card-price-desc">{plan.description}</p>
                    )}

                    {/* Two Quota Stats Boxes */}
                    {plan.quotas && (
                      <div className="rp-quota-boxes-row">
                        <div className="rp-quota-mini-box">
                          <div className="rp-quota-val">{plan.quotas.jobPosts}</div>
                          <div className="rp-quota-lbl">Job Posts per month</div>
                        </div>
                        <div className="rp-quota-mini-box">
                          <div className="rp-quota-val">{plan.quotas.resumeAccess}</div>
                          <div className="rp-quota-lbl">Resume Access per month</div>
                        </div>
                      </div>
                    )}

                    {/* Feature Checklist */}
                    <ul className="rp-card-feature-list">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="rp-feature-row">
                          <Check className="rp-feature-check-icon" size={16} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bottom CTA Button */}
                  <button
                    type="button"
                    onClick={() => handleAction(plan)}
                    className={`rp-plan-btn ${
                      plan.ctaStyle === 'solid'
                        ? 'btn-solid-theme'
                        : 'btn-outline-theme'
                    }`}
                  >
                    {plan.ctaText}
                  </button>
                </div>
              );
            })}
          </section>
        )}

        {/* ================= SEPARATE CUSTOMIZE PLAN SECTION ================= */}
        <section className="rp-custom-plan-section" id="customize-plan">
          <div className="rp-custom-plan-header">
            <div className="rp-custom-badge">
              <Gem size={15} />
              ENTERPRISE &amp; BESPOKE SOLUTIONS
            </div>
            <h2 className="rp-custom-title">
              Need a Custom Plan? <span className="rp-theme-word">Customize It Your Way</span>
            </h2>
            <p className="rp-custom-subtitle">
              Scale your hiring with tailored job volume credits, direct resume access, ATS
              integrations, and dedicated account management designed for high-growth enterprises.
            </p>
          </div>

          <div className="rp-custom-builder-grid">
            {/* Left: Customizer Controls */}
            <div className="rp-custom-controls-box">
              {/* Step 1: Hiring Volume */}
              <div className="rp-custom-step">
                <div className="rp-step-label">
                  <span className="rp-step-num">1</span>
                  Select Estimated Monthly Hiring Volume
                </div>
                <div className="rp-volume-chips">
                  {[
                    '5-15 hires/month',
                    '15-30 hires/month',
                    '30-60 hires/month',
                    '60+ hires/month (Enterprise)',
                  ].map((vol) => (
                    <button
                      key={vol}
                      type="button"
                      className={`rp-volume-chip ${customHiringVolume === vol ? 'active' : ''}`}
                      onClick={() => setCustomHiringVolume(vol)}
                    >
                      {customHiringVolume === vol && <Check size={14} />}
                      {vol}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Interactive Module Checkboxes */}
              <div className="rp-custom-step">
                <div className="rp-step-label">
                  <span className="rp-step-num">2</span>
                  Select Required Enterprise Modules
                </div>
                <div className="rp-modules-grid">
                  {customModulesConfig.map((mod) => {
                    const isChecked = selectedModules.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        className={`rp-module-card ${isChecked ? 'selected' : ''}`}
                        onClick={() => toggleModule(mod.id)}
                      >
                        <div className="rp-module-header">
                          <div className="rp-module-icon">{mod.icon}</div>
                          <div className={`rp-module-check ${isChecked ? 'checked' : ''}`}>
                            {isChecked && <Check size={13} />}
                          </div>
                        </div>
                        <h4 className="rp-module-title">{mod.title}</h4>
                        <p className="rp-module-desc">{mod.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Custom Package Preview Card */}
            <div className="rp-custom-preview-card">
              <div className="rp-preview-top-badge">
                <Sparkles size={14} /> TAILORED ENTERPRISE PACKAGE
              </div>

              <div className="rp-preview-header">
                <h3 className="rp-preview-title">Customized Plan</h3>
                <p className="rp-preview-sub">
                  Volume: <strong>{customHiringVolume}</strong>
                </p>
              </div>

              <div className="rp-preview-price-box">
                <div className="rp-preview-price-label">Estimated Investment</div>
                <div className="rp-preview-price-val">Custom Quote</div>
                <div className="rp-preview-price-note">
                  Billed monthly or annually with enterprise invoice support
                </div>
              </div>

              <div className="rp-preview-included-list">
                <div className="rp-included-title">What&apos;s Included in Your Package:</div>
                <ul className="rp-included-items">
                  {selectedModules.map((id) => {
                    const item = customModulesConfig.find((m) => m.id === id);
                    return (
                      <li key={id} className="rp-included-row">
                        <CheckCircle2 size={16} className="rp-included-check" />
                        <span>{item?.title}</span>
                      </li>
                    );
                  })}
                  <li className="rp-included-row">
                    <CheckCircle2 size={16} className="rp-included-check" />
                    <span>Executive SLA &amp; 99.9% Uptime Guarantee</span>
                  </li>
                  <li className="rp-included-row">
                    <CheckCircle2 size={16} className="rp-included-check" />
                    <span>Quarterly Strategy &amp; Talent Pipeline Review</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => openCustomQuoteModal()}
                className="rp-custom-cta-btn"
              >
                <span>Request Customized Quote</span>
                <ArrowRight size={18} />
              </button>

              <div className="rp-custom-direct-contact">
                <PhoneCall size={15} />
                <span>
                  Or speak directly with Enterprise Director:{' '}
                  <a href="tel:+918122738034" className="rp-phone-link">
                    +91 81227 38034
                  </a>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= WHY CHOOSE CAREERFAST BENTO ================= */}
        <section className="rp-bento-section">
          <div className="rp-section-intro">
            <div className="rp-eyebrow-pill">WHY CHOOSE CAREERFAST</div>
            <h2 className="rp-section-title">Everything You Need to Hire Smarter</h2>
            <p className="rp-section-desc">
              Powerful tools, reliable data and dedicated support to help you find the right
              talent, faster.
            </p>
          </div>

          <div className="rp-bento-grid-4">
            <div className="rp-bento-tile">
              <div className="rp-bento-icon-box">
                <Zap size={22} />
              </div>
              <h3 className="rp-bento-title">Access to Top Talent</h3>
              <p className="rp-bento-description">
                Millions of verified resumes across industries and skills.
              </p>
            </div>

            <div className="rp-bento-tile">
              <div className="rp-bento-icon-box">
                <Shield size={22} />
              </div>
              <h3 className="rp-bento-title">Faster Hiring</h3>
              <p className="rp-bento-description">
                Advanced search and AI matching to save time.
              </p>
            </div>

            <div className="rp-bento-tile">
              <div className="rp-bento-icon-box">
                <Users size={22} />
              </div>
              <h3 className="rp-bento-title">Built for Recruiters</h3>
              <p className="rp-bento-description">
                Tools designed to streamline your entire hiring workflow.
              </p>
            </div>

            <div className="rp-bento-tile">
              <div className="rp-bento-icon-box">
                <Headphones size={22} />
              </div>
              <h3 className="rp-bento-title">Dedicated Support</h3>
              <p className="rp-bento-description">
                Get help whenever you need it from our expert team.
              </p>
            </div>
          </div>
        </section>

        {/* ================= PLAN COMPARISON MATRIX ================= */}
        <section className="rp-matrix-section">
          <div className="rp-section-intro">
            <div className="rp-eyebrow-pill">PLAN COMPARISON</div>
            <h2 className="rp-section-title">Compare All Plans &amp; Features</h2>
            <p className="rp-section-desc">
              Find the perfect plan that fits your hiring needs.
            </p>
          </div>

          <div className="rp-table-frame">
            <div className="rp-table-scroll">
              <table className="rp-matrix-table">
                <thead>
                  <tr>
                    <th className="col-feature-name">Features</th>
                    {plans.map((p) => (
                      <th
                        key={p.id}
                        className={`col-plan-head ${p.isPopular ? 'col-popular-highlight' : ''}`}
                      >
                        {p.name}
                      </th>
                    ))}
                    <th className="col-plan-head col-enterprise-highlight">
                      Customize Plan (Enterprise)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="cell-feature-name">Monthly Price</td>
                    {plans.map((p) => (
                      <td
                        key={p.id}
                        className={`cell-plan-data ${p.isPopular ? 'popular-col-tint' : ''}`}
                      >
                        {p.monthlyPrice === 0
                          ? '₹0'
                          : `₹${p.monthlyPrice.toLocaleString('en-IN')}`}
                      </td>
                    ))}
                    <td className="cell-plan-data enterprise-col-tint">Custom Quote</td>
                  </tr>

                  <tr>
                    <td className="cell-feature-name">Job Posts per Month</td>
                    {plans.map((p) => (
                      <td
                        key={p.id}
                        className={`cell-plan-data ${p.isPopular ? 'popular-col-tint' : ''}`}
                      >
                        {p.quotas?.jobPosts || 20}
                      </td>
                    ))}
                    <td className="cell-plan-data enterprise-col-tint">Unlimited / Custom</td>
                  </tr>

                  <tr>
                    <td className="cell-feature-name">Resume Access per Month</td>
                    {plans.map((p) => (
                      <td
                        key={p.id}
                        className={`cell-plan-data ${p.isPopular ? 'popular-col-tint' : ''}`}
                      >
                        {p.quotas?.resumeAccess || 50}
                      </td>
                    ))}
                    <td className="cell-plan-data enterprise-col-tint">Unlimited / Custom</td>
                  </tr>

                  <tr>
                    <td className="cell-feature-name">Advanced Candidate Search</td>
                    {plans.map((p) => (
                      <td
                        key={p.id}
                        className={`cell-plan-data ${p.isPopular ? 'popular-col-tint' : ''}`}
                      >
                        {p.rawPlan?.candidate_search || p.monthlyPrice > 0 ? (
                          <Check className="rp-icon-check" size={18} />
                        ) : (
                          <span className="rp-icon-dash">-</span>
                        )}
                      </td>
                    ))}
                    <td className="cell-plan-data enterprise-col-tint">
                      <Check className="rp-icon-check" size={18} />
                    </td>
                  </tr>

                  <tr>
                    <td className="cell-feature-name">Candidate Direct Contact (Phone/Email)</td>
                    {plans.map((p) => (
                      <td
                        key={p.id}
                        className={`cell-plan-data ${p.isPopular ? 'popular-col-tint' : ''}`}
                      >
                        {p.monthlyPrice > 0 ? (
                          <Check className="rp-icon-check" size={18} />
                        ) : (
                          <span className="rp-icon-dash">-</span>
                        )}
                      </td>
                    ))}
                    <td className="cell-plan-data enterprise-col-tint">
                      <Check className="rp-icon-check" size={18} />
                    </td>
                  </tr>

                  <tr>
                    <td className="cell-feature-name">Application &amp; Interview Tracking</td>
                    {plans.map((p) => (
                      <td
                        key={p.id}
                        className={`cell-plan-data ${p.isPopular ? 'popular-col-tint' : ''}`}
                      >
                        <Check className="rp-icon-check" size={18} />
                      </td>
                    ))}
                    <td className="cell-plan-data enterprise-col-tint">
                      <Check className="rp-icon-check" size={18} />
                    </td>
                  </tr>

                  <tr>
                    <td className="cell-feature-name">Team Collaboration</td>
                    {plans.map((p) => (
                      <td
                        key={p.id}
                        className={`cell-plan-data ${p.isPopular ? 'popular-col-tint' : ''}`}
                      >
                        {p.rawPlan?.sub_recruiter_limit > 1
                          ? `Up to ${p.rawPlan.sub_recruiter_limit} recruiters`
                          : p.monthlyPrice > 0
                            ? 'Up to 5 recruiters'
                            : '1 Recruiter Account'}
                      </td>
                    ))}
                    <td className="cell-plan-data enterprise-col-tint">Unlimited / Custom Seats</td>
                  </tr>

                  <tr>
                    <td className="cell-feature-name">Applicant Data Export (Excel)</td>
                    {plans.map((p) => (
                      <td
                        key={p.id}
                        className={`cell-plan-data ${p.isPopular ? 'popular-col-tint' : ''}`}
                      >
                        {p.rawPlan?.excel_download_limit > 0 || p.monthlyPrice > 0 ? (
                          <Check className="rp-icon-check" size={18} />
                        ) : (
                          <span className="rp-icon-dash">-</span>
                        )}
                      </td>
                    ))}
                    <td className="cell-plan-data enterprise-col-tint">
                      <Check className="rp-icon-check" size={18} />
                    </td>
                  </tr>

                  <tr>
                    <td className="cell-feature-name">Custom ATS &amp; HRMS API</td>
                    {plans.map((p) => (
                      <td
                        key={p.id}
                        className={`cell-plan-data ${p.isPopular ? 'popular-col-tint' : ''}`}
                      >
                        <span className="rp-icon-dash">-</span>
                      </td>
                    ))}
                    <td className="cell-plan-data enterprise-col-tint">
                      <Check className="rp-icon-check" size={18} />
                    </td>
                  </tr>

                  <tr>
                    <td className="cell-feature-name">Support Level</td>
                    {plans.map((p) => (
                      <td
                        key={p.id}
                        className={`cell-plan-data ${p.isPopular ? 'popular-col-tint' : ''}`}
                      >
                        {p.monthlyPrice === 0 ? 'Email Support' : 'Priority Support'}
                      </td>
                    ))}
                    <td className="cell-plan-data enterprise-col-tint">
                      Dedicated Account Manager &amp; SLA
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ================= FREQUENTLY ASKED QUESTIONS ================= */}
        <section className="rp-faq-section">
          <div className="rp-section-intro">
            <div className="rp-eyebrow-pill">FREQUENTLY ASKED QUESTIONS</div>
            <h2 className="rp-section-title">Frequently Asked Questions</h2>
            <p className="rp-section-desc">
              Find answers to common questions about our recruiter plans and custom solutions.
            </p>
          </div>

          <div className="rp-faq-list">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className={`rp-faq-card ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="rp-faq-btn-trigger"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <span className="rp-faq-q-text">{faq.q}</span>
                    <span className="rp-faq-symbol">
                      {isOpen ? <Minus size={20} /> : <Plus size={20} />}
                    </span>
                  </button>
                  {isOpen && <div className="rp-faq-content">{faq.a}</div>}
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= BOTTOM CTA BANNER ================= */}
        <section className="rp-footer-banner">
          <h2 className="rp-banner-heading">Ready to Transform Your Hiring Strategy?</h2>
          <p className="rp-banner-sub">
            Join thousands of recruiters and companies who hire smarter with CareerFast.
          </p>
          <div className="rp-banner-buttons">
            <a href={`${hrPortalUrl}/register`} className="rp-btn-banner-primary">
              Get Started Free
            </a>
            <button
              type="button"
              onClick={() => openCustomQuoteModal()}
              className="rp-btn-banner-outline"
            >
              Request Custom Enterprise Plan
            </button>
          </div>
        </section>
      </main>

      {/* ================= ENTERPRISE CUSTOM QUOTE MODAL ================= */}
      {isQuoteModalOpen && (
        <div className="rp-modal-backdrop" onClick={() => setIsQuoteModalOpen(false)}>
          <div className="rp-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="rp-modal-top">
              <div>
                <h3 className="rp-modal-headline">Request Customized Recruiter Plan</h3>
                <p className="rp-modal-subtext">
                  Tailored high-volume quotas, ATS integrations, and dedicated hiring support.
                </p>
              </div>
              <button
                type="button"
                className="rp-modal-close-icon"
                onClick={() => setIsQuoteModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="rp-modal-fields">
              <form onSubmit={handleQuoteSubmit}>
                <div className="rp-field-block">
                  <label className="rp-field-label">
                    Full Name <span style={{ color: '#ff0000' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="rp-field-control"
                    value={quoteFormData.fullName}
                    onChange={(e) =>
                      setQuoteFormData({ ...quoteFormData, fullName: e.target.value })
                    }
                  />
                </div>

                <div className="rp-field-block">
                  <label className="rp-field-label">
                    Work Email <span style={{ color: '#ff0000' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@company.com"
                    className="rp-field-control"
                    value={quoteFormData.workEmail}
                    onChange={(e) =>
                      setQuoteFormData({ ...quoteFormData, workEmail: e.target.value })
                    }
                  />
                </div>

                <div className="rp-field-block">
                  <label className="rp-field-label">
                    Phone Number <span style={{ color: '#ff0000' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    className="rp-field-control"
                    value={quoteFormData.phone}
                    onChange={(e) =>
                      setQuoteFormData({ ...quoteFormData, phone: e.target.value })
                    }
                  />
                </div>

                <div className="rp-field-block">
                  <label className="rp-field-label">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Technologies Pvt Ltd"
                    className="rp-field-control"
                    value={quoteFormData.companyName}
                    onChange={(e) =>
                      setQuoteFormData({ ...quoteFormData, companyName: e.target.value })
                    }
                  />
                </div>

                <div className="rp-field-block">
                  <label className="rp-field-label">Monthly Hiring Volume</label>
                  <select
                    className="rp-field-control"
                    value={quoteFormData.hiringVolume}
                    onChange={(e) =>
                      setQuoteFormData({ ...quoteFormData, hiringVolume: e.target.value })
                    }
                  >
                    <option value="5-15 hires/month">5 - 15 hires / month</option>
                    <option value="15-30 hires/month">15 - 30 hires / month</option>
                    <option value="30-60 hires/month">30 - 60 hires / month</option>
                    <option value="60+ hires/month (Enterprise)">60+ hires / month (Enterprise)</option>
                  </select>
                </div>

                <div className="rp-field-block">
                  <label className="rp-field-label">Configuration &amp; Special Requirements</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about specific roles, tech stacks, or ATS integrations you require..."
                    className="rp-field-control"
                    value={quoteFormData.notes}
                    onChange={(e) =>
                      setQuoteFormData({ ...quoteFormData, notes: e.target.value })
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingQuote}
                  className="rp-submit-quote-btn"
                >
                  {submittingQuote ? 'Submitting Request...' : 'Send Inquiry to Enterprise Team'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
