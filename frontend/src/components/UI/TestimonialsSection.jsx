import React from "react";
import { GlassGlobe } from "./ThreeDObjects";
import "../css/testimonials.css";

export const TestimonialsSection = () => {
  const reviews = [
    {
      text: "Cartsy drops are straight cinema fr fr! Copped the cyber kicks and the fit check went crazy. Aura +10,000 🚀",
      name: "Ujjawal",
      role: "Verified Buyer • Locked In",
      badgeColor: "yellow",
      initial: "U",
    },
    {
      text: "Delivered to my doorstep before my coffee was even ready. Cartsy is genuinely goated with the sauce 🔥",
      name: "Priyanshu",
      role: "Trendsetter • Daily Shopper",
      badgeColor: "pink",
      initial: "P",
    },
    {
      text: "Finally a store with insane aesthetic. The tactile neo-brutalist styling slaps so hard. Huge W!",
      name: "Aditi",
      role: "Chief Aesthetic Officer",
      badgeColor: "green",
      initial: "A",
    },
    {
      text: "Prices don't violate my bank account. Absolute holy grail marketplace no cap.",
      name: "Rohan",
      role: "Creative Hustler",
      badgeColor: "blue",
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
              <div className="neo-badge yellow" style={{ marginBottom: "0.8rem" }}>
                ✨ ZERO PAID ACTORS
              </div>
              <h2 className="testimonials-title">THE COMMUNITY VIBE CHECK</h2>
              <p className="testimonials-subtitle">
                Straight facts from real shoppers, creators, and trendsetters. Authentic aura only.
              </p>
            </div>

            <div className="testimonials-list">
              {reviews.map((rev, idx) => (
                <div key={idx} className="testimonial-card">
                  <div className="testimonial-header-row">
                    <span className={`neo-badge ${rev.badgeColor}`}>
                      VERIFIED COP 📦
                    </span>
                    <span className="testimonial-stars">⭐⭐⭐⭐⭐</span>
                  </div>
                  <p className="testimonial-text">
                    "{rev.text}"
                  </p>
                  <div className="testimonial-user">
                    <div className={`testimonial-avatar ${rev.badgeColor}`}>
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

          {/* Right: 3D Globe Visual Frame */}
          <div className="testimonials-visual">
            <div className="testimonials-globe-frame">
              <div className="globe-tag">
                <span>🌐 GLOBAL NETWORK ACTIVE</span>
              </div>
              <GlassGlobe />
              <div className="visual-stats">
                <div className="stat-number">10,000+</div>
                <div className="stat-label">People Copping Heat Daily</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
