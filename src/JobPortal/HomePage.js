'use client';
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "@/routing-shim";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import { motion } from "framer-motion";
import GridBlogSection from "./GridBlogSection";

import {
    SearchOutlined,
    EnvironmentOutlined,
    HistoryOutlined,
    RightOutlined,
    ThunderboltFilled,
    ThunderboltOutlined,
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
    EditOutlined,
    SolutionOutlined,
    ClockCircleOutlined,
    CloseCircleFilled,
    FireFilled,
    BankOutlined,
    CompassOutlined,
} from "@ant-design/icons";
import { message, Select, Row, Col, Spin } from "antd";

import "../css/HomePage.css";
import { getJobCategoryData, getJobPosts, getHomePageStats, getTrendingSearches, getSearchSuggestions, getBlogs, getAllCourses, getTopCompanies } from "../ApiService/action";
import { getImageUrl, getPlaceholderSvg } from "../utils/getImageUrl";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import PopularRolesIllustration from "../images/popular_roles_illustration.png";
import company_logos1 from "../images/counter_box2.png";
import company_logos2 from "../images/verified.png";
import company_logos3 from "../images/applied.png";
import CommonLoader from "../Common/CommonLoader";
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


export default function HomePage() {
    const navigate = useNavigate();
    const [skills, setSkills] = useState("");
    const [location, setLocation] = useState("");
    const [experience, setExperience] = useState(null);
    const [categories, setCategories] = useState([]);
    const [fresherCategories, setFresherCategories] = useState([]);
    const [internshipCategories, setInternshipCategories] = useState([]);
    const [companies, setCompanies] = useState([]);
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
    const [fresherJobs, setFresherJobs] = useState([]);
    const [internshipJobs, setInternshipJobs] = useState([]);
    const [loadingFresher, setLoadingFresher] = useState(false);
    const [loadingInternships, setLoadingInternships] = useState(false);
    const [activeTab, setActiveTab] = useState("");
    const [activeInternshipTab, setActiveInternshipTab] = useState("");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalJobs: 0,
        totalRecruiters: 0,
        totalApplications: 0
    });
    const [trendingSearches, setTrendingSearches] = useState([]);
    const [recentBlogs, setRecentBlogs] = useState([]);
    const [coursesList, setCoursesList] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [activeCourseCategory, setActiveCourseCategory] = useState("All Programs");
    const initialFetchDone = useRef(false);
    const lastFetchedFresherTab = useRef("");
    const lastFetchedInternshipTab = useRef("");

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

    // Matching query highlighter for Naukri-like bold search terms
    const highlightMatch = (text, query) => {
        if (!query || !text) return text;
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) return text;
        const before = text.substring(0, index);
        const match = text.substring(index, index + query.length);
        const after = text.substring(index + query.length);
        return (
            <span className="hp-suggestion-text-inner">
                {before}
                <strong className="matched-text">{match}</strong>
                {after}
            </span>
        );
    };

    // Real-time suggestions debounced fetch for Skills / Roles / Companies
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                const res = await getSearchSuggestions({ q: skills, type: "all" });
                if (res?.data?.data) {
                    setSkillsSuggestions(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch suggestions", err);
            }
        }, 120);

        return () => clearTimeout(timer);
    }, [skills]);

    // Real-time suggestions debounced fetch for Locations
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                const res = await getSearchSuggestions({ q: location, type: "locations" });
                if (res?.data?.data?.locations) {
                    setLocationSuggestions(res.data.data.locations);
                }
            } catch (err) {
                console.error("Failed to fetch location suggestions", err);
            }
        }, 120);

        return () => clearTimeout(timer);
    }, [location]);

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

    const handleSelectSkillsSuggestion = (item) => {
        const label = typeof item === "string" ? item : item.label;
        setSkills(label);
        setShowSkillsDropdown(false);
        setSkillsActiveIndex(-1);
    };

    const handleSelectLocationSuggestion = (item) => {
        const label = typeof item === "string" ? item : item.label;
        setLocation(label);
        setShowLocationDropdown(false);
        setLocationActiveIndex(-1);
    };

    const flattenedSkillsSuggestions = [
        ...(skillsSuggestions.roles || []),
        ...(skillsSuggestions.skills || []),
        ...(skillsSuggestions.companies || []),
    ];

    const handleSkillsKeyDown = (e) => {
        if (!showSkillsDropdown) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                setShowSkillsDropdown(true);
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSkillsActiveIndex((prev) =>
                prev < flattenedSkillsSuggestions.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSkillsActiveIndex((prev) =>
                prev > 0 ? prev - 1 : flattenedSkillsSuggestions.length - 1
            );
        } else if (e.key === "Enter") {
            if (skillsActiveIndex >= 0 && flattenedSkillsSuggestions[skillsActiveIndex]) {
                e.preventDefault();
                handleSelectSkillsSuggestion(flattenedSkillsSuggestions[skillsActiveIndex]);
            } else {
                setShowSkillsDropdown(false);
                handleSearch();
            }
        } else if (e.key === "Escape") {
            setShowSkillsDropdown(false);
        }
    };

    const handleLocationKeyDown = (e) => {
        if (!showLocationDropdown) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                setShowLocationDropdown(true);
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setLocationActiveIndex((prev) =>
                prev < locationSuggestions.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setLocationActiveIndex((prev) =>
                prev > 0 ? prev - 1 : locationSuggestions.length - 1
            );
        } else if (e.key === "Enter") {
            if (locationActiveIndex >= 0 && locationSuggestions[locationActiveIndex]) {
                e.preventDefault();
                handleSelectLocationSuggestion(locationSuggestions[locationActiveIndex]);
            } else {
                setShowLocationDropdown(false);
                handleSearch();
            }
        } else if (e.key === "Escape") {
            setShowLocationDropdown(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

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
            // Step 1: Fetch stats, trending searches, blogs, courses, and categories
            const [
                statsRes,
                trendingRes,
                blogsRes,
                coursesRes,
                catRes,
                fresherCatRes,
                internshipCatRes,
                companiesRes
            ] = await Promise.allSettled([
                getHomePageStats(),
                getTrendingSearches(),
                getBlogs(),
                getAllCourses({ limit: 6 }),
                getJobCategoryData({ min_jobs: 4 }),
                getJobCategoryData({ job_nature: 'Job', experience_type: 'Fresher', min_jobs: 4 }),
                getJobCategoryData({ job_nature: 'Internship', min_jobs: 4 }),
                getTopCompanies({ limit: 12 })
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

            // Categories (All)
            const catData = catRes.status === 'fulfilled' ? (catRes.value?.data?.data || []) : [];
            const seenCats = new Set();
            const mappedCats = [];
            for (const c of catData) {
                const name = c.category_name?.trim();
                if (name && !seenCats.has(name)) {
                    seenCats.add(name);
                    mappedCats.push({ name, icon: getCategoryIcon(name) });
                }
            }
            setCategories(mappedCats.slice(0, 12));

            // Fresher Categories
            const fresherCatData = fresherCatRes.status === 'fulfilled' ? (fresherCatRes.value?.data?.data || []) : [];
            const seenFresher = new Set();
            const mappedFresherCats = [];
            for (const c of fresherCatData) {
                const name = c.category_name?.trim();
                if (name && !seenFresher.has(name)) {
                    seenFresher.add(name);
                    mappedFresherCats.push({ name, icon: getCategoryIcon(name) });
                }
            }
            setFresherCategories(mappedFresherCats);
            const firstFresherTab = mappedFresherCats[0]?.name || "";
            if (firstFresherTab) {
                setActiveTab(firstFresherTab);
                lastFetchedFresherTab.current = firstFresherTab;
            }

            // Internship Categories
            const internshipCatData = internshipCatRes.status === 'fulfilled' ? (internshipCatRes.value?.data?.data || []) : [];
            const seenInternship = new Set();
            const mappedInternshipCats = [];
            for (const c of internshipCatData) {
                const name = c.category_name?.trim();
                if (name && !seenInternship.has(name)) {
                    seenInternship.add(name);
                    mappedInternshipCats.push({ name, icon: getCategoryIcon(name) });
                }
            }
            setInternshipCategories(mappedInternshipCats);
            const firstInternshipTab = mappedInternshipCats[0]?.name || "";
            if (firstInternshipTab) {
                setActiveInternshipTab(firstInternshipTab);
                lastFetchedInternshipTab.current = firstInternshipTab;
            }

            // Step 2: Fetch initial jobs for the active tabs so when loader finishes, all content is ready
            const fresherParams = { limit: 12, experience_type: "Fresher" };
            if (firstFresherTab && firstFresherTab !== "Big brands") {
                fresherParams.job_categories = [firstFresherTab];
            }
            const internshipParams = { limit: 12, job_nature: "Internship" };
            if (firstInternshipTab && firstInternshipTab !== "Big brands") {
                internshipParams.job_categories = [firstInternshipTab];
            }

            const [fresherJobsRes, internshipJobsRes] = await Promise.allSettled([
                getJobPosts(fresherParams),
                getJobPosts(internshipParams)
            ]);

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
            // Cut off the loader only after all data has loaded
            setLoading(false);
        }
    };

    const getCategoryIcon = (name) => {
        const n = name.toLowerCase();
        if (n.includes("software") || n.includes("it")) return <CodeOutlined />;
        if (n.includes("marketing")) return <ShoppingOutlined />;
        if (n.includes("analytics") || n.includes("data")) return <LineChartOutlined />;
        if (n.includes("remote")) return <HomeOutlined />;
        if (n.includes("engineering")) return <LaptopOutlined />;
        if (n.includes("sales")) return <GlobalOutlined />;
        if (n.includes("management")) return <ThunderboltFilled />;
        return <BuildOutlined />;
    };

    const handleSearch = () => {
        if (!skills && !location && experience === null) {
            message.info("Please enter some search criteria");
            return;
        }

        let queryParams = [];
        if (skills) queryParams.push(`q=${encodeURIComponent(skills)}`);
        if (location) queryParams.push(`l=${encodeURIComponent(location)}`);
        if (experience !== null) queryParams.push(`experience=${experience}`);

        const searchUrl = `/job-filter?${queryParams.join("&")}`;
        navigate(searchUrl);
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

        return `/job-details/${jobNature}-${jobTitle}-${companyName}-${locationSlug}-${workplaceType}-${experienceType}-${experienceRequired}-${job.id}`;
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
            'full-stack-web-development': { duration: '8 Weeks', rating: '4.9', learners: '1,28,094', color: '#eef2ff', tagColor: '#5f2eea', bgGlow: 'rgba(95, 46, 234, 0.15)' },
            'data-science-machine-learning': { duration: '10 Weeks', rating: '4.9', learners: '94,520', color: '#fff7ed', tagColor: '#ea580c', bgGlow: 'rgba(234, 88, 12, 0.15)' },
            'digital-marketing-masterclass': { duration: '6 Weeks', rating: '4.8', learners: '78,410', color: '#f0fdf4', tagColor: '#16a34a', bgGlow: 'rgba(22, 163, 74, 0.15)' },
            'ui-ux-design-professional': { duration: '8 Weeks', rating: '4.8', learners: '65,230', color: '#fdf2f8', tagColor: '#db2777', bgGlow: 'rgba(219, 39, 119, 0.15)' },
            'product-management-101': { duration: '8 Weeks', rating: '4.8', learners: '42,150', color: '#f0f9ff', tagColor: '#0284c7', bgGlow: 'rgba(2, 132, 199, 0.15)' },
            'ai-for-business': { duration: '6 Weeks', rating: '4.9', learners: '53,890', color: '#faf5ff', tagColor: '#9333ea', bgGlow: 'rgba(147, 51, 234, 0.15)' },
            'blockchain-web3-development': { duration: '8 Weeks', rating: '4.7', learners: '29,430', color: '#f5f3ff', tagColor: '#7c3aed', bgGlow: 'rgba(124, 58, 237, 0.15)' },
            'human-resource-management': { duration: '6 Weeks', rating: '4.6', learners: '34,210', color: '#fff1f2', tagColor: '#e11d48', bgGlow: 'rgba(225, 29, 72, 0.15)' },
            'business-analytics': { duration: '8 Weeks', rating: '4.8', learners: '48,760', color: '#f0fdfa', tagColor: '#0d9488', bgGlow: 'rgba(13, 148, 136, 0.15)' },
            'advanced-excel': { duration: '4 Weeks', rating: '4.7', learners: '1,54,320', color: '#f0fdf4', tagColor: '#15803d', bgGlow: 'rgba(21, 128, 61, 0.15)' },
        };
        return statsMap[slug] || { duration: '8 Weeks', rating: '4.8', learners: '15,000+', color: '#f8f9ff', tagColor: '#4f46e5', bgGlow: 'rgba(79, 70, 229, 0.15)' };
    };


    const premiumServices = [
        {
            title: "Resume Display",
            desc: "Increase your profile visibility to recruiters by 3x and get noticed by top companies.",
            icon: <FileSearchOutlined />
        },
        {
            title: "Priority Applicant",
            desc: "Get your application noticed first by hiring managers and stay ahead of the curve.",
            icon: <StarOutlined />
        },
        {
            title: "Resume Writing",
            desc: "Professional resume written by industry experts to highlight your strengths effectively.",
            icon: <EditOutlined />
        }
    ];

    const cities = [
        { name: "Bangalore", img: BangaloreCity },
        { name: "Mumbai", img: MumbaiCity },
        { name: "Delhi", img: DelhiCity },
        { name: "Hyderabad", img: HyderabadCity },
        { name: "Chennai", img: ChennaiCity },
        { name: "Remote", img: RemoteCity }
    ];

    if (loading) {
        return <CommonLoader text="Loading CareerFast" />;
    }

    return (
        <div className="hp-container">
            <Header />

            {/* Hero Section */}
            <section className="hp-hero">
                <div className="hp-hero-bg-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                </div>


                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ position: 'relative', zIndex: 2 }}
                >
                    <h1 className="hp-hero-title">Find your dream job now</h1>
                    <p className="hp-hero-subtitle">5 lakh+ jobs for you to explore</p>

                    <div className="hp-search-bar-container">
                        {/* 1. Skills / Designations / Companies Segment */}
                        <div className="hp-search-segment">
                            <SearchOutlined className="hp-search-icon" />
                            <div className="hp-input-wrapper">
                                <input
                                    ref={skillsInputRef}
                                    type="text"
                                    placeholder="Skills / designations / companies"
                                    className="hp-search-input"
                                    value={skills}
                                    onChange={(e) => {
                                        setSkills(e.target.value);
                                        setShowSkillsDropdown(true);
                                        setSkillsActiveIndex(-1);
                                    }}
                                    onFocus={() => setShowSkillsDropdown(true)}
                                    onKeyDown={handleSkillsKeyDown}
                                    autoComplete="off"
                                />
                                {skills && (
                                    <button
                                        type="button"
                                        className="hp-clear-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSkills("");
                                            skillsInputRef.current?.focus();
                                        }}
                                        title="Clear search"
                                    >
                                        <CloseCircleFilled />
                                    </button>
                                )}
                            </div>

                            {/* Naukri-style Suggestion Dropdown */}
                            {showSkillsDropdown && (
                                <div className="hp-suggestions-dropdown" ref={skillsDropdownRef}>
                                    {!skills.trim() ? (
                                        <>
                                            <div className="hp-suggestion-header hp-suggestion-header-trending">
                                                <FireFilled style={{ color: "#ea580c" }} /> POPULAR SEARCHES
                                            </div>
                                            {(skillsSuggestions.roles || []).slice(0, 6).map((role, idx) => {
                                                const isHighlighted = skillsActiveIndex === idx;
                                                return (
                                                    <div
                                                        key={`pop-role-${idx}`}
                                                        className={`hp-suggestion-item ${isHighlighted ? "active" : ""}`}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            handleSelectSkillsSuggestion(role);
                                                        }}
                                                    >
                                                        <div className="hp-suggestion-left">
                                                            <ThunderboltOutlined className="hp-suggestion-icon" />
                                                            <span className="hp-suggestion-text">{role.label}</span>
                                                        </div>
                                                        <span className="hp-suggestion-badge hp-suggestion-badge-role">Trending</span>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    ) : (
                                        <>
                                            {/* Designations / Job Roles */}
                                            {skillsSuggestions.roles && skillsSuggestions.roles.length > 0 && (
                                                <div className="hp-suggestion-group">
                                                    <div className="hp-suggestion-header">
                                                        <SolutionOutlined /> DESIGNATIONS & ROLES
                                                    </div>
                                                    {skillsSuggestions.roles.map((item, idx) => {
                                                        const flatIdx = idx;
                                                        const isHighlighted = skillsActiveIndex === flatIdx;
                                                        return (
                                                            <div
                                                                key={`role-${idx}`}
                                                                className={`hp-suggestion-item ${isHighlighted ? "active" : ""}`}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    handleSelectSkillsSuggestion(item);
                                                                }}
                                                            >
                                                                <div className="hp-suggestion-left">
                                                                    <SolutionOutlined className="hp-suggestion-icon" />
                                                                    <span className="hp-suggestion-text">
                                                                        {highlightMatch(item.label, skills)}
                                                                    </span>
                                                                </div>
                                                                <span className="hp-suggestion-badge hp-suggestion-badge-role">
                                                                    {item.count ? `${item.count} Jobs` : "Designation"}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Skills */}
                                            {skillsSuggestions.skills && skillsSuggestions.skills.length > 0 && (
                                                <div className="hp-suggestion-group">
                                                    {skillsSuggestions.roles && skillsSuggestions.roles.length > 0 && (
                                                        <div className="hp-suggestion-divider"></div>
                                                    )}
                                                    <div className="hp-suggestion-header">
                                                        <CodeOutlined /> SKILLS & TECHNOLOGIES
                                                    </div>
                                                    {skillsSuggestions.skills.map((item, idx) => {
                                                        const flatIdx = (skillsSuggestions.roles?.length || 0) + idx;
                                                        const isHighlighted = skillsActiveIndex === flatIdx;
                                                        return (
                                                            <div
                                                                key={`skill-${idx}`}
                                                                className={`hp-suggestion-item ${isHighlighted ? "active" : ""}`}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    handleSelectSkillsSuggestion(item);
                                                                }}
                                                            >
                                                                <div className="hp-suggestion-left">
                                                                    <CodeOutlined className="hp-suggestion-icon" />
                                                                    <span className="hp-suggestion-text">
                                                                        {highlightMatch(item.label, skills)}
                                                                    </span>
                                                                </div>
                                                                <span className="hp-suggestion-badge hp-suggestion-badge-skill">
                                                                    Skill
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Companies */}
                                            {skillsSuggestions.companies && skillsSuggestions.companies.length > 0 && (
                                                <div className="hp-suggestion-group">
                                                    {((skillsSuggestions.roles?.length || 0) > 0 || (skillsSuggestions.skills?.length || 0) > 0) && (
                                                        <div className="hp-suggestion-divider"></div>
                                                    )}
                                                    <div className="hp-suggestion-header">
                                                        <BankOutlined /> COMPANIES
                                                    </div>
                                                    {skillsSuggestions.companies.map((item, idx) => {
                                                        const flatIdx = (skillsSuggestions.roles?.length || 0) + (skillsSuggestions.skills?.length || 0) + idx;
                                                        const isHighlighted = skillsActiveIndex === flatIdx;
                                                        return (
                                                            <div
                                                                key={`comp-${idx}`}
                                                                className={`hp-suggestion-item ${isHighlighted ? "active" : ""}`}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    handleSelectSkillsSuggestion(item);
                                                                }}
                                                            >
                                                                <div className="hp-suggestion-left">
                                                                    <BankOutlined className="hp-suggestion-icon" />
                                                                    <span className="hp-suggestion-text">
                                                                        {highlightMatch(item.label, skills)}
                                                                    </span>
                                                                </div>
                                                                <span className="hp-suggestion-badge hp-suggestion-badge-company">
                                                                    {item.count ? `${item.count} Openings` : "Company"}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {(!skillsSuggestions.roles || skillsSuggestions.roles.length === 0) &&
                                                (!skillsSuggestions.skills || skillsSuggestions.skills.length === 0) &&
                                                (!skillsSuggestions.companies || skillsSuggestions.companies.length === 0) && (
                                                    <div className="hp-suggestion-empty">
                                                        Press Enter to search for "<strong>{skills}</strong>"
                                                    </div>
                                                )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 2. Select Experience Segment */}
                        <div className="hp-search-segment">
                            <HistoryOutlined className="hp-search-icon" />
                            <Select
                                placeholder="Select experience"
                                className="hp-search-input-select"
                                variant="borderless"
                                style={{ width: '100%' }}
                                value={experience}
                                onChange={(val) => setExperience(val)}
                                allowClear
                            >
                                <Option value={0}>Fresher (less than 1 year)</Option>
                                <Option value={1}>1 Year</Option>
                                <Option value={2}>2 Years</Option>
                                <Option value={3}>3 Years</Option>
                                <Option value={4}>4 Years</Option>
                                <Option value={5}>5+ Years</Option>
                            </Select>
                        </div>

                        {/* 3. Location Segment */}
                        <div className="hp-search-segment">
                            <EnvironmentOutlined className="hp-search-icon" />
                            <div className="hp-input-wrapper">
                                <input
                                    ref={locationInputRef}
                                    type="text"
                                    placeholder="Enter location"
                                    className="hp-search-input"
                                    value={location}
                                    onChange={(e) => {
                                        setLocation(e.target.value);
                                        setShowLocationDropdown(true);
                                        setLocationActiveIndex(-1);
                                    }}
                                    onFocus={() => setShowLocationDropdown(true)}
                                    onKeyDown={handleLocationKeyDown}
                                    autoComplete="off"
                                />
                                {location && (
                                    <button
                                        type="button"
                                        className="hp-clear-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLocation("");
                                            locationInputRef.current?.focus();
                                        }}
                                        title="Clear location"
                                    >
                                        <CloseCircleFilled />
                                    </button>
                                )}
                            </div>

                            {/* Location Suggestions Dropdown */}
                            {showLocationDropdown && (
                                <div className="hp-suggestions-dropdown hp-suggestions-dropdown-location" ref={locationDropdownRef}>
                                    <div className="hp-suggestion-header">
                                        <CompassOutlined /> {location.trim() ? "MATCHING LOCATIONS" : "POPULAR CITIES"}
                                    </div>
                                    {locationSuggestions && locationSuggestions.length > 0 ? (
                                        locationSuggestions.map((item, idx) => {
                                            const isHighlighted = locationActiveIndex === idx;
                                            return (
                                                <div
                                                    key={`loc-${idx}`}
                                                    className={`hp-suggestion-item ${isHighlighted ? "active" : ""}`}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        handleSelectLocationSuggestion(item);
                                                    }}
                                                >
                                                    <div className="hp-suggestion-left">
                                                        <EnvironmentOutlined className="hp-suggestion-icon" />
                                                        <span className="hp-suggestion-text">
                                                            {highlightMatch(item.label, location)}
                                                        </span>
                                                    </div>
                                                    <span className="hp-suggestion-badge hp-suggestion-badge-location">
                                                        Location
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="hp-suggestion-empty">
                                            Press Enter to search for "<strong>{location}</strong>"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button className="hp-search-btn" onClick={handleSearch}>Search</button>
                    </div>

                    <div className="hp-hero-quick-links">
                        {trendingSearches.length > 0 ? (
                            trendingSearches.map((search, idx) => (
                                <div key={idx} className="hp-quick-chip" onClick={() => {
                                    if (search.label.startsWith("jobs,")) {
                                        navigate(`/job-filter?l=${encodeURIComponent(search.label.split(",")[1].trim())}`);
                                    } else {
                                        navigate(`/job-filter?c=${encodeURIComponent(search.label.split(",")[1].trim())}&job_nature=Internship`);
                                    }
                                }}>
                                    <HistoryOutlined /> {search.label} <span className="chip-count">{search.count}</span> {search.isNew && <span className="chip-new">new</span>}
                                </div>
                            ))
                        ) : (
                            <>
                                <div className="hp-quick-chip">
                                    <HistoryOutlined /> jobs, chennai <span className="chip-count">38879</span> <span className="chip-new">new</span>
                                </div>
                                <div className="hp-quick-chip">
                                    <HistoryOutlined /> internship,automotiv... <span className="chip-count">11</span> <span className="chip-new">new</span>
                                </div>
                                <div className="hp-quick-chip">
                                    <HistoryOutlined /> internship,architectu... <span className="chip-count">30</span> <span className="chip-new">new</span>
                                </div>
                            </>
                        )}
                    </div>
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
                            <div
                                key={idx}
                                className="hp-category-card"
                                onClick={() => navigate(`/job-filter?c=${encodeURIComponent(cat.name)}`)}
                            >
                                <div className="hp-category-left">
                                    <div className="hp-category-icon-wrapper">
                                        {cat.icon}
                                    </div>
                                    <span className="hp-category-name">{cat.name}</span>
                                </div>
                                <RightOutlined className="hp-category-arrow" />
                            </div>
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
                    <div className="hp-tabs-container">
                        {fresherCategories.slice(0, 5).map((c, idx) => (
                            <div
                                key={`${c.name}-${idx}`}
                                className={`hp-tab-chip ${activeTab === c.name ? "active" : ""}`}
                                onClick={() => setActiveTab(c.name)}
                            >
                                {c.name}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hp-fresher-slider">
                    {fresherJobs.length > 0 ? (
                        <Slider {...sliderSettings}>
                            {fresherJobs.map((job) => (
                                <div key={job.id}>
                                    <div onClick={(e) => {
                                        e.preventDefault();
                                        window.open(generateJobDetailsUrl(job), "_blank");
                                    }} className="hp-fresher-card">
                                        <div className="hp-company-violet-box">
                                            <div className="hp-company-logo-wrapper">
                                                <img
                                                    src={getImageUrl(job.company_logo)}
                                                    alt={job.company_name}
                                                    onError={(e) => { e.target.onerror = null; e.target.src = getPlaceholderSvg("Logo", 100, 100); }}
                                                />
                                            </div>

                                            <div className="hp-card-tag" style={{ color: 'green' }}>
                                                <ThunderboltFilled style={{ fontSize: 10 }} />
                                                Actively hiring
                                            </div>
                                        </div>
                                        <h4 className="hp-card-title">{job.job_title}</h4>
                                        <div className="hp-card-company">
                                            <div className="hp-company-text">
                                                <span className="hp-company-name-text">{job.company_name}</span>
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
                                                <span>{Array.isArray(job.work_location) ? job.work_location[0] : job.work_location}</span>
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
                                                    // Allow standard browser behavior for target="_blank"
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
                    <div className="hp-tabs-container">
                        {internshipCategories.slice(0, 5).map((c, idx) => (
                            <div
                                key={`${c.name}-${idx}`}
                                className={`hp-tab-chip ${activeInternshipTab === c.name ? "active" : ""}`}
                                onClick={() => setActiveInternshipTab(c.name)}
                            >
                                {c.name}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hp-fresher-slider">
                    {internshipJobs.length > 0 ? (
                        <Slider {...sliderSettings}>
                            {internshipJobs.map((job) => (
                                <div key={job.id}>
                                    <div onClick={(e) => {
                                        e.preventDefault();
                                        window.open(generateJobDetailsUrl(job), "_blank");
                                    }} className="hp-fresher-card">
                                        <div className="hp-company-violet-box">
                                            <div className="hp-company-logo-wrapper">
                                                <img
                                                    src={getImageUrl(job.company_logo)}
                                                    alt={job.company_name}
                                                    onError={(e) => { e.target.onerror = null; e.target.src = getPlaceholderSvg("Logo", 100, 100); }}
                                                />
                                            </div>
                                            <div className="hp-card-tag" style={{ color: 'green' }}>
                                                <ThunderboltFilled style={{ fontSize: 10 }} />
                                                Actively hiring
                                            </div>
                                        </div>

                                        <h4 className="hp-card-title">{job.job_title}</h4>
                                        <div className="hp-card-company">
                                            <div className="hp-company-text">
                                                <span className="hp-company-name-text">{job.company_name}</span>
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
                                                <span>{Array.isArray(job.work_location) ? job.work_location[0] : job.work_location}</span>
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
                                                    // Allow standard browser behavior for target="_blank"
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
                    <h2 className="hp-section-title">Top companies hiring now</h2>
                    <p className="hp-section-subtitle">Discover premium opportunities with industry leaders</p>
                    <div className="hp-company-grid">
                        {companies.slice(0, 5).map((company, idx) => (
                            <motion.div
                                key={idx}
                                className="hp-company-card"
                                whileHover={{ scale: 1.02 }}
                                onClick={() => navigate(`/job-filter?co=${encodeURIComponent(company.name)}`)}
                            >
                                <div className="hp-company-logo-wrapper">
                                    <img
                                        src={getImageUrl(company.logo, company.name)}
                                        alt={company.name}
                                        onError={(e) => { e.target.onerror = null; e.target.src = getPlaceholderSvg(company.name, 150, 150); }}
                                    />
                                </div>
                                <h4 className="hp-company-name">{company.name}</h4>
                                <div className="hp-company-rating">
                                    <StarOutlined className="star" />
                                    <span>{company.rating} | {company.active_jobs ? `${company.active_jobs} ${company.active_jobs === 1 ? 'Job' : 'Jobs'}` : company.reviews}</span>
                                </div>
                                <p className="hp-company-type">{company.type}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Jobs by City Section */}
            <section className="hp-cities-section">
                <div className="hp-section-container">
                    <div className="hp-section-header-center">
                        <h2>Explore opportunities in top cities</h2>
                        <p>Find your next role in your favorite location</p>
                    </div>
                    <div className="hp-cities-grid">
                        {cities.map((city, idx) => (
                            <motion.div
                                key={idx}
                                className="hp-city-item"
                                whileHover={{ y: -10 }}
                                onClick={() => navigate(`/job-filter?l=${encodeURIComponent(city.name)}`)}
                            >
                                <div className="hp-city-image">
                                    <img src={getImageUrl(city.img)} alt={city.name} />
                                </div>
                                <span>{city.name}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Popular Roles Section */}
            <section className="hp-popular-roles-modern">
                <div className="hp-prm-container">
                    <div className="hp-prm-left">
                        <div className="hp-prm-illustration-container">
                            <img
                                src={getImageUrl(PopularRolesIllustration)}
                                alt="Popular Roles"
                                className="hp-prm-illustration"
                            />
                        </div>
                        <div className="hp-prm-left-content">
                            <h2>Discover jobs across<br />
                                popular roles</h2>
                            <p>Take the next step in your career</p>
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
                                                                <h4>{role.title}</h4>
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
                        <span className="hp-premium-badge">RECOMMENDED PROGRAMS</span>
                        <h2>Top-rated certifications to upskill</h2>
                        <p>Boost your career with industry-recognized courses led by domain experts</p>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="hp-cert-tabs">
                        {(() => {
                            const dynamicCats = Array.from(new Set(coursesList.map(c => c.category?.trim()).filter(Boolean)));
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
                            const filteredCourses = coursesList
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
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05, duration: 0.5 }}
                                        viewport={{ once: true }}
                                        onClick={() => navigate(`/courses/${course.slug}`)}
                                        style={{ "--card-glow": stats.bgGlow }}
                                    >
                                        <div className="hp-cert-image-wrapper-v2">
                                            <img
                                                src={course.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"}
                                                alt={course.title}
                                                className="hp-cert-img"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3";
                                                }}
                                            />
                                            <span className="hp-cert-category-badge" style={{ backgroundColor: stats.tagColor }}>
                                                {course.category || "Certification"}
                                            </span>
                                        </div>

                                        <div className="hp-cert-body-v2">
                                            <div className="hp-cert-rating-row">
                                                <div className="hp-cert-rating-pill">
                                                    <StarOutlined style={{ color: "#eab308", marginRight: 4 }} />
                                                    <span>{stats.rating}</span>
                                                </div>
                                                <span className="hp-cert-learners">({stats.learners} learners)</span>
                                            </div>

                                            <h3 className="hp-cert-title-v2">{course.title}</h3>
                                            <p className="hp-cert-desc-v2">{course.description}</p>

                                            <div className="hp-cert-stats-v2">
                                                <div className="hp-cert-stat-item">
                                                    <ClockCircleOutlined style={{ color: "#64748b", marginRight: 6 }} />
                                                    <span>{stats.duration}</span>
                                                </div>
                                                <div className="hp-cert-stat-item">
                                                    <ThunderboltFilled style={{ color: "#16a34a", marginRight: 6 }} />
                                                    <span>Placement Support</span>
                                                </div>
                                            </div>

                                            <div className="hp-cert-price-row">
                                                <div className="hp-cert-prices">
                                                    <span className="hp-cert-price-disc">₹{discPrice}</span>
                                                    <span className="hp-cert-price-orig">₹{origPrice}</span>
                                                </div>
                                                <span className="hp-cert-discount-tag" style={{ color: stats.tagColor, backgroundColor: stats.color }}>
                                                    SAVE 50%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="hp-cert-footer-v2">
                                            <button className="hp-cert-btn-v2" style={{ borderColor: stats.tagColor, color: stats.tagColor }}>
                                                Explore Program <RightOutlined className="hp-btn-arrow" />
                                            </button>
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
                            Explore more courses <RightOutlined className="hp-btn-arrow-more" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Premium Services Section */}
            <section className="hp-premium-section">
                <div className="hp-section-container">
                    <div className="hp-section-header-center">
                        <h2>Accelerate your job search with Premium Services</h2>
                        <p>Services designed to help you get hired faster</p>
                    </div>
                    <div className="hp-premium-grid">
                        {premiumServices.map((service, idx) => (
                            <motion.div
                                key={idx}
                                className="hp-premium-card"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <div className="hp-premium-icon">{service.icon}</div>
                                <div className="hp-premium-info">
                                    <h3>{service.title}</h3>
                                    <p>{service.desc}</p>
                                </div>
                                <button className="hp-premium-btn">
                                    View Details <RightOutlined />
                                </button>
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
                            {roles.slice(0, 6).map((role, idx) => (
                                <div key={idx} className="hp-ip-role-item" onClick={() => navigate(`/job-filter?q=${encodeURIComponent(role.title)}`)}>
                                    <span className="hp-ip-role-name">{role.title}</span>
                                    <span className="hp-ip-role-count">({Math.floor(Math.random() * 8 + 1)}K+ questions)</span>
                                </div>
                            ))}
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
                        description="Stay ahead with the latest trends, career tips, and industry expertise to accelerate your professional growth."
                        backgroundLabel="BLOGS"
                        backgroundPosition="right"
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
                            View All Articles <RightOutlined />
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
                    <div className="hp-employer-left">
                        <img src={getImageUrl(hireFreshers)} alt="Jobs Counter" />
                    </div>
                    <div className="hp-employer-right">
                        <div className="hp-employer-tag-container">
                            <span className="hp-employer-tag">
                                <ShoppingOutlined className="briefcase-icon" /> Careerfast for Employers
                            </span>
                        </div>
                        <h2>Looking to hire freshers and interns?</h2>
                        <p>Access India's largest talent pool of 3.2 crore+ candidates with <span className="highlight-orange">AI-powered tools</span> and smart filters to hire faster.</p>
                        <button className="hp-employer-btn" onClick={() => {
                            const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                            const defaultHrLogin = isLocalhost ? "http://localhost:3001/login" : "http://recruit.careerfast.in/login";
                            window.location.href = process.env.NEXT_PUBLIC_HR_PORTAL_URL ? `${process.env.NEXT_PUBLIC_HR_PORTAL_URL}/login` : defaultHrLogin;
                        }}>
                            Post now for free <RightOutlined className="arrow-icon" />
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
