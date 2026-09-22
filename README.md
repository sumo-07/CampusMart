# 🛒 CampusMart — Campus E-Commerce Platform

A modern, full-stack, cyber-glassmorphic e-commerce platform built specifically for campus communities. Powered by **React 19**, **Three.js**, **Node.js**, **Express**, **MongoDB**, **Razorpay**, **Nodemailer**, and **Discord Webhooks**.

---

## 🌟 Features Overview

### 🛍️ Storefront & Product Catalog
- **Interactive Catalog**: Real-time search, category filtering, price range sorting, and pagination.
- **Product Details & Gallery**: High-resolution image displays, stock counters, specs breakdown, and add-to-cart controls with instant stock ceiling enforcement.
- **Automated Catalog Seeder**: Includes safe catalog synchronization and seeding via DummyJSON API with image fallbacks (`npm run seed`).

### 🎨 3D Graphics & Cyber-Glassmorphic UI
- **Three.js & React Three Fiber**: Interactive 3D objects and canvas scenes embedded seamlessly into the modern storefront.
- **Framer Motion Micro-Interactions**: Smooth state transitions, interactive card hovers, loading skeletons, and notification toasts.
- **Tailored Neon & Cyber Aesthetic**: Glassmorphism with neon accents, custom scrollbars, and responsive mobile-first layouts.

### 🛒 Cart & Checkout Experience
- **Synchronized Cart**: Persistent cart state backed by MongoDB for authenticated users and local state for guests.
- **Real-Time Stock Validation**: Prevents overselling by checking live warehouse inventory before placing orders.
- **Dual Payment Methods**:
  - **Cash on Delivery (COD)**: Instant order confirmation with automatic stock deduction and verification.
  - **Razorpay Online Payments**: Seamless checkout with cryptographic signature verification, retry payment capability for unpaid orders, and 10-day auto-cleanup of expired pending checkouts.

### 🔐 Authentication & Account Security
- **JWT + HTTP-Only Cookies**: Secure authentication flow with token cookies and fallback authorization headers.
- **Google OAuth 2.0**: One-click Google Single Sign-On (SSO) for student accounts (`@react-oauth/google`).
- **Signup Password Strength Meter**: Real-time evaluation (Weak, Medium, Strong) with visual progress bar.
- **Unified Password Visibility Toggle**: Single eye button that reveals or masks both Password and Confirm Password simultaneously.

### 🔑 Two-Step Password Reset Flow
- **Dual-Mode 15-Minute Expiry**:
  - **Mode A (6-digit OTP)**: Cryptographically random OTP (`crypto.randomInt`) hashed with SHA-256 in MongoDB.
  - **Mode B (One-Click Reset Link)**: Secure 32-byte cryptographic token (`crypto.randomBytes`) for instant reset.
- **Two-Step Verification**: Verifies token/OTP first before rendering password inputs to prevent unauthorized tampering.
- **Masked OTP Field**: Secure `type="password"` input with dot rendering to prevent shoulder surfing.
- **Post-Reset Confirmation**: Instant security confirmation email with 1-click emergency reset if unauthorized.

### 📧 Automated Nodemailer Email Lifecycle
All emails are crafted with responsive HTML, cyber-glassmorphic branding, and plain-text fallbacks:
1. **Order Confirmation Receipt**: Itemized receipt with order breakdown, pricing, delivery address, and tracking link.
2. **Order Status Updates**: Real-time notification when orders transition to `Processing`, `Shipped`, `Delivered`, or `Cancelled`.
3. **Welcome Email**: Sent automatically on initial student registration and first-time Google sign-in.
4. **Admin New Order Alert**: Sent immediately to store admin upon confirmed COD or paid Razorpay orders.
5. **Password Reset Request & Success Emails**: High-security emails with action buttons and security advisories.

### 💬 Discord Real-Time Webhook Suite
Separate dedicated Discord webhooks for instant notifications without inbox clutter:
- ⚠️ **Inventory Alerts (`DISCORD_STOCK_WEBHOOK_URL`)**: Fires rich 3x2 embed cards for **Low Stock (< 3 units)** and **Out-of-Stock (0 units)** with direct Admin Restock shortcuts.
- 📦 **Order Alerts (`DISCORD_ORDER_WEBHOOK_URL`)**: Dispatches itemized order embeds for confirmed COD and paid Razorpay orders.
- 📬 **Customer Inquiries (`DISCORD_CONTACT_WEBHOOK_URL`)**: Forwards `/contact` submissions from students or guests with a 1-click `mailto:` direct reply button and inquiry ID.

