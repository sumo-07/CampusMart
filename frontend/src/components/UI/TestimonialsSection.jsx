import React from "react";
import { GlassGlobe } from "./ThreeDObjects";
import "../css/testimonials.css";

export const TestimonialsSection = () => {
  const reviews = [
    {
      text: "The 3D preview is a complete game changer! I could inspect the dorm desk lamp in a full 360-degree orbit before hitting purchase.",
      name: "Ujjawal",
      role: "B.Tech Computer Science",
      glow: "glow-blue",
      initial: "U",
    },
    {
      text: "Super fast deliveries directly to my hostel lobby. CampusMart has made styling my room and getting tech gear so convenient.",
      name: "Priyanshu",
      role: "Mechanical Engineering",
      glow: "glow-purple",
      initial: "P",
    },
    {
      text: "Finally, a shop that doesn't look like a generic grid. The premium glassmorphic dark theme matches my coding setup perfectly!",
      name: "Aditi",
      role: "Interaction Design Major",
      glow: "glow-purple",
      initial: "A",
    },
    {
      text: "Authentic campus products and highly competitive student pricing. Finding dorm necessities is no longer a chore.",
      name: "Rohan",
      role: "MBA Program",
      glow: "glow-blue",
      initial: "R",
    },
  ];

  return (
    <section className="section-testimonials">
      <div className="container">
        <div className="testimonials-grid">
          
          {/* Left: Reviews List */}
          <div className="testimonials-content">
            <div className="testimonials-header">
              <h2 className="testimonials-title">Campus Trust</h2>
              <p className="testimonials-subtitle">
                See what students across the university campus are saying about their shopping experiences.
              </p>
            </div>

            <div className="testimonials-list">
              {reviews.map((rev, idx) => (
                <div key={idx} className={`testimonial-card ${rev.glow}`}>
                  <p className="testimonial-text">
                    "{rev.text}"
                  </p>
                  <div className="testimonial-user">
                    <div className="testimonial-avatar">
                      {rev.initial}
                    </div>
                    <div className="testimonial-meta">
                      <span className="testimonial-name">{rev.name}</span>
                      <span className="testimonial-role">{rev.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: 3D Glass Globe Display */}
          <div className="testimonials-visual">
            <GlassGlobe />
            <div className="visual-stats">
              <div className="stat-number">5,000+</div>
              <div className="stat-label">Active Campus Members</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
