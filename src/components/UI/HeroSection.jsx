import { NavLink } from "react-router-dom";
import heroImage from "../../images/heroSection.jpeg";
import '../css/heroSection.css';
export const HeroSection = () => {
  return (
    <section className="section-hero">
      <div className="container hero-container">

        {/* Hero Content */}
        <div className="hero-content">
          <h1 className="hero-heading">
            Smart Shopping for Campus Life
          </h1>

          <p className="hero-description">
            Discover affordable, high-quality products made especially for
            students. From daily essentials to trending items — CampusMart
            has you covered.
          </p>

          <div className="hero-actions">
            <NavLink to="/product" className="btn btn-primary">
              Shop Now
            </NavLink>

            <NavLink to="/about" className="btn btn-outline">
              Learn More
            </NavLink>
          </div>
        </div>

        {/* Hero Image */}
        <div className="hero-image">
          <img src={heroImage} alt="Campus shopping" />
        </div>

      </div>
    </section>
  );
};