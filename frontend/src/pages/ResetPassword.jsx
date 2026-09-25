import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axiosConfig";
import {
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineArrowLeft,
  AiOutlineThunderbolt,
  AiOutlineLoading3Quarters,
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

  // Step 1: Verification status
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(Boolean(tokenFromUrl));
  const [tokenError, setTokenError] = useState("");

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendSuccess, setResendSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  // If accessed via URL reset link, automatically verify the token on mount
  useEffect(() => {
    if (tokenFromUrl) {
      if (!emailFromUrl.trim()) {
        setTokenError("Missing email address associated with this reset link. Please request a new one.");
        setIsVerifyingToken(false);
        return;
      }

      setIsVerifyingToken(true);
      api
        .post("/api/auth/verify-reset-code", {
          email: emailFromUrl.trim().toLowerCase(),
          token: tokenFromUrl.trim(),
        })
        .then(() => {
          setIsVerified(true);
          setIsVerifyingToken(false);
        })
        .catch((err) => {
          setTokenError(
            err.response?.data?.message ||
              "This password reset link is invalid or has expired. Please request a new one."
          );
          setIsVerifyingToken(false);
        });
    }
  }, [tokenFromUrl, emailFromUrl]);

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

  // Step 1: Verify the entered 6-digit OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your registered email address");
      return;
    }

    if (!otp.trim() || otp.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/verify-reset-code", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });
      setIsVerified(true);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid or expired verification code. Please check your code and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset the password after verification
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

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

      setTimeout(() => {
        navigate("/login", {
          state: { message: data.message || "Password successfully reset! Please log in." },
          replace: true,
        });
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to reset password. The code or link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-container">
        <h2 className="auth-title">Reset Password</h2>

        {/* State A: Success confirmation */}
        {isSuccess ? (
          <div className="auth-success-card">
            <div className="success-icon-wrapper">
              <AiOutlineCheckCircle />
            </div>
            <h3 style={{ color: "#f8fafc", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Password Reset Complete!
            </h3>
            <p className="auth-subtitle">
              Your Cartsy password has been securely updated. You're locked and loaded to cop drops again.
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
        ) : isVerifyingToken ? (
          /* State B: Validating URL Token */
          <div className="auth-loading-card">
            <AiOutlineLoading3Quarters size={44} className="spinner-icon" />
            <h3 style={{ color: "#f8fafc", fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              Verifying Reset Link...
            </h3>
            <p className="auth-subtitle" style={{ fontSize: "0.85rem", marginBottom: 0 }}>
              Please wait while we check your reset credentials.
            </p>
          </div>
        ) : tokenError ? (
          /* State C: Token is invalid or expired */
          <div className="auth-success-card">
            <div className="error-icon-wrapper">
              <AiOutlineCloseCircle />
            </div>
            <h3 style={{ color: "#f8fafc", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Link Expired or Invalid
            </h3>
            <p className="auth-subtitle">{tokenError}</p>
            <button
              type="button"
              className="auth-btn"
              onClick={() => navigate("/forgot-password")}
            >
              Request a New Reset Link &rarr;
            </button>
            <p className="auth-switch" style={{ marginTop: "1.5rem" }}>
              <Link to="/login" className="auth-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <AiOutlineArrowLeft size={16} /> Back to Login
              </Link>
            </p>
          </div>
        ) : !isVerified ? (
          /* State D: Step 1 - Verify OTP */
          <>
            <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
              <p className="auth-subtitle" style={{ marginBottom: 0 }}>
                Enter the 6-digit verification code sent to your email to continue.
              </p>
            </div>

            {error && <div className="auth-alert-error">{error}</div>}
            {resendSuccess && <div className="auth-alert-success">{resendSuccess}</div>}

            <form className="auth-form" onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label className="form-label" htmlFor="verify-email">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  id="verify-email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus={!email}
                />
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label" htmlFor="otp-code">
                    6-Digit Verification Code
                  </label>
                  <span style={{ fontSize: "0.78rem", color: "var(--accent-blue)" }}>Valid 15 mins</span>
                </div>
                <input
                  type="password"
                  id="otp-code"
                  className="form-input otp-input"
                  placeholder="••••••"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val.length <= 6) setOtp(val);
                  }}
                  required
                  autoFocus={Boolean(email)}
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

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Verifying Code..." : "Verify Code & Proceed \u2192"}
              </button>
            </form>

            <p className="auth-switch">
              <Link to="/login" className="auth-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <AiOutlineArrowLeft size={16} /> Back to Login
              </Link>
            </p>
          </>
        ) : (
          /* State E: Step 2 - Set New Password (OTP verified or direct link verified) */
          <>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              {token ? (
                <div className="verified-link-badge">
                  <AiOutlineThunderbolt /> Direct Link Verified
                </div>
              ) : (
                <div className="verified-link-badge">
                  <AiOutlineCheckCircle /> OTP Verified
                </div>
              )}
              <p className="auth-subtitle" style={{ marginBottom: 0 }}>
                Resetting password for <strong style={{ color: "var(--accent-blue)" }}>{email}</strong>
              </p>
            </div>

            {error && <div className="auth-alert-error">{error}</div>}

            <form className="auth-form" onSubmit={handleResetPassword}>
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
                    autoFocus
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
