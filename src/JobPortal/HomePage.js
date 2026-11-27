'use client';
import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useNavigate } from "@/routing-shim";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import { motion } from "framer-motion";
import GridBlogSection from "./GridBlogSection";

import {
    SearchOutlined,
    EnvironmentOutlined,
    HistoryOutlined,
    LeftOutlined,
    RightOutlined,
    ThunderboltFilled,
    HomeOutlined,
    BuildOutlined,
    LineChartOutlined,
    CodeOutlined,
    ShoppingOutlined,
    GlobalOutlined,
    LaptopOutlined,
    WalletOutlined,
    FileSearchOutlined,
    StarOutlined,
    StarFilled,
    SafetyCertificateFilled,
    SafetyCertificateOutlined,
    EditOutlined,
    SolutionOutlined,
    ClockCircleOutlined,
    CloseCircleFilled,
    CloudOutlined,
    DatabaseOutlined,
    CheckCircleOutlined,
    CheckCircleFilled,
    CheckOutlined,
    RiseOutlined,
    SendOutlined,
    AppstoreOutlined,
    RocketOutlined,
} from "@ant-design/icons";
import { message, Select, Row, Col, Spin } from "antd";

import "../css/HomePage.css";
import SearchWorkflow from "../Common/SearchWorkflow";
import { Sparkles } from "lucide-react";
import { getJobCategoryData, getJobPosts, getHomePageStats, getTrendingSearches, getSearchSuggestions, getBlogs, getAllCourses, getTopCompanies, getUserProfile, searchLocationsAPI } from "../ApiService/action";
import { getImageUrl, getPlaceholderSvg } from "../utils/getImageUrl";
import { calculateCandidateCompletion, broadcastProfileProgress, PROFILE_PROGRESS_EVENT } from "../utils/profileCompletion";
import { getRecentSearches, saveRecentSearch, removeRecentSearch, RECENT_SEARCHES_EVENT, fetchLiveCountForSearch, updateRecentSearchCount } from "../utils/recentSearches";
import { getJobDetailsUrl } from "../utils/slug";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import PopularRolesIllustration from "../images/popular_roles_illustration.png";
import company_logos1 from "../images/counter_box2.png";
import company_logos2 from "../images/verified.png";
import company_logos3 from "../images/applied.png";

import BangaloreCity from "../images/bangalore.jpg";
import MumbaiCity from "../images/mumbai.jpg";
import DelhiCity from "../images/delhi.jpg";
import HyderabadCity from "../images/Hyderabad.webp";
import ChennaiCity from "../images/chennai.jpg";
import RemoteCity from "../images/remote.jpg";
import interviewImage from "../images/ab-interview-ot.png";
import hireFreshers from "../images/hire-fresher.png";

const { Option } = Select;

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

// Data hygiene check to prevent placeholder or gibberish text in UI (Issue 1)
const isCleanString = (str) => {
    if (!str || typeof str !== 'string') return false;
    const trimmed = str.trim();
    if (trimmed.length < 3) return false;
    if (/(.)\1{3,}/i.test(trimmed)) return false; // Repeated chars e.g. 'dfddgfhghghghg'
    if (/^(dfd|wweo|asdf|qwerty|dummy|test\b)/i.test(trimmed)) return false;
    return true;
};

const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    responsive: [
        {
            breakpoint: 1200,
            settings: { slidesToShow: 3 }
        },
        {
            breakpoint: 992,
            settings: { slidesToShow: 2 }
        },
        {
            breakpoint: 576,
            settings: { slidesToShow: 1 }
        }
    ]
};

const Counter = ({ end, duration = 2, decimals = 0, suffix = "" }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime = null;
        const startValue = 0;
        const targetValue = Number(end) || 0;
        let animFrame;

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            // smooth easeOutExpo
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = startValue + (targetValue - startValue) * ease;
            setDisplayValue(current);

            if (progress < 1) {
                animFrame = requestAnimationFrame(step);
            }
        };

        animFrame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(animFrame);
    }, [end, duration]);

    return <span>{displayValue.toFixed(decimals)}{suffix}</span>;
};


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
    // Engineering & Tech Roles
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

    // Creative & Design
    "UI/UX Designer", "Product Designer", "Graphic Designer", "Web Designer", "Visual Designer",
    "Figma Designer", "Video Editor", "Motion Graphic Designer", "3D Animator", "Content Creator",

    // Product & Management
    "Product Manager", "Associate Product Manager", "Project Manager", "Scrum Master",
    "Agile Coach", "Operations Manager", "Operations Executive",

    // Marketing & Growth
    "Digital Marketing Executive", "Digital Marketing Manager", "SEO Specialist", "SEM Specialist",
    "Social Media Manager", "Content Writer", "Copywriter", "Technical Writer", "Email Marketer",
    "Brand Manager", "Growth Specialist",

    // Sales & BPO
    "Business Development Executive", "Business Development Manager", "Sales Executive",
    "Sales Manager", "Inside Sales Specialist", "B2B Sales", "Telecaller", "Telesales Executive",
    "Customer Support Executive", "Customer Success Manager", "BPO Executive", "Call Center Agent",

    // HR & Administration
    "HR Executive", "HR Manager", "HR Generalist", "HR Recruiter", "Talent Acquisition Specialist",
    "Technical Recruiter", "Office Administrator", "Administrative Assistant", "Executive Assistant",
    "Receptionist", "Data Entry Operator",

    // Finance & Accounts
    "Accountant", "Senior Accountant", "Chartered Accountant (CA)", "Accounts Executive",
    "Financial Analyst", "Finance Manager", "Tax Consultant", "GST Specialist", "Billing Executive",

    // Core Engineering & Others
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

    return [...startsWith, ...contains].slice(0, 10).map(c => ({ label: c }));
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

    return [...startsWith, ...contains].slice(0, 8).map(s => ({ label: s }));
};

const IT_PRIORITY_ORDER = [
    "full stack development",
    "frontend development",
    "backend development",
    "software development",
    "data science & machine learning",
    "data science & analytics",
    "data engineering",
    "machine learning/ai",
    "devops",
    "devops & cloud computing",
    "cybersecurity",
    "cloud computing",
    "quality assurance and testing",
    "quality assurance & testing",
    "ui/ux design",
    "ui / ux",
    "database administration",
    "web design",
    "it support",
    "it support & helpdesk",
    "it & information security",
    "business intelligence & analytics",
    "it infrastructure services",
    "it project management",
    "software & qa",
    "ar/vr development"
];

const NON_IT_EXCLUSIONS = [
    "accounting", "finance", "bd / pre sales", "business analysis", "digital marketing",
    "graphic design", "hr analytics", "aerospace", "automotive", "editorial",
    "engineering & manufacturing", "social media", "other", "real estate", "architecture", "artists", "engineering"
];

const DEFAULT_TOP_IT_CATEGORIES = [
    "Full Stack Development",
    "Frontend Development",
    "Backend Development",
    "Software Development",
    "Data Science & Machine Learning",
    "Data Engineering",
    "Machine Learning/AI",
    "DevOps",
    "Cybersecurity",
    "Quality Assurance & Testing",
    "UI/UX Design",
    "Database Administration"
];

const isITCategoryName = (cat) => {
    if (!cat) return false;
    const l = cat.toLowerCase().trim();
    if (l === "engineering") return false;
    if (NON_IT_EXCLUSIONS.some(n => l === n || l.startsWith(n + " ") || l.endsWith(" " + n))) return false;
    return IT_PRIORITY_ORDER.some(p => l === p || l.includes(p) || p.includes(l));
};

const getITCategoryRank = (name) => {
    const lower = name.toLowerCase().trim();
    const idx = IT_PRIORITY_ORDER.findIndex(p => p === lower || lower.includes(p) || p.includes(lower));
    return idx >= 0 ? idx : 999;
};

const getCategoryIcon = (name) => {
    if (!name) return <BuildOutlined />;
    const n = name.toLowerCase();
    if (n.includes("full stack") || n.includes("frontend") || n.includes("backend") || n.includes("web design")) return <CodeOutlined />;
    if (n.includes("software") || n.includes("dev") || n.includes("program")) return <LaptopOutlined />;
    if (n.includes("data") || n.includes("analytics") || n.includes("intelligence")) return <LineChartOutlined />;
    if (n.includes("machine learning") || n.includes("ai") || n.includes("artificial")) return <ThunderboltFilled />;
    if (n.includes("cloud") || n.includes("devops") || n.includes("infrastructure")) return <CloudOutlined />;
    if (n.includes("security") || n.includes("cyber")) return <SafetyCertificateOutlined />;
    if (n.includes("qa") || n.includes("quality") || n.includes("testing")) return <CheckCircleOutlined />;
    if (n.includes("ui") || n.includes("ux") || n.includes("design")) return <AppstoreOutlined />;
    if (n.includes("database") || n.includes("dba") || n.includes("sql")) return <DatabaseOutlined />;
    if (n.includes("marketing")) return <ShoppingOutlined />;
    if (n.includes("remote")) return <HomeOutlined />;
    if (n.includes("engineering")) return <LaptopOutlined />;
    if (n.includes("sales")) return <GlobalOutlined />;
    if (n.includes("management")) return <ThunderboltFilled />;
    return <BuildOutlined />;
};

