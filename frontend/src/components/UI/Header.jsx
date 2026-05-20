import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { useContext, useState } from "react"
import logo from '../../images/logo.jpg'
import { AuthContext } from "../../context/AuthContext"
import { AddressModal } from "./AddressModal"

export const Header = () => {
    const { user, logout } = useContext(AuthContext);
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
        <header className="section-navbar glass-panel">
            <div className="container">
                <div className="navbar-brand" style={{display: 'flex', alignItems: 'center'}}>
                    <NavLink to="/" className="brand-link">
                        <img src={logo} alt="shop-logo" />
                        <span className="brand-name">CampusMart</span>
                    </NavLink>
                    {user && !isUserAdmin && (
                        <div 
                            style={{ 
                                marginLeft: '1.5rem', 
                                color: 'var(--text-secondary)', 
                                fontSize: '0.75rem', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                borderLeft: '1px solid var(--border-glass)', 
                                paddingLeft: '1rem', 
                                cursor: 'pointer',
                                transition: 'var(--transition-smooth)'
                            }}
                            onClick={() => setIsModalOpen(true)}
                            title="Update Delivery Location"
                            className="location-tag-hover"
                        >
                            <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Deliver to</span>
                            <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                {(user.addresses && user.addresses.length > 0) ? (user.addresses.find(a => a.isDefault)?.city || user.addresses[0].city) : "Select Location"}
                            </span>
                        </div>
                    )}
                </div>

                <nav className='navbar'>
                    <ul>
                        <li className="nav-item">
                            <NavLink to="/" className="nav-link">Home</NavLink> </li>
                        <li className="nav-item">
                            <NavLink to="/product" className="nav-link" >Products</NavLink> </li>
                        
                        {!isUserAdmin && (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/about" className="nav-link" >About</NavLink> </li>
                                <li className="nav-item">
                                    <NavLink to="/contact" className="nav-link" >Contact</NavLink> </li>
                                <li className="nav-item">
                                    <NavLink to="/cart" className="nav-link" >Cart</NavLink> </li>
                            </>
                        )}

                        {user ? (
                            <>
                                {isUserAdmin && (
                                    <li className="nav-item">
                                        <NavLink to="/admin" className="nav-link" style={{color: '#ff4757', fontWeight: 'bold'}}>Admin Panel</NavLink>
                                    </li>
                                )}
                                {!isUserAdmin && (
                                    <li className="nav-item">
                                        <NavLink to="/orders" className="nav-link" >Orders</NavLink> 
                                    </li>
                                )}
                                <li className="nav-item">
                                    <span className="nav-link" style={{color: 'var(--accent-blue)', fontWeight: 600}}>Hello, {user.name}</span>
                                </li>
                                <li className="nav-item">
                                    <button onClick={handleLogout} className="nav-link nav-btn-logout">Logout</button>
                                </li>
                            </>
                        ) : (
                            <li className="nav-item">
                                <NavLink to="/login" className="nav-link" style={{
                                    background: 'var(--gradient-neon)',
                                    color: '#ffffff',
                                    padding: '0.5rem 1.2rem',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 10px rgba(var(--accent-blue-rgb), 0.2)'
                                }}>Login/Signup</NavLink> 
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