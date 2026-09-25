import aboutImage from "../images/about.jpeg";
import '../components/css/about.css';

export const About = () => {
  return (
    <section className="section-about">
      <div className="container about-container">

        {/* Page Heading */}
        <div className="about-header">
          <div className="neo-badge yellow">📖 THE LORE</div>
          <h1 className="about-title">WHO WE ARE (NO CAP)</h1>
          <p className="about-subtitle">
            Zero corporate fluff. 100% authentic energy. We make sure you never take an L on everyday shopping.
          </p>
        </div>

        {/* About Content */}
        <div className="about-content">

          {/* Text */}
          <div className="about-text-card">
            <h2 className="about-card-title">THE ORIGIN STORY ☕</h2>
            <p>
              <strong>Cartsy</strong> wasn't cooked up in some boring corporate boardroom. It was born out of pure frustration with clunky, overpriced retail sites charging insane markups for mid products that take two weeks to show up.
            </p>

            <p>
              We know the drill — endless scrolling through cheap knockoffs, broken links, hidden checkout fees, and the desperate search for aesthetic room setups, fresh fits, and reliable everyday tech.
            </p>

            <p>
              Cartsy delivers certified high-aura products, fits, room glow-ups, and daily essentials. Shipped straight to your doorstep, community-vetted, with zero hidden fees. Pure vibes only.
            </p>
          </div>

          {/* Image */}
          <div className="about-image-card">
            <div className="about-image-tag">
              <span>CARTSY HEADQUARTERS 📍</span>
            </div>
            <img src={aboutImage} alt="About Cartsy" />
            <div className="about-image-caption">
              <span>AURA +10,000 • KEEPING THE WHOLE SETUP DRIPPY</span>
            </div>
          </div>

        </div>

        {/* Features / Values */}
        <div className="about-features">
          <div className="feature-item f-yellow">
            <div className="feature-icon">💸</div>
            <h3>Wallet Friendly (Big W)</h3>
            <p>Fair pricing that won't make your bank account cry. Maximum ROI, zero cap.</p>
          </div>

          <div className="feature-item f-pink">
            <div className="feature-icon">🚀</div>
            <h3>Warp Speed Delivery</h3>
            <p>From cart to your doorstep faster than instant noodles can cook.</p>
          </div>

          <div className="feature-item f-green">
            <div className="feature-icon">🛡️</div>
            <h3>Locked In Security</h3>
            <p>Razorpay encrypted checkout & COD handoffs. Your paper is 100% safe.</p>
          </div>
        </div>

      </div>
    </section>
  );
};