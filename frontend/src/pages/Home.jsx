import React from "react";
import { HeroSection } from "../components/UI/HeroSection";
import { CategoriesSection } from "../components/UI/CategoriesSection";
import { FeaturedProducts } from "../components/UI/FeaturedProducts";
import { TestimonialsSection } from "../components/UI/TestimonialsSection";

export const Home = () => {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
      <TestimonialsSection />
    </>
  );
};