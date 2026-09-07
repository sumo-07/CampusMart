import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { AuthContext } from "../../context/AuthContext";
import '../css/productCard.css';

export const ProductCard = ({ product }) => {
  const {
    _id,
    id,
    title,
    price,
    thumbnail,
    rating,
    category,
    stock,
  } = product;

  const { getItemQuantity, updateQuantity, addToCart } = useCart();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const productId = _id || id;
  const cartQty = getItemQuantity(productId);

  const isOutOfStock = stock !== undefined && stock <= 0;
  const isLowStock = stock !== undefined && stock > 0 && stock <= 5;

  return (
    <div className={`product-card ${isOutOfStock ? "out-of-stock" : ""}`}>

      {/* Product Image */}
      <NavLink to={`/product/${productId}`} className="product-image">
        <img src={thumbnail} alt={title} />
        {isOutOfStock && (
          <span className="card-stock-tag out">Out of Stock</span>
        )}
      </NavLink>

      {/* Product Info */}
      <div className="product-info">
        <span className="product-category">{category}</span>

        <h3 className="product-title">
          <NavLink to={`/product/${productId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            {title}
          </NavLink>
        </h3>

        <div className="product-meta">
          <div className="product-rating">
            <span>⭐ {rating}</span>
          </div>

          {stock !== undefined && (
            <span className={`product-stock ${isOutOfStock ? "out" : isLowStock ? "low" : "in"}`}>
              {isOutOfStock
                ? "Out of Stock"
                : isLowStock
                ? `Only ${stock} left`
                : `Stock: ${stock}`}
            </span>
          )}
        </div>

        <div className="product-footer">
          <span className="product-price">₹ {Number(price).toFixed(2)}</span>

          <div className="product-card-actions">
            {!isOutOfStock && cartQty > 0 ? (
              <div className="card-qty-control" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="card-qty-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    updateQuantity(productId, "dec");
                  }}
                  title="Decrease quantity"
                >
                  −
                </button>
                <span className="card-qty-number">{cartQty}</span>
                <button
                  type="button"
                  className="card-qty-btn"
                  onClick={(e) => {
                    e.preventDefault();
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
            ) : !isOutOfStock ? (
              <button
                type="button"
                className="btn-add-cart-card"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!user) {
                    navigate("/login");
                    return;
                  }
                  try {
                    await addToCart(product);
                  } catch (err) {
                    alert(err.message);
                  }
                }}
              >
                + Add
              </button>
            ) : null}

            <NavLink
              to={`/product/${productId}`}
              className="btn-details"
            >
              Details
            </NavLink>
          </div>
        </div>
      </div>

    </div>
  );
};