import { useEffect, useLayoutEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import {
  getAllProducts,
  getAllCategories,
  getProductsByCategory,
} from "../api/postApi";

import { ProductCard } from "../components/UI/ProductCard";
import "../components/css/products.css";

const ITEMS_PER_PAGE = 16;

export const Products = () => {
  /* ------------------ Search & Modal State ------------------ */
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || null;

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  /* ------------------ Handlers ------------------ */
  const handleCategoryFilter = (category) => {
    setSearchParams({ category });
    setActiveSort(null);
    setCurrentPage(1);
    setShowCategories(false);
  };

  const handlePriceSort = (type) => {
    setActiveSort(type);
    setCurrentPage(1);
    setShowPrice(false);
  };

  const clearFilters = () => {
    setSearchParams({});
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

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);

    // If switching to the last page (where fewer items cause document collapse),
    // immediately reset scroll to top of page so the browser doesn't clamp to footer
    if (newPage === totalPages) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  };

  useLayoutEffect(() => {
    if (currentPage === totalPages && totalPages > 1) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [currentPage, totalPages]);





  const getPaginationRange = (current, total, isMobile = false) => {
    if (total <= 1) return [];

    if (isMobile) {
      if (total <= 4) {
        return Array.from({ length: total }, (_, i) => i + 1);
      }
      if (current <= 2) {
        return [1, 2, "...", total];
      }
      if (current >= total - 1) {
        return [1, "...", total - 1, total];
      }
      return [1, "...", current, "...", total];
    }

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, "...", total];
    }

    if (current >= total - 3) {
      return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, "...", current - 1, current, current + 1, "...", total];
  };

  const desktopPageRange = getPaginationRange(currentPage, totalPages, false);
  const mobilePageRange = getPaginationRange(currentPage, totalPages, true);


  /* ------------------ Loading & Error ------------------ */
  if (isLoading) return (
    <div className="section-products">
      <div className="container" style={{ textAlign: "center", padding: "5rem 0" }}>
        <div className="products-empty-state">
          <h2>🍳 Cooking up catalog drops...</h2>
        </div>
      </div>
    </div>
  );
  
  if (isError) return (
    <div className="section-products">
      <div className="container" style={{ textAlign: "center", padding: "5rem 0" }}>
        <div className="products-empty-state">
          <h2>⚠️ Major L: {error.message}</h2>
          <button onClick={clearFilters} className="btn btn-primary" style={{ marginTop: "1rem" }}>Retry</button>
        </div>
      </div>
    </div>
  );

  /* ------------------ Render ------------------ */
  return (
    <section className="section-products">
      <div className="container products-container">

        {/* Section Header */}
        <div className="products-page-header">
          <div className="neo-badge yellow">⚡ THE FULL CATALOG</div>
          <h1 className="products-page-title">ALL THE DRIP</h1>
          <p className="products-page-subtitle">
            Search, filter, and cop trending drip, aesthetic fits, room essentials & everyday gear.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="products-controls-bar">
          <div className="products-search">
            <span className="search-symbol">🔍</span>
            <input
              type="text"
              placeholder="Search for drip, gadgets, room fits, sneakers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm("")} 
                className="clear-search-btn"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="products-filters">
            {/* Categories */}
            <div className="filter-block">
              <button
                className={`filter-toggle ${activeCategory ? "active-filter" : ""}`}
                onClick={() => {
                  setShowCategories((prev) => !prev);
                  setShowPrice(false);
                }}
              >
                <span>{activeCategory ? `Drop: ${categories.find(c => c.slug === activeCategory)?.name || activeCategory}` : "Categories ⚡"}</span>
                <span className="filter-arrow">{showCategories ? "▲" : "▼"}</span>
              </button>

              {showCategories && (
                <div className="filter-content">
                  {isCategoryLoading ? (
                    <p style={{ padding: '8px', fontWeight: 600 }}>Loading...</p>
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
                className={`filter-toggle ${activeSort ? "active-filter" : ""}`}
                onClick={() => {
                  setShowPrice((prev) => !prev);
                  setShowCategories(false);
                }}
              >
                <span>{activeSort ? (activeSort === "low-high" ? "Price: Low → High" : "Price: High → Low") : "Price Check 💸"}</span>
                <span className="filter-arrow">{showPrice ? "▲" : "▼"}</span>
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

            {(activeCategory || activeSort || searchTerm) && (
              <button onClick={clearFilters} className="filter-clear">
                ✕ Reset All
              </button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {paginatedProducts.length > 0 ? (
            paginatedProducts.map((product) => (
              <ProductCard 
                key={product._id || product.id} 
                product={product} 
              />
            ))
          ) : (
            <div className="products-empty-state">
              <h3>No drip found matching that bestie 💀</h3>
              <p>Try searching something else or reset your filters.</p>
              <button onClick={clearFilters} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Wipe Filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <nav className="pagination" aria-label="Catalog Pagination">
              <button
                type="button"
                className="pagination-btn nav"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                aria-label="Go to previous page"
              >
                ← Prev
              </button>

              {/* Desktop range (up to 7 items with ellipsis) */}
              <div className="pagination-numbers pagination-numbers-desktop">
                {desktopPageRange.map((item, idx) =>
                  item === "..." ? (
                    <span key={`desk-ellipsis-${idx}`} className="pagination-ellipsis" aria-hidden="true">
                      …
                    </span>
                  ) : (
                    <button
                      key={`desk-page-${item}`}
                      type="button"
                      className={`pagination-btn ${currentPage === item ? "active" : ""}`}
                      onClick={() => handlePageChange(item)}
                      aria-label={`Go to page ${item}`}
                      aria-current={currentPage === item ? "page" : undefined}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              {/* Mobile range (compact window with ellipsis) */}
              <div className="pagination-numbers pagination-numbers-mobile">
                {mobilePageRange.map((item, idx) =>
                  item === "..." ? (
                    <span key={`mob-ellipsis-${idx}`} className="pagination-ellipsis" aria-hidden="true">
                      …
                    </span>
                  ) : (
                    <button
                      key={`mob-page-${item}`}
                      type="button"
                      className={`pagination-btn ${currentPage === item ? "active" : ""}`}
                      onClick={() => handlePageChange(item)}
                      aria-label={`Go to page ${item}`}
                      aria-current={currentPage === item ? "page" : undefined}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                className="pagination-btn nav"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                aria-label="Go to next page"
              >
                Next →
              </button>
            </nav>

            <div className="pagination-info">
              Showing <strong>{startIndex + 1}</strong>–<strong>{Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length)}</strong> of <strong>{filteredProducts.length}</strong> drops • Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </div>
          </div>
        )}


      </div>

    </section>
  );
};