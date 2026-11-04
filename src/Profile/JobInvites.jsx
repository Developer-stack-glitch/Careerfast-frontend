'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  getCandidateNvitesAPI,
  markNviteViewedAPI,
  acceptNviteAPI,
  declineNviteAPI
} from '../ApiService/action';
import {
  Check,
  X,
  MapPin,
  Calendar,
  IndianRupee,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  Clock,
  Mail,
  Phone,
  Inbox,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { message } from 'antd';
import { getImageUrl } from '../utils/getImageUrl';
import '../css/JobInvites.css';

// ── Helpers & Formatters ─────────────────────────────────────────────────────

/** Clean stringified array brackets like ["Bangalore"] -> "Bangalore" */
const cleanLocation = (loc) => {
  if (!loc) return 'Flexible';
  try {
    if (typeof loc === 'string' && (loc.startsWith('[') || loc.startsWith('{'))) {
      const parsed = JSON.parse(loc);
      if (Array.isArray(parsed)) {
        const joined = parsed.filter(Boolean).join(', ');
        return joined || 'Flexible';
      }
      return String(parsed);
    }
  } catch (e) {}
  return String(loc).replace(/[\[\]"']/g, '').trim() || 'Flexible';
};

/** Clean experience or batch year */
const cleanExperience = (exp) => {
  if (!exp) return 'Any Experience';
  let cleaned = exp;
  try {
    if (typeof exp === 'string' && (exp.startsWith('[') || exp.startsWith('{'))) {
      const parsed = JSON.parse(exp);
      if (Array.isArray(parsed)) cleaned = parsed[0] || '';
      else cleaned = String(parsed);
    }
  } catch (e) {}
  cleaned = String(cleaned).replace(/[\[\]"']/g, '').trim();
  if (!cleaned) return 'Any Experience';
  return cleaned;
};

/** Format salary as ₹ 2 - 3 LPA (Range) */
const formatSalary = (min, max, currency = '₹', salaryType = '') => {
  if (!min && !max) return null;
  const curr = (currency === 'INR' || !currency || currency === '₹') ? '₹' : currency;

  const formatVal = (val) => {
    const num = Number(val);
    if (isNaN(num) || num <= 0) return '';
    if (curr === '₹') {
      if (num >= 10000000) return `${(num / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
      if (num >= 100000) return `${(num / 100000).toFixed(1).replace(/\.0$/, '')} LPA`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
      return num.toLocaleString('en-IN');
    }
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toLocaleString();
  };

  const minStr = min ? formatVal(min) : '';
  const maxStr = max ? formatVal(max) : '';

  if (minStr && maxStr) return `${curr} ${minStr} - ${maxStr}${salaryType ? ` (${salaryType})` : ''}`;
  if (minStr) return `From ${curr} ${minStr}`;
  if (maxStr) return `Up to ${curr} ${maxStr}`;
  return null;
};

/** Clean skills list */
const cleanSkills = (skills) => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.filter(Boolean);
  try {
    const parsed = JSON.parse(skills);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch (e) {}
  if (typeof skills === 'string') {
    return skills.split(',').map(s => s.replace(/[\[\]"']/g, '').trim()).filter(Boolean);
  }
  return [];
};

/** Generate stable pastel avatar color based on company name */
const getAvatarColorClass = (name = '') => {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const classes = ['orange', 'purple', 'blue', 'emerald'];
  return classes[hash % classes.length];
};

/** Skeleton Loader mirroring the Master-Detail 2-column layout */
function JobInvitesSkeleton() {
  return (
    <div className="nvites-grid-container nvite-skeleton-mode" aria-busy="true" aria-label="Loading job invitations">
      {/* Left Column: 3 Skeleton Cards */}
      <div className="nvites-sidebar-col">
        {[1, 2, 3].map((item) => (
          <div key={item} className="nvite-list-item nvite-skeleton-card">
            <div className="nvite-item-top">
              {/* Avatar Box Placeholder */}
              <div className="nvite-skeleton-avatar nvite-skeleton-shimmer" />

              <div className="nvite-item-info">
                {/* Title and New Badge */}
                <div className="nvite-item-title-row">
                  <div
                    className="nvite-skeleton-line nvite-skeleton-shimmer"
                    style={{ width: item === 1 ? '72%' : item === 2 ? '58%' : '66%', height: 16 }}
                  />
                  <div
                    className="nvite-skeleton-pill nvite-skeleton-shimmer"
                    style={{ width: 38, height: 18 }}
                  />
                </div>

                {/* Company & Location */}
                <div
                  className="nvite-skeleton-line nvite-skeleton-shimmer"
                  style={{ width: item === 1 ? '52%' : '44%', height: 12, marginTop: 7 }}
                />
              </div>
            </div>

            {/* Bottom Specs & Date */}
            <div className="nvite-item-bottom">
              <div className="nvite-item-tags">
                <div
                  className="nvite-skeleton-pill nvite-skeleton-shimmer"
                  style={{ width: 56, height: 20 }}
                />
                <div
                  className="nvite-skeleton-pill nvite-skeleton-shimmer"
                  style={{ width: 88, height: 20 }}
                />
              </div>
              <div
                className="nvite-skeleton-line nvite-skeleton-shimmer"
                style={{ width: 68, height: 12 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Right Column: Skeleton Detail Card */}
      <div className="nvite-detail-card nvite-skeleton-detail">
        {/* Top Header: Company Info + View Company Button */}
        <div className="nvite-detail-header">
          <div className="nvite-detail-company-box">
            <div className="nvite-skeleton-logo nvite-skeleton-shimmer" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div
                className="nvite-skeleton-line nvite-skeleton-shimmer"
                style={{ width: 140, height: 16 }}
              />
              <div
                className="nvite-skeleton-line nvite-skeleton-shimmer"
                style={{ width: 95, height: 12 }}
              />
            </div>
          </div>
          <div
            className="nvite-skeleton-pill nvite-skeleton-shimmer"
            style={{ width: 110, height: 32, borderRadius: 8 }}
          />
        </div>

        {/* Role Title & Recruiter Invite Badge */}
        <div className="nvite-detail-role-row">
          <div
            className="nvite-skeleton-line nvite-skeleton-shimmer"
            style={{ width: '48%', height: 24, borderRadius: 6 }}
          />
          <div
            className="nvite-skeleton-pill nvite-skeleton-shimmer"
            style={{ width: 115, height: 22, borderRadius: 6 }}
          />
        </div>

        {/* Horizontal Specs Bar */}
        <div className="nvite-detail-specs-row" style={{ marginTop: 12, marginBottom: 18 }}>
          <div
            className="nvite-skeleton-line nvite-skeleton-shimmer"
            style={{ width: 130, height: 14 }}
          />
          <span className="nvite-spec-divider">|</span>
          <div
            className="nvite-skeleton-line nvite-skeleton-shimmer"
            style={{ width: 115, height: 14 }}
          />
          <span className="nvite-spec-divider">|</span>
          <div
            className="nvite-skeleton-line nvite-skeleton-shimmer"
            style={{ width: 85, height: 14 }}
          />
        </div>

        {/* Message from Recruiter Box */}
        <div className="nvite-recruiter-box nvite-skeleton-box">
          <div className="nvite-recruiter-box-header" style={{ marginBottom: 12 }}>
            <div
              className="nvite-skeleton-pill nvite-skeleton-shimmer"
              style={{ width: 16, height: 16, borderRadius: 4 }}
            />
            <div
              className="nvite-skeleton-line nvite-skeleton-shimmer"
              style={{ width: 150, height: 14 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              className="nvite-skeleton-line nvite-skeleton-shimmer"
              style={{ width: '94%', height: 12 }}
            />
            <div
              className="nvite-skeleton-line nvite-skeleton-shimmer"
              style={{ width: '98%', height: 12 }}
            />
            <div
              className="nvite-skeleton-line nvite-skeleton-shimmer"
              style={{ width: '82%', height: 12 }}
            />
            <div
              className="nvite-skeleton-line nvite-skeleton-shimmer"
              style={{ width: '38%', height: 12, marginTop: 4 }}
            />
          </div>
        </div>

        {/* Key Skills */}
        <div style={{ marginBottom: 20 }}>
          <div
            className="nvite-skeleton-line nvite-skeleton-shimmer"
            style={{ width: 80, height: 14, marginBottom: 10 }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[65, 80, 95, 70, 85].map((w, idx) => (
              <div
                key={idx}
                className="nvite-skeleton-pill nvite-skeleton-shimmer"
                style={{ width: w, height: 26, borderRadius: 6 }}
              />
            ))}
          </div>
        </div>

        {/* Sent & Validity Date Row */}
        <div style={{ display: 'flex', gap: 18, marginBottom: 20 }}>
          <div
            className="nvite-skeleton-line nvite-skeleton-shimmer"
            style={{ width: 110, height: 13 }}
          />
          <div
            className="nvite-skeleton-line nvite-skeleton-shimmer"
            style={{ width: 140, height: 13 }}
          />
        </div>

        {/* Action Buttons Row */}
        <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          <div
            className="nvite-skeleton-btn nvite-skeleton-shimmer"
            style={{ width: 135, height: 38 }}
          />
          <div
            className="nvite-skeleton-btn nvite-skeleton-shimmer"
            style={{ width: 95, height: 38 }}
          />
          <div
            className="nvite-skeleton-btn nvite-skeleton-shimmer"
            style={{ width: 95, height: 38 }}
          />
        </div>
      </div>
    </div>
  );
}

export default function JobInvites() {
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInviteId, setSelectedInviteId] = useState(null);
  const [declineModal, setDeclineModal] = useState(null);
  const [declineReason, setDeclineReason] = useState('Currently not looking for a job change');
  const [declineNote, setDeclineNote] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCandidateNvitesAPI({
        status: statusFilter,
        page: 1,
        limit: 50
      });

      if (res?.success) {
        const data = res.data || [];
        setInvites(data);

        // Auto-select first invite if none selected
        if (data.length > 0) {
          setSelectedInviteId(prev => {
            const exists = data.some(item => item.id === prev);
            return exists ? prev : data[0].id;
          });
        } else {
          setSelectedInviteId(null);
        }

        // Mark unviewed invites as viewed
        const unviewed = data.filter(inv => inv.status === 'sent');
        for (const item of unviewed) {
          markNviteViewedAPI(item.id).catch(() => {});
        }
      }
    } catch (err) {
      console.error('Error fetching candidate invites:', err);
      message.error('Failed to load your job invitations');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  // Selected Invite Object
  const selectedInvite = useMemo(() => {
    if (!invites.length) return null;
    return invites.find(inv => inv.id === selectedInviteId) || invites[0];
  }, [invites, selectedInviteId]);

  // Accept Nvite & Apply
  const handleAccept = async (invite) => {
    setActionLoadingId(invite.id);
    try {
      const res = await acceptNviteAPI(invite.id);
      message.success(res?.message || `Accepted invitation for ${invite.job_title}! Application submitted.`);
      fetchInvites();
    } catch (err) {
      console.error('Error accepting Nvite:', err);
      message.error(err?.response?.data?.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Submit Decline
  const handleSubmitDecline = async () => {
    if (!declineModal) return;
    setActionLoadingId(declineModal.id);
    try {
      const res = await declineNviteAPI(declineModal.id, {
        reason: declineReason,
        note: declineNote.trim()
      });
      message.info(res?.message || 'Job invitation declined.');
      setDeclineModal(null);
      setDeclineNote('');
      fetchInvites();
    } catch (err) {
      console.error('Error declining Nvite:', err);
      message.error(err?.response?.data?.message || 'Failed to decline invitation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Counts
  const pendingCount = useMemo(() => {
    return invites.filter(i => i.status === 'sent' || i.status === 'viewed').length;
  }, [invites]);

  const acceptedCount = useMemo(() => {
    return invites.filter(i => i.status === 'accepted').length;
  }, [invites]);

  const declinedCount = useMemo(() => {
    return invites.filter(i => i.status === 'declined').length;
  }, [invites]);

  return (
    <div className="nvites-split-wrapper">
      
      {/* ── Top Header Section ── */}
      <div className="nvites-header-area">
        <h1 className="nvites-main-title">
          Job Invites {loading ? (
            <span className="nvite-skeleton-title-badge nvite-skeleton-shimmer" />
          ) : (
            `(${invites.length})`
          )}
        </h1>
        <p className="nvites-subtitle">
          Invitations from recruiters to apply for relevant jobs
        </p>

        {/* Filter Pills */}
        <div className="nvites-filter-pills" role="tablist">
          {[
            { id: 'all', label: 'All Invites', count: invites.length },
            { id: 'pending', label: 'Pending', count: pendingCount },
            { id: 'accepted', label: 'Accepted', count: acceptedCount },
            { id: 'declined', label: 'Declined', count: declinedCount }
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setStatusFilter(tab.id)}
                className={`nvite-filter-pill ${isActive ? 'active' : ''}`}
                disabled={loading}
              >
                <span>{tab.label}</span>
                <span className="nvite-pill-count">
                  {loading ? (
                    <span className="nvite-skel-count-dot nvite-skeleton-shimmer" />
                  ) : (
                    tab.count
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Loading Skeleton / Empty State / Content ── */}
      {loading ? (
        <JobInvitesSkeleton />
      ) : invites.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px dashed #cbd5e1',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: '#faf5ff',
            border: '1px solid #e9d5ff',
            color: '#6800ad',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px'
          }}>
            <Inbox size={26} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
            No invitations found
          </h3>
          <p style={{ color: '#64748b', fontSize: 13, margin: '0 auto', maxWidth: 420 }}>
            {statusFilter !== 'all'
              ? 'There are no invitations in this status.'
              : 'Keep your CareerFast profile up to date to receive personal job invitations from hiring recruiters.'}
          </p>
        </div>
      ) : (
        /* ── Master-Detail Two Column Layout ── */
        <div className="nvites-grid-container">
          
          {/* ── Left Column: Invites List ── */}
          <div className="nvites-sidebar-col">
            {invites.map((invite) => {
              const isSelected = selectedInvite?.id === invite.id;
              const isPending = invite.status === 'sent' || invite.status === 'viewed';
              const isDeclined = invite.status === 'declined';
              const colorClass = getAvatarColorClass(invite.company_name);
              const initial = (invite.company_name || 'CF').charAt(0).toUpperCase();

              const formattedLocation = cleanLocation(invite.work_location);
              const formattedExp = cleanExperience(invite.experience_required);
              const formattedSalary = formatSalary(
                invite.min_salary,
                invite.max_salary,
                invite.currency,
                invite.salary_type
              );

              const sentDate = invite.created_at
                ? new Date(invite.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recent';

              return (
                <div
                  key={invite.id}
                  onClick={() => setSelectedInviteId(invite.id)}
                  className={`nvite-list-item ${isSelected ? 'selected' : ''}`}
                >
                  <div className="nvite-item-top">
                    {/* Avatar Initial Box */}
                    <div className={`nvite-item-avatar ${colorClass}`}>
                      {initial}
                    </div>

                    <div className="nvite-item-info">
                      <div className="nvite-item-title-row">
                        <h4 className="nvite-item-title">
                          {invite.job_title}
                        </h4>
                        {isPending && (
                          <span className="nvite-item-badge-new">
                            New
                          </span>
                        )}
                        {isDeclined && (
                          <span className="nvite-item-tag declined" style={{ fontSize: 10, padding: '1px 5px' }}>
                            Declined
                          </span>
                        )}
                      </div>

                      <div className="nvite-item-company">
                        {invite.company_name || 'Employer'} • {formattedLocation}
                        {invite.workplace_type ? ` (${invite.workplace_type})` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Specs & Date */}
                  <div className="nvite-item-bottom">
                    <div className="nvite-item-tags">
                      <span className="nvite-item-tag">
                        <Calendar size={11} />
                        <span>{formattedExp}</span>
                      </span>

                      {formattedSalary && (
                        <span className="nvite-item-tag">
                          <span>{formattedSalary}</span>
                        </span>
                      )}
                    </div>

                    <div className="nvite-item-date">
                      {sentDate}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Right Column: Selected Invite Detail View ── */}
          {selectedInvite && (
            <div className="nvite-detail-card">
              
              {/* Top Row: Company Info & View Company Link */}
              <div className="nvite-detail-header">
                <div className="nvite-detail-company-box">
                  {/* Company Logo / Avatar */}
                  <div className={`nvite-detail-logo ${getAvatarColorClass(selectedInvite.company_name)}`}>
                    {selectedInvite.company_logo ? (
                      <img
                        src={getImageUrl(selectedInvite.company_logo)}
                        alt={selectedInvite.company_name || 'Logo'}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span>{(selectedInvite.company_name || 'CF').charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div>
                    <div className="nvite-detail-company-name-row">
                      <span className="nvite-detail-company-name">
                        {selectedInvite.company_name || 'Verified Employer'}
                      </span>
                      <ShieldCheck size={16} className="nvite-verified-icon" />
                    </div>

                    <div className="nvite-detail-verified-text">
                      <ShieldCheck size={13} />
                      <span>Verified Recruiter</span>
                    </div>
                  </div>
                </div>

                {/* View Company Link */}
                <a
                  href={`/job-details/${selectedInvite.job_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nvite-btn-view-company"
                >
                  <span>View Company</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* Role Title & Recruiter Invite Badge */}
              <div className="nvite-detail-role-row">
                <h2 className="nvite-detail-role-title">
                  {selectedInvite.job_title}
                </h2>
                <span className="nvite-detail-invite-badge">
                  <Mail size={12} />
                  <span>Recruiter Invite</span>
                </span>
              </div>

              {/* Horizontal Specs Bar */}
              <div className="nvite-detail-specs-row">
                <span className="nvite-detail-spec-item">
                  <MapPin size={14} style={{ color: '#64748b' }} />
                  <span>
                    {cleanLocation(selectedInvite.work_location)}
                    {selectedInvite.workplace_type ? ` (${selectedInvite.workplace_type})` : ''}
                  </span>
                </span>

                {formatSalary(selectedInvite.min_salary, selectedInvite.max_salary, selectedInvite.currency, selectedInvite.salary_type) && (
                  <>
                    <span className="nvite-spec-divider">|</span>
                    <span className="nvite-detail-spec-item">
                      <IndianRupee size={14} style={{ color: '#64748b' }} />
                      <span>
                        {formatSalary(selectedInvite.min_salary, selectedInvite.max_salary, selectedInvite.currency, selectedInvite.salary_type)}
                      </span>
                    </span>
                  </>
                )}

                <span className="nvite-spec-divider">|</span>
                <span className="nvite-detail-spec-item">
                  <Calendar size={14} style={{ color: '#64748b' }} />
                  <span>{cleanExperience(selectedInvite.experience_required)}</span>
                </span>
              </div>

              {/* ── Declined Reason & Notes Box (Displayed when status is declined) ── */}
              {selectedInvite.status === 'declined' && (
                <div className="nvite-declined-feedback-box">
                  <div className="nvite-declined-header">
                    <div className="nvite-declined-title">
                      <XCircle size={16} />
                      <span>You Declined this Job Invitation</span>
                    </div>
                    {selectedInvite.responded_at && (
                      <span className="nvite-declined-time">
                        Declined on {new Date(selectedInvite.responded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  <div className="nvite-declined-body">
                    <div className="nvite-declined-field">
                      <span className="nvite-declined-label">Primary Reason:</span>
                      <span className="nvite-declined-reason-pill">
                        {selectedInvite.decline_reason || 'Currently not looking for a job change'}
                      </span>
                    </div>

                    {selectedInvite.decline_note && (
                      <div className="nvite-declined-field" style={{ marginTop: 6 }}>
                        <span className="nvite-declined-label">Your Note / Feedback to Recruiter:</span>
                        <p className="nvite-declined-note-text">
                          "{selectedInvite.decline_note}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Message from Recruiter Box ── */}
              {selectedInvite.message && (
                <div className="nvite-recruiter-box">
                  <div className="nvite-recruiter-box-header">
                    <Mail size={15} style={{ color: '#6800ad' }} />
                    <span>Message from Recruiter</span>
                  </div>
                  <p className="nvite-recruiter-box-content">
                    {selectedInvite.message}
                  </p>
                </div>
              )}

              {/* ── Key Skills Chips ── */}
              {cleanSkills(selectedInvite.job_skills).length > 0 && (
                <div className="nvite-detail-skills-row">
                  <span className="nvite-detail-skills-label">Key Skills</span>
                  {cleanSkills(selectedInvite.job_skills).map((skill, idx) => (
                    <span key={idx} className="nvite-detail-skill-chip">
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* ── Sent & Expiry Dates Bar ── */}
              <div className="nvite-detail-date-bar">
                <div className="nvite-detail-sent">
                  <Calendar size={13} style={{ color: '#64748b' }} />
                  <span>
                    Sent: {selectedInvite.created_at ? new Date(selectedInvite.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                  </span>
                </div>

                {selectedInvite.expires_at && selectedInvite.status !== 'accepted' && selectedInvite.status !== 'declined' && (
                  <div className={`nvite-detail-expiry ${selectedInvite.status === 'expired' ? 'expired' : ''}`}>
                    <Clock size={13} />
                    <span>
                      {selectedInvite.status === 'expired'
                        ? `Expired on ${new Date(selectedInvite.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : `Valid till ${new Date(selectedInvite.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${Math.max(0, Math.ceil((new Date(selectedInvite.expires_at) - new Date()) / (1000 * 60 * 60 * 24)))}d left)`}
                    </span>
                  </div>
                )}
              </div>

              {/* ── Actions Row ── */}
              <div className="nvite-detail-actions">
                {/* Pending Actions */}
                {(selectedInvite.status === 'sent' || selectedInvite.status === 'viewed') && selectedInvite.status !== 'expired' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAccept(selectedInvite)}
                      disabled={actionLoadingId === selectedInvite.id}
                      className="nvite-btn-accept"
                    >
                      {actionLoadingId === selectedInvite.id ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Accept & Apply</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeclineModal(selectedInvite)}
                      disabled={actionLoadingId === selectedInvite.id}
                      className="nvite-btn-outline-decline"
                    >
                      <X size={14} />
                      <span>Decline</span>
                    </button>
                  </>
                )}

                {/* View Job Link */}
                <a
                  href={`/job-details/${selectedInvite.job_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nvite-btn-outline-view"
                >
                  <span>View Job</span>
                  <ExternalLink size={13} />
                </a>

                {/* Accepted Status */}
                {selectedInvite.status === 'accepted' && (
                  <a
                    href="/candidate-profile/applied"
                    className="nvite-badge-accepted-status"
                  >
                    <CheckCircle2 size={15} />
                    <span>Application Submitted &bull; Track Status &rarr;</span>
                  </a>
                )}

                {/* Declined Status Badge with Reason */}
                {selectedInvite.status === 'declined' && (
                  <div className="nvite-badge-declined-status">
                    <XCircle size={15} />
                    <span>Invitation Declined: {selectedInvite.decline_reason || 'Currently not looking for a job change'}</span>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* ── Decline Modal ── */}
      {declineModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1050,
          background: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            maxWidth: 480,
            width: '100%',
            padding: 24,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                Decline Job Invitation
              </h3>
              <button
                type="button"
                onClick={() => setDeclineModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Share why you are declining with {declineModal.company_name || 'the recruiter'} (optional).
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Primary Reason
              </label>
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  outline: 'none',
                  background: '#ffffff',
                  color: '#0f172a'
                }}
              >
                <option value="Currently not looking for a job change">Currently not looking for a job change</option>
                <option value="Expected compensation / CTC mismatch">Expected compensation / CTC mismatch</option>
                <option value="Location / Remote preference mismatch">Location / Remote preference mismatch</option>
                <option value="Role not aligned with career goals">Role not aligned with career goals</option>
                <option value="Notice period mismatch">Notice period mismatch</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Additional Note (Optional)
              </label>
              <textarea
                rows={3}
                value={declineNote}
                onChange={(e) => setDeclineNote(e.target.value)}
                placeholder="Thank the recruiter or provide brief context..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                  color: '#0f172a'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeclineModal(null)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitDecline}
                disabled={actionLoadingId === declineModal.id}
                style={{
                  padding: '7px 18px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#e11d48',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {actionLoadingId === declineModal.id && <Loader2 size={13} className="animate-spin" />}
                <span>Confirm Decline</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
