import aboutImage from "../images/about.jpeg";
import '../components/css/about.css';

export const About = () => {
  return (
    <section className="section-about">
      <div className="container about-container">

        {/* Page Heading */}
        <div className="about-header">
          <h1 className="about-title">About Us</h1>
          <p className="about-subtitle">
            Built for students. Designed for convenience.
          </p>
        </div>

        {/* About Content */}
        <div className="about-content">

          {/* Text */}
          <div className="about-text">
            <p>
              CampusMart is an e-commerce platform created specially for
              college students who want quality products at affordable prices.
              We understand campus life — tight schedules, limited budgets,
              and the need for fast, reliable shopping.
            </p>

            <p>
              From daily essentials to trending gadgets, CampusMart connects
              students with products that matter most. Our mission is to make
              shopping simple, quick, and stress-free.
            </p>

            <p>
              This platform is built using modern web technologies and focuses
              on performance, usability, and scalability.
            </p>
          </div>

          {/* Image */}
          <div className="about-image">
            <img src={aboutImage} alt="About CampusMart" />
          </div>

        </div>

        {/* Features / Values */}
        <div className="about-features">
          <div className="feature-item">
            <h3>Student Friendly</h3>
            <p>Affordable pricing tailored for campus needs.</p>
          </div>

          <div className="feature-item">
            <h3>Fast & Reliable</h3>
            <p>Quick delivery and trusted sellers.</p>
          </div>

          <div className="feature-item">
            <h3>Secure Shopping</h3>
            <p>Safe payments and protected user data.</p>
          </div>
        </div>

      </div>
    </section>
  );
};