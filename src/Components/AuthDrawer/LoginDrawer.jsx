'use client';
import React, { useState, useEffect } from "react";
import { Drawer, Input, Checkbox, Tooltip } from "antd";
import { MailOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined, CloseOutlined } from "@ant-design/icons";
import { Briefcase, Building2, MapPin, ShieldCheck, ArrowRight, ArrowLeft, Sparkles, CheckCircle2, Lock } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { storeLoginStatus } from "../../Redux/Slice";
import { CommonToaster } from "../../Common/CommonToaster";
import { getImageUrl } from "../../utils/getImageUrl";
import { emailValidator } from "../../Common/Validation";
import {
  login,
  googleLogin,
  sendOtp,
  verifyOtp,
  forgotPassword,
  getRoles
} from "../../ApiService/action";
import { requestForToken } from "../../firebase/fireBase";
import logo from "../../images/careerfastlogofinal.png";
import "./LoginDrawer.css";

export default function LoginDrawer({
  open,
  onClose,
  job = null,
  actionType = "apply", // 'apply' | 'save' | 'general'
  onLoginSuccess
}) {
  const dispatch = useDispatch();

  // Login form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roleId, setRoleId] = useState(2);

  // Forgot password flow state inside drawer
  const [viewMode, setViewMode] = useState("login"); // 'login' | 'forgot_email' | 'forgot_otp'
  const [forgotData, setForgotData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [forgotErrors, setForgotErrors] = useState({});
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // Pre-fill remembered email
      try {
        const storedEmail = localStorage.getItem("rememberedEmail");
        if (storedEmail) {
          setFormData((prev) => ({ ...prev, email: storedEmail }));
          setRememberMe(true);
        }
      } catch (e) {}

      // Fetch candidate role id if possible
      getRoles()
        .then((res) => {
          const roles = res?.data?.data || [];
          const candidateRole = roles.find((r) => r.name === "CANDIDATE");
          if (candidateRole) setRoleId(candidateRole.id);
        })
        .catch(() => {});
    }
  }, [open]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleLoginSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    const emailErr = emailValidator(formData.email);
    const passErr = !formData.password || formData.password.trim() === "" ? "Password is required" : "";

    if (emailErr || passErr) {
      setErrors({
        email: emailErr,
        password: passErr,
      });
      return;
    }

    if (rememberMe) {
      localStorage.setItem("rememberedEmail", formData.email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    try {
      setIsLoading(true);
      let fcm_token = null;
      try {
        fcm_token = await requestForToken();
        if (fcm_token) localStorage.setItem("fcm_token", fcm_token);
      } catch (err) {}

      const payload = {
        email: formData.email.trim(),
        password: formData.password,
        role_id: roleId || 2,
        fcm_token: fcm_token || localStorage.getItem("fcm_token") || "",
      };

      const response = await login(payload);
      const token = response?.data?.token;
      const loginDetails = response?.data?.data?.[0];

      if (!token || !loginDetails) {
        throw new Error("Invalid response from server");
      }

      // Save auth state
      localStorage.setItem("AccessToken", token);
      localStorage.setItem("loginDetails", JSON.stringify(loginDetails));

      document.cookie = `AccessToken=${token}; path=/; max-age=86400`;
      document.cookie = `loginDetails=${encodeURIComponent(JSON.stringify(loginDetails))}; path=/; max-age=86400`;

      // Update Redux
      dispatch(storeLoginStatus(true));

      // Dispatch global events for instant sync across components
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("authChange", { detail: loginDetails }));

      CommonToaster("Logged in successfully! 🚀", "success");

      // Notify parent & close
      if (onLoginSuccess) {
        onLoginSuccess(loginDetails);
      }
      onClose();
    } catch (error) {
      console.error("LoginDrawer error:", error);
      const msg =
        error?.response?.data?.details ||
        error?.response?.data?.message ||
        "Login failed. Please verify your credentials.";
      CommonToaster(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      const response = await googleLogin({ token: credentialResponse.credential });
      const token = response?.data?.token;
      const userDetails = response?.data?.user;

      if (!token || !userDetails) {
        throw new Error("Google login did not return user details");
      }

      localStorage.setItem("AccessToken", token);
      localStorage.setItem("loginDetails", JSON.stringify(userDetails));

      document.cookie = `AccessToken=${token}; path=/; max-age=86400`;
      document.cookie = `loginDetails=${encodeURIComponent(JSON.stringify(userDetails))}; path=/; max-age=86400`;

      dispatch(storeLoginStatus(true));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("authChange", { detail: userDetails }));

      CommonToaster("Logged in with Google successfully! 🚀", "success");

      if (onLoginSuccess) {
        onLoginSuccess(userDetails);
      }
      onClose();
    } catch (error) {
      console.error("Google Login Error:", error);
      CommonToaster("Google login failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password step 1: send OTP
  const handleSendOtp = async () => {
    const emailErr = emailValidator(forgotData.email);
    if (emailErr) {
      setForgotErrors({ email: emailErr });
      return;
    }

    try {
      setForgotLoading(true);
      await sendOtp({ email: forgotData.email.trim() });
      CommonToaster("OTP sent to your email address!", "success");
      setViewMode("forgot_otp");
    } catch (error) {
      console.error("Send OTP error:", error);
      const msg = error?.response?.data?.message || "Failed to send OTP.";
      CommonToaster(msg, "error");
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot password step 2: verify and update
  const handleResetPassword = async () => {
    const errs = {};
    if (!forgotData.otp || forgotData.otp.trim().length < 4) errs.otp = "Valid OTP is required";
    if (!forgotData.newPassword || forgotData.newPassword.length < 6) errs.newPassword = "Password must be at least 6 characters";
    if (forgotData.newPassword !== forgotData.confirmPassword) errs.confirmPassword = "Passwords do not match";

    if (Object.keys(errs).length > 0) {
      setForgotErrors(errs);
      return;
    }

    try {
      setForgotLoading(true);
      await verifyOtp({ email: forgotData.email.trim(), otp: forgotData.otp.trim() });
      await forgotPassword({ email: forgotData.email.trim(), newPassword: forgotData.newPassword });

      CommonToaster("Password reset successfully! Please sign in with your new password.", "success");
      setFormData((prev) => ({ ...prev, email: forgotData.email, password: "" }));
      setViewMode("login");
    } catch (error) {
      console.error("Reset password error:", error);
      const msg = error?.response?.data?.message || "Failed to reset password. Please check OTP.";
      CommonToaster(msg, "error");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <Drawer
      title={null}
      placement="right"
      onClose={onClose}
      open={open}
      closable={false}
      width={460}
      zIndex={10000}
      className="cf-auth-drawer"
      styles={{ body: { padding: 0 } }}
    >
      <div className="cf-auth-drawer-container">
        {/* Top Header Bar */}
        <div className="cf-drawer-header">
          <div className="cf-drawer-brand">
            <img src={getImageUrl(logo)} alt="CareerFast" className="cf-drawer-logo" />
            <span className="cf-drawer-badge">
              <span className="cf-drawer-dot"></span> Candidate Login
            </span>
          </div>
          <button className="cf-drawer-close-btn" onClick={onClose} aria-label="Close drawer">
            <CloseOutlined />
          </button>
        </div>

        {/* Job Context Preview Card (if applicable) */}
        {job && (
          <div className="cf-drawer-job-card">
            <div className="cf-drawer-job-top">
              <div className="cf-drawer-job-logo-wrap">
                {job.logo ? (
                  <img
                    src={getImageUrl(job.logo)}
                    alt={job.company}
                    className="cf-drawer-job-logo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="cf-drawer-job-initial">
                    {job.company ? job.company.charAt(0).toUpperCase() : "C"}
                  </div>
                )}
              </div>
              <div className="cf-drawer-job-info">
                <h4 className="cf-drawer-job-title">{job.title}</h4>
                <div className="cf-drawer-job-company">
                  <Building2 size={13} /> {job.company}
                </div>
              </div>
            </div>

            <div className="cf-drawer-job-meta">
              {job.location && (
                <span className="cf-drawer-job-tag">
                  <MapPin size={12} /> {job.location}
                </span>
              )}
              {job.salary && job.salary !== "Not Disclosed" && (
                <span className="cf-drawer-job-tag cf-drawer-tag-salary">
                  {job.salary}
                </span>
              )}
            </div>

            <div className="cf-drawer-job-notice">
              <Lock size={12} />
              <span>
                {actionType === "save"
                  ? "Login required to save this job to your wishlist"
                  : "Login required to apply and submit your candidate profile"}
              </span>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="cf-drawer-body">
          {viewMode === "login" && (
            <>
              <div className="cf-drawer-title-box">
                <h2 className="cf-drawer-title">Welcome Back</h2>
                <p className="cf-drawer-subtitle">
                  Sign in with your CareerFast candidate account to continue.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="cf-drawer-form" noValidate>
                {/* Email Field */}
                <div className="cf-drawer-field">
                  <label className="cf-drawer-label" htmlFor="drawer-login-email">
                    Email Address <span className="cf-required">*</span>
                  </label>
                  <div className={`cf-drawer-input-wrapper ${errors.email ? "cf-has-error" : ""}`}>
                    <MailOutlined className="cf-drawer-field-icon" />
                    <input
                      id="drawer-login-email"
                      type="email"
                      className="cf-drawer-input"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <span className="cf-drawer-error">{errors.email}</span>}
                </div>

                {/* Password Field */}
                <div className="cf-drawer-field">
                  <label className="cf-drawer-label" htmlFor="drawer-login-password">
                    Password <span className="cf-required">*</span>
                  </label>
                  <div className={`cf-drawer-input-wrapper ${errors.password ? "cf-has-error" : ""}`}>
                    <LockOutlined className="cf-drawer-field-icon" />
                    <Input.Password
                      id="drawer-login-password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="cf-drawer-antd-pass"
                      variant="borderless"
                      iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                    />
                  </div>
                  {errors.password && <span className="cf-drawer-error">{errors.password}</span>}
                </div>

                {/* Options Row: Remember Me & Forgot Password */}
                <div className="cf-drawer-options-row">
                  <label className="cf-drawer-checkbox-label">
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="cf-drawer-checkbox"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="cf-drawer-forgot-link"
                    onClick={() => {
                      setForgotData((prev) => ({ ...prev, email: formData.email }));
                      setForgotErrors({});
                      setViewMode("forgot_email");
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="cf-drawer-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="cf-drawer-btn-loading">
                      <span className="cf-drawer-spinner"></span> Authenticating...
                    </span>
                  ) : (
                    <>
                      <span>{actionType === "save" ? "Sign In & Save" : "Sign In & Apply"}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Social Login / Google */}
              <div className="cf-drawer-divider">
                <span>or continue with</span>
              </div>

              <div className="cf-drawer-google-wrap">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => CommonToaster("Google login failed.", "error")}
                  useOneTap={false}
                  theme="outline"
                  shape="rectangular"
                  size="large"
                  text="signin_with"
                  width="100%"
                />
              </div>

              {/* Register Prompt */}
              <div className="cf-drawer-footer-switch">
                <span>New to CareerFast? </span>
                <a
                  href="/register"
                  className="cf-drawer-register-link"
                  onClick={(e) => {
                    // Navigate to register page
                  }}
                >
                  Create an Account
                </a>
              </div>
            </>
          )}

          {/* Forgot Password - Step 1: Email */}
          {viewMode === "forgot_email" && (
            <div className="cf-drawer-forgot-box">
              <button
                type="button"
                className="cf-drawer-back-btn"
                onClick={() => setViewMode("login")}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>

              <div className="cf-drawer-title-box">
                <h2 className="cf-drawer-title">Reset Password</h2>
                <p className="cf-drawer-subtitle">
                  Enter your registered candidate email address and we will send you a verification code.
                </p>
              </div>

              <div className="cf-drawer-field">
                <label className="cf-drawer-label">Email Address</label>
                <div className={`cf-drawer-input-wrapper ${forgotErrors.email ? "cf-has-error" : ""}`}>
                  <MailOutlined className="cf-drawer-field-icon" />
                  <input
                    type="email"
                    className="cf-drawer-input"
                    placeholder="name@example.com"
                    value={forgotData.email}
                    onChange={(e) => {
                      setForgotData((prev) => ({ ...prev, email: e.target.value }));
                      setForgotErrors((prev) => ({ ...prev, email: "" }));
                    }}
                  />
                </div>
                {forgotErrors.email && <span className="cf-drawer-error">{forgotErrors.email}</span>}
              </div>

              <button
                type="button"
                className="cf-drawer-submit-btn"
                onClick={handleSendOtp}
                disabled={forgotLoading}
              >
                {forgotLoading ? "Sending OTP..." : "Send Verification OTP"}
              </button>
            </div>
          )}

          {/* Forgot Password - Step 2: OTP & New Password */}
          {viewMode === "forgot_otp" && (
            <div className="cf-drawer-forgot-box">
              <button
                type="button"
                className="cf-drawer-back-btn"
                onClick={() => setViewMode("forgot_email")}
              >
                <ArrowLeft size={14} /> Back
              </button>

              <div className="cf-drawer-title-box">
                <h2 className="cf-drawer-title">Enter OTP & New Password</h2>
                <p className="cf-drawer-subtitle">
                  We sent an OTP code to <strong>{forgotData.email}</strong>.
                </p>
              </div>

              <div className="cf-drawer-field">
                <label className="cf-drawer-label">6-Digit OTP</label>
                <div className={`cf-drawer-input-wrapper ${forgotErrors.otp ? "cf-has-error" : ""}`}>
                  <input
                    type="text"
                    className="cf-drawer-input"
                    placeholder="Enter OTP"
                    value={forgotData.otp}
                    onChange={(e) => {
                      setForgotData((prev) => ({ ...prev, otp: e.target.value }));
                      setForgotErrors((prev) => ({ ...prev, otp: "" }));
                    }}
                  />
                </div>
                {forgotErrors.otp && <span className="cf-drawer-error">{forgotErrors.otp}</span>}
              </div>

              <div className="cf-drawer-field">
                <label className="cf-drawer-label">New Password</label>
                <div className={`cf-drawer-input-wrapper ${forgotErrors.newPassword ? "cf-has-error" : ""}`}>
                  <LockOutlined className="cf-drawer-field-icon" />
                  <Input.Password
                    placeholder="Enter new password"
                    value={forgotData.newPassword}
                    onChange={(e) => {
                      setForgotData((prev) => ({ ...prev, newPassword: e.target.value }));
                      setForgotErrors((prev) => ({ ...prev, newPassword: "" }));
                    }}
                    className="cf-drawer-antd-pass"
                    variant="borderless"
                  />
                </div>
                {forgotErrors.newPassword && <span className="cf-drawer-error">{forgotErrors.newPassword}</span>}
              </div>

              <div className="cf-drawer-field">
                <label className="cf-drawer-label">Confirm Password</label>
                <div className={`cf-drawer-input-wrapper ${forgotErrors.confirmPassword ? "cf-has-error" : ""}`}>
                  <LockOutlined className="cf-drawer-field-icon" />
                  <Input.Password
                    placeholder="Confirm new password"
                    value={forgotData.confirmPassword}
                    onChange={(e) => {
                      setForgotData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                      setForgotErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }}
                    className="cf-drawer-antd-pass"
                    variant="borderless"
                  />
                </div>
                {forgotErrors.confirmPassword && <span className="cf-drawer-error">{forgotErrors.confirmPassword}</span>}
              </div>

              <button
                type="button"
                className="cf-drawer-submit-btn"
                onClick={handleResetPassword}
                disabled={forgotLoading}
              >
                {forgotLoading ? "Resetting..." : "Reset Password & Login"}
              </button>
            </div>
          )}
        </div>

        {/* Bottom Trust Badge */}
        <div className="cf-drawer-trust-footer">
          <ShieldCheck size={14} className="cf-drawer-trust-icon" />
          <span>100% Free & Verified Job Applications • Secure 256-bit Encryption</span>
        </div>
      </div>
    </Drawer>
  );
}
