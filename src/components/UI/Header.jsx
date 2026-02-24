import { NavLink } from "react-router-dom"
import logo from '../../images/logo.jpg'
export const Header= ()=> {
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
                        <li className="nav-item"> 
                            <NavLink to="/login" className="nav-link" >Login/Signup</NavLink> </li>
                    </ul>
                </nav>
            </div>
        </header>
    )
}