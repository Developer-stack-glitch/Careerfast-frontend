'use client';
import React, { useEffect, useState, useRef, useMemo } from "react";
import logo from "../images/careerfastlogofinal.png";
import { useNavigate, usePathname, useLocation } from "@/routing-shim";
import { getImageUrl } from "../utils/getImageUrl";
// Header.css already in layout.jsx
import { useDispatch, useSelector } from "react-redux";
import { storeLoginStatus } from "../Redux/Slice";
import {
  Input,
  Select,
  Avatar,
  Dropdown,
  Drawer,
  Space,
  List,
  Typography,
  Progress,
  Popover,
  message,
  Button as AntButton,
  Modal,
  Spin,
} from "antd";

import {
  UserOutlined,
  PlusOutlined,
  SettingOutlined,
  AppstoreOutlined,
  UserAddOutlined,
  CloseOutlined,
  ArrowRightOutlined,
  LogoutOutlined,
  RightOutlined,
  HeartOutlined,
  ShoppingOutlined,
  ProfileOutlined,
  LockOutlined,
  ReadOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  CloseCircleFilled,
} from "@ant-design/icons";

import {
  CrownFilled,
} from "@ant-design/icons";
import { getUserProfile, getSearchSuggestions, searchLocationsAPI } from "../ApiService/action";
import { calculateCandidateCompletion, broadcastProfileProgress, PROFILE_PROGRESS_EVENT } from "../utils/profileCompletion";
import { IoChevronDownOutline } from "react-icons/io5";
import { FaBookOpen, FaCalendarAlt, FaChalkboardTeacher, FaGraduationCap } from "react-icons/fa";
import {
  Blocks,
  BookAlert,
  LayoutDashboard,
  GraduationCap as LucideGraduationCap,
  ShieldCheck,
  Building2,
  LogIn,
  CheckCircle2,
  Sparkles,
  Search as LucideSearch,
  MapPin,
  X as LucideX,
  ChevronDown as LucideChevronDown,
  ArrowRight as LucideArrowRight,
  Check as LucideCheck,
  RotateCcw
} from "lucide-react";

const { Title, Text } = Typography;

const cleanSingleLocationName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name.split('/')[0].split('(')[0].split(',')[0].trim();
};

const ALL_STANDARD_LOCATIONS = [
  "Bangalore", "Chennai", "Hyderabad", "Mumbai", "Delhi", "Noida", "Gurgaon", "Pune", "Kolkata", "Ahmedabad",
  "Coimbatore", "Chandigarh", "Chhatrapati Sambhajinagar", "Cuttack", "Cuddalore", "Chiplun", "Chandrapur",
  "Calicut", "Kochi", "Jaipur", "Indore", "Visakhapatnam", "Bhubaneswar", "Trivandrum", "Vadodara",
  "Nagpur", "Mysore", "Surat", "Bhopal", "Lucknow", "Patna", "Agra", "Ajmer", "Aligarh", "Allahabad",
  "Amravati", "Amritsar", "Asansol", "Bareilly", "Belgaum", "Bhavnagar", "Bikaner", "Bokaro", "Dehradun",
  "Dhanbad", "Durgapur", "Ernakulam", "Erode", "Faridabad", "Ghaziabad", "Gwalior", "Guwahati", "Hubli",
  "Jabalpur", "Jalandhar", "Jammu", "Jamshedpur", "Jodhpur", "Kanpur", "Kolhapur", "Kota", "Madurai",
  "Mangalore", "Meerut", "Moradabad", "Nashik", "Panaji", "Pondicherry", "Raipur", "Rajkot", "Ranchi",
  "Rourkela", "Salem", "Shimla", "Siliguri", "Solapur", "Srinagar", "Thane", "Tiruchirappalli", "Tirunelveli",
  "Tirupati", "Tirupur", "Udaipur", "Ujjain", "Varanasi", "Vijayawada", "Warangal", "Navi Mumbai", "Greater Noida",
  "Guntur", "Nellore", "Kakinada", "Rajahmundry", "Kurnool", "Anantapur", "Kadapa", "Tiruvallur", "Vellore",
  "Thanjavur", "Dindigul", "Nagercoil", "Kanchipuram", "Hosur", "Kollam", "Thrissur", "Kannur", "Alappuzha",
  "Kottayam", "Palakkad", "Kasaragod", "Malappuram", "Ludhiana", "Mohali", "Panchkula", "Haridwar", "Roorkee",
  "Gorakhpur", "Jhansi", "Mathura", "Alwar", "Bhilwara", "Sikar", "Bilaspur", "Korba", "Durg", "Bhilai",
  "Muzaffarpur", "Bhagalpur", "Gaya", "Darbhanga", "Silchar", "Dibrugarh", "Jorhat", "Shillong",
  "Gangtok", "Agartala", "Aizawl", "Imphal", "Remote", "Work from Home"
];

const ALL_POPULAR_SKILLS_AND_ROLES = [
  // Top Engineering / Software Roles
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Java Developer", "Python Developer", "React Developer", "React Native Developer",
  "Node.js Developer", "Angular Developer", "JavaScript Developer", "TypeScript Developer",
  "PHP Developer", "Laravel Developer", ".NET Developer", "C# Developer", "C++ Developer",
  "Android Developer", "iOS Developer", "Flutter Developer", "Mobile App Developer",
  "DevOps Engineer", "Cloud Engineer", "AWS Solutions Architect", "Azure Cloud Architect",
  "System Administrator", "Linux Administrator", "Network Engineer", "Cyber Security Analyst",
  "Data Analyst", "Data Scientist", "Data Engineer", "Business Analyst", "Power BI Developer",
  "Tableau Developer", "Machine Learning Engineer", "AI Specialist", "Deep Learning Engineer",
  "Database Administrator (DBA)", "SQL Developer", "QA Engineer", "Automation Test Engineer",
  "Manual Tester", "Software Tester", "SDET", "Selenium Tester", "Technical Support Engineer",
  "IT Support Specialist", "Helpdesk Executive", "Desktop Support Engineer", "Solutions Architect",
  "Technical Lead", "Engineering Manager",

  // Design & Creative Roles
  "UI/UX Designer", "Product Designer", "Graphic Designer", "Web Designer", "Visual Designer",
  "Figma Designer", "Video Editor", "Motion Graphic Designer", "3D Animator", "Content Creator",

  // Product, Project & Management
  "Product Manager", "Associate Product Manager", "Project Manager", "Scrum Master",
  "Agile Coach", "Operations Manager", "Operations Executive",

  // Marketing, Content & SEO
  "Digital Marketing Executive", "Digital Marketing Manager", "SEO Specialist", "SEM Specialist",
  "Social Media Manager", "Content Writer", "Copywriter", "Technical Writer", "Email Marketer",
  "Brand Manager", "Growth Specialist",

  // Sales, Support & BPO
  "Business Development Executive", "Business Development Manager", "Sales Executive",
  "Sales Manager", "Inside Sales Specialist", "B2B Sales", "Telecaller", "Telesales Executive",
  "Customer Support Executive", "Customer Success Manager", "BPO Executive", "Call Center Agent",

  // HR, Admin & Operations
  "HR Executive", "HR Manager", "HR Generalist", "HR Recruiter", "Talent Acquisition Specialist",
  "Technical Recruiter", "Office Administrator", "Administrative Assistant", "Executive Assistant",
  "Receptionist", "Data Entry Operator",

  // Finance, Accounts & Banking
  "Accountant", "Senior Accountant", "Chartered Accountant (CA)", "Accounts Executive",
  "Financial Analyst", "Finance Manager", "Tax Consultant", "GST Specialist", "Billing Executive",

  // Healthcare, Core Engineering & Others
  "Mechanical Engineer", "Civil Engineer", "Electrical Engineer", "Electronics Engineer",
  "Site Engineer", "Quality Control Engineer (QC)", "Pharmacist", "Medical Officer", "Intern"
];

const CITY_ALIASES = {
  "bengaluru": "Bangalore",
  "bang": "Bangalore",
  "blr": "Bangalore",
  "bombay": "Mumbai",
  "mum": "Mumbai",
  "madras": "Chennai",
  "chen": "Chennai",
  "maa": "Chennai",
  "calcutta": "Kolkata",
  "kol": "Kolkata",
  "ccu": "Kolkata",
  "secunderabad": "Hyderabad",
  "hyd": "Hyderabad",
  "gurugram": "Gurgaon",
  "gur": "Gurgaon",
  "ncr": "Delhi",
  "del": "Delhi",
  "cochin": "Kochi",
  "ernakulam": "Kochi",
  "kozhikode": "Calicut",
  "trichy": "Tiruchirappalli",
  "puducherry": "Pondicherry",
  "pondy": "Pondicherry",
  "goa": "Panaji",
  "baroda": "Vadodara",
  "vizag": "Visakhapatnam",
  "trivandrum": "Trivandrum",
  "thiruvananthapuram": "Trivandrum",
  "mysuru": "Mysore",
  "mangaluru": "Mangalore",
  "hubballi": "Hubli",
  "belagavi": "Belgaum",
  "prayagraj": "Allahabad",
  "allahabad": "Allahabad",
  "aurangabad": "Chhatrapati Sambhajinagar",
  "wfh": "Remote",
  "home": "Remote"
};

const getInstantLocationMatches = (query) => {
  if (!query || !query.trim()) return [];
  const cleanQ = query.trim().toLowerCase();
  const aliasCity = CITY_ALIASES[cleanQ];

  const startsWith = [];
  const contains = [];

  if (aliasCity) {
    startsWith.push(aliasCity);
  }

  for (let i = 0; i < ALL_STANDARD_LOCATIONS.length; i++) {
    const city = ALL_STANDARD_LOCATIONS[i];
    if (aliasCity && city.toLowerCase() === aliasCity.toLowerCase()) continue;
    const lower = city.toLowerCase();
    if (lower.startsWith(cleanQ)) {
      startsWith.push(city);
    } else if (lower.includes(cleanQ)) {
      contains.push(city);
    }
  }

  return [...startsWith, ...contains].slice(0, 10).map((c) => ({ label: c }));
};

