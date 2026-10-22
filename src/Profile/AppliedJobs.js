'use client';
import React, { useEffect, useState, useMemo } from "react";
import { Table, Select, Tooltip } from "antd";
import { useNavigate } from "@/routing-shim";
import {
  getUserAppliedJobs,
  getUserJobPostStatus,
} from "../ApiService/action";
import {
  FiClock,
  FiMapPin,
  FiBriefcase,
  FiXCircle,
  FiFileText,
  FiCheckCircle,
  FiCalendar,
  FiSearch,
  FiX,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiRotateCcw,
  FiArrowUpRight,
  FiExternalLink,
  FiCheck
} from "react-icons/fi";
import { BsBriefcaseFill, BsBuilding } from "react-icons/bs";
import CriticalProfileAlert from "../Components/CriticalProfileAlert/CriticalProfileAlert";
import "../css/AppliedJobsTracker.css";

const generateSlug = (text) => {
  return text
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getCurrencySymbol = (currencyCode) => {
  const currencyMap = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
  };
  return currencyMap[currencyCode] || currencyCode || '₹';
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Applied today";
  if (diffDays === 1) return "Applied 1 day ago";
  if (diffDays < 30) return `Applied ${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "Applied 1 mo ago";
  if (diffMonths < 12) return `Applied ${diffMonths} mos ago`;
  return `Applied ${Math.floor(diffMonths / 12)} yr(s) ago`;
};

// Company Logo component with graceful initials fallback
const CompanyLogo = ({ logo, name }) => {
  const [hasError, setHasError] = useState(false);

  const getInitials = (n) => {
    if (!n) return "CF";
    const parts = n.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  const getGradient = (n) => {
    const gradients = [
      'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
      'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
      'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    ];
    let hash = 0;
    for (let i = 0; i < (n || "").length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  if (!logo || hasError) {
    return (
      <div
        className="tracker-company-avatar"
        style={{ background: getGradient(name) }}
      >
        <span>{getInitials(name)}</span>
      </div>
    );
  }

  return (
    <div className="tracker-company-logo-box">
      <img
        src={logo}
        alt={name || "Company"}
        onError={() => setHasError(true)}
        className="tracker-company-logo-img"
      />
    </div>
  );
};

export default function AppliedJobs() {
  const [opportunities, setOpportunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loginUserId, setLoginUserId] = useState(null);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [jobStatusMap, setJobStatusMap] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filters State
  const [statusFilter, setStatusFilter] = useState("All"); // All | Active | Pending | Rejected
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [companyFilter, setCompanyFilter] = useState("All Companies");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [dateFilter, setDateFilter] = useState("All Time");

  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("loginDetails");
    if (stored) {
      try {
        const loginDetails = JSON.parse(stored);
        setLoginUserId(loginDetails.id);
      } catch (error) {
        console.error("Invalid JSON in localStorage", error);
      }
    }
  }, []);

  useEffect(() => {
    if (loginUserId) {
      fetchAppliedJobs();
    }
  }, [loginUserId]);

  useEffect(() => {
    if (appliedJobIds.length > 0) {
      getUserJobPostStatusData();
    }
  }, [appliedJobIds]);

  const fetchAppliedJobs = async () => {
    try {
      setLoading(true);
      const response = await getUserAppliedJobs({ userId: loginUserId });
      const jobs = response?.data?.data || [];
      const sortedJobs = jobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOpportunities(sortedJobs);
      setAppliedJobIds(sortedJobs.map((job) => job.id));
    } catch (error) {
      console.error("Error fetching applied jobs:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAppliedJobs();
    if (appliedJobIds.length > 0) {
      await getUserJobPostStatusData();
    }
    setRefreshing(false);
  };

  const getUserJobPostStatusData = async () => {
    try {
      const promises = appliedJobIds.map((id) =>
        getUserJobPostStatus({ applied_job_id: id })
      );
      const responses = await Promise.all(promises);
      const statusMap = {};
      responses.forEach((res) => {
        const jobStatuses = res?.data?.data || [];
        if (jobStatuses.length > 0) {
          const latestStatus = jobStatuses.reduce((latest, current) =>
            new Date(current.changed_at) > new Date(latest.changed_at)
              ? current
              : latest
          );
          statusMap[latestStatus.applied_job_id] = latestStatus.status;
        }
      });
      setJobStatusMap(statusMap);
    } catch (error) {
      console.log("getUserJobPostStatus error", error);
    }
  };

  // Helper to categorize job status
  const getNormalizedStatus = (oppId) => {
    const status = jobStatusMap[oppId];
    if (status === "Rejected") return "Rejected";
    if (!status || status === "Pending") return "Pending";
    return "Active"; // Shortlisted, Mail Sent, Interview, In Process
  };

  // Extract filter options
  const uniqueRoles = useMemo(() => {
    const roles = new Set(opportunities.map(opp => opp.job_title).filter(Boolean));
    return ['All Roles', ...Array.from(roles).sort()];
  }, [opportunities]);

  const uniqueCompanies = useMemo(() => {
    const companies = new Set(opportunities.map(opp => opp.company_name || opp.company).filter(Boolean));
    return ['All Companies', ...Array.from(companies).sort()];
  }, [opportunities]);

  const uniqueLocations = useMemo(() => {
    const locations = new Set();
    opportunities.forEach(opp => {
      let loc = opp.work_location;
      if (!loc || loc === "[]" || loc === '[""]') {
        if (opp.workplace_type) locations.add(opp.workplace_type);
        else locations.add("Remote");
      } else if (loc === "Work From Home") {
        locations.add("Remote (WFH)");
      } else {
        try {
          const parsed = JSON.parse(loc);
          if (Array.isArray(parsed)) {
            parsed.forEach(p => { if (p && p.trim()) locations.add(p.trim()); });
          } else if (parsed && String(parsed).trim()) {
            locations.add(String(parsed).trim());
          }
        } catch {
          if (loc.trim()) locations.add(loc.trim());
        }
      }
    });
    return ['All Locations', ...Array.from(locations).sort()];
  }, [opportunities]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setRoleFilter("All Roles");
    setCompanyFilter("All Companies");
    setLocationFilter("All Locations");
    setDateFilter("All Time");
    setCurrentPage(1);
  };

  const hasFilters =
    searchQuery !== "" ||
    statusFilter !== "All" ||
    roleFilter !== "All Roles" ||
    companyFilter !== "All Companies" ||
    locationFilter !== "All Locations" ||
    dateFilter !== "All Time";

  // Filtered dataset
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // 1. Search filter
      const target = `${opp.job_title || ""} ${opp.company_name || opp.company || ""}`.toLowerCase();
      const matchesSearch = searchQuery ? target.includes(searchQuery.toLowerCase()) : true;

      // 2. Status filter
      const currentStatus = getNormalizedStatus(opp.id);
      const matchesStatus = statusFilter === "All" || currentStatus === statusFilter;

      // 3. Role filter
      const matchesRole = roleFilter === "All Roles" || opp.job_title === roleFilter;

      // 4. Company filter
      const oppCompany = opp.company_name || opp.company;
      const matchesCompany = companyFilter === "All Companies" || oppCompany === companyFilter;

      // 5. Location filter
      let matchesLocation = true;
      if (locationFilter !== "All Locations") {
        let locStr = "";
        let loc = opp.work_location;
        if (!loc || loc === "[]" || loc === '[""]') {
          locStr = opp.workplace_type || "Remote";
        } else if (loc === "Work From Home") {
          locStr = "Remote (WFH)";
        } else {
          try {
            const parsed = JSON.parse(loc);
            if (Array.isArray(parsed)) locStr = parsed.join(", ");
            else locStr = String(parsed);
          } catch {
            locStr = String(loc);
          }
        }
        matchesLocation = locStr.toLowerCase().includes(locationFilter.toLowerCase());
      }

      // 6. Date filter
      let matchesDate = true;
      if (dateFilter !== "All Time") {
        const appliedDate = new Date(opp.created_at);
        const now = new Date();
        const diffTime = Math.abs(now - appliedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (dateFilter === "Last 7 Days") matchesDate = diffDays <= 7;
        else if (dateFilter === "Last 30 Days") matchesDate = diffDays <= 30;
        else if (dateFilter === "Last 6 Months") matchesDate = diffDays <= 180;
      }

      return matchesSearch && matchesStatus && matchesRole && matchesCompany && matchesLocation && matchesDate;
    });
  }, [opportunities, searchQuery, statusFilter, roleFilter, companyFilter, locationFilter, dateFilter, jobStatusMap]);

  // Sliced data for pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOpportunities.slice(start, start + pageSize);
  }, [filteredOpportunities, currentPage, pageSize]);

  // Overall Stats
  const stats = useMemo(() => {
    let total = opportunities.length;
    let active = 0;
    let pending = 0;
    let rejected = 0;

    opportunities.forEach(opp => {
      const status = getNormalizedStatus(opp.id);
      if (status === "Rejected") rejected++;
      else if (status === "Pending") pending++;
      else active++;
    });

    return { total, active, pending, rejected };
  }, [opportunities, jobStatusMap]);

  const totalPages = Math.ceil(filteredOpportunities.length / pageSize) || 1;

  // Open Job Details logic
  const handleViewJob = (record) => {
    const safeSlug = (val) => {
      if (!val) return "";
      if (Array.isArray(val)) return generateSlug(val.join(" "));
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return generateSlug(parsed.join(" "));
        return generateSlug(parsed);
      } catch {
        return generateSlug(val);
      }
    };
    const jobNature = generateSlug(record.job_nature || "");
    const jobTitle = generateSlug(record.job_title || "");
    const companyName = generateSlug(record.company_name || "");
    const locationSlug = safeSlug(record.work_location);
    const workplaceType = generateSlug(record.workplace_type || "");
    const experienceType = generateSlug(record.experience_type || "");
    const experienceRequired = safeSlug(record.experience_required);

    let basePath = "/job-details";
    if (record.job_nature === "Internship") basePath = "/internship-details";
    if (record.job_nature === "Scholarship") basePath = "/scholarship-details";

    const finalUrl = `${basePath}/${jobNature}-${jobTitle}-${companyName}-${locationSlug}-${workplaceType}-${experienceType}-${experienceRequired}-${record.post_id}`;
    window.open(finalUrl, "_blank");
  };

  // Table Columns
  const columns = [
    {
      title: '#',
      key: 'index',
      width: 55,
      align: 'center',
      render: (text, record, index) => (
        <span className="tracker-index-col">
          {String((currentPage - 1) * pageSize + index + 1).padStart(2, '0')}
        </span>
      ),
    },
    {
      title: 'Role & Company',
      dataIndex: 'job',
      key: 'job',
      render: (_, record) => (
        <div className="tracker-role-company-cell">
          <CompanyLogo
            logo={record.company_logo}
            name={record.company_name}
          />
          <div>
            <div
              className="tracker-job-title"
              onClick={() => handleViewJob(record)}
              title={record.job_title}
            >
              {record.job_title}
            </div>
            <div className="tracker-company-name-row">
              <BsBuilding size={12} style={{ color: '#94a3b8' }} />
              <span>{record.company_name || "Company"}</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Details',
      key: 'details',
      render: (_, record) => {
        let location = record.work_location;
        if (!location || location === "[]" || location === '[""]') {
          location = record.workplace_type || "Remote";
        } else if (location === "Work From Home") {
          location = "Remote (WFH)";
        } else {
          try {
            const parsed = JSON.parse(location);
            if (Array.isArray(parsed)) location = parsed.join(", ");
          } catch { }
        }

        return (
          <div className="tracker-details-cell">
            <div className="tracker-detail-item">
              <FiMapPin size={13} style={{ color: '#6366f1', flexShrink: 0 }} />
              <span title={location}>{location}</span>
            </div>
            {record.job_nature && (
              <span className="tracker-nature-badge">
                <FiBriefcase size={11} /> {record.job_nature}
              </span>
            )}
          </div>
        );
      }
    },
    {
      title: 'Salary',
      key: 'salary',
      render: (_, record) => {
        let salaryText = "Not Disclosed";
        let isDisclosed = false;

        if (record.salary_type === "Fixed" && record.min_salary && String(record.min_salary) !== "0") {
          salaryText = `${getCurrencySymbol(record.currency)}${record.min_salary} ${record.salary_duration?.toLowerCase() === "monthly" ? "/mo" : "LPA"}`;
          isDisclosed = true;
        } else if (record.salary_type === "Range" && (record.min_salary || record.max_salary) && (String(record.min_salary) !== "0" || String(record.max_salary) !== "0")) {
          salaryText = `${getCurrencySymbol(record.currency)}${record.min_salary || 0} - ${getCurrencySymbol(record.currency)}${record.max_salary || 0} ${record.salary_duration?.toLowerCase() === "monthly" ? "/mo" : "LPA"}`;
          isDisclosed = true;
        }

        return (
          <span className={`tracker-salary-badge ${isDisclosed ? 'disclosed' : 'not-disclosed'}`}>
            {salaryText}
          </span>
        );
      }
    },
    {
      title: 'Applied On',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => (
        <div className="tracker-date-cell">
          <div className="tracker-date-primary">
            <FiCalendar size={13} style={{ color: '#94a3b8' }} />
            <span>
              {new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <div className="tracker-date-relative">
            {formatRelativeTime(date)}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const status = jobStatusMap[record.id];
        let pillClass = "pending";
        let displayLabel = status || "Pending";

        if (status === "Shortlisted" || status === "Mail Sent") {
          pillClass = "active";
        } else if (status === "Rejected") {
          pillClass = "rejected";
        } else if (status === "Interview" || status === "In Process") {
          pillClass = "interview";
        }

        return (
          <div className={`tracker-status-pill ${pillClass}`}>
            <span className="tracker-status-dot" />
            <span>{displayLabel}</span>
          </div>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <button
          type="button"
          className="tracker-view-btn"
          onClick={() => handleViewJob(record)}
          title="View full job posting"
        >
          <span>View</span>
          <FiArrowUpRight size={14} />
        </button>
      )
    }
  ];

  return (
    <div className="applied-jobs-tracker-wrapper">
      {/* Header Section */}
      <div className="tracker-header-section">
        <div className="tracker-header-left">
          <div className="tracker-header-icon-box">
            <BsBriefcaseFill />
          </div>
          <div>
            <div className="tracker-title-row">
              <h1 className="tracker-main-title">Application Tracker</h1>
              <span className="tracker-live-badge">
                <span className="tracker-live-dot" />
                Live Status
              </span>
            </div>
            <div className="tracker-subtitle">
              Monitor and manage the real-time progress of all your job applications
            </div>
          </div>
        </div>

        <div className="tracker-header-actions">
          <button
            type="button"
            className="tracker-action-btn-secondary"
            onClick={handleRefresh}
            title="Refresh application statuses"
          >
            <FiRotateCcw className={refreshing ? "spin-animation" : ""} size={14} />
            <span>{refreshing ? "Updating..." : "Refresh"}</span>
          </button>
          <button
            type="button"
            className="tracker-action-btn-primary"
            onClick={() => navigate("/job-filter")}
          >
            <FiBriefcase size={14} />
            <span>Explore Jobs</span>
          </button>
        </div>
      </div>

      {/* Critical Profile Alert for Candidates */}
      <CriticalProfileAlert variant="applied-jobs" />

      {/* Interactive Metric Cards */}
      <div className="tracker-stats-grid">
        <div
          className={`tracker-stat-card ${statusFilter === "All" ? "active-filter" : ""}`}
          style={{ "--card-color": "#5f2eea", "--card-bg-tint": "#faf5ff" }}
          onClick={() => { setStatusFilter("All"); setCurrentPage(1); }}
          title="Filter by all applications"
        >
          <div className="stat-card-icon-box total">
            <FiFileText />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-number">{stats.total}</div>
            <div className="stat-card-label">Total Applied</div>
          </div>
          <div className="stat-card-badge">All</div>
        </div>

        <div
          className={`tracker-stat-card ${statusFilter === "Active" ? "active-filter" : ""}`}
          style={{ "--card-color": "#16a34a", "--card-bg-tint": "#f0fdf4" }}
          onClick={() => {
            setStatusFilter(statusFilter === "Active" ? "All" : "Active");
            setCurrentPage(1);
          }}
          title="Filter by active and in-process applications"
        >
          <div className="stat-card-icon-box active">
            <FiCheckCircle />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-number">{stats.active}</div>
            <div className="stat-card-label">Active / In Process</div>
          </div>
          <div className="stat-card-badge active">
            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
          </div>
        </div>

        <div
          className={`tracker-stat-card ${statusFilter === "Pending" ? "active-filter" : ""}`}
          style={{ "--card-color": "#ca8a04", "--card-bg-tint": "#fefce8" }}
          onClick={() => {
            setStatusFilter(statusFilter === "Pending" ? "All" : "Pending");
            setCurrentPage(1);
          }}
          title="Filter by pending applications"
        >
          <div className="stat-card-icon-box pending">
            <FiClock />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-number">{stats.pending}</div>
            <div className="stat-card-label">Pending Review</div>
          </div>
          <div className="stat-card-badge pending">
            {stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%
          </div>
        </div>

        <div
          className={`tracker-stat-card ${statusFilter === "Rejected" ? "active-filter" : ""}`}
          style={{ "--card-color": "#dc2626", "--card-bg-tint": "#fef2f2" }}
          onClick={() => {
            setStatusFilter(statusFilter === "Rejected" ? "All" : "Rejected");
            setCurrentPage(1);
          }}
          title="Filter by rejected applications"
        >
          <div className="stat-card-icon-box rejected">
            <FiXCircle />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-number">{stats.rejected}</div>
            <div className="stat-card-label">Not Selected</div>
          </div>
          <div className="stat-card-badge rejected">
            {stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Main Table & Filter Container */}
      <div className="tracker-main-container">
        {/* Modern Filter Section */}
        <div className="tracker-filters-wrapper">
          {/* Tier 1: Search & Quick Status Switcher */}
          <div className="tracker-search-row">
            <div className="tracker-search-input-box">
              <FiSearch className="tracker-search-icon" />
              <input
                type="text"
                placeholder="Search by job title, company, or keywords..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="tracker-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="tracker-clear-btn"
                  onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                  title="Clear search text"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            {/* Status Segmented Tabs */}
            <div className="tracker-status-tabs">
              {[
                { key: "All", label: "All", count: stats.total },
                { key: "Active", label: "Active", count: stats.active },
                { key: "Pending", label: "Pending", count: stats.pending },
                { key: "Rejected", label: "Rejected", count: stats.rejected },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`tracker-status-tab-btn ${statusFilter === tab.key ? "active" : ""}`}
                  onClick={() => { setStatusFilter(tab.key); setCurrentPage(1); }}
                >
                  <span>{tab.label}</span>
                  <span className="tracker-tab-pill">{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tier 2: Dedicated Dropdown Filters */}
          <div className="tracker-dropdowns-row">
            {/* Role Filter */}
            <div className="tracker-filter-dropdown-container">
              <div className={`tracker-select-wrapper ${roleFilter !== "All Roles" ? "is-filtered" : ""}`}>
                <Select
                  value={roleFilter}
                  onChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}
                  prefix={<FiBriefcase size={14} style={{ color: roleFilter !== 'All Roles' ? '#5f2eea' : '#64748b' }} />}
                  suffixIcon={<FiChevronDown size={14} style={{ color: '#94a3b8' }} />}
                  showSearch
                  popupMatchSelectWidth={false}
                  classNames={{ popup: { root: "tracker-dropdown-popup" } }}
                  placeholder="All Roles"
                  filterOption={(input, option) =>
                    String(option?.value ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={uniqueRoles.map(r => ({
                    value: r,
                    label: r,
                  }))}
                  optionRender={(option) => (
                    <div className="tracker-option-item">
                      <span className="tracker-option-text">{option.data.label}</span>
                      {option.data.value === roleFilter && (
                        <FiCheck className="tracker-option-check" size={14} />
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Company Filter */}
            <div className="tracker-filter-dropdown-container">
              <div className={`tracker-select-wrapper ${companyFilter !== "All Companies" ? "is-filtered" : ""}`}>
                <Select
                  value={companyFilter}
                  onChange={(v) => { setCompanyFilter(v); setCurrentPage(1); }}
                  prefix={<BsBuilding size={14} style={{ color: companyFilter !== 'All Companies' ? '#5f2eea' : '#64748b' }} />}
                  suffixIcon={<FiChevronDown size={14} style={{ color: '#94a3b8' }} />}
                  showSearch
                  popupMatchSelectWidth={false}
                  classNames={{ popup: { root: "tracker-dropdown-popup" } }}
                  placeholder="All Companies"
                  filterOption={(input, option) =>
                    String(option?.value ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={uniqueCompanies.map(c => ({
                    value: c,
                    label: c,
                  }))}
                  optionRender={(option) => (
                    <div className="tracker-option-item">
                      <span className="tracker-option-text">{option.data.label}</span>
                      {option.data.value === companyFilter && (
                        <FiCheck className="tracker-option-check" size={14} />
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Location Filter */}
            <div className="tracker-filter-dropdown-container">
              <div className={`tracker-select-wrapper ${locationFilter !== "All Locations" ? "is-filtered" : ""}`}>
                <Select
                  value={locationFilter}
                  onChange={(v) => { setLocationFilter(v); setCurrentPage(1); }}
                  prefix={<FiMapPin size={14} style={{ color: locationFilter !== 'All Locations' ? '#5f2eea' : '#64748b' }} />}
                  suffixIcon={<FiChevronDown size={14} style={{ color: '#94a3b8' }} />}
                  showSearch
                  popupMatchSelectWidth={false}
                  classNames={{ popup: { root: "tracker-dropdown-popup" } }}
                  placeholder="All Locations"
                  filterOption={(input, option) =>
                    String(option?.value ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={uniqueLocations.map(l => ({
                    value: l,
                    label: l,
                  }))}
                  optionRender={(option) => (
                    <div className="tracker-option-item">
                      <span className="tracker-option-text">{option.data.label}</span>
                      {option.data.value === locationFilter && (
                        <FiCheck className="tracker-option-check" size={14} />
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Date Applied Filter */}
            <div className="tracker-filter-dropdown-container">
              <div className={`tracker-select-wrapper ${dateFilter !== "All Time" ? "is-filtered" : ""}`}>
                <Select
                  value={dateFilter}
                  onChange={(v) => { setDateFilter(v); setCurrentPage(1); }}
                  prefix={<FiCalendar size={14} style={{ color: dateFilter !== 'All Time' ? '#5f2eea' : '#64748b' }} />}
                  suffixIcon={<FiChevronDown size={14} style={{ color: '#94a3b8' }} />}
                  popupMatchSelectWidth={false}
                  classNames={{ popup: { root: "tracker-dropdown-popup" } }}
                  options={[
                    { value: 'All Time', label: 'All Time' },
                    { value: 'Last 7 Days', label: 'Last 7 Days' },
                    { value: 'Last 30 Days', label: 'Last 30 Days' },
                    { value: 'Last 6 Months', label: 'Last 6 Months' },
                  ]}
                  optionRender={(option) => (
                    <div className="tracker-option-item">
                      <span className="tracker-option-text">{option.data.label}</span>
                      {option.data.value === dateFilter && (
                        <FiCheck className="tracker-option-check" size={14} />
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Reset Button */}
            {hasFilters && (
              <button
                type="button"
                className="tracker-reset-filters-btn"
                onClick={handleClearAllFilters}
                title="Reset all applied filters"
              >
                <FiRotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Tier 3: Active Filters Summary Chips Bar */}
          {hasFilters && (
            <div className="tracker-active-chips-bar">
              <div className="tracker-results-count">
                Showing <strong>{filteredOpportunities.length}</strong> of {opportunities.length} applications
              </div>
              <div className="tracker-chips-list">
                {searchQuery && (
                  <span className="tracker-chip">
                    Search: "{searchQuery}"
                    <span
                      className="tracker-chip-close"
                      onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                    >
                      <FiX size={12} />
                    </span>
                  </span>
                )}
                {statusFilter !== "All" && (
                  <span className="tracker-chip">
                    Status: {statusFilter}
                    <span
                      className="tracker-chip-close"
                      onClick={() => { setStatusFilter("All"); setCurrentPage(1); }}
                    >
                      <FiX size={12} />
                    </span>
                  </span>
                )}
                {roleFilter !== "All Roles" && (
                  <span className="tracker-chip">
                    Role: {roleFilter}
                    <span
                      className="tracker-chip-close"
                      onClick={() => { setRoleFilter("All Roles"); setCurrentPage(1); }}
                    >
                      <FiX size={12} />
                    </span>
                  </span>
                )}
                {companyFilter !== "All Companies" && (
                  <span className="tracker-chip">
                    Company: {companyFilter}
                    <span
                      className="tracker-chip-close"
                      onClick={() => { setCompanyFilter("All Companies"); setCurrentPage(1); }}
                    >
                      <FiX size={12} />
                    </span>
                  </span>
                )}
                {locationFilter !== "All Locations" && (
                  <span className="tracker-chip">
                    Location: {locationFilter}
                    <span
                      className="tracker-chip-close"
                      onClick={() => { setLocationFilter("All Locations"); setCurrentPage(1); }}
                    >
                      <FiX size={12} />
                    </span>
                  </span>
                )}
                {dateFilter !== "All Time" && (
                  <span className="tracker-chip">
                    Date: {dateFilter}
                    <span
                      className="tracker-chip-close"
                      onClick={() => { setDateFilter("All Time"); setCurrentPage(1); }}
                    >
                      <FiX size={12} />
                    </span>
                  </span>
                )}
                <button
                  type="button"
                  className="tracker-clear-all-link"
                  onClick={handleClearAllFilters}
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <Table
          className="custom-table"
          columns={columns}
          dataSource={paginatedData}
          rowKey={(record) => record.id}
          loading={loading}
          pagination={false}
          locale={{
            emptyText: (
              <div className="tracker-empty-state">
                <div className="tracker-empty-icon">
                  <FiBriefcase />
                </div>
                <h3 className="tracker-empty-title">No applications found</h3>
                <p className="tracker-empty-desc">
                  {hasFilters
                    ? "We couldn't find any job applications matching your current filter criteria."
                    : "You haven't applied to any job postings yet. Discover opportunities matching your career goals."}
                </p>
                {hasFilters ? (
                  <button
                    type="button"
                    className="tracker-empty-btn"
                    onClick={handleClearAllFilters}
                  >
                    <FiRotateCcw size={14} />
                    <span>Reset All Filters</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="tracker-empty-btn"
                    onClick={() => navigate("/job-filter")}
                  >
                    <span>Browse Job Openings</span>
                  </button>
                )}
              </div>
            )
          }}
        />

        {/* Custom Pagination Footer */}
        {filteredOpportunities.length > 0 && (
          <div className="tracker-pagination-bar">
            <div className="tracker-pagination-info">
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, filteredOpportunities.length)}</strong> of <strong>{filteredOpportunities.length}</strong> applications
            </div>

            <div className="tracker-pagination-controls">
              <button
                type="button"
                className="tracker-page-nav-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                title="Previous page"
              >
                <FiChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                // Show first, last, current, and adjacent pages
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      className={`tracker-page-number-btn ${currentPage === pageNum ? "active" : ""}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  (pageNum === currentPage - 2 && pageNum > 1) ||
                  (pageNum === currentPage + 2 && pageNum < totalPages)
                ) {
                  return (
                    <span key={pageNum} style={{ padding: '0 4px', color: '#94a3b8' }}>
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                type="button"
                className="tracker-page-nav-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                title="Next page"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
