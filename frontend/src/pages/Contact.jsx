import { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axiosConfig";
import "../components/css/contact.css";

export const Contact = () => {
  const { user } = useContext(AuthContext);

  const contactContentRef = useRef(null);
  const lastScrollTime = useRef(0);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFieldInteraction = (e) => {
    // Avoid triggering when clicking submit/reset buttons
    const tagName = e.target.tagName?.toLowerCase();
    if (tagName === "button") return;

    const now = Date.now();
    // Throttle slightly so rapid clicks or tabbing don't stutter animation
    if (now - lastScrollTime.current > 1200) {
      lastScrollTime.current = now;
      if (contactContentRef.current) {
        contactContentRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  // Automatically pre-fill name and email if user is logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!formData.name.trim()) {
      setErrorMessage("Please enter your full name");
      return;
    }
    if (!formData.email.trim()) {
      setErrorMessage("Please enter your email address");
      return;
    }
    if (!formData.message.trim()) {
      setErrorMessage("Please enter your message or question");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/contact", formData);
      setSuccessMessage(
        res.data?.message ||
          "Your message has been sent successfully! Our support squad will review it shortly."
      );
      setFormData((prev) => ({
        ...prev,
        phone: "",
        subject: "General Inquiry",
        message: "",
      }));
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to send your message. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  return (
    <section className="section-contact">
      <div className="container contact-container">
        {/* Page Header */}
        <div className="contact-header">
          <div className="neo-badge pink">☎️ HIT OUR LINE</div>
          <h1 className="contact-title">DON'T BE A STRANGER</h1>
          <p className="contact-subtitle">
            Need drop updates, got sizing doubts, or wanna sell your own drip on Cartsy? Hit us up. We don't leave homies on read.
          </p>
        </div>

        {/* Contact Content */}
        <div className="contact-content" ref={contactContentRef}>
          {/* Left Side - Map */}
          <div className="contact-map-card">
            <div className="contact-map-badge">CARTSY CENTRAL HQ 📍</div>
            <div className="contact-map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14028.618641150495!2d77.08537549427329!3d28.490807664654948!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d193855555555%3A0x6e8e2b8c9c05d7b5!2sCyber%20City%2C%20Gurugram!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Cartsy HQ Location"
              ></iframe>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="contact-form">
            {successMessage ? (
              <div className="contact-success-card">
                <div className="contact-success-icon">✅</div>
                <h3 className="contact-success-title">Message Received!</h3>
                <p className="contact-success-text">{successMessage}</p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="form-btn form-btn-primary"
                  style={{ maxWidth: "260px", margin: "0 auto" }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                onFocusCapture={handleFieldInteraction}
                onClickCapture={handleFieldInteraction}
              >
                {errorMessage && (
                  <div className="contact-alert-error">
                    <span>⚠️</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="contact-form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

                <div className="contact-form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Topic / Subject</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Order & Delivery Support">Order & Delivery Support</option>
                      <option value="Product & Listing Assistance">Product & Listing Assistance</option>
                      <option value="Account & Login Help">Account & Login Help</option>
                      <option value="Feedback / Bug Report">Feedback / Bug Report</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="3"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can our support team help you out?"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="form-btn form-btn-primary"
                >
                  {loading ? "Sending Message..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};