const extractTopITCategories = (rawCats, getIconFn, limit = 10) => {
    const validRaw = Array.isArray(rawCats) ? rawCats : [];
    const itItems = [];
    const otherItems = [];

    for (const c of validRaw) {
        const name = (typeof c === "string" ? c : c.category_name)?.trim();
        if (!name) continue;
        if (isITCategoryName(name)) {
            itItems.push(name);
        } else {
            otherItems.push(name);
        }
    }

    itItems.sort((a, b) => getITCategoryRank(a) - getITCategoryRank(b));

    const seenNorm = new Set();
    const resultNames = [];

    const getNormKey = (name) => {
        const norm = name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
        if (norm.startsWith("uiux")) return "uiux";
        if (norm.startsWith("qualityassurance")) return "qa";
        if (norm.startsWith("itsupport")) return "itsupport";
        if (norm.startsWith("devops")) return "devops";
        if (norm.startsWith("datascience")) return norm.includes("machine") ? "dsml" : "dsanalytics";
        if (norm.startsWith("businessintelligence")) return "bi";
        return norm;
    };

    for (const name of itItems) {
        const normKey = getNormKey(name);
        if (!seenNorm.has(normKey)) {
            seenNorm.add(normKey);
            resultNames.push(name);
        }
        if (resultNames.length >= limit) break;
    }

    if (resultNames.length < limit) {
        for (const name of DEFAULT_TOP_IT_CATEGORIES) {
            const normKey = getNormKey(name);
            if (!seenNorm.has(normKey)) {
                seenNorm.add(normKey);
                resultNames.push(name);
            }
            if (resultNames.length >= limit) break;
        }
    }

    if (resultNames.length < limit) {
        for (const name of otherItems) {
            const normKey = getNormKey(name);
            if (!seenNorm.has(normKey)) {
                seenNorm.add(normKey);
                resultNames.push(name);
            }
            if (resultNames.length >= limit) break;
        }
    }

    const iconResolver = getIconFn || getCategoryIcon;
    return resultNames.map(name => ({
        name,
        icon: iconResolver ? iconResolver(name) : null
    }));
};

