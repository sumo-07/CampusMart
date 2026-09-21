import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axiosConfig";
import {
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineCheckCircle,
  AiOutlineArrowLeft,
  AiOutlineThunderbolt,
} from "react-icons/ai";
import "../components/css/auth.css";

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const emailFromUrl = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [otp, setOtp] = useState("");
  const [token] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendSuccess, setResendSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  // Handle resend countdown timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Evaluate password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", class: "" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: "Weak", class: "weak" };
    if (score <= 2) return { score: 2, label: "Medium", class: "medium" };
    return { score: 3, label: "Strong", class: "strong" };
  };

  const strength = getPasswordStrength(newPassword);

  const handleResendOtp = async () => {
    if (!email.trim()) {
      setError("Please specify your email to resend the code");
      return;
    }
    setError("");
    setResendSuccess("");
    setResendLoading(true);

    try {
      await api.post("/api/auth/forgot-password", { email: email.trim().toLowerCase() });
      setResendTimer(60);
      setResendSuccess("A new 6-digit OTP code has been dispatched to your email!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please provide your email address");
      return;
    }

    if (!token && !otp.trim()) {
      setError("Please enter the 6-digit verification code sent to your email");
      return;
    }

    if (!token && otp.trim().length !== 6) {
      setError("The verification code must be exactly 6 digits");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        newPassword,
        ...(token ? { token } : { otp: otp.trim() }),
      };

      const { data } = await api.post("/api/auth/reset-password", payload);
      setIsSuccess(true);

      // Auto redirect to login after 3 seconds or allow immediate click
      setTimeout(() => {
        navigate("/login", {
          state: { message: data.message || "Password successfully reset! Please log in." },
          replace: true,
        });
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Please verify your code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-container">
        <h2 className="auth-title">Reset Password</h2>

        {isSuccess ? (
          <div className="auth-success-card">
            <div className="success-icon-wrapper">
              <AiOutlineCheckCircle />
            </div>
            <h3 style={{ color: "#f8fafc", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Password Reset Complete!
            </h3>
            <p className="auth-subtitle">
              Your CampusMart password has been securely updated. You can now log in with your new credentials.
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--accent-blue)", marginBottom: "1.5rem" }}>
              Redirecting to login page in 3 seconds...
            </p>
            <button
              type="button"
              className="auth-btn"
              onClick={() =>
                navigate("/login", {
                  state: { message: "Password reset successful! Please log in." },
                  replace: true,
                })
              }
            >
              Login Now &rarr;
            </button>
          </div>
        ) : (
          <>
            {token ? (
              <div style={{ textAlign: "center" }}>
                <div className="verified-link-badge">
                  <AiOutlineThunderbolt /> Secure Reset Link Activated
                </div>
                <p className="auth-subtitle" style={{ marginBottom: "1rem" }}>
                  Verified link for <strong style={{ color: "var(--accent-blue)" }}>{email || "your account"}</strong>. Choose your new password below.
                </p>
              </div>
            ) : (
              <p className="auth-subtitle">
                Enter the 6-digit OTP code sent to your email and set your new password. Codes expire in 15 minutes.
              </p>
            )}

            {error && <div className="auth-alert-error">{error}</div>}
            {resendSuccess && <div className="auth-alert-success">{resendSuccess}</div>}

            <form className="auth-form" onSubmit={handleResetPassword}>
              {/* Email Address (shown/editable if no token or missing) */}
              <div className="form-group">
                <label className="form-label" htmlFor="user-email">
                  Account Email
                </label>
                <input
                  type="email"
                  id="user-email"
                  className="form-input"
                  placeholder="student@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={Boolean(token && emailFromUrl)}
                />
              </div>

              {/* 6-Digit OTP Code (only needed if NOT using direct email token) */}
              {!token && (
                <div className="form-group">
                  <div className="form-label-row">
                    <label className="form-label" htmlFor="otp-code">
                      6-Digit Verification Code
                    </label>
                    <span style={{ fontSize: "0.78rem", color: "var(--accent-blue)" }}>15-min validity</span>
                  </div>
                  <input
                    type="text"
                    id="otp-code"
                    className="form-input otp-input"
                    placeholder="------"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 6) setOtp(val);
                    }}
                    required
                    autoFocus
                  />
                  <div className="resend-row">
                    <span>Didn't receive the code?</span>
                    <button
                      type="button"
                      className="resend-btn"
                      onClick={handleResendOtp}
                      disabled={resendLoading || resendTimer > 0}
                    >
                      {resendTimer > 0
                        ? `Resend in ${resendTimer}s`
                        : resendLoading
                        ? "Sending..."
                        : "Resend Code"}
                    </button>
                  </div>
                </div>
              )}

              {/* New Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="new-password">
                  New Password
                </label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="new-password"
                    className="form-input"
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label="Toggle password visibility"
                    title={showPassword ? "Hide passwords" : "Show passwords"}
                  >
                    {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                  </button>
                </div>

                {/* Password strength meter */}
                {newPassword && (
                  <div className="strength-meter">
                    <div className="strength-bars">
                      <div className={`strength-bar ${strength.score >= 1 ? strength.class : ""}`} />
                      <div className={`strength-bar ${strength.score >= 2 ? strength.class : ""}`} />
                      <div className={`strength-bar ${strength.score >= 3 ? strength.class : ""}`} />
                    </div>
                    <span className={`strength-text ${strength.class}`}>{strength.label}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirm-password"
                  className="form-input"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Updating Password..." : "Update Password"}
              </button>
            </form>

            <p className="auth-switch">
              <Link to="/login" className="auth-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <AiOutlineArrowLeft size={16} /> Back to Login
              </Link>
            </p>
          </>
        )}
      </div>
    </section>
  );
};
