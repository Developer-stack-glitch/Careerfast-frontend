'use client';
import React, { useState } from "react";
import { Checkbox, Input } from "antd";
import { CommonToaster } from "../Common/CommonToaster";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useDispatch } from "react-redux";
import { GoogleLogin } from "@react-oauth/google";
import { storeLoginStatus } from "../Redux/Slice";
import { useNavigate } from "@/routing-shim";
import {
  nameValidator,
  emailValidator,
  passwordValidator,
  phoneValidation,
} from "../Common/Validation";
import { getImageUrl } from "../utils/getImageUrl";
import { register, googleLogin, isProfileUpdated } from "../ApiService/action";
import { requestForToken } from "../firebase/fireBase";

import logo from "../images/careerfastlogofinal.png";
import jobOffersImg from "../images/register_img.png";
import "../css/RegisterPage.css";

const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Form States
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    workStatus: "fresher", // "fresher" or "experienced"
    updatesOptIn: true,
  });

  const [errors, setErrors] = useState({});
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

    const nameErr = nameValidator(formData.fullName);
    const emailErr = emailValidator(formData.email);
    const passErr = passwordValidator(formData.password);
    const phoneErr = phoneValidation(formData.phone);
    const statusErr = !formData.workStatus ? "Please select your work status." : "";

    if (nameErr || emailErr || passErr || phoneErr || statusErr) {
      setErrors({
        fullName: nameErr,
        email: emailErr,
        password: passErr,
        phone: phoneErr,
        workStatus: statusErr,
      });
      CommonToaster("Please fill in all required fields correctly.", "error");
      return;
    }

    // Split Full Name into first_name and last_name for backend
    const nameParts = formData.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || nameParts[0];

    const registerload = {
      first_name: firstName,
      last_name: lastName,
      phone_code: "+91",
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      password: formData.password,
      organization: null,
      organization_type_id: null,
      role_id: 2, // Candidate
    };

    try {
      setIsLoading(true);
      await register(registerload);

      if (typeof window !== "undefined") {
        localStorage.setItem("user_work_status", formData.workStatus);
      }

      setTimeout(() => {
        setIsLoading(false);
        CommonToaster("Candidate registered successfully! Please sign in.", "success");
        navigate("/login");
      }, 700);
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

  const handleGoogleSuccess = async (res) => {
    try {
      setIsLoading(true);
      let fcm_token = null;
      try {
        fcm_token = await requestForToken();
        if (fcm_token) localStorage.setItem("fcm_token", fcm_token);
      } catch (err) { }

      const candidateRoleId = 2; // Candidate

      const response = await googleLogin({
        token: res.credential,
        role_id: candidateRoleId,
        fcm_token:
          fcm_token ||
          (typeof window !== "undefined"
            ? localStorage.getItem("fcm_token")
            : null),
      });

      const token = response?.data?.token;
      const userDetails = response?.data?.user;

      if (!token || !userDetails) {
        throw new Error(
          response?.data?.message || "Invalid response from server"
        );
      }

      localStorage.setItem("AccessToken", token);
      localStorage.setItem("loginDetails", JSON.stringify(userDetails));

      // Set cookies for cross-app synchronization
      document.cookie = `AccessToken=${token}; path=/; max-age=2592000; SameSite=Lax`;
      document.cookie = `loginDetails=${encodeURIComponent(
        JSON.stringify(userDetails)
      )}; path=/; max-age=2592000; SameSite=Lax`;

      dispatch(storeLoginStatus(true));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(
        new CustomEvent("authChange", { detail: userDetails })
      );

      CommonToaster("Registered with Google successfully! 🎉", "success");

      if (userDetails?.role_id === 1) {
        navigate("/admin");
      } else {
        try {
          const profileCheck = await isProfileUpdated({
            email: userDetails.email,
          });
          navigate(
            profileCheck?.data?.data === true ? "/" : "/profiledetails"
          );
        } catch (checkErr) {
          console.warn(
            "Could not check profile status, default redirect:",
            checkErr
          );
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Google Registration Error", error);
      const msg =
        error?.response?.data?.details ||
        error?.response?.data?.message ||
        "Google sign-in failed. Please try again.";
      CommonToaster(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignin = () => {
    navigate("/login");
  };

  return (
    <div className="cf-reg-page">
      {/* Top Header */}
      <header className="cf-reg-header">
        <div className="cf-reg-header-inner">
          <div
            className="cf-reg-brand"
            onClick={() => navigate("/")}
            role="button"
            tabIndex={0}
            title="Return to CareerFast Home"
          >
            <img
              src={getImageUrl(logo)}
              alt="CareerFast Logo"
              className="cf-reg-logo"
            />
          </div>
          <div className="cf-reg-header-right">
            <span className="cf-reg-header-login-text">Already Registered?</span>
            <button
              type="button"
              className="cf-reg-login-btn"
              onClick={() => navigate("/login")}
            >
              <strong>Login</strong> here
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="cf-reg-main">
        <div className="cf-reg-container">
          {/* Left Card: Benefits & Highlights */}
          <aside className="cf-reg-benefits-card">
            <div className="cf-reg-illustration-wrap">
              <img
                src={getImageUrl(jobOffersImg)}
                alt="CareerFast Opportunities"
                className="cf-reg-illustration"
              />
            </div>

            <div className="cf-reg-benefits-content">
              <h3 className="cf-reg-benefits-title">On registering, you can</h3>
              <ul className="cf-reg-benefits-list">
                <li className="cf-reg-benefit-item">
                  <span className="cf-reg-check-bubble">
                    <CheckCircle2 size={15} />
                  </span>
                  <span className="cf-reg-benefit-text">
                    <strong>Build your profile</strong> & let verified recruiters find you
                  </span>
                </li>
                <li className="cf-reg-benefit-item">
                  <span className="cf-reg-check-bubble">
                    <CheckCircle2 size={15} />
                  </span>
                  <span className="cf-reg-benefit-text">
                    <strong>Get job & internship postings</strong> delivered right to your email
                  </span>
                </li>
                <li className="cf-reg-benefit-item">
                  <span className="cf-reg-check-bubble">
                    <CheckCircle2 size={15} />
                  </span>
                  <span className="cf-reg-benefit-text">
                    <strong>Apply to 100% verified jobs</strong> and grow your career
                  </span>
                </li>
              </ul>
            </div>

            <div className="cf-reg-trust-card">
              <div className="cf-reg-trust-icon-box">
                <ShieldCheck size={17} />
              </div>
              <div className="cf-reg-trust-info">
                <div className="cf-reg-trust-title">100% Free & Verified</div>
                <div className="cf-reg-trust-desc">Authentic recruiters • Zero candidate fee</div>
              </div>
            </div>
          </aside>

          {/* Right Card: Registration Form */}
          <section className="cf-reg-form-card">
            <div className="cf-reg-card-header">
              <h1 className="cf-reg-card-title">Create your CareerFast profile</h1>
              <p className="cf-reg-card-subtitle">
                Search & apply to jobs and internships from India's verified career platform
              </p>
            </div>

            <form className="cf-reg-form" onSubmit={handleSubmit} noValidate>
              {/* TOP SECTION: Name, Email, Password on Left | Divider | Google Auth on Right */}
              <div className="cf-reg-top-section">
                <div className="cf-reg-top-fields">
                  {/* Full name */}
                  <div className="cf-reg-form-group">
                    <label className="cf-reg-field-label" htmlFor="fullName">
                      Full name<span className="cf-reg-star">*</span>
                    </label>
                    <div className={`cf-reg-input-box ${errors.fullName ? "cf-reg-error-box" : ""}`}>
                      <input
                        id="fullName"
                        type="text"
                        name="fullName"
                        placeholder="What is your name?"
                        value={formData.fullName}
                        onChange={(e) =>
                          handleInputChange("fullName", e.target.value, nameValidator)
                        }
                        autoComplete="name"
                      />
                    </div>
                    {errors.fullName && (
                      <span className="cf-reg-error-text">{errors.fullName}</span>
                    )}
                  </div>

                  {/* Email ID */}
                  <div className="cf-reg-form-group">
                    <label className="cf-reg-field-label" htmlFor="email">
                      Email ID<span className="cf-reg-star">*</span>
                    </label>
                    <div className={`cf-reg-input-box ${errors.email ? "cf-reg-error-box" : ""}`}>
                      <input
                        id="email"
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
                    <span className="cf-reg-helper-text">
                      We'll send relevant jobs and updates to this email
                    </span>
                    {errors.email && (
                      <span className="cf-reg-error-text">{errors.email}</span>
                    )}
                  </div>

                  {/* Password */}
                  <div className="cf-reg-form-group">
                    <label className="cf-reg-field-label" htmlFor="password">
                      Password<span className="cf-reg-star">*</span>
                    </label>
                    <div className={`cf-reg-input-box ${errors.password ? "cf-reg-error-box" : ""}`}>
                      <Input.Password
                        id="password"
                        name="password"
                        placeholder="(Minimum 6 characters)"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value, passwordValidator)
                        }
                        className="cf-reg-antd-password"
                        variant="borderless"
                        iconRender={(visible) =>
                          visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                        }
                      />
                    </div>
                    <span className="cf-reg-helper-text">
                      This helps your account stay protected
                    </span>
                    {errors.password && (
                      <span className="cf-reg-error-text">{errors.password}</span>
                    )}
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="cf-reg-divider-column">
                  <div className="cf-reg-divider-line"></div>
                  <span className="cf-reg-divider-pill">Or</span>
                  <div className="cf-reg-divider-line"></div>
                </div>

                {/* Right Side Social Auth */}
                <div className="cf-reg-social-column">
                  <div className="cf-reg-google-btn-box">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() =>
                        CommonToaster(
                          "Google sign-in failed. Please try again.",
                          "error"
                        )
                      }
                      theme="outline"
                      shape="pill"
                      text="continue_with"
                      size="large"
                      width="100%"
                    />
                  </div>
                  <div className="cf-signup-footer"><span>Already have an account?</span><button type="button" className="cf-signup-link" onClick={handleSignin}>Sign in</button></div>
                </div>
              </div>

              {/* BOTTOM SECTION: Mobile, Work Status, Opt-In, Terms, Submit Button */}
              <div className="cf-reg-bottom-section">
                {/* Mobile number */}
                <div className="cf-reg-form-group">
                  <label className="cf-reg-field-label" htmlFor="phone">
                    Mobile number<span className="cf-reg-star">*</span>
                  </label>
                  <div className={`cf-reg-phone-box ${errors.phone ? "cf-reg-error-box" : ""}`}>
                    <span className="cf-reg-phone-code">+91</span>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      maxLength={10}
                      placeholder="Enter your mobile number"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange(
                          "phone",
                          e.target.value.replace(/\D/g, ""),
                          phoneValidation
                        )
                      }
                      autoComplete="tel-national"
                    />
                  </div>
                  <span className="cf-reg-helper-text">
                    Recruiters will contact you on this number
                  </span>
                  {errors.phone && (
                    <span className="cf-reg-error-text">{errors.phone}</span>
                  )}
                </div>

                {/* Updates Opt-in Checkbox */}
                <div className="cf-reg-optin-group">
                  <label className="cf-reg-checkbox-label">
                    <Checkbox
                      checked={formData.updatesOptIn}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          updatesOptIn: e.target.checked,
                        }))
                      }
                      className="cf-reg-antd-checkbox"
                    />
                    <span className="cf-reg-optin-label-text">
                      Send me important updates & promotions via SMS, email
                    </span>
                  </label>
                </div>

                {/* Terms & Conditions Notice */}
                <p className="cf-reg-terms-paragraph">
                  By clicking Register now, you agree to the{" "}
                  <button
                    type="button"
                    className="cf-reg-link-inline"
                    onClick={() => navigate("/termsofuse")}
                  >
                    Terms and Conditions
                  </button>{" "}
                  &{" "}
                  <button
                    type="button"
                    className="cf-reg-link-inline"
                    onClick={() => navigate("/privacypolicy")}
                  >
                    Privacy Policy
                  </button>{" "}
                  of CareerFast.
                </p>

                {/* Submit Button */}
                <div className="cf-reg-submit-row">
                  <button
                    type="submit"
                    className="cf-reg-primary-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="cf-reg-btn-loader">
                        <span className="cf-reg-btn-spinner"></span>
                        Registering...
                      </span>
                    ) : (
                      "Register now"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="cf-reg-footer">
        <div className="cf-reg-footer-links">
          <button type="button" onClick={() => navigate("/about")}>
            About Us
          </button>
          <span className="cf-reg-footer-sep">|</span>
          <button type="button" onClick={() => navigate("/support")}>
            Contact Us
          </button>
          <span className="cf-reg-footer-sep">|</span>
          <button type="button" onClick={() => navigate("/support")}>
            FAQs
          </button>
          <span className="cf-reg-footer-sep">|</span>
          <button type="button" onClick={() => navigate("/termsofuse")}>
            Terms and Conditions
          </button>
          <span className="cf-reg-footer-sep">|</span>
          <button type="button" onClick={() => navigate("/privacypolicy")}>
            Privacy Policy
          </button>
        </div>
        <p className="cf-reg-footer-copyright">
          All rights reserved © {new Date().getFullYear()} CareerFast Technologies Pvt. Ltd.
        </p>
      </footer>
    </div>
  );
};

export default RegisterPage;
