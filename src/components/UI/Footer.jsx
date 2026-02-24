import { NavLink } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="section-footer">
      <div className="container footer-container">

        {/* Brand / About */}
        <div className="footer-brand">
          <h3 className="footer-logo">CampusMart</h3>
          <p className="footer-text">
            Your one-stop campus shop for all essentials. Quality products at
            student-friendly prices.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-links">
          <h4 className="footer-title">Quick Links</h4>
          <ul>
            <li><NavLink to="/" className="footer-link">Home</NavLink></li>
            <li><NavLink to="/product" className="footer-link">Products</NavLink></li>
            <li><NavLink to="/about" className="footer-link">About</NavLink></li>
            <li><NavLink to="/contact" className="footer-link">Contact</NavLink></li>
          </ul>
        </div>

        {/* Account */}
        <div className="footer-links">
          <h4 className="footer-title">Account</h4>
          <ul>
            <li><NavLink to="/cart" className="footer-link">Cart</NavLink></li>
            <li><NavLink to="/login" className="footer-link">Login</NavLink></li>
            <li><NavLink to="/signup" className="footer-link">Sign Up</NavLink></li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} CampusMart. All rights reserved.</p>
      </div>
    </footer>
  );
};