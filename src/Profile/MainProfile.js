import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Progress,
  Card,
  Avatar,
  Button,
  Space,
  Divider,
  Tag,
  Tooltip,
  Drawer,
  Upload,
  Typography,
  Form,
  Row,
  Col,
  message,
  Checkbox,
  Popconfirm,
  Empty,
  Skeleton,
  Dropdown,
  Modal,
  Alert,
} from "antd";
import {
  Check,
  Clock,
  Briefcase,
  FileText,
  Award,
  MapPin,
  Mail,
  Calendar,
  Sparkles,
  Share2,
  Download,
  Eye,
  RefreshCw,
  Code2,
  GraduationCap,
  FolderGit2,
  Globe,
  ExternalLink,
  ChevronRight,
  Flame,
  Trophy,
  CheckCircle2,
  Building2,
  User,
  Plus,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  TrendingUp,
  UploadCloud,
  Phone,
  Wallet,
  Trash2,
  X,
  Camera,
  MoreHorizontal
} from "lucide-react";
import {
  EditOutlined,
  CheckCircleFilled,
  PlusOutlined,
  UploadOutlined,
  CalendarOutlined,
  BgColorsOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { IoIosMale } from "react-icons/io";
import { IoFemaleOutline } from "react-icons/io5";
import { LuGraduationCap } from "react-icons/lu";
import { GiOfficeChair } from "react-icons/gi";
import { PiStudent } from "react-icons/pi";
import { GiNewShoot } from "react-icons/gi";
import { FiEdit } from "react-icons/fi";
import { FaUserPen } from "react-icons/fa6";

import "../css/Profile.css";
import "../css/ProfileDetailsPage.css";
import "../css/ModernCandidateProfile.css";
import { FaFacebookF, FaTwitter, FaGithub } from "react-icons/fa";
import { FiBriefcase, FiCalendar, FiPlusCircle, FiFolder } from "react-icons/fi";
import { FaInstagram } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";
import { FaBehance } from "react-icons/fa";
import { FaLinkedinIn } from "react-icons/fa";
import { FaDribbble } from "react-icons/fa";
import { PiGenderTransgender } from "react-icons/pi";
import { PiGenderIntersex } from "react-icons/pi";
import { PiGenderNonbinary } from "react-icons/pi";
import { MdNotInterested } from "react-icons/md";
import { HiMiniXMark } from "react-icons/hi2";
import { MdEdit } from "react-icons/md";
import { IoLocationSharp } from "react-icons/io5";

import { LiaSchoolSolid } from "react-icons/lia";
import { MdFileDownloadDone } from "react-icons/md";

import "react-calendar-heatmap/dist/styles.css";
import { motion } from "framer-motion";
import CommonInputField from "../Common/CommonInputField";
import CommonSelectField from "../Common/CommonSelectField";
import {
  MdSchool,
  MdOutlineSchool,
  MdMenuBook,
  MdStarOutline,
  MdLocationCity,
  MdDateRange,
  MdEventAvailable,
  MdCategory,
  MdPercent,
  MdOutlineCalculate,
  MdConfirmationNumber,
  MdSwapHoriz,
  MdOutlineWorkHistory,
} from "react-icons/md";
import CommonTextArea from "../Common/CommonTextArea";
import {
  descriptionValidator,
  emailValidator,
  genderValidator,
  nameValidator,
  phoneValidation,
  selectValidator,
  userTypeValidator,
} from "../Common/Validation";
import CommonDatePicker from "../Common/CommonDatePicker";
import Header from "../Header/Header";
import {
  dailyStreak,
  deleteEducation,
  deleteExperience,
  deleteProject,
  getColleges,
  getCourses,
  getCourseType,
  getDailyStreak,
  getGenderData,
  getQualification,
  getSpecialization,
  getUserProfile,
  getUserTypeData,
  insertEducation,
  insertExperience,
  insertProjects,
  updateAbout,
  updateBasicDetails,
  updateBanner,
  updateEducation,
  updateExperience,
  updateProfileImage,
  updateProject,
  updateResume,
  updateSkills,
  updateSocialLinks,
} from "../ApiService/action";
import { useNavigate } from "@/routing-shim";

const { Title, Text } = Typography;

const { Content } = Layout;
const { Meta } = Card;

const items = [
  { key: "basic", label: "Personal Details" },
  { key: "preferences", label: "Career & Availability" },
  { key: "resume", label: "Resume" },
  { key: "about", label: "Professional Summary" },
  { key: "skills", label: "Key Skills" },
  { key: "experience", label: "Work Experience" },
  { key: "education", label: "Education" },
  { key: "projects", label: "Projects" },
  { key: "certifications", label: "Certifications" },
  { key: "accomplishments", label: "Accomplishments" },
  { key: "languages", label: "Languages" },
  { key: "additional", label: "Additional Info" },
  { key: "sociallinks", label: "Social Links" },
];

const suggestions = [
  "Deep Learning",
  "Tone of Voice",
  "CRM Proficiency",
  "E-Discovery",
  "Embedded Programming",
  "GDPR Compliance",
  "Medical Malpractice",
  "Remote Access",
  "Education Law",
  "Substance Designer",
];

const yearOptions = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => {
  const year = (1990 + i).toString();
  return { label: year, value: year };
});

const workingYearOptions = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => {
  const workingYear = (1990 + i).toString();
  return { label: workingYear, value: workingYear };
});

const FresherYearOptions = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => {
  const FreshYear = (1990 + i).toString();
  return { label: FreshYear, value: FreshYear };
});

const startYearOptions = yearOptions;
const endYearOptions = yearOptions;

const fresherStartYearOptions = FresherYearOptions;
const fresherEndYearOptions = FresherYearOptions;

const workingStartDateOptions = workingYearOptions;
const workingEndDateOptions = workingYearOptions;