### ☁️ Cloudinary Asset & Media Management
- **In-Memory Buffer Streaming**: Uses `multer.memoryStorage()` combined with Cloudinary's `upload_stream` to upload product images directly to cloud storage without saving temporary files to the server's disk.
- **Auto-Formatting & Compression**: Automatically applies `fetch_format: "auto"` and `quality: "auto"` for next-gen formats (WebP/AVIF) and optimized file sizes for fast loading across campus networks.
- **Automated Orphan Asset Cleanup**: Whenever an administrator uploads a replacement image or deletes a product, `deleteCloudinaryImage()` triggers `cloudinary.uploader.destroy()` to remove the old asset, preventing orphaned files and conserving cloud storage.
- **Seamless Dual-Source Handling**: Supports switching back and forth between Cloudinary-uploaded media and catalog-seeded URLs without data loss.

### 🛡️ Admin Dashboard & Query Management
- **Catalog Management**: Add, edit, and delete products, select categories, update pricing, and adjust inventory levels.
- **Cloudinary Image Uploads**: Upload product images directly to Cloudinary with automatic deletion of replaced assets.
- **Order Management**: Track orders, view payment status, update delivery milestones, and inspect customer details.
- **Contact Query Backup**: All contact inquiries are safely stored in MongoDB (`Contact` model) with status toggles (`Pending` / `Resolved` / `Archived`).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite 7
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Animations**: Framer Motion
- **Data Fetching**: TanStack React Query v5
- **Routing**: React Router DOM v7
- **Authentication**: `@react-oauth/google`
- **Styling**: Custom Vanilla CSS with Cyber-Glassmorphic Design System

### Backend
- **Runtime**: Node.js + Express 5
- **Database**: MongoDB via Mongoose 9
- **Authentication**: JSON Web Token (`jsonwebtoken`), Bcrypt.js, Cookie Parser
- **Payments**: Razorpay Node SDK (`razorpay`)
- **Email Delivery**: Nodemailer 10 (Gmail SMTP or Custom SMTP)
- **Image Storage**: Cloudinary SDK + Multer
- **Webhooks**: Discord Webhooks API (Native `fetch`)

---

## 📁 Project Structure

```text
campusMart/
├── backend/
│   ├── config/             # Database connection (db.js)
│   ├── controllers/        # Request handlers (auth, product, cart, order, contact)
│   ├── middleware/         # Auth & admin route guards, error handlers
│   ├── models/             # Mongoose schemas (User, Product, Order, Contact)
│   ├── routes/             # Express API routes
│   ├── scripts/            # Standalone diagnostic test scripts
│   ├── services/           # External services (Cloudinary, Catalog Seeder)
│   ├── utils/              # Email service (Nodemailer) & Discord webhook service
│   ├── .env.example        # Backend environment template
│   ├── package.json        # Backend dependencies & scripts
│   └── server.js           # Server entry point
│
├── frontend/
│   ├── public/             # Static public assets
│   ├── src/
│   │   ├── api/            # Axios instance and API configuration
│   │   ├── components/     # Reusable UI components, 3D Canvas, Navbar, Footer
│   │   │   └── css/        # Component-level styling & animations
│   │   ├── context/        # React contexts (AuthContext, CartContext)
│   │   ├── pages/          # Application views (Home, Products, Checkout, Admin, etc.)
│   │   ├── App.jsx         # Route declarations
│   │   └── main.jsx        # App mounting & React Query provider
│   ├── .env.example        # Frontend environment template
│   ├── package.json        # Frontend dependencies & scripts
│   └── vite.config.js      # Vite bundler configuration
│
└── README.md               # Project documentation
```

---

## ⚙️ Environment Configuration

### 1. Backend Configuration (`backend/.env`)
Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/campusmart
JWT_SECRET=your_jwt_super_secret_key
URL=http://localhost:5173

