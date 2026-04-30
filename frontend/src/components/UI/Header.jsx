import { NavLink, useNavigate } from "react-router-dom"
import { useContext, useState } from "react"
import logo from '../../images/logo.jpg'
import { AuthContext } from "../../context/AuthContext"
import { AddressModal } from "./AddressModal"
import { motion } from "framer-motion"

export const Header = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="section-navbar">
            <div className="container">
                <div className="navbar-brand" style={{display: 'flex', alignItems: 'center'}}>
                    <NavLink to="/" className="brand-link">
                        <motion.img 
                            src={logo} 
                            alt="CampusMart Logo" 
                            whileHover={{ rotate: 5, scale: 1.1 }}
                        />
                        <span className="brand-name">CampusMart</span>
                    </NavLink>
                    {user && (
                        <motion.div 
                            className="delivery-location"
                            onClick={() => setIsModalOpen(true)}
                            title="Update Delivery Location"
                            whileHover={{ x: 5 }}
                        >
                            <span className="deliver-label">Deliver to</span>
                            <span className="deliver-city">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                {(user.addresses && user.addresses.length > 0) ? (user.addresses.find(a => a.isDefault)?.city || user.addresses[0].city) : "Select Location"}
                            </span>
                        </motion.div>
                    )}
                </div>

                <nav className='navbar'>
                    <ul>
                        <li className="nav-item">
                            <NavLink to="/" className="nav-link">Home</NavLink> 
                        </li>
                        <li className="nav-item">
                            <NavLink to="/product" className="nav-link">Products</NavLink> 
                        </li>
                        <li className="nav-item">
                            <NavLink to="/cart" className="nav-link cart-link">
                                <motion.div whileHover={{ scale: 1.1 }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                                    Cart
                                </motion.div>
                            </NavLink> 
                        </li>
                        {user ? (
                            <>
                                <li className="nav-item">
                                    <NavLink to="/orders" className="nav-link orders-link">
                                        <motion.div whileHover={{ scale: 1.1 }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                                            Orders
                                        </motion.div>
                                    </NavLink> 
                                </li>
                                <li className="nav-item">
                                    <motion.div 
                                        className="user-greeting"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        <span className="greeting-text">Welcome back,</span>
                                        <span className="user-name">{user.name}</span>
                                    </motion.div>
                                </li>
                                <li className="nav-item">
                                    <motion.button 
                                        onClick={handleLogout} 
                                        className="logout-btn"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Logout
                                    </motion.button>
                                </li>
                            </>
                        ) : (
                            <li className="nav-item">
                                <NavLink to="/login" className="login-btn">
                                    <motion.span whileHover={{ scale: 1.05 }} style={{ display: 'inline-block' }}>
                                        Login / Signup
                                    </motion.span>
                                </NavLink> 
                            </li>
                        )}
                    </ul>
                </nav>
            </div>
            
            {user && <AddressModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
        </header>
    )
}