import { NavLink } from "react-router-dom";
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

  const isOutOfStock = stock !== undefined && stock <= 0;
  const isLowStock = stock !== undefined && stock > 0 && stock <= 5;

  return (
    <div className={`product-card ${isOutOfStock ? "out-of-stock" : ""}`}>

      {/* Product Image */}
      <NavLink to={`/product/${_id || id}`} className="product-image">
        <img src={thumbnail} alt={title} />
        {isOutOfStock && (
          <span className="card-stock-tag out">Out of Stock</span>
        )}
      </NavLink>

      {/* Product Info */}
      <div className="product-info">
        <span className="product-category">{category}</span>

        <h3 className="product-title">
          <NavLink to={`/product/${_id || id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
          <span className="product-price">₹ {price}</span>

          <NavLink
            to={`/product/${_id || id}`}
            className="btn-details"
          >
            Details
          </NavLink>
        </div>
      </div>

    </div>
  );
};