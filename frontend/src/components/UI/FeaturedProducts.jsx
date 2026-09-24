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
    staleTime: 0,
    refetchOnMount: true,
  });

  // Limit featured products to 8 items
  const featuredList = products.slice(0, 8);

  return (
    <section className="section-featured-products">
      <div className="container">

        {/* Header */}
        <div className="featured-header">
          <div className="featured-title-area">
            <div className="neo-badge pink" style={{ marginBottom: "0.8rem" }}>
              🔥 TRENDING RIGHT NOW
            </div>
            <h2 className="featured-title">HOTTEST DROPS RIGHT NOW</h2>
            <p className="featured-subtitle">
              Certified high-aura essentials and crowd-voted favorites. Cop before they sell out.
            </p>
          </div>
          <Link to="/product" className="btn btn-outline featured-explore-btn">
            VIEW ALL DROPS <FaArrowRight style={{ marginLeft: "8px" }} />
          </Link>
        </div>

        {/* Grid */}
        <div className="featured-grid">
          {isLoading ? (
            <div className="featured-empty">Cooking up featured essentials...</div>
          ) : isError ? (
            <div className="featured-empty">Failed to fetch hot drops. L moment, please retry.</div>
          ) : featuredList.length > 0 ? (
            featuredList.map((product) => (
              <ProductCard 
                key={product._id || product.id} 
                product={product} 
              />
            ))
          ) : (
            <div className="featured-empty">No drops available at this second bestie.</div>
          )}
        </div>

      </div>
    </section>
  );
};
