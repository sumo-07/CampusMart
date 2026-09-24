import React from "react";
import { NavLink } from "react-router-dom";
import '../css/heroSection.css';

export const HeroSection = () => {
  return (
    <>
      <section className="hero">
        <span className="stamp">certified everyday essential 💯</span>
        
        <h1>your whole setup<br />has no drip</h1>
        
        <p className="sub">
          we fixed it. room aesthetics, gadgets, fits — everything, shipped straight to your doorstep before you even check your feed.
        </p>
        
        <div className="btnrow">
          <NavLink to="/product" className="hero-btn-primary">
            shop now fr fr
          </NavLink>
          <NavLink to="/about" className="hero-btn-secondary">
            nah just browsing
          </NavLink>
        </div>
        
        <div className="chat-row">
          <div className="bubble">
            "bro the lamp actually slaps"
            <small>— Ujjawal, Verified Buyer</small>
          </div>
          <div className="bubble p2">
            "delivery was faster than my attention span 💀"
            <small>— Priyanshu, Trendsetter</small>
          </div>
          <div className="bubble p3">
            "no notes. 10/10 would cop again"
            <small>— Aditi, Creator</small>
          </div>
        </div>
      </section>

      {/* Marquee Ticker Bar */}
      <div className="marquee-ticker">
        <div className="marquee-content">
          <span>🔥 FRESH HYPED DROPS</span>
          <span>•</span>
          <span>⚡ INSTANT UPI & COD</span>
          <span>•</span>
          <span>🛍️ SECURE THE BAG</span>
          <span>•</span>
          <span>🎯 NO CAP FR FR</span>
          <span>•</span>
          <span>📦 LIGHTNING DOORSTEP DELIVERY</span>
          <span>•</span>
          <span>👑 MAXIMUM AURA GAINS</span>
          <span>•</span>
          <span>🔥 FRESH HYPED DROPS</span>
          <span>•</span>
          <span>⚡ INSTANT UPI & COD</span>
          <span>•</span>
          <span>🛍️ SECURE THE BAG</span>
          <span>•</span>
          <span>🎯 NO CAP FR FR</span>
          <span>•</span>
          <span>📦 LIGHTNING DOORSTEP DELIVERY</span>
          <span>•</span>
          <span>👑 MAXIMUM AURA GAINS</span>
        </div>
      </div>
    </>
  );
};