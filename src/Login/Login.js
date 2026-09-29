'use client';
import React, { useEffect, useState } from "react";
import {
  Form,
  Checkbox,
  Modal,
  Input,
} from "antd";
import { CommonToaster } from "../Common/CommonToaster";
import {
  MailOutlined,
  LockOutlined,
  ArrowRightOutlined,
  LinkedinFilled,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import {
  Briefcase,
  Building2,
  Users,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  BadgeCheck,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "../css/LoginPage.css";
import logo from "../images/careerfastlogofinal.png";
import avatar1 from "../images/priya.jpg";
import avatar2 from "../images/rahul.jpg";
import avatar3 from "../images/sneha.jpg";
import { useNavigate } from "@/routing-shim";
import {
  emailValidator,
  passwordValidator,
  confirmPasswordValidation,
} from "../Common/Validation";
import CommonInputField from "../Common/CommonInputField";
import CommonPasswordField from "../Common/CommonPasswordField";
import { getImageUrl } from "../utils/getImageUrl";
import {
  googleLogin,
  isProfileUpdated,
  login,
  verifyOtp,
  forgotPassword,
  sendOtp,
  getRoles,
} from "../ApiService/action";
import { GoogleLogin } from "@react-oauth/google";
import { requestForToken } from "../firebase/fireBase";

const LoginPage = () => {
  const navigate = useNavigate();

  // States
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);
  const [roleId, setRoleId] = useState(null);

  // Forgot Password Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [modalData, setModalData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
    const storedEmail = localStorage.getItem("rememberedEmail");
    if (storedEmail) {
      setFormData((prev) => ({ ...prev, email: storedEmail }));
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    updateRoleId();
  }, [roleOptions]);

  const fetchRoles = async () => {
    try {
      const response = await getRoles();
      setRoleOptions(response.data.data || []);
    } catch (error) {
      console.error("Roles fetch error", error);
    }
  };

  const updateRoleId = () => {
    if (roleOptions.length) {
      const role = roleOptions.find((r) => r.name === "CANDIDATE");
      if (role) setRoleId(role.id);
    }
  };

  const handleInputChange = (field, value, validator) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validator) {
      setErrors((prev) => ({ ...prev, [field]: validator(value) }));
    }
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    const emailVal = emailValidator(formData.email);
    const passVal = passwordValidator(formData.password);

    if (emailVal || passVal) {
      setErrors({ email: emailVal, password: passVal });
      return;
    }

    if (rememberMe) {
      localStorage.setItem("rememberedEmail", formData.email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    try {
      setIsLoading(true);
      const fcm_token = await requestForToken();
      if (fcm_token) localStorage.setItem("fcm_token", fcm_token);

      const candidateRoleId =
        roleId || roleOptions.find((r) => r.name === "CANDIDATE")?.id || 2;

      const payload = {
        email: formData.email,
        password: formData.password,
        role_id: candidateRoleId,
        fcm_token: fcm_token || localStorage.getItem("fcm_token"),
      };

      const response = await login(payload);
      const token = response.data.token;
      const loginDetails = response.data.data[0];

      localStorage.setItem("AccessToken", token);
      localStorage.setItem("loginDetails", JSON.stringify(loginDetails));

      // Set cookies for cross-app synchronization (shared across ports on localhost)
      document.cookie = `AccessToken=${token}; path=/; max-age=86400`; // 24 hours
      document.cookie = `loginDetails=${encodeURIComponent(
        JSON.stringify(loginDetails)
      )}; path=/; max-age=86400`;

      CommonToaster("Logged in successfully!", "success");

      if (loginDetails?.role_id === 1) {
        navigate("/admin");
      } else {
        const profileCheck = await isProfileUpdated({ email: payload.email });
        navigate(profileCheck?.data?.data === true ? "/" : "/profiledetails");
      }
    } catch (error) {
      console.error("Login error", error);
      const msg =
        error?.response?.data?.details ||
        error?.response?.data?.message ||
        "Login failed.";
      CommonToaster(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (res) => {
    try {
      const response = await googleLogin({ token: res.credential });

      const token = response.data.token;
      const userDetails = response.data.user;

      localStorage.setItem("AccessToken", token);
      localStorage.setItem("loginDetails", JSON.stringify(userDetails));

      // Set cookies for cross-app synchronization
      document.cookie = `AccessToken=${token}; path=/; max-age=86400`;
      document.cookie = `loginDetails=${encodeURIComponent(
        JSON.stringify(userDetails)
      )}; path=/; max-age=86400`;

      CommonToaster("Google login successful!", "success");

      if (userDetails?.role_id === 1) {
        navigate("/admin");
      } else {
        const profileCheck = await isProfileUpdated({
          email: response.data.user.email,
        });
        navigate(profileCheck?.data?.data === true ? "/" : "/profiledetails");
      }
    } catch (error) {
      console.error("Google Login Error", error);
      CommonToaster("Google login failed.", "error");
    }
  };

  return (
    <div className="cf-login-wrapper">
      {/* Background Subtle Gradient & Technical Grid */}
      <div className="cf-bg-ambient-light"></div>
      <div className="cf-bg-grid-overlay"></div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="cf-login-card"
      >
        {/* ================= LEFT SIDE: FORM ================= */}
        <div className="cf-form-column">
          {/* Top Navigation Row */}
          <div className="cf-top-nav-row">
            <button
              type="button"
              className="cf-back-link"
              onClick={() => navigate("/")}
              title="Return to Homepage"
            >
              <ArrowLeft size={15} />
              <span>Back to Home</span>
            </button>
            <div className="cf-portal-badge">
              <span className="cf-portal-dot"></span>
              <span>Candidate Portal</span>
            </div>
          </div>

          <div className="cf-form-main-content">
            {/* Brand Header */}
            <div className="cf-brand-header">
              <img
                src={getImageUrl(logo)}
                alt="CareerFast"
                className="cf-brand-logo"
              />
            </div>

            {/* Heading */}
            <div className="cf-heading-block">
              <h1 className="cf-title">Welcome back</h1>
              <p className="cf-subtitle">
                Enter your credentials to access your job applications and dashboard.
              </p>
            </div>

            {/* Authentication Form */}
            <form className="cf-auth-form" onSubmit={handleSubmit} noValidate>
              {/* Email Field */}
              <div className="cf-field-group">
                <label className="cf-label" htmlFor="email-input">
                  Email Address
                </label>
                <div
                  className={`cf-input-box ${errors.email ? "cf-has-error" : ""}`}
                >
                  <MailOutlined className="cf-field-icon" />
                  <input
                    id="email-input"
                    type="email"
                    name="email"
                    className="cf-native-input"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      handleInputChange("email", e.target.value, emailValidator)
                    }
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <span className="cf-error-msg">{errors.email}</span>
                )}
              </div>

              {/* Password Field */}
              <div className="cf-field-group">
                <label className="cf-label" htmlFor="password-input">
                  Password
                </label>
                <div
                  className={`cf-input-box ${errors.password ? "cf-has-error" : ""
                    }`}
                >
                  <LockOutlined className="cf-field-icon" />
                  <Input.Password
                    id="password-input"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value, passwordValidator)
                    }
                    className="cf-antd-pass"
                    variant="borderless"
                    iconRender={(visible) =>
                      visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                    }
                  />
                </div>
                {errors.password && (
                  <span className="cf-error-msg">{errors.password}</span>
                )}
              </div>

              {/* Options Row */}
              <div className="cf-options-row">
                <label className="cf-remember-label">
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="cf-custom-checkbox"
                  />
                  <span className="cf-remember-text">Remember me</span>
                </label>
                <button
                  type="button"
                  className="cf-forgot-btn"
                  onClick={() => setIsModalOpen(true)}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="cf-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="cf-loading-text">
                    <span className="cf-spinner"></span>
                    Signing in...
                  </span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRightOutlined className="cf-btn-arrow" />
                  </>
                )}
              </button>

              {/* Social Divider */}
              <div className="cf-divider">
                <span className="cf-divider-line"></span>
                <span className="cf-divider-text">or continue with</span>
                <span className="cf-divider-line"></span>
              </div>

              {/* Social Login Buttons */}
              <div className="cf-social-row">
                <div className="cf-google-wrapper">
                  <GoogleLogin
                    onSuccess={handleGoogleLogin}
                    onError={() => CommonToaster("Google login failed", "error")}
                    theme="outline"
                    shape="rectangular"
                    text="signin_with"
                    size="large"
                    width="100%"
                  />
                </div>
                <button
                  type="button"
                  className="cf-linkedin-btn"
                  onClick={() =>
                    CommonToaster(
                      "LinkedIn login will be available soon!",
                      "info"
                    )
                  }
                  title="Sign in with LinkedIn"
                >
                  <LinkedinFilled className="cf-linkedin-icon" />
                  <span>LinkedIn</span>
                </button>
              </div>
            </form>
          </div>

          {/* Form Footer */}
          <div className="cf-form-bottom">
            <div className="cf-signup-footer">
              <span>Don't have an account?</span>
              <button
                type="button"
                className="cf-signup-link"
                onClick={() => navigate("/register")}
              >
                Create an account
              </button>
            </div>
            <div className="cf-security-guarantee">
              <ShieldCheck size={13} className="cf-shield-icon" />
              <span>Encrypted 256-bit authentication</span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE: HERO VISUAL ================= */}
        <div className="cf-hero-column">
          {/* Subtle Ambient Glow Overlays */}
          <div className="cf-hero-glow cf-glow-1"></div>
          <div className="cf-hero-glow cf-glow-2"></div>
          <div className="cf-hero-grid-pattern"></div>

          {/* Top Header */}
          <div className="cf-hero-top">
            <div className="cf-hero-tag">
              <Sparkles size={12} className="cf-sparkle-icon" />
              <span>Verified Tech Career Platform</span>
            </div>
            <h2 className="cf-hero-heading">
              Your next career breakthrough starts here
            </h2>
            <p className="cf-hero-desc">
              Connect directly with verified recruiters at Google, Microsoft, Amazon, and 500+ top companies across India.
            </p>
          </div>

          {/* Centerpiece 1: Live Interactive Feature Showcase Card */}
          <div className="cf-showcase-stage">
            <div className="cf-preview-card">
              <div className="cf-preview-card-header">
                <div className="cf-preview-company-badge">
                  <div className="cf-company-logo-google">
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                  <div>
                    <div className="cf-preview-company-name">Google Cloud</div>
                    <div className="cf-preview-location">Bengaluru • Hybrid</div>
                  </div>
                </div>
                <div className="cf-preview-match-pill">
                  <span className="cf-pulse-dot"></span>
                  <span>98% Match</span>
                </div>
              </div>

              <div className="cf-preview-role-title">Senior Full Stack Engineer</div>
              <div className="cf-preview-tags">
                <span className="cf-tag cf-tag-accent">₹32L - ₹48L PA</span>
                <span className="cf-tag">Full Time</span>
                <span className="cf-tag">React / Node.js</span>
              </div>

              <div className="cf-preview-footer">
                <div className="cf-preview-recruiter">
                  <Zap size={13} className="cf-zap-icon" />
                  <span>Hiring Manager active today • Direct fast-track</span>
                </div>
                <span className="cf-preview-verified-badge">
                  <BadgeCheck size={14} />
                  Verified
                </span>
              </div>
            </div>

            {/* Placement Proof Strip */}
            <div className="cf-placement-badge">
              <div className="cf-avatar-stack">
                <img src={getImageUrl(avatar1)} alt="Candidate Priya" className="cf-avatar-img" />
                <img src={getImageUrl(avatar2)} alt="Candidate Rahul" className="cf-avatar-img" />
                <img src={getImageUrl(avatar3)} alt="Candidate Sneha" className="cf-avatar-img" />
                <span className="cf-avatar-count">+50k</span>
              </div>
              <div className="cf-placement-text">
                <span className="cf-placement-bold">50,000+ Placed Candidates</span>
                <span className="cf-placement-sub">Average 65% salary hike across top tech roles</span>
              </div>
            </div>
          </div>

          {/* Bottom Stats & Trust Strip */}
          <div className="cf-hero-bottom">
            <div className="cf-hero-stats-row">
              <div className="cf-stat-cell">
                <span className="cf-stat-number">10,000+</span>
                <span className="cf-stat-title">Verified Jobs</span>
              </div>
              <div className="cf-stat-sep"></div>
              <div className="cf-stat-cell">
                <span className="cf-stat-number">500+</span>
                <span className="cf-stat-title">Top Companies</span>
              </div>
              <div className="cf-stat-sep"></div>
              <div className="cf-stat-cell">
                <span className="cf-stat-number">98%</span>
                <span className="cf-stat-title">Placement Rate</span>
              </div>
            </div>

            <div className="cf-trusted-by">
              <span className="cf-trusted-label">Trusted by engineers at</span>
              <div className="cf-trusted-logos">
                <span>Google</span>
                <span>Microsoft</span>
                <span>Amazon</span>
                <span>TCS</span>
                <span>Zoho</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      <Modal
        title="Reset Password"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setModalStep(1);
        }}
        footer={null}
        className="premium-modal cf-theme-modal"
        centered
        width={480}
        maskClosable={false}
      >
        <div style={{ padding: "8px 0" }}>
          <AnimatePresence mode="wait">
            {modalStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="cf-modal-subtitle">
                  Enter your registered email to receive a verification code.
                </p>
                <CommonInputField
                  label="Registered Email"
                  mandatory={true}
                  placeholder="Enter your registered email"
                  value={modalData.email}
                  onChange={(e) =>
                    setModalData({ ...modalData, email: e.target.value })
                  }
                  error={errors.modalEmail}
                />
                <button
                  type="button"
                  className="modal-action-btn cf-modal-btn"
                  disabled={modalLoading}
                  onClick={async () => {
                    const err = emailValidator(modalData.email);
                    if (err) {
                      setErrors({ modalEmail: err });
                      return;
                    }
                    try {
                      setModalLoading(true);
                      await sendOtp({ email: modalData.email });
                      CommonToaster("OTP sent successfully", "success");
                      setModalStep(2);
                    } catch (e) {
                      CommonToaster("Failed to send OTP", "error");
                    } finally {
                      setModalLoading(false);
                    }
                  }}
                >
                  {modalLoading ? "Sending Code..." : "Send Verification Code"}
                </button>
              </motion.div>
            )}

            {modalStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="otp-display-container">
                  <p className="cf-modal-subtitle" style={{ textAlign: "center" }}>
                    Enter the 6-digit code sent to <b>{modalData.email}</b>
                  </p>
                  <Input.OTP
                    size="large"
                    value={modalData.otp}
                    onChange={(val) =>
                      setModalData({ ...modalData, otp: val })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="modal-action-btn cf-modal-btn"
                  disabled={modalLoading}
                  onClick={async () => {
                    if (modalData.otp.length < 6) {
                      CommonToaster("Enter full OTP", "error");
                      return;
                    }
                    try {
                      setModalLoading(true);
                      await verifyOtp({
                        email: modalData.email,
                        otp: modalData.otp,
                      });
                      setModalStep(3);
                    } catch (e) {
                      CommonToaster("Invalid OTP", "error");
                    } finally {
                      setModalLoading(false);
                    }
                  }}
                >
                  {modalLoading ? "Verifying..." : "Verify Code"}
                </button>
                <div style={{ textAlign: "center", marginTop: 18 }}>
                  <button
                    type="button"
                    className="cf-forgot-btn"
                    onClick={() => setModalStep(1)}
                  >
                    Back to Email
                  </button>
                </div>
              </motion.div>
            )}

            {modalStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="cf-modal-subtitle">
                  Create a strong new password for your account.
                </p>
                <CommonPasswordField
                  label="New Password"
                  mandatory={true}
                  placeholder="••••••••"
                  value={modalData.newPassword}
                  onChange={(e) =>
                    setModalData({ ...modalData, newPassword: e.target.value })
                  }
                />
                <CommonPasswordField
                  label="Confirm Password"
                  mandatory={true}
                  placeholder="••••••••"
                  value={modalData.confirmPassword}
                  onChange={(e) =>
                    setModalData({
                      ...modalData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
                <button
                  type="button"
                  className="modal-action-btn cf-modal-btn"
                  disabled={modalLoading}
                  onClick={async () => {
                    const passErr = passwordValidator(modalData.newPassword);
                    const confErr = confirmPasswordValidation(
                      modalData.newPassword,
                      modalData.confirmPassword
                    );
                    if (passErr || confErr) {
                      CommonToaster(passErr || confErr, "error");
                      return;
                    }
                    try {
                      setModalLoading(true);
                      await forgotPassword({
                        email: modalData.email,
                        password: modalData.newPassword,
                      });
                      CommonToaster("Password reset successful", "success");
                      setIsModalOpen(false);
                      setModalStep(1);
                    } catch (e) {
                      CommonToaster("Failed to reset password", "error");
                    } finally {
                      setModalLoading(false);
                    }
                  }}
                >
                  {modalLoading ? "Updating..." : "Reset Password"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;
