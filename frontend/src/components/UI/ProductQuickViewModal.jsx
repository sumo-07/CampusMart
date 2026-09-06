import React, { useState } from "react";
import { ProductPreview3D } from "./ThreeDObjects";
import { addToCart } from "../../utils/cartUtils";
import { FaTimes, FaShoppingCart, FaInfoCircle } from "react-icons/fa";
import "../css/quickView.css";

export const ProductQuickViewModal = ({ isOpen, onClose, product }) => {
  const [adding, setAdding] = useState(false);

  if (!isOpen || !product) return null;

  const {
    title,
    description,
    price,
    rating,
    category,
    thumbnail,
    stock
  } = product;

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addToCart(product);
    } catch (err) {
      alert(err.message || "Failed to add product to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="quickview-overlay" onClick={onClose}>
      <div className="quickview-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button className="quickview-close" onClick={onClose} aria-label="Close modal">
          <FaTimes />
        </button>

        {/* 3D Visual Preview (Left Panel) */}
        <div className="quickview-visual">
          <ProductPreview3D category={category} thumbnail={thumbnail} />
          
          <div className="quickview-visual-info">
            <FaInfoCircle />
            <span>Click & drag to rotate in 3D</span>
          </div>
        </div>

        {/* Product Details (Right Panel) */}
        <div className="quickview-details">
          <span className="quickview-category">{category}</span>
          <h2 className="quickview-title">{title}</h2>
          
          <div className="quickview-meta">
            <span className="quickview-rating">⭐ {rating} Rating</span>
            <span className={`quickview-stock ${stock > 0 ? "" : "out"}`}>
              {stock > 0 ? `In Stock (${stock})` : "Out of Stock"}
            </span>
          </div>

          <p className="quickview-description">
            {description || "Explore this premium campus item at CampusMart. Quality guaranteed for students."}
          </p>

          <div className="quickview-footer">
            <div className="quickview-price-container">
              <span className="quickview-price-label">Student Price</span>
              <span className="quickview-price">₹ {price}</span>
            </div>

            <div className="quickview-actions">
              <button 
                className="btn btn-primary" 
                onClick={handleAddToCart}
                disabled={adding || stock <= 0}
              >
                <FaShoppingCart style={{ marginRight: "8px" }} />
                {adding ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
