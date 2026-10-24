'use client';
// src/pages/JobFilter.jsx
import React, { useEffect, useMemo, useState } from "react";

import {
  Row,
  Col,
  Card,
  Space,
  Button,
  Radio,
  Checkbox,
  Skeleton,
  Drawer,
  Empty,
  Dropdown,
  Popover,
} from "antd";
import { getImageUrl } from "../utils/getImageUrl";
import {
  ThunderboltFilled,
  WalletOutlined,
  FileTextOutlined,
  SyncOutlined,
  LeftOutlined,
  FilterOutlined,
  RightOutlined,
  CodeOutlined,
  DesktopOutlined,
  DatabaseOutlined,
  RocketOutlined,
  MobileOutlined,
  CloudServerOutlined,
  BarChartOutlined,
  FormatPainterOutlined,
  GlobalOutlined,
  BulbOutlined,
  DownOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate, useParams } from "@/routing-shim";

import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import SEO from "../Components/SEO/SEO";
import { CommonToaster } from "../Common/CommonToaster";

import { getAllCourses, getJobCategoryData, getJobPosts, getSalaryRanges, getUniqueCompanies, saveJobPost, getSavedJobs, removeSavedJobs, getLocationCounts } from "../ApiService/action";
import LoginDrawer from "../Components/AuthDrawer/LoginDrawer";
import CriticalProfileAlert from "../Components/CriticalProfileAlert/CriticalProfileAlert";

import { FaMapMarkerAlt } from "react-icons/fa";
import { CgWorkAlt } from "react-icons/cg";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { isInternshipOpportunity } from "../utils/slug";

import "../css/JobFilter.css";
import "../css/naukri-ui-styles.css";
import { Search, SearchX } from "lucide-react";

const generateSlug = (text = "") =>
  String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Helper function to convert currency code to symbol
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

const POPULAR_CITIES = [
  { value: "Bangalore", label: "Bangalore" },
  { value: "Delhi", label: "Delhi" },
  { value: "NCR", label: "NCR" },
  { value: "Bengaluru", label: "Bengaluru" },
  { value: "Hyderabad", label: "Hyderabad" },
  { value: "Pune", label: "Pune" },
  { value: "Mumbai", label: "Mumbai" },
  { value: "Chennai", label: "Chennai" },
  { value: "Gurgaon", label: "Gurgaon" },
  { value: "Gurugram", label: "Gurugram" },
  { value: "Noida", label: "Noida" },
  { value: "Kolkata", label: "Kolkata" },
  { value: "Ahmedabad", label: "Ahmedabad" },
  { value: "Chandigarh", label: "Chandigarh" },
  { value: "Jaipur", label: "Jaipur" },
  { value: "Kochi", label: "Kochi" },
  { value: "Indore", label: "Indore" },
  { value: "Coimbatore", label: "Coimbatore" },
  { value: "Thiruvananthapuram", label: "Thiruvananthapuram" },
  { value: "Bhubaneswar", label: "Bhubaneswar" },
  { value: "Pan India", label: "Pan India" }
];

const isClient = typeof window !== "undefined";

const currentPath = isClient ? window.location.pathname : "";
const currentOrigin = isClient ? window.location.origin : "";

const POPULAR_COMPANIES = [
  "Google", "Microsoft", "Amazon", "Infosys", "TCS",
  "Wipro", "Cognizant", "Accenture", "IBM", "HCLTech",
  "Capgemini", "Tech Mahindra", "Deloitte", "Oracle", "Cisco",
  "Adobe", "Salesforce", "Zoho", "Freshworks", "Flipkart",
  "Zomato", "Paytm", "PhonePe", "Razorpay", "Reliance Industries",
  "HDFC Bank", "ICICI Bank", "Larsen & Toubro (L&T)", "Apple", "Meta"
];

const isCleanCompanyName = (name) => {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  if (/^[/\*\\#@_\-+=.,]/.test(trimmed)) return false;
  if (/^\d+$/.test(trimmed)) return false;
  return true;
};

const workTypes = ["In Office", "On Field", "Work From Home"];
const jobNature = ["Job", "Internship", "Scholarship"];

const DEFAULT_OPEN_SECTIONS = {
  category: true,
  workMode: true,
  location: true,
  salary: true,
  postType: true,
};

const DEFAULT_SALARY_RANGES = [
  { label: "0-3 Lakhs", value: "0-3 Lakhs", count: 4 },
  { label: "3-6 Lakhs", value: "3-6 Lakhs", count: 5 },
  { label: "6-10 Lakhs", value: "6-10 Lakhs", count: 12 },
  { label: "10-15 Lakhs", value: "10-15 Lakhs", count: 17 },
  { label: "15-25 Lakhs", value: "15-25 Lakhs", count: 24 },
  { label: "25-50 Lakhs", value: "25-50 Lakhs", count: 15 },
  { label: "50-75 Lakhs", value: "50-75 Lakhs", count: 11 },
  { label: "75-100 Lakhs", value: "75-100 Lakhs", count: 8 },
  { label: "1-5 Cr", value: "1-5 Cr", count: 12 },
];

const FRESHNESS_OPTIONS = [
  { label: "Last 30 days", value: "30", days: 30 },
  { label: "Last 15 days", value: "15", days: 15 },
  { label: "Last 7 days", value: "7", days: 7 },
  { label: "Last 3 days", value: "3", days: 3 },
  { label: "Last 1 day", value: "1", days: 1 },
];

const DEFAULT_DEPARTMENT_DATA = [
  { label: "Engineering - Hardware & Networks", value: "Engineering - Hardware & Networks", count: 4 },
  { label: "Engineering - Software & QA", value: "Engineering - Software & QA", count: 41 },
  { label: "IT & Information Security", value: "IT & Information Security", count: 7 },
  { label: "Production, Manufacturing & Engineering", value: "Production, Manufacturing & Engineering", count: 65 },
  { label: "Sales & Business Development", value: "Sales & Business Development", count: 42 },
  { label: "Construction & Site Engineering", value: "Construction & Site Engineering", count: 41 },
  { label: "Strategic & Top Management", value: "Strategic & Top Management", count: 38 },
  { label: "Data Science & Analytics", value: "Data Science & Analytics", count: 32 },
  { label: "Finance & Accounting", value: "Finance & Accounting", count: 31 },
  { label: "Project & Program Management", value: "Project & Program Management", count: 26 },
  { label: "Research & Development", value: "Research & Development", count: 17 },
  { label: "Other", value: "Other", count: 16 },
  { label: "BFSI, Investments & Trading", value: "BFSI, Investments & Trading", count: 15 },
  { label: "Customer Success, Service & Operations", value: "Customer Success, Service & Operations", count: 13 },
  { label: "Quality Assurance", value: "Quality Assurance", count: 13 },
  { label: "Procurement & Supply Chain", value: "Procurement & Supply Chain", count: 12 },
  { label: "Consulting", value: "Consulting", count: 10 },
  { label: "Healthcare & Life Sciences", value: "Healthcare & Life Sciences", count: 10 },
  { label: "Human Resources", value: "Human Resources", count: 9 },
  { label: "Teaching & Training", value: "Teaching & Training", count: 8 },
  { label: "Administration & Facilities", value: "Administration & Facilities", count: 7 },
  { label: "Marketing & Communication", value: "Marketing & Communication", count: 6 },
  { label: "Environment Health & Safety", value: "Environment Health & Safety", count: 5 },
  { label: "UX, Design & Architecture", value: "UX, Design & Architecture", count: 5 },
  { label: "Legal & Regulatory", value: "Legal & Regulatory", count: 4 },
  { label: "Product Management", value: "Product Management", count: 4 },
  { label: "Energy & Mining", value: "Energy & Mining", count: 3 },
  { label: "Food, Beverage & Hospitality", value: "Food, Beverage & Hospitality", count: 3 },
  { label: "Shipping & Logistics", value: "Shipping & Logistics", count: 2 },
  { label: "Content, Editorial & Journalism", value: "Content, Editorial & Journalism", count: 2 },
];

const DEFAULT_LOCATION_DATA = [
  { label: "Bangalore", value: "Bangalore", count: 851 },
  { label: "Bengaluru", value: "Bengaluru", count: 32 },
  { label: "Delhi", value: "Delhi", count: 40 },
  { label: "NCR", value: "NCR", count: 20 },
  { label: "Hyderabad", value: "Hyderabad", count: 283 },
  { label: "Pune", value: "Pune", count: 245 },
  { label: "Chennai", value: "Chennai", count: 1030 },
  { label: "Mumbai", value: "Mumbai", count: 174 },
  { label: "Navi Mumbai", value: "Navi Mumbai", count: 22 },
  { label: "Gurgaon", value: "Gurgaon", count: 29 },
  { label: "Gurugram", value: "Gurugram", count: 31 },
  { label: "Noida", value: "Noida", count: 96 },
  { label: "Kolkata", value: "Kolkata", count: 44 },
  { label: "Ahmedabad", value: "Ahmedabad", count: 37 },
  { label: "New Delhi", value: "New Delhi", count: 55 },
  { label: "Indore", value: "Indore", count: 20 },
  { label: "Kochi", value: "Kochi", count: 16 },
  { label: "Bhubaneswar", value: "Bhubaneswar", count: 11 },
  { label: "Coimbatore", value: "Coimbatore", count: 38 },
  { label: "Thiruvananthapuram", value: "Thiruvananthapuram", count: 9 },
  { label: "Jaipur", value: "Jaipur", count: 12 },
  { label: "Chandigarh", value: "Chandigarh", count: 15 },
  { label: "Thane", value: "Thane", count: 5 },
  { label: "Nagpur", value: "Nagpur", count: 10 },
  { label: "Pan India", value: "Pan India", count: 22 },
];

const DEFAULT_COMPANY_DATA = [
  { label: "Google", value: "Google", count: 42 },
  { label: "Microsoft", value: "Microsoft", count: 38 },
  { label: "Amazon", value: "Amazon", count: 55 },
  { label: "Infosys", value: "Infosys", count: 72 },
  { label: "TCS", value: "TCS", count: 85 },
  { label: "Wipro", value: "Wipro", count: 48 },
  { label: "Cognizant", value: "Cognizant", count: 51 },
  { label: "Accenture", value: "Accenture", count: 64 },
  { label: "IBM", value: "IBM", count: 33 },
  { label: "HCLTech", value: "HCLTech", count: 29 },
  { label: "Capgemini", value: "Capgemini", count: 31 },
  { label: "Tech Mahindra", value: "Tech Mahindra", count: 24 },
  { label: "Deloitte", value: "Deloitte", count: 39 },
  { label: "Oracle", value: "Oracle", count: 28 },
  { label: "Cisco", value: "Cisco", count: 19 },
  { label: "Adobe", value: "Adobe", count: 15 },
  { label: "Salesforce", value: "Salesforce", count: 18 },
  { label: "Zoho", value: "Zoho", count: 22 },
  { label: "Freshworks", value: "Freshworks", count: 14 },
  { label: "Flipkart", value: "Flipkart", count: 27 },
  { label: "Zomato", value: "Zomato", count: 19 },
  { label: "Paytm", value: "Paytm", count: 16 },
  { label: "PhonePe", value: "PhonePe", count: 21 },
  { label: "Razorpay", value: "Razorpay", count: 17 },
  { label: "Reliance Industries", value: "Reliance Industries", count: 34 },
  { label: "HDFC Bank", value: "HDFC Bank", count: 26 },
  { label: "ICICI Bank", value: "ICICI Bank", count: 23 },
  { label: "Larsen & Toubro (L&T)", value: "Larsen & Toubro (L&T)", count: 20 },
  { label: "Apple", value: "Apple", count: 12 },
  { label: "Meta", value: "Meta", count: 11 },
];

// Completely separate, self-contained accordion section
// Never triggers parent JobFilter re-renders, filter requests, or skeleton loaders on toggle
const FilterAccordionSection = React.memo(function FilterAccordionSection({
  title,
  defaultOpen = false,
  isActive = false,
  count = 0,
  onReset,
  children,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen || isActive);

  // When filter becomes active from outside selection, ensure it expands so user sees it
  useEffect(() => {
    if (isActive) {
      setIsOpen(true);
    }
  }, [isActive]);

  const handleToggle = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsOpen((prev) => !prev);
  };

  return (
    <motion.div
      layout
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`naukri-accordion-section ${isActive ? 'is-active' : ''}`}
    >
      <div
        className="naukri-accordion-header"
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle(e);
          }
        }}
      >
        <div className="naukri-accordion-title-wrap">
          <span className="naukri-accordion-title">{title}</span>
          {count > 0 && (
            <span className="naukri-section-count">({count})</span>
          )}
        </div>
        <div className="naukri-accordion-controls">
          {isActive && onReset && (
            <button
              type="button"
              className="naukri-section-clear-btn"
              title={`Clear ${title}`}
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
            >
              Clear
            </button>
          )}
          <DownOutlined
            className="naukri-accordion-arrow"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.25s ease",
            }}
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
            className="naukri-accordion-body"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// Completely isolated, self-contained multi-column grid popover (Department, Location, Company)
