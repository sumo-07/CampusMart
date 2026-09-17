import { useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getProductById } from "../api/postApi";
import "../components/css/productDetails.css";
import { AuthContext } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export const ProductDetails = () => {
    const { productId } = useParams(); // ✅ MUST match route param
    const navigate = useNavigate();
    const location = useLocation();
    const [addingToCart, setAddingToCart] = useState(false);
    const { user } = useContext(AuthContext);
    const { getItemQuantity, updateQuantity, addToCart, MAX_ITEM_QUANTITY } = useCart();

    /* ------------------ Product Query ------------------ */
    const {
        data: product,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["product", productId],
        queryFn: () => getProductById(productId),
        staleTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        enabled: !!productId,
    });

    /* ------------------ Loading & Error ------------------ */
    if (isLoading) {
        return (
            <section className="pd-section">
                <div className="pd-container" style={{ textAlign: "center", display: "block", paddingTop: "4rem" }}>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem" }}>Loading product details...</p>
                </div>
            </section>
        );
    }

    if (isError) {
        return (
            <section className="pd-section">
                <div className="pd-container" style={{ textAlign: "center", display: "block", paddingTop: "4rem" }}>
                    <h2 style={{ color: "#ef4444", marginBottom: "1rem" }}>Unable to load product</h2>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                        {error?.message === "Network Error"
                            ? "Network Error: Please ensure the backend server is running."
                            : error?.message || "Failed to load product details."}
                    </p>
                    <button className="pd-btn buy-now-btn" onClick={() => navigate("/product")}>
                        Back to Products
                    </button>
                </div>
            </section>
        );
    }

    if (!product) {
        return (
            <section className="pd-section">
                <div className="pd-container" style={{ textAlign: "center", display: "block", paddingTop: "4rem" }}>
                    <h2 style={{ marginBottom: "1rem" }}>Product not found</h2>
                    <button className="pd-btn buy-now-btn" onClick={() => navigate("/product")}>
                        Back to Products
                    </button>
                </div>
            </section>
        );
    }

    const handleAddToCart = async () => {
        setAddingToCart(true);
        try {
            await addToCart(product);
        } catch (error) {
            alert(error.message);
            if (error.message.toLowerCase().includes("login") || error.message.toLowerCase().includes("authorized")) {
                navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`, { state: { from: location } });
            }
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBuyNow = () => {
        // Construct the item mapping for a direct checkout override
        const buyNowItem = {
            productId: product._id || product.id || productId,
            title: product.title,
            price: product.price,
            thumbnail: product.thumbnail,
            quantity: 1
        };
        if (!user) {
            navigate("/login?redirect=/checkout", { state: { buyNowItem } });
            return;
        }
        navigate("/checkout", { state: { buyNowItem } });
    };

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

                    {product.stock !== undefined && (
                        <div className="pd-stock-info">
                            <span className="pd-stock-label">Availability:</span>
                            <span className={`pd-stock-badge ${product.stock > 0 ? (product.stock <= 5 ? "low" : "in") : "out"}`}>
                                {product.stock > 0
                                    ? (product.stock <= 5
                                        ? `⚠️ Only ${product.stock} left in stock - Order soon`
                                        : `✓ In Stock (${product.stock} units available)`)
                                    : "✕ Currently Out of Stock"}
                            </span>
                        </div>
                    )}

                    {/* Actions */}
                    {!user?.isAdmin && (
                        <div className="pd-actions">
                            {product.stock <= 0 ? (
                                <button className="pd-btn add-cart-btn" disabled>
                                    Out of Stock
                                </button>
                            ) : getItemQuantity(product._id || product.id || productId) > 0 ? (
                                <div className="pd-cart-qty-control">
                                    <button
                                        type="button"
                                        className="pd-qty-btn"
                                        onClick={() => updateQuantity(product._id || product.id || productId, "dec")}
                                        title="Decrease quantity"
                                    >
                                        −
                                    </button>
                                    <span className="pd-qty-display">
                                        {getItemQuantity(product._id || product.id || productId)} in Cart
                                    </span>
                                    <button
                                        type="button"
                                        className="pd-qty-btn"
                                        onClick={() => {
                                            const currentQty = getItemQuantity(product._id || product.id || productId);
                                            if (currentQty >= (MAX_ITEM_QUANTITY || 5)) {
                                                alert(`Maximum ${MAX_ITEM_QUANTITY || 5} units allowed per item`);
                                                return;
                                            }
                                            if (product.stock !== undefined && currentQty >= product.stock) {
                                                alert(`Only ${product.stock} items available in stock`);
                                                return;
                                            }
                                            updateQuantity(product._id || product.id || productId, "inc");
                                        }}
                                        disabled={getItemQuantity(product._id || product.id || productId) >= (MAX_ITEM_QUANTITY || 5) || (product.stock !== undefined && getItemQuantity(product._id || product.id || productId) >= product.stock)}
                                        title={getItemQuantity(product._id || product.id || productId) >= (MAX_ITEM_QUANTITY || 5) ? `Maximum ${MAX_ITEM_QUANTITY || 5} units allowed per item` : "Increase quantity"}
                                    >
                                        +
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="pd-btn add-cart-btn"
                                    onClick={handleAddToCart}
                                    disabled={addingToCart}
                                >
                                    {addingToCart ? "Adding..." : "Add to Cart"}
                                </button>
                            )}

                            <button 
                                className="pd-btn buy-now-btn"
                                onClick={handleBuyNow}
                                disabled={product.stock <= 0}
                            >
                                {product.stock <= 0 ? "Out of Stock" : "Buy Now"}
                            </button>
                        </div>
                    )}
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