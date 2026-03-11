import { NavLink, useNavigate } from "react-router-dom"
import { useContext } from "react"
import logo from '../../images/logo.jpg'
import { AuthContext } from "../../context/AuthContext"

export const Header = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="section-navbar">
            <div className="container">
                <div className="navbar-brand">
                    <NavLink to="/" className="brand-link">
                        <img src={logo} alt="shop-logo" width="80%" height="auto" />
                        <span className="brand-name">CampusMart</span>
                    </NavLink>

                </div>

                <nav className='navbar'>
                    <ul>
                        <li className="nav-item">
                            <NavLink to="/" className="nav-link">Home</NavLink> </li>
                        <li className="nav-item">
                            <NavLink to="/product" className="nav-link" >Products</NavLink> </li>
                        <li className="nav-item">
                            <NavLink to="/about" className="nav-link" >About</NavLink> </li>
                        <li className="nav-item">
                            <NavLink to="/contact" className="nav-link" >Contact</NavLink> </li>
                        <li className="nav-item">
                            <NavLink to="/cart" className="nav-link" >Cart</NavLink> </li>
                        {user ? (
                            <>
                                <li className="nav-item">
                                    <span className="nav-link" style={{color: '#646cff'}}>Hello, {user.name}</span>
                                </li>
                                <li className="nav-item">
                                    <button onClick={handleLogout} className="nav-link" style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit'}}>Logout</button>
                                </li>
                            </>
                        ) : (
                            <li className="nav-item">
                                <NavLink to="/login" className="nav-link" >Login/Signup</NavLink> 
                            </li>
                        )}
                    </ul>
                </nav>
            </div>
        </header>
    )
}