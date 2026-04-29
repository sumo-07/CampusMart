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
  } = product;

  return (
    <div className="product-card">

      {/* Product Image */}
      <div className="product-image">
        <img src={thumbnail} alt={title} />
      </div>

      {/* Product Info */}
      <div className="product-info">
        <span className="product-category">{category}</span>

        <h3 className="product-title">{title}</h3>

        <div className="product-rating">
          <span>⭐ {rating}</span>
        </div>

        <div className="product-footer">
          <span className="product-price">₹ {price}</span>

          <NavLink
            to={`/product/${_id || id}`}
            className="btn btn-primary"
          >
            View Details
          </NavLink>
        </div>
      </div>

    </div>
  );
};