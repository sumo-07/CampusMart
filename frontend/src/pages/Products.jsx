import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

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
  if (isLoading) return <div className="loading-container"><p>Discovering best products for you...</p></div>;
  if (isError) return <p>{error.message}</p>;

  /* ------------------ Motion Variants ------------------ */
  const gridVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  /* ------------------ Render ------------------ */
  return (
    <section className="section-products">
      <div className="container products-container">

        {/* Search */}
        <motion.div 
            className="products-search"
            variants={{
                initial: { opacity: 0, y: -15 },
                animate: { opacity: 1, y: 0 }
            }}
        >
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </motion.div>

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

            <AnimatePresence>
                {showCategories && (
                <motion.div 
                    className="filter-content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    {isCategoryLoading ? (
                    <p>Loading...</p>
                    ) : (
                    categories.map((category) => (
                        <motion.button
                            key={category.slug}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
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
                        </motion.button>
                    ))
                    )}
                </motion.div>
                )}
            </AnimatePresence>
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

            <AnimatePresence>
                {showPrice && (
                <motion.div 
                    className="filter-content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePriceSort("low-high")}
                    className={
                        activeSort === "low-high"
                        ? "filter-btn active"
                        : "filter-btn"
                    }
                    >
                    Low → High
                    </motion.button>

                    <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePriceSort("high-low")}
                    className={
                        activeSort === "high-low"
                        ? "filter-btn active"
                        : "filter-btn"
                    }
                    >
                    High → Low
                    </motion.button>
                </motion.div>
                )}
            </AnimatePresence>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearFilters} 
            className="filter-clear"
          >
            Clear Filters
          </motion.button>
        </div>

        {/* Products */}
        <motion.div 
            className="products-grid"
            variants={gridVariants}
            key={currentPage + activeCategory + activeSort} // Key to re-trigger animation
        >
          {paginatedProducts.length > 0 ? (
            paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <motion.p variants={{ initial: { opacity: 0 }, animate: { opacity: 1 } }}>No products found.</motion.p>
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div 
            className="pagination"
            variants={{ initial: { opacity: 0 }, animate: { opacity: 1 } }}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </motion.button>

            {Array.from({ length: totalPages }, (_, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`pagination-btn ${
                  currentPage === i + 1 ? "active" : ""
                }`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </motion.button>
            ))}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </motion.button>
          </motion.div>
        )}

      </div>
    </section>
  );
};