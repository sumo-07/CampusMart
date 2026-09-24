import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { useContext, useState } from "react"
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

    // Hide shopping links if the logged in user is an Admin
    const isUserAdmin = user?.isAdmin;

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="section-navbar">
            <div className="container">
                <div className="navbar-brand" style={{display: 'flex', alignItems: 'center'}}>
                    <NavLink to="/" className="brand-link">
                        <img src={logo} alt="Cartsy-logo" />
                        <span className="brand-name">Cartsy</span>
                    </NavLink>
                    {user && !isUserAdmin && (
                        <div 
                            style={{ 
                                marginLeft: '1rem', 
                                fontSize: '0.75rem', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                cursor: 'pointer',
                            }}
                            onClick={() => setIsModalOpen(true)}
                            title="Update Delivery Location"
                            className="location-tag-hover"
                        >
                            <span style={{ fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.5px' }}>Drop Spot 📍</span>
                            <span style={{ fontWeight: 800, color: 'var(--neo-border)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                {(user.addresses && user.addresses.length > 0) ? (user.addresses.find(a => a.isDefault)?.city || user.addresses[0].city) : "Set Location"}
                            </span>
                        </div>
                    )}
                </div>

                <nav className='navbar'>
                    <ul>
                        <li className="nav-item">
                            <NavLink to="/" className="nav-link">Home</NavLink> </li>
                        <li className="nav-item">
                            <NavLink to="/product" className="nav-link" >Drops</NavLink> </li>
                        
                        {!isUserAdmin && (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/about" className="nav-link" >Lore</NavLink> </li>
                                <li className="nav-item">
                                    <NavLink to="/contact" className="nav-link" >Contact</NavLink> </li>
                                <li className="nav-item">
                                    <NavLink to="/cart" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center' }}>
                                        Bag 🛍️
                                        {totalCartCount > 0 && (
                                            <span className="nav-cart-badge">
                                                {totalCartCount}
                                            </span>
                                        )}
                                    </NavLink> </li>
                            </>
                        )}

                        {user ? (
                            <>
                                {isUserAdmin && (
                                    <li className="nav-item">
                                        <NavLink to="/admin" className="nav-link" style={{background: 'var(--neo-pink)', border: 'var(--border-medium)', boxShadow: 'var(--shadow-hard-xs)', color: 'var(--neo-border)', fontWeight: 800}}>Admin HQ</NavLink>
                                    </li>
                                )}
                                {!isUserAdmin && (
                                    <li className="nav-item">
                                        <NavLink to="/orders" className="nav-link" >My Orders</NavLink> 
                                    </li>
                                )}
                                <li className="nav-item">
                                    <span className="nav-link" style={{background: 'var(--neo-yellow)', border: 'var(--border-medium)', boxShadow: 'var(--shadow-hard-xs)', color: 'var(--neo-border)', fontWeight: 800}}>Chief {user.name}</span>
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
                                    Lock In ⚡
                                </NavLink> 
                            </li>
                        )}
                    </ul>
                </nav>
            </div>
            
            {/* Global Modals */}
            {user && <AddressModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
        </header>
    )
}