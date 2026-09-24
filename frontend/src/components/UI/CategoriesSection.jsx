import React from "react";
import { useNavigate } from "react-router-dom";
import { CategoryModel } from "./ThreeDObjects";
import { FaArrowRight } from "react-icons/fa";
import "../css/categoriesSection.css";

export const CategoriesSection = () => {
  const navigate = useNavigate();

  const categories = [
    {
      name: "Drip & Fits",
      badge: "AURA +10,000",
      badgeColor: "pink",
      type: "fashion",
      desc: "Step up your fit check with kicks, hoodies, bags, and high-key iconic fits that turn heads.",
      slug: "mens-shoes",
    },
    {
      name: "Room & Desk Glow Up",
      badge: "PINTEREST VIBE",
      badgeColor: "yellow",
      type: "room-decor",
      desc: "Turn your room or desk setup into an aesthetic moodboard with ambient lamps, decor & accessories.",
      slug: "home-decoration",
    },
    {
      name: "Lock-In Tech",
      badge: "MAX PRODUCTIVITY",
      badgeColor: "green",
      type: "tech-essentials",
      desc: "Power through late-night creative grinds and gaming sessions with chargers, stands, and gadgets.",
      slug: "smartphones",
    },
  ];

  return (
    <section className="section-categories">
      <div className="container">
        
        {/* Header */}
        <div className="categories-header">
          <div className="neo-badge green" style={{ marginBottom: "1rem" }}>
            ⚡ CURATED STASH
          </div>
          <h2 className="categories-title">PICK YOUR AESTHETIC</h2>
          <p className="categories-subtitle">
            Curated collections so you never look cooked fr fr. High quality, peak aesthetics, zero cap.
          </p>
        </div>

        {/* Grid */}
        <div className="categories-grid">
          {categories.map((cat, idx) => (
            <div 
              key={idx} 
              className="category-card"
              onClick={() => navigate(`/product?category=${cat.slug}`)}
            >
              <div className="category-top-tag">
                <span className={`neo-badge ${cat.badgeColor}`}>
                  {cat.badge}
                </span>
                <span className="category-orbit-hint">3D PREVIEW</span>
              </div>

              {/* 3D Model Viewport */}
              <div className="category-model-box">
                <CategoryModel type={cat.type} />
              </div>

              {/* Info */}
              <div className="category-info">
                <h3 className="category-name">{cat.name}</h3>
                <p className="category-desc">{cat.desc}</p>
                <button type="button" className="category-cta-btn">
                  <span>COP THIS VIBE</span>
                  <FaArrowRight />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
