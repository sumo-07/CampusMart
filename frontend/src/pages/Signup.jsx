import React, { useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosConfig";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { GoogleLogin } from "@react-oauth/google";
import '../components/css/auth.css';

export const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

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

  const strength = getPasswordStrength(password);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const fromState = location.state?.from
    ? (typeof location.state.from === "object" && location.state.from.pathname
        ? `${location.state.from.pathname}${location.state.from.search || ""}`
        : String(location.state.from))
    : (location.state?.redirect || null);
  const redirect = searchParams.get("redirect") || fromState || "/";

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      const { data } = await api.post("/api/auth/signup", { name, email, password });
      login(data);
      navigate(redirect, { state: location.state, replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    try {
      if (!credentialResponse?.credential) {
        throw new Error("No credential received from Google");
      }
      const { data } = await api.post("/api/auth/google", {
        credential: credentialResponse.credential,
      });
      login(data);
      navigate(redirect, { state: location.state, replace: true });
    } catch (err) {
      console.error("Google sign up error:", err);
      setError(err.response?.data?.message || "Google sign in failed. Please try again.");
    }
  };

  const handleGoogleError = () => {
    setError("Google sign in was cancelled or failed.");
  };

  return (
    <section className="auth-section signup-section">
      <div className="auth-container">
        <h2 className="auth-title">Create Account</h2>
        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        <form className="auth-form signup-form" onSubmit={handleSignup}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              className="form-input"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="form-input"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {password && (
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
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="confirm-password"
              className="form-input"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-btn signup-btn">
            Sign Up
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="google-auth-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="filled_black"
            shape="pill"
            size="large"
            text="signup_with"
            width="100%"
          />
        </div>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link
            to={`/login${location.search}`}
            state={location.state}
            className="auth-link"
          >
            Login
          </Link>
        </p>
      </div>
    </section>
  );
};