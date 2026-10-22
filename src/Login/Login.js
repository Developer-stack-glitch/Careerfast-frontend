'use client';
import React, { useEffect, useState } from "react";
import { Checkbox, Modal, Input } from "antd";
import { CommonToaster } from "../Common/CommonToaster";
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  MailOutlined,
  MobileOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "../css/LoginPage.css";
import logo from "../images/careerfastlogofinal.png";
import benefitsImg from "../images/register_img.png";
import { useNavigate } from "@/routing-shim";
import {
  emailValidator,
  passwordValidator,
  confirmPasswordValidation,
  phoneValidation,
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
  sendLoginOTP,
  verifyLoginOTP,
} from "../ApiService/action";
import { GoogleLogin } from "@react-oauth/google";
import { requestForToken } from "../firebase/fireBase";
import { useDispatch } from "react-redux";
import { storeLoginStatus } from "../Redux/Slice";

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Mode: "password" or "otp"
  const [loginMode, setLoginMode] = useState("password");

  // OTP Channel: "email" or "phone"
  const [otpChannel, setOtpChannel] = useState("email");
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTarget, setOtpTarget] = useState("");
  const [otpTimer, setOtpTimer] = useState(30);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpErrors, setOtpErrors] = useState({});

  // Password Login States
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

  // OTP Resend Countdown Timer
  useEffect(() => {
    let interval = null;
    if (otpSent && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, otpTimer]);

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
    } else {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Switch between Password and OTP Login modes
  const handleSwitchMode = (mode) => {
    setLoginMode(mode);
    setErrors({});
    setOtpErrors({});
  };

  // Switch between Email and Mobile OTP channels
  const handleSwitchChannel = (channel) => {
    setOtpChannel(channel);
    setOtpIdentifier("");
    setOtpCode("");
    setOtpSent(false);
    setOtpErrors({});
  };

  // Handle successful login response
  const processLoginSuccess = async (token, loginDetails, candidateRoleId) => {
    localStorage.setItem("AccessToken", token);
    localStorage.setItem("loginDetails", JSON.stringify(loginDetails));

    // Set cookies for cross-app synchronization
    document.cookie = `AccessToken=${token}; path=/; max-age=2592000; SameSite=Lax`;
    document.cookie = `loginDetails=${encodeURIComponent(
      JSON.stringify(loginDetails)
    )}; path=/; max-age=2592000; SameSite=Lax`;

    dispatch(storeLoginStatus(true));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("authChange", { detail: loginDetails }));

    CommonToaster("Logged in successfully!", "success");

    if (loginDetails?.role_id === 1) {
      navigate("/admin");
    } else {
      try {
        const profileCheck = await isProfileUpdated({ email: loginDetails.email });
        navigate(profileCheck?.data?.data === true ? "/" : "/profiledetails");
      } catch (err) {
        navigate("/");
      }
    }
  };

  // Password Login Submit
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
      const fcm_token = await requestForToken().catch(() => null);
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

      await processLoginSuccess(token, loginDetails, candidateRoleId);
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

  // OTP Login: Send OTP
  const handleSendOtp = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    let err = "";
    if (otpChannel === "email") {
      err = emailValidator(otpIdentifier);
    } else {
      err = phoneValidation(otpIdentifier);
    }

    if (err) {
      setOtpErrors({ identifier: err });
      CommonToaster(err, "error");
      return;
    }

    try {
      setOtpLoading(true);
      setOtpErrors({});
      const candidateRoleId =
        roleId || roleOptions.find((r) => r.name === "CANDIDATE")?.id || 2;

      const response = await sendLoginOTP({
        identifier: otpIdentifier.trim(),
        type: otpChannel,
        role_id: candidateRoleId,
      });

      setOtpSent(true);
      setOtpTimer(30);
      setOtpCode("");
      setOtpTarget(
        response?.data?.target ||
        (otpChannel === "phone" ? `+91 ${otpIdentifier}` : otpIdentifier)
      );

      const successMsg = response?.data?.message || "OTP sent successfully!";
      CommonToaster(successMsg, "success");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.details ||
        "Failed to send OTP. Please check your credentials.";
      setOtpErrors({ identifier: msg });
      CommonToaster(msg, "error");
    } finally {
      setOtpLoading(false);
    }
  };

  // OTP Login: Verify Code & Sign In
  const handleVerifyOtp = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    if (!otpCode || otpCode.trim().length < 6) {
      setOtpErrors({ code: "Please enter the complete 6-digit OTP." });
      CommonToaster("Please enter the complete 6-digit OTP.", "error");
      return;
    }

    try {
      setOtpLoading(true);
      setOtpErrors({});
      const fcm_token = await requestForToken().catch(() => null);
      if (fcm_token) localStorage.setItem("fcm_token", fcm_token);

      const candidateRoleId =
        roleId || roleOptions.find((r) => r.name === "CANDIDATE")?.id || 2;

      const response = await verifyLoginOTP({
        identifier: otpIdentifier.trim(),
        type: otpChannel,
        otp: otpCode.trim(),
        role_id: candidateRoleId,
        fcm_token: fcm_token || localStorage.getItem("fcm_token"),
      });

      const token = response?.data?.token;
      const loginDetails = response?.data?.data?.[0];

      if (!token || !loginDetails) {
        throw new Error("Invalid response from server");
      }

      await processLoginSuccess(token, loginDetails, candidateRoleId);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.details ||
        "Invalid OTP. Please check the code and try again.";
      setOtpErrors({ code: msg });
      CommonToaster(msg, "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleGoogleLogin = async (res) => {
    try {
      setIsLoading(true);
      let fcm_token = null;
      try {
        fcm_token = await requestForToken();
        if (fcm_token) localStorage.setItem("fcm_token", fcm_token);
      } catch (err) { }

      const candidateRoleId =
        roleId || roleOptions.find((r) => r.name === "CANDIDATE")?.id || 2;

      const response = await googleLogin({
        token: res.credential,
        role_id: candidateRoleId,
        fcm_token: fcm_token || localStorage.getItem("fcm_token"),
      });

      const token = response?.data?.token;
      const userDetails = response?.data?.user;

      if (!token || !userDetails) {
        throw new Error(response?.data?.message || "Invalid response from server");
      }

      await processLoginSuccess(token, userDetails, candidateRoleId);
    } catch (error) {
      console.error("Google Login Error", error);
      const msg =
        error?.response?.data?.details ||
        error?.response?.data?.message ||
        "Google login failed.";
      CommonToaster(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cf-login-page">
      {/* Top Header */}
      <header className="cf-login-header">
        <div className="cf-login-header-inner">
          <div
            className="cf-login-brand"
            onClick={() => navigate("/")}
            role="button"
            tabIndex={0}
            title="Return to CareerFast Home"
          >
            <img
              src={getImageUrl(logo)}
              alt="CareerFast Logo"
              className="cf-login-logo"
            />
          </div>
          <div className="cf-login-header-right">
            <span className="cf-login-header-text">New to CareerFast?</span>
            <button
              type="button"
              className="cf-login-header-btn"
              onClick={() => navigate("/register")}
            >
              <strong>Register</strong> here
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="cf-login-main">
        <div className="cf-login-container">
          {/* Left Card: Benefits & Highlights */}
          <aside className="cf-login-benefits-card">
            <div className="cf-login-illustration-wrap">
              <img
                src={getImageUrl(benefitsImg)}
                alt="CareerFast Opportunities"
                className="cf-login-illustration"
              />
            </div>

            <div className="cf-login-benefits-content">
              <h3 className="cf-login-benefits-title">On logging in, you can</h3>
              <ul className="cf-login-benefits-list">
                <li className="cf-login-benefit-item">
                  <span className="cf-login-check-bubble">
                    <CheckCircle2 size={15} />
                  </span>
                  <span className="cf-login-benefit-text">
                    <strong>Track job applications</strong> & view recruiter updates
                  </span>
                </li>
                <li className="cf-login-benefit-item">
                  <span className="cf-login-check-bubble">
                    <CheckCircle2 size={15} />
                  </span>
                  <span className="cf-login-benefit-text">
                    <strong>Direct messages & calls</strong> from verified hiring teams
                  </span>
                </li>
                <li className="cf-login-benefit-item">
                  <span className="cf-login-check-bubble">
                    <CheckCircle2 size={15} />
                  </span>
                  <span className="cf-login-benefit-text">
                    <strong>Explore verified jobs</strong> matching your skills & salary
                  </span>
                </li>
              </ul>
            </div>

            <div className="cf-login-trust-card">
              <div className="cf-login-trust-icon-box">
                <ShieldCheck size={17} />
              </div>
              <div className="cf-login-trust-info">
                <div className="cf-login-trust-title">100% Free & Verified</div>
                <div className="cf-login-trust-desc">Authentic recruiters • Zero candidate fee</div>
              </div>
            </div>
          </aside>

          {/* Right Card: Login Form Card */}
          <section className="cf-login-form-card">
            <div className="cf-login-card-header">
              <h1 className="cf-login-card-title">Login to your CareerFast profile</h1>
              <p className="cf-login-card-subtitle">
                Search & apply to jobs and internships from India's verified career platform
              </p>
            </div>

            {/* Segmented Mode Selector: Password vs OTP Login */}
            <div className="cf-login-mode-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={loginMode === "password"}
                className={`cf-login-mode-tab ${loginMode === "password" ? "active" : ""
                  }`}
                onClick={() => handleSwitchMode("password")}
              >
                <LockOutlined className="cf-mode-tab-icon" />
                <span>Password</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={loginMode === "otp"}
                className={`cf-login-mode-tab ${loginMode === "otp" ? "active" : ""
                  }`}
                onClick={() => handleSwitchMode("otp")}
              >
                <KeyOutlined className="cf-mode-tab-icon" />
                <span>OTP Login</span>
                <span className="cf-login-mode-badge">Email & Mobile</span>
              </button>
            </div>

            {/* ================= PASSWORD LOGIN FORM ================= */}
            {loginMode === "password" && (
              <form className="cf-login-form" onSubmit={handleSubmit} noValidate>
                {/* TOP SECTION: Email & Password on Left | Divider | Google Login on Right */}
                <div className="cf-login-top-section">
                  <div className="cf-login-top-fields">
                    {/* Email ID */}
                    <div className="cf-login-form-group">
                      <label className="cf-login-field-label" htmlFor="loginEmail">
                        Email ID<span className="cf-login-star">*</span>
                      </label>
                      <div
                        className={`cf-login-input-box ${errors.email ? "cf-login-error-box" : ""
                          }`}
                      >
                        <input
                          id="loginEmail"
                          type="email"
                          name="email"
                          placeholder="Tell us your Email ID"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value, emailValidator)
                          }
                          autoComplete="email"
                        />
                      </div>
                      {errors.email ? (
                        <span className="cf-login-error-text">{errors.email}</span>
                      ) : (
                        <span className="cf-login-helper-text">
                          We'll send relevant job alerts and updates to this email
                        </span>
                      )}
                    </div>

                    {/* Password */}
                    <div className="cf-login-form-group">
                      <label className="cf-login-field-label" htmlFor="loginPassword">
                        Password<span className="cf-login-star">*</span>
                      </label>
                      <div
                        className={`cf-login-input-box ${errors.password ? "cf-login-error-box" : ""
                          }`}
                      >
                        <Input.Password
                          id="loginPassword"
                          name="password"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={(e) =>
                            handleInputChange(
                              "password",
                              e.target.value,
                              passwordValidator
                            )
                          }
                          className="cf-login-antd-password"
                          variant="borderless"
                          iconRender={(visible) =>
                            visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                          }
                        />
                      </div>
                      {errors.password && (
                        <span className="cf-login-error-text">{errors.password}</span>
                      )}
                    </div>

                    {/* Remember Me & Forgot Password Row */}
                    <div className="cf-login-options-row">
                      <label className="cf-login-remember-label">
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span>Remember me</span>
                      </label>
                      <button
                        type="button"
                        className="cf-login-forgot-link"
                        onClick={() => setIsModalOpen(true)}
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <div className="cf-login-submit-row">
                      <button
                        type="submit"
                        className="cf-login-primary-btn"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="cf-login-btn-loader">
                            <span className="cf-login-btn-spinner"></span>
                            Logging in...
                          </span>
                        ) : (
                          "Login"
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Vertical Divider */}
                  <div className="cf-login-divider-column">
                    <div className="cf-login-divider-line"></div>
                    <span className="cf-login-divider-pill">Or</span>
                    <div className="cf-login-divider-line"></div>
                  </div>

                  {/* Right Side Social Auth */}
                  <div className="cf-login-social-column">
                    <div className="cf-login-google-btn-box">
                      <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() =>
                          CommonToaster(
                            "Google sign-in failed. Please try again.",
                            "error"
                          )
                        }
                        theme="outline"
                        shape="pill"
                        text="signin_with"
                        size="large"
                        width="100%"
                      />
                    </div>
                    <div className="cf-signup-footer">
                      <span>Don't have an account?</span>
                      <button
                        type="button"
                        className="cf-signup-link"
                        onClick={() => navigate("/register")}
                      >
                        Register
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* ================= OTP LOGIN FORM ================= */}
            {loginMode === "otp" && (
              <div className="cf-login-otp-wrapper">
                <div className="cf-login-top-section">
                  <div className="cf-login-top-fields">
                    {/* Channel Selector: Email vs Mobile */}
                    {!otpSent && (
                      <div className="cf-otp-channel-tabs">
                        <button
                          type="button"
                          className={`cf-otp-channel-tab ${otpChannel === "email" ? "active" : ""
                            }`}
                          onClick={() => handleSwitchChannel("email")}
                        >
                          <MailOutlined />
                          <span>Email ID</span>
                        </button>
                        <button
                          type="button"
                          className={`cf-otp-channel-tab ${otpChannel === "phone" ? "active" : ""
                            }`}
                          onClick={() => handleSwitchChannel("phone")}
                        >
                          <MobileOutlined />
                          <span>Mobile Number</span>
                        </button>
                      </div>
                    )}

                    {/* Step 1: Identifier Input (Email or Mobile) */}
                    {!otpSent ? (
                      <form onSubmit={handleSendOtp} noValidate>
                        {otpChannel === "email" ? (
                          <div className="cf-login-form-group">
                            <label className="cf-login-field-label" htmlFor="otpEmail">
                              Registered Email ID<span className="cf-login-star">*</span>
                            </label>
                            <div
                              className={`cf-login-input-box ${otpErrors.identifier ? "cf-login-error-box" : ""
                                }`}
                            >
                              <input
                                id="otpEmail"
                                type="email"
                                name="otpEmail"
                                placeholder="Enter your registered email ID"
                                value={otpIdentifier}
                                onChange={(e) => {
                                  setOtpIdentifier(e.target.value);
                                  setOtpErrors({});
                                }}
                                autoComplete="email"
                              />
                            </div>
                            {otpErrors.identifier ? (
                              <span className="cf-login-error-text">
                                {otpErrors.identifier}
                              </span>
                            ) : (
                              <span className="cf-login-helper-text">
                                We'll send a 6-digit login verification code to your email
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="cf-login-form-group">
                            <label className="cf-login-field-label" htmlFor="otpPhone">
                              Registered Mobile Number<span className="cf-login-star">*</span>
                            </label>
                            <div
                              className={`cf-login-phone-box ${otpErrors.identifier ? "cf-login-error-box" : ""
                                }`}
                            >
                              <span className="cf-login-phone-code">+91</span>
                              <input
                                id="otpPhone"
                                type="tel"
                                name="otpPhone"
                                maxLength={10}
                                placeholder="Enter 10-digit mobile number"
                                value={otpIdentifier}
                                onChange={(e) => {
                                  setOtpIdentifier(e.target.value.replace(/\D/g, ""));
                                  setOtpErrors({});
                                }}
                                autoComplete="tel-national"
                              />
                            </div>
                            {otpErrors.identifier ? (
                              <span className="cf-login-error-text">
                                {otpErrors.identifier}
                              </span>
                            ) : (
                              <span className="cf-login-helper-text">
                                We'll send a 6-digit login verification code to your phone
                              </span>
                            )}
                          </div>
                        )}

                        <div className="cf-login-submit-row">
                          <button
                            type="submit"
                            className="cf-login-primary-btn"
                            disabled={otpLoading}
                          >
                            {otpLoading ? (
                              <span className="cf-login-btn-loader">
                                <span className="cf-login-btn-spinner"></span>
                                Sending OTP...
                              </span>
                            ) : (
                              "Send OTP"
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Step 2: OTP Verification */
                      <form onSubmit={handleVerifyOtp} noValidate>
                        <div className="cf-otp-target-chip">
                          <div className="cf-otp-target-text">
                            <span>Code sent to:</span>
                            <strong>{otpTarget}</strong>
                          </div>
                          <button
                            type="button"
                            className="cf-otp-change-btn"
                            onClick={() => {
                              setOtpSent(false);
                              setOtpCode("");
                              setOtpErrors({});
                            }}
                          >
                            Change
                          </button>
                        </div>

                        <div className="cf-login-form-group cf-otp-input-group">
                          <label className="cf-login-field-label">
                            Enter 6-digit OTP<span className="cf-login-star">*</span>
                          </label>
                          <div className="cf-otp-box-wrapper">
                            <Input.OTP
                              size="large"
                              length={6}
                              value={otpCode}
                              onChange={(val) => {
                                setOtpCode(val);
                                setOtpErrors({});
                              }}
                              autoFocus
                            />
                          </div>
                          {otpErrors.code && (
                            <span className="cf-login-error-text" style={{ textAlign: "center" }}>
                              {otpErrors.code}
                            </span>
                          )}
                        </div>

                        <div className="cf-otp-resend-row">
                          {otpTimer > 0 ? (
                            <span className="cf-otp-timer-text">
                              Resend OTP in <strong>{otpTimer}s</strong>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="cf-login-forgot-link"
                              onClick={handleSendOtp}
                              disabled={otpLoading}
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>

                        <div className="cf-login-submit-row">
                          <button
                            type="submit"
                            className="cf-login-primary-btn"
                            disabled={otpLoading}
                          >
                            {otpLoading ? (
                              <span className="cf-login-btn-loader">
                                <span className="cf-login-btn-spinner"></span>
                                Verifying...
                              </span>
                            ) : (
                              "Verify & Login"
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Vertical Divider */}
                  <div className="cf-login-divider-column">
                    <div className="cf-login-divider-line"></div>
                    <span className="cf-login-divider-pill">Or</span>
                    <div className="cf-login-divider-line"></div>
                  </div>

                  {/* Right Side Social Auth */}
                  <div className="cf-login-social-column">
                    <div className="cf-login-google-btn-box">
                      <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() =>
                          CommonToaster(
                            "Google sign-in failed. Please try again.",
                            "error"
                          )
                        }
                        theme="outline"
                        shape="pill"
                        text="signin_with"
                        size="large"
                        width="100%"
                      />
                    </div>
                    <div className="cf-signup-footer">
                      <span>Don't have an account?</span>
                      <button
                        type="button"
                        className="cf-signup-link"
                        onClick={() => navigate("/register")}
                      >
                        Register
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BOTTOM SECTION: Terms Note */}
            <div className="cf-login-bottom-section">
              <p className="cf-login-terms-paragraph">
                By logging in, you agree to the{" "}
                <button
                  type="button"
                  className="cf-login-link-inline"
                  onClick={() => navigate("/terms-conditions")}
                >
                  Terms & Conditions
                </button>{" "}
                &{" "}
                <button
                  type="button"
                  className="cf-login-link-inline"
                  onClick={() => navigate("/privacy-policy")}
                >
                  Privacy Policy
                </button>{" "}
                of careerFast.in
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="cf-login-footer">
        <div className="cf-login-footer-links">
          <button type="button" onClick={() => navigate("/about-us")}>
            About Us
          </button>
          <span className="cf-login-footer-sep">•</span>
          <button type="button" onClick={() => navigate("/contact-us")}>
            Contact Us
          </button>
          <span className="cf-login-footer-sep">•</span>
          <button type="button" onClick={() => navigate("/faqs")}>
            FAQs
          </button>
          <span className="cf-login-footer-sep">•</span>
          <button type="button" onClick={() => navigate("/terms-conditions")}>
            Terms and Conditions
          </button>
          <span className="cf-login-footer-sep">•</span>
          <button type="button" onClick={() => navigate("/privacy-policy")}>
            Privacy Policy
          </button>
        </div>
        <p className="cf-login-footer-copyright">
          All rights reserved © 2026 CareerFast Services
        </p>
      </footer>

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
        width={460}
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
                    className="cf-login-forgot-link"
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
