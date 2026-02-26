import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getProductById } from "../api/postApi";
import "../components/css/productDetails.css";

export const ProductDetails = () => {
  const { productId } = useParams(); // ✅ MUST match route param

  /* ------------------ Product Query ------------------ */
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProductById(productId),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: !!productId,
  });

  /* ------------------ Loading & Error ------------------ */
  if (isLoading) {
    return <p>Loading product details...</p>;
  }

  if (isError) {
    return <p>Error: {error.message}</p>;
  }

  if (!product) {
    return <p>Product not found.</p>;
  }

  /* ------------------ Render ------------------ */
  return (
    <section className="pd-section">
      <div className="pd-container">

        {/* Image */}
        <div className="pd-image-wrapper">
          <img
            className="pd-image"
            src={product.thumbnail}
            alt={product.title}
          />
        </div>

        {/* Info */}
        <div className="pd-info">
          <h1 className="pd-title">{product.title}</h1>

          <p className="pd-price">₹{product.price}</p>

          <p className="pd-description">{product.description}</p>

          <p className="pd-category">
            Category: {product.category}
          </p>

          <p className="pd-rating">
            Rating: {product.rating} ⭐
          </p>

          {/* Actions */}
          <div className="pd-actions">
            <button className="pd-btn add-cart-btn">
              Add to Cart
            </button>
            <button className="pd-btn buy-now-btn">
              Buy Now
            </button>
          </div>
        </div>

        {/* ------------------ Reviews Section ------------------ */}
        <div className="pd-reviews">
          <h2 className="pd-reviews-title">Customer Reviews</h2>

          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map((review, index) => (
              <div key={index} className="pd-review-card">
                <div className="pd-review-header">
                  <strong className="pd-reviewer">
                    {review.reviewerName}
                  </strong>
                  <span className="pd-review-rating">
                    {review.rating} ⭐
                  </span>
                </div>

                <p className="pd-review-comment">
                  {review.comment}
                </p>

                <p className="pd-review-date">
                  {review.date}
                </p>
              </div>
            ))
          ) : (
            <p>No reviews available.</p>
          )}
        </div>

      </div>
    </section>
  );
};