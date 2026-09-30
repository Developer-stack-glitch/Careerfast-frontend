'use client';
import React, { useEffect, useState, useMemo } from "react";
import {
  Input,
  Button,
  Typography,
  Badge,
  Skeleton,
  Tooltip,
  Select
} from "antd";
import {
  SearchOutlined
} from "@ant-design/icons";
import { CommonToaster } from "../Common/CommonToaster";
import { getSavedJobs, removeSavedJobs } from "../ApiService/action";
import { useNavigate } from "@/routing-shim";
// import Header from "../Header/Header";
import { FaRegEye, FaArrowRight, FaBookmark } from "react-icons/fa";
import { FiMapPin, FiBriefcase, FiBarChart2, FiBookmark } from "react-icons/fi";
import { BiSortAlt2 } from "react-icons/bi";

const { Title, Text } = Typography;

const debounce = (func, wait) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

const parseLocation = (loc) => {
  if (!loc) return "Remote";
  try {
    const parsed = JSON.parse(loc);
    if (Array.isArray(parsed)) return parsed.join(", ");
    return parsed;
  } catch {
    return loc;
  }
};

const OpportunityCard = ({ opportunity, onSave }) => {
  const [saved, setSaved] = useState(() => opportunity.saved);
  const [loginUserId, setLoginUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loginDetails");
      if (stored) {
        const loginDetails = JSON.parse(stored);
        setLoginUserId(loginDetails.id);
      }
    } catch (error) {
      console.error("Invalid JSON in localStorage", error);
    }
  }, []);

  const handleRemove = async () => {
    if (!loginUserId) {
      CommonToaster("Please log in.", "error");
      return;
    }

    setSaved(false);
    onSave(opportunity.id, false);

    try {
      await removeSavedJobs({ id: opportunity.id });
      CommonToaster("Removed from favourites ❤️", "error");
    } catch (error) {
      console.error("Remove saved jobs error", error);
      CommonToaster("Failed to remove job", "error");
      setSaved(true);
    }
  };

  const generateSlug = (text = "") => {
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const isClosed =
    (new Date() - new Date(opportunity.created_date)) / (1000 * 60 * 60 * 24) >= 355;

  const navigateToDetails = () => {
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

    const jobNature = generateSlug(opportunity.job_nature || "");
    const jobTitle = generateSlug(opportunity.job_title || "");
    const companyName = generateSlug(opportunity.company_name || "");
    const locationSlug = safeSlug(opportunity.work_location);
    const workplaceType = generateSlug(opportunity.workplace_type || "");
    const experienceType = generateSlug(opportunity.experience_type || "");
    const experienceRequired = safeSlug(opportunity.experience_required);

    let basePath = "/job-details";
    if (opportunity.job_nature === "Internship") basePath = "/internship-details";
    if (opportunity.job_nature === "Scholarship") basePath = "/scholarship-details";

    const jobId = opportunity.job_post_id || opportunity.id;

    const finalUrl = `${basePath}/${jobNature}-${jobTitle}-${companyName}-${locationSlug}-${workplaceType}-${experienceType}-${experienceRequired}-${jobId}`;
    window.open(finalUrl, "_blank");
  };

  const parsedSkills = (() => {
    try {
      if (!opportunity.skills) return ["Sales", "Client Management", "Communication"];
      if (Array.isArray(opportunity.skills)) return opportunity.skills;
      const parsed = JSON.parse(opportunity.skills);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return ["Sales", "Client Management", "Communication"];
    }
  })();
  const displayedSkills = parsedSkills.slice(0, 3);
  const extraSkillsCount = Math.max(0, parsedSkills.length - 3);

  return (
    <div className="mb-4 rounded-xl shadow-sm bg-white p-4 md:px-6">
      <div className="flex gap-5 items-start flex-wrap">

        {/* Logo and Status Badge */}
        <div className="relative shrink-0 mr-10">
          <div className="w-[65px] h-[65px] shadow-md rounded-xl flex items-center justify-center overflow-hidden bg-white">
            <img
              src={opportunity.company_logo || "/default_logo.png"}
              alt={`${opportunity.company_name || opportunity.company} logo`}
              className="w-4/5 h-4/5 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div className="absolute -right-[70px] top-0">
            <span
              className={`rounded-xl font-bold text-xs px-2.5 py-0.5 m-0 inline-block ${isClosed ? "bg-[#fff1f0] text-[#ff4d4f]" : "bg-[#f6ffed] text-[#52c41a]"
                }`}
            >
              {isClosed ? "Closed" : "Active"}
            </span>
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 min-w-[300px]">
          <h5 className="m-0 mb-1 text-[18px] font-bold text-[#1a1a1a]">
            {opportunity.job_title}
          </h5>
          <span className="block mb-2 text-[#595959] text-[14px] font-semibold">
            {opportunity.company_name}
          </span>

          <div className="flex gap-4 mb-3 text-[#8c8c8c] text-[13px] flex-wrap font-medium">
            <span className="flex items-center gap-1.5">
              <FiMapPin size={15} /> {parseLocation(opportunity.work_location)}
            </span>
            <span className="flex items-center gap-1.5">
              <FiBriefcase size={15} /> {opportunity.workplace_type || opportunity.job_nature || "Full-time"}
            </span>
            <span className="flex items-center gap-1.5">
              <FiBarChart2 size={15} /> {opportunity.experience_required || "1-3 Years"}
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {displayedSkills.map((skill, index) => (
              <span
                key={index}
                className="bg-[#f5f3ff] border-1 border-[#e0e7ff] text-[#5f2eea] rounded-2xl px-3 py-1 font-medium text-[12px] m-0"
              >
                {skill}
              </span>
            ))}
            {extraSkillsCount > 0 && (
              <span className="bg-[#f5f3ff] border-1 border-[#e0e7ff] text-[#5f2eea] rounded-2xl px-3 py-1 font-medium text-[12px] m-0">
                +{extraSkillsCount}
              </span>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-col items-end gap-6">
          <div className="text-[#8c8c8c] text-[13px] flex items-center gap-1.5 font-medium">
            <div className={`w-1.5 h-1.5 rounded-full ${isClosed ? "bg-[#bfbfbf]" : "bg-[#52c41a]"}`} />
            Posted {opportunity.date_posted || "a year ago"}
          </div>

          <div className="flex gap-3 items-center">
            <Tooltip title="Remove from wishlist">
              <button
                onClick={handleRemove}
                className="w-11 h-11 bg-[#fff1f0] rounded-lg flex items-center justify-center p-0 border-none cursor-pointer hover:opacity-80 transition-opacity"
              >
                <FaBookmark fill="#ff4d4f" size={16} />
              </button>
            </Tooltip>

            <Tooltip title="View job post">
              <button
                onClick={navigateToDetails}
                className="w-11 h-11 bg-white border border-[#e8e8e8] rounded-lg flex items-center justify-center p-0 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <FaRegEye color="#595959" size={18} />
              </button>
            </Tooltip>

            <button
              onClick={navigateToDetails}
              className={`h-11 rounded-lg px-6 font-semibold text-[14px] flex items-center gap-2 shadow-none cursor-pointer border transition-colors ${isClosed
                ? "bg-white border-[#e8e8e8] text-[#5f2eea] hover:bg-gray-50"
                : "bg-[#5f2eea] border-[#5f2eea] text-white hover:opacity-90"
                }`}
            >
              View Details <FaArrowRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function WatchList() {
  const [opportunities, setOpportunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [loginUserId, setLoginUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const [locationFilter, setLocationFilter] = useState(null);
  const [jobTypeFilter, setJobTypeFilter] = useState(null);
  const [experienceFilter, setExperienceFilter] = useState(null);
  const [sortBy, setSortBy] = useState(null);

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
      getSavedJobsData();
    }
  }, [loginUserId]);

  const getSavedJobsData = async () => {
    try {
      const response = await getSavedJobs({ user_id: loginUserId });
      setOpportunities(response?.data?.data || []);
    } catch (error) {
      console.error("Error fetching jobs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (id, saved) => {
    if (!saved) {
      setOpportunities((prev) => prev.filter((opp) => opp.id !== id));
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setInputValue("");
    setLocationFilter(null);
    setJobTypeFilter(null);
    setExperienceFilter(null);
    setSortBy(null);
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setSearchQuery(value);
      }, 300),
    []
  );

  const locationOptions = useMemo(() => {
    const locs = new Set(opportunities.map(opp => parseLocation(opp.work_location)));
    return Array.from(locs).filter(Boolean).map(l => ({ value: l, label: l }));
  }, [opportunities]);

  const jobTypeOptions = useMemo(() => {
    const types = new Set(opportunities.map(opp => opp.workplace_type || opp.job_nature || "Full-time"));
    return Array.from(types).filter(Boolean).map(t => ({ value: t, label: t }));
  }, [opportunities]);

  const experienceOptions = useMemo(() => {
    const exps = new Set(opportunities.map(opp => opp.experience_required || "1-3 Years"));
    return Array.from(exps).filter(Boolean).map(e => ({ value: e, label: e }));
  }, [opportunities]);

  const filteredOpportunities = useMemo(() => {
    let filtered = opportunities.filter((opp) => {
      const target = `${opp.job_title} ${opp.company_name || opp.company}`.toLowerCase();
      const matchesSearch = searchQuery ? target.includes(searchQuery.toLowerCase()) : true;

      const closed = (new Date() - new Date(opp.created_date)) / (1000 * 60 * 60 * 24) >= 355;

      let matchesTab = true;
      if (activeTab === "active") matchesTab = !closed;
      if (activeTab === "closed") matchesTab = closed;

      const oppLocation = parseLocation(opp.work_location);
      const matchesLocation = locationFilter ? oppLocation === locationFilter : true;

      const oppJobType = opp.workplace_type || opp.job_nature || "Full-time";
      const matchesJobType = jobTypeFilter ? oppJobType === jobTypeFilter : true;

      const oppExperience = opp.experience_required || "1-3 Years";
      const matchesExperience = experienceFilter ? oppExperience === experienceFilter : true;

      return matchesSearch && matchesTab && matchesLocation && matchesJobType && matchesExperience;
    });

    if (sortBy === "recent") {
      filtered = [...filtered].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (sortBy === "oldest") {
      filtered = [...filtered].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    } else if (sortBy === "a-z") {
      filtered = [...filtered].sort((a, b) => (a.job_title || "").localeCompare(b.job_title || ""));
    } else if (sortBy === "z-a") {
      filtered = [...filtered].sort((a, b) => (b.job_title || "").localeCompare(a.job_title || ""));
    } else {
      filtered = [...filtered].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }

    return filtered;
  }, [opportunities, searchQuery, activeTab, locationFilter, jobTypeFilter, experienceFilter, sortBy]);

  const activeCount = opportunities.filter((opp) => !((new Date() - new Date(opp.created_date)) / (1000 * 60 * 60 * 24) >= 355)).length;
  const closedCount = opportunities.filter((opp) => ((new Date() - new Date(opp.created_date)) / (1000 * 60 * 60 * 24) >= 355)).length;

  return (
    <div className="bg-transparent min-h-screen">
      <div className="mx-auto py-10 px-0">

        {/* Top Header Section */}
        <div className="flex justify-between items-start mb-10 flex-wrap gap-6">
          <div>
            <span className="text-[#5f2eea] font-extrabold text-[12px] uppercase tracking-wider block mb-2">
              MY OPPORTUNITIES
            </span>
            <h2 className="m-0 mb-2 text-[28px] font-semibold text-[#1a1a1a]">
              My Opportunity Wishlist
            </h2>
            <p className="text-[#595959] text-[15px] font-medium m-0">
              Keep track of the jobs you're interested in. Save, compare and apply later.
            </p>
          </div>

          <div className="bg-gradient-to-r from-[#f3ecff] to-[#e6d9ff] rounded-2xl p-4 md:px-6 flex items-center gap-5 min-w-[350px] relative overflow-hidden">
            <div className="bg-white rounded-xl w-12 h-12 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(95,46,234,0.1)]">
              <FaBookmark size={20} color="#5f2eea" />
            </div>
            <div className="z-10">
              <h5 className="m-0 text-[16px] font-semibold text-[#1a1a1a]">
                Save your dream jobs
              </h5>
              <span className="mt-1 text-[13px] text-[#595959] leading-[1.4] block font-medium">
                Get notified when similar opportunities<br />match your profile.
              </span>
            </div>
            {/* Abstract decorative element for the briefcase/papers */}
            <div className="absolute -right-[30px] -top-[10px] opacity-10">
              <FiBriefcase color="#5f2eea" size={130} />
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col xl:flex-row gap-4 mb-8">
          <Input
            placeholder="Search by job title, company or skills..."
            prefix={<SearchOutlined className="text-[#bfbfbf] text-[16px] mr-2" />}
            className="flex-1 rounded-lg px-4 py-2.5 text-[15px] font-medium border-[#d9d9d9] hover:border-[#bfbfbf] focus:border-[#5f2eea] shadow-none"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              debouncedSearch(e.target.value);
            }}
            allowClear
          />
          <div className="flex items-center gap-3 overflow-x-auto pb-0 xl:pb-0 scrollbar-hide">
            <Select
              placeholder="Location"
              className="min-w-[130px] h-[40px] rounded-lg border-1 border-color-[#bfbfbf]"
              options={locationOptions}
              value={locationFilter}
              onChange={setLocationFilter}
              allowClear
            />
            <Select
              placeholder="Job Type"
              className="min-w-[130px] h-[40px] rounded-lg border-1 border-color-[#bfbfbf]"
              options={jobTypeOptions}
              value={jobTypeFilter}
              onChange={setJobTypeFilter}
              allowClear
            />
            <Select
              placeholder="Experience"
              className="min-w-[130px] h-[40px] rounded-lg border-1 border-color-[#bfbfbf]"
              options={experienceOptions}
              value={experienceFilter}
              onChange={setExperienceFilter}
              allowClear
            />
            <Select
              placeholder={<div className="flex items-center gap-2"><BiSortAlt2 size={16} /> Sort by</div>}
              className="min-w-[140px] h-[40px] rounded-lg border-1 border-color-[#bfbfbf]"
              value={sortBy}
              onChange={setSortBy}
              allowClear
              options={[
                { value: "recent", label: "Most Recent" },
                { value: "oldest", label: "Oldest" },
                { value: "a-z", label: "Title (A-Z)" },
                { value: "z-a", label: "Title (Z-A)" }
              ]}
            />
            {(searchQuery || locationFilter || jobTypeFilter || experienceFilter || sortBy) && (
              <Button type="text" onClick={clearAllFilters} className="text-[#ff4d4f] font-semibold hover:bg-[#fff1f0] transition-colors">
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        <div className="flex border-b-2 border-[#f0f0f0] mb-8 gap-8">
          <div
            onClick={() => setActiveTab("all")}
            className={`pb-4 cursor-pointer flex items-center gap-2 font-bold text-[15px] -mb-[2px] transition-all duration-300 border-b-[3px] ${activeTab === "all" ? "text-[#5f2eea] border-[#5f2eea]" : "text-[#595959] border-transparent"
              }`}
          >
            <FaBookmark /> All Saved
            <Badge
              count={opportunities.length}
              style={{
                backgroundColor: activeTab === "all" ? "#5f2eea" : "#f0f0f0",
                color: activeTab === "all" ? "white" : "#595959",
                fontWeight: "bold",
                boxShadow: "none"
              }}
            />
          </div>
          <div
            onClick={() => setActiveTab("active")}
            className={`pb-4 cursor-pointer flex items-center gap-2 font-bold text-[15px] -mb-[2px] transition-all duration-300 border-b-[3px] ${activeTab === "active" ? "text-[#1a1a1a] border-[#5f2eea]" : "text-[#595959] border-transparent"
              }`}
          >
            <div className="w-2 h-2 rounded-full bg-[#52c41a]" /> Active
            <Badge
              count={activeCount}
              style={{
                backgroundColor: activeTab === "active" ? "#f0f0f0" : "#f0f0f0",
                color: activeTab === "active" ? "#1a1a1a" : "#595959",
                fontWeight: "bold",
                boxShadow: "none"
              }}
            />
          </div>
          <div
            onClick={() => setActiveTab("closed")}
            className={`pb-4 cursor-pointer flex items-center gap-2 font-bold text-[15px] -mb-[2px] transition-all duration-300 border-b-[3px] ${activeTab === "closed" ? "text-[#1a1a1a] border-[#5f2eea]" : "text-[#595959] border-transparent"
              }`}
          >
            <div className="w-2 h-2 rounded-full bg-[#bfbfbf]" /> Closed
            <Badge
              count={closedCount}
              style={{
                backgroundColor: activeTab === "closed" ? "#f0f0f0" : "#f0f0f0",
                color: activeTab === "closed" ? "#1a1a1a" : "#595959",
                fontWeight: "bold",
                boxShadow: "none"
              }}
            />
          </div>
        </div>

        {/* Listings Section */}
        {loading ? (
          <div className="text-center p-10 bg-white rounded-xl border border-[#f0f0f0]">
            <Skeleton active />
          </div>
        ) : filteredOpportunities.length > 0 ? (
          filteredOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onSave={handleSave}
            />
          ))
        ) : (
          <div className="text-center py-20 px-5 bg-white rounded-xl border border-[#f0f0f0]">
            <Title level={4} style={{ color: "#bfbfbf", marginBottom: "16px" }}>
              No wishlist opportunities found
            </Title>
            <Button type="primary" onClick={() => navigate("/job-filter")} className="bg-[#5f2eea] rounded-lg h-10 font-semibold border-none">
              Explore Opportunities
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
