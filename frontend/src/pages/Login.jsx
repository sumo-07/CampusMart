import React, { useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosConfig";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { GoogleLogin } from "@react-oauth/google";
import '../components/css/auth.css';

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      login(data);
      navigate(redirect, { state: location.state, replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
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
      console.error("Google sign in error:", err);
      setError(err.response?.data?.message || "Google sign in failed. Please try again.");
    }
  };

  const handleGoogleError = () => {
    setError("Google sign in was cancelled or failed.");
  };

  return (
    <section className="auth-section login-section">
      <div className="auth-container">
        <h2 className="auth-title">Login</h2>
        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        <form className="auth-form login-form" onSubmit={handleLogin}>
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn login-btn">
            Login
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
            text="signin_with"
            width="100%"
          />
        </div>

        <p className="auth-switch">
          Don’t have an account?{" "}
          <Link
            to={`/signup${location.search}`}
            state={location.state}
            className="auth-link"
          >
            Sign up
          </Link>
        </p>
      </div>
    </section>
  );
};