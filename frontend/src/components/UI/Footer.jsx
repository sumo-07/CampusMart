import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaPaperPlane } from "react-icons/fa";

export const Footer = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      alert(`Thank you for subscribing, ${email}!`);
      setEmail("");
    }
  };

  return (
    <footer className="section-footer">
      <div className="container footer-container">

        {/* Brand / About */}
        <div className="footer-brand">
          <h3 className="footer-logo">Cartsy</h3>
          <p className="footer-text">
            The drippiest online marketplace. Zero cap, pure aura. Certified everyday essentials, fits, gadgets & room glow-ups delivered at warp speed.
          </p>
          <div className="footer-socials">
            <a href="#" className="social-icon" aria-label="Facebook"><FaFacebookF /></a>
            <a href="#" className="social-icon" aria-label="Twitter"><FaTwitter /></a>
            <a href="#" className="social-icon" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" className="social-icon" aria-label="LinkedIn"><FaLinkedinIn /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-links">
          <h4 className="footer-title">Explore</h4>
          <ul>
            <li><NavLink to="/" className="footer-link">Home (HQ)</NavLink></li>
            <li><NavLink to="/product" className="footer-link">Fresh Drops 🔥</NavLink></li>
            <li><NavLink to="/about" className="footer-link">The Lore (About)</NavLink></li>
            <li><NavLink to="/contact" className="footer-link">Hit Our Line</NavLink></li>
          </ul>
        </div>

        {/* Account */}
        <div className="footer-links">
          <h4 className="footer-title">Account</h4>
          <ul>
            <li><NavLink to="/cart" className="footer-link">View Bag 🛍️</NavLink></li>
            {!user ? (
              <>
                <li><NavLink to={location.pathname === "/login" || location.pathname === "/signup" ? "/login" : `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} state={{ from: location }} className="footer-link">Lock In (Login)</NavLink></li>
                <li><NavLink to={location.pathname === "/login" || location.pathname === "/signup" ? "/signup" : `/signup?redirect=${encodeURIComponent(location.pathname + location.search)}`} state={{ from: location }} className="footer-link">Join Hype (Sign Up)</NavLink></li>
              </>
            ) : (
              <>
                <li><NavLink to="/orders" className="footer-link">Past Drops (Orders)</NavLink></li>
                <li>
                  <button onClick={handleLogout} className="footer-link" style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0}}>Peace Out (Logout)</button>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="footer-newsletter">
          <h4 className="footer-title">VIP Drop Alert 🔥</h4>
          <p className="footer-text" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Get secret discount codes, midnight drop alerts, and meme drops straight to your inbox. No spam, strictly heat.
          </p>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <input 
              type="email" 
              placeholder="you@email.com" 
              className="newsletter-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="newsletter-btn" aria-label="Subscribe">
              <FaPaperPlane />
            </button>
          </form>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="container">
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Cartsy. Built with ☕ & zero chill for hype legends.</p>
          <p style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#" className="footer-link" style={{ fontSize: '0.85rem' }}>Privacy Policy</a>
            <a href="#" className="footer-link" style={{ fontSize: '0.85rem' }}>Terms of Service</a>
          </p>
        </div>
      </div>
    </footer>
  );
};