export default function MainProfile() {
  const [activeTab, setActiveTab] = useState("basic");
  const [open, setOpen] = useState(false);
  const showDrawer = () => setOpen(true);
  const [aboutText, setAboutText] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState("");
  const [activeButton, setActiveButton] = useState(null);
  const [genderActiveButton, setGenderActiveButton] = useState(null);
  const [userTypeactiveButton, setUserTypeActiveButton] = useState(null);
  const defaultAvatar =
    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  const [profileImage, setProfileImage] = useState(null);
  // Dynamic profile states
  const [dob, setDob] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("Single");
  const [noticePeriod, setNoticePeriod] = useState("1 Month");
  const [expectedSalary, setExpectedSalary] = useState("₹4,00,000");
  const [currentSalary, setCurrentSalary] = useState("");
  const [availableFrom, setAvailableFrom] = useState("01 Nov 2024");
  const [preferredRoles, setPreferredRoles] = useState("Frontend Developer, Fullstack Developer");
  const [preferredJobType, setPreferredJobType] = useState("Full Time");
  const [preferredLocations, setPreferredLocations] = useState("Chennai, Bangalore, Mumbai");
  const [willingToRelocate, setWillingToRelocate] = useState("Yes");
  const [certifications, setCertifications] = useState([]);
  const [accomplishments, setAccomplishments] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState({
    strengths: [],
    interests: [],
    about_me: "",
  });
  const [languages, setLanguages] = useState([]);

  // Helper form states for new items
  const [newCertTitle, setNewCertTitle] = useState("");
  const [newCertIssuer, setNewCertIssuer] = useState("");
  const [newCertYear, setNewCertYear] = useState("");
  const [newCertUrl, setNewCertUrl] = useState("");
  const [newAccTitle, setNewAccTitle] = useState("");
  const [newAccIcon, setNewAccIcon] = useState("🏆");
  const [newLangName, setNewLangName] = useState("");
  const [newLangProf, setNewLangProf] = useState("Professional");
  const [newStrength, setNewStrength] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [editingEduId, setEditingEduId] = useState(null);
  const [editingProjId, setEditingProjId] = useState(null);

  //
  const [form] = Form.useForm();
  const [fname, setFname] = useState("");
  const [fnameError, setFnameError] = useState("");
  const [lname, setLname] = useState("");
  const [lnameError, setLnameError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [gender, setGender] = useState("");
  const [genderOptions, setGenderOptions] = useState([]);
  const [genderError, setGenderError] = useState("");
  const [userType, setUserType] = useState("");
  const [userTypeName, setUserTypeName] = useState([]);
  const [userTypeError, setUserTypeError] = useState("");
  const [course, setCourse] = useState(null);
  const [courseOptions, setCourseOptions] = useState([]);
  const [courseError, setCourseError] = useState("");
  const [location, setLocation] = useState("");
  const [locationError, setLocationError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startDateError, setStartDateError] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endDateError, setEndDateError] = useState("");
  const [fresherCourse, setFresherCourse] = useState("");
  const [fresherCourseError, setFresherCourseError] = useState("");
  const [fresherCourseOptions, setFresherCourseOptions] = useState([]);
  const [fresherStartDate, setFresherStartDate] = useState("");
  const [fresherStartDateError, setFresherStartDateError] = useState("");
  const [fresherEndtDate, setFresherEndDate] = useState("");
  const [fresherEndDateError, setFresherEndDateError] = useState("");
  const [loginUserId, setLoginUserId] = useState(null);
  const [roleId, setRoleId] = useState(null);
  const [organizationName, setOrganisationName] = useState("");
  const [organizationNameType, setOrganizationType] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [createdAt, setCreatedAt] = useState("");

  //
  const [showEducationForm, setShowEducationForm] = useState(true);
  const [qualificaton, setQualification] = useState("");
  const [qualificationOptions, setQualificationOptions] = useState([]);
  const [qualificatonError, setQualificationError] = useState("");
  const [educationCourse, setEducationCourse] = useState("");
  const [educationCourseOptions, setEducationCourseOptions] = useState([]);
  const [educationCourseError, setEducationCourseError] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [specializationOptions, setSpecializationOptions] = useState([]);
  const [specializationError, setSpecializationError] = useState("");
  const [educationCollege, setEducationCollege] = useState("");
  const [collageOptions, setCollageOptions] = useState([]);
  const [collageError, setCollageError] = useState("");
  const [courseType, setCourseType] = useState("");
  const [courseTypeOptions, setCourseTypeOptions] = useState([]);
  const [courseTypeError, setCourseTypeError] = useState("");
  const [percentage, setPercentage] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [lateral, setLateral] = useState("No");
  const [educationStartDate, setEducationStartDate] = useState("");
  const [educationStartDateError, setEducationStartDateError] = useState("");
  const [educationEndDate, setEducationEndDate] = useState("");
  const [educationEndDateError, setEducationEndDateError] = useState("");
  const [aboutTextNew, setAboutTextNew] = useState("");
  const [aboutTextError, setAboutTextError] = useState("");
  //
  const [designationError, setDesignationError] = useState("");
  const [employmentTypeError, setEmploymentTypeError] = useState("");
  const [workExpStartDateError, setWorkExpStartDateError] = useState("");
  const [workExpEndDateError, setWorkExpEndDateError] = useState("");
  const [workExpLocationError, setWorkExpLocationError] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  // work exp
  const [selectExperienceType, setSelectExperienceType] = useState("");
  const [selectExperienceTypeError, setSelectExperienceTypeError] =
    useState("");
  const [experienceData, setExperienceData] = useState(null);
  const [showWorkExpForm, setShowWorkExpForm] = useState(true);
  const [experienceType, setExperienceType] = useState(null);
  const [totalYearsExperience, setTotalYearsExperience] = useState("");
  const [totalYearsExperienceError, setTotalYearsExperienceError] =
    useState("");
  const [totalMonthsExperience, setTotalMonthsExperience] = useState("");
  const [totalMonthsExperienceError, setTotalMonthsExperienceError] =
    useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobTitleError, setJobTitleError] = useState("");
  const [editingCompanyId, setEditingCompanyId] = useState(null);

  //
  const [companyName, setCompanyName] = useState("");
  const [companyNameError, setCompanyNameError] = useState("");
  const [project, setProject] = useState("");
  const [projectError, setProjectError] = useState("");
  const [projectType, setProjectType] = useState("");
  const [projectTypeError, setProjectTypeError] = useState("");
  const [projectStartDate, setProjectStartDate] = useState("");
  const [projectStartDateError, setProjectStartDateError] = useState("");
  const [projectEndDate, setProjectEndDate] = useState("");
  const [projectEndDateError, setProjectEndDateError] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectDescriptionError, setProjectDescriptionError] = useState("");
  const [projectsList, setProjectsList] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [rollNumber, setRollNumber] = useState("");
  const [educationData, setEducationData] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [aboutData, setAboutData] = useState(null);
  const [isResume, setIsResume] = useState("");
  const [isSkills, setIsSkills] = useState([]);
  const [isWorkExp, setIsWorkExp] = useState("");
  const [isAbout, setIsAbout] = useState("");
  const [isEducation, setIsEducation] = useState([]);
  const [isProjects, setIsProjects] = useState([]);
  const [isSocialLinks, setIsSocialLinks] = useState({});
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [userProfileLoading, setUserProfileLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState([
    {
      id: Date.now(),
      isNew: true,
      jobTitle: "",
      workingCompanyName: "",
      designation: "",
      workingStartDate: "",
      workingEndDate: "",
      currentlyWorking: false,
      jobTitleError: "",
      workingCompanyNameError: "",
      designationError: "",
      workingStartDateError: "",
      workingEndDateError: "",
    },
  ]);

  const [bannerStyle, setBannerStyle] = useState({
    backgroundColor: "#481eaf",
    backgroundImage: "none",
  });

  const [isColorModalVisible, setColorModalVisible] = useState(false);
  const [isImageModalVisible, setImageModalVisible] = useState(false);

  // active streak

  const [streakData, setStreakData] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const today = new Date();


  useEffect(() => {
    getDailyStreakData();
  }, [loginUserId])

  const getDailyStreakData = async () => {
    const payload = {
      user_id: loginUserId
    }

    try {
      const response = await getDailyStreak(payload);
      console.log("getDailyStreak", response)
    } catch (error) {
      console.log("getDailyStreak", error)
    }
  }



  useEffect(() => {
    if (loginUserId !== null && loginUserId !== undefined) {
      dailyStreakData();
    }
  }, [loginUserId]);

  const dailyStreakData = async () => {
    setIsLoading(true);
    const payload = { user_id: loginUserId };

    try {
      const response = await dailyStreak(payload);
      console.log("dailyStreak", response);

      if (response?.data) {
        const transformedData = response.data.history.map((item) => ({
          date: item.usage_date,
          streak: item.streak,
        }));

        setStreakData(transformedData);
        setCurrentStreak(response.data.currentStreak || 0);
        setMaxStreak(response.data.maxStreak || 0);
      }
    } catch (error) {
      console.error("dailyStreak error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuClick = ({ key }) => {
    if (key === "color") {
      setColorModalVisible(true);
    } else if (key === "image") {
      setImageModalVisible(true);
    }
  };
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const menuItems = [
    {
      key: "color",
      icon: <BgColorsOutlined style={{ color: "#5f2eea", fontSize: "16px" }} />,
      label: <span style={{ fontWeight: 500 }}>Change Background Color</span>,
      style: {
        padding: "10px 16px",
        margin: "4px 8px",
        borderRadius: "8px",
      },
    },
    {
      type: "divider",
      style: { margin: "4px 0" },
    },
    {
      key: "image",
      icon: <PictureOutlined style={{ color: "#5f2eea", fontSize: "16px" }} />,
      label: <span style={{ fontWeight: 500 }}>Change Background Image</span>,
      style: {
        padding: "10px 16px",
        margin: "4px 8px",
        borderRadius: "8px",
      },
    },
  ];

  //
  const [customSkillError, setCustomSkillError] = useState("");

  useEffect(() => {
    document.title = "CareerFast | Profile Details";
    getGenderDataType();
  }, []);

  useEffect(() => {
    if (loginUserId !== null && loginUserId !== undefined) {
      getUserProfileData();
      // updateProfileImageData();
    }
  }, [loginUserId]);

  // QUALIFICATION
  useEffect(() => {
    getQualificationData();
  }, []);

  const getQualificationData = async () => {
    try {
      const response = await getQualification();
      console.log("getQualification", response);
      setQualificationOptions(response?.data?.data || []);
    } catch (error) {
      console.log("getQualification error", error);
    } finally {
      setTimeout(() => {
        getCourseData();
      }, 300);
    }
  };
  //

  // EDUCATION COURSE
  const getCourseData = async () => {
    try {
      const response = await getCourses();
      setEducationCourseOptions(response?.data?.data || []);
      setCourseOptions(response?.data?.data || []);
      setFresherCourseOptions(response?.data?.data || []);
    } catch (error) {
      console.log("getCourseData error", error);
    } finally {
      getSpecializationData();
    }
  };

  // SPECIFICATION

  const getSpecializationData = async () => {
    try {
      const response = await getSpecialization();
      setSpecializationOptions(response?.data?.data || []);
      console.log("getSpecializationData", response);
    } catch (error) {
      console.log("getSpecializationData error", error);
    } finally {
      getCollegesData();
    }
  };

  // EDUCATION COLLAGES
  const getCollegesData = async () => {
    try {
      const response = await getColleges();
      setCollageOptions(response?.data?.data || []);
    } catch (error) {
      console.log("getCollegesData error", error);
    } finally {
      setTimeout(() => {
        getCourseTypeData();
      }, 300);
    }
  };

  // COURSE TYPE
  const getCourseTypeData = async () => {
    try {
      const response = await getCourseType();
      const courseTypes = response?.data?.data || [];

      const mappedOptions = courseTypes.map((item) => ({
        label: item,
        value: item,
      }));

      setCourseTypeOptions(mappedOptions);
    } catch (error) {
      console.log("getCourseTypeData error", error);
    }
  };

  // DELETE EDUCATION
  const handleDeleteEducation = async (idToDelete) => {
    const targetId = (typeof idToDelete === "number" || typeof idToDelete === "string") ? idToDelete : educationData?.id;
    if (!targetId) {
      message.error("No education data to delete.");
      return;
    }

    const payload = {
      id: targetId,
      user_id: loginUserId,
    };

    try {
      const response = await deleteEducation(payload);
      console.log("deleteEducation", response);
      message.success("Education removed successfully.");
      setEducationData(null);
      setEditingEduId(null);
      setQualification("");
      setEducationCourse("");
      setSpecialization("");
      setEducationCollege("");
      setEducationStartDate("");
      setEducationEndDate("");
      setCourseType("Full Time");
      setPercentage("");
      setCgpa("");
      setRollNumber("");
      setLateral("No");
      setShowEducationForm(false);
      getUserProfileData();
    } catch (error) {
      console.error("Error deleting education:", error);
      message.error("Failed to delete education.");
    }
  };

  const getUserProfileData = async () => {
    const payload = {
      user_id: loginUserId,
    };

    try {
      const response = await getUserProfile(payload);
      console.log("getUserProfilegetUserProfile", response);
      const image = response?.data?.data?.profile_image || "";
      setProfileImage(image || defaultAvatar);

      // Set banner style from response
      setBannerStyle({
        backgroundColor: response?.data?.data?.banner_color || "#481eaf",
        backgroundImage: response?.data?.data?.banner_image
          ? `url(${response.data.data.banner_image})`
          : "none",
      });
      setIsResume(response?.data?.data?.resume || "");
      setIsSkills(response?.data?.data?.skills || []);
      setIsWorkExp(response?.data?.data?.experince_type || "");
      setIsAbout(response?.data?.data?.about || "");
      setIsEducation(response?.data?.data?.education || []);
      setIsProjects(response?.data?.data?.projects || []);
      const expString = response?.data?.data?.total_years || "";
      let parsedYears = "";
      let parsedMonths = "";
      if (expString && expString !== 'Fresher (0 Years)' && expString !== '0 years') {
        const lowerExp = expString.toLowerCase();
        const yearMatch = lowerExp.match(/(\d+)\s*year/);
        if (yearMatch) parsedYears = `${yearMatch[1]} Years`;
        const monthMatch = lowerExp.match(/(\d+)\s*month/);
        if (monthMatch) {
          const m = parseInt(monthMatch[1], 10);
          parsedMonths = m <= 1 ? `${m} Month` : `${m} Months`;
        }
      }

      setTotalYearsExperience(
        parsedYears || (response?.data?.data?.total_years && !expString.toLowerCase().includes('month') ? `${response.data.data.total_years}` : "")
      );
      setTotalMonthsExperience(
        parsedMonths || (response?.data?.data?.total_months ? `${response.data.data.total_months}` : "")
      );


      setLocation(response?.data?.data?.location || "N/A");
      const fetchedLinks = response?.data?.data?.social_links || {};
      setSocialLinks({
        Linkedin: fetchedLinks.linkedin || "",
        Facebook: fetchedLinks.facebook || "",
        Instagram: fetchedLinks.instagram || "",
        Twitter: fetchedLinks.twitter || "",
        Dribbble: fetchedLinks.dribble || "",
        Behance: fetchedLinks.behance || "",
        Github: fetchedLinks.github || "",
        Portfolio: fetchedLinks.portfolio || "",
      });
      setIsSocialLinks(fetchedLinks);

      const fetchSkills = response?.data?.data?.skills || [];
      setSelectedSkills(Array.isArray(fetchSkills) ? fetchSkills : []);
      setIsSkills(fetchSkills);
      setCreatedAt(response?.data?.data?.created_date || "");

      if (response?.data?.data) {
        const profile = response.data.data;
        if (profile.first_name) setFname(profile.first_name);
        if (profile.last_name) setLname(profile.last_name);
        if (profile.email) setEmail(profile.email);
        if (profile.phone) setPhoneNumber(profile.phone);
        if (profile.dob) setDob(profile.dob ? String(profile.dob).slice(0, 10) : "");
        if (profile.marital_status) setMaritalStatus(profile.marital_status);
        if (profile.experince_type) setSelectExperienceType(profile.experince_type);
        if (profile.notice_period) setNoticePeriod(profile.notice_period);
        if (profile.expected_salary) setExpectedSalary(profile.expected_salary);
        if (profile.current_salary) setCurrentSalary(profile.current_salary);
        if (profile.available_from) setAvailableFrom(profile.available_from);
        if (profile.preferred_roles) setPreferredRoles(profile.preferred_roles);
        if (profile.preferred_locations) setPreferredLocations(profile.preferred_locations);
        if (profile.willing_to_relocate) setWillingToRelocate(profile.willing_to_relocate);
        if (profile.preferred_job_type) {
          if (typeof profile.preferred_job_type === "object") {
            if (profile.preferred_job_type.jobType) setPreferredJobType(profile.preferred_job_type.jobType);
            if (profile.preferred_job_type.expectedSalary) setExpectedSalary(profile.preferred_job_type.expectedSalary);
            if (profile.preferred_job_type.currentSalary) setCurrentSalary(profile.preferred_job_type.currentSalary);
            if (profile.preferred_job_type.noticePeriod) setNoticePeriod(profile.preferred_job_type.noticePeriod);
            if (profile.preferred_job_type.preferredRoles) setPreferredRoles(Array.isArray(profile.preferred_job_type.preferredRoles) ? profile.preferred_job_type.preferredRoles.join(", ") : profile.preferred_job_type.preferredRoles);
            if (profile.preferred_job_type.preferredLocations) setPreferredLocations(Array.isArray(profile.preferred_job_type.preferredLocations) ? profile.preferred_job_type.preferredLocations.join(", ") : profile.preferred_job_type.preferredLocations);
            if (profile.preferred_job_type.relocation) setWillingToRelocate(profile.preferred_job_type.relocation);
          } else {
            setPreferredJobType(profile.preferred_job_type);
          }
        }
        if (profile.certifications) {
          setCertifications(Array.isArray(profile.certifications) ? profile.certifications : []);
        }
        if (profile.accomplishments) {
          setAccomplishments(Array.isArray(profile.accomplishments) ? profile.accomplishments : []);
        }
        if (profile.additional_info && typeof profile.additional_info === "object" && Object.keys(profile.additional_info).length > 0) {
          setAdditionalInfo(profile.additional_info);
        }
        if (profile.languages && Array.isArray(profile.languages) && profile.languages.length > 0) {
          setLanguages(profile.languages);
        }

        setUserType(profile.user_type || "");
        setGender(profile.gender || "");
        setExperienceType(profile.experince_type || "");
        setUserTypeActiveButton(profile.user_type || "");
        setGenderActiveButton(profile.gender || "");



        // Handle education
        if (profile.education && profile.education.length > 0) {
          const edu = profile.education[0];
          setEducationData(edu);
          setQualification(edu.qualification || "");
          setEducationCourse(edu.course || "");
          setSpecialization(edu.specialization || "");
          setEducationCollege(edu.college || "");
          setEducationStartDate(edu.start_date);
          setEducationEndDate(edu.end_date);
          setCourseType(edu.course_type);
          setPercentage(edu.percentage);
          setCgpa(edu.cgpa);
          setRollNumber(edu.roll_number);
          setLateral(edu.lateral_entry);
          setShowEducationForm(false);
        } else {
          setEducationData(null);
          setShowEducationForm(true);
        }

        // Handle about
        if (profile.about) {
          setAboutText(profile.about || "");
          setAboutTextNew(profile.about || "");
          setAboutData(profile.about);
        } else {
          setAboutText("");
          setAboutTextNew("");
          setAboutData(null);
        }

        // Handle projects
        if (profile.projects && profile.projects.length > 0) {
          const proj = profile.projects[0];
          setProjectData(proj);
          setCompanyName(proj.company_name || "");
          setProject(proj.project_title || "");
          setProjectType(proj.project_type || "");
          setActiveButton(proj.project_type || "");
          setProjectStartDate(proj.start_date || "");
          setProjectEndDate(proj.end_date || "");
          setProjectDescription(proj.description);
          setProjectsList(profile.projects);
          setShowForm(false);
        } else {
          setProjectData(null);
          setProjectsList([]);
          setShowForm(true);
        }

        // Handle experience
        if (
          response?.data?.data?.professional &&
          response.data.data.professional.length > 0
        ) {
          const professionalData = response.data.data.professional;
          setExperienceType(profile.experince_type || "");
          setLocation(profile.location || "");

          // Map all experiences to companies state
          const mappedCompanies = professionalData.map((exp) => ({
            id: exp.id,
            jobTitle: exp.job_title || "",
            workingCompanyName: exp.company_name || "",
            designation: exp.designation || "",
            workingStartDate: exp.start_date || "",
            workingEndDate: exp.currently_working ? "" : exp.end_date || "",
            currentlyWorking: !!exp.currently_working,
            isNew: false,
          }));

          setCompanies(mappedCompanies);
          setExperienceData(mappedCompanies[0]?.jobTitle || "");
          setShowWorkExpForm(false);
        } else {
          setExperienceData(null);
          setCompanies([
            {
              id: Date.now(),
              isNew: true,
              jobTitle: "",
              workingCompanyName: "",
              designation: "",
              workingStartDate: "",
              workingEndDate: "",
              currentlyWorking: false,
            },
          ]);
          setShowWorkExpForm(true);
        }
      }
    } catch (error) {
      console.log("getuserprofile error", error);
      setShowEducationForm(true);
      setShowWorkExpForm(true);
      setShowForm(true);
    } finally {
      setTimeout(() => {
        setUserProfileLoading(false);
      }, 1000);
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      message.error("File size must be less than 2MB");
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      message.error("Only JPG, PNG and WEBP files are allowed");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result;
      setProfileImage(base64Image);
      localStorage.setItem("profileImage", base64Image);

      const payload = {
        user_id: loginUserId,
        profile_image: base64Image
      };

      try {
        const response = await updateProfileImage(payload);
        if (response?.data?.success || response?.status === 200) {
          message.success("Profile photo updated successfully!");
        }
      } catch (error) {
        console.error("Profile image upload error:", error);
        message.error("An error occurred while uploading profile photo");
      }
    };
    reader.readAsDataURL(file);
  };

  const getGenderDataType = async () => {
    try {
      const response = await getGenderData();
      setGenderOptions(response?.data?.data || []);
      console.log("gender", response);
    } catch (error) {
      console.log("gender error", error);
    } finally {
      setTimeout(() => {
        getUserTypeDataOptions();
      }, 300);
    }
  };

  const getUserTypeDataOptions = async () => {
    try {
      const response = await getUserTypeData();
      setUserTypeName(response?.data?.data || []);
      console.log("userType", response);
    } catch (error) {
      console.log("usertype", error);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const fnameValidate = nameValidator(fname);
    const lnameValidate = nameValidator(lname);
    const emailValidate = emailValidator(email);
    const phoneValidate = phoneValidation(phoneNumber);
    const genderValidate = genderValidator(gender);
    const userTypeValidate = userTypeValidator(userType);
    const locationValidate = nameValidator(location);
    const courseValidate =
      userType === "College Student" ? selectValidator(course) : "";
    const startDateValidate =
      userType === "College Student" ? selectValidator(startDate) : "";
    const endDateValidate =
      userType === "College Student" ? selectValidator(endDate) : "";

    const fresherCourseValidate =
      userType === "Fresher" ? selectValidator(fresherCourse) : "";
    const fresherStartDateValidate =
      userType === "Fresher" ? selectValidator(fresherStartDate) : "";
    const fresherEndtDateValidate =
      userType === "Fresher" ? selectValidator(fresherEndtDate) : "";

    const selectExperienceTypeValidate = selectValidator(selectExperienceType);

    setSelectExperienceTypeError(selectExperienceTypeValidate);

    let totalYearsExperienceValidate = "";
    let totalMonthsExperienceValidate = "";

    totalYearsExperienceValidate = selectValidator(totalYearsExperience);
    totalMonthsExperienceValidate = selectValidator(totalMonthsExperience);

    setTotalYearsExperienceError(totalYearsExperienceValidate);
    setTotalMonthsExperienceError(totalMonthsExperienceValidate);

    setFnameError(fnameValidate);
    setLnameError(lnameValidate);
    setEmailError(emailValidate);
    setPhoneNumberError(phoneValidate);
    setGenderError(genderValidate);
    setUserTypeError(userTypeValidate);
    setLocationError(locationValidate);
    setCourseError(courseValidate);
    setStartDateError(startDateValidate);
    setEndDateError(endDateValidate);
    setFresherCourseError(fresherCourseValidate);
    setFresherStartDateError(fresherStartDateValidate);
    setFresherEndDateError(fresherEndtDateValidate);

    const hasErrors = [
      fnameValidate,
      lnameValidate,
      emailValidate,
      phoneValidate,
      genderValidate,
      userTypeValidate,
      locationValidate,
      selectExperienceTypeValidate,

      ...(userType === "College Student"
        ? [courseValidate, startDateValidate, endDateValidate]
        : []),
      ...(userType === "Fresher"
        ? [
          fresherCourseValidate,
          fresherStartDateValidate,
          fresherEndtDateValidate,
        ]
        : []),
    ].some((val) => val !== "");

    if (hasErrors) {
      message.error("Please fill all fields correctly before proceeding.");
      return;
    }

    const payload = {
      first_name: fname,
      last_name: lname,
      gender: gender,
      user_type: userType,
      phone: phoneNumber,
      dob: dob,
      marital_status: maritalStatus,
      ...(userType === "College Student" && {
        course: courseOptions.find((item) => item.id === course)?.name || "",
        start_year: startDate,
        end_year: endDate,
      }),
      ...(userType === "Fresher" && {
        course: fresherCourseOptions.find((item) => item.id === fresherCourse)?.name || "",
        start_year: fresherStartDate,
        end_year: fresherEndtDate,
      }),
      location: location,
      experince_type: selectExperienceType,
      experience: selectExperienceType === "Fresher" ? "0 years" : `${totalYearsExperience || '0 Years'} ${totalMonthsExperience || '0 Month'}`.trim(),
      total_years: selectExperienceType === "Fresher" ? "0 years" : `${totalYearsExperience || '0 Years'} ${totalMonthsExperience || '0 Month'}`.trim(),
      total_months: selectExperienceType === "Fresher" ? "0 Month" : totalMonthsExperience,
      ...(userType === "School Student" && {
        classes: Class,
      }),

      current_salary: currentSalary,
      user_id: loginUserId,
    };
    try {
      const response = await updateBasicDetails(payload);
      console.log("Saving user data:", response);
      message.success("Profile details saved successfully.");
      getUserProfileData();
      resetFormFields();
    } catch (error) {
      console.log("Saving user data:", error);
    }
  };

  const handleSavePreferences = async () => {
    const payload = {
      user_id: loginUserId,
      preferred_roles: preferredRoles,
      preferred_job_type: preferredJobType,
      preferred_locations: preferredLocations,
      willing_to_relocate: willingToRelocate,
      notice_period: noticePeriod,
      expected_salary: expectedSalary,
      current_salary: currentSalary,
      available_from: availableFrom,
      marital_status: maritalStatus,
      dob: dob,
    };
    try {
      await updateBasicDetails(payload);
      message.success("Preferences updated successfully!");
      getUserProfileData();
    } catch (error) {
      console.error("Error updating preferences:", error);
      message.error("Failed to update preferences.");
    }
  };

  const handleSaveCertifications = async (newCerts) => {
    const payload = {
      user_id: loginUserId,
      certifications: newCerts,
    };
    try {
      await updateBasicDetails(payload);
      setCertifications(newCerts);
      message.success("Certifications updated successfully!");
      getUserProfileData();
    } catch (error) {
      console.error("Error updating certifications:", error);
      message.error("Failed to update certifications.");
    }
  };

  const handleSaveAccomplishments = async (newAccomplishments) => {
    const payload = {
      user_id: loginUserId,
      accomplishments: newAccomplishments,
    };
    try {
      await updateBasicDetails(payload);
      setAccomplishments(newAccomplishments);
      message.success("Accomplishments updated successfully!");
      getUserProfileData();
    } catch (error) {
      console.error("Error updating accomplishments:", error);
      message.error("Failed to update accomplishments.");
    }
  };

  const handleSaveLanguages = async (newLanguages) => {
    const payload = {
      user_id: loginUserId,
      languages: newLanguages,
    };
    try {
      await updateBasicDetails(payload);
      setLanguages(newLanguages);
      message.success("Languages updated successfully!");
      getUserProfileData();
    } catch (error) {
      console.error("Error updating languages:", error);
      message.error("Failed to update languages.");
    }
  };

  const handleSaveAdditionalInfo = async (newInfo) => {
    const payload = {
      user_id: loginUserId,
      additional_info: newInfo,
    };
    try {
      await updateBasicDetails(payload);
      setAdditionalInfo(newInfo);
      message.success("Additional info updated successfully!");
      getUserProfileData();
    } catch (error) {
      console.error("Error updating additional info:", error);
      message.error("Failed to update additional info.");
    }
  };

  const handleEditCompany = (exp) => {
    setEditingCompanyId(exp.id);
    setJobTitle(exp.job_title || exp.jobTitle || "");
    setCompanyName(exp.company_name || exp.workingCompanyName || "");
    setShowWorkExpForm(true);
    setActiveTab("experience");
    showDrawer();
  };

  const handleAddNewExperience = () => {
    setEditingCompanyId(null);
    handleAddCompany();
    setShowWorkExpForm(true);
    setActiveTab("experience");
    showDrawer();
  };

  const handleEditEducationItem = (edu) => {
    setEducationData(edu);
    setEditingEduId(edu.id);

    const qualMatch = qualificationOptions.find(
      (item) =>
        item.name?.trim().toLowerCase() === edu.qualification?.trim().toLowerCase() ||
        String(item.id) === String(edu.qualification)
    );
    setQualification(qualMatch ? qualMatch.id : (edu.qualification || ""));

    const courseMatch = educationCourseOptions.find(
      (item) =>
        item.name?.trim().toLowerCase() === edu.course?.trim().toLowerCase() ||
        String(item.id) === String(edu.course)
    );
    setEducationCourse(courseMatch ? courseMatch.id : (edu.course || ""));

    const specMatch = specializationOptions.find(
      (item) =>
        item.name?.trim().toLowerCase() === edu.specialization?.trim().toLowerCase() ||
        String(item.id) === String(edu.specialization)
    );
    setSpecialization(specMatch ? specMatch.id : (edu.specialization || ""));

    const colMatch = collageOptions.find(
      (item) =>
        item.name?.trim().toLowerCase() === edu.college?.trim().toLowerCase() ||
        String(item.id) === String(edu.college)
    );
    setEducationCollege(colMatch ? colMatch.id : (edu.college || ""));

    setEducationStartDate(edu.start_date ? String(edu.start_date) : (edu.startYear ? String(edu.startYear) : ""));
    setEducationEndDate(edu.end_date ? String(edu.end_date) : (edu.endYear ? String(edu.endYear) : ""));
    setCourseType(edu.course_type || "Full Time");
    setPercentage(edu.percentage || "");
    setCgpa(edu.cgpa || "");
    setRollNumber(edu.roll_number || "");
    setLateral(
      edu.lateral_entry === 1 || edu.lateral_entry === "Yes" || edu.lateral_entry === "yes"
        ? "Yes"
        : "No"
    );
    setShowEducationForm(true);
    setActiveTab("education");
    showDrawer();
  };

  const handleAddNewEducation = () => {
    setEducationData(null);
    setEditingEduId(null);
    setQualification("");
    setEducationCourse("");
    setSpecialization("");
    setEducationCollege("");
    setEducationStartDate("");
    setEducationEndDate("");
    setCourseType("Full Time");
    setPercentage("");
    setCgpa("");
    setRollNumber("");
    setLateral("No");
    setShowEducationForm(true);
    setActiveTab("education");
    showDrawer();
  };

  const handleEditProjectItem = (proj) => {
    setProjectData(proj);
    setEditingProjId(proj.id);
    setProject(proj.project_title || proj.projectTitle || proj.title || "");
    setCompanyName(proj.company_name || proj.projectClient || proj.client || "");
    const pType = proj.project_type || proj.projectType || "Full Time";
    setProjectType(pType);
    setActiveButton(pType);
    setProjectStartDate(
      proj.start_date
        ? String(proj.start_date).slice(0, 10)
        : (proj.projectStartDate ? String(proj.projectStartDate).slice(0, 10) : "")
    );
    setProjectEndDate(
      proj.end_date
        ? String(proj.end_date).slice(0, 10)
        : (proj.projectEndDate ? String(proj.projectEndDate).slice(0, 10) : "")
    );
    setProjectDescription(proj.description || proj.projectDescription || "");
    setShowForm(true);
    setActiveTab("projects");
    showDrawer();
  };

  const handleAddNewProject = () => {
    setProjectData(null);
    setEditingProjId(null);
    setCompanyName("");
    setProject("");
    setProjectType("Full Time");
    setActiveButton("Full Time");
    setProjectStartDate("");
    setProjectEndDate("");
    setProjectDescription("");
    setShowForm(true);
    setActiveTab("projects");
    showDrawer();
  };

  //

  const yearOptions = Array.from({ length: 2025 - 1990 + 1 }, (_, i) => {
    const year = (1990 + i).toString();
    return { label: year, value: year };
  });

  const educationStartDateOptions = yearOptions;
  const educationEndDateOptions = yearOptions;

  const handleExperienceTypeChange = (value) => setExperienceType(value);

  const handleAddCompany = () => {
    setEditingCompanyId(null);
    setShowWorkExpForm(true);
    setCompanies([
      ...companies,
      {
        id: Date.now(),
        isNew: true,
        jobTitle: "",
        workingCompanyName: "",
        designation: "",
        workingStartDate: "",
        workingEndDate: "",
        currentlyWorking: false,
        jobTitleError: "",
        workingCompanyNameError: "",
        designationError: "",
        workingStartDateError: "",
        workingEndDateError: "",
      },
    ]);
  };

  const handleEducationDiscard = () => {
    setShowEducationForm(false);
  };

  const handleEducationSave = async (e) => {
    e.preventDefault();

    const qualificatonValidate = selectValidator(qualificaton);
    const educationCourseValidate = selectValidator(educationCourse);
    const specializationValidate = selectValidator(specialization);
    const collageValidate = selectValidator(educationCollege);
    const courseTypeValidate = selectValidator(courseType);
    const educationStartDateValidate = selectValidator(educationStartDate);
    const educationEndDateValidate = selectValidator(educationEndDate);

    setQualificationError(qualificatonValidate);
    setEducationCourseError(educationCourseValidate);
    setSpecializationError(specializationValidate);
    setCollageError(collageValidate);
    setCourseTypeError(courseTypeValidate);
    setEducationStartDateError(educationStartDateValidate);
    setEducationEndDateError(educationEndDateValidate);

    const hasEducationErrors = [
      qualificatonValidate,
      educationCourseValidate,
      specializationValidate,
      collageValidate,
      courseTypeValidate,
      educationStartDateValidate,
      educationEndDateValidate,
    ].some((val) => val !== "");

    if (hasEducationErrors) {
      message.error("Please fill all fields correctly before proceeding.");
      return;
    }

    const payload = {
      id: educationData?.id,
      user_id: loginUserId,
      qualification:
        qualificationOptions.find(
          (item) => item.id === qualificaton || item.name === qualificaton
        )?.name ||
        (typeof qualificaton === "string" ? qualificaton : "") ||
        "",
      course:
        educationCourseOptions.find(
          (item) => item.id === educationCourse || item.name === educationCourse
        )?.name ||
        (typeof educationCourse === "string" ? educationCourse : "") ||
        "",
      specialization:
        specializationOptions.find(
          (item) => item.id === specialization || item.name === specialization
        )?.name ||
        (typeof specialization === "string" ? specialization : "") ||
        "",
      college:
        collageOptions.find(
          (item) => item.id === educationCollege || item.name === educationCollege
        )?.name ||
        (typeof educationCollege === "string" ? educationCollege : "") ||
        "",
      start_date: educationStartDate,
      end_date: educationEndDate,
      course_type: courseType,
      percentage: percentage,
      cgpa: cgpa,
      roll_number: rollNumber,
      lateral_entry: lateral,
    };

    try {
      if (educationData) {
        const response = await updateEducation(payload);
        message.success("Education updated successfully.");
      } else {
        const response = await insertEducation(payload);
        message.success("Education added successfully.");
      }
      setShowEducationForm(false);
      getUserProfileData();
    } catch (error) {
      console.error("Education save/update failed:", error);
      message.error("Failed to save education data.");
    }
  };

  const handleDeleteCompanyWork = async (companyId) => {
    try {
      await deleteExperience({ id: companyId, user_id: loginUserId });

      const updatedCompanies = companies.filter(
        (company) => company.id !== companyId
      );
      setCompanies(updatedCompanies);
      message.success("Experience deleted successfully");
      getUserProfileData();

      if (updatedCompanies.length === 0) {
        setShowWorkExpForm(true);
        setCompanies([
          {
            id: Date.now(),
            isNew: true,
            jobTitle: "",
            workingCompanyName: "",
            designation: "",
            workingStartDate: "",
            workingEndDate: "",
            currentlyWorking: false,
            jobTitleError: "",
            workingCompanyNameError: "",
            designationError: "",
            workingStartDateError: "",
            workingEndDateError: "",
          },
        ]);
      }
    } catch (error) {
      console.error("Error deleting experience:", error);
      message.error("Failed to delete experience");
    }
  };

  const handleWorkDiscard = () => {
    setShowWorkExpForm(false);
    setEditingCompanyId(null);

    setCompanies((prev) => prev.filter((company) => !company.isNew));
  };

  const handleWorkExpSave = async (e) => {
    e.preventDefault();

    let experienceErrors = false;
    const updatedCompanies = [...companies];

    updatedCompanies.forEach((company) => {
      company.jobTitleError = nameValidator(company.jobTitle);
      company.workingCompanyNameError = nameValidator(
        company.workingCompanyName
      );
      company.designationError = nameValidator(company.designation);
      company.workingStartDateError = selectValidator(company.workingStartDate);
      company.workingEndDateError = company.currentlyWorking
        ? ""
        : selectValidator(company.workingEndDate);

      if (
        company.jobTitleError ||
        company.workingCompanyNameError ||
        company.designationError ||
        company.workingStartDateError ||
        company.workingEndDateError
      ) {
        experienceErrors = true;
      }
    });

    setCompanies(updatedCompanies);

    if (experienceErrors) {
      message.error("Please fill all fields correctly before proceeding.");
      return;
    }

    try {
      if (editingCompanyId === null) {
        const newCompany = companies.find((c) => c.isNew);

        const payload = {
          user_id: loginUserId,
          experiences: [
            {
              job_title: newCompany.jobTitle,
              company_name: newCompany.workingCompanyName,
              designation: newCompany.designation,
              start_date: newCompany.workingStartDate,
              end_date: newCompany.currentlyWorking ? null : newCompany.workingEndDate,
              currently_working: newCompany.currentlyWorking ? 1 : 0,
            },
          ],
        };

        const response = await insertExperience(payload);

        const finalCompanies = companies.map((c) =>
          c.isNew ? { ...c, id: response.data.id || Date.now(), isNew: false } : c
        );

        // ✅ Add immediately to state
        const savedCompany = {
          ...newCompany,
          id: response.data.id || Date.now(),
          isNew: false,
        };

        setCompanies((prev) => [...prev.filter((c) => !c.isNew), savedCompany]);
        message.success("Experience added successfully");
        getUserProfileData();

      } else {
        const companyToUpdate = companies.find(
          (company) => company.id === editingCompanyId
        );

        const payload = {
          id: editingCompanyId,
          job_title: companyToUpdate.jobTitle,
          company_name: companyToUpdate.workingCompanyName,
          designation: companyToUpdate.designation,
          start_date: companyToUpdate.workingStartDate,
          end_date: companyToUpdate.currentlyWorking
            ? null
            : companyToUpdate.workingEndDate,
          currently_working: companyToUpdate.currentlyWorking ? 1 : 0,
          user_id: loginUserId,
        };

        await updateExperience(payload);
        message.success("Experience updated successfully");
        getUserProfileData();
      }

      setShowWorkExpForm(false);
      setEditingCompanyId(null);
    } catch (error) {
      console.error("Experience save error", error);
      message.error("Failed to save experience");
    }
  };

  const handleProjectDiscard = () => {
    setShowForm(false);
  };

  const handleProjectSave = async (e) => {
    e.preventDefault();

    // 🔍 Run validations
    const projectCompanyNameValidate = nameValidator(companyName);
    const projectValidate = nameValidator(project);
    const projectTypeValidate = selectValidator(projectType);
    const projectStartDateValidate = selectValidator(projectStartDate);
    const projectEndDateValidate = selectValidator(projectEndDate);
    const projectDescriptionValidate = descriptionValidator(projectDescription);

    // 🔁 Set validation errors to state
    setCompanyNameError(projectCompanyNameValidate);
    setProjectError(projectValidate);
    setProjectTypeError(projectTypeValidate);
    setProjectStartDateError(projectStartDateValidate);
    setProjectEndDateError(projectEndDateValidate);
    setProjectDescriptionError(projectDescriptionValidate);

    const hasProjectError = [
      projectCompanyNameValidate,
      projectValidate,
      projectTypeValidate,
      projectStartDateValidate,
      projectEndDateValidate,
      projectDescriptionValidate,
    ].some((val) => val !== "");

    if (hasProjectError) {
      message.error("Please fill all fields correctly before proceeding.");
      return;
    }

    // ✅ Construct payload
    const payload = {
      ...(projectData?.id && { id: projectData.id }), // only include id if editing
      user_id: loginUserId,
      company_name: companyName,
      job_title: jobTitle,
      project_title: project,
      project_type: projectType,
      start_date: formatDateTime(projectStartDate),
      end_date: formatDateTime(projectEndDate),
      description: projectDescription,
    };

    try {
      if (projectData) {
        const response = await updateProject(payload);
        console.log("updateProjects", response);
        message.success("Project updated successfully.");
        getUserProfileData();

        const updatedList = projectsList.map((item) =>
          item.id === projectData.id ? payload : item
        );
        setProjectsList(updatedList);
      } else {
        const response = await insertProjects(payload);
        console.log("insertProjects", response);
        message.success("Project added successfully.");
        getUserProfileData();

        const newProject = response?.data?.data;

        if (newProject?.id) {
          setProjectsList([...projectsList, newProject]);
        } else {
          getUserProfileData();
        }
      }

      // ✅ Reset state after save
      setProjectData(null);
      setCompanyName("");
      setProject("");
      setProjectType("");
      setProjectStartDate("");
      setProjectEndDate("");
      setProjectDescription("");
      setActiveButton(""); // clear active button style
      setGenderActiveButton("")
      setShowForm(false);
    } catch (error) {
      console.error("project error", error);
      message.error("Failed to save project");
    }
  };

  const handleDeleteCompany = async (id) => {
    const targetId = (typeof id === "number" || typeof id === "string") ? id : projectData?.id;
    if (!targetId) {
      message.error("No project ID to delete.");
      return;
    }

    const payload = {
      id: targetId,
      user_id: loginUserId,
    };

    try {
      const response = await deleteProject(payload);
      console.log("deleteProject", response);
      message.success("Project removed successfully.");
      setProjectData(null);
      setEditingProjId(null);
      setCompanyName("");
      setProject("");
      setProjectType("Full Time");
      setActiveButton("Full Time");
      setProjectStartDate("");
      setProjectEndDate("");
      setProjectDescription("");
      setShowForm(false);
      getUserProfileData();

      const updatedList = projectsList.filter((item) => item.id !== targetId);
      setProjectsList(updatedList);
    } catch (error) {
      console.error("Error deleting project:", error);
      message.error("Failed to delete project.");
    }
  };

  const handleAboutSave = async (e) => {
    e.preventDefault();

    const aboutTextValidate = descriptionValidator(aboutTextNew);

    setAboutTextError(aboutTextValidate);

    const hasAboutError = [aboutTextValidate].some((val) => val !== "");

    if (hasAboutError) {
      return;
    }

    const payload = {
      about: aboutTextNew,
      id: loginUserId,
    };

    try {
      const response = await updateAbout(payload);
      console.log("updateAbout", response);
      setAboutText(aboutTextNew);
      setAboutTextNew(aboutTextNew);
      setAboutData(aboutTextNew);
      resetFormFields();
      message.success("About details saved successfully");
      getUserProfileData();
    } catch (error) {
      setAboutTextError(aboutTextValidate);
    }
  };

  const handleBeforeUpload = (file) => {
    const isValidType = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(file.type);
    const isLt10MB = file.size / 1024 / 1024 < 10;

    if (!isValidType) {
      message.error("Only DOC, DOCX, or PDF files are allowed!");
      return Upload.LIST_IGNORE;
    }

    if (!isLt10MB) {
      message.error("File must be smaller than 10MB!");
      return Upload.LIST_IGNORE;
    }
    setResumeError("");
    setResumeFile(file);
    return false;
  };

  const handleSkillsSave = async (e) => {
    e.preventDefault();

    const customskillValidate = nameValidator(customSkill);

    if (selectedSkills.length === 0 && customSkill.trim() === "") {
      setCustomSkillError(customskillValidate);
      message.warning("Please add at least one skill.");
      return;
    }

    const finalSkills = [
      ...selectedSkills,
      ...(customSkill.trim() ? [customSkill.trim()] : []),
    ];

    const payload = {
      skills: finalSkills,
      user_id: loginUserId,
    };

    try {
      const response = await updateSkills(payload);
      console.log("Skills updated successfully", response);

      const updatedSkills = response?.data?.data;
      setSelectedSkills(
        Array.isArray(updatedSkills) ? updatedSkills : finalSkills
      );
      message.success("Skills saved successfully.");
      getUserProfileData();
    } catch (error) {
      console.error("Error updating skills:", error);
      setCustomSkillError(customskillValidate);
      return;
    }

    resetFormFields();
    setCustomSkill("");
    setCustomSkillError("");
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // Reads file as Base64
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSave = async () => {
    if (!resumeFile) {
      setResumeError("Please upload a valid resume before saving.");
      return;
    }

    try {
      const base64Resume = await getBase64(resumeFile);
      const payload = {
        resume: base64Resume,
        id: loginUserId,
      };

      const response = await updateResume(payload);
      console.log("updateResume", response);

      resetFormFields();
      setResumeError("");
      getUserProfileData();
      message.success("Resume saved successfully!");
    } catch (error) {
      console.error("Base64 conversion or upload failed:", error);
      setResumeError("Something went wrong while saving resume.");
    }
  };

  const [socialLinks, setSocialLinks] = useState({
    Linkedin: "",
    Github: "",
    Portfolio: "",
    Facebook: "",
    Instagram: "",
    Twitter: "",
    Dribbble: "",
    Behance: "",
  });

  const [socialLinkErrors, setSocialLinkErrors] = useState({
    Linkedin: "",
    Github: "",
    Portfolio: "",
    Facebook: "",
    Instagram: "",
    Twitter: "",
    Dribbble: "",
    Behance: "",
  });

  const urlPattern = /^(https?:\/\/)?([\w\d-]+\.)+[\w-]{2,}(\/.*)?$/;
  const handleSocialLinksSave = (platform, value) => {
    setSocialLinks((prev) => ({
      ...prev,
      [platform]: value,
    }));

    // Validation on change
    setSocialLinkErrors((prev) => ({
      ...prev,
      [platform]:
        value.trim() === ""
          ? " field is required"
          : !urlPattern.test(value)
            ? " Invalid URL"
            : "",
    }));
  };

  //

  const handleAddSocialLinks = async () => {
    let hasErrors = false;
    const newErrors = {};

    Object.entries(socialLinks).forEach(([platform, link]) => {
      if (link.trim() !== "" && !urlPattern.test(link)) {
        newErrors[platform] = "Invalid URL";
        hasErrors = true;
      }
    });

    setSocialLinkErrors((prev) => ({ ...prev, ...newErrors }));

    if (hasErrors) {
      message.error("Please correct the errors before saving.");
      return;
    }

    const hasAnyLink = Object.values(socialLinks).some(
      (val) => val.trim() !== ""
    );
    if (!hasAnyLink) {
      message.warning("Please enter at least one social link.");
      return;
    }

    const payload = {
      linkedin: socialLinks["Linkedin"] || "",
      github: socialLinks["Github"] || "",
      portfolio: socialLinks["Portfolio"] || "",
      facebook: socialLinks["Facebook"] || "",
      instagram: socialLinks["Instagram"] || "",
      twitter: socialLinks["Twitter"] || "",
      dribble: socialLinks["Dribbble"] || "",
      behance: socialLinks["Behance"] || "",
      user_id: loginUserId,
    };

    try {
      const response = await updateSocialLinks(payload);
      console.log("social links", response);
      getUserProfileData();
      message.success("Social links saved successfully!");
      resetFormFields();
    } catch (error) {
      message.error("Failed to save social links.");
    }
  };

  const handleLateralTypeChange = (value) => {
    setLateral(value);
    console.log("Selected Lateral Entry Option:", value);
  };

  const formatDateTime = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 19).replace("T", " "); // 'YYYY-MM-DD HH:MM:SS'
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loginDetails");
      if (stored) {
        const loginDetails = JSON.parse(stored);
        setRoleId(loginDetails.role_id);
        setLoginUserId(loginDetails.id);
        setFname(loginDetails.first_name);
        setLname(loginDetails.last_name);
        setEmail(loginDetails.email);
        setPhoneNumber(loginDetails.phone);
        setOrganisationName(loginDetails.organization);
        setOrganizationType(loginDetails.organization_type);
      }
      console.log("stored", stored);
    } catch (error) {
      console.error("Invalid JSON in localStorage", error);
    } finally {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, []);

  const resetFormFields = () => {
    // Errors
    setFnameError("");
    setLnameError("");
    setEmailError("");
    setPhoneNumberError("");
    setGenderError("");
    setUserTypeError("");
    setLocationError("");
    setCourseError("");
    setStartDateError("");
    setEndDateError("");
    setFresherCourseError("");
    setFresherStartDateError("");
    setFresherEndDateError("");
    setQualificationError("");
    setEducationCourseError("");
    setSpecializationError("");
    setCollageError("");
    setResumeError("");
    setCourseTypeError("");
    setEducationStartDateError("");
    setEducationEndDateError("");
    setDesignationError("");
    setEmploymentTypeError("");
    setSelectExperienceTypeError("");
    setTotalYearsExperienceError("");
    setTotalMonthsExperienceError("");
    setJobTitleError("");
    setWorkExpStartDateError("");
    setWorkExpEndDateError("");
    setWorkExpLocationError("");
    setProjectError("");
    setProjectTypeError("");
    setProjectStartDateError("");
    setProjectEndDateError("");
    setProjectDescriptionError("");
    setCustomSkillError("");
    setAboutTextError("");
    setOpen(false);
  };

  const handleAddSkill = (skill) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      setCustomSkillError("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSelectedSkills(
      selectedSkills.filter((skill) => skill !== skillToRemove)
    );
  };

  const handleCustomSkillAdd = () => {
    const trimmed = customSkill.trim();

    if (!trimmed) {
      setCustomSkillError("Please enter a skill before adding.");
      return;
    }

    if (selectedSkills.includes(trimmed)) {
      setCustomSkillError("Skill already added.");
      return;
    }

    setSelectedSkills((prev) => [...prev, trimmed]);
    setCustomSkill("");
    setCustomSkillError("");
  };

  const handleButtonClick = (buttonId) => {
    setGenderActiveButton(buttonId);
    setGender(buttonId);
    setGenderError("");
  };

  const handleProjectTypeClick = (type) => {
    setActiveButton(type);
    setProjectType(type);
    setProjectTypeError("");
  };

  const handleUserTypeClick = (buttonId) => {
    setUserTypeActiveButton(buttonId);

    // Reset only the fields that are dependent on user type
    form.resetFields([
      "course",
      "startyear",
      "endyear",
      "course1",
      "class"
    ]);

    // Also clear local states if you’re still using them
    setCourse("");
    setFresherCourse("");
    setStartDate("");
    setEndDate("");
    setFresherStartDate("");
    setFresherEndDate("");
    setClass("");
  };


  const [Class, setClass] = useState(null);
  const handleClassClick = (buttonId) => {
    setClass((prev) => buttonId);
  };

  const handleUpload = async (info) => {
    const file = info.file.originFileObj || info.file;

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onloadend = async () => {
        const imageDataUrl = reader.result;
        setProfileImage(imageDataUrl);
        message.success("Profile image updated!");

        const payload = {
          user_id: loginUserId,
          profile_image: imageDataUrl,
        };

        try {
          const response = await updateProfileImage(payload);
          console.log("Profile updated:", response);
        } catch (error) {
          console.error("Failed to update profile:", error);
        }
      };

      reader.readAsDataURL(file);
    } else {
      message.error("Please upload a valid image file");
    }
  };

  const [profileStats, setProfileStats] = useState({
    completionPercentage: 0,
    lastUpdated: "",
    jobPreferences: [],
    applicationStats: {
      jobsThisMonth: 0,
      interviewsScheduled: 0,
    },
  });

  useEffect(() => {
    // Calculate profile completion percentage
    const calculateCompletion = () => {
      const sections = [
        isAbout,
        isResume,
        isSkills.length > 0,
        isWorkExp,
        isEducation.length > 0,
        isProjects.length > 0,
        Object.values(isSocialLinks).some((link) => link),
      ];

      const completedSections = sections.filter(Boolean).length;
      const percentage = Math.round(
        (completedSections / sections.length) * 100
      );

      // ⭐ Save the correct new value
      localStorage.setItem("profileProgress", percentage);

      return percentage;
    };

    // Extract job preferences
    const extractJobPreferences = () => {
      const preferences = [];

      if (userTypeactiveButton) preferences.push(userTypeactiveButton);
      if (location) preferences.push(location);

      return preferences;
    };

    const completion = calculateCompletion();

    // Set final stats
    setProfileStats({
      completionPercentage: completion,
      lastUpdated: createdAt || new Date().toISOString(),
      jobPreferences: extractJobPreferences(),
      applicationStats: {
        jobsThisMonth: 0,
        interviewsScheduled: 0,
      },
    });
  }, [
    isAbout,
    isResume,
    isSkills,
    isWorkExp,
    isEducation,
    isProjects,
    isSocialLinks,
    userTypeactiveButton,
    location,
    createdAt
  ]);



  // --- Tab Content Components ---
  const TabContent = {
    basic: () => (
      <Form
        layout="vertical"
        name="multi-step-form"
        className="multi-step-form"
        form={form}
      >
        {detailsLoading ? (
          <Skeleton active />
        ) : (
          <div>
            <div className="form-row">
              <div className="form-group">
                <CommonInputField
                  label="First Name"
                  mandatory={true}
                  value={fname}
                  placeholder="Enter your first name"
                  onChange={(e) => {
                    setFname(e.target.value);
                    setFnameError(nameValidator(e.target.value));
                  }}
                  error={fnameError}
                />
              </div>
              <div className="form-group">
                <CommonInputField
                  label="Last Name"
                  mandatory={true}
                  value={lname}
                  placeholder="Enter your Last Name"
                  type="text"
                  onChange={(e) => {
                    setLname(e.target.value);
                    setLnameError(nameValidator(e.target.value));
                  }}
                  error={lnameError}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <CommonInputField
                  name="email"
                  label="Email"
                  mandatory={true}
                  value={email}
                  placeholder="Enter your Email"
                  readOnly={true}
                  disabled={true}
                  error={emailError}
                />
              </div>
              <div className="form-group">
                <CommonInputField
                  name="Mobile"
                  label="Mobile"
                  mandatory={true}
                  value={phoneNumber}
                  placeholder="Enter your mobile"
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setPhoneNumberError(phoneValidation(e.target.value));
                  }}
                  error={phoneNumberError}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <CommonInputField
                  name="dob"
                  label="Date of Birth"
                  type="date"
                  value={dob}
                  placeholder="YYYY-MM-DD"
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
              <div className="form-group">
                <CommonSelectField
                  label="Marital Status"
                  name="maritalStatus"
                  placeholder="Select Marital Status"
                  value={maritalStatus}
                  options={[
                    { value: "Single", label: "Single" },
                    { value: "Married", label: "Married" },
                    { value: "Divorced", label: "Divorced" },
                    { value: "Other", label: "Other" },
                  ]}
                  onChange={(val) => setMaritalStatus(val)}
                />
              </div>
            </div>

            <div style={{ marginTop: 24, marginBottom: 24, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '0.2px' }}>Gender</p>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Select your gender to complete your profile details.</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0', gap: '4px' }}>
                  {genderOptions.map((item) => {
                    const mappedName = item.name === "Male" ? "Man" : item.name === "Female" ? "Woman" : item.name;
                    const isActive = gender === mappedName || gender === item.name || genderActiveButton === mappedName || genderActiveButton === item.name;
                    return (
                      <button
                        key={item.id || item.name}
                        type="button"
                        onClick={() => {
                          handleButtonClick(mappedName);
                          setGender(mappedName);
                          setGenderError("");
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 500,
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          border: isActive ? '1px solid rgba(104, 0, 173, 0.1)' : '1px solid transparent',
                          ...(isActive
                            ? { backgroundColor: '#ffffff', color: '#6800ad', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }
                            : { backgroundColor: 'transparent', color: '#64748b' })
                        }}
                      >
                        {item.name === "Male" ? (
                          <IoIosMale />
                        ) : item.name === "Female" ? (
                          <IoFemaleOutline />
                        ) : item.name === "Transgender" ? (
                          <PiGenderTransgender />
                        ) : item.name === "Intersex" ? (
                          <PiGenderIntersex />
                        ) : item.name === "Non-binary" ? (
                          <PiGenderNonbinary />
                        ) : item.name === "Others" ? (
                          <MdNotInterested />
                        ) : (
                          ""
                        )}{" "}
                        {item.name === "Male" ? "Man" : item.name === "Female" ? "Woman" : item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              {genderError && (
                <div style={{ color: "red", marginTop: 6, fontSize: 13 }}>
                  {genderError}
                </div>
              )}
            </div>



            <div style={{ marginTop: 24, marginBottom: 24, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '0.2px' }}>Experience Status</p>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Select your status to customize your profile details.</p>
                </div>
                <div style={{ display: 'flex', backgroundColor: '#f8fafc', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      handleExperienceTypeChange("Fresher");
                      setSelectExperienceType("Fresher");
                      setSelectExperienceTypeError("");
                      setTotalYearsExperience("");
                      setTotalMonthsExperience("");
                    }}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      border: selectExperienceType === "Fresher" ? '1px solid rgba(104, 0, 173, 0.1)' : '1px solid transparent',
                      ...(selectExperienceType === "Fresher"
                        ? { backgroundColor: '#ffffff', color: '#6800ad', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }
                        : { backgroundColor: 'transparent', color: '#64748b' })
                    }}
                  >
                    🎓 I am a Fresher
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExperienceTypeChange("Experience");
                      setSelectExperienceType("Experience");
                      setSelectExperienceTypeError("");
                      setTotalYearsExperience("");
                      setTotalMonthsExperience("");
                    }}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      border: selectExperienceType === "Experience" ? '1px solid rgba(104, 0, 173, 0.1)' : '1px solid transparent',
                      ...(selectExperienceType === "Experience"
                        ? { backgroundColor: '#ffffff', color: '#6800ad', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }
                        : { backgroundColor: 'transparent', color: '#64748b' })
                    }}
                  >
                    💼 I have Experience
                  </button>
                </div>
              </div>
              {selectExperienceTypeError && (
                <div style={{ color: "red", marginTop: 6, fontSize: 13 }}>
                  {selectExperienceTypeError}
                </div>
              )}
            </div>

            <div className="form-row">
              {experienceType === "Experience" && (
                <>
                  <div className="form-group">
                    <CommonSelectField
                      label="Total Years of Experience"
                      name="totalexperience"
                      mandatory={true}
                      placeholder="Select Experience"
                      value={totalYearsExperience}
                      options={[
                        {
                          value: "0 Years",
                          label: "0 Years",
                        },
                        {
                          value: "1 Years",
                          label: "1 Years",
                        },
                        {
                          value: "2 Years",
                          label: "2 Years",
                        },
                        {
                          value: "3 Years",
                          label: "3 Years",
                        },
                        {
                          value: "4 Years",
                          label: "4 Years",
                        },
                        {
                          value: "5 Years",
                          label: "5 Years",
                        },
                        {
                          value: "6 Years",
                          label: "6 Years",
                        },
                        {
                          value: "7 Years",
                          label: "7 Years",
                        },
                        {
                          value: "8 Years",
                          label: "8 Years",
                        },
                        {
                          value: "9 Years",
                          label: "9 Years",
                        },
                        {
                          value: "10 Years",
                          label: "10 Years",
                        },
                        {
                          value: "11 Years",
                          label: "11 Years",
                        },
                      ]}
                      showSearch={true}
                      onChange={(value) => {
                        setTotalYearsExperience(value);
                        setTotalYearsExperienceError(selectValidator(value));
                      }}
                      error={totalYearsExperienceError}
                    />
                  </div>
                  <div className="form-group">
                    <CommonSelectField
                      label="Total Months of Experience"
                      name="experiencemonth"
                      mandatory={true}
                      placeholder="Select Experience"
                      value={totalMonthsExperience}
                      options={[
                        {
                          value: "0 Month",
                          label: "0 Month",
                        },
                        {
                          value: "1 Month",
                          label: "1 Month",
                        },
                        {
                          value: "2 Months",
                          label: "2 Months",
                        },
                        {
                          value: "3 Months",
                          label: "3 Months",
                        },
                        {
                          value: "4 Months",
                          label: "4 Months",
                        },
                        {
                          value: "5 Months",
                          label: "5 Months",
                        },
                        {
                          value: "6 Months",
                          label: "6 Months",
                        },
                        {
                          value: "7 Months",
                          label: "7 Months",
                        },
                        {
                          value: "8 Months",
                          label: "8 Months",
                        },
                        {
                          value: "9 Months",
                          label: "9 Months",
                        },
                        {
                          value: "10 Months",
                          label: "10 Months",
                        },
                        {
                          value: "11 Months",
                          label: "11 Months",
                        },
                        {
                          value: "12 Months",
                          label: "12 Months",
                        },
                      ]}
                      onChange={(value) => {
                        setTotalMonthsExperience(value);
                        setTotalMonthsExperienceError(selectValidator(value));
                      }}
                      showSearch={true}
                      error={totalMonthsExperienceError}
                    />
                  </div>
                </>
              )}
            </div>

            <div style={{ marginTop: 0 }} className="form-group">
              <CommonInputField
                name="location"
                label="Location"
                mandatory={true}
                value={location}
                placeholder="Enter your Location"
                type="text"
                onChange={(e) => {
                  setLocation(e.target.value);
                  setLocationError(nameValidator(e.target.value));
                }}
                error={locationError}
              />
            </div>

            <div style={{ marginTop: 0 }} className="form-group">
              <CommonInputField
                name="currentSalary"
                label="Current Salary"
                value={currentSalary}
                placeholder="e.g. ₹3,50,000 / Year or 10 LPA"
                type="text"
                onChange={(e) => setCurrentSalary(e.target.value)}
              />
            </div>
            <div style={{ textAlign: "-webkit-right" }} className="save_btn">
              <Button
                type="primary"
                size="large"
                onClick={handleSave}
                className="nav-btn next-btn"
              >
                <MdFileDownloadDone style={{ fontSize: 22 }} />
                Update
              </Button>
            </div>
          </div>
        )}
      </Form>
    ),

    preferences: () => (
      <div>
        <Title level={4}>Career Preferences & Availability</Title>
        <Text type="secondary">
          Set your target job roles, preferred work locations, and notice period so recruiters can find the right match.
        </Text>
        <Divider style={{ margin: "16px 0" }} />

        <div className="form-group" style={{ marginBottom: 16 }}>
          <CommonInputField
            label="Preferred Job Roles"
            name="preferredRoles"
            value={preferredRoles}
            placeholder="e.g. Frontend Developer, Fullstack Developer"
            onChange={(e) => setPreferredRoles(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <CommonSelectField
              label="Preferred Job Type"
              name="preferredJobType"
              placeholder="Select Job Type"
              value={preferredJobType}
              options={[
                { value: "Full Time", label: "Full Time" },
                { value: "Part Time", label: "Part Time" },
                { value: "Contract", label: "Contract" },
                { value: "Internship", label: "Internship" },
                { value: "Freelance", label: "Freelance" },
              ]}
              onChange={(val) => setPreferredJobType(val)}
            />
          </div>
          <div className="form-group">
            <CommonSelectField
              label="Willing to Relocate"
              name="willingToRelocate"
              placeholder="Select"
              value={willingToRelocate}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]}
              onChange={(val) => setWillingToRelocate(val)}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <CommonInputField
            label="Preferred Locations"
            name="preferredLocations"
            value={preferredLocations}
            placeholder="e.g. Chennai, Bangalore, Remote"
            onChange={(e) => setPreferredLocations(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <CommonSelectField
              label="Notice Period"
              name="noticePeriod"
              placeholder="Select Notice Period"
              value={noticePeriod}
              options={[
                { value: "Immediate", label: "Immediate" },
                { value: "15 Days", label: "15 Days" },
                { value: "1 Month", label: "1 Month" },
                { value: "2 Months", label: "2 Months" },
                { value: "3 Months", label: "3 Months" },
              ]}
              onChange={(val) => setNoticePeriod(val)}
            />
          </div>
          <div className="form-group">
            <CommonInputField
              label="Available From"
              name="availableFrom"
              value={availableFrom}
              placeholder="e.g. Immediate or DD Mon YYYY"
              onChange={(e) => setAvailableFrom(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 20 }}>
          <CommonInputField
            label="Expected Salary"
            name="expectedSalary"
            value={expectedSalary}
            placeholder="e.g. ₹5,00,000 / Year"
            onChange={(e) => setExpectedSalary(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 20 }}>
          <CommonInputField
            label="Current Salary"
            name="currentSalary"
            value={currentSalary}
            placeholder="e.g. ₹3,50,000 / Year"
            onChange={(e) => setCurrentSalary(e.target.value)}
          />
        </div>

        <div style={{ textAlign: "right" }} className="save_btn">
          <Button
            type="primary"
            size="large"
            onClick={handleSavePreferences}
            className="nav-btn next-btn"
          >
            <MdFileDownloadDone style={{ fontSize: 22 }} />
            Save Preferences
          </Button>
        </div>
      </div>
    ),

    resume: () => (
      <>
        {detailsLoading ? (
          <Skeleton active />
        ) : (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Title level={4} style={{ margin: 0 }}>Resume</Title>
              <Text type="secondary" style={{ fontSize: 15 }}>
                Remember that one pager that highlights how amazing you are? Time
                to let employers notice your potential through it.
              </Text>
            </div>

            {/* Show uploaded resume if available */}
            {isResume && (
              <div
                style={{
                  border: "1px solid #e8e8e8",
                  borderRadius: 12,
                  padding: "20px 24px",
                  marginTop: 24,
                  background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.3s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(95, 46, 234, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <FileText
                      style={{
                        color: "#5f2eea",
                        fontSize: 24,
                      }}
                    />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 16, color: "#1a1a1a" }}>Current Resume</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Uploaded resume is ready for employers to view
                    </Text>
                  </div>
                </div>
                <Space>
                  <Button
                    type="primary"
                    icon={<Eye size={18} style={{ marginRight: 4 }} />}
                    style={{
                      background: "#5f2eea",
                      boxShadow: "0 2px 6px rgba(95, 46, 234, 0.3)",
                      color: "#fff",
                      borderRadius: 8,
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      fontWeight: 500
                    }}
                    onClick={() => {
                      if (isResume.startsWith("http")) {
                        window.open(isResume, "_blank");
                      } else if (isResume.startsWith("data:application/pdf")) {
                        const win = window.open("", "_blank");
                        win.document.write(`
                          <iframe 
                            width="100%" 
                            height="100%" 
                            src="${isResume}" 
                            frameborder="0"
                          ></iframe>
                        `);
                      } else {
                        const a = document.createElement("a");
                        a.href = isResume;
                        a.download = "resume.pdf";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }
                    }}
                  >
                    View Resume
                  </Button>
                </Space>
              </div>
            )}

            <div style={{ marginTop: 32 }}>
              <Text strong style={{ fontSize: 16, display: "block", marginBottom: 16, color: "#262626" }}>
                {isResume ? "Upload a New Resume" : "Upload Your Resume"}
              </Text>

              <Upload.Dragger
                name="resume"
                showUploadList={false}
                accept=".doc,.docx,.pdf"
                maxCount={1}
                beforeUpload={handleBeforeUpload}
                style={{
                  background: "#fafafa",
                  border: "2px dashed #d9d9d9",
                  borderRadius: 12,
                  padding: "40px 0",
                  transition: "all 0.3s",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "rgba(95, 46, 234, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16
                  }}>
                    <UploadCloud style={{ color: "#5f2eea", width: 36, height: 36 }} />
                  </div>
                  <p className="ant-upload-text" style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a", margin: "0 0 8px 0" }}>
                    Click or drag file to this area to upload
                  </p>
                  <p className="ant-upload-hint" style={{ color: "#8c8c8c", fontSize: 14, margin: 0 }}>
                    Supported file formats: DOC, DOCX, PDF. File size limit: 10 MB.
                  </p>
                </div>
              </Upload.Dragger>

              {resumeFile && (
                <div style={{
                  marginTop: 24,
                  padding: "16px 24px",
                  background: "#f0f5ff",
                  border: "1px solid #adc6ff",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(47, 84, 235, 0.05)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "rgba(47, 84, 235, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <FileCheck style={{ color: "#2f54eb", fontSize: 20 }} />
                    </div>
                    <div>
                      <Text style={{ color: "#595959", fontSize: 13, display: "block", marginBottom: 2 }}>Selected File</Text>
                      <Text strong style={{ color: "#1d39c4", fontSize: 15 }}>{resumeFile.name}</Text>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    style={{
                      background: "#5f2eea",
                      borderRadius: 8,
                      boxShadow: "0 2px 6px rgba(95, 46, 234, 0.3)",
                      fontWeight: 500
                    }}
                    onClick={handleFileSave}
                  >
                    {isResume ? "Confirm Replacement" : "Save Resume"}
                  </Button>
                </div>
              )}

              {resumeError && (
                <div style={{ marginTop: 16 }}>
                  <Alert message={resumeError} type="error" showIcon style={{ borderRadius: 8 }} />
                </div>
              )}
            </div>
          </div>
        )}
      </>
    ),

    about: () => (
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 24,
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        }}
      >
        {detailsLoading ? (
          <Skeleton active />
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center" }}>
              <CheckCircleFilled style={{ color: "#00c853", marginRight: 8 }} />
              <Title level={4} style={{ margin: 0 }}>
                About
              </Title>
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: "#888" }}>
                About gives you a chance to showcase your personality, skills,
                and aspirations. Use this space to tell your story, highlight
                your achievements, and share what makes you unique.
              </div>
            </div>

            <CommonTextArea
              style={{ height: 280 }}
              mandatory={true}
              rows={6}
              label={"About"}
              value={aboutTextNew}
              onChange={(e) => {
                setAboutTextNew(e.target.value);
                setAboutTextError(descriptionValidator(e.target.value));
              }}
              error={aboutTextError}
            />

            <div style={{ textAlign: "-webkit-right" }} className="save_btn">
              <Button
                type="primary"
                size="large"
                onClick={handleAboutSave}
                className="nav-btn next-btn"
              >
                <MdFileDownloadDone style={{ fontSize: 22 }} />
                {aboutData ? "Update" : "Save"}
              </Button>
            </div>
          </>
        )}
      </div>
    ),

    skills: () => (
      <>
        {detailsLoading ? (
          <Skeleton active />
        ) : (
          <div
            className="drawer_skills"
            style={{
              background: "#fff",
              borderRadius: '12px',
              padding: '24px 28px',
              border: '1px solid #e2e8f0',
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5effc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Sparkles style={{ color: "#6800ad", width: 18, height: 18 }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, color: '#0f172a' }}>Skills & Competencies</Title>
                <Text type="secondary" style={{ fontSize: 13, marginTop: 2 }}>Highlight your technical and professional expertise.</Text>
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <Text strong style={{ fontSize: 13.5, color: '#1e293b' }}>Suggested for you</Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 12 }}>
                {suggestions.map((skill) => (
                  <Tag
                    key={skill}
                    onClick={() => handleAddSkill(skill)}
                    style={{
                      margin: 0,
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      padding: '6px 14px',
                      transition: 'all 0.2s ease',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#6800ad';
                      e.currentTarget.style.color = '#6800ad';
                      e.currentTarget.style.backgroundColor = '#f5effc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.color = '#475569';
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    <Plus style={{ width: 12, height: 12 }} /> {skill}
                  </Tag>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 28, background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px dashed #cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <CommonInputField
                    label={"Add a Custom Skill"}
                    onPressEnter={handleCustomSkillAdd}
                    value={customSkill}
                    name={"Skills"}
                    onChange={(e) => {
                      setCustomSkill(e.target.value);
                      if (customSkillError) setCustomSkillError("");
                    }}
                    mandatory={false}
                    placeholder={"e.g. Project Management, React, Marketing..."}
                    error={customSkillError}
                  />
                </div>
                <Button
                  type="primary"
                  onClick={handleCustomSkillAdd}
                  style={{
                    marginTop: '25px', // Aligns with the input field
                    height: '44px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    color: '#6800ad',
                    border: '1px solid #6800ad',
                    fontWeight: 600,
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Plus style={{ width: 16, height: 16 }} />
                  Add
                </Button>
              </div>

              {selectedSkills.length > 0 && (
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
                  <Text strong style={{ fontSize: 13.5, color: '#1e293b', display: 'block', marginBottom: 12 }}>Your Added Skills</Text>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedSkills.map((skill) => (
                      <Tag
                        key={skill}
                        closable
                        onClose={() => handleRemoveSkill(skill)}
                        style={{
                          margin: 0,
                          fontSize: '13.5px',
                          padding: '6px 14px',
                          border: '1px solid rgba(104, 0, 173, 0.15)',
                          backgroundColor: '#f5effc',
                          color: '#6800ad',
                          borderRadius: '20px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 500
                        }}
                      >
                        {skill}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <Button
                type="primary"
                size="large"
                onClick={handleSkillsSave}
                style={{
                  background: "#6800ad",
                  borderRadius: "8px",
                  fontWeight: 600,
                  height: "44px",
                  padding: "0 24px",
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(104, 0, 173, 0.2)'
                }}
              >
                <MdFileDownloadDone style={{ fontSize: 20 }} />
                Save Skills
              </Button>
            </div>
          </div>
        )}
      </>
    ),

    education: () => (
      <>
        {detailsLoading ? (
          <Skeleton active />
        ) : (
          <div>
            {showEducationForm && (
              <>
                <div style={{ background: '#ffffff', borderRadius: '16px', padding: '32px', border: '1px solid rgba(226, 220, 255, 0.6)', boxShadow: '0 4px 20px rgba(95, 46, 234, 0.05)', marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                    {educationData ? "Edit Education Details" : "Add Education Details"}
                  </h4>

                  <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                      <CommonSelectField
                        label="Qualification"
                        name="qualificaton"
                        placeholder="Select Qualification"
                        value={qualificaton}
                        mandatory={true}
                        showSearch={true}
                        optionFilterProp="lable"
                        options={qualificationOptions}
                        onChange={(value) => {
                          setQualification(value);
                          setQualificationError(selectValidator(value));
                        }}
                        error={qualificatonError}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <CommonSelectField
                        label="Course"
                        name="course"
                        placeholder="Select Course"
                        mandatory={true}
                        showSearch={true}
                        optionFilterProp="lable"
                        value={educationCourse}
                        options={educationCourseOptions}
                        onChange={(value) => {
                          setEducationCourse(value);
                          setEducationCourseError(selectValidator(value));
                        }}
                        error={educationCourseError}
                      />
                    </Col>

                    <Col xs={24} md={12}>
                      <CommonSelectField
                        label="Specialization"
                        name="specialization"
                        placeholder="Select Specialization"
                        mandatory={true}
                        value={specialization}
                        showSearch={true}
                        optionFilterProp="lable"
                        options={specializationOptions}
                        onChange={(value) => {
                          setSpecialization(value);
                          setSpecializationError(selectValidator(value));
                        }}
                        error={specializationError}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <CommonSelectField
                        label="College / University"
                        name="Collage"
                        placeholder="Select College"
                        mandatory={true}
                        value={educationCollege}
                        showSearch={true}
                        optionFilterProp="lable"
                        options={collageOptions}
                        onChange={(value) => {
                          setEducationCollege(value);
                          setCollageError(selectValidator(value));
                        }}
                        error={collageError}
                      />
                    </Col>

                    <Col xs={24} md={12}>
                      <CommonSelectField
                        value={educationStartDate}
                        options={educationStartDateOptions}
                        label="Start Year"
                        name="startyear"
                        mandatory={true}
                        placeholder="Start Year"
                        onChange={(value) => {
                          setEducationStartDate(value);
                          if (!value || value.trim() === "") {
                            setEducationStartDateError(" is required");
                          } else {
                            setEducationStartDateError("");
                          }
                        }}
                        error={educationStartDateError}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <CommonSelectField
                        value={educationEndDate}
                        options={educationEndDateOptions}
                        mandatory={true}
                        label="End Year"
                        name="endyear"
                        placeholder="End Year"
                        onChange={(value) => {
                          setEducationEndDate(value);
                          if (!value || value.trim() === "") {
                            setEducationEndDateError(" is required");
                          } else {
                            setEducationEndDateError("");
                          }
                        }}
                        error={educationEndDateError}
                      />
                    </Col>

                    <Col xs={24} md={12}>
                      <CommonSelectField
                        label="Course Type"
                        name="coursetype"
                        placeholder="Select Course Type"
                        mandatory={true}
                        showSearch={true}
                        optionFilterProp="lable"
                        value={courseType}
                        options={courseTypeOptions}
                        onChange={(value) => {
                          setCourseType(value);
                          setCourseTypeError(selectValidator(value));
                        }}
                        error={courseTypeError}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <CommonSelectField
                        label="Are you a Lateral Entry Student?"
                        name="lateralstudent"
                        placeholder="Lateral Entry"
                        showSearch={true}
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={lateral}
                        optionFilterProp="label"
                        onChange={handleLateralTypeChange}
                      />
                    </Col>

                    <Col xs={24} md={8}>
                      <CommonInputField
                        name="percentage"
                        label="Percentage"
                        placeholder="e.g. 85%"
                        type="text"
                        value={percentage}
                        onChange={(e) => {
                          setPercentage(e.target.value);
                        }}
                      />
                    </Col>
                    <Col xs={24} md={8}>
                      <CommonInputField
                        name="cgpa"
                        label="CGPA"
                        placeholder="e.g. 8.5"
                        type="text"
                        value={cgpa}
                        onChange={(e) => {
                          setCgpa(e.target.value);
                        }}
                      />
                    </Col>
                    <Col xs={24} md={8}>
                      <CommonInputField
                        name="rollnumber"
                        label="Roll Number"
                        placeholder="Roll Number"
                        type="number"
                        value={rollNumber}
                        onChange={(e) => {
                          setRollNumber(e.target.value);
                        }}
                      />
                    </Col>
                  </Row>

                  <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f1f5f9', display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: '12px', alignItems: "center" }}>
                      <Button
                        type="default"
                        size="large"
                        onClick={handleEducationDiscard}
                        style={{ borderRadius: '8px', fontWeight: 600, color: '#64748b', borderColor: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <HiMiniXMark size={18} /> Discard
                      </Button>

                      {educationData && (
                        <Popconfirm
                          title="Are you sure you want to remove this education?"
                          description="This will permanently delete this entry."
                          onConfirm={() => handleDeleteEducation(educationData.id)}
                          okText="Yes, Remove"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            danger
                            size="large"
                            style={{ borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}
                          >
                            <MdDeleteForever size={18} /> Remove
                          </Button>
                        </Popconfirm>
                      )}
                    </div>

                    <Button
                      type="primary"
                      size="large"
                      onClick={handleEducationSave}
                      style={{ borderRadius: "8px", fontWeight: 600, padding: "0 28px", display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #7f5af0 0%, #5f2eea 100%)', border: 'none' }}
                    >
                      <MdFileDownloadDone size={20} />
                      {educationData ? "Update Details" : "Save Details"}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {!showEducationForm && (
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(226, 220, 255, 0.6)', boxShadow: '0 4px 20px rgba(95, 46, 234, 0.05)', marginBottom: '24px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #7f5af0 0%, #5f2eea 100%)' }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '14px', background: 'linear-gradient(135deg, #f5effc 0%, #e9e0fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5f2eea', boxShadow: '0 2px 10px rgba(95, 46, 234, 0.1)', flexShrink: 0 }}>
                      <MdSchool style={{ fontSize: 26 }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{educationCollege || "Education Details"}</h3>
                      <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                        <MdDateRange style={{ fontSize: 16, color: '#94a3b8' }} /> {educationStartDate || "Start"} — {educationEndDate || "End"}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setShowEducationForm(true)}
                      style={{ background: '#f8fafc', color: '#5f2eea', border: '1px solid transparent', width: 36, height: 36, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e9e0fe'; e.currentTarget.style.borderColor = '#d4c5f9'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'transparent'; }}
                    >
                      <MdEdit size={18} />
                    </button>
                    <Popconfirm
                      title="Delete your Education?"
                      onConfirm={handleDeleteEducation}
                      okText="Yes"
                      cancelText="No"
                    >
                      <button style={{ background: '#f8fafc', color: '#ef4444', border: '1px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '8px', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = 'transparent'; }}>
                        <MdDeleteForever size={20} />
                      </button>
                    </Popconfirm>
                  </div>
                </div>

                <div style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '28px' }}>
                    <div style={{ flex: '1 1 180px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qualification</span>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginTop: '6px' }}>{qualificaton || "-"}</div>
                    </div>
                    <div style={{ flex: '1 1 180px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Course</span>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginTop: '6px' }}>{educationCourse || "-"}</div>
                    </div>
                    <div style={{ flex: '1 1 180px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Specialization</span>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginTop: '6px' }}>{specialization || "-"}</div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', border: '1px solid #f1f5f9' }}>
                    {[
                      { label: "Course Type", value: courseType, icon: <MdCategory size={16} /> },
                      { label: "Percentage", value: percentage || "N/A", icon: <MdPercent size={16} /> },
                      { label: "CGPA", value: cgpa || "N/A", icon: <MdOutlineCalculate size={16} /> },
                      { label: "Roll No", value: rollNumber || "N/A", icon: <MdConfirmationNumber size={16} /> },
                      { label: "Lateral Entry", value: lateral || "N/A", icon: <MdSwapHoriz size={16} /> },
                    ].map((item, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', padding: '6px 14px', borderRadius: '20px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569', boxShadow: '0 1px 2px rgba(15,23,42,0.02)' }}>
                        <span style={{ color: '#5f2eea', display: 'flex', opacity: 0.8 }}>{item.icon}</span>
                        <span style={{ color: '#64748b', fontWeight: 500 }}>{item.label}:</span>
                        <span style={{ color: '#0f172a', fontWeight: '700' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </>
    ),

    experience: () => (
      <>
        {detailsLoading ? (
          <Skeleton active />
        ) : (
          <div>
            {showWorkExpForm && (
              <>
                <div className="forexprience">
                  {companies.map(
                    (company, index) =>
                      (editingCompanyId === null ||
                        company.id === editingCompanyId) && (
                        <div key={company.id} style={{ background: '#ffffff', borderRadius: '16px', padding: '32px', border: '1px solid rgba(226, 220, 255, 0.6)', boxShadow: '0 4px 20px rgba(95, 46, 234, 0.05)', marginBottom: '24px' }}>
                          <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 24px 0', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                            {company.isNew ? "Add Work Experience" : "Edit Work Experience"}
                          </h4>

                          <Row gutter={[24, 24]}>
                            <Col xs={24}>
                              <CommonInputField
                                label="Company Name"
                                mandatory={true}
                                placeholder="Tech Corp Inc."
                                value={company.workingCompanyName}
                                error={company.workingCompanyNameError}
                                onChange={(e) => {
                                  const updatedCompanies = [...companies];
                                  updatedCompanies[index].workingCompanyName = e.target.value;
                                  updatedCompanies[index].workingCompanyNameError = nameValidator(e.target.value);
                                  setCompanies(updatedCompanies);
                                }}
                              />
                            </Col>

                            <Col xs={24} md={12}>
                              <CommonInputField
                                label="Job Title"
                                mandatory={true}
                                placeholder="Software Engineer"
                                value={company.jobTitle}
                                error={company.jobTitleError}
                                onChange={(e) => {
                                  const updatedCompanies = [...companies];
                                  updatedCompanies[index].jobTitle = e.target.value;
                                  updatedCompanies[index].jobTitleError = nameValidator(e.target.value);
                                  setCompanies(updatedCompanies);
                                }}
                              />
                            </Col>
                            <Col xs={24} md={12}>
                              <CommonInputField
                                label="Designation"
                                mandatory={true}
                                placeholder="Senior Developer"
                                value={company.designation}
                                error={company.designationError}
                                onChange={(e) => {
                                  const updatedCompanies = [...companies];
                                  updatedCompanies[index].designation = e.target.value;
                                  updatedCompanies[index].designationError = nameValidator(e.target.value);
                                  setCompanies(updatedCompanies);
                                }}
                              />
                            </Col>

                            <Col xs={24} md={12}>
                              <CommonSelectField
                                label="Start Year"
                                name="startYear"
                                placeholder="Select Start Year"
                                mandatory={true}
                                value={company.workingStartDate}
                                options={workingStartDateOptions}
                                error={company.workingStartDateError}
                                onChange={(value) => {
                                  const updatedCompanies = [...companies];
                                  updatedCompanies[index].workingStartDate = value;
                                  updatedCompanies[index].workingStartDateError = selectValidator(value);
                                  setCompanies(updatedCompanies);
                                }}
                              />
                            </Col>
                            <Col xs={24} md={12}>
                              <CommonSelectField
                                label="End Year"
                                name="endYear"
                                placeholder="Select End Year"
                                mandatory={!company.currentlyWorking}
                                value={company.workingEndDate}
                                options={workingEndDateOptions}
                                error={company.workingEndDateError}
                                onChange={(value) => {
                                  const updatedCompanies = [...companies];
                                  updatedCompanies[index].workingEndDate = value;
                                  updatedCompanies[index].workingEndDateError = selectValidator(value);
                                  setCompanies(updatedCompanies);
                                }}
                                disabled={company.currentlyWorking}
                              />
                            </Col>

                            <Col xs={24}>
                              <Checkbox
                                checked={company.currentlyWorking}
                                onChange={(e) => {
                                  const updatedCompanies = [...companies];
                                  updatedCompanies[index].currentlyWorking = e.target.checked;
                                  if (e.target.checked) {
                                    updatedCompanies[index].workingEndDate = "";
                                    updatedCompanies[index].workingEndDateError = "";
                                  }
                                  setCompanies(updatedCompanies);
                                }}
                                style={{ fontWeight: 500, color: '#475569' }}
                              >
                                Currently Working Here
                              </Checkbox>
                            </Col>
                          </Row>

                          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f1f5f9', display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Button
                              type="default"
                              size="large"
                              onClick={handleWorkDiscard}
                              style={{ borderRadius: '8px', fontWeight: 600, color: '#64748b', borderColor: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <HiMiniXMark size={18} /> Discard
                            </Button>

                            <Button
                              type="primary"
                              size="large"
                              onClick={handleWorkExpSave}
                              style={{ borderRadius: "8px", fontWeight: 600, padding: "0 28px", display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #7f5af0 0%, #5f2eea 100%)', border: 'none' }}
                            >
                              <MdFileDownloadDone size={20} />
                              {company.isNew ? "Save Details" : "Update Details"}
                            </Button>
                          </div>
                        </div>
                      )
                  )}
                </div>
              </>
            )}

            {!showWorkExpForm && (
              <div className="experience-preview">
                {companies.length > 0 ? (
                  <>
                    <div className="experience-summary-card">
                      <div className="summary-header">
                        <h3>
                          <GiOfficeChair /> Experience Summary
                        </h3>
                      </div>
                      <div className="summary-grid">
                        {[
                          {
                            label: "Experience Type",
                            value: experienceType,
                            icon: <MdOutlineSchool />,
                          },
                          ...(isWorkExp !== "Fresher"
                            ? [
                              {
                                label: "Years of Experience",
                                value: totalYearsExperience,
                                icon: <MdMenuBook />,
                              },
                              {
                                label: "Months of Experience",
                                value: totalMonthsExperience,
                                icon: <MdLocationCity />,
                              },
                            ]
                            : []),
                          {
                            label: "Location",
                            value: location,
                            icon: <IoLocationSharp />,
                          },
                        ].map((item, index) => (
                          <div className="summary-item" key={index}>
                            <div className="icon-wrapper">{item.icon}</div>
                            <div>
                              <div className="item-label">{item.label}</div>
                              <div className="item-value">{item.value || "-"}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>

                    {companies.map((company) => (
                      <motion.div
                        key={company.id}
                        style={{ background: "#fff", border: "1px solid #0000000d" }}
                        className="project-card"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.05,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        whileHover={{
                          y: -6,
                          transition: { duration: 0.3 },
                        }}
                      >
                        <div className="card-content">
                          <div style={{ display: "flex" }} className="card-header">
                            <span
                              className={
                                company.currentlyWorking
                                  ? "currently-working-badge"
                                  : "project-type-badge"
                              }
                            >
                              {company.currentlyWorking
                                ? "Currently Working"
                                : "Past Role"}
                            </span>
                            <div className="card-actions">
                              <button
                                onClick={() => {
                                  setEditingCompanyId(company.id);
                                  setShowWorkExpForm(true);
                                }}
                                className="icon-btn edit-btn"
                              >
                                <FiEdit size={16} />
                              </button>
                            </div>
                          </div>

                          <h3 style={{ color: "#000" }} className="project-title">
                            {company.jobTitle || "Job Title"}
                          </h3>

                          <div className="project-meta">
                            <div style={{ color: "#2a2a2a" }} className="meta-item company">
                              <FiBriefcase className="meta-icon" />
                              <span>
                                {company.workingCompanyName || "Company Name"}
                              </span>
                            </div>
                            <div style={{ color: "#2a2a2a" }} className="meta-item timeline">
                              <MdOutlineWorkHistory className="meta-icon" />
                              <span>
                                {company.workingStartDate || "Start"} —{" "}
                                {company.currentlyWorking
                                  ? "Present"
                                  : company.workingEndDate || "End"}
                              </span>
                            </div>
                          </div>

                          <div className="project-description">
                            <p>
                              <span style={{ color: "#5f2eea" }}>
                                Designation:
                              </span>{" "}
                              {company.designation || "Designation"}
                            </p>
                          </div>

                          <div className="card-footer">
                            <Popconfirm
                              title="Delete this experience?"
                              onConfirm={() =>
                                handleDeleteCompanyWork(company.id)
                              }
                              okText="Yes"
                              cancelText="No"
                            >
                              <button style={{ color: "#dc2626" }} className="icon-btn delete-btn">
                                <MdDeleteForever size={18} />
                              </button>
                            </Popconfirm>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </>
                ) : (
                  <div style={{ textAlign: "center" }} className="empty-state">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span style={{ color: "#666", fontSize: "1rem" }}>
                          No work experience added yet
                        </span>
                      }
                    />
                    <Button
                      type="primary"
                      onClick={() => {
                        setShowWorkExpForm(true);
                        setCompanies([
                          {
                            id: Date.now(),
                            isNew: true,
                            jobTitle: "",
                            workingCompanyName: "",
                            designation: "",
                            workingStartDate: "",
                            workingEndDate: "",
                            currentlyWorking: false,
                          },
                        ]);
                      }}
                      style={{ marginTop: 16, background: "rgb(95, 46, 234)" }}
                    >
                      Add Work Experience
                    </Button>
                  </div>
                )}

                {companies.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "end",
                      marginTop: 20,
                    }}
                  >
                    <Button
                      className="add-company-btn"
                      type="primary"
                      onClick={handleAddCompany}
                      icon={<PlusOutlined />}
                    >
                      Add Company
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </>
    ),

    projects: () => (
      <>
        {detailsLoading ? (
          <Skeleton active />
        ) : (
          <div>
            <div>
              {projectsList.length > 0 && !showForm ? (
                <>
                  <div className="projects-container">
                    <div className="projects-header">
                      <Button
                        type="text"
                        onClick={handleAddNewProject}
                        className="add-project-btn"
                        icon={<FiPlusCircle />}
                      >
                        Add New Project
                      </Button>
                      <div className="projects-header-decoration"></div>
                    </div>

                    <div className="projects-mosaic">
                      {projectsList.map((proj, idx) => (
                        <motion.div
                          key={idx}
                          className="project-card"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.6,
                            delay: idx * 0.05,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          whileHover={{
                            y: -6,
                            transition: { duration: 0.3 },
                          }}
                        >
                          <div className="card-glow"></div>
                          <div className="card-content">
                            <div style={{ display: "flex" }} className="card-header">
                              <span className="project-type-badge">
                                {proj.project_type}
                                <span className="badge-accent"></span>
                              </span>
                              <div className="card-actions">
                                <button
                                  className="icon-btn edit-btn"
                                  onClick={() => {
                                    handleEditProjectItem(proj);
                                  }}
                                >
                                  <FiEdit size={16} />
                                </button>
                              </div>
                            </div>

                            <h3 className="project-title">
                              <span className="title-text">
                                {proj.project_title}
                              </span>
                              <span className="title-underline"></span>
                            </h3>

                            <div className="project-meta">
                              <div className="meta-item company">
                                <FiBriefcase className="meta-icon" />
                                <span>{proj.company_name}</span>
                              </div>
                              <div className="meta-item timeline">
                                <FiCalendar className="meta-icon" />
                                <span>
                                  {proj.start_date} — {proj.end_date}
                                </span>
                              </div>
                            </div>

                            <div className="project-description">
                              <p>{proj.description}</p>
                            </div>

                            <div className="card-footer">
                              <Popconfirm
                                title="Delete this project?"
                                onConfirm={() => handleDeleteCompany(proj.id)}
                                okText="Confirm"
                                cancelText="Cancel"
                              >
                                <button className="icon-btn delete-btn">
                                  <MdDeleteForever size={18} />
                                </button>
                              </Popconfirm>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                showForm && (
                  <div>
                    <div>
                      {
                        <>
                          <div className="form-group">
                            <CommonInputField
                              name="companyName"
                              label="Company Name"
                              mandatory={true}
                              placeholder="Company Name"
                              type="text"
                              value={companyName}
                              onChange={(e) => {
                                setCompanyName(e.target.value);
                                setCompanyNameError(
                                  nameValidator(e.target.value)
                                );
                              }}
                              error={companyNameError}
                            />
                          </div>

                          <div className="form-group">
                            <CommonInputField
                              name="projectname"
                              label="Project Name"
                              mandatory={true}
                              placeholder="Project Name"
                              type="text"
                              value={project}
                              onChange={(e) => {
                                setProject(e.target.value);
                                setProjectError(nameValidator(e.target.value));
                              }}
                              error={projectError}
                            />
                          </div>

                          <div className="form-group">
                            <div className="commoninputfield">
                              <div className="input-label-row">
                                <p className="input-label">
                                  <span className="required-mark">*</span>
                                  Project Type
                                </p>
                              </div>
                              <div className="job_nature">
                                <button
                                  type="button"
                                  className={
                                    activeButton === "Full Time"
                                      ? "job_nature_button_active"
                                      : "job_nature_button"
                                  }
                                  onClick={() => {
                                    handleProjectTypeClick("Full Time");
                                    setProjectType("Full Time");
                                    setProjectTypeError("");
                                  }}
                                >
                                  Full Time
                                </button>

                                <button
                                  type="button"
                                  className={
                                    activeButton === "Part Time"
                                      ? "job_nature_button_active"
                                      : "job_nature_button"
                                  }
                                  onClick={() => {
                                    handleProjectTypeClick("Part Time");
                                    setProjectType("Part Time");
                                    setProjectTypeError("");
                                  }}
                                >
                                  Part Time
                                </button>

                                <button
                                  type="button"
                                  className={
                                    activeButton === "Freelance"
                                      ? "job_nature_button_active"
                                      : "job_nature_button"
                                  }
                                  onClick={() => {
                                    handleProjectTypeClick("Freelance");
                                    setProjectType("Freelance");
                                    setProjectTypeError("");
                                  }}
                                >
                                  Freelance
                                </button>
                              </div>
                              <div
                                className={
                                  projectTypeError
                                    ? "show-premium-input-error"
                                    : "hide-premium-input-error"
                                }
                              >
                                {projectTypeError && (
                                  <p className="premium-error-text">
                                    Project type {projectTypeError}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{ alignItems: "center", marginTop: 15 }}
                            className="form-row"
                          >
                            <div className="form-group">
                              <CommonDatePicker
                                value={projectStartDate}
                                label="Start Date"
                                name="enddate"
                                placeholder="Start Date"
                                onChange={(value) => {
                                  setProjectStartDate(value);

                                  if (!value || value.trim() === "") {
                                    setProjectStartDateError(" is required");
                                  } else {
                                    setProjectStartDateError("");
                                  }
                                }}
                                error={projectStartDateError}
                              />
                            </div>

                            <div className="form-group">
                              <CommonDatePicker
                                value={projectEndDate}
                                label="End Date"
                                name="enddate"
                                placeholder="End Date"
                                onChange={(value) => {
                                  setProjectEndDate(value);

                                  if (!value || value.trim() === "") {
                                    setProjectEndDateError(" is required");
                                  } else {
                                    setProjectEndDateError("");
                                  }
                                }}
                                error={projectEndDateError}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <CommonTextArea
                              label={"Project Description"}
                              placeholder={"Enter your description"}
                              mandatory={true}
                              name={"description"}
                              value={projectDescription}
                              onChange={(e) => {
                                setProjectDescription(e.target.value);
                                setProjectDescriptionError(
                                  descriptionValidator(e.target.value)
                                );
                              }}
                              error={projectDescriptionError}
                            />
                          </div>
                          <div className="form-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <Button
                                type="default"
                                size="large"
                                onClick={handleProjectDiscard}
                                className="nav-btn discard-btn"
                              >
                                Discard
                                <HiMiniXMark style={{ fontSize: 20, marginLeft: 4 }} />
                              </Button>

                              {projectData?.id && (
                                <Popconfirm
                                  title="Are you sure you want to remove this project?"
                                  description="This will permanently delete this project from your profile."
                                  onConfirm={() => handleDeleteCompany(projectData.id)}
                                  okText="Yes, Remove"
                                  cancelText="Cancel"
                                  okButtonProps={{ danger: true }}
                                >
                                  <Button
                                    danger
                                    size="large"
                                    className="nav-btn"
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                      borderColor: "#ef4444",
                                      color: "#ef4444",
                                      borderRadius: "8px",
                                      fontWeight: 600
                                    }}
                                  >
                                    <MdDeleteForever size={20} />
                                    Remove
                                  </Button>
                                </Popconfirm>
                              )}
                            </div>
                            <div
                              style={{ textAlign: "-webkit-right" }}
                              className="save_btn"
                            >
                              <Button
                                type="primary"
                                size="large"
                                onClick={handleProjectSave}
                                className="nav-btn next-btn"
                              >
                                {projectData ? "Update" : "Save"}
                              </Button>
                            </div>
                          </div>
                        </>
                      }
                    </div>
                  </div>
                )
              )}

              {/* ✅ When all projects are deleted, show this as fallback */}
              {projectsList.length === 0 && !showForm && (
                <div style={{ marginTop: 20 }}>
                  <Button type="dashed" onClick={handleAddNewProject}>
                    + Add Project
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    ),

    sociallinks: () => (
      <>
        {detailsLoading ? (
          <Skeleton active />
        ) : (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Title level={4} style={{ margin: 0 }}>Social Links</Title>
              <Text type="secondary" style={{ fontSize: 15 }}>
                Connect your social profiles to let employers know more about you.
              </Text>
            </div>

            <div style={{ background: "#ffffff", borderRadius: 16, padding: "32px", border: "1px solid #e8e8e8", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
              <Row gutter={24}>
                <Col xs={24} md={12} style={{ marginBottom: 20 }}>
                  <CommonInputField name="Linkedin" label="Linkedin" placeholder="Add link" type="text" value={socialLinks.Linkedin} onChange={(e) => handleSocialLinksSave("Linkedin", e.target.value)} error={socialLinkErrors.Linkedin} />
                </Col>
                <Col xs={24} md={12} style={{ marginBottom: 20 }}>
                  <CommonInputField name="Facebook" label="Facebook" placeholder="Add link" type="text" value={socialLinks.Facebook} onChange={(e) => handleSocialLinksSave("Facebook", e.target.value)} error={socialLinkErrors.Facebook} />
                </Col>
              </Row>
              <Row gutter={24}>
                <Col xs={24} md={12} style={{ marginBottom: 20 }}>
                  <CommonInputField name="Instagram" label="Instagram" placeholder="Add link" type="text" value={socialLinks.Instagram} onChange={(e) => handleSocialLinksSave("Instagram", e.target.value)} error={socialLinkErrors.Instagram} />
                </Col>
                <Col xs={24} md={12} style={{ marginBottom: 20 }}>
                  <CommonInputField name="Twitter" label="Twitter" placeholder="Add link" type="text" value={socialLinks.Twitter} onChange={(e) => handleSocialLinksSave("Twitter", e.target.value)} error={socialLinkErrors.Twitter} />
                </Col>
              </Row>
              <Row gutter={24}>
                <Col xs={24} md={12} style={{ marginBottom: 20 }}>
                  <CommonInputField name="Dribbble" label="Dribbble" placeholder="Add link" type="text" value={socialLinks.Dribbble} onChange={(e) => handleSocialLinksSave("Dribbble", e.target.value)} error={socialLinkErrors.Dribbble} />
                </Col>
                <Col xs={24} md={12} style={{ marginBottom: 20 }}>
                  <CommonInputField name="Behance" label="Behance" placeholder="Add link" type="text" value={socialLinks.Behance} onChange={(e) => handleSocialLinksSave("Behance", e.target.value)} error={socialLinkErrors.Behance} />
                </Col>
              </Row>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, paddingTop: 24, borderTop: "1px solid #f0f0f0" }}>
                <Button type="primary" size="large" onClick={handleAddSocialLinks} style={{ background: "#5f2eea", borderRadius: 8, padding: "0 32px", fontWeight: 600, boxShadow: "0 4px 12px rgba(95, 46, 234, 0.2)" }}>Save Links</Button>
              </div>
            </div>
          </div>
        )}
      </>
    ),

    certifications: () => (
      <div>
        <Title level={4}>Certifications & Licenses</Title>
        <Text type="secondary">
          Add industry certifications, licenses, and verified online course completions.
        </Text>
        <Divider style={{ margin: "16px 0" }} />

        {/* Existing Certifications */}
        {certifications && certifications.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: "block", marginBottom: 12 }}>
              Your Certifications ({certifications.length})
            </Text>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {certifications.map((cert, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>
                      {cert.title}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {cert.issuer} {cert.issue_year ? `• ${cert.issue_year}` : ""}
                    </div>
                    {cert.url && (
                      <a
                        href={cert.url.startsWith("http") ? cert.url : `https://${cert.url}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12, color: "#6800ad" }}
                      >
                        View Credential
                      </a>
                    )}
                  </div>
                  <Button
                    danger
                    type="text"
                    icon={<Trash2 size={15} />}
                    onClick={() => {
                      const updated = certifications.filter((_, i) => i !== idx);
                      handleSaveCertifications(updated);
                    }}
                  />
                </div>
              ))}
            </div>
            <Divider style={{ margin: "20px 0" }} />
          </div>
        )}

        {/* Add New Certification Form */}
        <div style={{ background: "#ffffff", borderRadius: 16, padding: "32px", border: "1px solid #e8e8e8", boxShadow: "0 8px 24px rgba(0,0,0,0.04)", marginTop: 24 }}>
          <div style={{ marginBottom: 32, paddingBottom: 20, borderBottom: "1px solid #f0f0f0" }}>
            <Title level={4} style={{ margin: 0, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "rgba(95, 46, 234, 0.1)", padding: 8, borderRadius: 8, display: "flex" }}>
                <Award size={20} style={{ color: "#5f2eea" }} />
              </div>
              Add New Certification
            </Title>
            <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: "block" }}>
              Include industry certifications, licenses, and verified online courses to boost your profile.
            </Text>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <CommonInputField
                label="Certificate Name / Title"
                value={newCertTitle}
                placeholder="e.g. AWS Certified Solutions Architect, React Developer"
                onChange={(e) => setNewCertTitle(e.target.value)}
              />
            </div>

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <CommonInputField
                    label="Issuing Organization"
                    value={newCertIssuer}
                    placeholder="e.g. Amazon Web Services, Meta, Coursera"
                    onChange={(e) => setNewCertIssuer(e.target.value)}
                  />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <CommonInputField
                    label="Issue Year / Date"
                    value={newCertYear}
                    placeholder="e.g. 2024"
                    onChange={(e) => setNewCertYear(e.target.value)}
                  />
                </div>
              </Col>
            </Row>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <CommonInputField
                label="Credential URL (Optional)"
                value={newCertUrl}
                placeholder="https://..."
                onChange={(e) => setNewCertUrl(e.target.value)}
              />
            </div>

            <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
              <Button
                type="primary"
                size="large"
                style={{ background: "#5f2eea", borderRadius: 8, padding: "0 32px", fontWeight: 600, boxShadow: "0 4px 12px rgba(95, 46, 234, 0.2)", display: "flex", alignItems: "center", gap: 8 }}
                onClick={() => {
                  if (!newCertTitle.trim()) {
                    message.warning("Please enter a certification title");
                    return;
                  }
                  const newEntry = {
                    id: Date.now(),
                    title: newCertTitle.trim(),
                    issuer: newCertIssuer.trim(),
                    issue_year: newCertYear.trim(),
                    url: newCertUrl.trim(),
                  };
                  const updated = [...certifications, newEntry];
                  handleSaveCertifications(updated);
                  setNewCertTitle("");
                  setNewCertIssuer("");
                  setNewCertYear("");
                  setNewCertUrl("");
                }}
              >
                <Plus size={18} /> Add to Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    ),

    accomplishments: () => (
      <div>
        <Title level={4}>Accomplishments & Awards</Title>
        <Text type="secondary">
          Add key milestones, awards, achievements, or notable contributions.
        </Text>
        <Divider style={{ margin: "16px 0" }} />

        {/* Existing Accomplishments */}
        {accomplishments && accomplishments.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: "block", marginBottom: 12 }}>
              Your Accomplishments ({accomplishments.length})
            </Text>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {accomplishments.map((acc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{acc.icon || "🏆"}</span>
                    <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>
                      {typeof acc === "string" ? acc : acc.title || acc.description}
                    </span>
                  </div>
                  <Button
                    danger
                    type="text"
                    icon={<Trash2 size={15} />}
                    onClick={() => {
                      const updated = accomplishments.filter((_, i) => i !== idx);
                      handleSaveAccomplishments(updated);
                    }}
                  />
                </div>
              ))}
            </div>
            <Divider style={{ margin: "20px 0" }} />
          </div>
        )}

        {/* Add New Accomplishment Form */}
        <div style={{ background: "#ffffff", borderRadius: 16, padding: "32px", border: "1px solid #e8e8e8", boxShadow: "0 8px 24px rgba(0,0,0,0.04)", marginTop: 24 }}>
          <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #f0f0f0" }}>
            <Title level={5} style={{ margin: 0, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "rgba(95, 46, 234, 0.1)", padding: 8, borderRadius: 8, display: "flex" }}>
                <Trophy size={18} style={{ color: "#5f2eea" }} />
              </div>
              Add Accomplishment
            </Title>
          </div>
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <CommonSelectField
                  label="Icon"
                  value={newAccIcon}
                  options={[
                    { value: "🏆", label: "🏆 Trophy" },
                    { value: "⭐", label: "⭐ Star" },
                    { value: "⚡", label: "⚡ Lightning" },
                    { value: "🥇", label: "🥇 First" },
                    { value: "🎯", label: "🎯 Target" },
                    { value: "🚀", label: "🚀 Rocket" },
                  ]}
                  onChange={(val) => setNewAccIcon(val)}
                />
              </div>
            </Col>
            <Col xs={24} md={16}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <CommonInputField
                  label="Description"
                  value={newAccTitle}
                  placeholder="e.g. Delivered 5+ client applications on time with 99.9% uptime"
                  onChange={(e) => setNewAccTitle(e.target.value)}
                />
              </div>
            </Col>
          </Row>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="primary"
              size="large"
              onClick={() => {
                if (!newAccTitle.trim()) {
                  message.warning("Please enter an accomplishment description");
                  return;
                }
                const newEntry = {
                  id: Date.now(),
                  icon: newAccIcon,
                  title: newAccTitle.trim(),
                };
                const updated = [...accomplishments, newEntry];
                handleSaveAccomplishments(updated);
                setNewAccTitle("");
              }}
              style={{ background: "#5f2eea", borderRadius: 8, padding: "0 32px", fontWeight: 600, boxShadow: "0 4px 12px rgba(95, 46, 234, 0.2)", display: "flex", alignItems: "center", gap: 8 }}
            >
              <Plus size={18} /> Add Accomplishment
            </Button>
          </div>
        </div>
      </div>
    ),

    languages: () => (
      <div>
        <Title level={4}>Languages</Title>
        <Text type="secondary">
          Highlight the languages you can speak, read, and write in professional settings.
        </Text>
        <Divider style={{ margin: "16px 0" }} />

        {/* Existing Languages */}
        {languages && languages.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Text strong style={{ display: "block", marginBottom: 12 }}>
              Added Languages
            </Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {languages.map((lang, idx) => {
                const label = typeof lang === "string" ? lang : `${lang.name} (${lang.proficiency})`;
                return (
                  <Tag
                    key={idx}
                    closable
                    onClose={() => {
                      const updated = languages.filter((_, i) => i !== idx);
                      handleSaveLanguages(updated);
                    }}
                    style={{
                      padding: "6px 12px",
                      fontSize: 13,
                      borderRadius: 16,
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      color: "#1e293b",
                    }}
                  >
                    {label}
                  </Tag>
                );
              })}
            </div>
            <Divider style={{ margin: "20px 0" }} />
          </div>
        )}

        {/* Add Language Form */}
        <div style={{ background: "#ffffff", borderRadius: 16, padding: "32px", border: "1px solid #e8e8e8", boxShadow: "0 8px 24px rgba(0,0,0,0.04)", marginTop: 24 }}>
          <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #f0f0f0" }}>
            <Title level={5} style={{ margin: 0, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ background: "rgba(95, 46, 234, 0.1)", padding: 8, borderRadius: 8, display: "flex" }}>
                <Globe size={18} style={{ color: "#5f2eea" }} />
              </div>
              Add Language
            </Title>
          </div>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <CommonInputField
                  label="Language"
                  value={newLangName}
                  placeholder="e.g. English, French, Hindi, Spanish"
                  onChange={(e) => setNewLangName(e.target.value)}
                />
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <CommonSelectField
                  label="Proficiency"
                  value={newLangProf}
                  options={[
                    { value: "Native", label: "Native / Bilingual" },
                    { value: "Fluent", label: "Fluent" },
                    { value: "Professional", label: "Professional Working" },
                    { value: "Basic", label: "Elementary / Basic" },
                  ]}
                  onChange={(val) => setNewLangProf(val)}
                />
              </div>
            </Col>
          </Row>
          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="primary"
              size="large"
              onClick={() => {
                if (!newLangName.trim()) {
                  message.warning("Please enter a language name");
                  return;
                }
                const entry = `${newLangName.trim()} (${newLangProf})`;
                const updated = [...languages, entry];
                handleSaveLanguages(updated);
                setNewLangName("");
              }}
              style={{ background: "#5f2eea", borderRadius: 8, padding: "0 32px", fontWeight: 600, boxShadow: "0 4px 12px rgba(95, 46, 234, 0.2)", display: "flex", alignItems: "center", gap: 8 }}
            >
              <Plus size={18} /> Add Language
            </Button>
          </div>
        </div>
      </div>
    ),

    additional: () => (
      <div>
        <Title level={4}>Additional Information</Title>
        <Text type="secondary">
          Customize your key strengths, personal interests, and extra notes about yourself.
        </Text>
        <Divider style={{ margin: "16px 0" }} />

        <div style={{ background: "#ffffff", borderRadius: 16, padding: "32px", border: "1px solid #e8e8e8", boxShadow: "0 8px 24px rgba(0,0,0,0.04)" }}>
          {/* Key Strengths */}
          <div style={{ marginBottom: 32 }}>
            <Text strong style={{ display: "block", marginBottom: 12, fontSize: 15, color: "#1a1a1a" }}>
              Key Strengths
            </Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {additionalInfo?.strengths?.map((str, idx) => (
                <Tag
                  key={idx}
                  closable
                  onClose={() => {
                    const updatedStr = additionalInfo.strengths.filter((_, i) => i !== idx);
                    handleSaveAdditionalInfo({ ...additionalInfo, strengths: updatedStr });
                  }}
                  style={{ padding: "6px 12px", borderRadius: 14, fontSize: 13, background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#1e293b" }}
                >
                  {str}
                </Tag>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <CommonInputField
                  value={newStrength}
                  placeholder="Add a strength (e.g. Critical Thinking)"
                  onChange={(e) => setNewStrength(e.target.value)}
                />
              </div>
              <Button
                type="primary"
                size="large"
                style={{ background: "#5f2eea", borderRadius: 8, fontWeight: 500 }}
                onClick={() => {
                  if (!newStrength.trim()) return;
                  const updatedStr = [...(additionalInfo?.strengths || []), newStrength.trim()];
                  handleSaveAdditionalInfo({ ...additionalInfo, strengths: updatedStr });
                  setNewStrength("");
                }}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Interests */}
          <div style={{ marginBottom: 32 }}>
            <Text strong style={{ display: "block", marginBottom: 12, fontSize: 15, color: "#1a1a1a" }}>
              Interests & Passions
            </Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {additionalInfo?.interests?.map((int, idx) => (
                <Tag
                  key={idx}
                  closable
                  onClose={() => {
                    const updatedInt = additionalInfo.interests.filter((_, i) => i !== idx);
                    handleSaveAdditionalInfo({ ...additionalInfo, interests: updatedInt });
                  }}
                  style={{ padding: "6px 12px", borderRadius: 14, fontSize: 13, background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#1e293b" }}
                >
                  {int}
                </Tag>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <CommonInputField
                  value={newInterest}
                  placeholder="Add an interest (e.g. Open Source, Cloud Architecture)"
                  onChange={(e) => setNewInterest(e.target.value)}
                />
              </div>
              <Button
                type="primary"
                size="large"
                style={{ background: "#5f2eea", borderRadius: 8, fontWeight: 500 }}
                onClick={() => {
                  if (!newInterest.trim()) return;
                  const updatedInt = [...(additionalInfo?.interests || []), newInterest.trim()];
                  handleSaveAdditionalInfo({ ...additionalInfo, interests: updatedInt });
                  setNewInterest("");
                }}
              >
                Add
              </Button>
            </div>
          </div>

          {/* About Me */}
          <div>
            <Text strong style={{ display: "block", marginBottom: 12, fontSize: 15, color: "#1a1a1a" }}>
              About Me Notes
            </Text>
            <CommonTextArea
              value={additionalInfo?.about_me || ""}
              placeholder="Tell recruiters a bit about yourself, hobbies, or what drives you..."
              onChange={(e) => {
                setAdditionalInfo({ ...additionalInfo, about_me: e.target.value });
              }}
              rows={4}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24, paddingTop: 24, borderTop: "1px solid #f0f0f0" }}>
            <Button
              type="primary"
              size="large"
              style={{ background: "#5f2eea", borderRadius: 8, padding: "0 32px", fontWeight: 600, boxShadow: "0 4px 12px rgba(95, 46, 234, 0.2)" }}
              onClick={() => handleSaveAdditionalInfo(additionalInfo)}
            >
              Save Additional Info
            </Button>
          </div>
        </div>
      </div>
    ),
  };
  //////////////////////////////////////////////////

  // Resume handlers
  const dataURItoBlob = (dataURI) => {
    const commaIndex = dataURI.indexOf(',');
    if (commaIndex === -1) {
      console.error("Invalid data URI format");
      return new Blob([], { type: "application/octet-stream" });
    }

    const metadata = dataURI.substring(0, commaIndex);
    let payload = dataURI.substring(commaIndex + 1);

    let mimeString = "application/octet-stream";
    const mimeMatch = metadata.match(/^data:([^;]+)/);
    if (mimeMatch && mimeMatch[1]) {
      mimeString = mimeMatch[1];
    }

    const isBase64 = metadata.indexOf('base64') !== -1;
    let byteString;

    if (isBase64) {
      // Decode URL encoding and completely strip all non-base64 characters
      payload = decodeURIComponent(payload);
      payload = payload.replace(/[^A-Za-z0-9+/=]/g, '');

      try {
        byteString = atob(payload);
      } catch (e) {
        // Fix missing padding if any
        const padding = '='.repeat((4 - payload.length % 4) % 4);
        try {
          byteString = atob(payload + padding);
        } catch (err) {
          console.error("Base64 decoding failed completely", err);
          return new Blob([], { type: mimeString });
        }
      }
    } else {
      byteString = decodeURI(payload);
    }

    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], { type: mimeString });
  };

  const handleViewResume = () => {
    if (!isResume) return;
    if (isResume.startsWith("http")) {
      window.open(isResume, "_blank");
    } else if (isResume.startsWith("data:")) {
      try {
        const blob = dataURItoBlob(isResume);
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
      } catch (err) {
        console.error("Failed to process view resume:", err);
      }
    } else {
      handleDownloadResume();
    }
  };

  const handleDownloadResume = () => {
    if (!isResume) return;

    const downloadBlobOrUrl = (url, revoke = false) => {
      const a = document.createElement("a");
      a.href = url;
      const isDoc = typeof isResume === "string" && (isResume.includes("wordprocessingml") || isResume.includes("msword") || isResume.endsWith(".docx") || isResume.endsWith(".doc"));
      a.download = `${fname || "candidate"}_resume.${isDoc ? "docx" : "pdf"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (revoke) window.URL.revokeObjectURL(url);
    };

    if (isResume.startsWith("data:")) {
      try {
        const blob = dataURItoBlob(isResume);
        const url = window.URL.createObjectURL(blob);
        downloadBlobOrUrl(url, true);
      } catch (err) {
        console.error("Failed to process download resume:", err);
      }
    } else {
      downloadBlobOrUrl(isResume, false);
    }
  };

  // Candidate headline
  const candidateHeadline =
    companies && companies.length > 0 && companies[0]?.jobTitle
      ? companies[0].jobTitle
      : userType === "Experienced"
        ? "Experienced Professional"
        : userType === "Fresher"
          ? "Graduate / Fresher"
          : "Professional Candidate";

  // Profile strength rating
  const completionPct = profileStats?.completionPercentage || 0;
  const strengthBadgeText =
    completionPct >= 80 ? "All-Star Profile ⭐" : completionPct >= 50 ? "Intermediate 🚀" : "Getting Started 🎯";
  const strengthBadgeColor =
    completionPct >= 80 ? "#10b981" : completionPct >= 50 ? "#4f46e5" : "#f59e0b";

  // Naukri UI states & helpers
  const [militaryStatus, setMilitaryStatus] = useState("Never served");
  const [expandedDesc, setExpandedDesc] = useState({});

  const displayCandidateRole =
    companies?.find((c) => !c.isNew && c.jobTitle)?.jobTitle ||
    userType ||
    (preferredRoles ? preferredRoles.split(",")[0].trim() : "");

  const displayCurrentCompany =
    companies?.find((c) => !c.isNew && c.workingCompanyName)?.workingCompanyName || "";

  const displayAbout =
    (typeof aboutText === "string" && aboutText.trim())
      ? aboutText
      : (typeof aboutTextNew === "string" && aboutTextNew.trim())
        ? aboutTextNew
        : (typeof isAbout === "string" && isAbout.trim())
          ? isAbout
          : "";

  const getSocialLink = (platform) => {
    if (!socialLinks) return "";
    return socialLinks[platform] || socialLinks[platform.toLowerCase()] || "";
  };

  const completenessChecks = [
    { key: "basic", label: "Basic information", done: Boolean(fname && email && phoneNumber) },
    { key: "about", label: "Add profile summary", done: Boolean(displayAbout) },
    { key: "resume", label: "Upload resume", done: Boolean(isResume) },
    { key: "skills", label: "Add key skills", done: Boolean(isSkills && isSkills.length > 0) },
    { key: "experience", label: "Add work experience", done: Boolean(companies && companies.some((c) => !c.isNew && (c.workingCompanyName || c.jobTitle))) },
    { key: "education", label: "Add education", done: Boolean(isEducation && isEducation.length > 0) },
    { key: "projects", label: "Add projects", done: Boolean(isProjects && isProjects.length > 0) },
    { key: "certifications", label: "Add certifications", done: Boolean(certifications && certifications.length > 0) },
  ];
  const completedChecksCount = completenessChecks.filter((c) => c.done).length;
  const profileCompletionPercentage = Math.round((completedChecksCount / completenessChecks.length) * 100);
  const profileDonutOffset = 150.8 - (150.8 * profileCompletionPercentage) / 100;

  if (userProfileLoading || isLoading) {
    return (
      <div className="candidate-profile-page-wrapper">
        {/* TOP PROFILE HEADER CARD SKELETON */}
        <div className="profile-hero-card" style={{ padding: "32px", minHeight: "260px" }}>
          <div style={{ display: "flex", gap: "32px" }}>
            <Skeleton.Avatar active size={130} shape="circle" />
            <div style={{ flex: 1, paddingTop: 16 }}>
              <Skeleton active paragraph={{ rows: 2, width: ["30%", "20%"] }} title={{ width: "40%" }} />
              <div style={{ display: "flex", gap: "16px", marginTop: "32px" }}>
                <Skeleton.Button active size="small" shape="round" style={{ width: 100 }} />
                <Skeleton.Button active size="small" shape="round" style={{ width: 100 }} />
                <Skeleton.Button active size="small" shape="round" style={{ width: 100 }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", paddingTop: 16 }}>
              <Skeleton.Button active size="default" shape="circle" />
              <Skeleton.Button active size="default" shape="round" style={{ width: 130 }} />
              <Skeleton.Button active size="default" shape="round" style={{ width: 130 }} />
            </div>
          </div>
        </div>

        {/* TWO COLUMN GRID SKELETON */}
        <div className="profile-grid-container">
          <div className="profile-col-left">
            <div className="section-card" style={{ padding: "32px", marginBottom: "24px" }}>
              <Skeleton active paragraph={{ rows: 4 }} title={{ width: "40%" }} />
            </div>
            <div className="section-card" style={{ padding: "32px", marginBottom: "24px" }}>
              <Skeleton active paragraph={{ rows: 3 }} title={{ width: "30%" }} />
            </div>
          </div>

          <div className="profile-col-right">
            <div className="section-card" style={{ padding: "32px", marginBottom: "24px" }}>
              <Skeleton active paragraph={{ rows: 6 }} title={{ width: "35%" }} />
            </div>
            <div className="section-card" style={{ padding: "32px", marginBottom: "24px" }}>
              <Skeleton active paragraph={{ rows: 5 }} title={{ width: "45%" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="candidate-profile-page-wrapper">
        {/* TOP PROFILE HEADER CARD */}
        <div className="profile-hero-card">
          {/* Subtle Decorative Ambient Background Glows */}
          <div className="profile-hero-ambient-1" />
          <div className="profile-hero-ambient-2" />

          {/* Upper Main Section */}
          <div className="profile-hero-main">
            <div className="profile-hero-left">
              {/* Avatar with Online Status Dot */}
              {/* Avatar with Profile Upload & Progress Ring */}
              <div
                className="custom-avatar-upload"
                onClick={() => {
                  const input = document.getElementById("profile-upload-input");
                  if (input) input.click();
                }}
                style={{
                  position: "relative",
                  width: "116px",
                  height: "116px",
                  marginRight: "24px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {/* SVG Progress Ring */}
                <svg width="116" height="116" viewBox="0 0 116 116" style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}>
                  <circle cx="58" cy="58" r="54" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <circle
                    cx="58" cy="58" r="54" fill="none"
                    stroke={profileCompletionPercentage === 100 ? "#22c55e" : "#5f2eea"}
                    strokeWidth="4" strokeDasharray="339.29"
                    strokeDashoffset={339.29 - (339.29 * profileCompletionPercentage) / 100}
                    strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                  />
                </svg>

                {/* Avatar Container */}
                <div style={{
                  width: "92px", height: "92px", borderRadius: "50%",
                  backgroundColor: "#f1f5f9", display: "flex", alignItems: "center",
                  justifyContent: "center", position: "relative", overflow: "hidden",
                  color: "#64748b", fontSize: "32px", fontWeight: "bold"
                }}>
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span>{fname ? `${fname[0]}${lname ? lname[0] : ""}`.toUpperCase() : "U"}</span>
                  )}
                  
                  {/* Hover Overlay */}
                  <div 
                    style={{
                      position: "absolute", inset: 0,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      opacity: 0, transition: "opacity 0.2s ease",
                      color: "#ffffff"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                  >
                    <div style={{ background: "#ffffff", borderRadius: "50%", padding: "4px", display: "flex", marginBottom: "2px" }}>
                      <MdEdit size={14} color="#5f2eea" />
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#ffffff", lineHeight: 1.2 }}>Replace</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#ffffff", lineHeight: 1.2 }}>photo</span>
                  </div>
                </div>
                
                {/* Completion Badge */}
                <div style={{
                  position: "absolute", bottom: "-6px", left: "50%", transform: "translateX(-50%)",
                  background: "#fff", padding: "2px 10px", borderRadius: "12px",
                  fontSize: "11px", fontWeight: 700, 
                  color: profileCompletionPercentage === 100 ? "#22c55e" : "#5f2eea",
                  border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  whiteSpace: "nowrap"
                }}>
                  {profileCompletionPercentage}%
                </div>

                {/* Hidden File Input */}
                <input
                  type="file" id="profile-upload-input" style={{ display: "none" }}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleProfileImageUpload}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Candidate Info Details */}
              <div className="profile-hero-details">
                {/* Line 1: Name, Verified Badge & Active Pill */}
                <div className="profile-name-row">
                  <h1 className="profile-candidate-name">
                    {fname ? `${fname} ${lname || ""}` : "Candidate Profile"}
                  </h1>
                  <span className="profile-verified-badge" title="Verified Candidate">
                    <CheckCircle2 size={16} fill="#6800ad" color="#ffffff" />
                  </span>
                  <span className="profile-status-badge">
                    <span className="profile-status-dot" />
                    Active
                  </span>
                </div>

                {/* Line 2: Role / Level */}
                <div className="profile-candidate-title">
                  {displayCandidateRole || "Professional"}
                  {displayCurrentCompany && (
                    <span className="profile-candidate-company"> at {displayCurrentCompany}</span>
                  )}
                </div>

                {/* Line 3: Location, Phone, Email with Dividers */}
                <div className="profile-meta-row">
                  <span className="profile-meta-item">
                    <MapPin size={13} />
                    <span>{location && location !== "N/A" ? location : "Location not set"}</span>
                  </span>
                  <span className="profile-meta-divider">|</span>
                  <span className="profile-meta-item">
                    <Phone size={13} />
                    <span>{phoneNumber || "Phone not set"}</span>
                  </span>
                  <span className="profile-meta-divider">|</span>
                  <span className="profile-meta-item">
                    <Mail size={13} />
                    <span>{email || "Email not set"}</span>
                  </span>
                </div>

                {/* Line 4: Social Links */}
                <div className="profile-social-row">
                  {(() => {
                    const lIn = getSocialLink("Linkedin");
                    const gHub = getSocialLink("Github");
                    const pFolio = getSocialLink("Portfolio");

                    if (!lIn && !gHub && !pFolio) {
                      return (
                        <button
                          type="button"
                          className="profile-social-item-add"
                          onClick={() => {
                            setActiveTab("sociallinks");
                            showDrawer();
                          }}
                        >
                          <Plus size={12} />
                          <span>Add Social Links</span>
                        </button>
                      );
                    }

                    return (
                      <>
                        {lIn && (
                          <a
                            href={lIn.startsWith("http") ? lIn : `https://${lIn}`}
                            target="_blank"
                            rel="noreferrer"
                            className="profile-social-item linkedin"
                          >
                            <FaLinkedinIn size={13} />
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {gHub && (
                          <>
                            {lIn && <span className="profile-meta-divider">|</span>}
                            <a
                              href={gHub.startsWith("http") ? gHub : `https://${gHub}`}
                              target="_blank"
                              rel="noreferrer"
                              className="profile-social-item github"
                            >
                              <FaGithub size={13} />
                              <span>GitHub</span>
                            </a>
                          </>
                        )}
                        {pFolio && (
                          <>
                            {(lIn || gHub) && <span className="profile-meta-divider">|</span>}
                            <a
                              href={pFolio.startsWith("http") ? pFolio : `https://${pFolio}`}
                              target="_blank"
                              rel="noreferrer"
                              className="profile-social-item portfolio"
                            >
                              <Globe size={13} />
                              <span>Portfolio</span>
                            </a>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Right Side: Action Buttons */}
            <div className="profile-hero-actions">
              <button
                type="button"
                className="profile-btn-icon"
                title="Share Profile"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Candidate Profile',
                      url: window.location.href
                    }).catch(console.error);
                  } else if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    message.success("Profile link copied to clipboard!");
                  } else {
                    message.info("Profile link copied!");
                  }
                }}
              >
                <Share2 size={15} />
              </button>

              <button
                type="button"
                className="profile-btn-download"
                onClick={handleDownloadResume}
                title="Download CV"
              >
                <Download size={14} />
                <span>Download CV</span>
              </button>

              <button
                type="button"
                className="btn-edit-profile"
                onClick={() => {
                  setActiveTab("basic");
                  showDrawer();
                }}
              >
                <MdEdit size={14} />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Lower Bottom Section: Skills + 3 Key Metrics */}
          <div className="profile-hero-bottom">
            {/* Left: Skill Chips */}
            <div className="profile-hero-skills">
              {isSkills && isSkills.length > 0 ? (
                <>
                  {isSkills.slice(0, 6).map((skill, idx) => {
                    const skillName = typeof skill === "object" ? (skill.skill_name || skill.name) : skill;
                    return (
                      <span
                        key={idx}
                        className="hero-skill-chip"
                        onClick={() => {
                          setActiveTab("skills");
                          showDrawer();
                        }}
                      >
                        {skillName}
                      </span>
                    );
                  })}
                  {isSkills.length > 6 && (
                    <span
                      className="hero-skill-chip plus-chip"
                      onClick={() => {
                        setActiveTab("skills");
                        showDrawer();
                      }}
                    >
                      +{isSkills.length - 6}
                    </span>
                  )}
                </>
              ) : (
                <span
                  className="hero-skill-chip plus-chip"
                  onClick={() => {
                    setActiveTab("skills");
                    showDrawer();
                  }}
                >
                  <Plus size={12} style={{ marginRight: 4, display: "inline-block" }} /> Add Key Skills
                </span>
              )}
            </div>

            {/* Right: 3 Summary Metrics */}
            <div className="profile-hero-metrics">
              <div className="hero-metric-item">
                <div className="hero-metric-icon">
                  <Briefcase size={16} />
                </div>
                <div className="hero-metric-info">
                  <div className="hero-metric-value">
                    {totalYearsExperience
                      ? `${totalYearsExperience}${totalMonthsExperience ? ` ${totalMonthsExperience}` : ""}`
                      : (userType === "Fresher" ? "Fresher" : "0+ Years")}
                  </div>
                  <div className="hero-metric-label">Experience</div>
                </div>
              </div>

              <div className="hero-metric-divider" />

              <div className="hero-metric-item">
                <div className="hero-metric-icon">
                  <GraduationCap size={16} />
                </div>
                <div className="hero-metric-info">
                  <div className="hero-metric-value">{userType || "Fresher"}</div>
                  <div className="hero-metric-label">Career Level</div>
                </div>
              </div>

              <div className="hero-metric-divider" />

              <div className="hero-metric-item">
                <div className="hero-metric-icon green">
                  <Clock size={16} />
                </div>
                <div className="hero-metric-info">
                  <div className="hero-metric-value green">{noticePeriod || "Open to Work"}</div>
                  <div className="hero-metric-label">Notice Period</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TWO COLUMN GRID CONTAINER */}
        <div className="profile-grid-container">
          {/* ================= LEFT COLUMN ================= */}
          <div className="profile-col-left">

            {/* 1. Professional Summary Card */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-title-wrap">
                  <Sparkles size={16} className="section-header-icon" />
                  <h3 className="section-title">Professional Summary</h3>
                  <span
                    className="section-edit-pencil"
                    onClick={() => {
                      setActiveTab("about");
                      showDrawer();
                    }}
                    title="Edit Summary"
                  >
                    <MdEdit size={14} />
                  </span>
                </div>
              </div>
              {displayAbout && displayAbout.trim() ? (
                <>
                  <p className="summary-text">{displayAbout}</p>
                  {displayAbout.length > 200 && (
                    <span
                      className="read-more-link"
                      onClick={() => {
                        setActiveTab("about");
                        showDrawer();
                      }}
                    >
                      Read more
                    </span>
                  )}
                </>
              ) : (
                <div className="empty-profile-section">
                  <p className="empty-section-text">
                    Add a professional summary highlighting your key qualifications, achievements, and career goals.
                  </p>
                  <button
                    type="button"
                    className="btn-section-action"
                    onClick={() => {
                      setActiveTab("about");
                      showDrawer();
                    }}
                  >
                    <Plus size={13} /> Add Summary
                  </button>
                </div>
              )}
            </div>

            {/* 2. Resume Card */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-title-wrap">
                  <FileText size={16} className="section-header-icon" />
                  <h3 className="section-title">Resume</h3>
                </div>
                <button
                  type="button"
                  className="btn-section-action"
                  onClick={() => {
                    setActiveTab("resume");
                    showDrawer();
                  }}
                >
                  {isResume ? "Update Resume" : "Upload Resume"}
                </button>
              </div>
              {isResume ? (
                <>
                  <div className="resume-subtitle">Active resume uploaded and attached to profile</div>
                  <div className="resume-file-box">
                    <div className="resume-file-left">
                      <span className="pdf-badge">
                        {typeof isResume === "string" && (isResume.toLowerCase().endsWith(".docx") || isResume.toLowerCase().endsWith(".doc") || isResume.includes("wordprocessingml") || isResume.includes("msword")) ? "DOC" : "PDF"}
                      </span>
                      <div>
                        <div className="resume-file-name">
                          {typeof isResume === "string" && !isResume.startsWith("data:")
                            ? isResume.split("/").pop().split("\\").pop()
                            : `${fname || "Candidate"}_Resume.${(typeof isResume === "string" && (isResume.includes("wordprocessingml") || isResume.includes("msword"))) ? "docx" : "pdf"}`}
                        </div>
                        <div className="resume-file-size">Resume document</div>
                      </div>
                    </div>
                    <div className="resume-actions-right">
                      <button
                        type="button"
                        className="resume-action-btn"
                        title="Download Resume"
                        onClick={handleDownloadResume}
                      >
                        <Download size={15} />
                      </button>
                      <button
                        type="button"
                        className="resume-action-btn"
                        title="View Resume"
                        onClick={handleViewResume}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        className="resume-action-btn delete"
                        title="Update Resume"
                        onClick={() => {
                          setActiveTab("resume");
                          showDrawer();
                        }}
                      >
                        <MdEdit size={15} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-profile-section">
                  <p className="empty-section-text">
                    Upload your latest resume (PDF or DOC) to get noticed by top recruiters.
                  </p>
                  <button
                    type="button"
                    className="btn-section-action"
                    onClick={() => {
                      setActiveTab("resume");
                      showDrawer();
                    }}
                  >
                    <UploadCloud size={13} /> Upload Resume
                  </button>
                </div>
              )}
            </div>

            {/* 3. Key Skills Card */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-title-wrap">
                  <Code2 size={16} className="section-header-icon" />
                  <h3 className="section-title">Key Skills</h3>
                  <span
                    className="section-edit-pencil"
                    onClick={() => {
                      setActiveTab("skills");
                      showDrawer();
                    }}
                    title="Edit Skills"
                  >
                    <MdEdit size={14} />
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-section-action"
                  onClick={() => {
                    setActiveTab("skills");
                    showDrawer();
                  }}
                >
                  <Plus size={13} /> Add Skill
                </button>
              </div>
              {isSkills && isSkills.length > 0 ? (
                <div className="skills-pills-wrap">
                  {isSkills.map((skill, idx) => {
                    const skillName = typeof skill === "object" ? (skill.skill_name || skill.name) : skill;
                    return (
                      <span key={idx} className="skill-pill">
                        {skillName}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-profile-section">
                  <p className="empty-section-text">No skills added yet. Add your core technical and professional skills.</p>
                  <button
                    type="button"
                    className="btn-section-action"
                    onClick={() => {
                      setActiveTab("skills");
                      showDrawer();
                    }}
                  >
                    <Plus size={13} /> Add Skills
                  </button>
                </div>
              )}
            </div>

            {/* 4. Work Experience Card */}
            {(() => {
              const validCompanies = companies && companies.filter(
                (c) => !c.isNew && (c.workingCompanyName || c.jobTitle)
              );

              return (
                <div className="section-card">
                  <div className="section-card-header">
                    <div className="section-title-wrap">
                      <Briefcase size={16} className="section-header-icon" />
                      <h3 className="section-title">Work Experience</h3>
                      <span
                        className="section-edit-pencil"
                        onClick={() => {
                          if (validCompanies && validCompanies.length > 0) {
                            handleEditCompany(validCompanies[0]);
                          } else {
                            handleAddNewExperience();
                          }
                        }}
                        title="Edit Experience"
                      >
                        <MdEdit size={14} />
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-section-action"
                      onClick={handleAddNewExperience}
                    >
                      <Plus size={13} /> Add Experience
                    </button>
                  </div>

                  {validCompanies && validCompanies.length > 0 ? (
                    <div className="experience-timeline">
                      {validCompanies.map((comp, idx) => {
                        const role = comp.jobTitle || comp.designation || "Role";
                        const companyName = comp.workingCompanyName || comp.companyName || "Company";
                        const dateRange = `${comp.workingFrom || comp.workingStartDate || "Start"} - ${comp.currentlyWorking ? "Present" : (comp.workingTill || comp.workingEndDate || "End")}`;
                        const compLocation = comp.companyLocation || comp.location || location || "India";
                        const desc = comp.jobDescription || comp.roleDescription || "";

                        return (
                          <div key={comp.id || comp.company_id || idx} className="experience-item">
                            <div className="experience-node-dot" />
                            <div className="experience-header-row">
                              <div className="experience-title-company">
                                <div
                                  className="experience-company-logo"
                                  style={{
                                    background: idx % 3 === 0 ? "#6800ad" : idx % 3 === 1 ? "#10b981" : "#f97316",
                                    color: "#ffffff"
                                  }}
                                >
                                  <Building2 size={15} />
                                </div>
                                <h4 className="experience-role">{role}</h4>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {comp.totalExperience && (
                                  <span className="experience-duration-badge">{comp.totalExperience}</span>
                                )}
                                <span
                                  className="section-edit-pencil"
                                  style={{ opacity: 0.8, cursor: "pointer" }}
                                  onClick={() => handleEditCompany(comp)}
                                  title="Edit this experience"
                                >
                                  <MdEdit size={13} />
                                </span>
                                <Popconfirm
                                  title="Are you sure you want to remove this experience?"
                                  description="This will permanently delete this experience entry."
                                  onConfirm={() => handleDeleteCompanyWork(comp.id)}
                                  okText="Yes, Remove"
                                  cancelText="Cancel"
                                  okButtonProps={{ danger: true }}
                                >
                                  <span
                                    className="section-edit-pencil"
                                    style={{ opacity: 0.8, cursor: "pointer", color: "#ef4444" }}
                                    title="Remove this experience"
                                  >
                                    <Trash2 size={13} />
                                  </span>
                                </Popconfirm>
                              </div>
                            </div>
                            <div className="experience-company-name">{companyName}</div>
                            <div className="experience-meta-row">
                              <div className="experience-meta-item">
                                <Calendar size={12} />
                                <span>{dateRange}</span>
                              </div>
                              <div className="experience-meta-item">
                                <MapPin size={12} />
                                <span>{compLocation}</span>
                              </div>
                            </div>
                            {desc && (
                              <p className="experience-desc-text" style={{ fontSize: 13, color: "#475569", marginTop: 8, lineHeight: 1.5 }}>
                                {desc}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="empty-profile-section">
                      <p className="empty-section-text">No work experience added yet. Add past or current job roles to showcase your experience.</p>
                      <button
                        type="button"
                        className="btn-section-action"
                        onClick={handleAddNewExperience}
                      >
                        <Plus size={13} /> Add Experience
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 5. Education Card */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-title-wrap">
                  <GraduationCap size={16} className="section-header-icon" />
                  <h3 className="section-title">Education</h3>
                  <span
                    className="section-edit-pencil"
                    onClick={() => {
                      if (isEducation && isEducation.length > 0) {
                        handleEditEducationItem(isEducation[0]);
                      } else {
                        handleAddNewEducation();
                      }
                    }}
                    title="Edit Education"
                  >
                    <MdEdit size={14} />
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-section-action"
                  onClick={handleAddNewEducation}
                >
                  <Plus size={13} /> Add Education
                </button>
              </div>

              {isEducation && isEducation.length > 0 ? (
                <div className="education-list-wrap">
                  {isEducation.map((edu, idx) => {
                    const degree = edu.qualification || edu.course || edu.educationType || "Education";
                    const institute = edu.college || edu.institute || edu.university || edu.school || "Institution";
                    const year = (edu.start_date || edu.startYear)
                      ? `${edu.start_date || edu.startYear}${edu.end_date || edu.endYear ? ` - ${edu.end_date || edu.endYear}` : ""}`
                      : (edu.passingYear || edu.yearOfPassing || (edu.educationStartDate ? `${edu.educationStartDate} - ${edu.educationEndDate || ""}` : ""));
                    const grade = edu.cgpa
                      ? `${edu.percentage ? `${edu.percentage} | ` : ""}CGPA: ${edu.cgpa}`
                      : (edu.percentage || edu.grade);

                    return (
                      <div key={edu.id || edu.education_id || idx} className="education-item">
                        <div className="education-left">
                          <div className="education-icon-box">
                            <GraduationCap size={18} />
                          </div>
                          <div>
                            <h4 className="education-degree">{degree}</h4>
                            <div className="education-college">{institute}</div>
                            {year && <div className="education-year">{year}</div>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {grade && <span className="education-badge">CGPA/Marks: {grade}</span>}
                          <span
                            className="section-edit-pencil"
                            style={{ opacity: 0.8, cursor: "pointer" }}
                            onClick={() => handleEditEducationItem(edu)}
                            title="Edit this education"
                          >
                            <MdEdit size={13} />
                          </span>
                          <Popconfirm
                            title="Are you sure you want to remove this education?"
                            description="This will permanently delete this education entry."
                            onConfirm={() => handleDeleteEducation(edu.id)}
                            okText="Yes, Remove"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <span
                              className="section-edit-pencil"
                              style={{ opacity: 0.8, cursor: "pointer", color: "#ef4444" }}
                              title="Remove this education"
                            >
                              <Trash2 size={13} />
                            </span>
                          </Popconfirm>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-profile-section">
                  <p className="empty-section-text">No education details added yet. Add your degrees, diplomas, or qualifications.</p>
                  <button
                    type="button"
                    className="btn-section-action"
                    onClick={handleAddNewEducation}
                  >
                    <Plus size={13} /> Add Education
                  </button>
                </div>
              )}
            </div>

            {/* 6. Projects Card */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-title-wrap">
                  <FolderGit2 size={16} className="section-header-icon" />
                  <h3 className="section-title">Projects</h3>
                  <span
                    className="section-edit-pencil"
                    onClick={() => {
                      if (isProjects && isProjects.length > 0) {
                        handleEditProjectItem(isProjects[0]);
                      } else {
                        handleAddNewProject();
                      }
                    }}
                    title="Edit Projects"
                  >
                    <MdEdit size={14} />
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-section-action"
                  onClick={handleAddNewProject}
                >
                  <Plus size={13} /> Add Project
                </button>
              </div>

              {isProjects && isProjects.length > 0 ? (
                <div className="projects-list-wrap">
                  {isProjects.map((proj, idx) => {
                    const title = proj.project_title || proj.projectTitle || proj.title || "Project";
                    const client = proj.company_name || proj.projectClient || proj.client || "";
                    const pType = (proj.project_type || proj.projectType) ? ` (${proj.project_type || proj.projectType})` : "";
                    const dates = proj.start_date
                      ? `${String(proj.start_date).slice(0, 10)} - ${proj.end_date ? String(proj.end_date).slice(0, 10) : "Present"}`
                      : (proj.projectWorkingFrom ? `${proj.projectWorkingFrom} - ${proj.projectWorkingTill || "Present"}` : (proj.projectStartDate ? `${proj.projectStartDate} - ${proj.projectEndDate || "Present"}` : ""));
                    const desc = proj.description || proj.projectDescription || "";
                    const link = proj.projectUrl || proj.link;
                    const skills = proj.skillsUsed ? (Array.isArray(proj.skillsUsed) ? proj.skillsUsed : proj.skillsUsed.split(",")) : [];

                    return (
                      <div key={proj.id || proj.project_id || idx} className="project-item">
                        <div className="project-info" style={{ width: "100%" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <h4 className="project-title">{title}{client ? ` - ${client}` : ""}{pType}</h4>
                              {skills.length > 0 && (
                                <div className="project-tags">
                                  {skills.map((s, sIdx) => (
                                    <span key={sIdx} className="project-tag">{typeof s === "string" ? s.trim() : s}</span>
                                  ))}
                                </div>
                              )}
                              {dates && (
                                <div className="project-date">
                                  <Calendar size={11} />
                                  <span>{dates}</span>
                                </div>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span
                                className="section-edit-pencil"
                                style={{ opacity: 0.8, cursor: "pointer" }}
                                onClick={() => handleEditProjectItem(proj)}
                                title="Edit this project"
                              >
                                <MdEdit size={13} />
                              </span>
                              <Popconfirm
                                title="Are you sure you want to remove this project?"
                                description="This will permanently delete this project."
                                onConfirm={() => handleDeleteCompany(proj.id)}
                                okText="Yes, Remove"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true }}
                              >
                                <span
                                  className="section-edit-pencil"
                                  style={{ opacity: 0.8, cursor: "pointer", color: "#ef4444" }}
                                  title="Remove this project"
                                >
                                  <Trash2 size={13} />
                                </span>
                              </Popconfirm>
                            </div>
                          </div>
                          {desc && <p className="project-desc">{desc}</p>}
                          {link && (
                            <a href={link.startsWith("http") ? link : `https://${link}`} target="_blank" rel="noreferrer" className="project-link">
                              View Project <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-profile-section">
                  <p className="empty-section-text">No projects added yet. Showcase personal or work projects to demonstrate your practical skills.</p>
                  <button
                    type="button"
                    className="btn-section-action"
                    onClick={handleAddNewProject}
                  >
                    <Plus size={13} /> Add Project
                  </button>
                </div>
              )}
            </div>

            {/* 7. Certifications Card */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-title-wrap">
                  <Award size={16} className="section-header-icon" />
                  <h3 className="section-title">Certifications</h3>
                  <span
                    className="section-edit-pencil"
                    onClick={() => {
                      setActiveTab("certifications");
                      showDrawer();
                    }}
                    title="Manage Certifications"
                  >
                    <MdEdit size={14} />
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-section-action"
                  onClick={() => {
                    setActiveTab("certifications");
                    showDrawer();
                  }}
                >
                  <Plus size={13} /> Add Certification
                </button>
              </div>

              {certifications && certifications.length > 0 ? (
                <div className="cert-list-wrap">
                  {certifications.map((cert, idx) => (
                    <div key={idx} className="cert-item">
                      <div className="cert-left">
                        <div
                          className="cert-icon-box"
                          style={{
                            background: idx % 3 === 0 ? "#ecfeff" : idx % 3 === 1 ? "#fefce8" : "#faf5ff",
                            color: idx % 3 === 0 ? "#06b6d4" : idx % 3 === 1 ? "#ca8a04" : "#9333ea"
                          }}
                        >
                          <Award size={18} />
                        </div>
                        <div>
                          <h4 className="cert-title">{cert.title || cert.name}</h4>
                          <div className="cert-issued">
                            {cert.issuer ? `Issued by ${cert.issuer}` : ""}{cert.year ? `, ${cert.year}` : ""}
                          </div>
                        </div>
                      </div>
                      {cert.url && (
                        <a
                          href={cert.url.startsWith("http") ? cert.url : `https://${cert.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-section-action"
                          style={{ textDecoration: "none" }}
                        >
                          View Credential
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-profile-section">
                  <p className="empty-section-text">No certifications added yet. Add your professional licenses, courses, and certifications.</p>
                  <button
                    type="button"
                    className="btn-section-action"
                    onClick={() => {
                      setActiveTab("certifications");
                      showDrawer();
                    }}
                  >
                    <Plus size={13} /> Add Certification
                  </button>
                </div>
              )}
            </div>

            {/* 8. Accomplishments Card */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-title-wrap">
                  <Trophy size={16} className="section-header-icon" />
                  <h3 className="section-title">Accomplishments</h3>
                  <span
                    className="section-edit-pencil"
                    onClick={() => {
                      setActiveTab("accomplishments");
                      showDrawer();
                    }}
                    title="Manage Accomplishments"
                  >
                    <MdEdit size={14} />
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-section-action"
                  onClick={() => {
                    setActiveTab("accomplishments");
                    showDrawer();
                  }}
                >
                  <Plus size={13} /> Add
                </button>
              </div>

              {accomplishments && accomplishments.length > 0 ? (
                <div className="accomplishments-list-wrap">
                  {accomplishments.map((acc, idx) => {
                    const text = typeof acc === "string" ? acc : acc.title || acc.description || "";
                    const icon = typeof acc === "object" && acc.icon ? acc.icon : "🏆";
                    return (
                      <div key={idx} className="accomplishment-item">
                        <span className="accomplishment-icon">{icon}</span>
                        <span>{text}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-profile-section">
                  <p className="empty-section-text">No accomplishments added yet. Highlight milestones, awards, or key achievements.</p>
                  <button
                    type="button"
                    className="btn-section-action"
                    onClick={() => {
                      setActiveTab("accomplishments");
                      showDrawer();
                    }}
                  >
                    <Plus size={13} /> Add Accomplishment
                  </button>
                </div>
              )}
            </div>

            {/* 9. Languages Card */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-title-wrap">
                  <Globe size={16} className="section-header-icon" />
                  <h3 className="section-title">Languages</h3>
                  <span
                    className="section-edit-pencil"
                    onClick={() => {
                      setActiveTab("languages");
                      showDrawer();
                    }}
                    title="Manage Languages"
                  >
                    <MdEdit size={14} />
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-section-action"
                  onClick={() => {
                    setActiveTab("languages");
                    showDrawer();
                  }}
                >
                  <Plus size={13} /> Add Language
                </button>
              </div>

              {languages && languages.length > 0 ? (
                <div className="languages-wrap">
                  {languages.map((item, idx) => {
                    const langName = typeof item === "string" ? item : item.language;
                    const prof = typeof item === "object" && item.proficiency ? ` (${item.proficiency})` : "";
                    return (
                      <span key={idx} className="language-pill">
                        {langName}{prof}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-profile-section">
                  <p className="empty-section-text">No languages added yet. Add languages you can read, write, or speak.</p>
                  <button
                    type="button"
                    className="btn-section-action"
                    onClick={() => {
                      setActiveTab("languages");
                      showDrawer();
                    }}
                  >
                    <Plus size={13} /> Add Language
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="profile-col-right">

            {/* 1. Profile Completeness Card */}
            <div className="section-card">
              <div className="completeness-top">
                <div className="donut-chart-wrap">
                  <svg className="donut-svg" viewBox="0 0 60 60">
                    <circle className="donut-track" cx="30" cy="30" r="24" />
                    <circle
                      className="donut-bar"
                      cx="30"
                      cy="30"
                      r="24"
                      style={{ strokeDashoffset: profileDonutOffset }}
                    />
                  </svg>
                  <div className="donut-center-text">{profileCompletionPercentage}%</div>
                </div>
                <div className="completeness-header-text">
                  <h4>Profile completeness</h4>
                  <span>
                    {profileCompletionPercentage === 100
                      ? "All completed!"
                      : profileCompletionPercentage >= 70
                        ? "Great progress!"
                        : "Complete your profile"}
                  </span>
                </div>
              </div>

              <div className="checklist-list">
                {completenessChecks.map((item, idx) => (
                  <div
                    key={idx}
                    className="checklist-item"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setActiveTab(item.key);
                      showDrawer();
                    }}
                    title={`Click to update ${item.label}`}
                  >
                    {item.done ? (
                      <CheckCircle2 size={15} className="check-done-icon" />
                    ) : (
                      <div className="check-todo-dot" />
                    )}
                    <span style={{ color: item.done ? "#1e293b" : "#64748b" }}>{item.label}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn-improve-profile"
                onClick={() => {
                  const firstIncomplete = completenessChecks.find((c) => !c.done);
                  setActiveTab(firstIncomplete ? firstIncomplete.key : "basic");
                  showDrawer();
                }}
              >
                {profileCompletionPercentage === 100 ? "Update Profile" : "Improve Profile"}
              </button>
            </div>

            {/* 2. Personal Details Card */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-title-wrap">
                  <User size={16} className="section-header-icon" />
                  <h3 className="section-title">Personal Details</h3>
                </div>
                <span
                  className="section-edit-pencil"
                  onClick={() => {
                    setActiveTab("basic");
                    showDrawer();
                  }}
                  title="Edit Personal Details"
                >
                  <MdEdit size={14} />
                </span>
              </div>

              <div className="detail-list">
                <div className="detail-item">
                  <div className="detail-label">
                    <User size={13} />
                    <span>Full Name</span>
                  </div>
                  <div className="detail-value">
                    {fname ? `${fname} ${lname || ""}` : <span className="empty-placeholder-text">Not specified</span>}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">
                    <Calendar size={13} />
                    <span>Date of Birth</span>
                  </div>
                  <div className="detail-value">
                    {dob ? (
                      dob.includes("T") ? dob.split("T")[0] : dob
                    ) : (
                      <span className="empty-placeholder-text">Not specified</span>
                    )}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">
                    <User size={13} />
                    <span>Gender</span>
                  </div>
                  <div className="detail-value">
                    {gender || <span className="empty-placeholder-text">Not specified</span>}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">
                    <Award size={13} />
                    <span>Marital Status</span>
                  </div>
                  <div className="detail-value">
                    {maritalStatus || <span className="empty-placeholder-text">Not specified</span>}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">
                    <MapPin size={13} />
                    <span>Location</span>
                  </div>
                  <div className="detail-value">
                    {location && location !== "N/A" ? location : <span className="empty-placeholder-text">Not specified</span>}
                  </div>
                </div>

              </div>
            </div>

            {/* 3. Career Preferences Card */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-title-wrap">
                  <Briefcase size={16} className="section-header-icon" />
                  <h3 className="section-title">Career Preferences</h3>
                </div>
                <span
                  className="section-edit-pencil"
                  onClick={() => {
                    setActiveTab("preferences");
                    showDrawer();
                  }}
                  title="Edit Career Preferences"
                >
                  <MdEdit size={14} />
                </span>
              </div>

              <div className="detail-list">
                <div className="detail-item">
                  <div className="detail-label">
                    <Briefcase size={13} />
                    <span>Job Roles</span>
                  </div>
                  <div className="detail-value" title={preferredRoles || "Not specified"}>
                    {preferredRoles || <span className="empty-placeholder-text">Not specified</span>}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">
                    <Globe size={13} />
                    <span>Job Type</span>
                  </div>
                  <div className="detail-value">
                    {Array.isArray(preferredJobType) && preferredJobType.length > 0 ? (
                      preferredJobType.join(", ")
                    ) : preferredJobType && typeof preferredJobType === "string" ? (
                      preferredJobType
                    ) : (
                      <span className="empty-placeholder-text">Not specified</span>
                    )}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">
                    <MapPin size={13} />
                    <span>Preferred Location</span>
                  </div>
                  <div className="detail-value">
                    {preferredLocations || <span className="empty-placeholder-text">Not specified</span>}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">
                    <TrendingUp size={13} />
                    <span>Willing to Relocate</span>
                  </div>
                  <div className="detail-value">
                    {willingToRelocate || <span className="empty-placeholder-text">Not specified</span>}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">
                    <Wallet size={13} />
                    <span>Expected Salary</span>
                  </div>
                  <div className="detail-value">
                    {expectedSalary ? (
                      expectedSalary.startsWith("₹") ? expectedSalary : `₹${expectedSalary}`
                    ) : (
                      <span className="empty-placeholder-text">Not specified</span>
                    )}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">
                    <Wallet size={13} />
                    <span>Current Salary</span>
                  </div>
                  <div className="detail-value">
                    {currentSalary ? (
                      currentSalary.startsWith("₹") ? currentSalary : `₹${currentSalary}`
                    ) : (
                      <span className="empty-placeholder-text">Not specified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Social Links Card */}
            {(() => {
              const lIn = getSocialLink("Linkedin");
              const gHub = getSocialLink("Github");
              const pFolio = getSocialLink("Portfolio");
              const tw = getSocialLink("Twitter");
              const insta = getSocialLink("Instagram");
              const fb = getSocialLink("Facebook");
              const drb = getSocialLink("Dribbble");
              const beh = getSocialLink("Behance");

              const hasAnySocial = lIn || gHub || pFolio || tw || insta || fb || drb || beh;

              return (
                <div className="section-card">
                  <div className="section-card-header">
                    <div className="section-title-wrap">
                      <Share2 size={16} className="section-header-icon" />
                      <h3 className="section-title">Social Links</h3>
                    </div>
                    <span
                      className="section-edit-pencil"
                      onClick={() => {
                        setActiveTab("sociallinks");
                        showDrawer();
                      }}
                      title="Edit Social Links"
                    >
                      <MdEdit size={14} />
                    </span>
                  </div>

                  {hasAnySocial ? (
                    <div className="social-links-list">
                      {lIn && (
                        <a
                          href={lIn.startsWith("http") ? lIn : `https://${lIn}`}
                          target="_blank"
                          rel="noreferrer"
                          className="social-link-item"
                        >
                          <div className="social-left-part">
                            <FaLinkedinIn size={14} color="#0077b5" />
                            <span>{lIn.replace(/^https?:\/\//, "")}</span>
                          </div>
                          <ExternalLink size={13} />
                        </a>
                      )}
                      {gHub && (
                        <a
                          href={gHub.startsWith("http") ? gHub : `https://${gHub}`}
                          target="_blank"
                          rel="noreferrer"
                          className="social-link-item"
                        >
                          <div className="social-left-part">
                            <FaGithub size={14} color="#0f172a" />
                            <span>{gHub.replace(/^https?:\/\//, "")}</span>
                          </div>
                          <ExternalLink size={13} />
                        </a>
                      )}
                      {pFolio && (
                        <a
                          href={pFolio.startsWith("http") ? pFolio : `https://${pFolio}`}
                          target="_blank"
                          rel="noreferrer"
                          className="social-link-item"
                        >
                          <div className="social-left-part">
                            <Globe size={14} color="#10b981" />
                            <span>{pFolio.replace(/^https?:\/\//, "")}</span>
                          </div>
                          <ExternalLink size={13} />
                        </a>
                      )}
                      {tw && (
                        <a
                          href={tw.startsWith("http") ? tw : `https://${tw}`}
                          target="_blank"
                          rel="noreferrer"
                          className="social-link-item"
                        >
                          <div className="social-left-part">
                            <FaTwitter size={14} color="#1da1f2" />
                            <span>{tw.replace(/^https?:\/\//, "")}</span>
                          </div>
                          <ExternalLink size={13} />
                        </a>
                      )}
                      {insta && (
                        <a
                          href={insta.startsWith("http") ? insta : `https://${insta}`}
                          target="_blank"
                          rel="noreferrer"
                          className="social-link-item"
                        >
                          <div className="social-left-part">
                            <FaInstagram size={14} color="#e1306c" />
                            <span>{insta.replace(/^https?:\/\//, "")}</span>
                          </div>
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="empty-profile-section">
                      <p className="empty-section-text">Add your LinkedIn, GitHub, or Portfolio links so recruiters can learn more about you.</p>
                      <button
                        type="button"
                        className="btn-section-action"
                        onClick={() => {
                          setActiveTab("sociallinks");
                          showDrawer();
                        }}
                      >
                        <Plus size={13} /> Add Social Links
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 5. Additional Information Card */}
            {(() => {
              const strengths = additionalInfo?.strengths
                ? (Array.isArray(additionalInfo.strengths) ? additionalInfo.strengths : additionalInfo.strengths.split(","))
                : [];
              const interests = additionalInfo?.interests
                ? (Array.isArray(additionalInfo.interests) ? additionalInfo.interests : additionalInfo.interests.split(","))
                : [];
              const aboutMe = additionalInfo?.about_me || "";
              const hasInfo = strengths.length > 0 || interests.length > 0 || Boolean(aboutMe);

              return (
                <div className="section-card">
                  <div className="section-card-header">
                    <div className="section-title-wrap">
                      <Sparkles size={16} className="section-header-icon" />
                      <h3 className="section-title">Additional Information</h3>
                    </div>
                    <span
                      className="section-edit-pencil"
                      onClick={() => {
                        setActiveTab("additional");
                        showDrawer();
                      }}
                      title="Edit Additional Information"
                    >
                      <MdEdit size={14} />
                    </span>
                  </div>

                  {hasInfo ? (
                    <>
                      {strengths.length > 0 && (
                        <>
                          <div className="info-subheading">Key Strengths</div>
                          <div className="info-pills-wrap">
                            {strengths.map((item, idx) => (
                              <span key={idx} className="info-pill">
                                {typeof item === "string" ? item.trim() : item}
                              </span>
                            ))}
                          </div>
                        </>
                      )}

                      {interests.length > 0 && (
                        <>
                          <div className="info-subheading" style={{ marginTop: strengths.length > 0 ? 12 : 0 }}>Interests</div>
                          <div className="info-pills-wrap">
                            {interests.map((item, idx) => (
                              <span key={idx} className="info-pill">
                                {typeof item === "string" ? item.trim() : item}
                              </span>
                            ))}
                          </div>
                        </>
                      )}

                      {aboutMe && (
                        <>
                          <div className="info-subheading" style={{ marginTop: 12 }}>About me</div>
                          <p className="info-about-text">{aboutMe}</p>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="empty-profile-section">
                      <p className="empty-section-text">Add your key strengths, personal interests, and a short bio.</p>
                      <button
                        type="button"
                        className="btn-section-action"
                        onClick={() => {
                          setActiveTab("additional");
                          showDrawer();
                        }}
                      >
                        <Plus size={13} /> Add Information
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 6. Availability Card */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-title-wrap">
                  <Clock size={16} className="section-header-icon" />
                  <h3 className="section-title">Availability</h3>
                </div>
                <span
                  className="section-edit-pencil"
                  onClick={() => {
                    setActiveTab("preferences");
                    showDrawer();
                  }}
                  title="Edit Availability"
                >
                  <MdEdit size={14} />
                </span>
              </div>

              <div className="detail-list">
                <div className="detail-item">
                  <div className="detail-label">
                    <Clock size={13} />
                    <span>Notice Period</span>
                  </div>
                  <div className="detail-value">
                    {noticePeriod || <span className="empty-placeholder-text">Immediate / Not set</span>}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">
                    <Calendar size={13} />
                    <span>Available From</span>
                  </div>
                  <div className="detail-value">
                    {availableFrom ? (
                      availableFrom.includes("T") ? availableFrom.split("T")[0] : availableFrom
                    ) : (
                      <span className="empty-placeholder-text">Immediate / Not set</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Drawer */}
      <Drawer
        title={null}
        placement="right"
        onClose={resetFormFields}
        open={open}
        width={"min(1100px, 85vw)"}
        zIndex={1060}
        closable={false}
        className="user_details_drawer"
        rootClassName="user_details_drawer"
        styles={{
          header: { display: "none" },
          body: { padding: 0, height: "100%" },
          wrapper: { zIndex: 1060 },
          mask: { zIndex: 1059 },
        }}
      >
        {loading ? (
          <div style={{ padding: 40 }}><Skeleton active paragraph={{ rows: 8 }} /></div>
        ) : (
          <div style={{ display: "flex", height: "100vh", background: "#fff" }}>
            {/* ── LEFT SIDEBAR ── */}
            <div className="drawer-sidebar">
              {/* Drawer Header */}
              <div className="drawer-sidebar-header">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="drawer-sidebar-logo">
                    <MdEdit size={16} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Edit Profile</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Update your details</div>
                  </div>
                </div>
                <button className="drawer-close-btn" onClick={resetFormFields}>
                  <X size={18} />
                </button>
              </div>

              {/* Progress */}
              <div className="drawer-progress-block">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Profile Completion</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: profileCompletionPercentage >= 80 ? "#22c55e" : profileCompletionPercentage >= 50 ? "#5f2eea" : "#f59e0b"
                  }}>{profileCompletionPercentage}%</span>
                </div>
                <Progress
                  percent={profileCompletionPercentage}
                  size="small"
                  showInfo={false}
                  strokeColor={profileCompletionPercentage >= 80 ? "#22c55e" : "#5f2eea"}
                  trailColor="#f1f5f9"
                />
              </div>

              {/* Navigation Items */}
              <nav className="drawer-nav">
                {items.map((item) => {
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`drawer-nav-item ${isActive ? "active" : ""}`}
                      onClick={() => {
                        setActiveTab(item.key);
                        setDetailsLoading(true);
                        setTimeout(() => setDetailsLoading(false), 700);
                      }}
                    >
                      <span className="drawer-nav-label">{item.label}</span>
                      {isActive && <div className="drawer-nav-indicator" />}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* ── RIGHT CONTENT ── */}
            <div className="drawer-content-area">
              {/* Content Header */}
              <div className="drawer-content-header">
                <h2 className="drawer-content-title">
                  {items.find(i => i.key === activeTab)?.label || "Profile Section"}
                </h2>
              </div>

              {/* Content Body */}
              <div className="drawer-content-body hide-scrollbar">
                {TabContent[activeTab] ? (
                  TabContent[activeTab]()
                ) : (
                  <p>Section not found</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
