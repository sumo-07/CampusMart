import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getAllProducts } from "../../api/postApi";
import { ProductCard } from "./ProductCard";
import { FaArrowRight } from "react-icons/fa";
import "../css/featuredProducts.css";

export const FeaturedProducts = () => {
  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ["featuredProducts"],
    queryFn: getAllProducts,
    staleTime: 300000, // 5 minutes cache
  });

  // Limit featured products to 8 items
  const featuredList = products.slice(0, 8);

  return (
    <section className="section-featured-products">
      <div className="container">

        {/* Header */}
        <div className="featured-header">
          <div className="featured-title-area">
            <h2 className="featured-title">Featured Deals</h2>
            <p className="featured-subtitle">
              Grab high-quality essentials and student-voted favorites at discounted rates.
            </p>
          </div>
          <Link to="/product" className="btn btn-outline" style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
            View All Products <FaArrowRight />
          </Link>
        </div>

        {/* Grid */}
        <div className="featured-grid">
          {isLoading ? (
            <div className="featured-empty">Loading featured essentials...</div>
          ) : isError ? (
            <div className="featured-empty">Failed to fetch student deals. Please try again.</div>
          ) : featuredList.length > 0 ? (
            featuredList.map((product) => (
              <ProductCard 
                key={product._id || product.id} 
                product={product} 
              />
            ))
          ) : (
            <div className="featured-empty">No products available at the moment.</div>
          )}
        </div>

      </div>
    </section>
  );
};
