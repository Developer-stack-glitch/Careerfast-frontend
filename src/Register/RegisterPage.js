'use client';
import React, { useState } from "react";
import { Checkbox, Input } from "antd";
import { CommonToaster } from "../Common/CommonToaster";
import {
  MailOutlined,
  UserOutlined,
  PhoneOutlined,
  ArrowRightOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  BadgeCheck,
  Zap,
  Briefcase,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import "../css/RegisterPage.css";
import logo from "../images/careerfastlogofinal.png";
import avatar1 from "../images/priya.jpg";
import avatar2 from "../images/rahul.jpg";
import avatar3 from "../images/sneha.jpg";
import { useNavigate } from "@/routing-shim";
import {
  nameValidator,
  emailValidator,
  passwordValidator,
  phoneValidation,
  confirmPasswordValidation,
} from "../Common/Validation";
import { getImageUrl } from "../utils/getImageUrl";
import { register } from "../ApiService/action";

const RegisterPage = () => {
  const navigate = useNavigate();

  // Form States
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value, validator) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validator) {
      setErrors((prev) => ({ ...prev, [field]: validator(value) }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    const fnameErr = nameValidator(formData.fname);
    const lnameErr = nameValidator(formData.lname);
    const phoneErr = phoneValidation(formData.phone);
    const emailErr = emailValidator(formData.email);
    const passErr = passwordValidator(formData.password);
    const confirmPassErr = confirmPasswordValidation(
      formData.password,
      formData.confirmPassword
    );

    if (
      fnameErr ||
      lnameErr ||
      phoneErr ||
      emailErr ||
      passErr ||
      confirmPassErr
    ) {
      setErrors({
        fname: fnameErr,
        lname: lnameErr,
        phone: phoneErr,
        email: emailErr,
        password: passErr,
        confirmPassword: confirmPassErr,
      });
      CommonToaster("Please fill in all required fields correctly.", "error");
      return;
    }

    if (!agreeTerms) {
      CommonToaster("Please agree to the Terms of Service to proceed.", "error");
      return;
    }

    const registerload = {
      first_name: formData.fname,
      last_name: formData.lname,
      phone_code: "+91",
      phone: formData.phone,
      email: formData.email,
      password: formData.password,
      organization: null,
      organization_type_id: null,
      role_id: 2,
    };

    try {
      setIsLoading(true);
      await register(registerload);

      setTimeout(() => {
        setIsLoading(false);
        CommonToaster("Candidate registered successfully! Please sign in.", "success");
        navigate("/login");
      }, 800);
    } catch (error) {
      setIsLoading(false);
      const errorMsg =
        error.response?.data?.details ||
        error.response?.data?.message ||
        error.message ||
        "Registration failed. Please try again.";
      CommonToaster(errorMsg, "error");
    }
  };

  return (
    <div className="cf-register-wrapper">
      {/* Background Subtle Gradient & Technical Grid */}
      <div className="cf-bg-ambient-light"></div>
      <div className="cf-bg-grid-overlay"></div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="cf-register-card"
      >
        {/* ================= LEFT SIDE: REGISTRATION FORM ================= */}
        <div className="cf-register-form-column">
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
              <h1 className="cf-title">Create your account</h1>
              <p className="cf-subtitle">
                Join thousands of tech professionals landing roles at top companies.
              </p>
            </div>

            {/* Registration Form */}
            <form className="cf-auth-form" onSubmit={handleSubmit} noValidate>
              {/* Row 1: First Name & Last Name */}
              <div className="cf-grid-row">
                <div className="cf-field-group">
                  <label className="cf-label" htmlFor="fname-input">
                    First Name
                  </label>
                  <div
                    className={`cf-input-box ${
                      errors.fname ? "cf-has-error" : ""
                    }`}
                  >
                    <UserOutlined className="cf-field-icon" />
                    <input
                      id="fname-input"
                      type="text"
                      name="fname"
                      className="cf-native-input"
                      placeholder="e.g. Rahul"
                      value={formData.fname}
                      onChange={(e) =>
                        handleInputChange("fname", e.target.value, nameValidator)
                      }
                      autoComplete="given-name"
                    />
                  </div>
                  {errors.fname && (
                    <span className="cf-error-msg">{errors.fname}</span>
                  )}
                </div>

                <div className="cf-field-group">
                  <label className="cf-label" htmlFor="lname-input">
                    Last Name
                  </label>
                  <div
                    className={`cf-input-box ${
                      errors.lname ? "cf-has-error" : ""
                    }`}
                  >
                    <UserOutlined className="cf-field-icon" />
                    <input
                      id="lname-input"
                      type="text"
                      name="lname"
                      className="cf-native-input"
                      placeholder="e.g. Sharma"
                      value={formData.lname}
                      onChange={(e) =>
                        handleInputChange("lname", e.target.value, nameValidator)
                      }
                      autoComplete="family-name"
                    />
                  </div>
                  {errors.lname && (
                    <span className="cf-error-msg">{errors.lname}</span>
                  )}
                </div>
              </div>

              {/* Row 2: Email & Phone */}
              <div className="cf-grid-row">
                <div className="cf-field-group">
                  <label className="cf-label" htmlFor="email-input">
                    Email Address
                  </label>
                  <div
                    className={`cf-input-box ${
                      errors.email ? "cf-has-error" : ""
                    }`}
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

                <div className="cf-field-group">
                  <label className="cf-label" htmlFor="phone-input">
                    Phone Number
                  </label>
                  <div
                    className={`cf-input-box ${
                      errors.phone ? "cf-has-error" : ""
                    }`}
                  >
                    <PhoneOutlined className="cf-field-icon" />
                    <span className="cf-phone-prefix">+91</span>
                    <input
                      id="phone-input"
                      type="tel"
                      name="phone"
                      className="cf-native-input"
                      placeholder="9876543210"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value, phoneValidation)
                      }
                      autoComplete="tel"
                    />
                  </div>
                  {errors.phone && (
                    <span className="cf-error-msg">{errors.phone}</span>
                  )}
                </div>
              </div>

              {/* Row 3: Password & Confirm Password */}
              <div className="cf-grid-row">
                <div className="cf-field-group">
                  <label className="cf-label" htmlFor="password-input">
                    Password
                  </label>
                  <div
                    className={`cf-input-box ${
                      errors.password ? "cf-has-error" : ""
                    }`}
                  >
                    <LockOutlined className="cf-field-icon" />
                    <Input.Password
                      id="password-input"
                      name="password"
                      placeholder="Min. 8 characters"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange(
                          "password",
                          e.target.value,
                          passwordValidator
                        )
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

                <div className="cf-field-group">
                  <label className="cf-label" htmlFor="confirm-password-input">
                    Confirm Password
                  </label>
                  <div
                    className={`cf-input-box ${
                      errors.confirmPassword ? "cf-has-error" : ""
                    }`}
                  >
                    <LockOutlined className="cf-field-icon" />
                    <Input.Password
                      id="confirm-password-input"
                      name="confirmPassword"
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value, (val) =>
                          confirmPasswordValidation(formData.password, val)
                        )
                      }
                      className="cf-antd-pass"
                      variant="borderless"
                      iconRender={(visible) =>
                        visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                      }
                    />
                  </div>
                  {errors.confirmPassword && (
                    <span className="cf-error-msg">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="cf-terms-row">
                <label className="cf-terms-label">
                  <Checkbox
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="cf-custom-checkbox"
                  />
                  <span className="cf-terms-text">
                    I agree to the{" "}
                    <button
                      type="button"
                      className="cf-link-btn"
                      onClick={() => navigate("/termsofuse")}
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      className="cf-link-btn"
                      onClick={() => navigate("/privacypolicy")}
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
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
                    Creating Account...
                  </span>
                ) : (
                  <>
                    <span>Create Candidate Account</span>
                    <ArrowRightOutlined className="cf-btn-arrow" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Form Footer */}
          <div className="cf-form-bottom">
            <div className="cf-signup-footer">
              <span>Already have an account?</span>
              <button
                type="button"
                className="cf-signup-link"
                onClick={() => navigate("/login")}
              >
                Sign in
              </button>
            </div>
            <div className="cf-security-guarantee">
              <ShieldCheck size={13} className="cf-shield-icon" />
              <span>Encrypted 256-bit candidate data protection</span>
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
              <span>Fast-Track Your Tech Career</span>
            </div>
            <h2 className="cf-hero-heading">
              Get discovered by verified hiring teams
            </h2>
            <p className="cf-hero-desc">
              Join 50,000+ candidates who skip recruitment black holes and connect directly with engineering leaders.
            </p>
          </div>

          {/* Centerpiece: Platform Benefits Showcase Card */}
          <div className="cf-showcase-stage">
            <div className="cf-preview-card">
              <div className="cf-preview-card-header">
                <div className="cf-preview-company-badge">
                  <div className="cf-benefit-icon-badge">
                    <Zap size={18} className="cf-bolt-icon" />
                  </div>
                  <div>
                    <div className="cf-preview-company-name">CareerFast Talent Pass</div>
                    <div className="cf-preview-location">Active Profile Status</div>
                  </div>
                </div>
                <div className="cf-preview-match-pill">
                  <span className="cf-pulse-dot"></span>
                  <span>Fast-Track</span>
                </div>
              </div>

              {/* Benefits Checklist */}
              <div className="cf-benefits-list">
                <div className="cf-benefit-item">
                  <CheckCircle2 size={16} className="cf-benefit-check" />
                  <span>Direct recruiter outreach from Google, Amazon & top startups</span>
                </div>
                <div className="cf-benefit-item">
                  <CheckCircle2 size={16} className="cf-benefit-check" />
                  <span>Transparent compensation insights from ₹18L to ₹60L PA</span>
                </div>
                <div className="cf-benefit-item">
                  <CheckCircle2 size={16} className="cf-benefit-check" />
                  <span>Priority interview shortlisting with verified partner badges</span>
                </div>
              </div>

              <div className="cf-preview-footer">
                <div className="cf-preview-recruiter">
                  <Briefcase size={13} className="cf-briefcase-icon" />
                  <span>10,000+ Active tech openings available today</span>
                </div>
                <span className="cf-preview-verified-badge">
                  <BadgeCheck size={14} />
                  Verified
                </span>
              </div>
            </div>

            {/* Candidate Testimonial Proof Strip */}
            <div className="cf-placement-badge">
              <div className="cf-avatar-stack">
                <img
                  src={getImageUrl(avatar1)}
                  alt="Candidate Priya"
                  className="cf-avatar-img"
                />
                <img
                  src={getImageUrl(avatar2)}
                  alt="Candidate Rahul"
                  className="cf-avatar-img"
                />
                <img
                  src={getImageUrl(avatar3)}
                  alt="Candidate Sneha"
                  className="cf-avatar-img"
                />
                <span className="cf-avatar-count">+50k</span>
              </div>
              <div className="cf-placement-text">
                <span className="cf-placement-bold">
                  "Got 3 interview calls in my first week"
                </span>
                <span className="cf-placement-sub">
                  Rahul V. landed an SDE role with a 75% salary hike
                </span>
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
                <span className="cf-stat-number">₹18.5L</span>
                <span className="cf-stat-title">Avg. Placed CTC</span>
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
    </div>
  );
};

export default RegisterPage;
