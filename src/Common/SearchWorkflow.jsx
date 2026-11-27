"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { SearchOutlined, CloseCircleFilled, HistoryOutlined } from "@ant-design/icons";
import {
  Check as LucideCheck,
  X as LucideX,
  Sparkles,
  MapPin,
  Building2,
  Briefcase,
  Laptop,
  Clock,
  GraduationCap,
  Code,
  Palette,
  Database,
  Flame,
  Search,
  BookOpen
} from "lucide-react";
import { IoChevronDownOutline } from "react-icons/io5";
import { message } from "antd";
import { getSearchSuggestions, searchLocationsAPI } from "@/ApiService/action";
import {
  saveRecentSearch,
  getRecentSearches,
  removeRecentSearch,
  updateRecentSearchCount,
  fetchLiveCountForSearch,
  RECENT_SEARCHES_EVENT
} from "@/utils/recentSearches";
import "./SearchWorkflow.css";

// Popular search suggestions for fast 0ms in-memory fallback
const POPULAR_SEARCH_KEYWORDS = [
  "Software Development", "Frontend Development", "Backend Development",
  "Full Stack Development", "Data Science", "Machine Learning", "DevOps",
  "UI/UX Design", "Product Management", "Digital Marketing", "Content Writing",
  "Graphic Design", "Human Resources", "Business Development", "Finance",
  "Sales", "Operations", "Cyber Security", "Cloud Computing", "AI Engineer"
];

// Locations from workflow
const POPULAR_LOCATIONS = [
  "Mumbai", "Hyderabad", "Chennai", "Kolkata", "Bangalore", "Delhi", "Pune"
];

// Comprehensive fallback locations list for 0ms suggestions
const ALL_LOCATIONS_LIST = [
  "Bangalore", "Chennai", "Hyderabad", "Mumbai", "Delhi", "Noida", "Gurgaon", "Pune", "Kolkata",
  "Ahmedabad", "Coimbatore", "Kochi", "Jaipur", "Indore", "Chandigarh", "Visakhapatnam",
  "Nagpur", "Surat", "Lucknow", "Bhubaneswar", "Trivandrum", "Vadodara", "Bhopal", "Patna",
  "Madurai", "Trichy", "Salem", "Vijayawada", "Mysore", "Nashik", "Remote", "Work from Home"
];

// Categories from workflow
const POPULAR_CATEGORIES = [
  { label: "Big brands", type: "query", value: "Big brands" },
  { label: "Work from home", type: "workMode", value: "Work From Home" },
  { label: "Part-time", type: "query", value: "Part-time" },
  { label: "MBA", type: "category", value: "MBA" },
  { label: "Engineering", type: "category", value: "Engineering" },
  { label: "Media", type: "category", value: "Media" },
  { label: "Design", type: "category", value: "Design" },
  { label: "Data Science", type: "category", value: "Data Science" }
];

// Workflow type options with dedicated icons
const TYPE_OPTIONS = [
  { label: "Jobs", id: "jobs", icon: Briefcase },
  { label: "Internships", id: "internships", icon: GraduationCap },
  { label: "Short term courses", id: "courses", icon: BookOpen }
];