// Keeps temporary search, checklist selection, and open state local to itself
// NEVER triggers parent JobFilter re-renders or job list skeleton reloading while searching or selecting
const FilterGridPopover = React.memo(function FilterGridPopover({
  title,
  searchPlaceholder = "Search...",
  options = [],
  appliedValues = [],
  onApply,
  overlayClassName = "naukri-filter-grid-popover",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tempSelected, setTempSelected] = useState(appliedValues);

  const handleOpenChange = (visible) => {
    if (visible) {
      setTempSelected(appliedValues);
      setSearch("");
    }
    setOpen(visible);
  };

  const handleApply = () => {
    onApply(tempSelected);
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Re-align popover cleanly when scrolling while open
  useEffect(() => {
    if (!open) return;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          window.dispatchEvent(new Event('resize'));
          ticking = false;
        });
        ticking = true;
      }
    };
    const sidebarEl = document.querySelector('.naukri-sidebar-sticky');
    window.addEventListener('scroll', handleScroll, { passive: true });
    if (sidebarEl) sidebarEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (sidebarEl) sidebarEl.removeEventListener('scroll', handleScroll);
    };
  }, [open]);

  const filteredOptions = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return options;
    return options.filter((opt) => {
      const labelLower = opt.label.toLowerCase();
      if (labelLower.includes(q)) return true;
      if (labelLower === "tcs" && "tata consultancy services".includes(q)) return true;
      if (labelLower.includes("l&t") && "larsen & toubro".includes(q)) return true;
      return false;
    });
  }, [options, search]);

  const popoverContent = (
    <div className="naukri-grid-popup-card">
      <div className="naukri-grid-popup-header">
        <span className="naukri-grid-popup-title">{title}</span>
        <button
          type="button"
          className="naukri-grid-popup-close"
          onClick={handleClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="naukri-grid-popup-search-box">
        <Search size={14} className="naukri-grid-popup-search-icon" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="naukri-grid-popup-search-input"
        />
      </div>

      <div className="naukri-grid-popup-body">
        {filteredOptions.length > 0 ? (
          <div className="naukri-grid-popup-columns">
            {filteredOptions.map((opt) => (
              <div key={opt.value} className="naukri-grid-popup-item">
                <Checkbox
                  checked={tempSelected.includes(opt.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setTempSelected((prev) => [...prev, opt.value]);
                    } else {
                      setTempSelected((prev) => prev.filter((item) => item !== opt.value));
                    }
                  }}
                >
                  <span className="naukri-grid-popup-label" title={opt.label}>
                    {opt.label} <span className="naukri-filter-count">({opt.count ?? 0})</span>
                  </span>
                </Checkbox>
              </div>
            ))}
          </div>
        ) : (
          <div className="naukri-grid-popup-empty">
            <div className="naukri-grid-empty-icon-wrap">
              <SearchX size={24} className="naukri-grid-empty-icon" />
            </div>
            <span className="naukri-grid-empty-title">No data found</span>
            <span className="naukri-grid-empty-desc">
              {search
                ? `No matching ${title ? title.toLowerCase() : 'options'} found for "${search}"`
                : `No ${title ? title.toLowerCase() : 'options'} available`}
            </span>
            {search && (
              <button
                type="button"
                className="naukri-grid-empty-clear-btn"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      <div className="naukri-grid-popup-footer">
        <div className="naukri-grid-popup-track">
          <div className="naukri-grid-popup-thumb"></div>
        </div>
        <Button
          type="primary"
          className="naukri-apply-btn"
          onClick={handleApply}
        >
          Apply
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      open={open}
      onOpenChange={handleOpenChange}
      placement="right"
      autoAdjustOverflow={{ adjustX: 1, adjustY: 1 }}
      overlayClassName={overlayClassName}
      arrow={false}
    >
      <span className="naukri-view-more">
        View More
      </span>
    </Popover>
  );
});

// Completely isolated, self-contained salary filter popover
const SalaryFilterPopover = React.memo(function SalaryFilterPopover({
  options = [],
  appliedValues = [],
  onApply,
}) {
  const [open, setOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState(appliedValues);

  const handleOpenChange = (visible) => {
    if (visible) {
      setTempSelected(appliedValues);
    }
    setOpen(visible);
  };

  const handleApply = () => {
    onApply(tempSelected);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          window.dispatchEvent(new Event('resize'));
          ticking = false;
        });
        ticking = true;
      }
    };
    const sidebarEl = document.querySelector('.naukri-sidebar-sticky');
    window.addEventListener('scroll', handleScroll, { passive: true });
    if (sidebarEl) sidebarEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (sidebarEl) sidebarEl.removeEventListener('scroll', handleScroll);
    };
  }, [open]);

  const popoverContent = (
    <div className="naukri-salary-popup-card">
      <div className="naukri-salary-popup-header">
        <span className="naukri-salary-popup-title">Salary</span>
        <button
          type="button"
          className="naukri-salary-popup-close"
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="naukri-salary-popup-list">
        {options.map((item) => (
          <Checkbox
            key={item.value}
            checked={tempSelected.includes(item.value)}
            onChange={(e) => {
              if (e.target.checked) {
                setTempSelected((prev) => [...prev, item.value]);
              } else {
                setTempSelected((prev) => prev.filter((val) => val !== item.value));
              }
            }}
            className="naukri-filter-item"
          >
            <span className="naukri-checkbox-label" title={item.label}>
              <span className="naukri-checkbox-text">{item.label}</span>
              <span className="naukri-filter-count">({item.count ?? 0})</span>
            </span>
          </Checkbox>
        ))}
      </div>

      <div className="naukri-salary-popup-footer">
        <Button
          type="primary"
          className="naukri-apply-btn"
          onClick={handleApply}
        >
          Apply
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      open={open}
      onOpenChange={handleOpenChange}
      placement="right"
      autoAdjustOverflow={{ adjustX: 1, adjustY: 1 }}
      overlayClassName="naukri-salary-popover"
      arrow={false}
    >
      <span className="naukri-view-more">
        View More
      </span>
    </Popover>
  );
});

