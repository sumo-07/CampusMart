import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axiosConfig";
import { AiOutlineMail, AiOutlineArrowLeft, AiOutlineCheckCircle } from "react-icons/ai";
import "../components/css/auth.css";

export const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/api/auth/forgot-password", { email: email.trim().toLowerCase() });
      setIsSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-container">
        <h2 className="auth-title">Forgot Password</h2>

        {isSubmitted ? (
          <div className="auth-success-card">
            <div className="success-icon-wrapper">
              <AiOutlineCheckCircle />
            </div>
            <h3 style={{ color: "#f8fafc", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Check Your Inbox
            </h3>
            <p className="auth-subtitle">
              We have sent a <strong>6-digit OTP verification code</strong> and a <strong>direct one-time reset link</strong> to:
              <br />
              <span style={{ color: "var(--accent-blue)", fontWeight: 700 }}>{email}</span>
            </p>

            <button
              type="button"
              className="auth-btn"
              onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
            >
              Enter Verification Code &rarr;
            </button>

            <div className="resend-row" style={{ justifyContent: "center", marginTop: "1.5rem" }}>
              <button
                type="button"
                className="resend-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Resending..." : "Didn't receive it? Send again"}
              </button>
            </div>

            <p className="auth-switch" style={{ marginTop: "1.5rem" }}>
              <Link to="/login" className="auth-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <AiOutlineArrowLeft size={16} /> Back to Login
              </Link>
            </p>
          </div>
        ) : (
          <>
            <p className="auth-subtitle">
              Enter your registered email address and we will send you a secure 6-digit OTP code and instant reset link (valid for 15 minutes).
            </p>

            {error && <div className="auth-alert-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">
                  Registered Email Address
                </label>
                <div className="password-wrapper">
                  <input
                    type="email"
                    id="reset-email"
                    className="form-input"
                    placeholder="student@campus.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <span style={{ position: "absolute", right: "14px", color: "var(--text-muted)", display: "flex", pointerEvents: "none" }}>
                    <AiOutlineMail size={20} />
                  </span>
                </div>
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Sending Reset Instructions..." : "Send Reset Code & Link"}
              </button>
            </form>

            <p className="auth-switch">
              Remember your password?{" "}
              <Link to="/login" className="auth-link">
                Back to Login
              </Link>
            </p>
          </>
        )}
      </div>
    </section>
  );
};