const getInstantSkillsMatches = (query) => {
  if (!query || !query.trim()) return [];
  const cleanQ = query.trim().toLowerCase();

  const startsWith = [];
  const contains = [];

  for (let i = 0; i < ALL_POPULAR_SKILLS_AND_ROLES.length; i++) {
    const item = ALL_POPULAR_SKILLS_AND_ROLES[i];
    const lower = item.toLowerCase();
    if (lower.startsWith(cleanQ)) {
      startsWith.push(item);
    } else if (lower.includes(cleanQ)) {
      contains.push(item);
    }
  }

  return [...startsWith, ...contains].slice(0, 8).map((s) => ({ label: s }));
};

export default function Header({ noSticky = false, showSearch }) {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.loginstatus);
  const showDrawer = () => setOpen(true);
  const onClose = () => setOpen(false);
  const [loginUserId, setLoginUserId] = useState(null);
  const [roleId, setRoleId] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const currentPath = usePathname();
  const location = useLocation();

  // Determine whether this is a filter / search page where header search is appropriate
  const isFilterPage = Boolean(
    currentPath && (
      currentPath.includes("filter") ||
      currentPath.startsWith("/jobs") ||
      currentPath.startsWith("/internships") ||
      currentPath.startsWith("/job-") ||
      currentPath.startsWith("/internship-")
    )
  );
  const shouldShowSearch = showSearch !== undefined ? Boolean(showSearch) : isFilterPage;
  const [headerProgress, setHeaderProgress] = useState(0);
  const [megaTab, setMegaTab] = useState("locations");
  const [candidateModalVisible, setCandidateModalVisible] = useState(false);
  const COURSE_URL = process.env.NEXT_PUBLIC_COURSE_URL || "";

  // Quick Job Search Modal States (CareerFast Concept)
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [quickKeywords, setQuickKeywords] = useState("");
  const [quickExperience, setQuickExperience] = useState(null);
  const [quickLocation, setQuickLocation] = useState("");

  // Suggestions & Dropdown States matching exact HomePage & Naukri API & UI
  const [skillsSuggestions, setSkillsSuggestions] = useState({ roles: [], skills: [], companies: [] });
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [skillsActiveIndex, setSkillsActiveIndex] = useState(-1);
  const [locationActiveIndex, setLocationActiveIndex] = useState(-1);

  const quickSearchInputRef = useRef(null);
  const locationInputRef = useRef(null);
  const skillsDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);
  const latestSkillsQueryRef = useRef("");
  const latestLocationQueryRef = useRef("");

  // Helper to get active term after last comma
  const getLastQueryTerm = (val) => {
    if (!val) return "";
    const parts = val.split(",");
    return parts[parts.length - 1].trim();
  };

  // Helper to cleanly append or replace the active term with selected suggestion
  const appendSuggestionToInput = (currentVal, suggestion) => {
    if (!currentVal || !currentVal.trim()) {
      return suggestion + ", ";
    }
    const parts = currentVal.split(",");
    parts.pop(); // remove whatever was typed after the last comma
    const cleanPrefix = parts.map((p) => p.trim()).filter(Boolean);
    if (!cleanPrefix.some((p) => p.toLowerCase() === suggestion.toLowerCase())) {
      cleanPrefix.push(suggestion);
    }
    return cleanPrefix.join(", ") + ", ";
  };

  // Matching query highlighter for bold search terms
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const cleanQ = query.trim();
    if (!cleanQ) return text;
    const index = text.toLowerCase().indexOf(cleanQ.toLowerCase());
    if (index === -1) return text;
    const before = text.substring(0, index);
    const match = text.substring(index, index + cleanQ.length);
    const after = text.substring(index + cleanQ.length);
    return (
      <span className="hp-suggestion-text-inner">
        {before}
        <strong className="matched-text">{match}</strong>
        {after}
      </span>
    );
  };

  // Active query terms
  const activeSkillTerm = getLastQueryTerm(quickKeywords);
  const activeLocTerm = getLastQueryTerm(quickLocation);

  // Synchronous 0ms in-memory instant suggestions
  const instantSkillItems = useMemo(() => getInstantSkillsMatches(activeSkillTerm), [activeSkillTerm]);
  const instantLocItems = useMemo(() => getInstantLocationMatches(activeLocTerm), [activeLocTerm]);

  // Fast active skills list: prefer fresh API items if matching, otherwise instant items
  const currentSkillsList = useMemo(() => {
    if (!activeSkillTerm) return [];
    const apiList = [
      ...(skillsSuggestions.roles || []),
      ...(skillsSuggestions.skills || []),
      ...(skillsSuggestions.companies || []),
    ];
    if (apiList.length > 0 && latestSkillsQueryRef.current === activeSkillTerm.toLowerCase()) {
      return apiList.slice(0, 8);
    }
    return instantSkillItems;
  }, [activeSkillTerm, skillsSuggestions, instantSkillItems]);

  // Fast active locations list: prefer fresh API items if matching, otherwise instant items
  const currentLocationList = useMemo(() => {
    if (!activeLocTerm) return [];
    if (locationSuggestions.length > 0 && latestLocationQueryRef.current === activeLocTerm.toLowerCase()) {
      return locationSuggestions.slice(0, 10);
    }
    return instantLocItems;
  }, [activeLocTerm, locationSuggestions, instantLocItems]);

  // Background API enrichment for Skills / Roles / Companies
  useEffect(() => {
    if (!activeSkillTerm) {
      setSkillsSuggestions({});
      return;
    }

    const currentQ = activeSkillTerm.toLowerCase();
    latestSkillsQueryRef.current = currentQ;

    const timer = setTimeout(async () => {
      try {
        const res = await getSearchSuggestions({ q: activeSkillTerm, type: "all" });
        if (latestSkillsQueryRef.current === currentQ && res?.data?.data) {
          setSkillsSuggestions(res.data.data);
        }
      } catch (err) {
        // Keep instant matches
      }
    }, 40);

    return () => clearTimeout(timer);
  }, [activeSkillTerm]);

  // Background API enrichment for Locations
  useEffect(() => {
    if (!activeLocTerm) {
      setLocationSuggestions([]);
      return;
    }

    const currentQ = activeLocTerm.toLowerCase();
    latestLocationQueryRef.current = currentQ;

    const timer = setTimeout(async () => {
      try {
        const res = await getSearchSuggestions({ q: activeLocTerm, type: "locations" });
        if (latestLocationQueryRef.current === currentQ) {
          const locs = res?.data?.data?.locations || [];
          if (Array.isArray(locs) && locs.length > 0) {
            const cleanedNames = locs
              .map((l) => cleanSingleLocationName(l.label || l))
              .filter(Boolean);
            const unique = Array.from(new Set(cleanedNames));
            setLocationSuggestions(unique.map((name) => ({ label: name })));
          }
        }
      } catch (err) {
        // Keep instant matches
      }
    }, 40);

    return () => clearTimeout(timer);
  }, [activeLocTerm]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        skillsDropdownRef.current &&
        !skillsDropdownRef.current.contains(event.target) &&
        quickSearchInputRef.current &&
        !quickSearchInputRef.current.contains(event.target)
      ) {
        setShowSkillsDropdown(false);
      }

      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target)
      ) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSkillsSuggestion = (item) => {
    const label = typeof item === "string" ? item : (item.label || item.name || "");
    if (label) {
      setQuickKeywords((prev) => appendSuggestionToInput(prev, label));
    }
    setShowSkillsDropdown(false);
    setSkillsActiveIndex(-1);
    quickSearchInputRef.current?.focus();
  };

  const handleSelectLocationSuggestion = (item) => {
    const rawVal = typeof item === "string" ? item : (item.label || item.mainText || item.city || item);
    const locName = cleanSingleLocationName(typeof rawVal === "string" ? rawVal.trim() : String(rawVal));
    if (locName) {
      setQuickLocation((prev) => appendSuggestionToInput(prev, locName));
    }
    setShowLocationDropdown(false);
    setLocationActiveIndex(-1);
    locationInputRef.current?.focus();
  };

  const handleSkillsKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showSkillsDropdown && skillsActiveIndex >= 0 && currentSkillsList[skillsActiveIndex]) {
        const item = currentSkillsList[skillsActiveIndex];
        const label = typeof item === "string" ? item : (item.label || item.name || "");
        const newSkills = appendSuggestionToInput(quickKeywords, label);
        setQuickKeywords(newSkills);
        setShowSkillsDropdown(false);
        setSkillsActiveIndex(-1);
        handleQuickSearchSubmit({ skills: newSkills });
      } else {
        setShowSkillsDropdown(false);
        setSkillsActiveIndex(-1);
        handleQuickSearchSubmit();
      }
      return;
    }

    if (e.key === "Escape") {
      setShowSkillsDropdown(false);
      setSkillsActiveIndex(-1);
      return;
    }

    if (!showSkillsDropdown) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setShowSkillsDropdown(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSkillsActiveIndex((prev) => (prev < currentSkillsList.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSkillsActiveIndex((prev) => (prev > 0 ? prev - 1 : currentSkillsList.length - 1));
    }
  };

  const handleLocationKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showLocationDropdown && locationActiveIndex >= 0 && locationSuggestions[locationActiveIndex]) {
        const item = locationSuggestions[locationActiveIndex];
        const rawVal = typeof item === "string" ? item : (item.label || item.mainText || item.city || item);
        const locName = cleanSingleLocationName(typeof rawVal === "string" ? rawVal.trim() : String(rawVal));
        const newLocation = appendSuggestionToInput(quickLocation, locName);
        setQuickLocation(newLocation);
        setShowLocationDropdown(false);
        setLocationActiveIndex(-1);
        handleQuickSearchSubmit({ location: newLocation });
      } else {
        setShowLocationDropdown(false);
        setLocationActiveIndex(-1);
        handleQuickSearchSubmit();
      }
      return;
    }

    if (e.key === "Escape") {
      setShowLocationDropdown(false);
      setLocationActiveIndex(-1);
      return;
    }

    if (!showLocationDropdown) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setShowLocationDropdown(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setLocationActiveIndex((prev) => (prev < locationSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setLocationActiveIndex((prev) => (prev > 0 ? prev - 1 : locationSuggestions.length - 1));
    }
  };

  const smartNavigate = (path) => {
    const externalPrefixes = [];
    const isExternal = externalPrefixes.some(p => path.startsWith(p));

    if (!isExternal || !COURSE_URL) {
      navigate(path);
    } else {
      // Redirect to the Course project
      window.location.href = `${COURSE_URL}${path}`;
    }
  };

  // Focus quick search input when modal opens
  useEffect(() => {
    if (quickSearchOpen) {
      const timer = setTimeout(() => {
        quickSearchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [quickSearchOpen]);

  // Keyboard shortcuts: Ctrl+K / Cmd+K to toggle, Escape to close
  useEffect(() => {
    if (!shouldShowSearch) return;
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuickSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        if (quickSearchOpen) {
          setQuickSearchOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quickSearchOpen, shouldShowSearch]);

  // Sync search keyword, location, experience from URL
  useEffect(() => {
    if (!shouldShowSearch) return;
    const searchStr = location?.search || (typeof window !== "undefined" ? window.location.search : "");
    const params = new URLSearchParams(searchStr);
    const q = params.get("q") || "";
    const l = params.get("l") || "";
    const expParam = params.get("experience");
    const userTypeParam = params.get("userType");
    const natureParam = params.get("job_nature");

    let exp = null;
    if (expParam !== null && expParam !== undefined && expParam !== "") {
      exp = expParam;
    } else if (userTypeParam === "Fresher") {
      exp = 0;
    } else if (natureParam === "Internship") {
      exp = "Internship";
    }

    setQuickKeywords(q);
    setQuickLocation(l);
    setQuickExperience(exp);
  }, [shouldShowSearch, location?.pathname, location?.search]);

  // Listen for clear filter event dispatched from JobFilter
  useEffect(() => {
    const handleClearHeaderSearch = () => {
      setQuickKeywords("");
      setQuickLocation("");
      setQuickExperience(null);
      setShowSkillsDropdown(false);
      setShowLocationDropdown(false);
    };
    window.addEventListener("clearHeaderSearch", handleClearHeaderSearch);
    return () => window.removeEventListener("clearHeaderSearch", handleClearHeaderSearch);
  }, []);

  const handleClearQuickFilters = () => {
    setQuickKeywords("");
    setQuickLocation("");
    setQuickExperience(null);
    setShowSkillsDropdown(false);
    setShowLocationDropdown(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("clearHeaderSearch"));
    }
    if (isFilterPage) {
      smartNavigate("/jobs");
    }
  };

  const handleQuickSearchSubmit = (overrides = {}) => {
    if (overrides && overrides.preventDefault) overrides.preventDefault();
    const skillsToUse = overrides && overrides.hasOwnProperty('skills') ? overrides.skills : quickKeywords;
    const locationToUse = overrides && overrides.hasOwnProperty('location') ? overrides.location : quickLocation;
    const experienceToUse = overrides && overrides.hasOwnProperty('experience') ? overrides.experience : quickExperience;

    const locParts = (locationToUse || "")
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    const skillTrimmed = (skillsToUse || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ");

    const hasExperience = experienceToUse !== null && experienceToUse !== undefined && experienceToUse !== "";

    if (!skillTrimmed && locParts.length === 0 && !hasExperience) {
      message.info("Please enter some search criteria");
      return;
    }

    let queryParams = [];
    if (skillTrimmed) queryParams.push(`q=${encodeURIComponent(skillTrimmed)}`);
    locParts.forEach((loc) => {
      queryParams.push(`l=${encodeURIComponent(loc)}`);
    });
    if (hasExperience) {
      if (String(experienceToUse).toLowerCase() === "internship") {
        queryParams.push(`job_nature=Internship`);
      } else if (experienceToUse === 0 || experienceToUse === "0" || experienceToUse === "Fresher") {
        queryParams.push(`userType=Fresher`);
      } else {
        queryParams.push(`experience=${experienceToUse}`);
      }
    }

    const searchUrl = `/job-filter?${queryParams.join("&")}`;
    smartNavigate(searchUrl);
    setQuickSearchOpen(false);
  };

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("profileProgress");
    if (saved) {
      setHeaderProgress(parseInt(saved, 10));
    }

    const handleProgress = (e) => {
      if (e?.detail?.percentage !== undefined) {
        setHeaderProgress(Number(e.detail.percentage));
      } else {
        const currentSaved = localStorage.getItem("profileProgress");
        if (currentSaved) setHeaderProgress(parseInt(currentSaved, 10));
      }
    };

    window.addEventListener(PROFILE_PROGRESS_EVENT, handleProgress);
    return () => window.removeEventListener(PROFILE_PROGRESS_EVENT, handleProgress);
  }, []);

  useEffect(() => {
    const syncAuth = () => {
      const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
      };

      let stored = localStorage.getItem("loginDetails");
      let token = localStorage.getItem("AccessToken");

      // Sync from cookies if localStorage is empty (in case logged in via course app)
      if (!token) {
        const cookieToken = getCookie("AccessToken");
        const cookieDetails = getCookie("loginDetails");
        if (cookieToken && cookieDetails) {
          localStorage.setItem("AccessToken", cookieToken);
          localStorage.setItem("loginDetails", decodeURIComponent(cookieDetails));
          token = cookieToken;
          stored = decodeURIComponent(cookieDetails);
          dispatch(storeLoginStatus(true));
        }
      }

      if (stored && token) {
        try {
          const loginDetails = JSON.parse(stored);
          setLoginUserId(loginDetails.id);
          setRoleId(loginDetails.role_id);
        } catch (err) {
          console.error("Invalid loginDetails", err);
        }
      } else {
        setLoginUserId(null);
        setRoleId(null);
      }
    };

    syncAuth();

    window.addEventListener("storage", syncAuth);
    window.addEventListener("authChange", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("authChange", syncAuth);
    };
  }, [dispatch]);

  const handleLogOut = () => {
    localStorage.removeItem("loginDetails");
    localStorage.removeItem("AccessToken");
    localStorage.removeItem("profileProgress");

    // Clear sync cookies
    document.cookie = "AccessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "loginDetails=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    dispatch(storeLoginStatus(false));
    setRoleId(null);
    smartNavigate("/login");
    message.error("Your'e logged out");
  };

  useEffect(() => {
    console.log("loginUserId updated", loginUserId);
    if (loginUserId) {
      getUserProfileData();
    }
  }, [loginUserId]);

  const getUserProfileData = async () => {
    const payload = {
      user_id: loginUserId,
    };

    try {
      const response = await getUserProfile(payload);
      console.log("getUserProfile", response);
      const image = response?.data?.data?.profile_image;
      const profile = response?.data?.data;
      setProfileImage(image);
      setFname(response?.data?.data?.first_name || "");
      setLname(response?.data?.data?.last_name || "");
      setEmail(response?.data?.data?.email || "");
      calculateCompletion(profile);
    } catch (error) {
      console.log("getuserprofile errorddd", error);
    }
  };


  const calculateCompletion = (profile) => {
    const { percentage } = calculateCandidateCompletion(profile);
    broadcastProfileProgress(percentage);
    setHeaderProgress(percentage);
    return percentage;
  };

  const jobsMenuContent = (
    <div className="jobs-mega-menu">
      <div className="mega-sidebar">
        <div
          className={`sidebar-item ${megaTab === "locations" ? "active" : ""}`}
          onMouseEnter={() => setMegaTab("locations")}
        >
          Top Locations
        </div>
        <div
          className={`sidebar-item ${megaTab === "categories" ? "active" : ""}`}
          onMouseEnter={() => setMegaTab("categories")}
        >
          Top Categories
        </div>
        <div
          className={`sidebar-item ${megaTab === "fresher" ? "active" : ""}`}
          onMouseEnter={() => setMegaTab("fresher")}
        >
          Fresher Jobs
        </div>
      </div>
      <div className="mega-content">
        {megaTab === "locations" && (
          <ul className="mega-list">
            <li onClick={() => { smartNavigate("/jobs/jobs-in-chennai"); setOpen(false); }}>Jobs in Chennai</li>
            <li onClick={() => { smartNavigate("/jobs/work-from-home"); setOpen(false); }}>Work from home</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-bangalore"); setOpen(false); }}>Jobs in Bangalore</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-delhi"); setOpen(false); }}>Jobs in Delhi</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-hyderabad"); setOpen(false); }}>Jobs in Hyderabad</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-gurgaon"); setOpen(false); }}>Jobs in Gurgaon</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-kolkata"); setOpen(false); }}>Jobs in Kolkata</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-mumbai"); setOpen(false); }}>Jobs in Mumbai</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-pune"); setOpen(false); }}>Jobs in Pune</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-noida"); setOpen(false); }}>Jobs in Noida</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-jaipur"); setOpen(false); }}>Jobs in Jaipur</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-coimbatore"); setOpen(false); }}>Jobs in Coimbatore</li>
            <li onClick={() => { smartNavigate("/jobs/jobs-in-lucknow"); setOpen(false); }}>Jobs in Lucknow</li>
          </ul>
        )}
        {megaTab === "categories" && (
          <ul className="mega-list">
            <li onClick={() => { smartNavigate("/jobs/full-stack-development-jobs"); setOpen(false); }}>Full Stack Development</li>
            <li onClick={() => { smartNavigate("/jobs/devops-cloud-computing-jobs"); setOpen(false); }}>DevOps & Cloud Computing</li>
            <li onClick={() => { smartNavigate("/jobs/data-science-analytics-jobs"); setOpen(false); }}>Data Science & Analytics</li>
            <li onClick={() => { smartNavigate("/jobs/frontend-development-jobs"); setOpen(false); }}>Frontend Development</li>
            <li onClick={() => { smartNavigate("/jobs/hr-analytics-jobs"); setOpen(false); }}>HR Analytics</li>
            <li onClick={() => { smartNavigate("/jobs/software-development-jobs"); setOpen(false); }}>Software Development</li>
            <li onClick={() => { smartNavigate("/jobs/ui-ux-design-jobs"); setOpen(false); }}>UI/UX Design</li>
          </ul>
        )}
        {megaTab === "fresher" && (
          <ul className="mega-list">
            <li onClick={() => { smartNavigate("/jobs/fresher-work-from-home-jobs"); setOpen(false); }}>Work from home</li>
            <li onClick={() => { smartNavigate("/jobs/fresher-jobs-in-chennai"); setOpen(false); }}>Freshers job in Chennai</li>
            <li onClick={() => { smartNavigate("/jobs/fresher-jobs-in-bangalore"); setOpen(false); }}>Freshers job in Bangalore</li>
          </ul>
        )}
      </div>
    </div>
  );

  const internshipsMenuContent = (
    <div className="jobs-mega-menu">
      <div className="mega-sidebar">
        <div
          className={`sidebar-item ${megaTab === "locations" ? "active" : ""}`}
          onMouseEnter={() => setMegaTab("locations")}
        >
          Top Locations
        </div>
        <div
          className={`sidebar-item ${megaTab === "categories" ? "active" : ""}`}
          onMouseEnter={() => setMegaTab("categories")}
        >
          Top Categories
        </div>
        <div
          className={`sidebar-item ${megaTab === "fresher" ? "active" : ""}`}
          onMouseEnter={() => setMegaTab("fresher")}
        >
          Fresher Internships
        </div>
      </div>
      <div className="mega-content">
        {megaTab === "locations" && (
          <ul className="mega-list">
            <li onClick={() => { smartNavigate("/internships/internships-in-chennai"); setOpen(false); }}>Internships in Chennai</li>
            <li onClick={() => { smartNavigate("/internships/work-from-home"); setOpen(false); }}>Work from home</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-bangalore"); setOpen(false); }}>Internships in Bangalore</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-delhi"); setOpen(false); }}>Internships in Delhi</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-hyderabad"); setOpen(false); }}>Internships in Hyderabad</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-gurgaon"); setOpen(false); }}>Internships in Gurgaon</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-kolkata"); setOpen(false); }}>Internships in Kolkata</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-mumbai"); setOpen(false); }}>Internships in Mumbai</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-pune"); setOpen(false); }}>Internships in Pune</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-noida"); setOpen(false); }}>Internships in Noida</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-jaipur"); setOpen(false); }}>Internships in Jaipur</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-coimbatore"); setOpen(false); }}>Internships in Coimbatore</li>
            <li onClick={() => { smartNavigate("/internships/internships-in-lucknow"); setOpen(false); }}>Internships in Lucknow</li>
          </ul>
        )}
        {megaTab === "categories" && (
          <ul className="mega-list">
            <li onClick={() => { smartNavigate("/internships/full-stack-development-jobs"); setOpen(false); }}>Full Stack Development</li>
            <li onClick={() => { smartNavigate("/internships/devops-cloud-computing-jobs"); setOpen(false); }}>DevOps & Cloud Computing</li>
            <li onClick={() => { smartNavigate("/internships/data-science-analytics-jobs"); setOpen(false); }}>Data Science & Analytics</li>
            <li onClick={() => { smartNavigate("/internships/frontend-development-jobs"); setOpen(false); }}>Frontend Development</li>
            <li onClick={() => { smartNavigate("/internships/hr-analytics-jobs"); setOpen(false); }}>HR Analytics</li>
            <li onClick={() => { smartNavigate("/internships/software-development-jobs"); setOpen(false); }}>Software Development</li>
            <li onClick={() => { smartNavigate("/internships/ui-ux-design-jobs"); setOpen(false); }}>UI/UX Design</li>
          </ul>
        )}
        {megaTab === "fresher" && (
          <ul className="mega-list">
            <li onClick={() => { smartNavigate("/internships/fresher-work-from-home-jobs"); setOpen(false); }}>Work from home</li>
            <li onClick={() => { smartNavigate("/internships/fresher-jobs-in-chennai"); setOpen(false); }}>Freshers internship in Chennai</li>
            <li onClick={() => { smartNavigate("/internships/fresher-jobs-in-bangalore"); setOpen(false); }}>Freshers internship in Bangalore</li>
          </ul>
        )}
      </div>
    </div>
  );

  const menuItems = [
    { key: "jobs", label: "Jobs", path: "/job-filter?job_nature=Job", isDropdown: true },
    {
      key: "internships",
      label: "Internships",
      path: "/job-filter?job_nature=Internship",
      isDropdown: true
    },
    // { key: "mentorships", label: "Mentorships", path: "/mentors" },
  ];

  const moreMenuItems = [
    {
      key: "scholarships",
      path: "/scholarship",
      label: (
        <div className="menu-item">
          <FaGraduationCap className="menu-icon" />
          <span>Scholarships</span>
        </div>
      ),
      onClick: () => smartNavigate("/scholarship"),
    },
    {
      key: "events",
      path: "/event-filter",
      label: (
        <div className="menu-item">
          <FaCalendarAlt className="menu-icon" />
          <span>Events</span>
        </div>
      ),
      onClick: () => smartNavigate("/event-filter"),
    },
    {
      key: "workshop",
      path: "/workshop-filter",
      label: (
        <div className="menu-item">
          <FaChalkboardTeacher className="menu-icon" />
          <span>Workshop</span>
        </div>
      ),
      onClick: () => smartNavigate("/workshop-filter"),
    },
    {
      key: "courses",
      path: "/courses",
      label: (
        <div className="menu-item">
          <FaBookOpen className="menu-icon" />
          <span>Courses</span>
        </div>
      ),
      onClick: () => smartNavigate("/courses"),
    },
    {
      key: "Blogs",
      path: "/blogs",
      label: (
        <div className="menu-item">
          <Blocks size={18} className="menu-icon" />
          <span>Blogs</span>
        </div>
      ),
      onClick: () => smartNavigate("/blogs"),
    },
    {
      key: "Pricing",
      path: "/recruiter-pricing",
      label: (
        <div className="menu-item">
          <CrownFilled className="menu-icon" style={{ color: "#FB6202" }} />
          <span>Recruiter Pricing</span>
        </div>
      ),
      onClick: () => smartNavigate("/recruiter-pricing"),
    },
  ];

  const moreMenuContent = (
    <div className="more-dropdown-menu">
      {moreMenuItems.map((item) => (
        <div
          key={item.key}
          className="more-menu-item"
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );

  const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const defaultHrUrl = isLocalHost ? (typeof window !== 'undefined' && window.location.port === '3001' ? 'http://localhost:3000' : 'http://localhost:3001') : 'https://recruit.careerfast.in';
  const hrPortalUrl = isLocalHost
    ? (typeof window !== 'undefined' && window.location.port === '3001' ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_HR_PORTAL_URL || 'http://localhost:3000'))
    : (process.env.NEXT_PUBLIC_HR_PORTAL_URL || 'https://recruit.careerfast.in');

  const employerItems = [
    {
      key: '1',
      label: <div className="employer-menu-item">Recruiter Pricing & Plans</div>,
      onClick: () => smartNavigate("/recruiter-pricing")
    },
    {
      key: '2',
      label: <div className="employer-menu-item">Post a Job (Free)</div>,
      onClick: () => { window.location.href = `${hrPortalUrl}/register`; }
    },
    {
      key: '3',
      label: <div className="employer-menu-item">Employer Login</div>,
      onClick: () => { window.location.href = `${hrPortalUrl}/login`; }
    }
  ];

  return (
    <>
      <div className="top-bar-custom">
        <div className="trust-marquee-wrapper-full">
          <div className="trust-marquee-track">
            <div className="trust-marquee-content">
              <span className="marquee-item"><span className="marquee-star">★</span> Trusted by <strong className="marquee-accent">10,000+</strong> Top Companies worldwide</span>
              <span className="marquee-divider">•</span>
              <span className="marquee-item"><span className="marquee-emoji">🚀</span> <strong className="marquee-accent">500,000+</strong> Students & Job Seekers Placed</span>
              <span className="marquee-divider">•</span>
              <span className="marquee-item"><span className="marquee-emoji">💼</span> <strong className="marquee-accent">#1</strong> Verified Career & Job Platform in India</span>
              <span className="marquee-divider">•</span>
              <span className="marquee-item"><span className="marquee-emoji">🎓</span> Top Rated <strong className="marquee-accent">Internship</strong> & Mentorship Programs</span>
              <span className="marquee-divider">•</span>
              <span className="marquee-item"><span className="marquee-emoji">🛡️</span> <strong className="marquee-accent">100% Verified</strong> Recruiter Postings & Anti-Scam Protection</span>
              <span className="marquee-divider">•</span>
              <span className="marquee-item"><span className="marquee-emoji">⚡</span> Direct HR Hiring & <strong className="marquee-accent">Zero Hidden Fees</strong></span>
              <span className="marquee-divider">•</span>
              <span className="marquee-item"><span className="marquee-emoji">🏢</span> Partnered with <strong className="marquee-accent">Fortune 500</strong> & Unicorn Startups</span>
              <span className="marquee-divider">•</span>
            </div>
            <div className="trust-marquee-content" aria-hidden="true">
              <span className="marquee-item"><span className="marquee-star">★</span> Trusted by <strong className="marquee-accent">10,000+</strong> Top Companies worldwide</span>
              <span className="marquee-divider">•</span>
              <span className="marquee-item"><span className="marquee-emoji">🚀</span> <strong className="marquee-accent">500,000+</strong> Students & Job Seekers Placed</span>
              <span className="marquee-divider">•</span>
              <span className="marquee-item"><span className="marquee-emoji">💼</span> <strong className="marquee-accent">#1</strong> Verified Career & Job Platform in India</span>
              <span className="marquee-divider">•</span>
              <span className="marquee-item"><span className="marquee-emoji">🎓</span> Top Rated <strong className="marquee-accent">Internship</strong> & Mentorship Programs</span>
              <span className="marquee-divider">•</span>
              <span className="marquee-item"><span className="marquee-emoji">🛡️</span> <strong className="marquee-accent">100% Verified</strong> Recruiter Postings & Anti-Scam Protection</span>
              <span className="marquee-divider">•</span>
              <span className="marquee-item"><span className="marquee-emoji">⚡</span> Direct HR Hiring & <strong className="marquee-accent">Zero Hidden Fees</strong></span>
              <span className="marquee-divider">•</span>
              <span className="marquee-item"><span className="marquee-emoji">🏢</span> Partnered with <strong className="marquee-accent">Fortune 500</strong> & Unicorn Startups</span>
              <span className="marquee-divider">•</span>
            </div>
          </div>
        </div>
      </div>
      <header className={`bg-white py-2 elite-header ${noSticky ? '' : 'sticky-top'}`}>
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center w-100">
            <div className="d-flex align-items-center gap-4 global_search">
              <div className="m-0 p-0 navbar-brand">
                <img
                  onClick={() => smartNavigate("/")}
                  src={typeof logo === 'string' ? logo : logo?.src}
                  style={{ cursor: "pointer", width: "180px", height: "auto", objectFit: "contain" }}
                  alt="CareerFast Logo"
                  className="main-logo"
                />
              </div>
            </div>

            {/* Desktop Navigation & Search */}
            <div className={`d-none d-md-flex align-items-center flex-grow-1 ${shouldShowSearch ? 'px-3' : 'justify-content-center'}`}>
              <nav className="nav align-items-center gap-2 flex-shrink-0">
                {menuItems.map((item) => (
                  item.isDropdown ? (
                    <Dropdown
                      key={item.key}
                      popupRender={() => item.key === "jobs" ? jobsMenuContent : internshipsMenuContent}
                      trigger={["hover"]}
                      placement="bottomLeft"
                    >
                      <div
                        className={`nav-link nav-item ${currentPath === item.path ? "active" : ""}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => smartNavigate(item.path)}
                      >
                        {item.icon} {item.label}
                      </div>
                    </Dropdown>
                  ) : (
                    <div
                      className={`nav-link nav-item ${currentPath === item.path ? "active" : ""}`}
                      style={{ cursor: item.key === "practice" ? "not-allowed" : "pointer" }}
                      key={item.key}
                      onClick={() => {
                        if (item.key !== "practice") {
                          onClose();
                          smartNavigate(item.path);
                        }
                      }}
                    >
                      {item.icon} {item.label}
                    </div>
                  )
                ))}
                <Dropdown
                  popupRender={() => moreMenuContent}
                  trigger={["hover"]}
                  placement="bottomLeft"
                >
                  <div
                    className={`nav-link nav-item ${moreMenuItems.some((menu) => currentPath === menu.path) ? "active" : ""}`}
                    style={{ cursor: "pointer" }}
                  >
                    More
                  </div>
                </Dropdown>
              </nav>

              {/* Centered & Enlarged Search Bar in Header */}
              {shouldShowSearch && (
                <div className="header-search-center-container">
                  <div
                    className="naukri-header-compact-search"
                    onClick={() => setQuickSearchOpen(true)}
                    title="Search jobs (Ctrl+K)"
                  >
                    <SearchOutlined style={{ color: "#8292b4", fontSize: 16, marginRight: 8 }} />
                    <span className={`naukri-compact-placeholder ${quickKeywords || quickLocation ? 'has-value' : ''}`}>
                      {quickKeywords
                        ? `${quickKeywords}${quickLocation ? ` in ${quickLocation}` : ''}`
                        : "Skills / designations / companies"}
                    </span>
                    {(quickKeywords || quickLocation) ? (
                      <button
                        type="button"
                        className="naukri-compact-clear-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearQuickFilters();
                        }}
                        title="Clear search"
                        style={{
                          background: "none",
                          border: "none",
                          padding: "0 6px",
                          cursor: "pointer",
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          fontSize: "15px",
                          transition: "color 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
                      >
                        <CloseCircleFilled />
                      </button>
                    ) : (
                      <span className="naukri-compact-shortcut hidden sm:inline-block">
                        Ctrl K
                      </span>
                    )}
                    <button
                      type="button"
                      className="naukri-compact-search-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickSearchOpen(true);
                      }}
                      title="Quick Search"
                    >
                      <SearchOutlined />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Actions */}
            <div className="d-flex align-items-center gap-4">
              {mounted && isLoggedIn === true ? (
                <>
                  <div
                    className="d-flex rounded-circle border-2 border-[#22c55e] align-items-center gap-1 user-dropdown"
                    style={{ cursor: "pointer" }}
                  >
                    <Avatar
                      onClick={showDrawer}
                      style={{ objectFit: "contain", backgroundColor: !profileImage ? "#f3f4f6" : "transparent", color: "#64748b" }}
                      size="large"
                      src={profileImage ? getImageUrl(profileImage) : undefined}
                      icon={!profileImage ? <UserOutlined /> : undefined}
                    />
                  </div>
                  {!currentPath.includes("/candidate-profile") && (
                    roleId === 2 ? (
                      <AntButton
                        className="host-button"
                        onClick={() => setCandidateModalVisible(true)}
                      >
                        <PlusOutlined /> Post a Job
                      </AntButton>
                    ) : (
                      <Popover
                        placement="bottomRight"
                        trigger="click"
                        content={
                          <div className="host-popup-container">
                            <div
                              onClick={() => smartNavigate("/post-jobs")}
                              className="host-popup-item"
                            >
                              <div className="host-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                <ShoppingOutlined />
                              </div>
                              <div className="host-popup-text">
                                <div className="host-popup-title">Jobs, Internships</div>
                                <div className="host-popup-sub">Hire the Right Talent</div>
                              </div>
                            </div>

                            <div
                              onClick={() => smartNavigate("/post-course")}
                              className="host-popup-item"
                            >
                              <div className="host-icon-wrapper" style={{ background: 'rgba(198, 11, 245, 0.1)', color: '#c60bf5' }}>
                                <ReadOutlined />
                              </div>
                              <div className="host-popup-text">
                                <div className="host-popup-title">Post a New Course</div>
                                <div className="host-popup-sub">
                                  Share your knowledge and attract eager learners
                                </div>
                              </div>
                            </div>
                            <div
                              onClick={() => smartNavigate("/add-blog")}
                              className="host-popup-item"
                            >
                              <div className="host-icon-wrapper" style={{ background: 'rgba(0, 86, 3, 0.1)', color: '#005603' }}>
                                <BookAlert size={18} />
                              </div>
                              <div className="host-popup-text">
                                <div className="host-popup-title">Post a Blog</div>
                                <div className="host-popup-sub">
                                  Insights & community stories
                                </div>
                              </div>
                            </div>
                            <div className="host-popup-item" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                              <div className="host-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                                <ProfileOutlined />
                              </div>
                              <div className="host-popup-text">
                                <div className="host-popup-title">Assessments</div>
                                <div className="host-popup-sub">Evaluate candidates</div>
                                <div className="host-popup-upgrade">
                                  <LockOutlined /> Upgrade
                                </div>
                              </div>
                            </div>
                          </div>
                        }
                      >
                        <AntButton className="host-button">
                          <PlusOutlined /> Post a Job
                        </AntButton>
                      </Popover>
                    )
                  )}
                </>
              ) : (
                <div className="d-flex align-items-center gap-3">
                  <AntButton
                    onClick={() => smartNavigate("/login")}
                    className="naukri-login-btn"
                  >
                    Login
                  </AntButton>
                  <AntButton
                    type="primary"
                    onClick={() => smartNavigate("/register")}
                    className="naukri-register-btn"
                  >
                    Register
                  </AntButton>
                  <div style={{ width: '1px', height: '20px', backgroundColor: '#cbd5e1', margin: '0 4px' }}></div>
                  <Dropdown menu={{ items: employerItems }} trigger={['hover']} placement="bottomRight">
                    <div className="for-employers-dropdown" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#1e293b', fontWeight: 500, fontSize: '14px' }}>
                      For employers <IoChevronDownOutline size={14} style={{ color: '#64748b' }} />
                    </div>
                  </Dropdown>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Quick Job Search Modal / Command Palette - CareerFast Concept */}
      {shouldShowSearch && quickSearchOpen && (
        <div
          className="fixed inset-0 z-[2050] flex items-start justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto pt-12 sm:pt-16 quick-job-search-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setQuickSearchOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] border border-slate-200/90 max-w-4xl w-full p-4 sm:p-7 space-y-5 relative quick-job-search-modal">

            {/* Modal Hero Header (CareerFast Concept matching User Screenshot) */}
            <div className="relative text-center pt-1 pb-1 mb-2">
              <button
                type="button"
                onClick={() => setQuickSearchOpen(false)}
                className="absolute -top-1 -right-1 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border-0 bg-transparent flex items-center gap-1.5"
                title="Close (Esc)"
              >
                <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Esc</span>
                <LucideX size={19} />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-bold bg-purple-50 text-purple-700 border-1 border-purple-200/70 mb-2">
                <Sparkles size={13} className="text-purple-600" />
                <span>Instant Job Search</span>
              </div>
              <h2 className="text-[24px] sm:text-[30px] font-semibold text-slate-900 tracking-tight mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Find your dream job now
              </h2>
              <p className="text-[15px] sm:text-[16px] text-[#474d6a] font-normal mb-0" style={{ fontFamily: "'Outfit', sans-serif" }}>
                5 lakh+ jobs for you to explore
              </p>
            </div>

            {/* Search Form with CareerFast Concept Segmented Bar */}
            <form onSubmit={handleQuickSearchSubmit} className="space-y-4 m-0">
              <div className="quick-search-pill-container">

                {/* 1. Skills / Designations / Companies */}
                <div className="quick-search-segment skills-segment">
                  <SearchOutlined className="quick-search-icon" />
                  <div className="hp-input-wrapper" style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <input
                      ref={quickSearchInputRef}
                      type="text"
                      value={quickKeywords}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuickKeywords(val);
                        const term = getLastQueryTerm(val);
                        const hasTerm = Boolean(term && term.trim());
                        setShowSkillsDropdown(hasTerm);
                        setSkillsActiveIndex(-1);
                        if (hasTerm) {
                          latestSkillsQueryRef.current = term.toLowerCase();
                          const instant = getInstantSkillsMatches(term);
                          setSkillsSuggestions({ roles: instant });
                        } else {
                          latestSkillsQueryRef.current = "";
                          setSkillsSuggestions({});
                        }
                      }}
                      onFocus={() => {
                        const term = getLastQueryTerm(quickKeywords);
                        if (term && term.trim()) {
                          setShowSkillsDropdown(true);
                        }
                      }}
                      onKeyDown={handleSkillsKeyDown}
                      placeholder="Skills / designations / companies"
                      className="quick-search-input"
                      autoComplete="off"
                    />
                    {quickKeywords && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickKeywords('');
                          setShowSkillsDropdown(false);
                          quickSearchInputRef.current?.focus();
                        }}
                        className="hp-clear-btn"
                        title="Clear search"
                      >
                        <CloseCircleFilled />
                      </button>
                    )}
                  </div>

                  {/* Clean Skills Suggestions Dropdown matching Screenshot 1 */}
                  {showSkillsDropdown && Boolean(activeSkillTerm) && currentSkillsList.length > 0 && (
                    <div className="hp-suggestions-dropdown" ref={skillsDropdownRef}>
                      {currentSkillsList.map((item, idx) => {
                        const isHighlighted = skillsActiveIndex === idx;
                        const label = typeof item === "string" ? item : (item.label || item.name || "");
                        return (
                          <div
                            key={`skill-${idx}`}
                            className={`hp-suggestion-item ${isHighlighted ? "active" : ""}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectSkillsSuggestion(item);
                            }}
                            onMouseEnter={() => setSkillsActiveIndex(idx)}
                          >
                            <span className="hp-suggestion-text">
                              {highlightMatch(label, activeSkillTerm)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="quick-search-divider" />

                {/* 2. Select Experience */}
                <div className="quick-search-segment exp-segment" style={{ cursor: 'pointer' }}>
                  <HistoryOutlined className="quick-search-icon" />
                  <Select
                    placeholder="Select experience"
                    className="hp-search-input-select quick-search-select"
                    variant="borderless"
                    style={{ width: '100%' }}
                    value={quickExperience !== null && quickExperience !== undefined ? quickExperience : undefined}
                    onChange={(val) => setQuickExperience(val)}
                    allowClear
                    getPopupContainer={(trigger) => trigger.parentElement || document.body}
                    classNames={{ popup: { root: "hp-experience-select-dropdown" } }}
                    styles={{ popup: { root: { zIndex: 99999 } } }}
                    suffixIcon={<IoChevronDownOutline size={13} style={{ color: '#8292b4' }} />}
                  >
                    <Select.Option value="Internship" className="hp-exp-internship-opt">Internship</Select.Option>
                    <Select.Option value={0}>Fresher (less than 1 year)</Select.Option>
                    <Select.Option value={1}>1 Year</Select.Option>
                    <Select.Option value={2}>2 Years</Select.Option>
                    <Select.Option value={3}>3 Years</Select.Option>
                    <Select.Option value={4}>4 Years</Select.Option>
                    <Select.Option value={5}>5+ Years</Select.Option>
                  </Select>
                </div>

                {/* Divider */}
                <div className="quick-search-divider" />

                {/* 3. Enter Location */}
                <div className="quick-search-segment loc-segment">
                  <EnvironmentOutlined className="quick-search-icon" />
                  <div className="hp-input-wrapper" style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <input
                      ref={locationInputRef}
                      type="text"
                      value={quickLocation}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuickLocation(val);
                        const term = getLastQueryTerm(val);
                        const hasTerm = Boolean(term && term.trim());
                        setShowLocationDropdown(hasTerm);
                        setLocationActiveIndex(-1);
                        if (hasTerm) {
                          latestLocationQueryRef.current = term.toLowerCase();
                          const instant = getInstantLocationMatches(term);
                          setLocationSuggestions(instant);
                        } else {
                          latestLocationQueryRef.current = "";
                          setLocationSuggestions([]);
                        }
                      }}
                      onFocus={() => {
                        const term = getLastQueryTerm(quickLocation);
                        if (term && term.trim()) {
                          setShowLocationDropdown(true);
                        }
                      }}
                      onKeyDown={handleLocationKeyDown}
                      placeholder="Enter location"
                      className="quick-search-input"
                      autoComplete="off"
                    />
                    {quickLocation && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickLocation('');
                          setShowLocationDropdown(false);
                          locationInputRef.current?.focus();
                        }}
                        className="hp-clear-btn"
                        title="Clear location"
                      >
                        <CloseCircleFilled />
                      </button>
                    )}
                  </div>

                  {/* Clean Location Suggestions Dropdown matching Naukri UI */}
                  {showLocationDropdown && Boolean(activeLocTerm) && (
                    <div className="hp-suggestions-dropdown hp-suggestions-dropdown-location" ref={locationDropdownRef}>
                      {currentLocationList && currentLocationList.length > 0 ? (
                        currentLocationList.map((item, idx) => {
                          const isHighlighted = locationActiveIndex === idx;
                          const rawLabel = typeof item === "string" ? item : (item.label || item.mainText || item.city || item);
                          const labelText = cleanSingleLocationName(rawLabel);
                          return (
                            <div
                              key={`loc-${idx}`}
                              className={`hp-suggestion-item ${isHighlighted ? "active" : ""}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectLocationSuggestion(item);
                              }}
                              onMouseEnter={() => setLocationActiveIndex(idx)}
                            >
                              <span className="hp-suggestion-text">
                                {highlightMatch(labelText, activeLocTerm)}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div
                          className="hp-suggestion-empty"
                          style={{ cursor: activeLocTerm ? "pointer" : "default" }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if (activeLocTerm) {
                              handleSelectLocationSuggestion(activeLocTerm);
                            }
                          }}
                        >
                          Press Enter to add "<strong>{activeLocTerm}</strong>"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Search Button */}
                <button
                  type="submit"
                  className="quick-search-submit-btn"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Modal Footer: All Jobs & Filters Link & Reset */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
              <div className="text-[12.5px] text-slate-500 font-medium">
                Need more precise filters? Use{' '}
                <button
                  type="button"
                  onClick={() => {
                    setQuickSearchOpen(false);
                    smartNavigate('/jobs');
                  }}
                  className="font-bold text-purple-600 hover:text-purple-800 hover:underline inline-flex items-center gap-1 cursor-pointer border-0 bg-transparent p-0"
                >
                  <span>All Jobs &amp; Filters</span>
                  <LucideArrowRight size={13} />
                </button>
                {' '}for salary brackets, work modes, and company filters.
              </div>

              {(quickKeywords || quickLocation || quickExperience !== null) && (
                <button
                  type="button"
                  onClick={handleClearQuickFilters}
                  className="text-[12px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors border-0 bg-transparent"
                >
                  <RotateCcw size={12} />
                  <span>Reset filters</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Drawer
        className="header-drawer"
        title={null}
        placement="right"
        width={380}
        onClose={onClose}
        open={open}
        closable={false}
        zIndex={2000}
      >
        {/* Premium Header */}
        <div className="premium-profile-header">
          <button onClick={onClose} className="close-drawer-btn">
            <CloseOutlined />
          </button>

          <Space align="center" size={16} style={{ width: "100%" }}>
            <div className="profile-avatar-container">
              <Avatar
                size={72}
                src={profileImage ? getImageUrl(profileImage) : undefined}
                icon={!profileImage ? <UserOutlined /> : undefined}
                className="profile-avatar"
                style={{ backgroundColor: !profileImage ? "#f3f4f6" : "transparent", color: "#64748b" }}
              />
              <Progress
                type="circle"
                percent={headerProgress}
                size={80}
                strokeColor={headerProgress >= 80 ? "#22c55e" : headerProgress >= 50 ? "#10b981" : "#f59e0b"}
                trailColor="rgba(255,255,255,0.2)"
                strokeWidth={4}
                showInfo={false}
                className="profile-progress-ring"
              />
              <div style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                background: headerProgress >= 80 ? '#22c55e' : headerProgress >= 50 ? '#10b981' : '#f59e0b',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '10px',
                border: '2px solid #6366f1',
                zIndex: 2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                lineHeight: 1.2
              }}>
                {headerProgress}%
              </div>
            </div>

            <div className="profile-info-content">
              <Title level={4} style={{ color: "white", margin: 0, fontFamily: 'Outfit', fontWeight: 600 }}>
                {fname} {lname}
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, display: 'block', marginBottom: 4 }}>
                {email}
              </Text>
              <button
                onClick={() => {
                  onClose();
                  if (roleId === 1) {
                    smartNavigate("/admin");
                  } else {
                    smartNavigate("/candidate-profile/mainprofile");
                  }
                }}
                className="view-profile-link"
              >
                View Profile <ArrowRightOutlined style={{ fontSize: 12 }} />
              </button>
            </div>
          </Space>
        </div>

        {/* Premium Content */}
        <div className="drawer-content-scroll">
          <div className="premium-menu-section">
            <Text className="menu-section-title">
              {roleId === 1
                ? "Super Admin Dashboard"
                : roleId === 2
                  ? "Candidate Dashboard"
                  : "Organizer Dashboard"}
            </Text>

            <List
              split={false}
              dataSource={
                roleId === 1
                  ? [
                    { title: "Dashboard", path: "/admin", icon: <LayoutDashboard size={18} /> },
                    { title: "Manage Listings", path: "/admin/job-post", icon: <AppstoreOutlined /> },
                    { title: "Recruiters & Companies", path: "/admin/recruiters", icon: <UserOutlined /> },
                    { title: "Account Settings", path: "/admin/general", icon: <SettingOutlined /> },
                  ]
                  : roleId === 2
                    ? [
                      { title: "Dashboard", path: "/candidate-profile/mainprofile", icon: <LayoutDashboard size={18} /> },
                      { title: "Wishlist", path: "/candidate-profile/wishlist", icon: <HeartOutlined /> },
                      { title: "Account Settings", path: "/candidate-profile/accountsettings", icon: <SettingOutlined /> },
                      { title: "Applied Jobs", path: "/candidate-profile/applied", icon: <UserAddOutlined />, showArrow: true },
                    ]
                    : [
                      { title: "Dashboard", path: "/candidate-profile/mainprofile", icon: <LayoutDashboard size={18} /> },
                      { title: "Manage Listings", path: "/candidate-profile/listing", icon: <AppstoreOutlined />, onClick: () => localStorage.setItem("listingOrder", "topBottom") },
                      { title: "Account Settings", path: "/candidate-profile/accountsettings", icon: <SettingOutlined /> },
                    ]
              }
              renderItem={(item) => (
                <List.Item
                  className="premium-menu-item"
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    onClose();
                    smartNavigate(item.path);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                    <div className="menu-icon-wrapper">
                      {item.icon}
                    </div>
                    <Text className="menu-item-text">{item.title}</Text>
                    {item.showArrow && <RightOutlined style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }} />}
                  </div>
                </List.Item>
              )}
            />
          </div>
        </div>

        {/* Premium Footer */}
        <div className="drawer-footer">
          <AntButton
            onClick={handleLogOut}
            className="logout-btn"
            icon={<LogoutOutlined />}
          >
            Log Out
          </AntButton>
        </div>
      </Drawer>

      {/* Candidate Post a Job Regulation Modal */}
      <Modal
        open={candidateModalVisible}
        onCancel={() => setCandidateModalVisible(false)}
        footer={null}
        centered
        width={530}
        className="candidate-recruiter-modal"
        destroyOnHidden
      >
        <div className="crm-modal-content">
          {/* Header Banner */}
          <div className="crm-header">
            <div className="crm-tag">
              <ShieldCheck size={13} style={{ marginRight: 5 }} /> Recruiter Verification Policy
            </div>
            <h3 className="crm-title">Job Posting Regulations & Recruiter Access</h3>
            <p className="crm-subtitle">
              Careerfast enforces corporate verification to protect candidates from unverified listings.
            </p>
          </div>

          <div className="crm-body">
            {/* Current Session Alert Box */}
            <div className="crm-session-badge">
              <div className="crm-session-left">
                <span className="crm-pulse-dot"></span>
                <span className="crm-session-label">Current Account:</span>
                <span className="crm-session-value">Candidate Profile</span>
              </div>
              <span className="crm-session-note">Job Seeker Mode</span>
            </div>

            {/* Regulation Details */}
            <div className="crm-regulation-box">
              <div className="crm-box-title">
                Platform Regulations & Policy
              </div>
              <div className="crm-rule-list">
                <div className="crm-rule-item">
                  <div className="crm-rule-icon">
                    <CheckCircle2 size={15} />
                  </div>
                  <div className="crm-rule-text">
                    <strong>Fraud Prevention & Safety:</strong> Only verified corporate recruiters can post jobs. Candidate accounts cannot publish listings.
                  </div>
                </div>
                <div className="crm-rule-item">
                  <div className="crm-rule-icon">
                    <CheckCircle2 size={15} />
                  </div>
                  <div className="crm-rule-text">
                    <strong>Employer Verification:</strong> Official corporate credentials (GST/CIN, corporate email) are required to unlock posting tools.
                  </div>
                </div>
                <div className="crm-rule-item">
                  <div className="crm-rule-icon">
                    <CheckCircle2 size={15} />
                  </div>
                  <div className="crm-rule-text">
                    <strong>Dedicated Recruiter Portal:</strong> Job posts, applicant tracking (ATS), and candidate resumes are managed on the <strong>Recruiter Portal</strong>.
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action Box */}
            <div className="crm-cta-section">
              <div className="crm-cta-header">
                <Building2 size={16} className="crm-cta-icon" />
                <span>Are you an Employer or Hiring Manager?</span>
              </div>
              <p className="crm-cta-desc">
                Log in with your recruiter account or register your organization to post jobs:
              </p>

              <div className="crm-btn-group">
                <button
                  type="button"
                  className="crm-primary-btn"
                  onClick={() => {
                    setCandidateModalVisible(false);
                    window.location.href = `${hrPortalUrl}/login`;
                  }}
                >
                  <LogIn size={15} />
                  <span>Log In as Recruiter</span>
                </button>

                <button
                  type="button"
                  className="crm-secondary-btn"
                  onClick={() => {
                    setCandidateModalVisible(false);
                    window.location.href = `${hrPortalUrl}/register`;
                  }}
                >
                  <Building2 size={15} />
                  <span>Register Employer</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Dismiss & Helpdesk */}
          <div className="crm-footer">
            <button
              type="button"
              className="crm-dismiss-btn"
              onClick={() => setCandidateModalVisible(false)}
            >
              Continue Job Search as Candidate
            </button>
            <div className="crm-help-text">
              Need corporate verification assistance? Email{" "}
              <a href="mailto:careerfastcontact@gmail.com">careerfastcontact@gmail.com</a>
            </div>
          </div>
        </div>
      </Modal>

      {/* Add CSS for elite search dropdown */}
      <style>
        {`
          /* Elite Search Dropdown Styles */
          .elite-search-dropdown {
            border-radius: 16px;
            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.2);
            padding: 16px;
            margin-top: 10px;
            max-height: 600px;
            overflow-y: auto;
            scroll-behavior: smooth;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
            backdrop-filter: blur(20px);
          }
          
          .elite-search-dropdown .ant-select-item {
            padding: 0;
            border-radius: 12px;
            margin-bottom: 8px;
            transition: all 0.3s ease;
            background: transparent;
          }
            
          .rc-virtual-list-holder{
          max-height: 340px !important;
          }
          
          .elite-search-dropdown .ant-select-item-option-active {
            background-color: rgba(79, 70, 229, 0.05);
          }
          
          .elite-search-dropdown .ant-select-item-option-selected {
            background: linear-gradient(90deg, rgba(79, 70, 229, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%);
          }
          
          .elite-suggestion-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-radius: 12px;
            transition: all 0.3s ease;
            border: 1px solid rgba(79, 70, 229, 0.1);
            background: white;
            position: relative;
            overflow: hidden;
          }
          
          .elite-suggestion-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 0;
            background: linear-gradient(180deg, #8b5cf6 0%, #4f46e5 100%);
            transition: height 0.3s ease;
          }
          
          .elite-suggestion-item:hover::before {
            height: 100%;
          }
          
          .elite-suggestion-item:hover {
            background-color: #fafbff;
            border-color: rgba(79, 70, 229, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(79, 70, 229, 0.15);
          }
          
          .elite-content-wrapper {
            display: flex;
            align-items: flex-start;
            flex: 1;
          }
          
          .elite-logo-container {
            position: relative;
            margin-right: 16px;
          }
          
          .elite-logo-frame {
            width: 56px;
            height: 56px;
            border-radius: 12px;
            padding: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #e3e3e3;
          }
          
          .elite-company-logo {
            width: 100%;
            height: 100%;
            border-radius: 10px;
            object-fit: contain;
            background: white;
            padding: 5px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .elite-premium-badge {
            position: absolute;
            top: -6px;
            right: -6px;
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            color: #7c5a1a;
            font-size: 10px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
            z-index: 2;
          }
          
          .elite-premium-icon {
            font-size: 10px;
            margin-right: 3px;
          }
          
          .elite-suggestion-content {
            flex: 1;
            position: relative;
          }
          
          .elite-suggestion-item .elite-job-title-header {
            font-weight: 700;
            font-size: 16px;
            color: #1a1a1a !important;
            margin-bottom: 0px;
            display: flex;
            align-items: center;
          }
          
          .elite-featured-icon {
            color: #ffc53d;
            margin-left: 8px;
            font-size: 14px;
          }
          
          .elite-company-name-header {
            font-size: 13px;
            color: #595959;
            margin-bottom: 10px;
            font-weight: 600;
          }
          
          .elite-job-meta-header {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-bottom: 10px;
          }
          
          .elite-location-tag, .elite-workplace-tag {
            font-size: 11px;
            padding: 4px 10px;
            border-radius: 6px;
            margin: 0;
            border: none;
          }
          
          .elite-location-tag {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
          }
          
          .elite-remote {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
          }
          
          .elite-onsite {
            background: rgba(139, 92, 246, 0.1);
            color: #8b5cf6;
          }
          
          .elite-salary-badge {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 6px;
          }
          
          .elite-view-btn {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: rgba(79, 70, 229, 0.1);
            color: #4f46e5;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            transition: all 0.3s ease;
          }
          
          .elite-suggestion-item:hover .elite-view-btn {
            background: #4f46e5;
            color: white;
            transform: translateX(3px);
          }
          
          .elite-no-results-container {
            text-align: center;
            padding: 10px 20px;
          }
          
          .elite-no-results-icon {
            font-size: 38px;
            color: #d9d9d9;
            margin-bottom: 16px;
          }
          
          .elite-no-results-title {
            font-weight: 700;
            color: #595959;
            margin-bottom: 8px;
            font-size: 16px;
          }
          
          .elite-no-results-subtitle {
            font-size: 14px;
            color: #8c8c8c;
            margin-bottom: 20px;
          }
          
          .elite-explore-btn {
            background: linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%);
            border: none;
            border-radius: 8px;
            padding: 8px 20px;
            height: auto;
            font-weight: 600;
          }
          
          .elite-loading-container {
            text-align: center;
            padding: 30px 20px;
          }
          
          .elite-loading-animation {
            display: flex;
            justify-content: center;
            margin-bottom: 16px;
          }
          
          .elite-loading-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%);
            margin: 0 4px;
            animation: elite-loading 1.4s infinite ease-in-out both;
          }
          
          .elite-loading-dot:nth-child(1) {
            animation-delay: -0.32s;
          }
          
          .elite-loading-dot:nth-child(2) {
            animation-delay: -0.16s;
          }
          
          @keyframes elite-loading {
            0%, 80%, 100% { 
              transform: scale(0.8);
              opacity: 0.5;
            }
            40% { 
              transform: scale(1);
              opacity: 1;
            }
          }
          
          .elite-loading-text {
            font-size: 14px;
            color: #8c8c8c;
            font-weight: 500;
          }
          
          /* Elite search input */
          .elite-search-input {
            border-radius: 12px;
            width: 230px !important;
            border: 1px solid #b6b1ff;
            padding: 12px 18px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
            background: white;
          }
          
          /* Elite search input on admin-profile pages */
          .profile-layout .elite-search-input {
            width: 150px !important;
          }
          
          .elite-search-input:hover, .elite-search-input:focus {
            border-color: #8b5cf6;
            box-shadow: 0 6px 20px rgba(79, 70, 229, 0.2);
          }
          
          .elite-search-icon {
            color: #8b5cf6;
          }
          
            .elite-header {
            border-bottom: 1px solid rgba(79, 70, 229, 0.1);
          }

          .elite-header .container-fluid {
            max-width: 1240px !important;
            margin: 0 auto !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          /* --- Mobile Responsive Header Styles --- */
          @media (max-width: 991px) {
            .elite-search-input {
              width: 180px !important;
            }
          }

          @media (max-width: 768px) {
            .elite-header .container-fluid {
              display: flex !important;
              flex-wrap: wrap !important;
              align-items: center !important;
              justify-content: space-between !important;
              padding-left: 15px !important;
              padding-right: 15px !important;
            }

            .global_search {
              display: contents !important;
            }

            .navbar-brand {
              order: 1 !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .navbar-toggler {
              order: 2 !important;
              margin-left: auto !important;
              padding: 4px 8px !important;
              font-size: 1.1rem !important;
            }

            /* Targeting the AutoComplete wrapper */
            .elite-header .ant-select { 
              order: 3 !important;
              width: 100% !important;
              margin-top: 15px !important;
              margin-bottom: 5px !important;
            }

            .elite-search-input {
              width: 100% !important;
              height: 42px !important;
              padding: 10px 15px !important;
              font-size: 14px !important;
            }

            .main-logo {
              height: 30px !important;
              width: auto;
            }

            .elite-search-dropdown {
              width: calc(100vw - 30px) !important;
              left: 15px !important;
              max-width: none !important;
            }

            .mobile_sidebar {
              width: 100%;
              display: flex !important;
              flex-direction: column;
              align-items: stretch !important;
              gap: 15px !important;
              margin-top: 20px !important;
            }

            .host-button {
              width: 100%;
              justify-content: center;
              height: 45px !important;
            }
          }

          @media (max-width: 480px) {
            .elite-search-input {
              min-width: 100px;
            }
            
            .main-logo {
              height: 28px !important;
            }
            
            .elite-search-input::placeholder {
              font-size: 11px;
            }
          }

          /* Jobs Mega Menu Styles */
          .jobs-mega-menu {
            display: flex;
            background: white;
            border-radius: 12px;
            box-shadow: 0 15px 45px rgba(0, 0, 0, 0.12);
            overflow: hidden;
            width: 480px;
            border: 1px solid rgba(0, 0, 0, 0.05);
            animation: megaMenuFade 0.3s ease-out;
            z-index: 1050;
          }

          @keyframes megaMenuFade {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .mega-sidebar {
            width: 190px;
            background: rgba(141, 63, 251, 0.05);
            border-right: 1px solid rgba(0, 0, 0, 0.05);
            padding: 0px 0;
          }

          .sidebar-item {
            padding: 14px 20px;
            cursor: pointer;
            font-size: 14px;
            color: #555;
            transition: all 0.25s ease;
            position: relative;
            font-weight: 500;
            font-family: "Outfit", sans-serif !important;
          }

          .sidebar-item.active {
            background: rgba(141, 63, 251, 0.05);
            color: #8d3ffb;
            font-weight: 600;
          }

          .sidebar-item.active::after {
            content: '';
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 100%;
            background: #8d3ffb;
          }

          .mega-content {
            flex: 1;
            padding: 15px 0px 0px 25px;
            background: white;
            min-height: 300px;
          }

          .mega-list {
            list-style: none;
            padding: 0;
            margin: 0;
            max-height: 300px;
            overflow-y: auto;
            padding-right: 5px;
          }

          .mega-list::-webkit-scrollbar {
            width: 4px;
          }

              .navbar-expand-md .offcanvas .offcanvas-body {
        align-items: center;
    }

          .mega-list::-webkit-scrollbar-thumb {
            background: rgba(141, 63, 251, 0.2);
            border-radius: 10px;
          }

          .mega-list li {
            padding: 10px 0;
            cursor: pointer;
            font-size: 14px;
            color: #666;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            font-family: "Outfit", sans-serif !important;
          }

          .mega-list li:hover {
            color: #8d3ffb;
            padding-left: 5px;
          }

          .mega-list li::before {
            content: '';
            width: 0;
            height: 1px;
            background: #8d3ffb;
            margin-right: 0;
            transition: all 0.2s ease;
          }

          .mega-list li:hover::before {
            width: 10px;
            margin-right: 8px;
          }

          .mega-new-badge {
            background: #ff6f00;
            color: white;
            border-radius: 4px;
            padding: 1px 5px;
            font-size: 9px;
            margin-left: 5px;
            font-weight: 700;
            display: inline-block;
            vertical-align: middle;
            line-height: normal;
          }

          /* More Dropdown Styles */
          .more-dropdown-menu {
            background: white;
            border-radius: 12px;
            box-shadow: 0 15px 45px rgba(0, 0, 0, 0.12);
            overflow: hidden;
            width: 220px;
            border: 1px solid rgba(0, 0, 0, 0.05);
            padding: 0px 0;
            animation: megaMenuFade 0.3s ease-out;
            z-index: 1050;
          }

          .more-menu-item {
            padding: 12px 20px;
            cursor: pointer;
            transition: all 0.25s ease;
            display: flex;
            align-items: center;
          }

          .more-menu-item:hover {
            background: rgba(141, 63, 251, 0.05);
          }

          .more-menu-item .menu-item {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
          }

          .more-menu-item .menu-icon {
            font-size: 18px;
            color: #475569;
            transition: all 0.25s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .more-menu-item span {
            font-size: 14px;
            color: #475569;
            font-weight: 500;
            font-family: "Outfit", sans-serif !important;
            transition: all 0.25s ease;
          }

          .more-menu-item:hover span {
            color: #8d3ffb;
            transform: translateX(4px);
          }

          .more-menu-item:hover .menu-icon {
            color: #8d3ffb;
            transform: scale(1.1);
          }
          
          .nav-item:hover {
             border-radius: 8px;
             color: #6366f1 !important;
          }

          .nav-item {
            transition: all 0.3s ease;
            padding: 8px 12px !important;
          }

          /* --- Premium Header Drawer Styles --- */
          .header-drawer .ant-drawer-content {
            background-color: #ffffff;
            border-radius: 24px 0 0 24px;
            overflow: hidden;
          }

          .header-drawer .ant-drawer-body {
            padding: 0 !important;
            display: flex;
            flex-direction: column;
            height: 100%;
          }

          .premium-profile-header {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    padding: 24px 12px;
    position: relative;
    color: white;
    box-shadow: 0 4px 20px rgba(79, 70, 229, 0.2);
          }

          .close-drawer-btn {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 10;
          }

          .close-drawer-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: rotate(90deg);
          }

          .profile-avatar-container {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            flex-shrink: 0;
          }

          .profile-avatar {
            border: 2px solid rgba(255, 255, 255, 0.3) !important;
            background: white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            position: relative;
            z-index: 1;
          }

          .profile-progress-ring {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 2;
          }

          .view-profile-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 6px 14px;
            border-radius: 50px;
            color: white;
            font-size: 13px;
            font-weight: 600;
            margin-top: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            border: none;
            outline: none;
          }

          .view-profile-link:hover {
            background: white;
            color: #6366f1;
            transform: translateX(4px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .drawer-content-scroll {
            flex: 1;
            overflow-y: auto;
            padding: 32px 24px;
            background: #f8fafc;
          }

          .premium-menu-section {
            margin-bottom: 24px;
          }

          .menu-section-title {
            display: block;
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            margin-bottom: 20px;
            padding-left: 16px;
          }

          .premium-menu-item {
            padding: 12px 16px !important;
            border-radius: 12px !important;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            border: 1px solid transparent !important;
            margin-bottom: 8px;
            background: transparent !important;
            position: relative;
            overflow: hidden;
          }

          .premium-menu-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: #6366f1;
            border-radius: 0 4px 4px 0;
            transform: scaleY(0);
            transition: transform 0.3s ease;
            transform-origin: center;
          }

          .premium-menu-item:hover {
            background: #ffffff !important;
            border-color: rgba(99, 102, 241, 0.1) !important;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
            transform: translateX(4px);
          }

          .premium-menu-item:hover::before {
            transform: scaleY(1);
          }

          .menu-icon-wrapper {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: rgba(99, 102, 241, 0.08);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6366f1;
            font-size: 18px;
            transition: all 0.3s ease;
          }

          .premium-menu-item:hover .menu-icon-wrapper {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: white;
            box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
            transform: scale(1.05);
          }

          .menu-item-text {
            font-size: 15px;
            font-weight: 500;
            color: #1e293b;
            font-family: 'Outfit', sans-serif;
            transition: color 0.3s ease;
          }

          .premium-menu-item:hover .menu-item-text {
            color: #6366f1;
            font-weight: 600;
          }

          .drawer-footer {
            padding: 24px 32px;
            border-top: 1px solid rgba(226, 232, 240, 0.6);
            background: #ffffff;
          }

          .logout-btn {
            width: 100%;
            height: 44px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 10px !important;
            background: #fff1f2 !important;
            color: #e11d48 !important;
            border: 1px solid transparent !important;
            border-radius: 12px !important;
            font-weight: 600 !important;
            font-size: 14px !important;
            font-family: 'Outfit', sans-serif;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }

          .logout-btn:hover {
            background: #e11d48 !important;
            color: white !important;
            box-shadow: 0 8px 16px rgba(225, 29, 72, 0.2);
            transform: translateY(-2px);
          }

          /* --- Premium Host Popover Styles --- */
          .host-popup-container {
            width: 280px;
            padding: 4px;
          }

          .host-popup-item {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            padding: 10px;
            border-radius: 14px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            margin-bottom: 6px;
            border: 1px solid transparent;
            background: transparent;
          }

          .host-popup-item:hover {
            background: #f8fafc;
            border-color: rgba(99, 102, 241, 0.1);
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.04);
          }

          .host-icon-wrapper {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
            transition: all 0.3s ease;
          }

          .host-popup-item:hover .host-icon-wrapper {
            transform: scale(1.1);
          }

          .host-popup-text {
            flex: 1;
            padding-top: 2px;
          }

          .host-popup-title {
            font-size: 15px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 2px;
            font-family: 'Outfit', sans-serif;
            letter-spacing: -0.01em;
          }

          .host-popup-sub {
            font-size: 12px;
            color: #64748b;
            line-height: 1.5;
            font-weight: 400;
          }

          .host-popup-upgrade {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #f1f5f9;
            color: #64748b;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 6px;
            text-transform: uppercase;
            margin-top: 8px;
          }
        `}
      </style>
    </>
  );
}
