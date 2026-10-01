import React, { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import "../components/css/legalPolicy.css";

const POLICIES = [
  { id: "terms", label: "📋 Terms of Service", path: "/terms" },
  { id: "privacy", label: "🔒 Privacy Policy", path: "/privacy" },
  { id: "refund", label: "💸 Refund & Cancellation", path: "/refund-policy" },
  { id: "shipping", label: "🚚 Shipping & Delivery", path: "/shipping-policy" },
];

export const LegalPolicy = ({ initialPolicy = "terms" }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active policy from pathname or prop
  const currentPath = location.pathname.toLowerCase();
  let activePolicy = initialPolicy;
  if (currentPath.includes("privacy")) activePolicy = "privacy";
  else if (currentPath.includes("refund") || currentPath.includes("cancellation")) activePolicy = "refund";
  else if (currentPath.includes("shipping") || currentPath.includes("delivery")) activePolicy = "shipping";
  else if (currentPath.includes("terms")) activePolicy = "terms";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activePolicy]);

  const handleTabClick = (path) => {
    navigate(path);
  };

  return (
    <section className="section-legal">
      <div className="container">
        {/* Header Banner */}
        <div className="legal-header">
          <div className="neo-badge yellow">📜 TRUST & LEGAL COMPLIANCE</div>
          <h1 className="legal-title">POLICIES & GUIDELINES</h1>
          <p className="legal-subtitle">
            Transparent, zero-cap guidelines governing your orders, data privacy, payments via Razorpay, and deliveries at Cartsy.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="legal-tabs-wrapper" role="tablist">
          {POLICIES.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={activePolicy === p.id}
              className={`legal-tab-btn ${activePolicy === p.id ? "active" : ""}`}
              onClick={() => handleTabClick(p.path)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Main Content Card */}
        <div className="legal-card">
          <div className="legal-meta-bar">
            <div>
              <span>Platform: </span>
              <strong>Cartsy E-Commerce</strong>
            </div>
            <div className="legal-effective-badge">
              <span>📅 Last Updated: October 2026</span>
            </div>
          </div>

          {/* =========================================================
              1. TERMS OF SERVICE
              ========================================================= */}
          {activePolicy === "terms" && (
            <div className="legal-body">
              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">1</span>
                  Acceptance of Terms
                </h2>
                <p>
                  Welcome to <strong>Cartsy</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By browsing, accessing, registering an account, or placing an order on our platform (including <a href="https://cartsy-ecom.vercel.app">cartsy-ecom.vercel.app</a> and associated mobile interfaces), you explicitly agree to comply with and be bound by these Terms of Service.
                </p>
                <p>
                  If you disagree with any portion of these terms, please refrain from using our services. We reserve the right to revise or update these terms at our sole discretion. Continued use of Cartsy constitutes acceptance of revised terms.
                </p>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">2</span>
                  Eligibility & User Accounts
                </h2>
                <p>
                  To place an order or create an account on Cartsy, you must be at least 18 years of age or possess the legal capacity to enter into binding contracts under the Indian Contract Act, 1872. You agree to provide accurate, truthful, and updated contact and delivery credentials during registration and checkout.
                </p>
                <p>
                  You are solely responsible for safeguarding your login credentials, passwords, and one-time passcodes (OTP). Any activity conducted under your authenticated account remains your sole legal responsibility.
                </p>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">3</span>
                  Product Catalog, Pricing & Availability
                </h2>
                <p>
                  All products, descriptions, specs, and pricing displayed on Cartsy are subject to continuous updates and availability. While we strive for absolute accuracy in pricing and drop stock counts, errors may inadvertently occur.
                </p>
                <div className="legal-callout">
                  <div className="legal-callout-icon">💡</div>
                  <div className="legal-callout-content">
                    <strong>Currency & Pricing Transparency</strong>
                    All prices displayed on Cartsy are listed in <strong>Indian Rupees (INR / ₹)</strong> and are inclusive of applicable Goods and Services Tax (GST) unless explicitly noted at checkout.
                  </div>
                </div>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">4</span>
                  Payments & Razorpay Gateway Integration
                </h2>
                <p>
                  Cartsy utilizes <strong>Razorpay Software Private Limited</strong> as our licensed, authorized third-party payment gateway provider to securely facilitate transactions including UPI, Debit Cards, Credit Cards, Net Banking, and digital wallets.
                </p>
                <div className="legal-callout green">
                  <div className="legal-callout-icon">🔒</div>
                  <div className="legal-callout-content">
                    <strong>Payment Security & Compliance</strong>
                    We do not store your sensitive financial information (such as CVVs, full card numbers, or UPI PINs) on our servers. All transactions are encrypted under 128-bit SSL/TLS and processed directly within PCI-DSS Level 1 compliant infrastructure operated by Razorpay.
                  </div>
                </div>
                <p>
                  In the event of an erroneous double deduction or payment failure where funds were deducted without an order being generated, funds are automatically reversed by Razorpay within 24 to 48 hours according to banking settlement schedules.
                </p>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">5</span>
                  Prohibited Activities
                </h2>
                <p>While using Cartsy, users are strictly prohibited from:</p>
                <ul>
                  <li>Using fraudulent payment methods, stolen credit cards, or unauthorized UPI handles.</li>
                  <li>Circumventing site security, rate limits, or automated data extraction (scraping).</li>
                  <li>Impersonating any individual, entity, or administrator.</li>
                  <li>Engaging in intentional abuse of promotional voucher codes or order returns.</li>
                </ul>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">6</span>
                  Governing Law & Dispute Resolution
                </h2>
                <p>
                  These Terms and any individual purchase contracts shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes, claims, or controversies arising out of or related to these terms shall be subject to the exclusive jurisdiction of the competent courts located in Gurugram / New Delhi, India.
                </p>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">7</span>
                  Customer Support & Official Contact
                </h2>
                <div className="legal-contact-card">
                  <div className="legal-contact-item">
                    <label>Legal Entity</label>
                    <span>Cartsy Commerce Online</span>
                  </div>
                  <div className="legal-contact-item">
                    <label>Support Desk</label>
                    <a href="mailto:support.cartsy07@gmail.com">support.cartsy07@gmail.com</a>
                  </div>
                  {/* <div className="legal-contact-item">
                    <label>Helpline</label>
                    <a href="tel:+919876543210">+91 98765 43210</a>
                  </div> */}
                  <div className="legal-contact-item">
                    <label>Operating Hours</label>
                    <span>Mon - Sat (9:00 AM - 6:00 PM IST)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              2. PRIVACY POLICY
              ========================================================= */}
          {activePolicy === "privacy" && (
            <div className="legal-body">
              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">1</span>
                  Overview & Commitment
                </h2>
                <p>
                  At <strong>Cartsy</strong>, we deeply respect your right to privacy. This Privacy Policy outlines our transparent policies regarding the collection, processing, storage, and protection of personal data in strict compliance with the Information Technology Act, 2000, and the Digital Personal Data Protection (DPDP) Act of India.
                </p>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">2</span>
                  Information We Collect
                </h2>
                <p>When you interact with Cartsy, we collect only the necessary data required to process orders and improve your shopping experience:</p>
                <ul>
                  <li><strong>Account Information:</strong> Your full name, email address, contact phone number, and hashed password.</li>
                  <li><strong>Delivery & Shipping Details:</strong> Delivery recipient name, street address, apartment/flat number, postal pincode, city, and state.</li>
                  <li><strong>Transaction Records:</strong> Razorpay order ID, payment ID, transaction status, item line values, and timestamps. (We never view or store complete card credentials or bank PINs).</li>
                  <li><strong>Device & Browsing Metadata:</strong> IP address, browser type, device resolution, and session cookies for cart persistence and fraud prevention.</li>
                </ul>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">3</span>
                  How We Use Your Data
                </h2>
                <p>Your data is used strictly for legitimate business and transactional purposes:</p>
                <ul>
                  <li>Order fulfillment, real-time shipment dispatch, and invoice generation.</li>
                  <li>Sending automated order confirmations, delivery updates, and tracking numbers.</li>
                  <li>Facilitating secure online payments and refund settlements via Razorpay.</li>
                  <li>Preventing unauthorized logins, abuse, and fraudulent transactions.</li>
                  <li>Providing prompt customer support when you reach out via our contact channels.</li>
                </ul>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">4</span>
                  Data Sharing & Third Parties
                </h2>
                <p>
                  <strong>We do not sell, rent, or trade your personal data to advertisers.</strong> We share your information solely with essential service partners under strict confidentiality:
                </p>
                <ul>
                  <li><strong>Payment Gateway:</strong> Razorpay Software Private Limited for authenticating and settling transactions.</li>
                  <li><strong>Logistics Partners:</strong> Reliable courier and courier aggregation services to deliver your physical parcels.</li>
                  <li><strong>Legal Compliance:</strong> Government or regulatory authorities only when mandated by valid legal process or court order.</li>
                </ul>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">5</span>
                  Data Storage & Security Measures
                </h2>
                <p>
                  All database communications use secure Transport Layer Security (TLS 1.3) protocols. Authentication tokens are digitally signed with industry-standard cryptographic algorithms. We employ strict access control so only authorized personnel can access customer records.
                </p>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">6</span>
                  Your Rights & Grievance Redressal
                </h2>
                <p>
                  You have the right to request access to, rectify, or delete your personal account data at any time by contacting our Grievance Officer at <a href="mailto:support.cartsy07@gmail.com">support.cartsy07@gmail.com</a>. All privacy requests are acknowledged within 24 hours.
                </p>
              </div>
            </div>
          )}

          {/* =========================================================
              3. CANCELLATION & REFUND POLICY (STRICT RAZORPAY REQUIREMENT)
              ========================================================= */}
          {activePolicy === "refund" && (
            <div className="legal-body">
              <div className="legal-callout pink">
                <div className="legal-callout-icon">💸</div>
                <div className="legal-callout-content">
                  <strong>Clear & Guaranteed Refund Policy</strong>
                  Under Razorpay compliance guidelines and our customer-first policy, approved refunds are initiated directly to your original payment method (Bank / UPI / Card) within <strong>5 to 7 business days</strong>.
                </div>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">1</span>
                  Order Cancellation
                </h2>
                <p>
                  <strong>Can I cancel my order?</strong> Yes! You can cancel your order before it has been processed and handed over to our courier partner.
                </p>
                <ul>
                  <li><strong>Before Dispatch:</strong> Visit <Link to="/orders"><strong>Past Drops (Orders)</strong></Link> and click &quot;Cancel Order&quot;, or email <a href="mailto:support.cartsy07@gmail.com">support.cartsy07@gmail.com</a> with your Order ID. 100% full refund will be initiated immediately.</li>
                  <li><strong>After Dispatch:</strong> Once an order is shipped with a tracking number assigned, it cannot be intercepted in transit. You may refuse delivery upon arrival or request a return after delivery.</li>
                </ul>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">2</span>
                  Return & Replacement Window
                </h2>
                <p>
                  We offer a hassle-free <strong>7-Day Return / Replacement Policy</strong> from the date of delivery under the following conditions:
                </p>
                <ul>
                  <li>The product arrived physically damaged, broken, or defective.</li>
                  <li>The product received differs significantly from the description, size, or variant ordered.</li>
                  <li>Key accessories or components are missing from the package.</li>
                </ul>
                <p>
                  <em>Note: Returned merchandise must be in original, unwashed, and unused condition with all original tags, boxes, and packaging intact.</em>
                </p>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">3</span>
                  How to Initiate a Return / Refund
                </h2>
                <ol>
                  <li>Contact our support team within 7 days of receiving the package via our <Link to="/contact"><strong>Contact Page</strong></Link> or by emailing <a href="mailto:support.cartsy07@gmail.com">support.cartsy07@gmail.com</a>.</li>
                  <li>Provide your <strong>Order ID</strong> along with clear photos or an unboxing video showing the defect or damage.</li>
                  <li>Our support team will verify the claim and arrange for a courier reverse pickup or direct replacement within 24 to 48 business hours.</li>
                </ol>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">4</span>
                  Refund Processing & Timelines
                </h2>
                <p>
                  Once the return is received at our fulfillment hub and inspected (or immediately upon pre-dispatch cancellation):
                </p>
                <ul>
                  <li>The refund is initiated electronically via <strong>Razorpay</strong>.</li>
                  <li><strong>Online Payments (UPI, Cards, Net Banking):</strong> Credited back to the original source account within <strong>5 to 7 business days</strong> (depending on your bank&apos;s settlement schedule).</li>
                  <li><strong>COD Orders (if applicable):</strong> Refunded via direct bank account transfer (NEFT/IMPS) or UPI to the details provided by the customer.</li>
                </ul>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">5</span>
                  Non-Returnable Items
                </h2>
                <p>For health, safety, and hygiene reasons, the following items are non-returnable unless received defective or expired:</p>
                <ul>
                  <li>Personal care, grooming products, and cosmetics.</li>
                  <li>Innerwear, socks, and intimate apparel.</li>
                  <li>Customized or personalized items.</li>
                </ul>
              </div>
            </div>
          )}

          {/* =========================================================
              4. SHIPPING & DELIVERY POLICY (STRICT RAZORPAY REQUIREMENT)
              ========================================================= */}
          {activePolicy === "shipping" && (
            <div className="legal-body">
              <div className="legal-callout green">
                <div className="legal-callout-icon">🚚</div>
                <div className="legal-callout-content">
                  <strong>Pan-India Fast Shipping</strong>
                  Cartsy delivers across all serviceable Indian pincodes. Real-time courier tracking numbers are generated upon dispatch and sent via email/SMS.
                </div>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">1</span>
                  Processing & Dispatch Time
                </h2>
                <p>
                  All confirmed orders are processed, quality-checked, and packaged within <strong>24 to 48 business hours</strong> (excluding Sundays and national public holidays).
                </p>
                <p>
                  You will receive an automated shipping notification with your tracking details as soon as the package leaves our warehouse.
                </p>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">2</span>
                  Estimated Delivery Timelines
                </h2>
                <p>Delivery time depends on your delivery address and location tier:</p>
                <ul>
                  <li><strong>Metro Cities (Delhi NCR, Mumbai, Bengaluru, etc.):</strong> 2 to 4 business days.</li>
                  <li><strong>Tier 2 & Tier 3 Cities:</strong> 4 to 6 business days.</li>
                  <li><strong>Remote / Northeast / Island Territories:</strong> 5 to 8 business days.</li>
                </ul>
                <p>
                  <em>Note: Natural weather disruptions, festivals, or local authority restrictions may occasionally affect transit times.</em>
                </p>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">3</span>
                  Shipping Charges & Rates
                </h2>
                <p>
                  We keep shipping simple and honest:
                </p>
                <ul>
                  <li><strong>Orders ₹499 and above:</strong> 100% <strong>FREE SHIPPING</strong> Pan-India.</li>
                  <li><strong>Orders below ₹499:</strong> Flat nominal shipping fee of <strong>₹49</strong> applied transparently at checkout before payment.</li>
                  <li>Zero hidden charges or surprise delivery fees at the doorstep.</li>
                </ul>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">4</span>
                  Live Shipment Tracking
                </h2>
                <p>
                  You can track your package every step of the journey directly inside Cartsy. Go to <Link to="/orders"><strong>Past Drops (Orders)</strong></Link> on our website to view active shipping progress, courier partner info, and estimated arrival day.
                </p>
              </div>

              <div className="legal-section-block">
                <h2 className="legal-section-heading">
                  <span className="sec-num">5</span>
                  Damaged or Tampered Parcels
                </h2>
                <p>
                  If you notice that the outer parcel packaging is visibly torn, open, or damaged upon delivery, please <strong>do not accept the package</strong> and ask the courier to mark it as damaged. Alternatively, take unboxing photos and reach out to us at <a href="mailto:support.cartsy07@gmail.com">support.cartsy07@gmail.com</a> within 48 hours for an instant free replacement.
                </p>
              </div>
            </div>
          )}

          {/* Bottom Help Desk Prompt */}
          <div style={{ marginTop: "2.5rem", textAlign: "center", paddingTop: "1.5rem", borderTop: "2px dashed #E5E7EB" }}>
            <p style={{ fontWeight: 700, color: "var(--neo-border)", marginBottom: "0.5rem" }}>
              Have questions about your order, payments, or returns?
            </p>
            <Link to="/contact" className="legal-tab-btn" style={{ textDecoration: "none", background: "var(--neo-yellow)" }}>
              💬 Contact Support Squad
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LegalPolicy;
