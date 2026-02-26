import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getAllProducts,
  getAllCategories,
  getProductsByCategory,
} from "../api/postApi";

import { ProductCard } from "../components/UI/ProductCard";
import "../components/css/products.css";

export const Products = () => {
  /* ------------------ UI State ------------------ */
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSort, setActiveSort] = useState(null);

  const [showCategories, setShowCategories] = useState(false);
  const [showPrice, setShowPrice] = useState(false);

  /* ------------------ Products Query (STATIC → INFINITE CACHE) ------------------ */
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

  /* ------------------ Categories Query (STATIC → INFINITE CACHE) ------------------ */
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
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  /* ------------------ Category Filter ------------------ */
  const handleCategoryFilter = (category) => {
    setActiveCategory(category);
    setActiveSort(null);
    setShowCategories(false);
  };

  /* ------------------ Price Sort ------------------ */
  const handlePriceSort = (type) => {
    setActiveSort(type);
    setActiveCategory(null);
    setShowPrice(false);
  };

  /* ------------------ Clear Filters ------------------ */
  const clearFilters = () => {
    setActiveCategory(null);
    setActiveSort(null);
    setSearchTerm("");
    setShowCategories(false);
    setShowPrice(false);
  };

  /* ------------------ Derived Products ------------------ */
  let finalProducts = [...products];

  // Search
  finalProducts = finalProducts.filter((product) =>
    product.title.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  // Sort
  if (activeSort) {
    finalProducts.sort((a, b) =>
      activeSort === "low-high" ? a.price - b.price : b.price - a.price
    );
  }

  /* ------------------ Loading & Error UI ------------------ */
  if (isLoading) {
    return <p>Loading products...</p>;
  }

  if (isError) {
    return <p>Error loading products: {error.message}</p>;
  }

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
            >
              Categories <span>{showCategories ? "−" : "+"}</span>
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
            >
              Sort by Price <span>{showPrice ? "−" : "+"}</span>
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
          {finalProducts.length > 0 ? (
            finalProducts.map((product) => (
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