'use client';
import React, { useEffect, useState, useMemo } from "react";
import { Input, Typography, Button, Table, Space, Select } from "antd";
import {
  SearchOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "@/routing-shim";
import {
  getUserAppliedJobs,
  getUserJobPostStatus,
} from "../ApiService/action";
import { FiClock, FiMapPin, FiBriefcase, FiXCircle, FiFileText, FiCheckCircle, FiCalendar } from "react-icons/fi";
import { BsBriefcaseFill, BsBuilding } from "react-icons/bs";

const { Title, Text } = Typography;

const debounce = (func, wait) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const generateSlug = (text) => {
  return text
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getCurrencySymbol = (currencyCode) => {
  const currencyMap = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
  };
  return currencyMap[currencyCode] || currencyCode;
};

const StatCard = ({ icon, title, value, color, bg }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    padding: '24px',
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    gap: '20px',
    flex: 1,
    minWidth: '220px'
  }}>
    <div style={{
      width: '50px',
      height: '50px',
      borderRadius: '14px',
      background: bg,
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '26px'
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '14px', color: '#64748b', marginTop: '6px', fontWeight: 500 }}>{title}</div>
    </div>
  </div>
);

export default function AppliedJobs() {
  const [opportunities, setOpportunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loginUserId, setLoginUserId] = useState(null);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [jobStatusMap, setJobStatusMap] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [companyFilter, setCompanyFilter] = useState("All Companies");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [dateFilter, setDateFilter] = useState("Applied Date");

  const navigate = useNavigate();
  const themeColor = "#5f2eea"; // CareerFast purple

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
      const response = await getUserAppliedJobs({ userId: loginUserId });
      const jobs = response?.data?.data || [];
      const sortedJobs = jobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOpportunities(sortedJobs);
      setAppliedJobIds(sortedJobs.map((job) => job.id));
    } catch (error) {
      console.error("Error fetching applied jobs:", error);
    } finally {
      setLoading(false);
    }
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

  const uniqueRoles = useMemo(() => {
    const roles = new Set(opportunities.map(opp => opp.job_title).filter(Boolean));
    return ['All Roles', ...Array.from(roles)];
  }, [opportunities]);

  const uniqueCompanies = useMemo(() => {
    const companies = new Set(opportunities.map(opp => opp.company_name || opp.company).filter(Boolean));
    return ['All Companies', ...Array.from(companies)];
  }, [opportunities]);

  const uniqueLocations = useMemo(() => {
    const locations = new Set();
    opportunities.forEach(opp => {
      let loc = opp.work_location;
      if (!loc || loc === "[]" || loc === '[""]') loc = opp.workplace_type || "Remote";
      else if (loc === "Work From Home") loc = "Remote (WFH)";
      else {
        try {
          const parsed = JSON.parse(loc);
          if (Array.isArray(parsed)) loc = parsed.join(", ");
        } catch { }
      }
      if (loc && loc !== '[]' && loc !== '[""]') locations.add(loc);
    });
    return ['All Locations', ...Array.from(locations)];
  }, [opportunities]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const hasFilters = roleFilter !== "All Roles" || companyFilter !== "All Companies" || locationFilter !== "All Locations" || dateFilter !== "Applied Date" || searchQuery !== "";

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      const target = `${opp.job_title} ${opp.company_name || opp.company}`.toLowerCase();
      const matchesSearch = searchQuery ? target.includes(searchQuery.toLowerCase()) : true;

      const matchesRole = roleFilter === "All Roles" || opp.job_title === roleFilter;

      const oppCompany = opp.company_name || opp.company;
      const matchesCompany = companyFilter === "All Companies" || oppCompany === companyFilter;

      let loc = opp.work_location;
      if (!loc || loc === "[]" || loc === '[""]') loc = opp.workplace_type || "Remote";
      else if (loc === "Work From Home") loc = "Remote (WFH)";
      else {
        try {
          const parsed = JSON.parse(loc);
          if (Array.isArray(parsed)) loc = parsed.join(", ");
        } catch { }
      }
      const matchesLocation = locationFilter === "All Locations" || loc === locationFilter;

      let matchesDate = true;
      if (dateFilter !== "Applied Date") {
        const appliedDate = new Date(opp.created_at);
        const now = new Date();
        const diffTime = Math.abs(now - appliedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (dateFilter === "Last 7 Days") matchesDate = diffDays <= 7;
        else if (dateFilter === "Last 30 Days") matchesDate = diffDays <= 30;
        else if (dateFilter === "Last 6 Months") matchesDate = diffDays <= 180;
      }

      return matchesSearch && matchesRole && matchesCompany && matchesLocation && matchesDate;
    });
  }, [opportunities, searchQuery, roleFilter, companyFilter, locationFilter, dateFilter]);

  const stats = useMemo(() => {
    let total = opportunities.length;
    let active = 0;
    let pending = 0;
    let rejected = 0;

    opportunities.forEach(opp => {
      const status = jobStatusMap[opp.id];
      if (status === "Rejected") rejected++;
      else if (!status || status === "Pending") pending++;
      else active++; // Shortlisted, Mail Sent, Interview, etc.
    });

    return { total, active, pending, rejected };
  }, [opportunities, jobStatusMap]);

  const columns = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (text, record, index) => (
        <span style={{ color: '#94a3b8', fontWeight: 500 }}>
          {String((currentPage - 1) * pageSize + index + 1).padStart(2, '0')}
        </span>
      ),
    },
    {
      title: 'ROLE & COMPANY',
      dataIndex: 'job',
      key: 'job',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            flexShrink: 0,
            width: 48,
            height: 48,
            borderRadius: '12px',
            border: '1px solid #f1f5f9',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <img
              src={record.company_logo || 'https://via.placeholder.com/48?text=Logo'}
              alt={record.company_name}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/48?text=Logo' }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 2 }}>{record.job_title}</div>
            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>{record.company_name}</div>
          </div>
        </div>
      )
    },
    {
      title: 'DETAILS',
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
          <Space direction="vertical" size={4}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
              <FiMapPin size={14} style={{ color: '#94a3b8' }} /> {location}
            </div>
            {record.job_nature && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13, fontWeight: 500 }}>
                <FiBriefcase size={14} style={{ color: '#94a3b8' }} /> {record.job_nature}
              </div>
            )}
          </Space>
        )
      }
    },
    {
      title: 'SALARY',
      key: 'salary',
      render: (_, record) => {
        let salaryText = "Not Disclosed";
        if (record.salary_type === "Fixed" && record.min_salary && String(record.min_salary) !== "0") {
          salaryText = `${getCurrencySymbol(record.currency)}${record.min_salary} ${record.salary_duration?.toLowerCase() === "monthly" ? "Per Month" : "LPA"}`;
        } else if (record.salary_type === "Range" && (record.min_salary || record.max_salary) && (String(record.min_salary) !== "0" || String(record.max_salary) !== "0")) {
          salaryText = `${getCurrencySymbol(record.currency)}${record.min_salary || 0} - ${getCurrencySymbol(record.currency)}${record.max_salary || 0} ${record.salary_duration?.toLowerCase() === "monthly" ? "Per Month" : "LPA"}`;
        }
        return (
          <span style={{
            fontWeight: 600,
            color: '#16a34a',
            background: '#f0fdf4',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '13px'
          }}>
            {salaryText}
          </span>
        );
      }
    },
    {
      title: 'APPLIED ON',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontWeight: 500, fontSize: '13px' }}>
          <FiCalendar size={14} style={{ color: '#94a3b8' }} />
          {new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      ),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: 'STATUS',
      key: 'status',
      render: (_, record) => {
        const status = jobStatusMap[record.id];

        let color = "#d97706", bg = "#fef3c7", icon = <FiClock size={14} />; // Pending (Yellow)
        if (status === "Shortlisted" || status === "Mail Sent") {
          color = "#059669"; bg = "#d1fae5"; icon = <FiCheckCircle size={14} />; // Success (Green)
        }
        else if (status === "Rejected") {
          color = "#dc2626"; bg = "#fee2e2"; icon = <FiXCircle size={14} />; // Error (Red)
        }
        else if (status === "Interview" || status === "In Process") {
          color = themeColor; bg = "#f3e8ff"; icon = <FiFileText size={14} />; // Purple (Theme)
        }

        return (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: bg,
            color: color,
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: 600,
          }}>
            {icon}
            {status ? status : "Pending"}
          </div>
        );
      }
    },
    {
      title: 'ACTION',
      key: 'action',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            style={{
              borderRadius: '20px',
              fontWeight: 600,
              color: themeColor,
              background: '#f8fafc',
              border: '1px solid #8547f8ff',
              padding: '4px 16px',
              display: 'flex',
              alignItems: 'center'
            }}
            onClick={() => {
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
            }}
          >
            View
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="applied-jobs-tracker-wrapper" style={{ padding: "40px" }}>
      <style>
        {`
          .custom-table .ant-table {
            background: transparent;
            font-family: 'Inter', sans-serif;
          }
          .custom-table .ant-table-thead > tr > th {
            background: #f8fafc !important;
            color: #64748b !important;
            font-weight: 700 !important;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0 !important;
            padding: 16px 24px !important;
          }
          .custom-table .ant-table-thead > tr > th::before {
            display: none !important;
          }
          .custom-table .ant-table-tbody > tr > td {
            padding: 20px 24px !important;
            border-bottom: 1px solid #f1f5f9 !important;
            vertical-align: middle;
          }
          .custom-table .ant-table-tbody > tr:hover > td {
            background: #f8fafc !important;
          }
          
          /* Custom Pagination Styling */
          .custom-pagination {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 24px;
            background: #fff;
            border-bottom-left-radius: 16px;
            border-bottom-right-radius: 16px;
          }
          .ant-pagination-item-active {
            border-color: ${themeColor} !important;
            background-color: ${themeColor} !important;
          }
          .ant-pagination-item-active a {
            color: white !important;
          }
          
          .ant-select-selector {
            border-radius: 8px !important;
            height: 40px !important;
            align-items: center !important;
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
          }
          
          .ant-input-affix-wrapper {
            background: #fff !important;
            border: 1px solid #e2e8f0 !important;
          }
          .ant-input-affix-wrapper-focused {
            border-color: ${themeColor} !important;
            box-shadow: 0 0 0 2px rgba(95, 46, 234, 0.1) !important;
          }
        `}
      </style>

      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '16px',
            background: '#e0e7ff', // Soft blue/purple background
            color: themeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            <BsBriefcaseFill />
          </div>
          <div>
            <Title level={2} style={{ margin: 0, color: '#0f172a', fontWeight: 600, fontSize: '28px' }}>
              Application Tracker
            </Title>
            <Text style={{ color: '#64748b', fontSize: '15px', fontWeight: 500, marginTop: '2px', display: 'block' }}>
              Monitor and manage the status of all your job applications
            </Text>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <StatCard
          icon={<FiFileText />}
          title="Total Applied"
          value={stats.total}
          bg="#eff6ff"
          color="#3b82f6"
        />
        <StatCard
          icon={<FiCheckCircle />}
          title="Active / In Process"
          value={stats.active}
          bg="#f0fdf4"
          color="#22c55e"
        />
        <StatCard
          icon={<FiClock />}
          title="Pending"
          value={stats.pending}
          bg="#fefce8"
          color="#eab308"
        />
        <StatCard
          icon={<FiXCircle />}
          title="Rejected"
          value={stats.rejected}
          bg="#fef2f2"
          color="#ef4444"
        />
      </div>

      {/* Main Table Container */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        border: '1px solid #f1f5f9'
      }}>

        {/* Filters Row */}
        <div style={{ display: 'flex', gap: '16px', padding: '24px', flexWrap: 'wrap' }}>
          <Input
            size="large"
            placeholder="Search by job title, company, or location..."
            prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 18 }} />}
            style={{
              borderRadius: '8px',
              height: '44px',
              flex: 1,
              minWidth: '280px',
              fontSize: '15px'
            }}
            value={searchQuery}
            onChange={handleSearchChange}
            allowClear
          />

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Select
              value={roleFilter}
              onChange={(v) => { setRoleFilter(v); setCurrentPage(1); }}
              style={{ width: 160 }}
              suffixIcon={null}
              options={uniqueRoles.map(r => ({ value: r, label: <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><BsBriefcaseFill color="#94a3b8" /> {r}</span> }))}
            />
            <Select
              value={companyFilter}
              onChange={(v) => { setCompanyFilter(v); setCurrentPage(1); }}
              style={{ width: 170 }}
              suffixIcon={null}
              options={uniqueCompanies.map(c => ({ value: c, label: <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><BsBuilding color="#94a3b8" /> {c}</span> }))}
            />
            <Select
              value={locationFilter}
              onChange={(v) => { setLocationFilter(v); setCurrentPage(1); }}
              style={{ width: 160 }}
              suffixIcon={null}
              options={uniqueLocations.map(l => ({ value: l, label: <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><FiMapPin color="#94a3b8" /> {l}</span> }))}
            />
            <Select
              value={dateFilter}
              onChange={(v) => { setDateFilter(v); setCurrentPage(1); }}
              style={{ width: 150 }}
              suffixIcon={null}
              options={[
                { value: 'Applied Date', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><FiCalendar color="#94a3b8" /> Applied Date</span> },
                { value: 'Last 7 Days', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><FiCalendar color="#94a3b8" /> Last 7 Days</span> },
                { value: 'Last 30 Days', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><FiCalendar color="#94a3b8" /> Last 30 Days</span> },
                { value: 'Last 6 Months', label: <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontWeight: 500 }}><FiCalendar color="#94a3b8" /> Last 6 Months</span> },
              ]}
            />

            {hasFilters && (
              <Button
                type="text"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("All Roles");
                  setCompanyFilter("All Companies");
                  setLocationFilter("All Locations");
                  setDateFilter("Applied Date");
                  setCurrentPage(1);
                }}
                style={{ color: '#ef4444', fontWeight: 600, padding: '0 8px' }}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <Table
          className="custom-table"
          columns={columns}
          dataSource={filteredOpportunities}
          rowKey={(record) => record.id}
          loading={loading}
          pagination={false}
          locale={{
            emptyText: (
              <div style={{ padding: "60px 0", textAlign: "center" }}>
                <Title level={4} style={{ color: "#94a3b8" }}>No applications found</Title>
                <Button
                  type="primary"
                  onClick={() => navigate("/job-filter")}
                  style={{ marginTop: 16, background: themeColor, borderRadius: 8 }}
                >
                  Browse Jobs
                </Button>
              </div>
            )
          }}
        />

        {/* Custom Footer Pagination */}
        {filteredOpportunities.length > 0 && (
          <div className="custom-pagination">
            <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredOpportunities.length)} of {filteredOpportunities.length} applications
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                style={{ borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}
              >
                &lt;
              </Button>
              <Button
                type="primary"
                style={{ borderRadius: '8px', background: themeColor, borderColor: themeColor }}
              >
                {currentPage}
              </Button>
              <Button
                disabled={currentPage * pageSize >= filteredOpportunities.length}
                onClick={() => setCurrentPage(p => p + 1)}
                style={{ borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}
              >
                &gt;
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
