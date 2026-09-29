'use client';
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "@/routing-shim";
import { Modal, message } from "antd";
import "../css/Profile.css";
import "../css/ModernCandidateProfile.css";
import {
  LayoutDashboard,
  User,
  FileCheck,
  Bookmark,
  Bell,
  Award,
  MessageSquare,
  Briefcase,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import WatchList from "./WatchList";
import RecentlyViewed from "./RecentlyViewed";
import MainProfile from "./MainProfile";
import Settings from "./Settings";
import ProSubscription from "./ProSubscription";
import BookMark from "./BookMark";
import AppliedJobs from "./AppliedJobs";
import AccountSettings from "./AccountSettings";
import { getUserProfile } from "../ApiService/action";
import Header from "@/Header/Header";

export default function UserProfile() {
  const { activeTab } = useParams();
  const navigate = useNavigate();
  const [sideBar, setSideBar] = useState(activeTab || "mainprofile");
  const [loginUserId, setLoginUserId] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sidebarNavItems = [
    {
      key: "dashboard",
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
      isRoute: true,
      path: "/",
    },
    {
      key: "mainprofile",
      icon: <User size={18} />,
      label: "My Profile",
    },
    {
      key: "applied",
      icon: <FileCheck size={18} />,
      label: "Applied Jobs",
    },
    {
      key: "wishlist",
      icon: <Bookmark size={18} />,
      label: "Saved Jobs",
    },
    {
      key: "jobalerts",
      icon: <Bell size={18} />,
      label: "Job Alerts",
    },
    {
      key: "assessments",
      icon: <Award size={18} />,
      label: "Assessments",
    },
    {
      key: "messages",
      icon: <MessageSquare size={18} />,
      label: "Messages",
      badge: 5,
    },
    {
      key: "prosubscription",
      icon: <Briefcase size={18} />,
      label: "Career Services",
    },
    {
      key: "settings",
      icon: <SettingsIcon size={18} />,
      label: "Settings",
    },
  ];

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loginDetails");
      if (stored) {
        const loginDetails = JSON.parse(stored);

        if (loginDetails.role_id === 3) {
          if (typeof window !== 'undefined') window.location.href = "/";
          return;
        }
        if (loginDetails.role_id === 1) {
          if (typeof window !== 'undefined') window.location.href = "/admin";
          return;
        }

        setLoginUserId(loginDetails.id);
        setRoleId(loginDetails.role_id);
        const storedImage = localStorage.getItem("profileImage");
        if (storedImage && storedImage !== "") {
          setAvatarUrl(storedImage);
        } else {
          setAvatarUrl(null);
        }
      } else {
        if (typeof window !== 'undefined') window.location.href = "/login";
      }
    } catch (error) {
      console.error("Invalid JSON in localStorage", error);
      if (typeof window !== 'undefined') window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    if (activeTab) {
      setSideBar(activeTab);
    } else {
      setSideBar("mainprofile");
    }
  }, [activeTab]);

  useEffect(() => {
    if (loginUserId !== null && loginUserId !== undefined) {
      getUserProfileData();
    }
  }, [loginUserId]);

  const getUserProfileData = async () => {
    const payload = {
      user_id: loginUserId,
    };

    try {
      const response = await getUserProfile(payload);
      if (response?.data?.data) {
        const profile = response.data.data;
        const image = profile.profile_image || null;
        setAvatarUrl(image);
        setFname(profile.first_name || "");
        setEmail(profile.email || "");
        setLname(profile.last_name || "");
        localStorage.setItem("profileImage", image || "");
      }
    } catch (error) {
      console.log("getuserprofile error", error);
    }
  };

  const handleNavClick = (item) => {
    setMobileMenuOpen(false);
    if (item.isRoute) {
      navigate(item.path);
    } else {
      setSideBar(item.key);
      navigate(`/candidate-profile/${item.key}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("loginDetails");
    localStorage.removeItem("profileImage");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <>
      <Header />
      <div className="candidate-dashboard-layout">
        {/* Mobile Header Bar */}
        <div
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px",
            background: "#ffffff",
            borderBottom: "1px solid #eef2f6",
            width: "100%",
          }}
          className="candidate-mobile-header"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#334155",
              }}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
              CareerFast
            </span>
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6800ad 0%, #ff7300 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {fname ? `${fname[0]}${lname ? lname[0] : ""}` : "SK"}
          </div>
        </div>

        {/* Left Sidebar Navigation */}
        {/*
        <aside
          className={`candidate-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}
        >
          <ul className="candidate-sidebar-menu">
            {sidebarNavItems.map((item) => {
              const isActive = sideBar === item.key;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    className={`candidate-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => handleNavClick(item)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="candidate-nav-badge">{item.badge}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <button
              type="button"
              className="candidate-nav-item"
              onClick={handleLogout}
              style={{ color: "#ef4444" }}
            >
              <LogOut size={17} color="#ef4444" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>
        */}

        {/* Main Content Area */}
        <main className="candidate-main-content">
          {sideBar === "mainprofile" ? (
            <MainProfile />
          ) : (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              {sideBar === "wishlist" ? (
                <WatchList />
              ) : sideBar === "bookmarked" ? (
                <BookMark />
              ) : sideBar === "viewed" ? (
                <RecentlyViewed />
              ) : sideBar === "settings" ? (
                <Settings />
              ) : sideBar === "accountsettings" ? (
                <AccountSettings />
              ) : sideBar === "prosubscription" ? (
                <ProSubscription />
              ) : sideBar === "applied" ? (
                <AppliedJobs />
              ) : sideBar === "jobalerts" ? (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                    Job Alerts
                  </h3>
                  <p style={{ color: "#64748b", fontSize: 13 }}>
                    You currently have no new alerts configured. Matching job notifications will appear here.
                  </p>
                </div>
              ) : sideBar === "assessments" ? (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                    Assessments & Tests
                  </h3>
                  <p style={{ color: "#64748b", fontSize: 13 }}>
                    Take skill tests to earn badges and showcase verified skills to prospective employers.
                  </p>
                </div>
              ) : sideBar === "messages" ? (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
                    Recruiter Messages
                  </h3>
                  <p style={{ color: "#64748b", fontSize: 13 }}>
                    You have 5 unread messages from recruiters.
                  </p>
                </div>
              ) : (
                ""
              )}
            </div>
          )}
        </main>

        {/* Modal for image preview */}
        <Modal
          open={isImageModalOpen}
          footer={null}
          onCancel={() => setIsImageModalOpen(false)}
          centered
        >
          {avatarUrl && (
            <img
              alt="Profile"
              src={avatarUrl}
              style={{
                width: "100%",
                height: "400px",
                objectFit: "contain",
                borderRadius: "10px",
              }}
            />
          )}
        </Modal>
      </div>
    </>

  );
}
