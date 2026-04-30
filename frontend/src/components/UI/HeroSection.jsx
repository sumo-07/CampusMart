import { NavLink } from "react-router-dom";
import heroImage from "../../images/hero_new.png";
import '../css/heroSection.css';
import { motion } from "framer-motion";

export const HeroSection = () => {
  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <section className="section-hero">
      <motion.div 
        className="container hero-container"
        variants={containerVariants}
      >

        {/* Hero Content */}
        <div className="hero-content">
          <motion.div className="hero-badge" variants={itemVariants}>Student Exclusive</motion.div>
          <motion.h1 className="hero-heading" variants={itemVariants}>
            Smart Shopping for <span className="highlight">Campus Life</span>
          </motion.h1>

          <motion.p className="hero-description" variants={itemVariants}>
            The all-in-one marketplace built for students. Get your essentials, trending gear, and campus favorites delivered straight to your door with exclusive student discounts.
          </motion.p>

          <motion.div className="hero-actions" variants={itemVariants}>
            <NavLink to="/product" className="hero-btn hero-btn-primary">
              <motion.div whileHover={{ x: 5 }} style={{ display: 'flex', alignItems: 'center' }}>
                Shop Now
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </motion.div>
            </NavLink>

            <NavLink to="/about" className="hero-btn hero-btn-outline">
              <motion.span whileHover={{ scale: 1.05 }}>Learn More</motion.span>
            </NavLink>
          </motion.div>

          <motion.div className="hero-stats" variants={itemVariants}>
            <div className="stat-item">
              <span className="stat-num">5k+</span>
              <span className="stat-label">Students</span>
            </div>
            <div className="stat-item">
              <span className="stat-num">170+</span>
              <span className="stat-label">Products</span>
            </div>
          </motion.div>
        </div>

        {/* Hero Image */}
        <motion.div 
          className="hero-image-wrapper"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="hero-image-blob"></div>
          <img src={heroImage} alt="Campus shopping illustration" className="hero-img-main" />
        </motion.div>

      </motion.div>
    </section>
  );
};