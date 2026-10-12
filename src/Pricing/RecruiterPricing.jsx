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
  X
} from 'lucide-react';

export default function RecruiterPricing() {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(0); // First item open by default as shown in mockup
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteFormData, setQuoteFormData] = useState({
    fullName: '',
    companyName: '',
    workEmail: '',
    phone: '',
    hiringVolume: '10-25 hires/month',
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

      setPlans(processPlans(activePlans));
    } catch (error) {
      console.error('Error fetching recruiter plans:', error);
      setPlans(getDefaultMockPlans());
    } finally {
      setLoading(false);
    }
  };

  const processPlans = (dbPlans) => {
    const freeDb = dbPlans.find((p) => Number(p.price) === 0 || p.slug === 'free');
    const jobPostDb = dbPlans.find((p) => Number(p.price) > 0 && p.slug === 'job-posting');

    return [
      {
        id: freeDb?.id || 'free-plan',
        slug: 'free',
        name: 'Free Plan',
        tagline: 'Get started with essential hiring tools.',
        monthlyPrice: 0,
        annualPrice: 0,
        description: 'Perfect for individual recruiters to explore CareerFast.',
        icon: <Package size={22} />,
        quotas: {
          jobPosts: freeDb?.active_job_limit || 5,
          resumeAccess: freeDb?.resume_view_limit || 50,
        },
        features: [
          'Post up to 5 jobs',
          'Access 50 resumes',
          'Basic candidate search',
          'Email support',
          'Standard access to platform',
        ],
        ctaText: 'Get Started Free',
        ctaStyle: 'outline',
        targetUrl: `${hrPortalUrl}/register`,
      },
      {
        id: jobPostDb?.id || 'growth-pro',
        slug: 'growth',
        name: 'Growth Pro',
        tagline: 'For professional recruiters and growing teams.',
        monthlyPrice: Number(jobPostDb?.price) || 5000,
        annualPrice: Math.round((Number(jobPostDb?.price) || 5000) * 0.8), // 20% discount on annual
        description: null,
        isPopular: true,
        icon: <BarChart2 size={22} />,
        quotas: {
          jobPosts: jobPostDb?.job_post_limit || 50,
          resumeAccess: '5,000',
        },
        features: [
          'Post up to 50 jobs',
          'Access 5,000 resumes',
          'Advanced candidate filters',
          'Save candidates & create lists',
          'Team collaboration (up to 5 users)',
          'Priority support',
        ],
        ctaText: 'Choose Growth Pro',
        ctaStyle: 'solid',
        targetUrl: `${hrPortalUrl}/login?redirect=subscription&plan=${jobPostDb?.slug || 'job-posting'}`,
      },
      {
        id: 'talenthub-plan',
        slug: 'talenthub',
        name: 'TalentHub',
        tagline: 'For high-volume recruiters and established companies.',
        monthlyPrice: 12999,
        annualPrice: 10399, // 20% discount
        description: null,
        isPopular: false,
        icon: <Rocket size={22} />,
        quotas: {
          jobPosts: 200,
          resumeAccess: '25,000',
        },
        features: [
          'Post up to 200 jobs',
          'Access 25,000 resumes',
          'AI-powered candidate matching',
          'Bulk actions & exports',
          'Team collaboration (up to 15 users)',
          'Dedicated support',
          'Advanced analytics',
        ],
        ctaText: 'Choose TalentHub',
        ctaStyle: 'outline',
        targetUrl: `${hrPortalUrl}/login?redirect=subscription&plan=talenthub`,
      },
      {
        id: 'enterprise-vip',
        slug: 'enterprise',
        name: 'Enterprise VIP',
        tagline: 'Custom solution for large organizations with unique needs.',
        monthlyPrice: null,
        annualPrice: null,
        description: 'Tailored to your requirements.',
        isEnterprise: true,
        icon: <Gem size={22} />,
        quotas: null,
        features: [
          'Unlimited job postings',
          'Unlimited resume access',
          'Custom integrations (API)',
          'Dedicated account manager',
          'Advanced reporting & insights',
          'Custom branding',
          'SLA & on-premise options',
        ],
        ctaText: 'Contact Sales',
        ctaStyle: 'enterprise',
        targetUrl: null, // triggers modal
      },
    ];
  };

  const getDefaultMockPlans = () => [
    {
      id: 'free-plan',
      slug: 'free',
      name: 'Free Plan',
      tagline: 'Get started with essential hiring tools.',
      monthlyPrice: 0,
      annualPrice: 0,
      description: 'Perfect for individual recruiters to explore CareerFast.',
      icon: <Package size={22} />,
      quotas: { jobPosts: 5, resumeAccess: 50 },
      features: [
        'Post up to 5 jobs',
        'Access 50 resumes',
        'Basic candidate search',
        'Email support',
        'Standard access to platform',
      ],
      ctaText: 'Get Started Free',
      ctaStyle: 'outline',
      targetUrl: `${hrPortalUrl}/register`,
    },
    {
      id: 'growth-pro',
      slug: 'growth',
      name: 'Growth Pro',
      tagline: 'For professional recruiters and growing teams.',
      monthlyPrice: 5000,
      annualPrice: 4000,
      isPopular: true,
      icon: <BarChart2 size={22} />,
      quotas: { jobPosts: 50, resumeAccess: '5,000' },
      features: [
        'Post up to 50 jobs',
        'Access 5,000 resumes',
        'Advanced candidate filters',
        'Save candidates & create lists',
        'Team collaboration (up to 5 users)',
        'Priority support',
      ],
      ctaText: 'Choose Growth Pro',
      ctaStyle: 'solid',
      targetUrl: `${hrPortalUrl}/login?redirect=subscription&plan=job-posting`,
    },
    {
      id: 'talenthub-plan',
      slug: 'talenthub',
      name: 'TalentHub',
      tagline: 'For high-volume recruiters and established companies.',
      monthlyPrice: 12999,
      annualPrice: 10399,
      icon: <Rocket size={22} />,
      quotas: { jobPosts: 200, resumeAccess: '25,000' },
      features: [
        'Post up to 200 jobs',
        'Access 25,000 resumes',
        'AI-powered candidate matching',
        'Bulk actions & exports',
        'Team collaboration (up to 15 users)',
        'Dedicated support',
        'Advanced analytics',
      ],
      ctaText: 'Choose TalentHub',
      ctaStyle: 'outline',
      targetUrl: `${hrPortalUrl}/login?redirect=subscription&plan=talenthub`,
    },
    {
      id: 'enterprise-vip',
      slug: 'enterprise',
      name: 'Enterprise VIP',
      tagline: 'Custom solution for large organizations with unique needs.',
      monthlyPrice: null,
      annualPrice: null,
      description: 'Tailored to your requirements.',
      isEnterprise: true,
      icon: <Gem size={22} />,
      quotas: null,
      features: [
        'Unlimited job postings',
        'Unlimited resume access',
        'Custom integrations (API)',
        'Dedicated account manager',
        'Advanced reporting & insights',
        'Custom branding',
        'SLA & on-premise options',
      ],
      ctaText: 'Contact Sales',
      ctaStyle: 'enterprise',
      targetUrl: null,
    },
  ];

  const handleAction = (plan) => {
    if (plan.isEnterprise || !plan.targetUrl) {
      setIsQuoteModalOpen(true);
      return;
    }
    const billingParam = billingCycle === 'annual' ? '&billing=annual' : '&billing=monthly';
    const finalUrl = plan.targetUrl.includes('?')
      ? `${plan.targetUrl}${billingParam}`
      : `${plan.targetUrl}?billing=${billingCycle}`;
    window.location.href = finalUrl;
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
        'Thank you! Your custom recruitment requirement has been received. Our Enterprise Account Director will reach out to you shortly.'
      );
      setQuoteFormData({
        fullName: '',
        companyName: '',
        workEmail: '',
        phone: '',
        hiringVolume: '10-25 hires/month',
        notes: '',
      });
    }, 900);
  };

  const faqs = [
    {
      q: 'Can I change my plan later?',
      a: 'Yes, you can upgrade or downgrade your plan at any time. When you upgrade, the new plan will be applied immediately. If you downgrade, it will take effect from your next billing cycle.',
    },
    {
      q: 'Is there a free trial for paid plans?',
      a: 'Our Free Plan is forever free with essential hiring tools so you can test the platform at zero risk. If you are interested in a trial of Growth Pro or TalentHub candidate discovery tools, contact our sales consultants.',
    },
    {
      q: 'How does resume access work?',
      a: 'Resume access lets you view verified resumes, candidate direct phone/email contact details, experience history, and skill certificates from our talent database.',
    },
    {
      q: 'Can I get a custom plan for my organization?',
      a: 'Yes, our Enterprise VIP plan offers completely tailored job posting credits, unlimited resume database access, ATS webhook synchronization, and multi-user seat configurations.',
    },
    {
      q: 'Do you offer refunds?',
      a: 'We provide prorated adjustments if you change or upgrade your subscription. Please contact our support team for any billing and invoice assistance.',
    },
    {
      q: 'How can I contact support?',
      a: 'You can reach our dedicated recruiter support desk 24/7 via the in-app helpdesk ticket system, email at careerfastcontact@gmail.com, or phone at +91 81227 38034.',
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

        {/* ================= 4 PRICING CARDS ================= */}
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
                className={`rp-price-card ${plan.isPopular ? 'popular' : ''} ${plan.isEnterprise ? 'enterprise' : ''
                  }`}
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
                  {displayPrice === null ? (
                    <div className="rp-card-price-block">
                      <div className="rp-card-price-value">Custom Quote</div>
                    </div>
                  ) : (
                    <div className="rp-card-price-block">
                      <span className="rp-card-price-value">
                        ₹{displayPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="rp-card-price-period">/month</span>
                    </div>
                  )}

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
                  className={`rp-plan-btn ${plan.ctaStyle === 'solid'
                    ? 'btn-solid-theme'
                    : plan.ctaStyle === 'enterprise'
                      ? 'btn-enterprise-white'
                      : 'btn-outline-theme'
                    }`}
                >
                  {plan.ctaText}
                </button>
              </div>
            );
          })}
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
                    <th className="col-plan-head">Free Plan</th>
                    <th className="col-plan-head col-popular-highlight">Growth Pro</th>
                    <th className="col-plan-head">TalentHub</th>
                    <th className="col-plan-head">Enterprise VIP</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="cell-feature-name">Monthly Price</td>
                    <td className="cell-plan-data">₹0</td>
                    <td className="cell-plan-data popular-col-tint">₹5,000</td>
                    <td className="cell-plan-data">₹12,999</td>
                    <td className="cell-plan-data">Custom</td>
                  </tr>
                  <tr>
                    <td className="cell-feature-name">Job Posts per Month</td>
                    <td className="cell-plan-data">5</td>
                    <td className="cell-plan-data popular-col-tint">50</td>
                    <td className="cell-plan-data">200</td>
                    <td className="cell-plan-data">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="cell-feature-name">Resume Access per Month</td>
                    <td className="cell-plan-data">50</td>
                    <td className="cell-plan-data popular-col-tint">5,000</td>
                    <td className="cell-plan-data">25,000</td>
                    <td className="cell-plan-data">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="cell-feature-name">Advanced Search Filters</td>
                    <td className="cell-plan-data"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data popular-col-tint"><Check className="rp-icon-check" size={18} /></td>
                    <td className="cell-plan-data"><Check className="rp-icon-check" size={18} /></td>
                    <td className="cell-plan-data"><Check className="rp-icon-check" size={18} /></td>
                  </tr>
                  <tr>
                    <td className="cell-feature-name">AI Candidate Matching</td>
                    <td className="cell-plan-data"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data popular-col-tint"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data"><Check className="rp-icon-check" size={18} /></td>
                    <td className="cell-plan-data"><Check className="rp-icon-check" size={18} /></td>
                  </tr>
                  <tr>
                    <td className="cell-feature-name">Save Candidates &amp; Lists</td>
                    <td className="cell-plan-data"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data popular-col-tint"><Check className="rp-icon-check" size={18} /></td>
                    <td className="cell-plan-data"><Check className="rp-icon-check" size={18} /></td>
                    <td className="cell-plan-data"><Check className="rp-icon-check" size={18} /></td>
                  </tr>
                  <tr>
                    <td className="cell-feature-name">Team Collaboration</td>
                    <td className="cell-plan-data"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data popular-col-tint">Up to 5 users</td>
                    <td className="cell-plan-data">Up to 15 users</td>
                    <td className="cell-plan-data">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="cell-feature-name">Bulk Actions &amp; Exports</td>
                    <td className="cell-plan-data"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data popular-col-tint"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data"><Check className="rp-icon-check" size={18} /></td>
                    <td className="cell-plan-data"><Check className="rp-icon-check" size={18} /></td>
                  </tr>
                  <tr>
                    <td className="cell-feature-name">Advanced Analytics</td>
                    <td className="cell-plan-data"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data popular-col-tint"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data"><Check className="rp-icon-check" size={18} /></td>
                    <td className="cell-plan-data"><Check className="rp-icon-check" size={18} /></td>
                  </tr>
                  <tr>
                    <td className="cell-feature-name">Custom Integrations (API)</td>
                    <td className="cell-plan-data"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data popular-col-tint"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data"><Check className="rp-icon-check" size={18} /></td>
                  </tr>
                  <tr>
                    <td className="cell-feature-name">Dedicated Support</td>
                    <td className="cell-plan-data"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data popular-col-tint"><Check className="rp-icon-check" size={18} /></td>
                    <td className="cell-plan-data"><Check className="rp-icon-check" size={18} /></td>
                    <td className="cell-plan-data"><Check className="rp-icon-check" size={18} /></td>
                  </tr>
                  <tr>
                    <td className="cell-feature-name">Account Manager</td>
                    <td className="cell-plan-data"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data popular-col-tint"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data"><Check className="rp-icon-check" size={18} /></td>
                  </tr>
                  <tr>
                    <td className="cell-feature-name">Custom Branding</td>
                    <td className="cell-plan-data"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data popular-col-tint"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data"><span className="rp-icon-dash">-</span></td>
                    <td className="cell-plan-data"><Check className="rp-icon-check" size={18} /></td>
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
              Find answers to common questions about our pricing and plans.
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
              onClick={() => setIsQuoteModalOpen(true)}
              className="rp-btn-banner-outline"
            >
              Contact Our Sales Team
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
                <h3 className="rp-modal-headline">Contact Enterprise Sales</h3>
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
                  <label className="rp-field-label">Full Name <span style={{ color: '#ff0000' }}>*</span></label>
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
                  <label className="rp-field-label">Work Email <span style={{ color: '#ff0000' }}>*</span></label>
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
                  <label className="rp-field-label">Phone Number <span style={{ color: '#ff0000' }}>*</span></label>
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
                    <option value="5-10 hires/month">5 - 10 hires / month</option>
                    <option value="10-25 hires/month">10 - 25 hires / month</option>
                    <option value="25-50 hires/month">25 - 50 hires / month</option>
                    <option value="50+ hires/month">50+ hires / month (High Volume)</option>
                  </select>
                </div>

                <div className="rp-field-block">
                  <label className="rp-field-label">Additional Hiring Requirements</label>
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
