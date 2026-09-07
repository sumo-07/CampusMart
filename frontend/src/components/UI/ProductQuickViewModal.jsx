import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ProductPreview3D } from "./ThreeDObjects";
import { useCart } from "../../context/CartContext";
import { AuthContext } from "../../context/AuthContext";
import { FaTimes, FaShoppingCart, FaInfoCircle } from "react-icons/fa";
import "../css/quickView.css";

export const ProductQuickViewModal = ({ isOpen, onClose, product }) => {
  const [adding, setAdding] = useState(false);
  const { getItemQuantity, updateQuantity, addToCart } = useCart();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!isOpen || !product) return null;

  const {
    _id,
    id,
    title,
    description,
    price,
    rating,
    category,
    thumbnail,
    stock
  } = product;

  const productId = _id || id;
  const cartQty = getItemQuantity(productId);

  const handleAddToCart = async () => {
    if (!user) {
      onClose();
      navigate("/login");
      return;
    }
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
            <span className={`quickview-stock ${stock > 0 ? (stock <= 5 ? "low" : "") : "out"}`}>
              {stock > 0 ? (stock <= 5 ? `Only ${stock} left!` : `In Stock (${stock})`) : "Out of Stock"}
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
              {stock <= 0 ? (
                <button className="btn btn-primary" disabled>
                  Out of Stock
                </button>
              ) : cartQty > 0 ? (
                <div className="card-qty-control" style={{ padding: '6px 12px', gap: '10px' }}>
                  <button 
                    type="button"
                    className="card-qty-btn"
                    style={{ width: '32px', height: '32px', fontSize: '1.1rem' }}
                    onClick={() => updateQuantity(productId, "dec")}
                    title="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="card-qty-number" style={{ fontSize: '0.95rem' }}>{cartQty} in Cart</span>
                  <button 
                    type="button"
                    className="card-qty-btn"
                    style={{ width: '32px', height: '32px', fontSize: '1.1rem' }}
                    onClick={() => {
                      if (stock !== undefined && cartQty >= stock) {
                        alert(`Only ${stock} items available in stock`);
                        return;
                      }
                      updateQuantity(productId, "inc");
                    }}
                    disabled={stock !== undefined && cartQty >= stock}
                    title="Increase quantity"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button 
                  className="btn btn-primary" 
                  onClick={handleAddToCart}
                  disabled={adding}
                >
                  <FaShoppingCart style={{ marginRight: "8px" }} />
                  {adding ? "Adding..." : "Add to Cart"}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
