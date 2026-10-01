import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { useContext, useState, useEffect } from "react"
import logo from '../../images/logo.jpg'
import { AuthContext } from "../../context/AuthContext"
import { useCart } from "../../context/CartContext"
import { AddressModal } from "./AddressModal"

export const Header = () => {
    const { user, logout } = useContext(AuthContext);
    const { totalCartCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Hide shopping links if the logged in user is an Admin
    const isUserAdmin = user?.isAdmin;

    // Close mobile drawer on route navigation
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMobileMenuOpen]);

    const handleLogout = () => {
        setIsMobileMenuOpen(false);
        logout();
        navigate("/login");
    };

    const userCity = (user?.addresses && user.addresses.length > 0)
        ? (user.addresses.find(a => a.isDefault)?.city || user.addresses[0].city)
        : "Set Location";

    return (
        <header className="section-navbar">
            <div className="container">
                <div className="navbar-brand">
                    <NavLink to="/" className="brand-link">
                        <img src={logo} alt="Cartsy-logo" />
                        <span className="brand-name">CARTSY</span>
                    </NavLink>
                    {user && !isUserAdmin && (
                        <div 
                            onClick={() => setIsModalOpen(true)}
                            title="Update Delivery Location"
                            className="location-tag-hover desktop-only-location"
                        >
                            <span className="location-pin">📍</span>
                            <span className="location-city">{userCity}</span>
                        </div>
                    )}
                </div>

                {/* Desktop Navigation (> 860px) */}
                <nav className='navbar desktop-nav'>
                    <ul>
                        <li className="nav-item">
                            <NavLink to="/" className="nav-link">Home</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/product" className="nav-link">Drops</NavLink>
                        </li>
                        
                        {!isUserAdmin && (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/about" className="nav-link">Lore</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/contact" className="nav-link">Contact</NavLink>
                                </li>
                                <li className="nav-item">
                                    <NavLink to="/cart" className="nav-link nav-bag-link">
                                        Bag 🛍️
                                        {totalCartCount > 0 && (
                                            <span className="nav-cart-badge">
                                                {totalCartCount}
                                            </span>
                                        )}
                                    </NavLink>
                                </li>
                            </>
                        )}

                        {user ? (
                            <>
                                {isUserAdmin && (
                                    <li className="nav-item">
                                        <NavLink to="/admin" className="nav-admin-chip">Admin HQ</NavLink>
                                    </li>
                                )}
                                {!isUserAdmin && (
                                    <li className="nav-item">
                                        <NavLink to="/orders" className="nav-link">My Orders</NavLink>
                                    </li>
                                )}
                                <li className="nav-item">
                                    <span className="nav-user-chip" title={`Chief ${user.name}`}>Chief {user.name?.split(' ')[0] || user.name}</span>
                                </li>
                                <li className="nav-item">
                                    <button onClick={handleLogout} className="nav-btn-logout">Logout</button>
                                </li>
                            </>
                        ) : (
                            <li className="nav-item">
                                <NavLink
                                    to={location.pathname === "/login" || location.pathname === "/signup"
                                        ? "/login"
                                        : `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                                    state={{ from: location }}
                                    className="nav-auth-btn"
                                    style={{ textDecoration: 'none' }}
                                >
                                    LOCK IN 🔥
                                </NavLink> 
                            </li>
                        )}
                    </ul>
                </nav>

                {/* Mobile Right Actions (<= 860px) */}
                <div className="mobile-nav-actions">
                    {!isUserAdmin && (
                        <NavLink to="/cart" className="mobile-quick-bag-btn" aria-label="Cart">
                            <span>🛍️</span>
                            {totalCartCount > 0 && (
                                <span className="nav-cart-badge">
                                    {totalCartCount}
                                </span>
                            )}
                        </NavLink>
                    )}
                    <button
                        type="button"
                        className={`mobile-nav-toggle ${isMobileMenuOpen ? "active" : ""}`}
                        onClick={() => setIsMobileMenuOpen(prev => !prev)}
                        aria-label="Toggle navigation menu"
                        aria-expanded={isMobileMenuOpen}
                    >
                        <span className="hamburger-icon">{isMobileMenuOpen ? "✕" : "☰"}</span>
                    </button>
                </div>
            </div>

            {/* Neobrutalist Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <>
                    <div
                        className="mobile-nav-backdrop"
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-hidden="true"
                    />
                    <div className="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
                        {/* Drawer Top User & Location Banner */}
                        <div className="mobile-drawer-top-row">
                            {user ? (
                                <div className="mobile-drawer-user-info">
                                    <span className="mobile-user-greeting">Chief {user.name?.split(' ')[0] || user.name}</span>
                                    {user.isAdmin && <span className="mobile-admin-tag">ADMIN</span>}
                                </div>
                            ) : (
                                <span className="mobile-user-greeting">Welcome, Guest! 👋</span>
                            )}

                            {user && !isUserAdmin && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        setIsModalOpen(true);
                                    }}
                                    className="mobile-drawer-location-btn"
                                    title="Change delivery location"
                                >
                                    <span className="location-pin">📍</span>
                                    <span className="location-city">{userCity}</span>
                                </button>
                            )}
                        </div>

                        {/* Navigation Links */}
                        <nav className="mobile-drawer-nav">
                            <NavLink to="/" className="mobile-drawer-link" onClick={() => setIsMobileMenuOpen(false)}>
                                <span>🏠 Home</span>
                                <span className="drawer-arrow">➔</span>
                            </NavLink>
                            <NavLink to="/product" className="mobile-drawer-link" onClick={() => setIsMobileMenuOpen(false)}>
                                <span>⚡ Drops</span>
                                <span className="drawer-arrow">➔</span>
                            </NavLink>

                            {!isUserAdmin && (
                                <>
                                    <NavLink to="/about" className="mobile-drawer-link" onClick={() => setIsMobileMenuOpen(false)}>
                                        <span>📜 Lore</span>
                                        <span className="drawer-arrow">➔</span>
                                    </NavLink>
                                    <NavLink to="/contact" className="mobile-drawer-link" onClick={() => setIsMobileMenuOpen(false)}>
                                        <span>💬 Contact</span>
                                        <span className="drawer-arrow">➔</span>
                                    </NavLink>
                                    <NavLink to="/cart" className="mobile-drawer-link" onClick={() => setIsMobileMenuOpen(false)}>
                                        <span>🛍️ Bag ({totalCartCount})</span>
                                        <span className="drawer-arrow">➔</span>
                                    </NavLink>
                                    {user && (
                                        <NavLink to="/orders" className="mobile-drawer-link" onClick={() => setIsMobileMenuOpen(false)}>
                                            <span>📦 My Orders</span>
                                            <span className="drawer-arrow">➔</span>
                                        </NavLink>
                                    )}
                                </>
                            )}

                            {user && isUserAdmin && (
                                <NavLink to="/admin" className="mobile-drawer-link mobile-admin-link" onClick={() => setIsMobileMenuOpen(false)}>
                                    <span>⚙️ Admin HQ</span>
                                    <span className="drawer-arrow">➔</span>
                                </NavLink>
                            )}
                        </nav>

                        {/* Drawer Bottom Actions */}
                        <div className="mobile-drawer-footer">
                            {user ? (
                                <button type="button" onClick={handleLogout} className="mobile-drawer-logout-btn">
                                    Logout 🚪
                                </button>
                            ) : (
                                <NavLink
                                    to={location.pathname === "/login" || location.pathname === "/signup"
                                        ? "/login"
                                        : `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                                    state={{ from: location }}
                                    className="mobile-drawer-auth-btn"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    LOCK IN 🔥
                                </NavLink>
                            )}
                        </div>
                    </div>
                </>
            )}
            
            {/* Global Modals */}
            {user && <AddressModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
        </header>
    )
}