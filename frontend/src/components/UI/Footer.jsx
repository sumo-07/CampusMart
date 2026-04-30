import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import logo from "../../images/logo.jpg";

export const Footer = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <footer className="section-footer">
      <div className="container">
        <div className="footer-container">
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={logo} alt="Logo" width="40" height="40" style={{borderRadius: '8px'}} />
              <span>CampusMart</span>
            </div>
            <p className="footer-text">
              The premier destination for student essentials. Empowering campus life through smart, affordable, and accessible shopping.
            </p>
          </div>

          {/* Company Links */}
          <div className="footer-links">
            <h4 className="footer-title">CampusMart</h4>
            <ul>
              <li><NavLink to="/" className="footer-link">Home</NavLink></li>
              <li><NavLink to="/product" className="footer-link">Products</NavLink></li>
              <li><NavLink to="/about" className="footer-link">About Us</NavLink></li>
              <li><NavLink to="/contact" className="footer-link">Contact</NavLink></li>
            </ul>
          </div>

          {/* Quick Support */}
          <div className="footer-links">
            <h4 className="footer-title">Quick Links</h4>
            <ul>
              <li><NavLink to="/cart" className="footer-link">My Cart</NavLink></li>
              <li><NavLink to="/orders" className="footer-link">Order Tracking</NavLink></li>
              <li><a href="#" className="footer-link">Shipping Policy</a></li>
              <li><a href="#" className="footer-link">Terms & Conditions</a></li>
            </ul>
          </div>

          {/* Account Section */}
          <div className="footer-links">
            <h4 className="footer-title">Account</h4>
            <ul>
              {!user ? (
                <>
                  <li><NavLink to="/login" className="footer-link">Login</NavLink></li>
                  <li><NavLink to="/login" className="footer-link">Create Account</NavLink></li>
                </>
              ) : (
                <>
                  <li><NavLink to="/orders" className="footer-link">My Orders</NavLink></li>
                  <li><NavLink to="/cart" className="footer-link">My Cart</NavLink></li>
                  <li>
                    <button onClick={handleLogout} className="footer-link" style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0}}>Logout</button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} CampusMart. All rights reserved.</p>
          <div style={{display: 'flex', gap: '20px'}}>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};