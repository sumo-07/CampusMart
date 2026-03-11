import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosConfig";
import '../components/css/auth.css';

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      login(data, data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
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
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-btn login-btn">
            Login
          </button>
        </form>

        <p className="auth-switch">
          Don’t have an account?{" "}
          <Link to="/signup" className="auth-link">
            Sign up
          </Link>
        </p>
      </div>
    </section>
  );
};