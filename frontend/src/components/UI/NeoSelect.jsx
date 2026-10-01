import React, { useState, useRef, useEffect } from "react";
import "../css/neoSelect.css";

export const NeoSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "-- Select --",
  className = "",
  style = {},
  disabled = false,
  size = "md", // "sm" | "md" | "lg"
  fullWidth = false,
  alignRight = false,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize options to [{ value, label, isAction, sticky, icon, className }] format
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        value: opt.value,
        label: opt.label !== undefined ? opt.label : String(opt.value),
        icon: opt.icon,
        isAction: opt.isAction,
        sticky: opt.sticky || (opt.isAction ? "top" : undefined),
        className: opt.className,
      };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Partition options for pinned sections
  const topStickyOptions = normalizedOptions.filter((opt) => opt.sticky === "top");
  const bottomStickyOptions = normalizedOptions.filter((opt) => opt.sticky === "bottom");
  const scrollableOptions = normalizedOptions.filter(
    (opt) => opt.sticky !== "top" && opt.sticky !== "bottom"
  );

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optValue) => {
    if (onChange) {
      onChange(optValue);
    }
    setIsOpen(false);
  };

  const renderOption = (opt) => {
    const isSelected = selectedOption && String(selectedOption.value) === String(opt.value);
    return (
      <button
        key={String(opt.value)}
        type="button"
        role="option"
        aria-selected={isSelected}
        onClick={() => handleSelect(opt.value)}
        className={`neo-select-option ${isSelected ? "selected" : ""} ${opt.isAction ? "is-action" : ""} ${opt.sticky ? `sticky-${opt.sticky}` : ""} ${opt.className || ""}`}
      >
        <span className="neo-select-option-label">
          {opt.icon && <span>{opt.icon}</span>}
          <span>{opt.label}</span>
        </span>
        {isSelected && <span className="neo-select-check">✓</span>}
      </button>
    );
  };

  return (
    <div
      ref={containerRef}
      id={id}
      style={style}
      className={`neo-select-container size-${size} ${fullWidth ? "full-width" : ""} ${alignRight ? "align-right" : ""} ${className}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`neo-select-trigger ${isOpen ? "open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="neo-select-value">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span>{selectedOption.icon}</span>}
              <span>{selectedOption.label}</span>
            </>
          ) : (
            <span className="neo-select-placeholder">{placeholder}</span>
          )}
        </span>
        <span className={`neo-select-arrow ${isOpen ? "open" : ""}`}>▼</span>
      </button>

      {isOpen && (
        <div className="neo-select-dropdown" role="listbox">
          {topStickyOptions.length > 0 && (
            <div className="neo-select-pinned-top">
              {topStickyOptions.map(renderOption)}
            </div>
          )}

          <div className="neo-select-options-scroll">
            {scrollableOptions.map(renderOption)}
          </div>

          {bottomStickyOptions.length > 0 && (
            <div className="neo-select-pinned-bottom">
              {bottomStickyOptions.map(renderOption)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
