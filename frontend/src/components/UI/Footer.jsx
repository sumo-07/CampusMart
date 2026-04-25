import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export const Footer = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
            {!user ? (
              <>
                <li><NavLink to="/login" className="footer-link">Login</NavLink></li>
                <li><NavLink to="/signup" className="footer-link">Sign Up</NavLink></li>
              </>
            ) : (
                <li>
                  <button onClick={handleLogout} className="footer-link" style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0}}>Logout</button>
                </li>
            )}
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