// Self-contained Freshness popover filter matching Naukri flyout style
const FreshnessFilterSection = React.memo(function FreshnessFilterSection({
  selected,
  isActive,
  onSelect,
  onReset,
}) {
  const [open, setOpen] = useState(false);

  const handlePick = (val) => {
    onSelect(val);
    setOpen(false);
  };

  const popoverContent = (
    <div className="naukri-freshness-popup-card">
      {FRESHNESS_OPTIONS.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <div
            key={opt.value}
            className={`naukri-freshness-popup-item ${isSelected ? "selected" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              handlePick(opt.value);
            }}
          >
            <span>{opt.label}</span>
            {isSelected && <CheckOutlined className="naukri-freshness-check-icon" />}
          </div>
        );
      })}
    </div>
  );

  const selectedLabel = FRESHNESS_OPTIONS.find((o) => o.value === selected)?.label;

  return (
    <motion.div
      layout
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`naukri-accordion-section naukri-freshness-section ${isActive ? 'is-active' : ''}`}
    >
      <Popover
        content={popoverContent}
        trigger={["click", "hover"]}
        open={open}
        onOpenChange={setOpen}
        placement="right"
        autoAdjustOverflow={{ adjustX: 1, adjustY: 1 }}
        overlayClassName="naukri-freshness-popover"
        arrow={false}
      >
        <div
          className="naukri-accordion-header naukri-freshness-header"
          role="button"
          tabIndex={0}
        >
          <div className="naukri-accordion-title-wrap">
            <span className="naukri-accordion-title">Freshness</span>
          </div>
          <div className="naukri-accordion-controls naukri-freshness-controls">
            {isActive && onReset && (
              <button
                type="button"
                className="naukri-freshness-clear-btn"
                title="Clear Freshness"
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                }}
              >
                Clear
              </button>
            )}
            <div className={`naukri-freshness-select-btn ${selected ? "is-selected" : ""}`}>
              <span className="naukri-freshness-select-text">
                {selectedLabel || "Select"}
              </span>
              <DownOutlined
                className="naukri-freshness-down-arrow"
                style={{
                  fontSize: "10px",
                  marginLeft: "6px",
                  transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </div>
          </div>
        </div>
      </Popover>
    </motion.div>
  );
});

// Self-contained Applied Filters popover matching Naukri checklist style
const AppliedFiltersPopover = React.memo(function AppliedFiltersPopover({
  items = [],
  onRemoveAll,
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setOpen(false);
    }
  }, [items.length]);

  useEffect(() => {
    if (!open) return;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          window.dispatchEvent(new Event('resize'));
          ticking = false;
        });
        ticking = true;
      }
    };
    const sidebarEl = document.querySelector('.naukri-sidebar-sticky');
    window.addEventListener('scroll', handleScroll, { passive: true });
    if (sidebarEl) sidebarEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (sidebarEl) sidebarEl.removeEventListener('scroll', handleScroll);
    };
  }, [open]);

  const popoverContent = (
    <div className="naukri-applied-popup-card">
      <div className="naukri-applied-popup-header">
        <button
          type="button"
          className="naukri-applied-remove-all-btn"
          onClick={() => {
            onRemoveAll();
            setOpen(false);
          }}
        >
          Remove All
        </button>
        <button
          type="button"
          className="naukri-applied-popup-close-btn"
          onClick={() => setOpen(false)}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="naukri-applied-popup-grid">
        {items.map((item) => (
          <div key={item.id} className="naukri-applied-popup-item">
            <Checkbox
              checked={true}
              onChange={() => item.onRemove()}
              className="naukri-applied-checkbox"
            >
              <span className="naukri-applied-item-label" title={item.label}>
                <span className="naukri-applied-item-text">{item.label}</span>
                {item.count !== undefined && item.count !== null && (
                  <span className="naukri-applied-item-count">({item.count})</span>
                )}
              </span>
            </Checkbox>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      autoAdjustOverflow={{ adjustX: 1, adjustY: 1 }}
      overlayClassName="naukri-applied-popover"
      arrow={false}
    >
      <button
        type="button"
        className="naukri-applied-badge-btn"
        title="View applied filters"
      >
        Applied ({items.length})
      </button>
    </Popover>
  );
});

export default function JobFilter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { filterSlug } = useParams();
  const [courses, setCourses] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const lastSlugRef = React.useRef(""); // Track the last filterSlug for reset logic
  /** -------------------- STATE -------------------- **/
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Data
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const fetchRequestId = React.useRef(0);
  const skipUrlSyncRef = React.useRef(false);
  const [jobCategoryOptions, setJobCategoryOptions] = useState([]);

  // Saved Jobs tracking & Login Drawer integration
  const [savedJobs, setSavedJobs] = useState({});
  const [savingJobIds, setSavingJobIds] = useState({});
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false);
  const [pendingSaveJob, setPendingSaveJob] = useState(null);
  const [loginUserId, setLoginUserId] = useState(null);

  const getCleanUserId = React.useCallback((overrideId) => {
    if (typeof overrideId === "number" || (typeof overrideId === "string" && !isNaN(Number(overrideId)) && overrideId.trim() !== "")) {
      return Number(overrideId);
    }
    if (loginUserId && (typeof loginUserId === "number" || (typeof loginUserId === "string" && !isNaN(Number(loginUserId))))) {
      return Number(loginUserId);
    }
    try {
      const s = typeof window !== "undefined" ? localStorage.getItem("loginDetails") : null;
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed?.id && !isNaN(Number(parsed.id))) return Number(parsed.id);
      }
    } catch { }
    return null;
  }, [loginUserId]);

  const fetchSavedJobs = React.useCallback(async (userId) => {
    const effectiveId = getCleanUserId(userId);
    const token = typeof window !== "undefined" ? localStorage.getItem("AccessToken") : null;
    if (!token || !effectiveId) return;
    try {
      const res = await getSavedJobs({ user_id: effectiveId });
      const list = res?.data?.data || [];
      const map = {};
      list.forEach((item) => {
        if (item.job_post_id) {
          map[item.job_post_id] = item.id || true;
        }
      });
      setSavedJobs(map);
    } catch (err) {
      console.warn("Could not fetch saved jobs:", err?.message);
    }
  }, [getCleanUserId]);

  useEffect(() => {
    const id = getCleanUserId();
    if (id) {
      setLoginUserId(id);
      fetchSavedJobs(id);
    }

    const handleAuthChange = () => {
      const updatedId = getCleanUserId();
      setLoginUserId(updatedId);
      if (updatedId) {
        fetchSavedJobs(updatedId);
      } else {
        setSavedJobs({});
      }
    };

    window.addEventListener("authChange", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("authChange", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [fetchSavedJobs, getCleanUserId]);

  const handleSaveJobToggle = async (e, job) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("AccessToken") : null;
    const currentUserId = getCleanUserId();

    if (!token || !currentUserId) {
      setPendingSaveJob(job);
      setAuthDrawerOpen(true);
      return;
    }

    const targetJobId = job.id;
    const isAlreadySaved = Boolean(savedJobs[targetJobId]);

    // Optimistic UI update
    setSavedJobs((prev) => {
      const updated = { ...prev };
      if (isAlreadySaved) {
        delete updated[targetJobId];
      } else {
        updated[targetJobId] = true;
      }
      return updated;
    });

    setSavingJobIds((prev) => ({ ...prev, [targetJobId]: true }));

    try {
      if (isAlreadySaved) {
        await removeSavedJobs({ user_id: currentUserId, job_post_id: targetJobId });
        CommonToaster("Job removed from saved jobs", "info");
      } else {
        await saveJobPost({ user_id: currentUserId, job_post_id: targetJobId });
        CommonToaster("Job saved to your watchlist! ❤️", "success");
      }
      await fetchSavedJobs(currentUserId);
    } catch (err) {
      console.error("Save job error:", err);
      // Revert optimistic update
      setSavedJobs((prev) => ({
        ...prev,
        [targetJobId]: isAlreadySaved,
      }));
      const errorMsg = err?.response?.status === 401 ? "Please log in to save jobs" : "Failed to update saved job";
      CommonToaster(errorMsg, "error");
    } finally {
      setSavingJobIds((prev) => ({ ...prev, [targetJobId]: false }));
    }
  };

  const handleLoginSuccess = async (userDetails) => {
    const newUserId = userDetails?.id;
    if (newUserId) {
      setLoginUserId(newUserId);
      await fetchSavedJobs(newUserId);
    }
    if (pendingSaveJob) {
      const jobToSave = pendingSaveJob;
      setPendingSaveJob(null);
      setTimeout(() => {
        handleSaveJobToggle({ stopPropagation: () => { } }, jobToSave);
      }, 350);
    }
  };

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedDiversity, setSelectedDiversity] = useState([]);
  const [selectedWorkingDays, setSelectedWorkingDays] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedSort, setSelectedSort] = useState("recommended");
  const [selectedUserType, setSelectedUserType] = useState("");
  const [jobNatureSelected, setJobNatureSelected] = useState(() => {
    if (!isClient) return "Job";
    const qNature = new URLSearchParams(window.location.search).get('job_nature');
    if (qNature) {
      const match = ["Job", "Internship", "Scholarship"].find(j => j.toLowerCase() === qNature.toLowerCase());
      if (match) return match;
    }
    if (window.location.pathname.includes("/internship")) return "Internship";
    if (window.location.pathname.includes("/scholarship")) return "Scholarship";
    return "Job";
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [companySearch, setCompanySearch] = useState("");

  // Salary filter state
  const [salaryRanges, setSalaryRanges] = useState(DEFAULT_SALARY_RANGES);
  const [selectedSalaries, setSelectedSalaries] = useState([]);
  const [selectedFreshness, setSelectedFreshness] = useState("");

  // Sidebar dynamic ordering (active/chosen filters rise to top)
  const [chosenFilterOrder, setChosenFilterOrder] = useState([]);

  // Derived - lightweight list replacing heavy cities-list package
  const [allCities] = useState(POPULAR_CITIES);
  const [locationCountsMap, setLocationCountsMap] = useState({});

  /** -------------------- EFFECTS -------------------- **/
  useEffect(() => {
    fetchCourses();
    fetchCompanies();
    fetchSalaryRanges();
    fetchLocationCounts();
  }, []);

  const fetchLocationCounts = async () => {
    try {
      const res = await getLocationCounts();
      if (res?.data?.data) {
        setLocationCountsMap(res.data.data);
      }
    } catch {
      // fallback to DEFAULT_LOCATION_DATA
    }
  };

  const fetchSalaryRanges = async () => {
    try {
      const res = await getSalaryRanges();
      const list = res?.data?.data;
      if (Array.isArray(list) && list.length > 0) {
        setSalaryRanges(list);
      }
    } catch (err) {
      console.warn("Could not load salary ranges:", err?.message);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await getUniqueCompanies();
      const raw = res?.data?.data || [];
      const cleanRaw = raw.filter(isCleanCompanyName);

      const seen = new Set();
      const merged = [];

      // Top curated MNCs first
      POPULAR_COMPANIES.forEach((name) => {
        const lower = name.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          merged.push({ label: name, value: name });
        }
      });

      // Clean registered companies from backend
      cleanRaw.forEach((name) => {
        let trimmed = name.trim();
        if (
          trimmed.toLowerCase() === "tata consultancy services" ||
          trimmed.toLowerCase() === "tcs (tata consultancy services)"
        ) {
          trimmed = "TCS";
        }
        const lower = trimmed.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          merged.push({ label: trimmed, value: trimmed });
        }
      });

      setCompanyOptions(merged);
    } catch (err) {
      console.log("Error loading companies:", err);
      setCompanyOptions(POPULAR_COMPANIES.map(name => ({ label: name, value: name })));
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await getAllCourses();
      setCourses(res);
    } catch (error) {
      console.log("Error loading courses:", error);
    }
  };



  // Categories (with custom merge preserved)
  useEffect(() => {
    (async () => {
      try {
        const res = await getJobCategoryData({ min_jobs: 4 });
        const rawBackend = res?.data?.data || [];
        const uniqueNames = [...new Set(rawBackend.map(item => item?.category_name).filter(Boolean))];
        const backend = uniqueNames.map(name => ({ label: name, value: name }));

        backend.sort((a, b) =>
          String(a.label).localeCompare(String(b.label), "en", { sensitivity: "base" })
        );

        setJobCategoryOptions(backend);
      } catch {
        // silent
      }
    })();
  }, []);

  // 1. URL --> State (Standardized parsing - ONLY runs on initial page load / reload & popstate)
  const parseUrlToState = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;

    let nature = "Job";
    let locations = [];
    let categories = [];
    let types = [];
    let diversity = [];
    let userType = "";
    let salaries = [];

    // Parse Nature
    if (currentPath.includes("/internship")) nature = "Internship";
    else if (currentPath.includes("/scholarship")) nature = "Scholarship";

    // Parse Query Parameters (Multi-filter support)
    const queryParams = new URLSearchParams(currentSearch);
    const qLocations = [...queryParams.getAll('l'), ...queryParams.getAll('location')];
    const qCategories = queryParams.getAll('c');
    const qCompanies = queryParams.getAll('co');
    const qDiversity = [...queryParams.getAll('g'), ...queryParams.getAll('gender'), ...queryParams.getAll('diversity')];
    const qTypes = [...queryParams.getAll('t'), ...queryParams.getAll('type'), ...queryParams.getAll('workplace_type')];
    const qSalaries = [...queryParams.getAll('s'), ...queryParams.getAll('salary')];
    const qExperience = queryParams.get('experience');
    const qUserType = queryParams.get('userType');
    const qSearch = queryParams.get('q');
    const qNature = queryParams.get('job_nature');

    if (qNature) {
      const matchedNature = jobNature.find(j => j.toLowerCase() === qNature.toLowerCase());
      if (matchedNature) nature = matchedNature;
    }
    if (qLocations.length > 0) locations = qLocations;
    if (qCategories.length > 0) categories = qCategories;
    if (qTypes.length > 0) types = qTypes;
    if (qDiversity.length > 0) diversity = qDiversity;
    if (qSalaries.length > 0) salaries = qSalaries;
    const qFreshness = queryParams.get('freshness') || "";
    const qSort = queryParams.get('sort');
    if (qSort) {
      setSelectedSort(qSort);
    }
    if (qUserType) userType = qUserType;
    if (qSearch) {
      setSearchTerm(qSearch);
    } else {
      setSearchTerm("");
    }

    if (qExperience !== null && qExperience !== undefined) {
      if (typeof qExperience === 'string' && qExperience.toLowerCase() === 'internship') {
        nature = "Internship";
      } else {
        const expVal = parseInt(qExperience);
        if (expVal === 0) userType = "Fresher";
        else if (expVal > 0) userType = "Experienced";
      }
    }

    let companiesParsed = [];
    if (qCompanies.length > 0) companiesParsed = qCompanies;

    // Parse Slug
    if (filterSlug) {
      const cityMap = {
        "bangalore": "Bangalore", "delhi": "Delhi", "hyderabad": "Hyderabad",
        "gurgaon": "Gurgaon", "kolkata": "Kolkata", "mumbai": "Mumbai", "chennai": "Chennai"
      };

      if (filterSlug === "work-from-home") {
        types = ["Work From Home"];
      } else if (cityMap[filterSlug.toLowerCase()]) {
        const cityVal = allCities.find(c => c.value.toLowerCase() === filterSlug.toLowerCase())?.value || cityMap[filterSlug.toLowerCase()];
        if (cityVal && !locations.includes(cityVal)) locations.push(cityVal);
      } else if (filterSlug.includes("-in-")) {
        const parts = filterSlug.split("-in-");
        const cityKey = parts[parts.length - 1];
        const cityVal = allCities.find(c => c.value.toLowerCase() === cityKey)?.value || cityMap[cityKey];
        if (cityVal && !locations.includes(cityVal)) locations.push(cityVal);
      } else if (filterSlug === "fresher-jobs" || filterSlug.startsWith("fresher-jobs-in-")) {
        userType = "Fresher";
        if (filterSlug.includes("-in-")) {
          const cityKey = filterSlug.split("-in-")[1];
          const cityVal = allCities.find(c => c.value.toLowerCase() === cityKey)?.value || cityMap[cityKey];
          if (cityVal && !locations.includes(cityVal)) locations.push(cityVal);
        }
      } else if (filterSlug === "experienced-jobs") {
        userType = "Experienced";
      } else if (filterSlug === "college-students-jobs") {
        userType = "College Students";
      } else if (filterSlug.endsWith("-jobs")) {
        const catKey = filterSlug.replace("-jobs", "");
        if (catKey === "it") { if (!categories.includes("IT & Software")) categories.push("IT & Software"); }
        else if (catKey === "fresher") userType = "Fresher";
        else if (catKey === "full-stack-development") { if (!categories.includes("Full Stack Development")) categories.push("Full Stack Development"); }
        else if (catKey === "devops-cloud-computing") { if (!categories.includes("DevOps & Cloud Computing")) categories.push("DevOps & Cloud Computing"); }
        else if (catKey === "data-science-analytics") { if (!categories.includes("Data Science & Analytics")) categories.push("Data Science & Analytics"); }
        else if (catKey === "frontend-development") { if (!categories.includes("Frontend Development")) categories.push("Frontend Development"); }
        else if (catKey === "hr-analytics") { if (!categories.includes("HR Analytics")) categories.push("HR Analytics"); }
        else if (catKey === "software-development") { if (!categories.includes("Software Development")) categories.push("Software Development"); }
        else if (catKey === "ui-ux-design") { if (!categories.includes("UI/UX Design")) categories.push("UI/UX Design"); }
        else {
          const matched = jobCategoryOptions.find(c => generateSlug(c.value) === catKey);
          if (matched && !categories.includes(matched.value)) categories.push(matched.value);
        }
      } else {
        const cityVal = allCities.find(c => c.value.toLowerCase() === filterSlug.toLowerCase())?.value;
        if (cityVal && !locations.includes(cityVal)) locations.push(cityVal);
      }
    }

    setJobNatureSelected(nature);
    setSelectedLocations(locations);
    setSelectedCategories(categories);
    setSelectedTypes(types);
    setSelectedDiversity(diversity);
    setSelectedUserType(userType);
    setSelectedCompanies(companiesParsed);
    setSelectedSalaries(salaries);
    setSelectedFreshness(qFreshness);

    // Initial chosen order setup for active filters on reload
    const initialChosen = [];
    if (categories.length > 0) initialChosen.push('category');
    if (userType) initialChosen.push('experience');
    if (types.length > 0) initialChosen.push('workMode');
    if (locations.length > 0) initialChosen.push('location');
    if (salaries.length > 0) initialChosen.push('salary');
    if (companiesParsed.length > 0) initialChosen.push('company');
    if (qFreshness) initialChosen.push('freshness');
    if (diversity.length > 0) initialChosen.push('gender');
    if (nature && nature !== "Job") initialChosen.push('postType');
    if (initialChosen.length > 0) {
      setChosenFilterOrder(initialChosen);
    }
  }, [filterSlug, allCities, jobCategoryOptions]);

  // Initial load / reload & popstate ONLY - NEVER triggers on accordion toggle or simple re-render
  const initialUrlParsedRef = React.useRef(false);
  useEffect(() => {
    if (!initialUrlParsedRef.current) {
      initialUrlParsedRef.current = true;
      parseUrlToState();
    }

    const handlePopState = () => {
      parseUrlToState();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [parseUrlToState]);

  // 2. State --> URL Sync
  const syncFilterUrl = (overrides = {}) => {
    const nature = overrides.hasOwnProperty('nature') ? overrides.nature : jobNatureSelected;
    const locations = overrides.hasOwnProperty('locations') ? overrides.locations : selectedLocations;
    const categories = overrides.hasOwnProperty('categories') ? overrides.categories : selectedCategories;
    const types = overrides.hasOwnProperty('types') ? overrides.types : selectedTypes;
    const diversity = overrides.hasOwnProperty('diversity') ? overrides.diversity : selectedDiversity;
    const userType = overrides.hasOwnProperty('userType') ? overrides.userType : selectedUserType;
    const companies = overrides.hasOwnProperty('companies') ? overrides.companies : selectedCompanies;
    const salaries = overrides.hasOwnProperty('salaries') ? overrides.salaries : selectedSalaries;
    const freshness = overrides.hasOwnProperty('freshness') ? overrides.freshness : selectedFreshness;
    const sort = overrides.hasOwnProperty('sort') ? overrides.sort : selectedSort;
    const search = overrides.hasOwnProperty('searchTerm') ? overrides.searchTerm : searchTerm;

    const isJobFilterRoute = location.pathname === "/job-filter" || location.pathname === "/internship-filter";

    if (isJobFilterRoute) {
      const queryParams = new URLSearchParams();
      if (nature) queryParams.set('job_nature', nature);
      if (locations.length > 0) locations.forEach(l => queryParams.append('l', l));
      if (categories.length > 0) categories.forEach(c => queryParams.append('c', c));
      if (types.length > 0) types.forEach(t => queryParams.append('t', t));
      if (diversity.length > 0) diversity.forEach(d => queryParams.append('g', d));
      if (companies.length > 0) companies.forEach(co => queryParams.append('co', co));
      if (salaries.length > 0) salaries.forEach(s => queryParams.append('s', s));
      if (freshness) queryParams.set('freshness', freshness);
      if (sort && sort !== 'recommended') queryParams.set('sort', sort);
      if (userType) queryParams.set('userType', userType);
      if (search) queryParams.set('q', search);

      const qStr = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const currentPath = typeof window !== "undefined" ? window.location.pathname : location.pathname;
      const targetUrl = `${currentPath}${qStr}`;

      if (typeof window !== "undefined") {
        const cur = window.location.pathname + window.location.search;
        if (cur !== targetUrl) {
          skipUrlSyncRef.current = true;
          lastSlugRef.current = targetUrl;
          window.history.replaceState(null, '', targetUrl);
        }
      }
      return;
    }

    const baseMap = { "Job": "jobs", "Internship": "internship", "Scholarship": "scholarship" };
    const base = baseMap[nature] || "jobs";

    let slug = "";
    const topCities = ["Bangalore", "Bengaluru", "Delhi", "NCR", "Hyderabad", "Gurgaon", "Gurugram", "Kolkata", "Mumbai", "Chennai"];

    const prefixMap = { "Job": "jobs-in-", "Internship": "internships-in-", "Scholarship": "scholarships-in-" };
    const prefix = prefixMap[nature] || "jobs-in-";

    // Hierarchy of Slugs (Priority: UserType > WorkMode > Location > Category)
    if (userType === "Fresher") {
      if (locations.length === 1 && topCities.includes(locations[0])) slug = `fresher-jobs-in-${generateSlug(locations[0])}`;
      else slug = "fresher-jobs";
    } else if (userType === "Experienced") slug = "experienced-jobs";
    else if (userType === "College Students") slug = "college-students-jobs";
    else if (types.includes("Work From Home") && types.length === 1) slug = "work-from-home";
    else if (locations.length === 1 && topCities.includes(locations[0])) slug = `${prefix}${generateSlug(locations[0])}`;
    else if (categories.length === 1) slug = `${generateSlug(categories[0])}-jobs`;

    // Handle Query Params for Multi-select
    const queryParams = new URLSearchParams();

    // If multiple locations or single but not top city, use query param
    if (locations.length > 1) {
      locations.forEach(l => queryParams.append('l', l));
    } else if (locations.length === 1 && !slug.includes(generateSlug(locations[0]))) {
      queryParams.append('l', locations[0]);
    }

    // If multiple categories or single but no slug, use query param
    if (categories.length > 1) {
      categories.forEach(c => queryParams.append('c', c));
    } else if (categories.length === 1 && !slug.includes("-jobs")) {
      queryParams.append('c', categories[0]);
    }

    if (diversity.length > 0) {
      diversity.forEach(d => queryParams.append('g', d));
    }

    if (companies.length > 0) {
      companies.forEach(co => queryParams.append('co', co));
    }

    if (salaries.length > 0) {
      salaries.forEach(s => queryParams.append('s', s));
    }

    if (freshness) {
      queryParams.set('freshness', freshness);
    }

    if (sort && sort !== 'recommended') {
      queryParams.set('sort', sort);
    }

    if (search) {
      queryParams.append('q', search);
    }

    const qStr = queryParams.toString() ? `?${queryParams.toString()}` : "";
    const targetBase = slug && nature === "Internship" ? "internships" : base;
    const targetUrl = slug ? `/${targetBase}/${slug}${qStr}` : `/${targetBase}${qStr}`;

    if (typeof window !== "undefined") {
      const cur = window.location.pathname + window.location.search;
      if (cur !== targetUrl) {
        skipUrlSyncRef.current = true;
        lastSlugRef.current = targetUrl;
        window.history.replaceState(null, '', targetUrl);
      }
    }
  };

  // Fetch jobs when filters change (reset to page 1) with DEBOUNCE
  useEffect(() => {
    if (!jobNatureSelected) return;

    // Set loading immediately to show neat card skeletons in the list
    setLoading(true);

    // Construct fresh payload immediately to avoid closure staleness
    const freshPayload = {
      ...(selectedCategories.length > 0 ? { job_categories: selectedCategories } : {}),
      ...(selectedTypes.length > 0 ? { workplace_type: selectedTypes } : {}),
      ...(selectedLocations.length > 0 ? { work_location: selectedLocations } : {}),
      ...(selectedSalaries.length > 0 ? { salary_ranges: selectedSalaries } : {}),
      ...(selectedDiversity.length > 0 ? { diversity_hiring: selectedDiversity } : {}),
      ...(selectedWorkingDays ? { working_days: selectedWorkingDays } : {}),
      ...(selectedStatus ? { status: selectedStatus } : {}),
      ...(jobNatureSelected ? { job_nature: jobNatureSelected } : {}),
      ...(selectedUserType ? { experience_type: selectedUserType } : {}),
      ...(searchTerm ? { searchTerm: searchTerm } : {}),
      ...(selectedCompanies.length > 0 ? { companies: selectedCompanies } : {}),
      ...(selectedFreshness ? {
        freshness: selectedFreshness,
        start_date: new Date(Date.now() - (parseInt(selectedFreshness, 10) || 30) * 86400000).toISOString().split('T')[0],
      } : {}),
      ...(selectedSort === "highToLow" || selectedSort === "lowToHigh"
        ? { salary_sort: selectedSort }
        : { sort_by: selectedSort || "recommended" }),
    };

    const timer = setTimeout(() => {
      fetchJobs(1, true, freshPayload);
    }, 180);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCategories.join("|"),
    selectedTypes.join("|"),
    selectedLocations.join("|"),
    selectedSalaries.join("|"),
    selectedDiversity.join("|"),
    selectedWorkingDays,
    selectedStatus,
    selectedSort,
    jobNatureSelected,
    selectedUserType,
    searchTerm,
    selectedCompanies.join("|"),
    selectedFreshness,
  ]);


  // Page-based navigation helper


  const payload = useMemo(
    () => {
      const p = {};
      if (selectedCategories.length > 0) p.job_categories = selectedCategories;
      if (selectedTypes.length > 0) p.workplace_type = selectedTypes;
      if (selectedLocations.length > 0) p.work_location = selectedLocations;
      if (selectedSalaries.length > 0) p.salary_ranges = selectedSalaries;
      if (selectedWorkingDays) p.working_days = selectedWorkingDays;
      if (selectedStatus) p.status = selectedStatus;
      if (jobNatureSelected) p.job_nature = jobNatureSelected;
      if (selectedUserType) p.experience_type = selectedUserType;
      if (searchTerm) p.searchTerm = searchTerm;
      if (selectedCompanies.length > 0) p.companies = selectedCompanies;
      if (selectedFreshness) {
        p.freshness = selectedFreshness;
        p.start_date = new Date(Date.now() - (parseInt(selectedFreshness, 10) || 30) * 86400000).toISOString().split('T')[0];
      }
      if (selectedSort === "highToLow" || selectedSort === "lowToHigh") {
        p.salary_sort = selectedSort;
      } else {
        p.sort_by = selectedSort || "recommended";
      }
      return p;
    },
    [
      selectedCategories,
      selectedTypes,
      selectedLocations,
      selectedSalaries,
      selectedWorkingDays,
      selectedStatus,
      jobNatureSelected,
      selectedUserType,
      selectedSort,
      searchTerm,
      selectedCompanies,
      selectedFreshness,
    ]
  );

  const filteredCategoryOptions = useMemo(() => {
    return jobCategoryOptions.filter((item) =>
      item.label.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [jobCategoryOptions, categorySearch]);

  const allDepartmentOptions = useMemo(() => {
    const map = new Map();
    DEFAULT_DEPARTMENT_DATA.forEach(d => map.set(d.value.toLowerCase(), d));
    jobCategoryOptions.forEach(c => {
      const lower = c.value.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, { label: c.label, value: c.value, count: c.count || 12 });
      }
    });
    return Array.from(map.values());
  }, [jobCategoryOptions]);

  const allLocationOptions = useMemo(() => {
    const map = new Map();
    DEFAULT_LOCATION_DATA.forEach(l => {
      const lower = l.value.toLowerCase();
      const realCount = locationCountsMap[lower] !== undefined ? locationCountsMap[lower] : l.count;
      map.set(lower, { ...l, count: realCount });
    });
    allCities.forEach(c => {
      const lower = c.value.toLowerCase();
      if (!map.has(lower)) {
        const realCount = locationCountsMap[lower] || 0;
        map.set(lower, { label: c.label, value: c.value, count: realCount });
      }
    });
    return Array.from(map.values());
  }, [allCities, locationCountsMap]);

  const allCompanyOptions = useMemo(() => {
    const map = new Map();
    DEFAULT_COMPANY_DATA.forEach(c => map.set(c.value.toLowerCase(), c));
    companyOptions.forEach(c => {
      const lower = c.value.toLowerCase();
      if (!map.has(lower)) {
        map.set(lower, { label: c.label, value: c.value, count: c.count || 20 });
      }
    });
    return Array.from(map.values());
  }, [companyOptions]);

  // Derived lists for Sidebar to show selected items correctly
  const displayLocations = useMemo(() => {
    const top = allLocationOptions.slice(0, 6).map(c => c.value);
    const combined = [...new Set([...top, ...selectedLocations])];
    return combined.map(val => {
      const loc = allLocationOptions.find(c => c.value.toLowerCase() === String(val).toLowerCase());
      return { value: val, label: loc ? loc.label : val, count: loc?.count ?? 0 };
    });
  }, [allLocationOptions, selectedLocations]);

  const displaySalaries = useMemo(() => {
    const top = salaryRanges.slice(0, 4).map(s => s.value);
    const combined = [...new Set([...top, ...selectedSalaries])];
    return combined.map(val => {
      const item = salaryRanges.find(s => s.value === val);
      return { value: val, label: item ? item.label : val, count: item?.count ?? 0 };
    });
  }, [salaryRanges, selectedSalaries]);

  const displayCategories = useMemo(() => {
    if (categorySearch) {
      // When searching, show results + already selected items
      const combined = [...selectedCategories, ...filteredCategoryOptions.map(o => o.value)];
      const unique = [...new Set(combined)].slice(0, 15);
      return unique.map(val => {
        const cat = allDepartmentOptions.find(c => c.value.toLowerCase() === String(val).toLowerCase());
        return { value: val, label: cat ? cat.label : val, count: cat?.count ?? 0 };
      });
    }
    const top = allDepartmentOptions.slice(0, 4).map(c => c.value);
    const combined = [...new Set([...top, ...selectedCategories])];
    return combined.map(val => {
      const cat = allDepartmentOptions.find(c => c.value.toLowerCase() === String(val).toLowerCase());
      return { value: val, label: cat ? cat.label : val, count: cat?.count ?? 0 };
    });
  }, [allDepartmentOptions, selectedCategories, categorySearch, filteredCategoryOptions]);

  const filteredCompanyOptions = useMemo(() => {
    if (!companySearch) return companyOptions;
    const q = companySearch.toLowerCase().trim();
    return companyOptions.filter(c => {
      const labelLower = c.label.toLowerCase();
      if (labelLower.includes(q)) return true;
      if (labelLower === "tcs" && "tata consultancy services".includes(q)) return true;
      if (labelLower.includes("l&t") && "larsen & toubro".includes(q)) return true;
      return false;
    });
  }, [companyOptions, companySearch]);

  const displayCompanies = useMemo(() => {
    if (companySearch) {
      const combined = [...selectedCompanies, ...filteredCompanyOptions.map(o => o.value)];
      const unique = [...new Set(combined)].slice(0, 15);
      return unique.map(val => {
        const co = allCompanyOptions.find(c => c.value.toLowerCase() === String(val).toLowerCase());
        return { value: val, label: co ? co.label : val, count: co?.count ?? 0 };
      });
    }
    const top = allCompanyOptions.slice(0, 6).map(c => c.value);
    const combined = [...new Set([...top, ...selectedCompanies])];
    return combined.map(val => {
      const co = allCompanyOptions.find(c => c.value.toLowerCase() === String(val).toLowerCase());
      return { value: val, label: co ? co.label : val, count: co?.count ?? 0 };
    });
  }, [allCompanyOptions, selectedCompanies, companySearch, filteredCompanyOptions]);


  const transformJob = (job) => {
    const postedDate = new Date(job.created_at);
    const today = new Date();
    const daysPassed = Math.floor((today - postedDate) / (1000 * 60 * 60 * 24));
    const totalActiveDays = 355;
    const daysLeft = totalActiveDays - daysPassed;

    const safeQs = Array.isArray(job?.questions) ? job.questions : [];

    let parsedLocation = "N/A";
    const rawLoc = job.work_location;
    if (rawLoc) {
      if (Array.isArray(rawLoc)) {
        const valid = rawLoc.map(l => String(l || "").trim()).filter(l => l && l !== "[]" && l !== '""' && l !== "null" && l !== "undefined");
        if (valid.length > 0) parsedLocation = valid.join(", ");
      } else if (typeof rawLoc === "string") {
        const trimmed = rawLoc.trim();
        if (trimmed && trimmed !== "[]" && trimmed !== '""' && trimmed !== "null" && trimmed !== "undefined") {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              const valid = parsed.map(l => String(l || "").trim()).filter(l => l && l !== "[]" && l !== '""' && l !== "null" && l !== "undefined");
              if (valid.length > 0) parsedLocation = valid.join(", ");
            } else if (parsed && typeof parsed === "string") {
              const pTrimmed = parsed.trim();
              if (pTrimmed && pTrimmed !== "[]" && pTrimmed !== "null") parsedLocation = pTrimmed;
            } else {
              parsedLocation = trimmed;
            }
          } catch {
            parsedLocation = trimmed;
          }
        }
      }
    }

    const isIntern = isInternshipOpportunity(job, { jobNatureSelected });

    return {
      id: job.id,
      title: (job.job_title && job.job_title.trim()) || "N/A",
      company: (job.company_name && job.company_name.trim()) || "N/A",
      logo: job.company_logo,
      job_description: job.job_description,
      date_posted: job.date_posted,
      working_days: job.working_days,
      daysLeft: daysLeft >= 0 ? `${daysLeft} days left` : "Expired",
      level: isIntern ? "Internship" : ((job.experience_type && job.experience_type.trim()) || "N/A"),
      salary:
        job.salary_type === "Fixed"
          ? (!job.min_salary || String(job.min_salary) === "0") ? "Not Disclosed" : `${getCurrencySymbol(job.currency)} ${job.min_salary || "N/A"} ${job.salary_duration?.toLowerCase() === "monthly" ? "Per Month" : "LPA"}`
          : job.salary_type === "Range"
            ? ((!job.min_salary || String(job.min_salary) === "0") && (!job.max_salary || String(job.max_salary) === "0")) ? "Not Disclosed" : `${getCurrencySymbol(job.currency)} ${job.min_salary || "N/A"} - ${job.max_salary || "N/A"} ${job.salary_duration?.toLowerCase() === "monthly" ? "Per Month" : "LPA"}`
            : "Not Disclosed",
      location: parsedLocation,
      diversity_hiring: job.diversity_hiring || [],
      job_category: job.job_category,
      type: job.job_nature,
      openings: job.openings,
      benefits: job.benefits || [],
      skills: job.skills || [],
      eligibility: job.experience_required?.join(", "),
      status: daysLeft >= 0 ? "Live" : "Expired",
      // keeping questions mapping harmlessly, though not used in UI now
      raw_location: job.work_location,
      raw_workplace_type: job.workplace_type,
      raw_experience_required: job.experience_required,
      questions: safeQs.map((q) => q?.question || ""),
      questions_with_ids: safeQs.map((q) => ({
        id: q?.id || null,
        question: q?.question || "",
        isrequired: !!q?.isrequired,
      })),
    };
  };

  const fetchJobs = async (passedPage = 1, isReset = false, customPayload = null) => {
    setLoading(true);
    setPage(passedPage);

    const requestId = ++fetchRequestId.current;

    try {
      const activePayload = customPayload || payload;
      const paginatedPayload = {
        ...activePayload,
        page: passedPage,
        limit: 20,
      };

      const res = await getJobPosts(paginatedPayload);
      if (requestId !== fetchRequestId.current) return;

      const raw = res?.data?.data?.data || (Array.isArray(res?.data?.data) ? res.data.data : []) || (Array.isArray(res?.data) ? res.data : []);
      const meta = res?.data?.data?.meta || res?.data?.meta || {};
      const hasMoreOnBackend = meta.hasMore !== undefined ? meta.hasMore : false;
      const backendTotal = meta.total !== undefined ? meta.total : (Array.isArray(raw) ? raw.length : 0);

      const transformedBatch = raw.map(transformJob);

      setJobs(transformedBatch);
      setActiveJob(transformedBatch[0] || null);
      setTotalJobs(backendTotal);
      setHasMore(hasMoreOnBackend);
      setPage(passedPage);

    } catch (err) {
      console.error("Fetch jobs error:", err);
      setJobs([]);
      setTotalJobs(0);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalJobs / 20));

  const pageNumbers = useMemo(() => {
    if (totalPages <= 10) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 6) {
      return [1, 2, 3, 4, 5, 6, 7, 8, '...', totalPages];
    }
    if (page >= totalPages - 5) {
      const start = totalPages - 7;
      const pages = [];
      for (let i = start; i <= totalPages; i++) {
        pages.push(i);
      }
      return [1, '...', ...pages];
    }
    return [1, '...', page - 2, page - 1, page, page + 1, page + 2, '...', totalPages];
  }, [page, totalPages]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page || loading) return;
    fetchJobs(newPage, true);
    if (typeof window !== "undefined") {
      const topTarget = document.querySelector('.naukri-job-list-wrapper') || document.querySelector('.naukri-results-info');
      if (topTarget) {
        const topOffset = topTarget.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const getFilterTitle = () => {
    const natureSuffix = jobNatureSelected === "Job" ? "Jobs" : jobNatureSelected === "Internship" ? "Internships" : jobNatureSelected === "Scholarship" ? "Scholarships" : "Opportunities";

    if (searchTerm && searchTerm.trim() !== "") {
      return `${searchTerm.trim()} ${natureSuffix}`;
    }

    if (selectedCompanies.length === 1 && selectedLocations.length === 1) {
      return `${selectedCompanies[0]} ${natureSuffix} in ${selectedLocations[0]}`;
    }
    if (selectedCompanies.length === 1) {
      return `${selectedCompanies[0]} ${natureSuffix}`;
    }

    if (selectedCategories.length === 1 && selectedLocations.length === 1) {
      return `${selectedCategories[0]} ${natureSuffix} in ${selectedLocations[0]}`;
    }
    if (selectedCategories.length === 1) {
      return `${selectedCategories[0]} ${natureSuffix}`;
    }
    if (selectedLocations.length === 1) {
      return `${natureSuffix} in ${selectedLocations[0]}`;
    }
    if (selectedCategories.length > 1) {
      return `${selectedCategories[0]} & More ${natureSuffix}`;
    }

    // Slug based titles
    if (filterSlug) {
      if (filterSlug === "work-from-home") return `Work From Home ${natureSuffix}`;
      if (filterSlug.includes("bangalore")) return `${natureSuffix} in Bangalore`;
      if (filterSlug.includes("delhi")) return `${natureSuffix} in Delhi`;
      if (filterSlug.includes("hyderabad")) return `${natureSuffix} in Hyderabad`;
      if (filterSlug.includes("gurgaon")) return `${natureSuffix} in Gurgaon`;
      if (filterSlug.includes("kolkata")) return `${natureSuffix} in Kolkata`;
      if (filterSlug.includes("mumbai")) return `${natureSuffix} in Mumbai`;
      if (filterSlug.includes("chennai")) return `${natureSuffix} in Chennai`;
      if (filterSlug === "it-jobs") return `IT & Software ${natureSuffix}`;
      if (filterSlug === "marketing-jobs") return `Marketing ${natureSuffix}`;
      if (filterSlug === "fresher-jobs") return `Fresher ${natureSuffix}`;

      // Dynamic slug formatter (e.g. "react-js-jobs" -> "React Js Jobs")
      const cleanSlug = filterSlug.replace(/-jobs$/, "").replace(/-internships$/, "").replace(/-scholarships$/, "");
      const formatted = cleanSlug
        .split("-")
        .filter(Boolean)
        .map(word => {
          if (word.toLowerCase() === "js") return "JS";
          if (word.toLowerCase() === "ui" || word.toLowerCase() === "ux") return word.toUpperCase();
          if (word.toLowerCase() === "it") return "IT";
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");

      if (formatted) {
        return `${formatted} ${natureSuffix}`;
      }
    }

    return `${natureSuffix}`;
  };

  const sortMenuItems = useMemo(() => [
    {
      key: 'recommended',
      label: <div className={`naukri-sort-dropdown-item ${selectedSort === 'recommended' || !selectedSort ? 'active' : ''}`}>Recommended</div>,
    },
    {
      key: 'relevance',
      label: <div className={`naukri-sort-dropdown-item ${selectedSort === 'relevance' ? 'active' : ''}`}>Relevance</div>,
    },
    {
      key: 'date',
      label: <div className={`naukri-sort-dropdown-item ${selectedSort === 'date' ? 'active' : ''}`}>Date</div>,
    },
  ], [selectedSort]);

  const getSortLabel = (key) => {
    switch (key) {
      case 'date': return 'Date';
      case 'relevance': return 'Relevance';
      case 'recommended':
      default: return 'Recommended';
    }
  };

  const handleClearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedTypes([]);
    setSelectedLocations([]);
    setSelectedSalaries([]);
    setSelectedDiversity([]);
    setSelectedWorkingDays("");
    setSelectedStatus("");
    setSelectedSort("recommended");
    setSelectedUserType("");
    setSelectedCompanies([]);
    setSelectedFreshness("");
    setSearchTerm("");
    setChosenFilterOrder([]);
    setMobileFilterOpen(false);
    skipUrlSyncRef.current = true;
    lastSlugRef.current = "";

    // Clear header search states
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("clearHeaderSearch"));
    }

    const baseMap = { "Job": "jobs", "Internship": "internship", "Scholarship": "scholarship" };
    const base = baseMap[jobNatureSelected] || "jobs";
    const targetUrl = location.pathname === "/job-filter" || location.pathname === "/internship-filter"
      ? `${location.pathname}?job_nature=${jobNatureSelected}`
      : `/${base}`;
    if (typeof window !== "undefined") {
      window.history.replaceState(null, '', targetUrl);
    }
  };

  useEffect(() => {
    const handleClearFromHeader = () => {
      setSearchTerm("");
    };
    window.addEventListener("clearHeaderSearch", handleClearFromHeader);
    return () => window.removeEventListener("clearHeaderSearch", handleClearFromHeader);
  }, []);

  /** -------------------- DYNAMIC PRIORITY FILTER ORDER LOGIC -------------------- **/
  const markFilterChosen = (key) => {
    setChosenFilterOrder((prev) => {
      const next = prev.filter((k) => k !== key);
      return [key, ...next];
    });
  };

  const isFilterActive = (key) => {
    switch (key) {
      case 'category':
        return selectedCategories.length > 0;
      case 'experience':
        return Boolean(selectedUserType);
      case 'workMode':
        return selectedTypes.length > 0;
      case 'location':
        return selectedLocations.length > 0;
      case 'salary':
        return selectedSalaries.length > 0;
      case 'company':
        return selectedCompanies.length > 0;
      case 'freshness':
        return Boolean(selectedFreshness);
      case 'gender':
        return selectedDiversity.length > 0;
      case 'postType':
        return Boolean(jobNatureSelected && jobNatureSelected !== 'Job');
      default:
        return false;
    }
  };

  const getAppliedCount = (key) => {
    switch (key) {
      case 'category':
        return selectedCategories.length;
      case 'experience':
        return selectedUserType ? 1 : 0;
      case 'workMode':
        return selectedTypes.length;
      case 'location':
        return selectedLocations.length;
      case 'salary':
        return selectedSalaries.length;
      case 'company':
        return selectedCompanies.length;
      case 'freshness':
        return selectedFreshness ? 1 : 0;
      case 'gender':
        return selectedDiversity.length;
      case 'postType':
        return jobNatureSelected && jobNatureSelected !== 'Job' ? 1 : 0;
      default:
        return 0;
    }
  };

  const totalAppliedCount = useMemo(() => {
    return (
      selectedCategories.length +
      (selectedUserType ? 1 : 0) +
      selectedTypes.length +
      selectedLocations.length +
      selectedSalaries.length +
      selectedCompanies.length +
      (selectedFreshness ? 1 : 0) +
      selectedDiversity.length +
      (jobNatureSelected && jobNatureSelected !== 'Job' ? 1 : 0)
    );
  }, [
    selectedCategories,
    selectedUserType,
    selectedTypes,
    selectedLocations,
    selectedSalaries,
    selectedCompanies,
    selectedFreshness,
    selectedDiversity,
    jobNatureSelected,
  ]);

  const appliedFilterItems = useMemo(() => {
    const list = [];

    // 1. Categories / Departments
    selectedCategories.forEach((catVal) => {
      const opt = allDepartmentOptions.find(
        (c) => c.value.toLowerCase() === String(catVal).toLowerCase()
      );
      list.push({
        id: `cat-${catVal}`,
        label: opt ? opt.label : catVal,
        count: opt?.count,
        onRemove: () => {
          const next = selectedCategories.filter((c) => c !== catVal);
          setSelectedCategories(next);
          if (next.length === 0) {
            setChosenFilterOrder((prev) => prev.filter((k) => k !== 'category'));
          }
          syncFilterUrl({ categories: next });
        },
      });
    });

    // 2. Experience
    if (selectedUserType) {
      const label = isNaN(Number(selectedUserType))
        ? selectedUserType
        : `${selectedUserType} Yrs`;
      list.push({
        id: `exp-${selectedUserType}`,
        label,
        count: undefined,
        onRemove: () => {
          setSelectedUserType('');
          setChosenFilterOrder((prev) => prev.filter((k) => k !== 'experience'));
          syncFilterUrl({ userType: '' });
        },
      });
    }

    // 3. Work mode
    selectedTypes.forEach((typeVal) => {
      list.push({
        id: `mode-${typeVal}`,
        label: typeVal,
        count: undefined,
        onRemove: () => {
          const next = selectedTypes.filter((t) => t !== typeVal);
          setSelectedTypes(next);
          if (next.length === 0) {
            setChosenFilterOrder((prev) => prev.filter((k) => k !== 'workMode'));
          }
          syncFilterUrl({ types: next });
        },
      });
    });

    // 4. Locations
    selectedLocations.forEach((locVal) => {
      const opt = allLocationOptions.find(
        (c) => c.value.toLowerCase() === String(locVal).toLowerCase()
      );
      list.push({
        id: `loc-${locVal}`,
        label: opt ? opt.label : locVal,
        count: opt?.count,
        onRemove: () => {
          const next = selectedLocations.filter((l) => l !== locVal);
          setSelectedLocations(next);
          if (next.length === 0) {
            setChosenFilterOrder((prev) => prev.filter((k) => k !== 'location'));
          }
          syncFilterUrl({ locations: next });
        },
      });
    });

    // 5. Salaries
    selectedSalaries.forEach((salVal) => {
      const opt = salaryRanges.find((s) => s.value === salVal);
      list.push({
        id: `sal-${salVal}`,
        label: opt ? opt.label : salVal,
        count: opt?.count,
        onRemove: () => {
          const next = selectedSalaries.filter((s) => s !== salVal);
          setSelectedSalaries(next);
          if (next.length === 0) {
            setChosenFilterOrder((prev) => prev.filter((k) => k !== 'salary'));
          }
          syncFilterUrl({ salaries: next });
        },
      });
    });

    // 6. Companies
    selectedCompanies.forEach((compVal) => {
      const opt = allCompanyOptions.find(
        (c) => c.value.toLowerCase() === String(compVal).toLowerCase()
      );
      list.push({
        id: `comp-${compVal}`,
        label: opt ? opt.label : compVal,
        count: opt?.count,
        onRemove: () => {
          const next = selectedCompanies.filter((c) => c !== compVal);
          setSelectedCompanies(next);
          if (next.length === 0) {
            setChosenFilterOrder((prev) => prev.filter((k) => k !== 'company'));
          }
          syncFilterUrl({ companies: next });
        },
      });
    });

    // 7. Freshness
    if (selectedFreshness) {
      const opt = FRESHNESS_OPTIONS.find((f) => f.value === selectedFreshness);
      list.push({
        id: `freshness-${selectedFreshness}`,
        label: opt ? opt.label : selectedFreshness,
        count: undefined,
        onRemove: () => {
          setSelectedFreshness('');
          setChosenFilterOrder((prev) => prev.filter((k) => k !== 'freshness'));
          syncFilterUrl({ freshness: '' });
        },
      });
    }

    // 8. Gender / Diversity
    selectedDiversity.forEach((divVal) => {
      list.push({
        id: `div-${divVal}`,
        label: `${divVal} Only`,
        count: undefined,
        onRemove: () => {
          const next = selectedDiversity.filter((d) => d !== divVal);
          setSelectedDiversity(next);
          if (next.length === 0) {
            setChosenFilterOrder((prev) => prev.filter((k) => k !== 'gender'));
          }
          syncFilterUrl({ diversity: next });
        },
      });
    });

    // 9. Post type (Job Nature)
    if (jobNatureSelected && jobNatureSelected !== 'Job') {
      list.push({
        id: `nature-${jobNatureSelected}`,
        label: jobNatureSelected,
        count: undefined,
        onRemove: () => {
          setJobNatureSelected('Job');
          setChosenFilterOrder((prev) => prev.filter((k) => k !== 'postType'));
          syncFilterUrl({ nature: 'Job' });
        },
      });
    }

    return list;
  }, [
    selectedCategories,
    allDepartmentOptions,
    selectedUserType,
    selectedTypes,
    selectedLocations,
    allLocationOptions,
    selectedSalaries,
    salaryRanges,
    selectedCompanies,
    allCompanyOptions,
    selectedFreshness,
    selectedDiversity,
    jobNatureSelected,
    syncFilterUrl,
  ]);

  const resetSingleFilter = (key) => {
    switch (key) {
      case 'category':
        setSelectedCategories([]);
        syncFilterUrl({ categories: [] });
        break;
      case 'experience':
        setSelectedUserType('');
        syncFilterUrl({ userType: '' });
        break;
      case 'workMode':
        setSelectedTypes([]);
        syncFilterUrl({ types: [] });
        break;
      case 'location':
        setSelectedLocations([]);
        syncFilterUrl({ locations: [] });
        break;
      case 'salary':
        setSelectedSalaries([]);
        syncFilterUrl({ salaries: [] });
        break;
      case 'company':
        setSelectedCompanies([]);
        syncFilterUrl({ companies: [] });
        break;
      case 'freshness':
        setSelectedFreshness('');
        syncFilterUrl({ freshness: '' });
        break;
      case 'gender':
        setSelectedDiversity([]);
        syncFilterUrl({ diversity: [] });
        break;
      case 'postType':
        setJobNatureSelected('Job');
        syncFilterUrl({ nature: 'Job' });
        break;
      default:
        break;
    }
    setChosenFilterOrder((prev) => prev.filter((k) => k !== key));
  };

  const DEFAULT_FILTER_KEYS = [
    'category',
    'experience',
    'workMode',
    'location',
    'salary',
    'company',
    'gender',
    'postType',
    'freshness',
  ];

  const orderedFilterKeys = useMemo(() => {
    const activeKeys = chosenFilterOrder.filter((key) => isFilterActive(key));

    DEFAULT_FILTER_KEYS.forEach((key) => {
      if (isFilterActive(key) && !activeKeys.includes(key)) {
        activeKeys.push(key);
      }
    });

    const inactiveKeys = DEFAULT_FILTER_KEYS.filter((key) => !isFilterActive(key));

    return [...activeKeys, ...inactiveKeys];
  }, [
    chosenFilterOrder,
    selectedCategories,
    selectedUserType,
    selectedTypes,
    selectedLocations,
    selectedSalaries,
    selectedCompanies,
    selectedFreshness,
    selectedDiversity,
    jobNatureSelected,
  ]);


  const renderFilterSection = (key) => {
    const isActive = isFilterActive(key);
    const count = getAppliedCount(key);
    const defaultOpen = DEFAULT_OPEN_SECTIONS[key] ?? false;

    let title = "";
    let content = null;

    switch (key) {
      case 'category':
        title = "Department";
        content = (
          <div>
            <div>
              <Checkbox.Group
                value={selectedCategories}
                onChange={(v) => {
                  setSelectedCategories(v);
                  if (v.length > 0) markFilterChosen('category');
                  syncFilterUrl({ categories: v });
                }}
                style={{ width: "100%" }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  {displayCategories.map((opt) => (
                    <Checkbox key={opt.value} value={opt.value} className="naukri-filter-item">
                      <span className="naukri-checkbox-label" title={opt.label}>
                        <span className="naukri-checkbox-text">{opt.label}</span>
                        {opt.count !== undefined && <span className="naukri-filter-count">({opt.count})</span>}
                      </span>
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </div>
            <FilterGridPopover
              title="Department"
              searchPlaceholder="Search Department"
              options={allDepartmentOptions}
              appliedValues={selectedCategories}
              onApply={(newSelected) => {
                setSelectedCategories(newSelected);
                if (newSelected.length > 0) markFilterChosen('category');
                syncFilterUrl({ categories: newSelected });
              }}
            />
          </div>
        );
        break;

      case 'experience':
        title = "Experience";
        content = (
          <Radio.Group
            value={selectedUserType}
            onChange={(e) => {
              setSelectedUserType(e.target.value);
              markFilterChosen('experience');
              syncFilterUrl({ userType: e.target.value });
            }}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Radio value="Fresher" className="naukri-filter-item">
                <span className="naukri-checkbox-label">Fresher</span>
              </Radio>
              <Radio value="Experienced" className="naukri-filter-item">
                <span className="naukri-checkbox-label">Experienced</span>
              </Radio>
              <Radio value="College Students" className="naukri-filter-item">
                <span className="naukri-checkbox-label">College Students</span>
              </Radio>
            </Space>
          </Radio.Group>
        );
        break;

      case 'workMode':
        title = "Work mode";
        content = (
          <Checkbox.Group
            value={selectedTypes}
            onChange={(v) => {
              setSelectedTypes(v);
              if (v.length > 0) markFilterChosen('workMode');
              syncFilterUrl({ types: v });
            }}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {workTypes.map((t) => (
                <Checkbox key={t} value={t} className="naukri-filter-item">
                  <span className="naukri-checkbox-label">{t}</span>
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        );
        break;

      case 'location':
        title = "Location";
        content = (
          <div>
            <Checkbox.Group
              value={selectedLocations}
              onChange={(v) => {
                setSelectedLocations(v);
                if (v.length > 0) markFilterChosen('location');
                syncFilterUrl({ locations: v });
              }}
              style={{ width: "100%" }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                {displayLocations.map((city) => (
                  <Checkbox key={city.value} value={city.value} className="naukri-filter-item">
                    <span className="naukri-checkbox-label" title={city.label}>
                      <span className="naukri-checkbox-text">{city.label}</span>
                      {city.count !== undefined && <span className="naukri-filter-count">({city.count})</span>}
                    </span>
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
            <FilterGridPopover
              title="Location"
              searchPlaceholder="Search Location"
              options={allLocationOptions}
              appliedValues={selectedLocations}
              onApply={(newSelected) => {
                setSelectedLocations(newSelected);
                if (newSelected.length > 0) markFilterChosen('location');
                syncFilterUrl({ locations: newSelected });
              }}
            />
          </div>
        );
        break;

      case 'salary':
        title = "Salary";
        content = (
          <div>
            <div>
              <Checkbox.Group
                value={selectedSalaries}
                onChange={(v) => {
                  setSelectedSalaries(v);
                  if (v.length > 0) markFilterChosen('salary');
                  syncFilterUrl({ salaries: v });
                }}
                style={{ width: "100%" }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  {displaySalaries.map((item) => (
                    <Checkbox key={item.value} value={item.value} className="naukri-filter-item">
                      <span className="naukri-checkbox-label" title={item.label}>
                        <span className="naukri-checkbox-text">{item.label}</span>
                        <span className="naukri-filter-count">({item.count})</span>
                      </span>
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </div>

            <SalaryFilterPopover
              options={salaryRanges}
              appliedValues={selectedSalaries}
              onApply={(newSelected) => {
                setSelectedSalaries(newSelected);
                if (newSelected.length > 0) markFilterChosen('salary');
                syncFilterUrl({ salaries: newSelected });
              }}
            />
          </div>
        );
        break;

      case 'company':
        title = "Company type";
        content = (
          <div>
            <div>
              <Checkbox.Group
                value={selectedCompanies}
                onChange={(v) => {
                  setSelectedCompanies(v);
                  if (v.length > 0) markFilterChosen('company');
                  syncFilterUrl({ companies: v });
                }}
                style={{ width: "100%" }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  {displayCompanies.map((co) => (
                    <Checkbox key={co.value} value={co.value} className="naukri-filter-item">
                      <span className="naukri-checkbox-label" title={co.label}>
                        <span className="naukri-checkbox-text">{co.label}</span>
                        {co.count !== undefined && <span className="naukri-filter-count">({co.count})</span>}
                      </span>
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </div>
            <FilterGridPopover
              title="Company / Employer"
              searchPlaceholder="Search Company"
              options={allCompanyOptions}
              appliedValues={selectedCompanies}
              onApply={(newSelected) => {
                setSelectedCompanies(newSelected);
                if (newSelected.length > 0) markFilterChosen('company');
                syncFilterUrl({ companies: newSelected });
              }}
            />
          </div>
        );
        break;

      case 'gender':
        title = "Gender Preference";
        content = (
          <Checkbox.Group
            value={selectedDiversity}
            onChange={(v) => {
              setSelectedDiversity(v);
              if (v.length > 0) markFilterChosen('gender');
              syncFilterUrl({ diversity: v });
            }}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {["Male", "Female"].map((g) => (
                <Checkbox key={g} value={g} className="naukri-filter-item">
                  <span className="naukri-checkbox-label">{g} Only</span>
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        );
        break;

      case 'freshness':
        return (
          <FreshnessFilterSection
            key="freshness"
            selected={selectedFreshness}
            isActive={isFilterActive('freshness')}
            onSelect={(val) => {
              setSelectedFreshness(val);
              markFilterChosen('freshness');
              syncFilterUrl({ freshness: val });
            }}
            onReset={() => resetSingleFilter('freshness')}
          />
        );

      case 'postType':
        title = "Post Type";
        content = (
          <Radio.Group
            value={jobNatureSelected}
            onChange={(e) => {
              setJobNatureSelected(e.target.value);
              if (e.target.value !== "Job") markFilterChosen('postType');
              syncFilterUrl({ nature: e.target.value });
            }}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {jobNature.map((t) => (
                <Radio key={t} value={t} className="naukri-filter-item">
                  <span className="naukri-checkbox-label">{t}</span>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );
        break;

      default:
        return null;
    }

    return (
      <FilterAccordionSection
        key={key}
        title={title}
        defaultOpen={defaultOpen}
        isActive={isActive}
        count={count}
        onReset={() => resetSingleFilter(key)}
      >
        {content}
      </FilterAccordionSection>
    );
  };

  /** -------------------- SIDEBAR FILTER UI -------------------- **/
  const FilterSidebar = (
    <div className="naukri-sidebar">
      <div className="naukri-filter-card">
        <div className="naukri-filter-card-header">
          <span className="naukri-filter-main-title">All Filters</span>
          {appliedFilterItems.length > 0 ? (
            <AppliedFiltersPopover
              items={appliedFilterItems}
              onRemoveAll={handleClearAllFilters}
            />
          ) : (
            <Button
              type="link"
              size="small"
              className="naukri-reset-all-link"
              onClick={handleClearAllFilters}
            >
              Reset All
            </Button>
          )}
        </div>

        <div className="naukri-filter-accordion-list">
          {orderedFilterKeys.map((key) => renderFilterSection(key))}
        </div>
      </div>
    </div>
  );

  /** -------------------- COMPONENTS -------------------- **/
  const TopRolesCarousel = () => {
    const roles = [
      { name: "Software Development", icon: <CodeOutlined /> },
      { name: "Frontend Development", icon: <DesktopOutlined /> },
      { name: "Backend Development", icon: <DatabaseOutlined /> },
      { name: "Full Stack Development", icon: <RocketOutlined /> },
      { name: "Mobile App Development", icon: <MobileOutlined /> },
      { name: "DevOps & Cloud Computing", icon: <CloudServerOutlined /> },
      { name: "Data Science & Analytics", icon: <BarChartOutlined /> },
      { name: "UI / UX", icon: <FormatPainterOutlined /> },
      { name: "Digital Marketing", icon: <GlobalOutlined /> },
      { name: "Marketing", icon: <BulbOutlined /> }
    ];

    const scrollRef = React.useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 20);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
      }
    };

    const scroll = (direction) => {
      if (scrollRef.current) {
        const { clientWidth } = scrollRef.current;
        const scrollAmount = clientWidth * 0.6;
        const scrollTo = direction === 'left'
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

        scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      }
    };

    return (
      <div className="naukri-top-roles-wrapper">
        <AnimatePresence>
          {showLeftArrow && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="naukri-carousel-nav prev"
              onClick={() => scroll('left')}
            >
              <LeftOutlined />
            </motion.button>
          )}
        </AnimatePresence>

        <div
          className="naukri-top-roles-scroll"
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {roles.map((role, idx) => (
            <motion.div
              key={role.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileTap={{ scale: 0.98 }}
              className={`naukri-role-card ${selectedCategories.includes(role.name) ? 'active' : ''}`}
              onClick={() => {
                const isSelected = selectedCategories.includes(role.name);
                const newCats = isSelected ? selectedCategories.filter(c => c !== role.name) : [...selectedCategories, role.name];
                setSelectedCategories(newCats);
                if (!isSelected) markFilterChosen('category');
                syncFilterUrl({ categories: newCats });
              }}
            >
              <span className="naukri-role-icon">{role.icon}</span>
              <span className="naukri-role-name">{role.name}</span>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {showRightArrow && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="naukri-carousel-nav next"
              onClick={() => scroll('right')}
            >
              <RightOutlined />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  };

  /** -------------------- JOB CARD (BRAND NEW UNIQUE CLASSES) -------------------- **/
  const JobCard = ({ job }) => (
    <div
      className="naukri-job-card"
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

        const jobNature = generateSlug(job.type || "");
        const jobTitle = generateSlug(job.title || "");
        const companyName = generateSlug(job.company || "");
        const locationSlug = safeSlug(job.raw_location);
        const workplaceType = generateSlug(job.raw_workplace_type || "");
        const experienceType = generateSlug(job.level || "");
        const experienceRequired = safeSlug(job.raw_experience_required);

        let basePath = "";
        if (job.type === "Job") basePath = "/job-details";
        else if (job.type === "Internship" || isInternshipOpportunity(job, { jobNatureSelected })) basePath = "/internship-details";
        else if (job.type === "Scholarship") basePath = "/scholarship-details";
        else basePath = isInternshipOpportunity(job, { jobNatureSelected }) ? "/internship-details" : "/job-details";

        const finalUrl = `${basePath}/${jobNature}-${jobTitle}-${companyName}-${locationSlug}-${workplaceType}-${experienceType}-${experienceRequired}-${job.id}`;
        window.open(finalUrl, "_blank");
      }}
    >
      <div className="naukri-job-header">
        <div style={{ flex: 1, paddingRight: '12px' }}>
          <h3 className="naukri-job-title">{job.title && job.title.trim() ? job.title : "N/A"}</h3>
          <div className="naukri-company-info">
            <span className="naukri-company-name">{job.company && job.company.trim() ? job.company : "N/A"}</span>
            <div className="naukri-company-rating">
              <ThunderboltFilled className="naukri-star-icon" />
              <span>4.2</span>
              <span className="naukri-meta-separator"></span>
              <span className="naukri-review-count">1.2k+ Reviews</span>
            </div>
          </div>
        </div>
        <div className="naukri-logo-container">
          <img
            src={getImageUrl(job.logo) || "/favicon.png"}
            alt={job.company || "Company logo"}
            className="naukri-company-logo"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/favicon.png";
            }}
          />
        </div>
      </div>

      <div className="naukri-job-meta">
        <div className="naukri-meta-item">
          <CgWorkAlt className="naukri-meta-icon" />
          <span>
            {isInternshipOpportunity(job, { jobNatureSelected })
              ? "Internship"
              : (job.level && job.level.trim() ? job.level : "N/A")}
          </span>
        </div>
        <span className="naukri-meta-separator"></span>
        <div className="naukri-meta-item">
          <WalletOutlined className="naukri-meta-icon" />
          <span>{job.salary && job.salary.trim() ? job.salary : "Not Disclosed"}</span>
        </div>
        <span className="naukri-meta-separator"></span>
        <div className="naukri-meta-item">
          <FaMapMarkerAlt className="naukri-meta-icon" />
          <span>{job.location && job.location.trim() && job.location.trim() !== "[]" ? job.location : "N/A"}</span>
        </div>
      </div>

      <div className="naukri-job-description">
        <FileTextOutlined className="naukri-desc-icon" />
        <span>
          {(() => {
            if (!job.job_description) return "No description available";

            // 1. Helper to decode common HTML entities
            const decode = (str) => str
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&nbsp;/g, " ");

            // 2. Try to extract the first bullet point for a concise single-line preview
            const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
            const match = liRegex.exec(job.job_description);
            if (match && match[1]) {
              const pointText = match[1].replace(/<\/?[^>]+(>|$)/g, " ").trim();
              if (pointText) return decode(pointText);
            }

            // 3. Fallback to cleaned paragraph text
            let cleanText = job.job_description.replace(/<\/?[^>]+(>|$)/g, " ");
            cleanText = decode(cleanText);
            cleanText = cleanText.replace(/\s+/g, " ").trim();

            // Remove redundant "Job description" or "Role & responsibilities" prefix
            const lower = cleanText.toLowerCase();
            if (lower.startsWith("job description")) cleanText = cleanText.substring(15).trim();
            else if (lower.startsWith("role & responsibilities")) cleanText = cleanText.substring(23).trim();
            else if (lower.startsWith("role and responsibilities")) cleanText = cleanText.substring(25).trim();

            // Capitalize and truncate
            cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
            return cleanText.substring(0, 110) + "...";
          })()}
        </span>
      </div>

      <div className="naukri-skills-list">
        {job.skills.slice(0, 5).map((skill, index) => (
          <React.Fragment key={skill}>
            <span>{skill}</span>
            {index < 4 && index < job.skills.length - 1 && <span className="naukri-skill-dot">·</span>}
          </React.Fragment>
        ))}
        {job.skills.length > 5 && (
          <>
            <span className="naukri-skill-dot">·</span>
            <span>+{job.skills.length - 5} more</span>
          </>
        )}
      </div>

      <div className="naukri-job-footer">
        <div className="naukri-posted-time">
          <span>Posted: {job.date_posted || "Just now"}</span>
        </div>
        <div
          className={`naukri-save-container ${savedJobs[job.id] ? "saved-active" : ""}`}
          onClick={(e) => handleSaveJobToggle(e, job)}
          title={savedJobs[job.id] ? "Remove from saved jobs" : "Save this job"}
          style={{
            cursor: 'pointer',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: savedJobs[job.id] ? '#47b749' : undefined,
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
        >
          {savingJobIds[job.id] ? (
            <SyncOutlined spin style={{ color: '#47b749', fontSize: '14px' }} />
          ) : savedJobs[job.id] ? (
            <BsBookmarkFill style={{ color: '#47b749', fontSize: '14px' }} />
          ) : (
            <BsBookmark style={{ fontSize: '14px' }} />
          )}
          <span>{savedJobs[job.id] ? "Saved" : "Save"}</span>
        </div>
      </div>
    </div>
  );

  /** -------------------- SKELETONS -------------------- **/
  const FullPageSkeleton = () => (
    <div className="naukri-layout-container">
      <div className="naukri-content-wrapper">
        <Row gutter={[20, 24]}>
          {/* Sidebar Skeleton */}
          <Col xs={0} md={7} lg={6} xl={6}>
          <div className="naukri-sidebar-wrapper">
            <Card className="naukri-filter-card" style={{ border: 'none' }}>
              <Skeleton active paragraph={{ rows: 2 }} />
              <div style={{ marginTop: '30px' }}>
                <Skeleton active paragraph={{ rows: 4 }} title={false} />
              </div>
              <div style={{ marginTop: '30px' }}>
                <Skeleton active paragraph={{ rows: 4 }} title={false} />
              </div>
            </Card>
          </div>
        </Col>

        {/* Main Content Skeleton */}
        <Col xs={24} md={18} lg={13} xl={13}>
          <div className="naukri-top-roles-section" style={{ height: '60px', marginBottom: '24px' }}>
            <Skeleton.Button active block style={{ height: '52px', borderRadius: '12px' }} />
          </div>
          <div className="naukri-results-info">
            <Skeleton.Button active size="large" style={{ width: 250, marginBottom: 20 }} />
          </div>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="naukri-job-card" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <Skeleton.Avatar active size="large" shape="square" style={{ width: 42, height: 42, borderRadius: 8 }} />
                  <div style={{ flex: 1 }}>
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        </Col>

        {/* Right Promo Skeleton */}
        <Col xs={0} lg={5} xl={5}>
          <Card className="naukri-promo-card" style={{ border: 'none' }}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
          <Card className="naukri-promo-card" style={{ border: 'none', marginTop: '20px' }}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
        </Col>
      </Row>
      </div>
    </div>
  );


  /** -------------------- RENDER -------------------- **/
  return (
    <>

      <SEO
        title={getFilterTitle()}
        description={`Explore the latest ${totalJobs} ${getFilterTitle()} available on CareerFast. ${selectedLocations.length > 0 ? `Connecting top talent with leading companies in ${selectedLocations.join(", ")}.` : "Find jobs, internships, and scholarships with top companies across India."
          }`}
        breadcrumbSchema={[
          { name: "Home", item: "/" },
          { name: jobNatureSelected === "Internship" ? "Internships" : "Jobs", item: currentPath }
        ]}
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "numberOfItems": jobs.length,
            "itemListElement": jobs.map((job, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "url": `${currentOrigin}/job-details/${generateSlug(job.type)}-${generateSlug(job.title)}-${generateSlug(job.company)}-${generateSlug(job.raw_location)}-${generateSlug(job.raw_workplace_type)}-${generateSlug(job.level)}-${generateSlug(job.raw_experience_required)}-${job.id}`
            }))
          }
        ]}
      />
      <Header showSearch={true} />

      {initialLoading ? (
        <FullPageSkeleton />
      ) : (
        <div className="naukri-layout-container">
          <div className="naukri-content-wrapper">
            <Row gutter={[20, 24]}>
              {/* Left Sidebar */}
              <Col xs={0} md={7} lg={6} xl={6} className="desktop-sidebar-col">
                <div className="naukri-sidebar-sticky">
                  {FilterSidebar}
                </div>
              </Col>


              {/* Center Content (Job List) */}
              <Col xs={24} md={17} lg={13} xl={13}>
                {/* Top Roles Carousel (Naukri style) */}
                <TopRolesCarousel />

                {/* Top Results Header */}
                <div className="naukri-results-info">
                  <div className="naukri-results-header-row">
                    <div className="naukri-results-count-box">
                      <span className="naukri-results-range">
                        {totalJobs > 0
                          ? `${(page - 1) * 20 + 1} - ${Math.min(page * 20, totalJobs)} of ${totalJobs.toLocaleString('en-IN')}`
                          : jobs.length > 0 ? `1 - ${jobs.length} of ${jobs.length}` : '0 of 0'}
                      </span>
                      <h1 className="naukri-results-title">
                        {getFilterTitle()}
                      </h1>
                    </div>

                    <div className="naukri-results-controls">
                      <Dropdown
                        menu={{
                          items: sortMenuItems,
                          onClick: ({ key }) => {
                            setSelectedSort(key);
                            syncFilterUrl({ sort: key });
                          },
                          selectable: true,
                          selectedKeys: [selectedSort || 'recommended'],
                          className: "naukri-sort-menu-popup"
                        }}
                        trigger={['click']}
                        placement="bottomRight"
                      >
                        <button type="button" className="naukri-sort-dropdown-btn">
                          <span className="naukri-sort-label">Sort by:</span>
                          <span className="naukri-sort-current">{getSortLabel(selectedSort)}</span>
                          <DownOutlined className="naukri-sort-arrow" />
                        </button>
                      </Dropdown>

                      <Button
                        className="mobile-filter-btn"
                        icon={<FilterOutlined />}
                        onClick={() => setMobileFilterOpen(true)}
                        style={{ display: 'none', borderRadius: '20px', border: '1px solid #e2e8f0', color: '#475569', fontWeight: 500 }}
                      >
                        Filters
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="naukri-job-list-wrapper" style={{ position: 'relative', minHeight: '400px' }}>
                  <CriticalProfileAlert variant="job-filter" />

                  {loading ? (
                    <div className="naukri-filter-skeleton-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[1, 2, 3].map((n) => (
                        <Card key={n} className="naukri-job-card" style={{ padding: '14px 18px', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', gap: '16px' }}>
                            <Skeleton.Avatar active size="large" shape="square" style={{ width: 42, height: 42, borderRadius: 8 }} />
                            <div style={{ flex: 1 }}>
                              <Skeleton active paragraph={{ rows: 2 }} />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : jobs.length === 0 ? (
                    <Card style={{ borderRadius: 12, textAlign: "center", padding: "60px 40px" }}>
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<span style={{ fontSize: '16px', color: 'var(--naukri-text-secondary)' }}>No jobs found matching your criteria.</span>}
                      >
                        <Button
                          type="primary"
                          className="naukri-apply-btn"
                          onClick={handleClearAllFilters}
                        >
                          Clear All Filters
                        </Button>
                      </Empty>
                    </Card>
                  ) : (
                    <div className="naukri-job-list">
                      {jobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                      ))}

                      {/* Custom Modern Pagination Matching Screenshot */}
                      {totalPages > 1 && (
                        <div className="naukri-pagination-container">
                          <button
                            type="button"
                            className={`naukri-pagination-btn prev ${page <= 1 ? "disabled" : ""}`}
                            disabled={page <= 1}
                            onClick={() => handlePageChange(page - 1)}
                            aria-label="Previous Page"
                          >
                            <span className="naukri-pagination-arrow">&lsaquo;</span>
                            <span>Previous</span>
                          </button>

                          <div className="naukri-pagination-numbers">
                            {pageNumbers.map((p, idx) => {
                              if (p === "...") {
                                return (
                                  <span key={`ellipsis-${idx}`} className="naukri-pagination-ellipsis">
                                    ...
                                  </span>
                                );
                              }
                              const isCurrent = p === page;
                              return (
                                <button
                                  type="button"
                                  key={`page-${p}`}
                                  className={`naukri-pagination-number ${isCurrent ? "active" : ""}`}
                                  onClick={() => handlePageChange(p)}
                                  aria-current={isCurrent ? "page" : undefined}
                                >
                                  {p}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            className={`naukri-pagination-btn next ${page >= totalPages ? "disabled" : ""}`}
                            disabled={page >= totalPages}
                            onClick={() => handlePageChange(page + 1)}
                            aria-label="Next Page"
                          >
                            <span>Next</span>
                            <span className="naukri-pagination-arrow">&rsaquo;</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Col>

              {/* Right Sidebar (Promo / Ads) */}
              <Col xs={0} lg={5} xl={5}>
                <div className="naukri-promo-sticky">
                  <div className="naukri-promo-card">
                    <h4 className="naukri-promo-title">See 20+ jobs in your preferred location</h4>
                    <p style={{ fontSize: "13px", color: "var(--naukri-text-secondary)", lineHeight: '1.4' }}>Get better results by updating your profile details.</p>
                    <a href="/candidate-profile/mainprofile" className="naukri-promo-link">Update Profile</a>
                  </div>

                  <div className="naukri-promo-card" style={{ background: "linear-gradient(135deg, #fff5f5 0%, #fff 100%)" }}>
                    <h4 className="naukri-promo-title">Premium Services</h4>
                    <p style={{ fontSize: "13px", color: "var(--naukri-text-secondary)", lineHeight: '1.4' }}>Boost your job search with Careerfast Professional services.</p>
                    <a href="/services" className="naukri-promo-link">Explore Services</a>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      )}




      {/* Mobile Filters Drawer */}
      <Drawer
        width={320}
        title="Filters"
        onClose={() => setMobileFilterOpen(false)}
        open={mobileFilterOpen}
        className="header-drawer"
      >
        {FilterSidebar}
      </Drawer>

      {/* Filter popovers are anchored directly to their sidebar View More triggers */}

      <LoginDrawer
        open={authDrawerOpen}
        onClose={() => {
          setAuthDrawerOpen(false);
          setPendingSaveJob(null);
        }}
        job={pendingSaveJob}
        actionType="save"
        onLoginSuccess={handleLoginSuccess}
      />

      <Footer />
    </>
  );
}


