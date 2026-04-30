import { NavLink } from "react-router-dom";
import '../css/productCard.css';
import { motion } from "framer-motion";

export const ProductCard = ({ product }) => {
  const {
    id,
    title,
    price,
    thumbnail,
    rating,
    category,
  } = product;

  return (
    <motion.div 
      className="product-card"
      whileHover={{ y: -8 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >

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
            to={`/product/${id}`}
            className="btn btn-primary"
          >
            <motion.span 
              whileHover={{ x: 3 }}
              style={{ display: 'inline-block' }}
            >
              View Details
            </motion.span>
          </NavLink>
        </div>
      </div>

    </motion.div>
  );
};