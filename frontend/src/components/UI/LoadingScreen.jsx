import React from "react";

/**
 * Premium Neobrutalist Loading Screen for Cartsy
 * Designed to look bold, tactile, and responsive across mobile, iPad, and desktop.
 */
export const LoadingScreen = ({
    badge = "⚡ SYSTEM SYNC",
    badgeColor = "yellow",
    title = "LOADING DASHBOARD...",
    subtitle = "Syncing real-time store metrics, inventory, and order streams...",
    minHeight = "70vh",
    icon = "🛒",
    statusText = "Connecting to live database...",
}) => {
    return (
        <div className="neo-loading-wrapper" style={{ minHeight }}>
            <div className="neo-loading-card">
                {/* Bouncing Neo Icon */}
                <div className="neo-loading-icon-box">
                    <span className="neo-loading-emoji" role="img" aria-label="loading">
                        {icon}
                    </span>
                </div>

                {/* Status Pill Badge */}
                <div style={{ marginTop: "0.85rem" }}>
                    <span className={`neo-badge ${badgeColor}`}>
                        {badge}
                    </span>
                </div>

                {/* Main Heading */}
                <h2 className="neo-loading-title">
                    {title}
                </h2>

                {/* Subtitle Lore */}
                <p className="neo-loading-subtitle">
                    {subtitle}
                </p>

                {/* Neobrutalist Animated Striped Progress Bar */}
                <div className="neo-loading-progress-track" aria-hidden="true">
                    <div className="neo-loading-progress-bar" />
                </div>

                {/* Micro Status Hint */}
                <div className="neo-loading-status-pill">
                    <span className="neo-status-pulse" />
                    {statusText}
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
