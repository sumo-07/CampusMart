import { useEffect, useState } from "react";
import {
    getAllProducts,
    getAllCategories,
    getProductsByCategory,
} from "../api/postApi";
import { ProductCard } from "../components/UI/ProductCard";
import "../components/css/products.css";

export const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [activeCategory, setActiveCategory] = useState(null);
    const [activeSort, setActiveSort] = useState(null);

    // Accordion state
    const [showCategories, setShowCategories] = useState(false);
    const [showPrice, setShowPrice] = useState(false);

    /* ------------------ Fetch initial data ------------------ */
    useEffect(() => {
        const fetchInitialData = async () => {
            const productsData = await getAllProducts();
            const categoryData = await getAllCategories();

            setProducts(productsData);
            setCategories(categoryData);
        };

        fetchInitialData();
    }, []);

    /* ------------------ Debounce Search ------------------ */
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    /* ------------------ Category Filter ------------------ */
    const handleCategoryFilter = async (category) => {
        setActiveCategory(category);
        setActiveSort(null);

        const data = await getProductsByCategory(category);
        setProducts(data);

        // CLOSE accordion after selection
        setShowCategories(false);
    };

    /* ------------------ Price Sort ------------------ */
    const handlePriceSort = (type) => {
        setActiveSort(type);
        setActiveCategory(null);

        const sortedProducts = [...products].sort((a, b) =>
            type === "low-high" ? a.price - b.price : b.price - a.price
        );

        setProducts(sortedProducts);

        // CLOSE accordion after selection
        setShowPrice(false);
    };

    /* ------------------ Clear Filters ------------------ */
    const clearFilters = async () => {
        setActiveCategory(null);
        setActiveSort(null);
        setSearchTerm("");

        const data = await getAllProducts();
        setProducts(data);

        // CLOSE all accordions
        setShowCategories(false);
        setShowPrice(false);
    };

    /* ------------------ Search Logic ------------------ */
    const filteredProducts = products.filter((product) =>
        product.title.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    return (
        <section className="section-products">
            <div className="container products-container">

                {/* Search */}
                <div className="products-search">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="products-filters">

                    {/* Categories */}
                    <div className="filter-block">
                        <button
                            className="filter-toggle"
                            onClick={() => {
                                setShowCategories(prev => !prev);
                                setShowPrice(false);
                            }}
                        >
                            Categories
                            <span>{showCategories ? "−" : "+"}</span>
                        </button>

                        {showCategories && (
                            <div className="filter-content">
                                {categories.map((category) => (
                                    <button
                                        key={category.slug}
                                        onClick={() =>
                                            handleCategoryFilter(category.slug)
                                        }
                                        className={
                                            activeCategory === category.slug
                                                ? "filter-btn active"
                                                : "filter-btn"
                                        }
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Price */}
                    <div className="filter-block">
                        <button
                            className="filter-toggle"
                            onClick={() => {
                                setShowPrice(prev => !prev);
                                setShowCategories(false);
                            }}
                        >
                            Sort by Price
                            <span>{showPrice ? "−" : "+"}</span>
                        </button>

                        {showPrice && (
                            <div className="filter-content">
                                <button
                                    onClick={() => handlePriceSort("low-high")}
                                    className={
                                        activeSort === "low-high"
                                            ? "filter-btn active"
                                            : "filter-btn"
                                    }
                                >
                                    Low → High
                                </button>

                                <button
                                    onClick={() => handlePriceSort("high-low")}
                                    className={
                                        activeSort === "high-low"
                                            ? "filter-btn active"
                                            : "filter-btn"
                                    }
                                >
                                    High → Low
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Clear */}
                    <button onClick={clearFilters} className="filter-clear">
                        Clear Filters
                    </button>
                </div>

                {/* Products Grid */}
                <div className="products-grid">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <p>No products found.</p>
                    )}
                </div>
            </div>
        </section>
    );
};