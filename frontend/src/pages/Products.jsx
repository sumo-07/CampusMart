import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getAllProducts,
  getAllCategories,
  getProductsByCategory,
} from "../api/postApi";

import { ProductCard } from "../components/UI/ProductCard";
import "../components/css/products.css";

const ITEMS_PER_PAGE = 16;

export const Products = () => {
  /* ------------------ UI State ------------------ */
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSort, setActiveSort] = useState(null);

  const [showCategories, setShowCategories] = useState(false);
  const [showPrice, setShowPrice] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  /* ------------------ Products Query ------------------ */
  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products", activeCategory],
    queryFn: () =>
      activeCategory
        ? getProductsByCategory(activeCategory)
        : getAllProducts(),
    staleTime: Infinity,
    gcTime: Infinity,
    keepPreviousData: true,
  });

  /* ------------------ Categories Query ------------------ */
  const {
    data: categories = [],
    isLoading: isCategoryLoading,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: getAllCategories,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  /* ------------------ Debounce Search ------------------ */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  /* ------------------ Handlers ------------------ */
  const handleCategoryFilter = (category) => {
    setActiveCategory(category);
    setActiveSort(null);
    setCurrentPage(1);
    setShowCategories(false);
  };

  const handlePriceSort = (type) => {
    setActiveSort(type);
    setActiveCategory(null);
    setCurrentPage(1);
    setShowPrice(false);
  };

  const clearFilters = () => {
    setActiveCategory(null);
    setActiveSort(null);
    setSearchTerm("");
    setCurrentPage(1);
    setShowCategories(false);
    setShowPrice(false);
  };

  /* ------------------ Filter + Sort ------------------ */
  let filteredProducts = [...products];

  filteredProducts = filteredProducts.filter((product) =>
    product.title.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  if (activeSort) {
    filteredProducts.sort((a, b) =>
      activeSort === "low-high" ? a.price - b.price : b.price - a.price
    );
  }

  /* ------------------ Pagination ------------------ */
  const totalPages = Math.ceil(
    filteredProducts.length / ITEMS_PER_PAGE
  );

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  /* ------------------ Loading & Error ------------------ */
  if (isLoading) return <p>Loading products...</p>;
  if (isError) return <p>{error.message}</p>;

  /* ------------------ Render ------------------ */
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
                setShowCategories((prev) => !prev);
                setShowPrice(false);
              }}
              style={activeCategory ? { background: '#1a1a1a', color: 'white' } : {}}
            >
              {activeCategory ? `Category: ${categories.find(c => c.slug === activeCategory)?.name || activeCategory}` : "Categories"} <span>{showCategories ? "−" : "+"}</span>
            </button>

            {showCategories && (
              <div className="filter-content">
                {isCategoryLoading ? (
                  <p>Loading...</p>
                ) : (
                  categories.map((category) => (
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
                  ))
                )}
              </div>
            )}
          </div>

          {/* Price */}
          <div className="filter-block">
            <button
              className="filter-toggle"
              onClick={() => {
                setShowPrice((prev) => !prev);
                setShowCategories(false);
              }}
              style={activeSort ? { background: '#1a1a1a', color: 'white' } : {}}
            >
              {activeSort ? (activeSort === "low-high" ? "Sort: Low → High" : "Sort: High → Low") : "Sort by Price"} <span>{showPrice ? "−" : "+"}</span>
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

          <button onClick={clearFilters} className="filter-clear">
            Clear Filters
          </button>
        </div>

        {/* Products */}
        <div className="products-grid">
          {paginatedProducts.length > 0 ? (
            paginatedProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))
          ) : (
            <p>No products found.</p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`pagination-btn ${
                  currentPage === i + 1 ? "active" : ""
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}

      </div>
    </section>
  );
};