export default function SearchWorkflow({
  mode = "hero", // "modal" | "hero"
  onClose = null,
  navigate = null,
  initialType = "Jobs",
  showRecent = true
}) {
  const [selectedType, setSelectedType] = useState(initialType);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState({ roles: [], skills: [], companies: [] });
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);

  // Mobile-only location filter state
  const [locationTerm, setLocationTerm] = useState("");
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);
  const [locSuggestions, setLocSuggestions] = useState([]);
  const [activeLocIndex, setActiveLocIndex] = useState(-1);

  const barRef = useRef(null);
  const typeMenuRef = useRef(null);
  const inputRef = useRef(null);
  const latestQueryRef = useRef("");
  const locWrapRef = useRef(null);
  const locInputRef = useRef(null);
  const latestLocQueryRef = useRef("");

  // Helper to render intuitive category icons
  const renderCategoryIcon = (label) => {
    switch (label) {
      case "Big brands":
        return <Building2 size={13} className="search-flow-pill-icon icon-building" />;
      case "Work from home":
        return <Laptop size={13} className="search-flow-pill-icon icon-laptop" />;
      case "Part-time":
        return <Clock size={13} className="search-flow-pill-icon icon-clock" />;
      case "MBA":
        return <GraduationCap size={13} className="search-flow-pill-icon icon-grad" />;
      case "Engineering":
        return <Code size={13} className="search-flow-pill-icon icon-code" />;
      case "Media":
        return <Sparkles size={13} className="search-flow-pill-icon icon-media" />;
      case "Design":
        return <Palette size={13} className="search-flow-pill-icon icon-palette" />;
      case "Data Science":
        return <Database size={13} className="search-flow-pill-icon icon-data" />;
      default:
        return <Briefcase size={13} className="search-flow-pill-icon icon-default" />;
    }
  };

  // Helper to get contextual placeholder based on selected mode
  const getPlaceholderText = () => {
    if (selectedType === "Short term courses") {
      return "Search courses, technologies, or skills (e.g. Full Stack, AI, Marketing)...";
    }
    if (selectedType === "Internships") {
      return "Search internships by role, company, or skills (e.g. Web Dev, Design)...";
    }
    return "Search jobs by title, skills, or company (e.g. React, Java, Google)...";
  };

  // Get active type object
  const activeTypeObj = TYPE_OPTIONS.find((t) => t.label === selectedType) || TYPE_OPTIONS[0];
  const CurrentTypeIcon = activeTypeObj.icon || Briefcase;

  // Default fallback navigation if not passed
  const doNavigate = (url) => {
    if (typeof navigate === "function") {
      navigate(url);
    } else if (typeof window !== "undefined") {
      window.location.href = url;
    }
    if (onClose) {
      onClose();
    }
  };

  // Close type dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target) && !e.target.closest(".search-flow-type-btn")) {
        setShowTypeDropdown(false);
      }
      if (barRef.current && !barRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setShowLocSuggestions(false);
      }
      if (locWrapRef.current && !locWrapRef.current.contains(e.target)) {
        setShowLocSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Esc key to close modal or dropdowns
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showTypeDropdown) {
          setShowTypeDropdown(false);
        } else if (showSuggestions) {
          setShowSuggestions(false);
        } else if (showLocSuggestions) {
          setShowLocSuggestions(false);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showTypeDropdown, showSuggestions, showLocSuggestions, onClose]);

  // Load and sync recent searches from localStorage
  useEffect(() => {
    if (!showRecent) return;
    const stored = getRecentSearches();
    setRecentSearches(stored);

    // Fetch dynamic counts for searches without counts
    stored.forEach((item) => {
      if (item.count === null || item.count === undefined) {
        fetchLiveCountForSearch(item).then((liveCount) => {
          if (typeof liveCount === "number") {
            updateRecentSearchCount(item.id, liveCount);
          }
        }).catch(() => { });
      }
    });

    const handleUpdate = (e) => {
      setRecentSearches(e?.detail || getRecentSearches());
    };
    window.addEventListener(RECENT_SEARCHES_EVENT, handleUpdate);
    return () => window.removeEventListener(RECENT_SEARCHES_EVENT, handleUpdate);
  }, [showRecent]);

  // Instant in-memory suggestions + API enrichment
  const instantMatches = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return [];
    const q = searchTerm.trim().toLowerCase();
    return POPULAR_SEARCH_KEYWORDS.filter(k => k.toLowerCase().includes(q)).slice(0, 8);
  }, [searchTerm]);

  const currentSuggestionList = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return [];
    const apiList = [
      ...(suggestions.roles || []),
      ...(suggestions.skills || []),
      ...(suggestions.companies || [])
    ];
    if (apiList.length > 0 && latestQueryRef.current === searchTerm.toLowerCase().trim()) {
      return apiList.slice(0, 8);
    }
    return instantMatches.map(label => ({ label }));
  }, [searchTerm, suggestions, instantMatches]);

  useEffect(() => {
    if (!searchTerm || !searchTerm.trim()) {
      setSuggestions({ roles: [], skills: [], companies: [] });
      return;
    }
    const cleanQ = searchTerm.trim().toLowerCase();
    latestQueryRef.current = cleanQ;

    const timer = setTimeout(async () => {
      try {
        const res = await getSearchSuggestions({ q: cleanQ, type: "all" });
        if (latestQueryRef.current === cleanQ && res?.data?.data) {
          setSuggestions(res.data.data);
        }
      } catch (err) {
        // Keep fallback
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Instant in-memory location suggestions + API enrichment (Mobile-only location filter)
  const instantLocationMatches = useMemo(() => {
    if (!locationTerm || !locationTerm.trim()) {
      return POPULAR_LOCATIONS;
    }
    const cleanLoc = locationTerm.trim().toLowerCase();
    return ALL_LOCATIONS_LIST.filter(l => l.toLowerCase().includes(cleanLoc)).slice(0, 8);
  }, [locationTerm]);

  const currentLocationList = useMemo(() => {
    if (locSuggestions.length > 0 && latestLocQueryRef.current === locationTerm.toLowerCase().trim()) {
      return locSuggestions.slice(0, 8);
    }
    return instantLocationMatches.map(label => ({ label }));
  }, [locationTerm, locSuggestions, instantLocationMatches]);

  useEffect(() => {
    if (!locationTerm || !locationTerm.trim()) {
      setLocSuggestions([]);
      return;
    }
    const cleanLoc = locationTerm.trim().toLowerCase();
    latestLocQueryRef.current = cleanLoc;

    const timer = setTimeout(async () => {
      try {
        const res = await searchLocationsAPI(cleanLoc);
        if (latestLocQueryRef.current === cleanLoc && Array.isArray(res)) {
          const formatted = res
            .map(item => (typeof item === "string" ? { label: item } : { label: item.name || item.city || item.display_name || "" }))
            .filter(item => Boolean(item.label));
          if (formatted.length > 0) {
            setLocSuggestions(formatted);
          }
        }
      } catch (err) {
        // Keep fallback
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [locationTerm]);

  // Execute Search based on selectedType and params
  const executeSearch = (params = {}) => {
    const query = params.query !== undefined ? params.query : searchTerm;
    const location = params.location !== undefined ? params.location : locationTerm;
    const category = params.category || "";
    const workMode = params.workMode || "";

    const queryParts = [];

    // Type 1: Short term courses
    if (selectedType === "Short term courses") {
      if (query && query.trim()) queryParts.push(`q=${encodeURIComponent(query.trim())}`);
      if (location && location.trim()) queryParts.push(`l=${encodeURIComponent(location.trim())}`);
      if (category) queryParts.push(`c=${encodeURIComponent(category)}`);
      const url = `/courses${queryParts.length > 0 ? `?${queryParts.join("&")}` : ""}`;
      doNavigate(url);
      return;
    }

    // Type 2: Internships
    // Type 3: Jobs
    const isInternship = selectedType === "Internships";
    if (isInternship) {
      queryParts.push("job_nature=Internship");
    }

    if (query && query.trim()) {
      queryParts.push(`q=${encodeURIComponent(query.trim())}`);
    }
    if (location && location.trim()) {
      queryParts.push(`l=${encodeURIComponent(location.trim())}`);
    }
    if (category) {
      queryParts.push(`c=${encodeURIComponent(category)}`);
    }
    if (workMode) {
      queryParts.push(`t=${encodeURIComponent(workMode)}`);
    }

    if (queryParts.length === 0 || (isInternship && queryParts.length === 1 && !query && !location && !category && !workMode)) {
      // If user submitted completely blank search: navigate to full list
      const emptyTarget = isInternship ? "/internship-filter" : "/job-filter";
      doNavigate(emptyTarget);
      return;
    }

    // Save recent search
    saveRecentSearch({
      skills: query || category || "",
      location: (location && location.trim()) || "",
      job_nature: isInternship ? "Internship" : ""
    });

    const targetUrl = `/job-filter?${queryParts.join("&")}`;
    doNavigate(targetUrl);
  };

  const handleFormSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setShowSuggestions(false);
    setShowLocSuggestions(false);
    executeSearch();
  };

  const handleLocationClick = (loc) => {
    setLocationTerm(loc);
    executeSearch({ location: loc });
  };

  const handleCategoryClick = (cat) => {
    if (cat.type === "workMode") {
      executeSearch({ workMode: cat.value });
    } else if (cat.type === "category") {
      executeSearch({ category: cat.value });
    } else {
      executeSearch({ query: cat.value });
    }
  };

  const handleRecentClick = (item) => {
    if (item.url) {
      doNavigate(item.url);
    } else {
      executeSearch({
        query: item.skills || item.label || "",
        location: item.location || ""
      });
    }
  };

  const handleRemoveRecentItem = (e, item) => {
    e.stopPropagation();
    const updated = removeRecentSearch(item.id || item.label);
    setRecentSearches(updated);
  };

  // Keyboard navigation for suggestions
  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      if (showSuggestions && activeIndex >= 0 && currentSuggestionList[activeIndex]) {
        e.preventDefault();
        const selected = currentSuggestionList[activeIndex];
        const label = typeof selected === "string" ? selected : selected.label;
        setSearchTerm(label);
        setShowSuggestions(false);
        executeSearch({ query: label });
        return;
      }
      handleFormSubmit(e);
      return;
    }

    if (e.key === "ArrowDown") {
      if (!showSuggestions) {
        setShowSuggestions(true);
        return;
      }
      e.preventDefault();
      setActiveIndex(prev => (prev < currentSuggestionList.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : currentSuggestionList.length - 1));
    }
  };

  // Keyboard navigation for mobile location suggestions
  const handleLocInputKeyDown = (e) => {
    if (e.key === "Enter") {
      if (showLocSuggestions && activeLocIndex >= 0 && currentLocationList[activeLocIndex]) {
        e.preventDefault();
        const selected = currentLocationList[activeLocIndex];
        const label = typeof selected === "string" ? selected : selected.label;
        setLocationTerm(label);
        setShowLocSuggestions(false);
        executeSearch({ location: label });
        return;
      }
      handleFormSubmit(e);
      return;
    }

    if (e.key === "ArrowDown") {
      if (!showLocSuggestions) {
        setShowLocSuggestions(true);
        return;
      }
      e.preventDefault();
      setActiveLocIndex(prev => (prev < currentLocationList.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveLocIndex(prev => (prev > 0 ? prev - 1 : currentLocationList.length - 1));
    }
  };

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const cleanQ = query.trim();
    if (!cleanQ) return text;
    const idx = text.toLowerCase().indexOf(cleanQ.toLowerCase());
    if (idx === -1) return text;
    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + cleanQ.length);
    const after = text.substring(idx + cleanQ.length);
    return (
      <>
        {before}
        <strong>{match}</strong>
        {after}
      </>
    );
  };

  return (
    <div className={`search-flow-wrapper mode-${mode}`}>
      {/* Modal Close Button (Image 1 style) */}
      {/* {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="search-flow-close-btn"
          title="Close (Esc)"
        >
          <LucideX size={20} />
        </button>
      )} */}

      {/* Main Search Bar (Pill Shape with Dropdown + Input + Search Btn) */}
      <form onSubmit={handleFormSubmit} className="m-0" ref={barRef}>
        <div className="search-flow-bar">

          {/* 1. Type Selector Dropdown: Internships / Jobs / Courses */}
          <div className="search-flow-type-container">
            <button
              type="button"
              className="search-flow-type-btn"
              onClick={() => setShowTypeDropdown(prev => !prev)}
              aria-expanded={showTypeDropdown}
            >
              <CurrentTypeIcon size={15} className="search-flow-type-icon" />
              <span>{selectedType}</span>
              <IoChevronDownOutline
                size={13}
                className={`search-flow-type-arrow ${showTypeDropdown ? "open" : ""}`}
              />
            </button>

            {/* Dropdown Menu matching Image 1 with checkmark */}
            {showTypeDropdown && (
              <div className="search-flow-type-menu" ref={typeMenuRef}>
                {TYPE_OPTIONS.map((opt) => {
                  const isSelected = selectedType === opt.label;
                  const IconComp = opt.icon;
                  return (
                    <div
                      key={opt.id}
                      className={`search-flow-type-item ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedType(opt.label);
                        setShowTypeDropdown(false);
                        inputRef.current?.focus();
                      }}
                    >
                      <div className="search-flow-type-item-left">
                        <IconComp size={15} className="search-flow-type-item-icon" />
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && (
                        <LucideCheck size={16} className="search-flow-type-check" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Vertical Divider */}
          <div className="search-flow-divider" />

          {/* 2. Search Input */}
          <div className="search-flow-input-wrap">
            <SearchOutlined className="search-flow-icon" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(Boolean(e.target.value.trim()));
                setActiveIndex(-1);
              }}
              onFocus={() => {
                if (searchTerm.trim()) setShowSuggestions(true);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder={getPlaceholderText()}
              className="search-flow-input"
              autoComplete="off"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setShowSuggestions(false);
                  inputRef.current?.focus();
                }}
                className="search-flow-clear-btn"
                title="Clear"
              >
                <CloseCircleFilled />
              </button>
            )}

            {/* Auto-suggestions Popover */}
            {showSuggestions && currentSuggestionList.length > 0 && (
              <div className="search-flow-suggestions">
                {currentSuggestionList.map((item, idx) => {
                  const isHighlighted = activeIndex === idx;
                  const label = typeof item === "string" ? item : (item.label || item.name || "");
                  const badge = item.type || (item.role ? "Role" : item.skill ? "Skill" : item.company ? "Company" : "");
                  return (
                    <div
                      key={`sug-${idx}`}
                      className={`search-flow-suggestion-item ${isHighlighted ? "active" : ""}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchTerm(label);
                        setShowSuggestions(false);
                        executeSearch({ query: label });
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <div className="search-flow-suggestion-left">
                        <Search size={13} className="search-flow-suggestion-icon" />
                        <span className="search-flow-suggestion-text">
                          {highlightMatch(label, searchTerm)}
                        </span>
                      </div>
                      {badge && (
                        <span className="search-flow-suggestion-badge">{badge}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2b. Location Search Filter (Mobile View Only) */}
          <div className="search-flow-divider search-flow-divider-mobile-only" />

          <div
            className="search-flow-input-wrap search-flow-location-wrap-mobile-only"
            ref={locWrapRef}
          >
            <MapPin size={17} className="search-flow-icon search-flow-loc-icon" />
            <input
              ref={locInputRef}
              type="text"
              value={locationTerm}
              onChange={(e) => {
                setLocationTerm(e.target.value);
                setShowLocSuggestions(Boolean(e.target.value.trim()));
                setActiveLocIndex(-1);
              }}
              onFocus={() => {
                setShowLocSuggestions(true);
              }}
              onKeyDown={handleLocInputKeyDown}
              placeholder="Search by city, area, or 'Remote'..."
              className="search-flow-input"
              autoComplete="off"
            />
            {locationTerm && (
              <button
                type="button"
                onClick={() => {
                  setLocationTerm("");
                  setShowLocSuggestions(false);
                  locInputRef.current?.focus();
                }}
                className="search-flow-clear-btn"
                title="Clear location"
              >
                <CloseCircleFilled />
              </button>
            )}

            {/* Location Auto-suggestions Popover */}
            {showLocSuggestions && currentLocationList.length > 0 && (
              <div className="search-flow-suggestions search-flow-loc-suggestions">
                {currentLocationList.map((item, idx) => {
                  const isHighlighted = activeLocIndex === idx;
                  const label = typeof item === "string" ? item : (item.label || item.name || "");
                  return (
                    <div
                      key={`loc-sug-${idx}`}
                      className={`search-flow-suggestion-item ${isHighlighted ? "active" : ""}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setLocationTerm(label);
                        setShowLocSuggestions(false);
                        executeSearch({ location: label });
                      }}
                      onMouseEnter={() => setActiveLocIndex(idx)}
                    >
                      <div className="search-flow-suggestion-left">
                        <MapPin size={13} className="search-flow-suggestion-icon loc-accent" />
                        <span className="search-flow-suggestion-text">
                          {highlightMatch(label, locationTerm)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Search Button (CareerFast Theme) */}
          <button type="submit" className="search-flow-submit-btn">
            <Search size={15} strokeWidth={2.4} />
            <span>Search</span>
          </button>
        </div>
      </form>

      {/* Workflow Pills Section: Popular Locations + Popular Categories */}
      <div className="search-flow-content">

        {/* Row 1: Popular Locations */}
        <div className="search-flow-group search-flow-locations-group">
          <div className="search-flow-group-badge">
            <MapPin size={13} className="search-flow-group-icon loc-accent" />
            <span>Popular Cities</span>
          </div>
          <div className="search-flow-pills-row">
            {POPULAR_LOCATIONS.map((loc, idx) => (
              <button
                type="button"
                key={`loc-${idx}`}
                className="search-flow-pill search-flow-pill-location"
                onClick={() => handleLocationClick(loc)}
                title={`Explore jobs in ${loc}`}
              >
                <span>{loc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Recent Searches */}
        {showRecent && recentSearches.length > 0 && (
          <div className="search-flow-group search-flow-recent-group">
            <div className="search-flow-group-badge">
              <HistoryOutlined style={{ color: "#7f5af0", fontSize: 13 }} />
              <span>Recent Searches</span>
            </div>
            <div className="search-flow-pills-row">
              {recentSearches.slice(0, 4).map((search, idx) => (
                <div
                  key={search.id || `rec-${idx}`}
                  className="search-flow-pill search-flow-pill-recent"
                  onClick={() => handleRecentClick(search)}
                  title="Click to search again"
                >
                  <HistoryOutlined style={{ color: "#8292b4", fontSize: 12 }} />
                  <span>{search.label}</span>
                  {typeof search.count === "number" && search.count > 0 && (
                    <span className="search-flow-chip-count">{search.count}</span>
                  )}
                  {search.isNew && (
                    <span className="search-flow-chip-new">NEW</span>
                  )}
                  <span
                    className="search-flow-chip-remove"
                    title="Remove"
                    onClick={(e) => handleRemoveRecentItem(e, search)}
                  >
                    &times;
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
