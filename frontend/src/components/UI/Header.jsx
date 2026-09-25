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
                        <span className="brand-name">CARTSY</span>
                    </NavLink>
                    {user && !isUserAdmin && (
                        <div 
                            onClick={() => setIsModalOpen(true)}
                            title="Update Delivery Location"
                            className="location-tag-hover"
                        >
                            <span className="location-pin">📍</span>
                            <span className="location-city">
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
                                    <NavLink to="/cart" className="nav-link nav-bag-link">
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
                                        <NavLink to="/admin" className="nav-admin-chip">Admin HQ</NavLink>
                                    </li>
                                )}
                                {!isUserAdmin && (
                                    <li className="nav-item">
                                        <NavLink to="/orders" className="nav-link" >My Orders</NavLink> 
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
            </div>
            
            {/* Global Modals */}
            {user && <AddressModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
        </header>
    )
}