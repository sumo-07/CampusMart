import React from "react";
import { useNavigate } from "react-router-dom";
import { CategoryModel } from "./ThreeDObjects";
import { FaArrowRight } from "react-icons/fa";
import "../css/categoriesSection.css";

export const CategoriesSection = () => {
  const navigate = useNavigate();

  const categories = [
    {
      name: "Fashion",
      type: "fashion",
      desc: "Step up your campus look with sneakers, hoodies, bags, and modern accessories.",
      slug: "mens-shoes",
    },
    {
      name: "Dorm Decor",
      type: "dorm-decor",
      desc: "Transform your living space with ambient lamps, comfy setups, and desk organizers.",
      slug: "home-decoration",
    },
    {
      name: "Tech Essentials",
      type: "tech-essentials",
      desc: "Fuel your study sessions with smartphones, laptop stands, chargers, and gadgets.",
      slug: "smartphones",
    },
  ];

  return (
    <section className="section-categories">
      <div className="container">
        
        {/* Header */}
        <div className="categories-header">
          <h2 className="categories-title">Browse by Category</h2>
          <p className="categories-subtitle">
            Explore curated collections tailored specifically for student lifestyles and study spaces.
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
              {/* 3D Model Viewport */}
              <CategoryModel type={cat.type} />

              {/* Info */}
              <div className="category-info">
                <h3 className="category-name">{cat.name}</h3>
                <p className="category-desc">{cat.desc}</p>
                <span className="category-link">
                  Explore Collection <FaArrowRight />
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
