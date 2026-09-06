import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaPaperPlane } from "react-icons/fa";

export const Footer = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
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
          <h3 className="footer-logo">CampusMart</h3>
          <p className="footer-text">
            Redefining student retail with a premium, high-speed digital catalog. Get top-tier products at student-friendly prices.
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
          <h4 className="footer-title">Quick Links</h4>
          <ul>
            <li><NavLink to="/" className="footer-link">Home</NavLink></li>
            <li><NavLink to="/product" className="footer-link">Products</NavLink></li>
            <li><NavLink to="/about" className="footer-link">About Us</NavLink></li>
            <li><NavLink to="/contact" className="footer-link">Contact</NavLink></li>
          </ul>
        </div>

        {/* Account */}
        <div className="footer-links">
          <h4 className="footer-title">Account</h4>
          <ul>
            <li><NavLink to="/cart" className="footer-link">View Cart</NavLink></li>
            {!user ? (
              <>
                <li><NavLink to="/login" className="footer-link">Login</NavLink></li>
                <li><NavLink to="/signup" className="footer-link">Register</NavLink></li>
              </>
            ) : (
              <>
                <li><NavLink to="/orders" className="footer-link">My Orders</NavLink></li>
                <li>
                  <button onClick={handleLogout} className="footer-link" style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0}}>Logout</button>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="footer-newsletter">
          <h4 className="footer-title">Newsletter</h4>
          <p className="footer-text" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Subscribe to receive alert notifications for flash sales and student discounts.
          </p>
          <form className="newsletter-form" onSubmit={handleSubscribe}>
            <input 
              type="email" 
              placeholder="Enter your campus email" 
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
          <p>© {new Date().getFullYear()} CampusMart. Built for Premium Campus Life.</p>
          <p style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#" className="footer-link" style={{ fontSize: '0.85rem' }}>Privacy Policy</a>
            <a href="#" className="footer-link" style={{ fontSize: '0.85rem' }}>Terms of Service</a>
          </p>
        </div>
      </div>
    </footer>
  );
};