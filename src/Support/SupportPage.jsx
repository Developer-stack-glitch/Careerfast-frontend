'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import {
  Ticket, Search, MessageSquare, AlertCircle, CheckCircle2, Clock, Send,
  HelpCircle, ShieldCheck, Mail, Phone, ArrowRight, Copy, Check, Sparkles,
  LifeBuoy, ChevronDown, ChevronUp, User, FileText, ExternalLink,
  Briefcase, CreditCard, Building2, Bug, Lightbulb, UserCheck, Headset,
  MessageCircle, Zap, Shield, ArrowLeft, RefreshCw, Filter, ChevronRight
} from 'lucide-react';
import {
  createSupportTicket,
  getSupportTicketById,
  addSupportTicketMessage,
  getSupportTickets
} from '../ApiService/action';
import toast from 'react-hot-toast';
import '../css/SupportPage.css';

const CATEGORIES = [
  { id: 'Account & Login', label: 'Account & Login', icon: UserCheck, desc: 'Login, password & profile' },
  { id: 'Job Applications', label: 'Job Applications', icon: Briefcase, desc: 'Apply status & resumes' },
  { id: 'Payment & Billing', label: 'Payment & Billing', icon: CreditCard, desc: 'Invoices & subscriptions' },
  { id: 'Recruiter Verification', label: 'Employer / Verification', icon: Building2, desc: 'Company KYC & approval' },
  { id: 'Technical Issue', label: 'Technical Issue / Bug', icon: Bug, desc: 'Errors & broken features' },
  { id: 'Feature Request', label: 'Feature Request', icon: Lightbulb, desc: 'Ideas & improvements' },
  { id: 'General Inquiry', label: 'General Inquiry', icon: HelpCircle, desc: 'General queries & info' }
];

const PRIORITIES = [
  { id: 'Low', label: 'Low', turnaround: 'Within 24 hours', color: 'pri-low' },
  { id: 'Medium', label: 'Medium', turnaround: 'Within 8-12 hours', color: 'pri-med' },
  { id: 'High', label: 'High', turnaround: 'Within 2-4 hours', color: 'pri-high' },
  { id: 'Urgent', label: 'Urgent', turnaround: 'Immediate / < 1 hour', color: 'pri-urgent' }
];

