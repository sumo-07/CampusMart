import React, { useState, useEffect } from "react";
import { FaCheck, FaExclamationTriangle, FaInfoCircle, FaTimes } from "react-icons/fa";
import "../css/neoFeedback.css";

export const NeoToast = ({ toast, onClose, duration = 4000 }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!toast) {
      setIsExiting(false);
      return;
    }

    setIsExiting(false);

    // Auto dismiss after duration
    const dismissTimer = setTimeout(() => {
      setIsExiting(true);
      const removeTimer = setTimeout(() => {
        onClose?.();
      }, 250); // match neoToastSlideOut animation duration
      return () => clearTimeout(removeTimer);
    }, duration);

    return () => clearTimeout(dismissTimer);
  }, [toast, duration, onClose]);

  if (!toast) return null;

  const handleManualClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.();
    }, 250);
  };

  const getBadgeIcon = () => {
    switch (toast.type) {
      case "error":
        return <FaExclamationTriangle />;
      case "info":
        return <FaInfoCircle />;
      case "success":
      default:
        return <FaCheck />;
    }
  };

  return (
    <div className="neo-toast-container" aria-live="polite">
      <div
        className={`neo-toast-item ${toast.type || "success"} ${isExiting ? "exiting" : ""}`}
        role={toast.type === "error" ? "alert" : "status"}
      >
        <div className="neo-toast-badge">{getBadgeIcon()}</div>
        <div className="neo-toast-content">
          {toast.title && <h4 className="neo-toast-title">{toast.title}</h4>}
          <p className="neo-toast-message">{toast.message || toast.text}</p>
        </div>
        <button
          type="button"
          className="neo-toast-close-btn"
          onClick={handleManualClose}
          aria-label="Close notification"
        >
          <FaTimes />
        </button>
        <div
          className="neo-toast-progress"
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};