export default function HomePage({ initialData = null }) {
    const navigate = useNavigate();
    const [skills, setSkills] = useState("");
    const [location, setLocation] = useState("");
    const [defaultLocations, setDefaultLocations] = useState([]);
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [experience, setExperience] = useState(null);
    const [categories, setCategories] = useState(() => extractTopITCategories([], getCategoryIcon, 12));
    const [fresherCategories, setFresherCategories] = useState([]);
    const [internshipCategories, setInternshipCategories] = useState([]);
    const [companies, setCompanies] = useState(() => initialData?.companies || []);
    const [roles, setRoles] = useState([
        { title: "Full Stack Developer", jobs: "500+ Jobs" },
        { title: "Software Engineer", jobs: "450+ Jobs" },
        { title: "Frontend Developer", jobs: "380+ Jobs" },
        { title: "Backend Developer", jobs: "340+ Jobs" },
        { title: "Data Analyst", jobs: "290+ Jobs" },
        { title: "Data Scientist", jobs: "240+ Jobs" },
        { title: "UI/UX Designer", jobs: "210+ Jobs" },
        { title: "DevOps Engineer", jobs: "180+ Jobs" },
        { title: "Mobile App Developer", jobs: "160+ Jobs" },
        { title: "QA Engineer", jobs: "150+ Jobs" },
        { title: "Product Manager", jobs: "130+ Jobs" },
        { title: "Cloud Architect", jobs: "110+ Jobs" }
    ]);
    const [fresherJobs, setFresherJobs] = useState(() => initialData?.fresherJobs || []);
    const [internshipJobs, setInternshipJobs] = useState(() => initialData?.internshipJobs || []);
    const [loadingFresher, setLoadingFresher] = useState(() => !(initialData?.fresherJobs?.length > 0));
    const [loadingInternships, setLoadingInternships] = useState(() => !(initialData?.internshipJobs?.length > 0));
    const [activeTab, setActiveTab] = useState("");
    const [activeInternshipTab, setActiveInternshipTab] = useState("");
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(() => initialData?.stats || {
        totalJobs: 0,
        totalRecruiters: 0,
        totalApplications: 0
    });
    const [trendingSearches, setTrendingSearches] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [recentBlogs, setRecentBlogs] = useState(() => initialData?.recentBlogs || []);
    const [coursesList, setCoursesList] = useState(() => initialData?.coursesList || []);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [activeCourseCategory, setActiveCourseCategory] = useState("All Programs");
    const initialFetchDone = useRef(false);
    const lastFetchedFresherTab = useRef("");
    const lastFetchedInternshipTab = useRef("");

    // Horizontal Scroll State & Handlers for Category Tabs
    const fresherTabsRef = useRef(null);
    const internshipTabsRef = useRef(null);
    const [fresherScroll, setFresherScroll] = useState({ canScrollLeft: false, canScrollRight: true });
    const [internshipScroll, setInternshipScroll] = useState({ canScrollLeft: false, canScrollRight: true });

    const checkScrollState = (element, setter) => {
        if (!element) return;
        const { scrollLeft, scrollWidth, clientWidth } = element;
        setter({
            canScrollLeft: scrollLeft > 10,
            canScrollRight: scrollLeft + clientWidth < scrollWidth - 10
        });
    };

    const scrollTabs = (ref, direction, setter) => {
        if (ref.current) {
            const scrollAmount = 350;
            ref.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth"
            });
            setTimeout(() => checkScrollState(ref.current, setter), 350);
        }
    };

    useEffect(() => {
        const updateScroll = () => {
            checkScrollState(fresherTabsRef.current, setFresherScroll);
            checkScrollState(internshipTabsRef.current, setInternshipScroll);
        };
        const timer = setTimeout(updateScroll, 250);
        window.addEventListener("resize", updateScroll);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", updateScroll);
        };
    }, [fresherCategories, internshipCategories]);

    const [skillsSuggestions, setSkillsSuggestions] = useState({ roles: [], skills: [], companies: [] });
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [skillsActiveIndex, setSkillsActiveIndex] = useState(-1);
    const [locationActiveIndex, setLocationActiveIndex] = useState(-1);
    const skillsInputRef = useRef(null);
    const locationInputRef = useRef(null);
    const skillsDropdownRef = useRef(null);
    const locationDropdownRef = useRef(null);
    const latestSkillsQueryRef = useRef("");
    const latestLocationQueryRef = useRef("");

    // Candidate Profile Completion & HR Attention Indicator
    const [candidateProfileStats, setCandidateProfileStats] = useState({
        isCandidate: false,
        completionPercentage: null,
        missingItems: [],
        userName: "",
    });
    const [bannerDismissed, setBannerDismissed] = useState(false);

    useEffect(() => {
        const fetchCandidateProfile = async () => {
            if (typeof window === "undefined") return;
            try {
                const token = localStorage.getItem("AccessToken");
                const rawUser = localStorage.getItem("loginDetails");
                if (!token || !rawUser) {
                    setCandidateProfileStats(prev => ({ ...prev, isCandidate: false }));
                    return;
                }

                const userObj = JSON.parse(rawUser);
                if (userObj.role_id && Number(userObj.role_id) !== 2) {
                    setCandidateProfileStats(prev => ({ ...prev, isCandidate: false }));
                    return;
                }

                const res = await getUserProfile({ user_id: userObj.id });
                const profile = res?.data?.data || {};

                const { percentage, missing } = calculateCandidateCompletion(profile, userObj);
                broadcastProfileProgress(percentage);

                setCandidateProfileStats({
                    isCandidate: true,
                    completionPercentage: percentage,
                    missingItems: missing,
                    userName: profile?.first_name || userObj?.first_name || "",
                });
            } catch (err) {
                const savedProgress = localStorage.getItem("profileProgress");
                if (savedProgress !== null) {
                    setCandidateProfileStats(prev => ({
                        ...prev,
                        completionPercentage: Number(savedProgress),
                    }));
                }
            }
        };

        fetchCandidateProfile();

        const handleProgressChange = (e) => {
            if (e?.detail?.percentage !== undefined) {
                setCandidateProfileStats(prev => ({
                    ...prev,
                    completionPercentage: Number(e.detail.percentage),
                }));
            }
        };
        window.addEventListener(PROFILE_PROGRESS_EVENT, handleProgressChange);
        return () => window.removeEventListener(PROFILE_PROGRESS_EVENT, handleProgressChange);
    }, []);

    // Helper to get the active term after the last comma
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
        const cleanPrefix = parts.map(p => p.trim()).filter(Boolean);
        if (!cleanPrefix.some(p => p.toLowerCase() === suggestion.toLowerCase())) {
            cleanPrefix.push(suggestion);
        }
        return cleanPrefix.join(", ") + ", ";
    };

    // Active query terms
    const activeSkillTerm = getLastQueryTerm(skills);
    const activeLocTerm = getLastQueryTerm(location);

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
                        const cleaned = locs
                            .map(l => cleanSingleLocationName(l.label || l))
                            .filter(Boolean);
                        const unique = Array.from(new Set(cleaned));
                        setLocationSuggestions(unique.map(c => ({ label: c })));
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
                skillsInputRef.current &&
                !skillsInputRef.current.contains(event.target)
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

    useEffect(() => {
        fetchInitialData();

        // Load initial user recent searches dynamically from localStorage
        const stored = getRecentSearches();
        setRecentSearches(stored);

        // Fetch dynamic job counts for any recent searches that haven't been counted yet
        stored.forEach((item) => {
            if (item.count === null || item.count === undefined) {
                fetchLiveCountForSearch(item).then((liveCount) => {
                    if (typeof liveCount === "number") {
                        updateRecentSearchCount(item.id, liveCount);
                    }
                }).catch(() => { });
            }
        });

        // Event listener for dynamic search updates across components and tabs
        const handleRecentUpdate = (e) => {
            const list = e?.detail || getRecentSearches();
            setRecentSearches(list);
        };

        const handleStorageEvent = (e) => {
            if (e.key === "careerfast_recent_searches") {
                setRecentSearches(getRecentSearches());
            }
        };

        window.addEventListener(RECENT_SEARCHES_EVENT, handleRecentUpdate);
        window.addEventListener("storage", handleStorageEvent);

        return () => {
            window.removeEventListener(RECENT_SEARCHES_EVENT, handleRecentUpdate);
            window.removeEventListener("storage", handleStorageEvent);
        };
    }, []);

    // Combine user recent searches and trending searches dynamically
    const displaySearches = useMemo(() => {
        const userItems = (recentSearches || []).slice(0, 4);
        const userLabels = new Set(userItems.map(item => (item.label || "").toLowerCase().trim()));

        const fillerTrending = (trendingSearches || []).filter(t => {
            const lbl = (t.label || "").toLowerCase().trim();
            return !userLabels.has(lbl);
        });

        return [...userItems, ...fillerTrending].slice(0, 4);
    }, [recentSearches, trendingSearches]);

    useEffect(() => {
        if (!initialFetchDone.current || !activeTab) return;
        if (lastFetchedFresherTab.current === activeTab) return;
        lastFetchedFresherTab.current = activeTab;
        fetchFresherJobs();
    }, [activeTab]);

    const fetchFresherJobs = async () => {
        if (!activeTab) return;
        setLoadingFresher(true);
        try {
            let params = { limit: 12, experience_type: "Fresher" };

            if (activeTab === "Work from home") {
                params.workplace_type = ["Work From Home"];
            } else if (activeTab === "Part-time") {
                params.job_nature = "Part-time";
            } else if (activeTab && activeTab !== "Big brands") {
                params.job_categories = [activeTab];
            }

            const fresherRes = await getJobPosts(params);
            setFresherJobs(fresherRes?.data?.data?.data || []);
        } catch (err) {
            console.error("Failed to fetch fresher jobs", err);
        } finally {
            setLoadingFresher(false);
        }
    };

    useEffect(() => {
        if (!initialFetchDone.current || !activeInternshipTab) return;
        if (lastFetchedInternshipTab.current === activeInternshipTab) return;
        lastFetchedInternshipTab.current = activeInternshipTab;
        fetchInternshipJobs();
    }, [activeInternshipTab]);

    const fetchInternshipJobs = async () => {
        if (!activeInternshipTab) return;
        setLoadingInternships(true);
        try {
            let params = { limit: 12, job_nature: "Internship" };

            if (activeInternshipTab === "Work from home") {
                params.workplace_type = ["Work From Home"];
            } else if (activeInternshipTab === "Part-time") {
                params.job_nature = "Part-time";
            } else if (activeInternshipTab && activeInternshipTab !== "Big brands") {
                params.job_categories = [activeInternshipTab];
            }

            const internshipRes = await getJobPosts(params);
            setInternshipJobs(internshipRes?.data?.data?.data || []);
        } catch (err) {
            console.error("Failed to fetch internship jobs", err);
        } finally {
            setLoadingInternships(false);
        }
    };

    const fetchInitialData = async () => {
        try {
            // Fetch all initial data in parallel for maximum speed
            const [
                statsRes,
                trendingRes,
                blogsRes,
                coursesRes,
                catRes,
                fresherCatRes,
                internshipCatRes,
                companiesRes,
                fresherJobsRes,
                internshipJobsRes,
                locationsRes
            ] = await Promise.allSettled([
                getHomePageStats(),
                getTrendingSearches(),
                getBlogs(),
                getAllCourses({ limit: 6 }),
                getJobCategoryData({ min_jobs: 4 }),
                getJobCategoryData({ job_nature: 'Job', experience_type: 'Fresher', min_jobs: 4 }),
                getJobCategoryData({ job_nature: 'Internship', min_jobs: 4 }),
                getTopCompanies({ limit: 12 }),
                getJobPosts({ limit: 12, experience_type: "Fresher" }),
                getJobPosts({ limit: 12, job_nature: "Internship" }),
                searchLocationsAPI("")
            ]);

            // Top Companies
            if (companiesRes.status === 'fulfilled' && companiesRes.value?.data?.data) {
                setCompanies(companiesRes.value.data.data);
            }

            // Stats
            if (statsRes.status === 'fulfilled' && statsRes.value?.data?.data) {
                setStats(statsRes.value.data.data);
            }

            // Trending Searches
            if (trendingRes.status === 'fulfilled' && trendingRes.value?.data?.data) {
                setTrendingSearches(trendingRes.value.data.data);
            }

            // Blogs
            if (blogsRes.status === 'fulfilled') {
                const blogs = blogsRes.value?.data || [];
                setRecentBlogs(blogs.slice(0, 3));
            }

            // Courses
            if (coursesRes.status === 'fulfilled') {
                const courses = coursesRes.value;
                setCoursesList(Array.isArray(courses) ? courses : []);
            }

            // Locations initial top cities
            if (locationsRes.status === 'fulfilled' && Array.isArray(locationsRes.value) && locationsRes.value.length > 0) {
                setDefaultLocations(locationsRes.value);
                setLocationSuggestions(locationsRes.value);
            }

            // Trending Categories (Top 12 IT-Related Categories)
            const catData = catRes.status === 'fulfilled' ? (catRes.value?.data?.data || []) : [];
            const mappedCats = extractTopITCategories(catData, getCategoryIcon, 12);
            setCategories(mappedCats);

            // Fresher Categories (Top 10 IT-Related Categories)
            const fresherCatData = fresherCatRes.status === 'fulfilled' ? (fresherCatRes.value?.data?.data || []) : [];
            const mappedFresherCats = extractTopITCategories(fresherCatData, getCategoryIcon);
            setFresherCategories(mappedFresherCats);
            const firstFresherTab = mappedFresherCats[0]?.name || "";
            if (firstFresherTab) {
                setActiveTab(firstFresherTab);
                lastFetchedFresherTab.current = firstFresherTab;
            }

            // Internship Categories (Top 10 IT-Related Categories)
            const internshipCatData = internshipCatRes.status === 'fulfilled' ? (internshipCatRes.value?.data?.data || []) : [];
            const mappedInternshipCats = extractTopITCategories(internshipCatData, getCategoryIcon);
            setInternshipCategories(mappedInternshipCats);
            const firstInternshipTab = mappedInternshipCats[0]?.name || "";
            if (firstInternshipTab) {
                setActiveInternshipTab(firstInternshipTab);
                lastFetchedInternshipTab.current = firstInternshipTab;
            }

            // Initial Jobs
            if (fresherJobsRes.status === 'fulfilled') {
                setFresherJobs(fresherJobsRes.value?.data?.data?.data || []);
            }
            if (internshipJobsRes.status === 'fulfilled') {
                setInternshipJobs(internshipJobsRes.value?.data?.data?.data || []);
            }

            initialFetchDone.current = true;
        } catch (err) {
            console.error("Failed to fetch initial homepage data", err);
        } finally {
            setLoading(false);
            setLoadingFresher(false);
            setLoadingInternships(false);
        }
    };

    const generateJobDetailsUrl = (job) => {
        const safeSlug = (val) => {
            if (!val) return "";
            if (Array.isArray(val)) return val.join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-");
            return String(val).toLowerCase().replace(/[^a-z0-9]+/g, "-");
        };

        const jobNature = safeSlug(job.job_nature || "");
        const jobTitle = safeSlug(job.job_title || "");
        const companyName = safeSlug(job.company_name || "");
        const locationSlug = safeSlug(job.work_location);
        const workplaceType = safeSlug(job.workplace_type || "");
        const experienceType = safeSlug(job.experience_type || "");
        const experienceRequired = safeSlug(job.experience_required);

        return getJobDetailsUrl(job) || `/job-details/${jobNature}-${jobTitle}-${companyName}-${locationSlug}-${workplaceType}-${experienceType}-${experienceRequired}-${job.id}`;
    };

    const handleJobCardNavigation = (e, job) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        const url = generateJobDetailsUrl(job);
        const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
        if (isMobile) {
            navigate(url);
        } else {
            window.open(url, "_blank");
        }
    };


    const generateBlogUrl = (blog) => {
        const title = blog?.blogTitle || blog?.title || "";
        if (!title) return '/blogs';
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return `/blog/${slug}`;
    };

    const rolesSliderRef = useRef(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    const chunkArray = (arr, size) => {
        const chunks = [];
        if (!arr) return chunks;
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    };

    const rolesToDisplay = roles.length > 0 ? roles : [
        { title: "Junior Seo Executive", jobs: "20+" },
        { title: "Application Developer", jobs: "20+" },
        { title: "Full Stack Engineer", jobs: "10+" },
        { title: "Associate Software Engineer", jobs: "10+" },
        { title: "Mern Stack Developer", jobs: "10+" },
        { title: "Software Developer", jobs: "10+" },
        { title: "Full Stack Developer", jobs: "23.5K+" },
        { title: "Front End Developer", jobs: "5.4K+" },
        { title: "Technical Lead", jobs: "10.3K+" },
        { title: "Technical Architect", jobs: "6.2K+" },
        { title: "Business Analyst", jobs: "4.9K+" },
        { title: "Functional Consultant", jobs: "5.1K+" }
    ];

    const roleChunks = chunkArray(rolesToDisplay, 6);

    const prmSliderSettings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex)
    };

    const testimonials = [
        {
            name: "Alex Rivera",
            role: "Full Stack Developer",
            text: "The web development course was a game-changer for me. The practical projects helped me build a portfolio that landed me my first job at a top tech firm.",
            image: "https://i.pravatar.cc/150?u=alex"
        },
        {
            name: "Sarah Chen",
            role: "Data Scientist",
            text: "Incredible curriculum! The educators explain complex data science concepts with such clarity. I feel much more confident in my analytical skills now.",
            image: "https://i.pravatar.cc/150?u=sarah"
        },
        {
            name: "Jordan Smith",
            role: "Digital Marketer",
            text: "The digital marketing training was very comprehensive. From SEO to social media strategies, it covered everything I needed to know to start my agency.",
            image: "https://i.pravatar.cc/150?u=jordan"
        },
        {
            name: "Maya Patel",
            role: "UI/UX Designer",
            text: "Loved the focus on practical design principles. The mentorship and feedback on my projects were invaluable. Highly recommend for aspiring designers!",
            image: "https://i.pravatar.cc/150?u=maya"
        },
        {
            name: "James Wilson",
            role: "HR Manager",
            text: "The HR management course provided me with the latest industry insights and tools. It's been instrumental in my recent promotion.",
            image: "https://i.pravatar.cc/150?u=james"
        },
        {
            name: "Elena Rodriguez",
            role: "Business Analyst",
            text: "Great experience! The structured approach to problem-solving and the real-world case studies made learning very engaging and effective.",
            image: "https://i.pravatar.cc/150?u=elena"
        },
        {
            name: "David Park",
            role: "Python Developer",
            text: "Python was always intimidating until I took this course. The step-by-step guidance and community support made the learning curve feel smooth.",
            image: "https://i.pravatar.cc/150?u=david"
        },
        {
            name: "Sophie Bennett",
            role: "Marketing Lead",
            text: "The depth of knowledge shared by the instructors is remarkable. This course gave me practical tools I could implement in my job immediately.",
            image: "https://i.pravatar.cc/150?u=sophie"
        },
        {
            name: "Liam O'Connor",
            role: "Software Engineer",
            text: "Highly structured and relevant content. The placement assistance was the cherry on top, helping me navigate my career transition effortlessly.",
            image: "https://i.pravatar.cc/150?u=liam"
        }
    ];

    const TestimonialsColumn = ({ testimonials, duration = 10, className = "" }) => {
        return (
            <div className={`hp-testimonials-col ${className}`}>
                <motion.div
                    animate={{ translateY: "-50%" }}
                    transition={{
                        duration: duration,
                        repeat: Infinity,
                        ease: "linear",
                        repeatType: "loop",
                    }}
                    className="hp-testimonials-col-inner"
                >
                    {[...new Array(2)].map((_, index) => (
                        <React.Fragment key={index}>
                            {testimonials.map((testimonial, i) => (
                                <div className="hp-testimonial-card-v2" key={i}>
                                    <div className="hp-testimonial-text-v2">"{testimonial.text}"</div>
                                    <div className="hp-testimonial-user-v2">
                                        <img
                                            src={testimonial.image}
                                            alt={testimonial.name}
                                            className="hp-testimonial-avatar-v2"
                                        />
                                        <div className="hp-testimonial-info-v2">
                                            <div className="hp-testimonial-name-v2">{testimonial.name}</div>
                                            <div className="hp-testimonial-role-v2">{testimonial.role}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </React.Fragment>
                    ))}
                </motion.div>
            </div>
        );
    };

    const getCourseStats = (slug) => {
        const statsMap = {
            'full-stack-web-development': { duration: '8 Weeks', rating: '4.9', learners: '1,28,094' },
            'data-science-machine-learning': { duration: '10 Weeks', rating: '4.9', learners: '94,520' },
            'digital-marketing-masterclass': { duration: '6 Weeks', rating: '4.8', learners: '78,410' },
            'ui-ux-design-professional': { duration: '8 Weeks', rating: '4.8', learners: '65,230' },
            'product-management-101': { duration: '8 Weeks', rating: '4.8', learners: '42,150' },
            'ai-for-business': { duration: '6 Weeks', rating: '4.9', learners: '53,890' },
            'blockchain-web3-development': { duration: '8 Weeks', rating: '4.7', learners: '29,430' },
            'human-resource-management': { duration: '6 Weeks', rating: '4.6', learners: '34,210' },
            'business-analytics': { duration: '8 Weeks', rating: '4.8', learners: '48,760' },
            'advanced-excel': { duration: '4 Weeks', rating: '4.7', learners: '1,54,320' },
        };
        return statsMap[slug] || { duration: '8 Weeks', rating: '4.8', learners: '15,000+' };
    };


    const premiumServices = [
        {
            title: "Resume Display",
            tag: "3x Visibility",
            desc: "Highlight your profile to active recruiters and get discovered up to 3 times faster by top employers.",
            icon: <FileSearchOutlined />,
            link: "/candidate-profile"
        },
        {
            title: "Priority Applicant",
            tag: "Featured",
            desc: "Get prioritized on employer applications so hiring managers review your resume first.",
            icon: <StarOutlined />,
            popular: true,
            link: "/job-filter"
        },
        {
            title: "Resume Writing",
            tag: "ATS-Ready",
            desc: "Professional resume crafted by industry experts to pass ATS filters and land more interviews.",
            icon: <EditOutlined />,
            link: "/candidate-profile"
        }
    ];

    const cities = [
        { name: "Bangalore", img: BangaloreCity, jobs: "25k+ Jobs" },
        { name: "Mumbai", img: MumbaiCity, jobs: "18k+ Jobs" },
        { name: "Delhi", img: DelhiCity, jobs: "22k+ Jobs" },
        { name: "Hyderabad", img: HyderabadCity, jobs: "15k+ Jobs" },
        { name: "Chennai", img: ChennaiCity, jobs: "12k+ Jobs" },
        { name: "Remote", img: RemoteCity, jobs: "10k+ Jobs" }
    ];



    return (
        <div className="hp-container">
            <Header showSearch={false} />

            {/* Candidate Profile Completion Alert Banner */}
            {candidateProfileStats.isCandidate && candidateProfileStats.completionPercentage !== null && candidateProfileStats.completionPercentage < 100 && !bannerDismissed && (() => {
                const pct = candidateProfileStats.completionPercentage;
                const tier = pct >= 80 ? "strong" : pct >= 50 ? "mid" : "basic";
                const tierLabel = pct >= 80 ? "Strong" : pct >= 50 ? "Intermediate" : "Getting Started";

                return (
                    <div className="hp-profile-alert-banner">
                        <div className={`hp-profile-alert-container hp-tier-${tier}`}>
                            {/* Left Side: Professional Profile Icon + Information */}
                            <div className="hp-profile-alert-left">
                                <div className={`hp-profile-alert-icon-wrap hp-icon-tier-${tier}`} aria-hidden="true">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <polyline points="16 11 18 13 22 9" />
                                    </svg>
                                </div>
                                <div className="hp-profile-alert-text">
                                    <div className="hp-profile-alert-title-row">
                                        <span className="hp-profile-alert-title">
                                            Complete your profile
                                        </span>
                                        <span className="hp-profile-tag-pill hp-tag-visibility">
                                            <span className="hp-profile-tag-pulse" />
                                            3x Recruiter Visibility
                                        </span>
                                    </div>
                                    <div className="hp-profile-alert-subtitle">
                                        Complete your profile to get prioritized by recruiters and unlock top job matches.
                                    </div>
                                </div>
                            </div>

                            {/* Center: Sleek Unified Progress Meter */}
                            <div className="hp-profile-progress-section">
                                <div className="hp-profile-progress-header">
                                    <span className="hp-profile-progress-lbl">Profile Strength</span>
                                    <span className={`hp-profile-pct-text hp-text-tier-${tier}`}>
                                        <strong>{pct}%</strong> <span className="hp-tier-sep">•</span> {tierLabel}
                                    </span>
                                </div>
                                <div className="hp-profile-progress-track">
                                    <div
                                        className={`hp-profile-progress-fill hp-fill-tier-${tier}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>

                            {/* Right: CTA & Dismiss Button */}
                            <div className="hp-profile-alert-actions">
                                <button
                                    type="button"
                                    className={`hp-profile-complete-btn hp-btn-tier-${tier}`}
                                    onClick={() => navigate("/candidate-profile/mainprofile")}
                                >
                                    <span>Complete Profile</span>
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="hp-profile-btn-chevron"
                                    >
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>

                                <button
                                    type="button"
                                    className="hp-profile-dismiss-btn"
                                    onClick={() => setBannerDismissed(true)}
                                    title="Dismiss notification"
                                    aria-label="Dismiss notification"
                                >
                                    <svg
                                        width="13"
                                        height="13"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                    >
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Hero Section */}
            <section className="hp-hero">
                <div className="hp-hero-bg-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ position: 'relative', zIndex: 2 }}
                >
                    <div className="hp-hero-badge">
                        <Sparkles size={14} className="hp-hero-badge-icon" />
                        <span>#1 Job Platform • 500,000+ Verified Opportunities</span>
                    </div>

                    <h1 className="hp-hero-title">
                        Find your <span className="hp-hero-highlight">dream job</span> now
                    </h1>
                    <p className="hp-hero-subtitle">
                        5 lakh+ jobs for you to explore across top MNCs, fast-growing tech startups &amp; remote teams
                    </p>

                    <SearchWorkflow
                        mode="hero"
                        navigate={navigate}
                        initialType="Jobs"
                        showRecent={true}
                    />

                    {/* Trust Highlights */}
                    {/* <div className="hp-hero-trust-bar">
                        <div className="hp-hero-trust-item">
                            <span className="hp-trust-icon">✨</span>
                            <span><strong>500K+</strong> Active Jobs</span>
                        </div>
                        <div className="hp-hero-trust-divider"></div>
                        <div className="hp-hero-trust-item">
                            <span className="hp-trust-icon">🏢</span>
                            <span><strong>25K+</strong> Verified Employers</span>
                        </div>
                        <div className="hp-hero-trust-divider"></div>
                        <div className="hp-hero-trust-item">
                            <span className="hp-trust-icon">⚡</span>
                            <span><strong>Direct HR</strong> Shortlisting</span>
                        </div>
                    </div> */}
                </motion.div>
            </section>

            {/* Trending Categories Section */}
            {categories.length > 0 && (
                <section className="hp-trending-section">
                    <motion.div
                        className="hp-trending-grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                    >
                        {categories.map((cat, idx) => (
                            <Link
                                key={idx}
                                href={`/jobs?c=${encodeURIComponent(cat.name)}`}
                                className="hp-category-card"
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div className="hp-category-left">
                                    <div className="hp-category-icon-wrapper">
                                        {cat.icon}
                                    </div>
                                    <span className="hp-category-name">{cat.name}</span>
                                </div>
                                <RightOutlined className="hp-category-arrow" />
                            </Link>
                        ))}
                    </motion.div>
                </section>
            )}

            <div className="counter">
                <Row>
                    <Col md={8}>
                        <motion.div
                            className="counter-card pink-bg"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <h2>
                                <Counter
                                    end={stats.totalJobs >= 1000 ? stats.totalJobs / 1000 : stats.totalJobs}
                                    duration={2}
                                    decimals={stats.totalJobs >= 1000 ? 1 : 0}
                                    suffix={stats.totalJobs >= 1000 ? "K+" : "+"}
                                />
                            </h2>
                            <p>Listed Jobs & Internships</p>
                            <div className="company-logos1"><img src={getImageUrl(company_logos1)} alt="Jobs Counter" /></div>
                        </motion.div>
                    </Col>
                    <Col md={8}>
                        <motion.div
                            className="counter-card blue-bg"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <h2>
                                <Counter
                                    end={stats.totalRecruiters >= 1000 ? stats.totalRecruiters / 1000 : stats.totalRecruiters}
                                    duration={2}
                                    decimals={stats.totalRecruiters >= 1000 ? 1 : 0}
                                    suffix={stats.totalRecruiters >= 1000 ? "K+" : "+"}
                                />
                            </h2>
                            <p>Verified Recruiters</p>
                            <div className="company-logos2"><img src={getImageUrl(company_logos2)} alt="Jobs Counter" /></div>
                        </motion.div>
                    </Col>
                    <Col md={8}>
                        <motion.div
                            className="counter-card yellow-bg"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <h2>
                                <Counter
                                    end={stats.totalApplications >= 1000000 ? stats.totalApplications / 1000000 : stats.totalApplications >= 1000 ? stats.totalApplications / 1000 : stats.totalApplications}
                                    duration={2}
                                    decimals={stats.totalApplications >= 1000 ? 1 : 0}
                                    suffix={stats.totalApplications >= 1000000 ? "M+" : stats.totalApplications >= 1000 ? "K+" : "+"}
                                />
                            </h2>
                            <p>Applications</p>
                            <div className="company-logos3"><img src={getImageUrl(company_logos3)} alt="Jobs Counter" /></div>
                        </motion.div>
                    </Col>
                </Row>
            </div>
            {/*  */}

            {/* What are you looking for today? Section */}
            <section className="hp-fresher-section">
                <div className="hp-fresher-header">
                    <h2>Explore Jobs for Freshers</h2>
                    <h3>Find the perfect role to launch your career</h3>
                </div>

                <div className="hp-fresher-header">
                    <div className="hp-tabs-scroll-wrapper">
                        <button
                            type="button"
                            className={`hp-tabs-arrow-btn prev ${!fresherScroll.canScrollLeft ? 'disabled' : ''}`}
                            onClick={() => scrollTabs(fresherTabsRef, "left", setFresherScroll)}
                            aria-label="Previous categories"
                        >
                            <LeftOutlined />
                        </button>

                        <div
                            className="hp-tabs-container"
                            ref={fresherTabsRef}
                            onScroll={() => checkScrollState(fresherTabsRef.current, setFresherScroll)}
                        >
                            {fresherCategories.slice(0, 10).map((c, idx) => (
                                <div
                                    key={`${c.name}-${idx}`}
                                    className={`hp-tab-chip ${activeTab === c.name ? "active" : ""}`}
                                    onClick={() => setActiveTab(c.name)}
                                >
                                    {c.name}
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            className={`hp-tabs-arrow-btn next ${!fresherScroll.canScrollRight ? 'disabled' : ''}`}
                            onClick={() => scrollTabs(fresherTabsRef, "right", setFresherScroll)}
                            aria-label="Next categories"
                        >
                            <RightOutlined />
                        </button>
                    </div>
                </div>

                <div className="hp-fresher-slider">
                    {loadingFresher ? (
                        <div className="hp-slider-skeleton-row">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="hp-slider-skeleton-card" />
                            ))}
                        </div>
                    ) : fresherJobs.length > 0 ? (
                        <Slider {...sliderSettings}>
                            {fresherJobs.map((job) => (
                                <div key={job.id}>
                                    <div onClick={(e) => handleJobCardNavigation(e, job)} className="hp-fresher-card">
                                        <div className="hp-company-violet-box">
                                            <div className="hp-company-logo-wrapper">
                                                <img
                                                    src={getImageUrl(job.company_logo) || "/favicon.png"}
                                                    alt={job.company_name || "Company logo"}
                                                    loading="lazy"
                                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/favicon.png"; }}
                                                />
                                            </div>

                                            <div className="hp-card-tag" style={{ color: 'green' }}>
                                                <ThunderboltFilled style={{ fontSize: 10 }} />
                                                Actively hiring
                                            </div>
                                        </div>
                                        <h3 className="hp-card-title" title={job.job_title}>{job.job_title}</h3>
                                        <div className="hp-card-company">
                                            <div className="hp-company-text">
                                                <span className="hp-company-name-text" title={job.company_name}>{job.company_name}</span>
                                            </div>
                                        </div>

                                        {/* <div className="hp-card-specs">
                                            {job.workplace_type && (
                                                <div className="hp-spec-item">
                                                    <HomeOutlined style={{ fontSize: '14px' }} />
                                                    <span>{Array.isArray(job.workplace_type) ? job.workplace_type[0] : job.workplace_type}</span>
                                                </div>
                                            )}
                                            {job.experience_required && (
                                                <div className="hp-spec-item">
                                                    <ClockCircleOutlined style={{ fontSize: '14px' }} />
                                                    <span>{Array.isArray(job.experience_required) ? job.experience_required.join(", ") : job.experience_required}</span>
                                                </div>
                                            )}
                                        </div> */}

                                        {job.skills && job.skills.length > 0 && (
                                            <div className="hp-card-skills">
                                                <div className="hp-skills-track">
                                                    {job.skills.map((skill, idx) => (
                                                        <span key={idx} className="hp-skill-tag">{skill}</span>
                                                    ))}
                                                    {job.skills.map((skill, idx) => (
                                                        <span key={`dup-${idx}`} className="hp-skill-tag">{skill}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="hp-card-meta">
                                            <div className="hp-card-meta-item">
                                                <EnvironmentOutlined style={{ color: "#8292b4" }} />
                                                <span>{(Array.isArray(job.work_location) ? job.work_location[0] : job.work_location) || "N/A"}</span>
                                            </div>
                                            <div className="hp-card-meta-item">
                                                <WalletOutlined style={{ color: "#8292b4" }} />
                                                <span>
                                                    {job.salary_type === "Range"
                                                        ? ((!job.min_salary || String(job.min_salary) === "0") && (!job.max_salary || String(job.max_salary) === "0")) ? "Not Disclosed" : `${getCurrencySymbol(job.currency)} ${String(job.min_salary || 0).replace(/\/month|LPA/g, '')} - ${String(job.max_salary || 0).replace(/\/month|LPA/g, '')} ${job.salary_duration?.toLowerCase() === "monthly" ? "Per Month" : "LPA"}`
                                                        : job.salary_type === "Fixed"
                                                            ? (!job.min_salary || String(job.min_salary) === "0") ? "Not Disclosed" : `${getCurrencySymbol(job.currency)} ${String(job.min_salary).replace(/\/month|LPA/g, '')} ${job.salary_duration?.toLowerCase() === "monthly" ? "Per Month" : "LPA"}`
                                                            : "Not Disclosed"
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        <div className="hp-card-footer">
                                            <span className="hp-card-type">{job.job_nature}</span>
                                            <a
                                                href={generateJobDetailsUrl(job)}
                                                className="hp-card-link"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => {
                                                    const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
                                                    if (isMobile) {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        navigate(generateJobDetailsUrl(job));
                                                    }
                                                }}
                                            >
                                                View details &gt;
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Slider>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#8292b4' }}>
                            No fresher jobs found matching your criteria.
                        </div>
                    )}
                </div>
            </section>

            {/* Internships Section */}
            <section className="hp-internship-section">
                <div className="hp-fresher-header">
                    <h2>Explore Internships</h2>
                    <h3>Gain valuable experience with top companies</h3>
                </div>

                <div className="hp-fresher-header">
                    <div className="hp-tabs-scroll-wrapper">
                        <button
                            type="button"
                            className={`hp-tabs-arrow-btn prev ${!internshipScroll.canScrollLeft ? 'disabled' : ''}`}
                            onClick={() => scrollTabs(internshipTabsRef, "left", setInternshipScroll)}
                            aria-label="Previous categories"
                        >
                            <LeftOutlined />
                        </button>

                        <div
                            className="hp-tabs-container"
                            ref={internshipTabsRef}
                            onScroll={() => checkScrollState(internshipTabsRef.current, setInternshipScroll)}
                        >
                            {internshipCategories.slice(0, 10).map((c, idx) => (
                                <div
                                    key={`${c.name}-${idx}`}
                                    className={`hp-tab-chip ${activeInternshipTab === c.name ? "active" : ""}`}
                                    onClick={() => setActiveInternshipTab(c.name)}
                                >
                                    {c.name}
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            className={`hp-tabs-arrow-btn next ${!internshipScroll.canScrollRight ? 'disabled' : ''}`}
                            onClick={() => scrollTabs(internshipTabsRef, "right", setInternshipScroll)}
                            aria-label="Next categories"
                        >
                            <RightOutlined />
                        </button>
                    </div>
                </div>

                <div className="hp-fresher-slider">
                    {loadingInternships ? (
                        <div className="hp-slider-skeleton-row">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="hp-slider-skeleton-card" />
                            ))}
                        </div>
                    ) : internshipJobs.length > 0 ? (
                        <Slider {...sliderSettings}>
                            {internshipJobs.map((job) => (
                                <div key={job.id}>
                                    <div onClick={(e) => handleJobCardNavigation(e, job)} className="hp-fresher-card">
                                        <div className="hp-company-violet-box">
                                            <div className="hp-company-logo-wrapper">
                                                <img
                                                    src={getImageUrl(job.company_logo) || "/favicon.png"}
                                                    alt={job.company_name || "Company logo"}
                                                    loading="lazy"
                                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/favicon.png"; }}
                                                />
                                            </div>
                                            <div className="hp-card-tag" style={{ color: 'green' }}>
                                                <ThunderboltFilled style={{ fontSize: 10 }} />
                                                Actively hiring
                                            </div>
                                        </div>

                                        <h3 className="hp-card-title" title={job.job_title}>{job.job_title}</h3>
                                        <div className="hp-card-company">
                                            <div className="hp-company-text">
                                                <span className="hp-company-name-text" title={job.company_name}>{job.company_name}</span>
                                            </div>
                                        </div>

                                        {/* <div className="hp-card-specs">
                                            {job.workplace_type && (
                                                <div className="hp-spec-item">
                                                    <HomeOutlined style={{ fontSize: '14px' }} />
                                                    <span>{Array.isArray(job.workplace_type) ? job.workplace_type[0] : job.workplace_type}</span>
                                                </div>
                                            )}
                                            {job.experience_required && (
                                                <div className="hp-spec-item">
                                                    <ClockCircleOutlined style={{ fontSize: '14px' }} />
                                                    <span>{Array.isArray(job.experience_required) ? job.experience_required.join(", ") : job.experience_required}</span>
                                                </div>
                                            )}
                                        </div> */}

                                        {job.skills && job.skills.length > 0 && (
                                            <div className="hp-card-skills">
                                                <div className="hp-skills-track">
                                                    {job.skills.map((skill, idx) => (
                                                        <span key={idx} className="hp-skill-tag">{skill}</span>
                                                    ))}
                                                    {job.skills.map((skill, idx) => (
                                                        <span key={`dup-${idx}`} className="hp-skill-tag">{skill}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="hp-card-meta">
                                            <div className="hp-card-meta-item">
                                                <EnvironmentOutlined style={{ color: "#8292b4" }} />
                                                <span>{(Array.isArray(job.work_location) ? job.work_location[0] : job.work_location) || "N/A"}</span>
                                            </div>
                                            <div className="hp-card-meta-item">
                                                <WalletOutlined style={{ color: "#8292b4" }} />
                                                <span>
                                                    {job.salary_type === "Range"
                                                        ? ((!job.min_salary || String(job.min_salary) === "0") && (!job.max_salary || String(job.max_salary) === "0")) ? "Not Disclosed" : `${getCurrencySymbol(job.currency)} ${String(job.min_salary || 0).replace(/\/month|LPA/g, '')} - ${String(job.max_salary || 0).replace(/\/month|LPA/g, '')} ${job.salary_duration?.toLowerCase() === "monthly" ? "Per Month" : "LPA"}`
                                                        : job.salary_type === "Fixed"
                                                            ? (!job.min_salary || String(job.min_salary) === "0") ? "Not Disclosed" : `${getCurrencySymbol(job.currency)} ${String(job.min_salary).replace(/\/month|LPA/g, '')} ${job.salary_duration?.toLowerCase() === "monthly" ? "Per Month" : "LPA"}`
                                                            : "Not Disclosed"
                                                    }
                                                </span>
                                            </div>
                                            {job.working_days && (
                                                <div className="hp-card-meta-item">
                                                    <HistoryOutlined style={{ color: "#8292b4" }} />
                                                    <span>{job.working_days}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="hp-card-footer">
                                            <span className="hp-card-type">{job.job_nature}</span>
                                            <a
                                                href={generateJobDetailsUrl(job)}
                                                className="hp-card-link"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => {
                                                    const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));
                                                    if (isMobile) {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        navigate(generateJobDetailsUrl(job));
                                                    }
                                                }}
                                            >
                                                View details &gt;
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Slider>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#8292b4' }}>
                            No internships found matching your criteria.
                        </div>
                    )}
                </div>
            </section>

            {/* Featured Companies Section */}
            {companies.length > 0 && (
                <section className="hp-companies-section">
                    <div className="hp-section-container">
                        <div className="hp-companies-badge">
                            <BuildOutlined className="hp-companies-badge-icon" />
                            <span>Featured Employers</span>
                        </div>
                        <h2 className="hp-section-title">Top companies hiring now</h2>
                        <p className="hp-section-subtitle">Discover premium opportunities with industry leaders</p>
                        <div className="hp-company-grid">
                            {companies.slice(0, 5).map((company, idx) => (
                                <motion.div
                                    key={idx}
                                    className="hp-company-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                                    viewport={{ once: true }}
                                    onClick={() => navigate(`/job-filter?co=${encodeURIComponent(company.name)}`)}
                                >
                                    <div className="hp-company-logo-wrapper">
                                        <img
                                            src={getImageUrl(company.logo, company.name)}
                                            alt={company.name}
                                            onError={(e) => { e.target.onerror = null; e.target.src = getPlaceholderSvg(company.name, 150, 150); }}
                                        />
                                    </div>

                                    <div className="hp-company-info">
                                        <h3 className="hp-company-name" title={company.name}>{company.name}</h3>

                                        <div className="hp-company-rating-wrap">
                                            <StarFilled className="hp-company-star" />
                                            <span className="hp-company-rating-val">{company.rating || "4.5"}</span>
                                            {company.reviews && (
                                                <span className="hp-company-reviews-text">({company.reviews})</span>
                                            )}
                                        </div>

                                        {company.type && (
                                            <span className="hp-company-type-badge" title={company.type}>
                                                {company.type}
                                            </span>
                                        )}
                                    </div>

                                    <div className="hp-company-footer">
                                        <div className="hp-company-hiring-indicator">
                                            <span className="hp-company-pulse-dot"></span>
                                            <span>
                                                {company.active_jobs
                                                    ? `${company.active_jobs} ${company.active_jobs === 1 ? 'Job' : 'Jobs'} Hiring`
                                                    : 'Actively Hiring'}
                                            </span>
                                        </div>
                                        <Link
                                            href={`/jobs?co=${encodeURIComponent(company.name)}`}
                                            className="hp-company-view-btn"
                                            style={{ textDecoration: 'none' }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span>View jobs</span>
                                            <RightOutlined className="hp-company-btn-arrow" />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="hp-companies-footer-cta">
                            <button
                                className="hp-companies-view-all-btn"
                                onClick={() => navigate('/job-filter')}
                            >
                                <span>View all companies</span>
                                <RightOutlined className="hp-btn-arrow-more" />
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Jobs by City Section */}
            <section className="hp-cities-section">
                <div className="hp-section-container">
                    <div className="hp-section-header-center">
                        <div className="hp-cities-badge">
                            <EnvironmentOutlined className="hp-cities-badge-icon" />
                            <span>Top Hiring Locations</span>
                        </div>
                        <h2 className="hp-section-title">Explore opportunities in top cities</h2>
                        <p className="hp-section-subtitle">Find your next role in your favorite location</p>
                    </div>
                    <div className="hp-cities-grid">
                        {cities.map((city, idx) => (
                            <motion.div
                                key={idx}
                                className="hp-city-card"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04, duration: 0.35 }}
                                viewport={{ once: true }}
                                onClick={() => navigate(`/job-filter?l=${encodeURIComponent(city.name)}`)}
                            >
                                <div className="hp-city-image-wrapper">
                                    <img
                                        src={getImageUrl(city.img)}
                                        alt={city.name}
                                        loading="lazy"
                                        className="hp-city-card-img"
                                    />
                                </div>
                                <div className="hp-city-card-body">
                                    <div className="hp-city-title-row">
                                        <h3 className="hp-city-card-name">
                                            <Link
                                                href={`/jobs?l=${encodeURIComponent(city.name)}`}
                                                style={{ color: 'inherit', textDecoration: 'none' }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {city.name}
                                            </Link>
                                        </h3>
                                        <RightOutlined className="hp-city-card-arrow" />
                                    </div>
                                    <span className="hp-city-card-jobs">{city.jobs}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Popular Roles Section */}
            <section className="hp-popular-roles-modern">
                <div className="hp-prm-container">
                    <div className="hp-prm-left">
                        <div className="hp-prm-left-content">
                            <h2>Discover jobs across popular roles</h2>
                            <p>Take the next step in your career</p>
                        </div>
                        <div className="hp-prm-illustration-container">
                            <img
                                src={getImageUrl(PopularRolesIllustration)}
                                alt="Popular Roles"
                                className="hp-prm-illustration"
                            />
                        </div>
                    </div>

                    <div className="hp-prm-right">
                        <div className="hp-prm-card">
                            <div className="hp-prm-slider-wrapper">
                                <Slider ref={rolesSliderRef} {...prmSliderSettings}>
                                    {roleChunks && roleChunks.length > 0 ? (
                                        roleChunks.map((chunk, chunkIdx) => (
                                            <div key={chunkIdx}>
                                                <div className="hp-prm-grid">
                                                    {chunk.map((role, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="hp-prm-role-item"
                                                            onClick={() => navigate(`/job-filter?q=${encodeURIComponent(role.title)}`)}
                                                        >
                                                            <div className="hp-prm-role-icon-box">
                                                                <SolutionOutlined />
                                                            </div>
                                                            <div className="hp-prm-role-info">
                                                                <h3 className="hp-prm-role-title">{role.title}</h3>
                                                                <p>{role.jobs.includes("Jobs") ? role.jobs : `${role.jobs} Jobs`}</p>
                                                            </div>
                                                            <RightOutlined className="hp-prm-arrow" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="hp-prm-no-data">Loading roles...</div>
                                    )}
                                </Slider>
                            </div>

                            <div className="hp-prm-footer">
                                <div className="hp-prm-dots">
                                    {roleChunks.map((_, idx) => (
                                        <span
                                            key={idx}
                                            className={`hp-prm-dot ${currentSlide === idx ? "active" : ""}`}
                                            onClick={() => rolesSliderRef.current?.slickGoTo(idx)}
                                        ></span>
                                    ))}
                                </div>
                                <div className="hp-prm-view-all-container">
                                    <a href="/job-filter" className="hp-prm-view-all">
                                        View all jobs <RightOutlined style={{ fontSize: 10 }} />
                                    </a>
                                </div>
                            </div>
                            <button
                                className="hp-prm-next-btn"
                                onClick={() => rolesSliderRef.current?.slickNext()}
                            >
                                <RightOutlined />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dynamic Certifications Section */}
            <section className="hp-cert-section">
                <div className="hp-section-container">
                    <div className="hp-section-header-center">
                        <div className="hp-cert-badge">
                            <SafetyCertificateFilled className="hp-cert-badge-icon" />
                            <span>Recommended Certifications</span>
                        </div>
                        <h2>Top-rated certifications to upskill</h2>
                        <p>Boost your career with industry-recognized courses led by domain experts</p>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="hp-cert-tabs">
                        {(() => {
                            const cleanedCourses = coursesList.filter(c => isCleanString(c.title) && isCleanString(c.category));
                            const dynamicCats = Array.from(new Set(cleanedCourses.map(c => c.category?.trim()).filter(Boolean)));
                            const tabsToShow = dynamicCats.length > 0
                                ? ["All Programs", ...dynamicCats.slice(0, 5)]
                                : ["All Programs", "Development", "Data Analytics", "Data Science", "Cloud Computing"];
                            return tabsToShow.map((cat) => (
                                <button
                                    key={cat}
                                    className={`hp-cert-tab-btn ${activeCourseCategory === cat ? "active" : ""}`}
                                    onClick={() => setActiveCourseCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ));
                        })()}
                    </div>

                    <div className="hp-cert-grid">
                        {(() => {
                            const cleanedCourses = coursesList.filter(c => isCleanString(c.title) && isCleanString(c.category));
                            const coursesSource = cleanedCourses.length > 0 ? cleanedCourses : coursesList;
                            const filteredCourses = coursesSource
                                .filter(course => activeCourseCategory === "All Programs" || (course.category?.trim()?.toLowerCase() === activeCourseCategory.toLowerCase()))
                                .slice(0, 6);
                            if (filteredCourses.length === 0) {
                                return (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#8292b4' }}>
                                        {loadingCourses ? "Loading certifications..." : "No certifications found in this category."}
                                    </div>
                                );
                            }
                            return filteredCourses.map((course, idx) => {
                                const stats = getCourseStats(course.slug);
                                let content = null;
                                try {
                                    content = typeof course.content === 'string' ? JSON.parse(course.content) : course.content;
                                } catch (e) {
                                    content = null;
                                }
                                const discPrice = content?.hero?.prices?.discounted || "3,999";
                                const origPrice = content?.hero?.prices?.original || "7,999";

                                return (
                                    <motion.div
                                        key={course.id || idx}
                                        className="hp-cert-card-v2"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05, duration: 0.4 }}
                                        viewport={{ once: true }}
                                        onClick={() => navigate(`/courses/${course.slug}`)}
                                    >
                                        <div className="hp-cert-image-wrapper-v2">
                                            <img
                                                src={course.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"}
                                                alt={course.title}
                                                loading="lazy"
                                                className="hp-cert-img"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3";
                                                }}
                                            />
                                            {course.category && (
                                                <span className="hp-cert-category-badge">
                                                    {course.category}
                                                </span>
                                            )}
                                        </div>

                                        <div className="hp-cert-body-v2">
                                            <div className="hp-cert-meta-top">
                                                <div className="hp-cert-rating-wrap">
                                                    <StarFilled className="hp-cert-star-icon" />
                                                    <span className="hp-cert-rating-num">{stats.rating}</span>
                                                </div>
                                                <span className="hp-cert-meta-divider">•</span>
                                                <span className="hp-cert-learners">{stats.learners} learners</span>
                                            </div>

                                            <h3 className="hp-cert-title-v2" title={course.title}>{course.title}</h3>
                                            <p className="hp-cert-desc-v2">{course.description}</p>

                                            <div className="hp-cert-stats-v2">
                                                <div className="hp-cert-stat-item">
                                                    <ClockCircleOutlined className="hp-cert-stat-icon" />
                                                    <span>{stats.duration}</span>
                                                </div>
                                                <span className="hp-cert-stat-dot">•</span>
                                                <div className="hp-cert-stat-item">
                                                    <SafetyCertificateOutlined className="hp-cert-stat-icon" />
                                                    <span>Placement Support</span>
                                                </div>
                                            </div>

                                            <div className="hp-cert-price-row">
                                                <div className="hp-cert-prices">
                                                    <span className="hp-cert-price-disc">₹{discPrice}</span>
                                                    <span className="hp-cert-price-orig">₹{origPrice}</span>
                                                </div>
                                                <span className="hp-cert-discount-tag">
                                                    50% OFF
                                                </span>
                                            </div>
                                        </div>

                                        <div className="hp-cert-footer-v2">
                                            <Link
                                                href={`/courses/${course.slug}`}
                                                className="hp-cert-btn-v2"
                                                style={{ textDecoration: 'none' }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <span>Explore Program</span>
                                                <RightOutlined className="hp-btn-arrow" />
                                            </Link>
                                        </div>
                                    </motion.div>
                                );
                            });
                        })()}
                    </div>

                    {/* Explore More Button */}
                    <div className="hp-cert-explore-more-container">
                        <button
                            className="hp-cert-explore-more-btn"
                            onClick={() => navigate("/courses")}
                        >
                            <span>Explore all certifications</span>
                            <RightOutlined className="hp-btn-arrow-more" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Premium Services Section */}
            <section className="hp-premium-section">
                <div className="hp-section-container">
                    <div className="hp-section-header-center">
                        <div className="hp-premium-badge">
                            <RocketOutlined className="hp-premium-badge-icon" />
                            <span>Value Added Services</span>
                        </div>
                        <h2 className="hp-section-title">Accelerate your job search with Premium Services</h2>
                        <p className="hp-section-subtitle">Services designed to help you stand out and get hired faster</p>
                    </div>
                    <div className="hp-premium-grid">
                        {premiumServices.map((service, idx) => (
                            <motion.div
                                key={idx}
                                className={`hp-premium-card ${service.popular ? "hp-premium-card-popular" : ""}`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.08, duration: 0.4 }}
                                viewport={{ once: true }}
                                onClick={() => navigate(service.link)}
                            >
                                <div className="hp-premium-card-header">
                                    <div className="hp-premium-icon-box">{service.icon}</div>
                                    <span className={`hp-premium-tag ${service.popular ? "hp-premium-tag-popular" : ""}`}>
                                        {service.tag}
                                    </span>
                                </div>
                                <div className="hp-premium-info">
                                    <h3 className="hp-premium-card-title">{service.title}</h3>
                                    <p className="hp-premium-card-desc">{service.desc}</p>
                                </div>
                                <div className="hp-premium-footer">
                                    <button
                                        className="hp-premium-btn"
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(service.link);
                                        }}
                                    >
                                        <span>View Details</span>
                                        <RightOutlined className="hp-premium-arrow" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Interview Preparation Section */}
            <section className="hp-interview-prep-section">
                <div className="hp-ip-main-wrapper">
                    <div className="hp-ip-left">
                        <span className="hp-tag">by Careerfast</span>
                        <img
                            src={getImageUrl(interviewImage)}
                            alt="Interview Prep"
                            className="hp-ip-illustration"
                        />
                        <h2>Prepare for your next<br /> interview</h2>
                    </div>

                    <div className="hp-ip-panel hp-ip-middle">
                        <div className="hp-ip-header">
                            <h3>Interview questions by company</h3>
                        </div>
                        <div className="hp-ip-company-grid">
                            {companies.slice(0, 6).map((company, idx) => (
                                <div key={idx} className="hp-ip-company-card" onClick={() => navigate(`/job-filter?co=${encodeURIComponent(company.name)}`)}>
                                    <img
                                        src={getImageUrl(company.logo, company.name)}
                                        alt={company.name}
                                        className="hp-ip-company-logo"
                                        onError={(e) => { e.target.onerror = null; e.target.src = getPlaceholderSvg(company.name, 40, 40); }}
                                    />
                                    <div className="hp-ip-company-info">
                                        <h4>{company.name}</h4>
                                        <p>{company.active_jobs ? `${Math.max(company.active_jobs * 10, 50)}+ Questions` : `${company.rating}★ Rating`}</p>
                                    </div>
                                    <RightOutlined style={{ fontSize: 10, color: '#1e1e1e', marginLeft: 'auto' }} />
                                </div>
                            ))}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <a href="/job-filter" className="hp-ip-view-all">View all companies &gt;</a>
                        </div>
                    </div>

                    <div className="hp-ip-panel hp-ip-right">
                        <div className="hp-ip-header">
                            <h3>Interview questions by role</h3>
                        </div>
                        <div className="hp-ip-role-list">
                            {(() => {
                                const roleQuestions = ["4.5K+", "3.8K+", "5.2K+", "2.9K+", "4.1K+", "3.5K+"];
                                return roles.slice(0, 6).map((role, idx) => (
                                    <div key={idx} className="hp-ip-role-item" onClick={() => navigate(`/job-filter?q=${encodeURIComponent(role.title)}`)}>
                                        <span className="hp-ip-role-name">{role.title}</span>
                                        <span className="hp-ip-role-count">({roleQuestions[idx % roleQuestions.length]} questions)</span>
                                    </div>
                                ));
                            })()}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <a href="/all-roles" className="hp-ip-view-all">View all roles &gt;</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Career Advice & Industry Insights Section */}
            <section className="industry-insights-section">
                {recentBlogs.length > 0 && (
                    <GridBlogSection
                        title="Career Advice & Industry Insights"
                        description="Stay ahead with expert career guidance, in-demand skills, and industry trends to accelerate your professional growth."
                        badgeText="CAREER RESOURCES & INSIGHTS"
                        posts={recentBlogs.map(blog => {
                            let cat = blog.category;
                            if (!cat) {
                                const t = (blog.blogTitle || "").toLowerCase();
                                if (t.includes("ai") || t.includes("learning") || t.includes("machine learning")) {
                                    cat = "AI & Learning";
                                } else if (t.includes("devops") || t.includes("cloud") || t.includes("docker")) {
                                    cat = "DevOps";
                                } else {
                                    cat = "Career Advice";
                                }
                            }
                            return {
                                id: blog.id,
                                title: blog.blogTitle,
                                overview: blog.overview,
                                category: cat,
                                imageUrl: getImageUrl(blog.blogImage),
                                createdDate: blog.createdDate,
                                readTime: blog.readingTime,
                                rawBlog: blog
                            };
                        })}
                        onPostClick={(blog) => navigate(generateBlogUrl(blog.rawBlog || blog))}
                    />
                )}

                {recentBlogs.length > 0 && (
                    <div className="hp-view-all-container">
                        <button className="hp-view-all-btn" onClick={() => navigate('/blogs')}>
                            <span>View all articles</span>
                            <RightOutlined className="hp-btn-arrow-more" />
                        </button>
                    </div>
                )}
            </section>




            {/* Success Stories Section */}
            <section className="hp-animated-testimonials">
                <div className="hp-testimonials-container-v2">
                    <div className="hp-testimonials-header-v2">
                        <h2>Success Stories</h2>
                        <p>Join thousands of successful professionals who have transformed their careers with Careerfast.</p>
                    </div>
                    <div className="hp-testimonials-grid-v2">
                        <TestimonialsColumn testimonials={testimonials.slice(0, 3)} duration={15} />
                        <TestimonialsColumn testimonials={testimonials.slice(3, 6)} duration={20} className="hp-hidden-sm" />
                        <TestimonialsColumn testimonials={testimonials.slice(6, 9)} duration={18} className="hp-hidden-md" />
                    </div>
                </div>
            </section>

            {/* Employer Banner Section */}
            <section className="hp-employer-section">
                <div className="hp-employer-banner">
                    <div className="hp-employer-visual">
                        <img
                            src={getImageUrl(hireFreshers)}
                            alt="Hire freshers and interns with Careerfast"
                            className="hp-employer-img"
                        />
                    </div>
                    <div className="hp-employer-content">
                        <div className="hp-employer-badge">
                            <ShoppingOutlined className="hp-employer-badge-icon" />
                            <span>Careerfast for Employers</span>
                        </div>
                        <h2 className="hp-employer-title">Looking to hire freshers and interns?</h2>
                        <p className="hp-employer-desc">
                            Access India&apos;s largest talent pool of 3.2 crore+ candidates with AI-powered candidate matching and smart screening filters to hire faster.
                        </p>
                        <div className="hp-employer-features">
                            <span className="hp-employer-feat">
                                <CheckCircleOutlined className="hp-employer-feat-icon" />
                                <span>3.2 Cr+ Verified Talent</span>
                            </span>
                            <span className="hp-employer-feat">
                                <CheckCircleOutlined className="hp-employer-feat-icon" />
                                <span>AI Candidate Matching</span>
                            </span>
                            <span className="hp-employer-feat">
                                <CheckCircleOutlined className="hp-employer-feat-icon" />
                                <span>Zero Setup Fee</span>
                            </span>
                        </div>
                        <div className="hp-employer-cta-wrap">
                            <button
                                className="hp-employer-btn"
                                type="button"
                                onClick={() => {
                                    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                                    const defaultHrLogin = isLocalhost ? "http://localhost:3001/login" : "http://recruit.careerfast.in/login";
                                    window.location.href = process.env.NEXT_PUBLIC_HR_PORTAL_URL ? `${process.env.NEXT_PUBLIC_HR_PORTAL_URL}/login` : defaultHrLogin;
                                }}
                            >
                                <span>Post now for free</span>
                                <RightOutlined className="hp-employer-btn-arrow" />
                            </button>
                            <span className="hp-employer-note">Free job posting • No credit card required</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Floating Quick Indication on HomePage when profile < 100% */}
            {candidateProfileStats.isCandidate && candidateProfileStats.completionPercentage !== null && candidateProfileStats.completionPercentage < 100 && (
                <div
                    className="hp-profile-floating-pill"
                    onClick={() => navigate("/candidate-profile/mainprofile")}
                    title="Click to complete your profile and get 3x more HR attention"
                >
                    <div className="hp-floating-donut">
                        <svg viewBox="0 0 36 36" className="hp-donut-svg">
                            <path
                                className="hp-donut-bg"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                className="hp-donut-fill"
                                strokeDasharray={`${candidateProfileStats.completionPercentage}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <span className="hp-donut-text">{candidateProfileStats.completionPercentage}%</span>
                    </div>
                    <div className="hp-floating-info">
                        <span className="hp-floating-title">Complete Profile</span>
                        <span className="hp-floating-subtitle">Get 3x HR Reach 🚀</span>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