const FAQS = [
  {
    category: 'General',
    q: 'How long does it take for a support ticket to be resolved?',
    a: 'Our dedicated support team operates 24/7. Urgent and high priority tickets are typically addressed in under 2 hours, while standard inquiries are resolved within 8-24 hours.'
  },
  {
    category: 'Tickets',
    q: 'How do I track the status of my raised ticket?',
    a: 'Simply switch to the "Track Ticket" tab on this page and select your ticket from the list or enter your Ticket Reference ID (e.g., TKT-1024). You will see real-time updates and can communicate directly with the handling support specialist.'
  },
  {
    category: 'Tickets',
    q: 'Can I update or send additional details to an existing ticket?',
    a: 'Yes! When viewing your ticket under the "Track Ticket" tab, use the live discussion box at the bottom to send follow-up messages or clarifications directly to our admin team.'
  },
  {
    category: 'Billing',
    q: 'What should I do if my payment or subscription plan has failed?',
    a: 'Select "Payment & Billing" when raising a ticket and set the priority to High. Our finance and billing operations team will verify your transaction ID and activate your plan immediately.'
  },
  {
    category: 'Employers',
    q: 'How do recruiters get their company profile verified?',
    a: 'Submit a ticket under "Employer / Verification" with your official company domain email and registered GST/CIN details. Verification takes less than 3 business hours.'
  },
  {
    category: 'Account',
    q: 'How do I reset my account credentials or update my phone number?',
    a: 'Select "Account & Login" category and describe the account detail you wish to update. Our verification team will assist you securely.'
  }
];

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState('raise'); // 'raise' | 'track' | 'faq'

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'General Inquiry',
    priority: 'Medium',
    subject: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [copied, setCopied] = useState(false);

  // Track Ticket State
  const [trackSearchId, setTrackSearchId] = useState('');
  const [trackingTicket, setTrackingTicket] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Ticket List State
  const [ticketsList, setTicketsList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listFilter, setListFilter] = useState('All'); // 'All' | 'Open' | 'In Progress' | 'Closed'

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  // Auto-fill logged-in user details if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem('loginDetails');
      if (stored) {
        const user = JSON.parse(stored);
        setFormData(prev => ({
          ...prev,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || prev.name,
          email: user.email || prev.email,
          phone: user.mobile_number || user.phone || prev.phone
        }));
      }
    } catch (e) {
      console.warn('Could not read user profile from storage', e);
    }
  }, []);

  // Fetch Tickets List
  const fetchTicketsList = useCallback(async () => {
    setLoadingList(true);
    try {
      let email = formData.email;
      if (!email) {
        try {
          const stored = localStorage.getItem('loginDetails');
          if (stored) {
            const user = JSON.parse(stored);
            email = user.email || user.user?.email;
          }
        } catch (e) {}
      }
      const params = { limit: 50 };
      if (email) params.email = email;
      const res = await getSupportTickets(params);
      if (res?.data?.success && Array.isArray(res.data.data)) {
        setTicketsList(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tickets list:', err);
    } finally {
      setLoadingList(false);
    }
  }, [formData.email]);

  useEffect(() => {
    if (activeTab === 'track') {
      fetchTicketsList();
    }
  }, [activeTab, fetchTicketsList]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createSupportTicket(formData);
      if (res?.data?.success) {
        toast.success('Support ticket submitted successfully!');
        setCreatedTicket(res.data.data);
        // Add to local list
        setTicketsList(prev => [res.data.data, ...prev]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('support_ticket_changed'));
        }
      } else {
        toast.error(res?.data?.message || 'Failed to submit ticket. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      toast.error(error?.response?.data?.message || 'Failed to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackSearch = async (ticketIdToSearch) => {
    const id = ticketIdToSearch || trackSearchId.trim();
    if (!id) {
      toast.error('Please enter a ticket ID to search (e.g., TKT-1009)');
      return;
    }

    setTrackLoading(true);
    try {
      const res = await getSupportTicketById(id);
      if (res?.data?.success && res.data.data) {
        setTrackingTicket(res.data.data);
        setTrackSearchId(res.data.data.ticket_number || id);
      } else {
        toast.error(`Ticket #${id} not found.`);
        setTrackingTicket(null);
      }
    } catch (error) {
      console.error('Error tracking ticket:', error);
      toast.error(error?.response?.data?.message || `Could not find ticket #${id}.`);
      setTrackingTicket(null);
    } finally {
      setTrackLoading(false);
    }
  };

  const handleSelectTicketFromList = (ticket) => {
    setTrackingTicket(ticket);
    setTrackSearchId(ticket.ticket_number || ticket.id);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !trackingTicket) return;

    setSendingReply(true);
    try {
      const res = await addSupportTicketMessage(trackingTicket.ticket_number, {
        sender: 'User',
        sender_name: formData.name || trackingTicket.user?.name || 'User',
        text: replyText.trim()
      });

      if (res?.data?.success) {
        toast.success('Message sent to support team!');
        // Refresh ticket thread
        const updated = await getSupportTicketById(trackingTicket.ticket_number);
        if (updated?.data?.data) {
          setTrackingTicket(updated.data.data);
          // Update in ticketsList as well
          setTicketsList(prev =>
            prev.map(t => (t.ticket_number === updated.data.data.ticket_number ? updated.data.data : t))
          );
        }
        setReplyText('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleCopyTicketId = (ticketNum) => {
    navigator.clipboard.writeText(ticketNum);
    setCopied(true);
    toast.success('Ticket ID copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered tickets
  const filteredTickets = ticketsList.filter(t => {
    if (listFilter === 'All') return true;
    return (t.status || 'Open').toLowerCase() === listFilter.toLowerCase();
  });

  return (
    <div className="cf-support-page">
      <Header />

      {/* Hero Header Section */}
      <section className="cf-support-hero">
        <div className="cf-hero-mesh-overlay"></div>
        <div className="cf-hero-content-wrapper">
          <div className="cf-hero-badge">
            <span className="cf-badge-pulse"></span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>24/7 Priority Helpdesk & Resolution Center</span>
          </div>

          <h1 className="cf-hero-title">
            How can we <span className="cf-title-gradient">assist you</span> today?
          </h1>

          <p className="cf-hero-subtitle">
            Submit a support ticket, track your existing request in real-time, or connect directly with our operations team.
          </p>

          {/* Quick Contact & Channel Cards */}
          <div className="cf-support-channels">
            <a href="mailto:careerfastcontact@gmail.com" className="cf-channel-card">
              <div className="cf-channel-icon">
                <Mail className="w-5 h-5" />
              </div>
              <div className="cf-channel-info">
                <h4>Email Support</h4>
                <p>careerfastcontact@gmail.com</p>
              </div>
            </a>

            <a href="tel:+918122738034" className="cf-channel-card">
              <div className="cf-channel-icon">
                <Phone className="w-5 h-5" />
              </div>
              <div className="cf-channel-info">
                <h4>Direct Helpline</h4>
                <p>+91 81227 38034</p>
              </div>
            </a>

            <div className="cf-channel-card">
              <div className="cf-channel-icon">
                <Clock className="w-5 h-5" />
              </div>
              <div className="cf-channel-info">
                <h4>Fast Resolution</h4>
                <p>&lt; 2 Hours Avg Response</p>
              </div>
            </div>

            <div className="cf-channel-card">
              <div className="cf-channel-icon">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="cf-channel-info">
                <h4>Dedicated SLA</h4>
                <p>100% Verified Assistance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Support Workspace */}
      <main className="cf-support-body">
        {/* Navigation Tabs */}
        <div className="cf-tabs-nav-container">
          <div className="cf-tabs-nav">
            <button
              type="button"
              onClick={() => setActiveTab('raise')}
              className={`cf-tab-btn ${activeTab === 'raise' ? 'active' : ''}`}
            >
              <Ticket className="w-4 h-4" />
              <span>Raise a Ticket</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('track')}
              className={`cf-tab-btn ${activeTab === 'track' ? 'active' : ''}`}
            >
              <Search className="w-4 h-4" />
              <span>Track My Ticket</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className={`cf-tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>FAQs & Guides</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Raise a Ticket */}
        {activeTab === 'raise' && (
          <div className="cf-tab-content-wrapper animate-fade-in">
            {createdTicket ? (
              /* Success Confirmation Banner */
              <div className="cf-main-card cf-success-banner-card">
                <div className="cf-success-banner">
                  <div className="cf-success-icon-wrapper">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h2 className="cf-success-title">Support Ticket Created Successfully!</h2>
                  <p className="cf-success-desc">
                    Your request has been routed to our dedicated support specialists. You will receive real-time updates and follow-ups.
                  </p>

                  <div className="cf-ticket-badge-highlight">
                    <span className="cf-ref-label">Reference ID:</span>
                    <span className="cf-ref-value">{createdTicket.ticket_number || createdTicket.id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyTicketId(createdTicket.ticket_number || createdTicket.id)}
                      className="cf-copy-btn"
                      title="Copy Ticket ID"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="cf-success-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setTrackingTicket(createdTicket);
                        setTrackSearchId(createdTicket.ticket_number || createdTicket.id);
                        setActiveTab('track');
                        setCreatedTicket(null);
                      }}
                      className="cf-btn-primary"
                    >
                      <Search className="w-4 h-4" />
                      <span>Track This Ticket</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedTicket(null);
                        setFormData({
                          name: formData.name,
                          email: formData.email,
                          phone: formData.phone,
                          category: 'General Inquiry',
                          priority: 'Medium',
                          subject: '',
                          description: ''
                        });
                      }}
                      className="cf-btn-secondary"
                    >
                      Submit Another Ticket
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* 2-Column Ticket Submission Workspace */
              <div className="cf-workspace-grid">
                {/* Left Column: Form */}
                <div className="cf-main-card cf-form-card">
                  <div className="cf-card-header">
                    <div className="cf-card-header-icon">
                      <Ticket className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="cf-card-title">Submit a Support Request</h2>
                      <p className="cf-card-subtitle">Fill in the details below and our operations team will resolve it swiftly.</p>
                    </div>
                  </div>

                  <form onSubmit={handleCreateTicket} className="cf-ticket-form">
                    {/* Section 1: Issue Category */}
                    <div className="cf-form-section">
                      <label className="cf-section-label">
                        <span className="cf-step-number">1</span>
                        <span>Select Issue Category <span className="text-rose-500">*</span></span>
                      </label>
                      <div className="cf-category-grid">
                        {CATEGORIES.map(cat => {
                          const IconComp = cat.icon;
                          const isSelected = formData.category === cat.id;
                          return (
                            <button
                              type="button"
                              key={cat.id}
                              onClick={() => setFormData(p => ({ ...p, category: cat.id }))}
                              className={`cf-category-card ${isSelected ? 'selected' : ''}`}
                            >
                              <div className="cf-cat-icon-wrap">
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="cf-cat-text">
                                <span className="cf-cat-title">{cat.label}</span>
                                <span className="cf-cat-desc">{cat.desc}</span>
                              </div>
                              {isSelected && <div className="cf-cat-check"><Check className="w-3.5 h-3.5" /></div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Section 2: Priority Level */}
                    <div className="cf-form-section">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <label className="cf-section-label !mb-0">
                          <span className="cf-step-number">2</span>
                          <span>Priority Level <span className="text-rose-500">*</span></span>
                        </label>
                        <span className="cf-turnaround-badge">
                          <Clock className="w-3 h-3 text-purple-600" />
                          Expected Resolution: <strong>{PRIORITIES.find(p => p.id === formData.priority)?.turnaround}</strong>
                        </span>
                      </div>
                      <div className="cf-priority-grid">
                        {PRIORITIES.map(pri => (
                          <button
                            type="button"
                            key={pri.id}
                            onClick={() => setFormData(p => ({ ...p, priority: pri.id }))}
                            className={`cf-priority-btn ${pri.color} ${formData.priority === pri.id ? 'active' : ''}`}
                          >
                            <span className="cf-pri-dot"></span>
                            <span className="cf-pri-label">{pri.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section 3: Contact Details */}
                    <div className="cf-form-section">
                      <label className="cf-section-label">
                        <span className="cf-step-number">3</span>
                        <span>Your Contact Details <span className="text-rose-500">*</span></span>
                      </label>
                      <div className="cf-input-grid">
                        <div className="cf-input-group">
                          <label className="cf-field-label">Full Name <span className="text-rose-500">*</span></label>
                          <div className="cf-input-wrapper">
                            <User className="cf-input-icon" />
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="e.g. John Doe"
                              required
                              className="cf-field-input"
                            />
                          </div>
                        </div>

                        <div className="cf-input-group">
                          <label className="cf-field-label">Email Address <span className="text-rose-500">*</span></label>
                          <div className="cf-input-wrapper">
                            <Mail className="cf-input-icon" />
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="e.g. john@example.com"
                              required
                              className="cf-field-input"
                            />
                          </div>
                        </div>

                        <div className="cf-input-group">
                          <label className="cf-field-label">Phone Number (Optional)</label>
                          <div className="cf-input-wrapper">
                            <Phone className="cf-input-icon" />
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="e.g. +91 9876543210"
                              className="cf-field-input"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Subject & Description */}
                    <div className="cf-form-section">
                      <label className="cf-section-label">
                        <span className="cf-step-number">4</span>
                        <span>Issue Information <span className="text-rose-500">*</span></span>
                      </label>

                      <div className="cf-input-group mb-4">
                        <label className="cf-field-label">Subject / Issue Summary <span className="text-rose-500">*</span></label>
                        <div className="cf-input-wrapper">
                          <FileText className="cf-input-icon" />
                          <input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            placeholder="e.g., Cannot update candidate profile or download invoice"
                            required
                            className="cf-field-input"
                          />
                        </div>
                      </div>

                      <div className="cf-input-group">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="cf-field-label !mb-0">Detailed Description <span className="text-rose-500">*</span></label>
                          <span className="cf-char-count">{formData.description.length} chars</span>
                        </div>
                        <textarea
                          name="description"
                          rows="4"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Please provide specific details, error messages, or steps leading to the issue..."
                          required
                          className="cf-field-textarea"
                        ></textarea>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="cf-form-submit-row">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="cf-btn-primary cf-btn-submit"
                      >
                        {submitting ? (
                          <>
                            <div className="cf-btn-spinner"></div>
                            <span>Submitting Your Ticket...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Submit Support Ticket</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Column: Support Quick Help & SLA Info */}
                <div className="cf-sidebar-column">
                  {/* Direct Contact Card */}
                  <div className="cf-sidebar-card">
                    <div className="cf-sidebar-card-header">
                      <Headset className="w-5 h-5 text-purple-600" />
                      <h3>Direct Support Channels</h3>
                    </div>
                    <p className="cf-sidebar-card-desc">
                      Need emergency assistance? You can reach our operations desk directly via email or call.
                    </p>

                    <div className="cf-contact-list">
                      <a href="mailto:careerfastcontact@gmail.com" className="cf-contact-item">
                        <div className="cf-contact-item-icon bg-purple-50 text-purple-600">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="cf-contact-label">Email Support Desk</span>
                          <span className="cf-contact-val">careerfastcontact@gmail.com</span>
                        </div>
                      </a>

                      <a href="tel:+918122738034" className="cf-contact-item">
                        <div className="cf-contact-item-icon bg-blue-50 text-blue-600">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="cf-contact-label">Direct Helpline</span>
                          <span className="cf-contact-val">+91 81227 38034</span>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* Resolution SLAs Card */}
                  <div className="cf-sidebar-card">
                    <div className="cf-sidebar-card-header">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      <h3>Guaranteed SLA Times</h3>
                    </div>
                    <div className="cf-sla-list">
                      <div className="cf-sla-row">
                        <span className="cf-sla-tag pri-urgent">Urgent</span>
                        <span className="cf-sla-time">&lt; 1 Hour Resolution</span>
                      </div>
                      <div className="cf-sla-row">
                        <span className="cf-sla-tag pri-high">High</span>
                        <span className="cf-sla-time">2 - 4 Hours</span>
                      </div>
                      <div className="cf-sla-row">
                        <span className="cf-sla-tag pri-med">Medium</span>
                        <span className="cf-sla-time">8 - 12 Hours</span>
                      </div>
                      <div className="cf-sla-row">
                        <span className="cf-sla-tag pri-low">Low</span>
                        <span className="cf-sla-time">Within 24 Hours</span>
                      </div>
                    </div>
                  </div>

                  {/* Faster Resolution Tips */}
                  <div className="cf-sidebar-card cf-tips-card">
                    <div className="cf-sidebar-card-header">
                      <Zap className="w-5 h-5 text-amber-500" />
                      <h3>Tips for Fast Resolution</h3>
                    </div>
                    <ul className="cf-tips-list">
                      <li>Select the most accurate category to route to the specialized team.</li>
                      <li>Include exact error messages or candidate/job IDs.</li>
                      <li>Check your email or "Track Ticket" tab for replies.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Track My Ticket */}
        {activeTab === 'track' && (
          <div className="cf-tab-content-wrapper animate-fade-in">
            <div className="cf-main-card cf-track-card">
              <div className="cf-card-header">
                <div className="cf-card-header-icon">
                  <Search className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="cf-card-title">Track Ticket Status & Live Thread</h2>
                  <p className="cf-card-subtitle">Enter your Ticket Reference ID or click any ticket below to check live updates.</p>
                </div>
                {trackingTicket && (
                  <button
                    type="button"
                    onClick={() => {
                      setTrackingTicket(null);
                      setTrackSearchId('');
                    }}
                    className="cf-btn-secondary !py-1.5 !px-3 text-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>View All Tickets</span>
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="cf-track-search-bar">
                <div className="cf-search-input-wrapper">
                  <Ticket className="cf-search-icon" />
                  <input
                    type="text"
                    placeholder="Enter Ticket ID (e.g. TKT-1009 or TKT-1024)"
                    value={trackSearchId}
                    onChange={(e) => setTrackSearchId(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleTrackSearch(); }}
                    className="cf-search-input"
                  />
                  {trackSearchId && (
                    <button
                      type="button"
                      onClick={() => {
                        setTrackSearchId('');
                        if (trackingTicket) setTrackingTicket(null);
                      }}
                      className="cf-search-clear-btn"
                    >
                      ×
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleTrackSearch()}
                  disabled={trackLoading}
                  className="cf-btn-primary cf-search-submit-btn"
                >
                  {trackLoading ? (
                    <div className="cf-btn-spinner"></div>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Search Ticket</span>
                    </>
                  )}
                </button>
              </div>

              {/* Ticket Details View (If Selected) */}
              {trackingTicket ? (
                <div className="cf-ticket-detail-view animate-fade-in">
                  {/* Top Header Information */}
                  <div className="cf-detail-top-bar">
                    <div className="cf-detail-title-block">
                      <div className="cf-ticket-id-tag">
                        <span>#{trackingTicket.ticket_number || trackingTicket.id}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyTicketId(trackingTicket.ticket_number || trackingTicket.id)}
                          className="cf-tiny-copy-btn"
                          title="Copy ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className={`cf-priority-badge pri-${(trackingTicket.priority || 'medium').toLowerCase()}`}>
                        {trackingTicket.priority} Priority
                      </span>
                      <span className="cf-category-tag">
                        {trackingTicket.category || 'Support Inquiry'}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="cf-status-pill-wrap">
                      <span className="cf-status-pill-label">Status:</span>
                      <span className={`cf-status-badge status-${(trackingTicket.status || 'open').toLowerCase().replace(/\s+/g, '-')}`}>
                        {trackingTicket.status === 'Open' && <AlertCircle className="w-3.5 h-3.5" />}
                        {trackingTicket.status === 'In Progress' && <Clock className="w-3.5 h-3.5" />}
                        {trackingTicket.status === 'Closed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{trackingTicket.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Stepper Progress */}
                  <div className="cf-stepper-container">
                    <div className={`cf-step-node ${trackingTicket.status ? 'completed' : ''}`}>
                      <div className="cf-step-circle">1</div>
                      <div className="cf-step-text">
                        <span className="cf-step-title">Ticket Submitted</span>
                        <span className="cf-step-time">{new Date(trackingTicket.createdAt || trackingTicket.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className={`cf-step-connector ${(trackingTicket.status === 'In Progress' || trackingTicket.status === 'Closed') ? 'active' : ''}`}></div>

                    <div className={`cf-step-node ${(trackingTicket.status === 'In Progress' || trackingTicket.status === 'Closed') ? (trackingTicket.status === 'Closed' ? 'completed' : 'active') : ''}`}>
                      <div className="cf-step-circle">2</div>
                      <div className="cf-step-text">
                        <span className="cf-step-title">In Review / Processing</span>
                        <span className="cf-step-time">{trackingTicket.status === 'In Progress' ? 'Active Now' : 'Assigned'}</span>
                      </div>
                    </div>

                    <div className={`cf-step-connector ${trackingTicket.status === 'Closed' ? 'active' : ''}`}></div>

                    <div className={`cf-step-node ${trackingTicket.status === 'Closed' ? 'completed' : ''}`}>
                      <div className="cf-step-circle">3</div>
                      <div className="cf-step-text">
                        <span className="cf-step-title">Resolved / Closed</span>
                        <span className="cf-step-time">{trackingTicket.status === 'Closed' ? 'Completed' : 'Pending'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Description Box */}
                  <div className="cf-ticket-summary-box">
                    <div className="cf-summary-row">
                      <span className="cf-summary-label">Subject</span>
                      <h4 className="cf-summary-subject">{trackingTicket.subject}</h4>
                    </div>
                    <div className="cf-summary-row">
                      <span className="cf-summary-label">Description</span>
                      <div className="cf-summary-desc-box">
                        <p className="cf-summary-desc">{trackingTicket.description}</p>
                      </div>
                    </div>
                    <div className="cf-summary-row-grid">
                      <div className="cf-summary-col">
                        <span className="cf-summary-label">Submitted By</span>
                        <div className="cf-summary-val-wrap">
                          <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="cf-summary-value">{trackingTicket.user?.name || trackingTicket.name || 'User'}</span>
                        </div>
                      </div>
                      <div className="cf-summary-col">
                        <span className="cf-summary-label">Contact Email</span>
                        <div className="cf-summary-val-wrap">
                          <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="cf-summary-value">{trackingTicket.user?.email || trackingTicket.email || '-'}</span>
                        </div>
                      </div>
                      <div className="cf-summary-col">
                        <span className="cf-summary-label">Created Time</span>
                        <div className="cf-summary-val-wrap">
                          <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="cf-summary-value">{new Date(trackingTicket.createdAt || trackingTicket.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Chat Discussion Thread */}
                  <div className="cf-chat-section">
                    <div className="cf-chat-header">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                        <h4 className="cf-chat-title">Support Team Discussion</h4>
                      </div>
                      <span className="cf-chat-count-badge">
                        {trackingTicket.messages?.length || 0} messages
                      </span>
                    </div>

                    <div className="cf-chat-messages-container">
                      {trackingTicket.messages && trackingTicket.messages.length > 0 ? (
                        trackingTicket.messages.map((msg, i) => (
                          <div
                            key={i}
                            className={`cf-chat-bubble ${msg.sender === 'Admin' ? 'admin' : 'user'}`}
                          >
                            <div className="cf-bubble-meta">
                              <span className="cf-bubble-sender">
                                {msg.sender === 'Admin' ? '🛡️ CareerFast Operations Team' : `👤 ${msg.sender_name || 'You'}`}
                              </span>
                              <span className="cf-bubble-time">{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="cf-bubble-text">{msg.text}</div>
                          </div>
                        ))
                      ) : (
                        <div className="cf-chat-empty">
                          <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p>No messages yet in this discussion. Our team will post updates here.</p>
                        </div>
                      )}
                    </div>

                    {/* Chat Reply Composer */}
                    <div className="cf-chat-composer">
                      <input
                        type="text"
                        placeholder="Type a clarification or follow-up note..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply(); }}
                        className="cf-composer-input"
                      />
                      <button
                        type="button"
                        onClick={handleSendReply}
                        disabled={sendingReply || !replyText.trim()}
                        className="cf-btn-primary cf-composer-send-btn"
                      >
                        {sendingReply ? (
                          <div className="cf-btn-spinner"></div>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Send</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Ticket List Section */
                <div className="cf-tickets-list-section">
                  <div className="cf-tickets-list-header">
                    <div className="flex items-center gap-2.5">
                      <Ticket className="w-5 h-5 text-purple-600" />
                      <h3 className="cf-tickets-list-title">Your Raised Tickets</h3>
                      <span className="cf-tickets-count-pill">{filteredTickets.length}</span>
                    </div>

                    {/* Status Filters */}
                    <div className="cf-ticket-filter-pills">
                      {['All', 'Open', 'In Progress', 'Closed'].map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setListFilter(st)}
                          className={`cf-ticket-filter-btn ${listFilter === st ? 'active' : ''}`}
                        >
                          {st}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={fetchTicketsList}
                        className="cf-ticket-refresh-btn"
                        title="Refresh List"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* List Content */}
                  {loadingList ? (
                    <div className="cf-tickets-loading">
                      <div className="cf-btn-spinner !w-6 !h-6 !border-purple-600 !border-t-transparent"></div>
                      <p>Loading your support tickets...</p>
                    </div>
                  ) : filteredTickets.length > 0 ? (
                    <div className="cf-tickets-grid">
                      {filteredTickets.map((t, idx) => {
                        const isSelected = trackingTicket?.ticket_number === t.ticket_number;
                        return (
                          <div
                            key={t.id || t.ticket_number || idx}
                            onClick={() => handleSelectTicketFromList(t)}
                            className={`cf-ticket-list-card ${isSelected ? 'selected' : ''}`}
                          >
                            <div className="cf-ticket-card-top">
                              <div className="flex items-center gap-2">
                                <span className="cf-card-tkt-id">#{t.ticket_number || t.id}</span>
                                <span className="cf-card-category-tag">{t.category}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`cf-priority-badge pri-${(t.priority || 'medium').toLowerCase()}`}>
                                  {t.priority}
                                </span>
                                <span className={`cf-status-badge status-${(t.status || 'open').toLowerCase().replace(/\s+/g, '-')}`}>
                                  {t.status}
                                </span>
                              </div>
                            </div>

                            <h4 className="cf-card-subject">{t.subject}</h4>
                            <p className="cf-card-desc-snippet">{t.description}</p>

                            <div className="cf-card-footer">
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {new Date(t.createdAt || t.created_at).toLocaleDateString()}
                                </span>
                                {t.messages && t.messages.length > 0 && (
                                  <span className="flex items-center gap-1 text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full">
                                    <MessageSquare className="w-3 h-3" />
                                    {t.messages.length}
                                  </span>
                                )}
                              </div>
                              <span className="cf-card-track-link">
                                <span>Track Details</span>
                                <ChevronRight className="w-4 h-4" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="cf-tickets-empty">
                      <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <h4 className="font-bold text-slate-800 text-sm mb-1">
                        {listFilter === 'All' ? 'No Support Tickets Found' : `No ${listFilter} Tickets`}
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                        {listFilter === 'All'
                          ? 'You have not submitted any support inquiries yet. Click below to raise your first ticket.'
                          : `There are currently no tickets with status "${listFilter}".`}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('raise')}
                        className="cf-btn-primary !py-2 !px-4 text-xs"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Raise a Ticket</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: FAQs & Guides */}
        {activeTab === 'faq' && (
          <div className="cf-tab-content-wrapper animate-fade-in">
            <div className="cf-main-card cf-faq-card">
              <div className="cf-card-header text-center !justify-center !border-b-0 pb-2">
                <div>
                  <h2 className="cf-card-title text-2xl">Frequently Asked Questions</h2>
                  <p className="cf-card-subtitle max-w-xl mx-auto">
                    Quick answers to common questions about candidate accounts, recruiter verifications, payments, and support.
                  </p>
                </div>
              </div>

              <div className="cf-faq-list">
                {FAQS.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div key={index} className={`cf-faq-accordion-item ${isOpen ? 'open' : ''}`}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        className="cf-faq-question-btn"
                      >
                        <div className="flex items-center gap-3">
                          <span className="cf-faq-cat-tag">{faq.category}</span>
                          <span className="cf-faq-q-text">{faq.q}</span>
                        </div>
                        <div className="cf-faq-toggle-icon">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="cf-faq-answer-pane animate-fade-in">
                          <p>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Support CTA inside FAQ */}
              <div className="cf-faq-footer-cta">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base mb-1">Didn't find what you're looking for?</h4>
                    <p className="text-slate-500 text-sm mb-0">Our dedicated support desk is available 24/7 to resolve your inquiries.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('raise')}
                    className="cf-btn-primary !w-auto !py-2.5 !px-5 whitespace-nowrap"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Raise a Ticket</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
