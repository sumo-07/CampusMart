import React, { useEffect } from "react";
import { FaTimes, FaExchangeAlt, FaSpinner, FaBoxOpen, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import "../css/neoFeedback.css";

export const NeoStatusConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  currentStatus = "Pending",
  newStatus = "Pending",
  orderId = "",
  loading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      } else if (e.key === "Enter" && !loading && !e.shiftKey) {
        // Prevent accidental triggers if active element is a button (it will trigger naturally)
        if (document.activeElement?.tagName !== "BUTTON") {
          onConfirm();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose, onConfirm]);

  if (!isOpen) return null;

  const isCancelled = newStatus === "Cancelled";
  const isDelivered = newStatus === "Delivered";
  const isShipped = newStatus === "Shipped";
  const isProcessing = newStatus === "Processing";

  const getStatusNotice = () => {
    if (isCancelled) {
      return {
        type: "warning",
        icon: <FaExclamationTriangle style={{ marginRight: 6 }} />,
        text: "Cancelling will restock reserved items back into catalog inventory and update payment status.",
      };
    }
    if (isDelivered) {
      return {
        type: "success",
        icon: <FaCheckCircle style={{ marginRight: 6 }} />,
        text: "Delivered status confirms the customer has received their items. This marks fulfillment as complete.",
      };
    }
    if (isShipped) {
      return {
        type: "info",
        icon: <FaBoxOpen style={{ marginRight: 6 }} />,
        text: "Shipped status informs the customer that their package is in transit with the courier.",
      };
    }
    if (isProcessing) {
      return {
        type: "info",
        icon: <FaBoxOpen style={{ marginRight: 6 }} />,
        text: "Processing status indicates the order has been acknowledged and is being packaged for dispatch.",
      };
    }
    return {
      type: "info",
      icon: null,
      text: `Order status will be updated from "${currentStatus}" to "${newStatus}".`,
    };
  };

  const notice = getStatusNotice();

  return (
    <div className="neo-confirm-overlay" onClick={loading ? undefined : onClose}>
      <div
        className="neo-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="neo-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="neo-confirm-header">
          <div className="neo-confirm-title-wrap">
            <div className="neo-confirm-icon-badge">
              <FaExchangeAlt />
            </div>
            <h3 id="neo-confirm-title" className="neo-confirm-title">
              Update Order Status
            </h3>
          </div>
          <button
            type="button"
            className="neo-confirm-close-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="neo-confirm-body">
          <p className="neo-confirm-prompt">
            Are you sure you want to change the status for
            {orderId && (
              <span className="neo-confirm-order-ref" title={orderId}>
                #{orderId.length > 8 ? orderId.slice(-8) : orderId}
              </span>
            )}
            ?
          </p>

          {/* Status Flow Badges */}
          <div className="neo-confirm-status-flow">
            <span className="neo-confirm-pill from">
              {currentStatus}
            </span>
            <span className="neo-confirm-arrow">➔</span>
            <span className={`neo-confirm-pill to ${newStatus.toLowerCase()}`}>
              {newStatus}
            </span>
          </div>

          {/* Context Notice */}
          <div className={`neo-confirm-note ${notice.type}`}>
            {notice.icon}
            {notice.text}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="neo-confirm-footer">
          <button
            type="button"
            className="neo-confirm-btn cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`neo-confirm-btn confirm ${isCancelled ? "is-cancelled" : ""}`}
            onClick={onConfirm}
            disabled={loading}
            autoFocus
          >
            {loading ? (
              <>
                <FaSpinner className="neo-spin" />
                Updating...
              </>
            ) : (
              `Confirm ${newStatus}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