# Razorpay Payments
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Cloudinary (Product Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

# Nodemailer Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_google_app_password
EMAIL_FROM="CampusMart <your_email@gmail.com>"
ADMIN_EMAIL=your_admin_inbox@gmail.com

# Discord Webhooks (Optional but Recommended)
DISCORD_STOCK_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_ORDER_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_CONTACT_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### 2. Frontend Configuration (`frontend/.env`)
Create a `.env` file inside the `frontend/` directory:

```env
VITE_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster)
- [Git](https://git-scm.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/sumo-07/CampusMart.git
cd CampusMart
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 3. Seed Product Catalog (Optional)
Populate your database with sample campus products from DummyJSON:
```bash
cd ../backend
npm run seed
```

### 4. Run Development Servers

**Start Backend (Port 5000):**
```bash
cd backend
npm run dev
```

**Start Frontend (Port 5173):**
```bash
cd frontend
npm run dev
```

Open your browser and visit: **`http://localhost:5173`**

---

## 🧪 Diagnostic & Testing Scripts

The `backend/scripts/` directory provides standalone scripts to verify integrations without triggering live user flows:

| Command | Purpose |
|---|---|
| `node backend/scripts/testEmail.js` | Verifies SMTP credentials and sends a test order receipt. |
| `node backend/scripts/testWelcomeEmail.js` | Previews and verifies the student welcome email template. |
| `node backend/scripts/testPasswordResetSuccessEmail.js` | Previews the password reset confirmation email. |
| `node backend/scripts/testAdminOrderAlertEmail.js` | Tests the itemized admin order alert email. |
| `node backend/scripts/testDiscordAlert.js` | Dispatches sample Low Stock and Out-of-Stock embeds to Discord. |
| `node backend/scripts/testDiscordOrderAlert.js` | Dispatches a sample New Order notification embed to Discord. |
| `node backend/scripts/testDiscordContactAlert.js` | Dispatches a sample Student Support Inquiry embed to Discord. |

---

## 📡 API Overview

| Method | Endpoint | Access | Description |
|---|---|---|---|
| **POST** | `/api/auth/signup` | Public | Register new account & dispatch welcome email |
| **POST** | `/api/auth/login` | Public | Standard login with JWT cookie |
| **POST** | `/api/auth/google` | Public | Google OAuth SSO login / signup |
| **POST** | `/api/auth/forgot-password` | Public | Request 6-digit OTP & 1-click reset link |
| **POST** | `/api/auth/verify-reset-code` | Public | Verify OTP or token validity |
| **POST** | `/api/auth/reset-password` | Public | Set new password & dispatch confirmation email |
| **GET** | `/api/products` | Public | Get products with search, filter, and pagination |
| **GET** | `/api/products/:id` | Public | Get single product details |
| **POST** | `/api/products` | Admin | Create product with Cloudinary image |
| **PUT** | `/api/products/:id` | Admin | Update product details and stock |
| **DELETE** | `/api/products/:id` | Admin | Delete product |
| **GET** | `/api/cart` | Private | Fetch user's persistent cart |
| **POST** | `/api/cart` | Private | Add item to cart |
| **POST** | `/api/orders` | Private | Create order (COD or Razorpay init) |
| **POST** | `/api/orders/razorpay/verify` | Private | Verify Razorpay payment signature & confirm order |
| **GET** | `/api/orders/myorders` | Private | List current user's order history |
| **GET** | `/api/orders` | Admin | List all store orders |
| **PUT** | `/api/orders/:id/status` | Admin | Update delivery milestone & notify customer |
| **POST** | `/api/contact` | Public | Submit customer inquiry (Discord + MongoDB) |
| **GET** | `/api/contact` | Admin | View all customer queries |
| **PATCH** | `/api/contact/:id/status` | Admin | Update query status (`Pending`/`Resolved`) |

---

## 🔮 Future Scope & Roadmap

Here are the key upcoming enhancements planned for CampusMart:

### 1. 🛡️ API Rate Limiting (Highest Priority)
- Implement robust rate limiting (using `express-rate-limit` / Redis token bucket) across sensitive endpoints:
  - **Authentication Endpoints** (`/api/auth/login`, `/api/auth/signup`): Guard against brute-force attacks and credential stuffing.
  - **Password Reset** (`/api/auth/forgot-password`): Throttling to prevent OTP enumeration and email-bombing abuse.
  - **Contact Submissions** (`/api/contact`): Prevent spam bots from flooding Discord channels and the database.
  - **Order Creation** (`/api/orders`): Prevent rapid-fire bot requests.

### 2. 🛒 Guest Cart with Automatic Login Merging
- Allow non-logged-in visitors to browse the catalog and add items directly to a local shopping cart (persisted in `localStorage`).
- **Seamless Merge on Login**: When the student logs in or registers, their guest cart items and quantities will automatically sync and append into their persistent MongoDB database cart without losing any selections.

### 3. 🤖 AI-Powered Auto Cart Generation via Chat Prompt
- Introduce a natural-language "Smart Cart Generator" where students can describe what they need:
  - *Example prompt:* `"I have 4 friends coming over to my dorm tonight for a movie. Get me snacks, soft drinks, and popcorn."*
  - *Example prompt:* `"Exam week is starting tomorrow, need stationery and late-night study coffee."*
- The AI parses the prompt, matches relevant products from the store catalog, automatically populates the cart with recommended quantities, and presents a 1-click checkout summary.

### 4. 📋 Dedicated Admin Queries Dashboard (Contact Submissions)
- Add a dedicated **"Queries"** tab directly in the Admin Dashboard (`/admin?tab=queries`).
- Display all customer inquiries collected from `/contact` (`name`, `email`, `phone`, `subject`, `message`, timestamps, and linked student accounts).
- Allows administrators to:
  - View full inquiry details with student order history.
  - Mark inquiries as `Completed` / `Resolved` or keep them as `Pending`.
  - Quick-reply directly to students without switching windows.

### 5. ⭐ Verified Product Reviews & Ratings
- Allow verified student buyers to post authentic product reviews and 1–5 star ratings.
- Display "Verified Campus Buyer" trust badges.
- Include aggregate rating distribution bars, photo reviews, and community feedback on product detail pages.

---

## 📜 License

This project is licensed under the [ISC License](LICENSE).
