# 🛒 Cartsy (CampusMart) — Campus E-Commerce Platform

A production-grade, full-stack, neobrutalist e-commerce platform designed and built specifically for campus communities. Powered by **React 19**, **Three.js**, **Node.js**, **Express 5**, **MongoDB**, **Razorpay**, **Google Gmail API (OAuth 2.0)**, **Nodemailer**, **Cloudinary**, and **Discord Webhooks**.

🌐 **Live Storefront**: [https://cartsy-ecom.vercel.app](https://cartsy-ecom.vercel.app)  
📌 **Project Status**: **Production Ready / Active Deployment**

---

## 📊 Current Project Status

| Area | Status | Details |
|---|---|---|
| **Frontend Deployment** | 🟢 Live | Hosted on **Vercel** ([cartsy-ecom.vercel.app](https://cartsy-ecom.vercel.app)) with fast global CDN delivery. |
| **Backend Architecture** | 🟢 Active | Express 5 REST API with MongoDB Atlas cluster and IPv4-first DNS resolution for cloud hosting. |
| **Email Infrastructure** | 🟢 Live (Dual) | **Google Gmail API (OAuth 2.0)** active as default via HTTPS; **Nodemailer SMTP** preserved for custom business domains. |
| **Payments Gateway** | 🟢 Verified | **Razorpay** checkout integration with cryptographic webhook/signature verification and COD support. |
| **Media & Assets** | 🟢 Cloudinary | In-memory buffer streaming with auto WebP/AVIF formatting and orphan asset cleanup. |
| **Notifications** | 🟢 Discord Suite | 3 dedicated webhooks for Real-Time Orders, Low/Out-of-Stock inventory, and Customer Support queries. |
| **Design System** | 🟢 Neobrutalist | Custom Vanilla CSS design tokens with tactile drop shadows, bold borders, Google Fonts, and mobile responsiveness. |

---

## 🌟 Features Overview

### 🛍️ Storefront & Product Catalog
- **Interactive Catalog**: Real-time multi-field search, category filtering, dynamic price sorting, and responsive pagination.
- **Product Details & Gallery**: High-resolution image displays, interactive thumbnail carousel, live stock count, specs breakdown, and add-to-cart controls with instant stock ceiling enforcement.
- **Stock Urgency Indicators**: Dynamic warning badges (`⚠️ Only X left in stock - Don't get cooked!`) to boost conversion.
- **Automated Catalog Seeder**: Includes safe catalog synchronization and seeding via DummyJSON API with image fallbacks (`npm run seed`).

### 🎨 3D Graphics & Neobrutalist UI
- **Three.js & React Three Fiber**: Interactive 3D objects and canvas scenes embedded seamlessly into the storefront.
- **Framer Motion Micro-Interactions**: Smooth state transitions, interactive card hovers, loading skeletons, and notification toasts.
- **Neobrutalist Aesthetic**: High-contrast `#0A0A0A` borders, solid tactile drop shadows (`box-shadow: 4px 4px 0px #0A0A0A`), vibrant color pills, custom scrollbars, and responsive mobile-first layouts.

### 🛒 Cart & Checkout Experience
- **Synchronized Cart**: Persistent cart state backed by MongoDB for authenticated users and local state fallback for guests.
- **Real-Time Stock Validation**: Prevents overselling by validating live warehouse inventory before placing orders.
- **Dual Payment Methods**:
  - **Cash on Delivery (COD)**: Instant order confirmation with automatic stock deduction and verification.
  - **Razorpay Online Payments**: Seamless checkout with cryptographic signature verification (`crypto.createHmac`), retry payment capability for unpaid orders, and 10-day auto-cleanup of expired pending checkouts.

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

### 📧 Dual-Provider Automated Email System
All transactional emails feature responsive HTML, Neobrutalist branding, and accessible plain-text fallbacks:
1. **Order Confirmation Receipt**: Itemized receipt with order breakdown, pricing, delivery address, and tracking link.
2. **Order Status Updates**: Real-time notification when orders transition to `Processing`, `Shipped`, `Delivered`, or `Cancelled`.
3. **Welcome Email**: Sent automatically on initial student registration and first-time Google sign-in.
4. **Admin New Order Alert**: Sent immediately to store admin upon confirmed COD or paid Razorpay orders.
5. **Password Reset Request & Success Emails**: High-security emails with action buttons and security advisories.

> **Provider Flexibility**: Features a zero-downtime provider switch via `EMAIL_PROVIDER=gmail_api` vs `EMAIL_PROVIDER=nodemailer`.
> - **Gmail API (OAuth 2.0)**: Active default. Bypasses cloud host SMTP/port 587 blocks (e.g. Render, Railway, Koyeb) using HTTPS API calls.
> - **Nodemailer SMTP**: Fully preserved for custom business domain SMTP setup (SendGrid, Amazon SES, Postmark, Mailgun, etc.).

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
- **Admin Preview Mode**: Visual indicator and direct "Manage in Admin Dashboard" quick-action on product details pages.
- **Order Management & Detail Inspection**: Track orders, view payment status, update delivery milestones, inspect customer details, and trigger customer status update emails with modal confirmations.
- **Contact Query Backup**: All contact inquiries are safely stored in MongoDB (`Contact` model) with status toggles (`Pending` / `Resolved` / `Archived`).

### 📜 Legal & Compliance Pages
Dedicated campus-compliant policy pages covering all student consumer rights:
- `/terms`: Terms of Service & acceptable usage
- `/privacy`: Data privacy & cookie policies
- `/refund-policy` & `/cancellation-refund`: Refund terms & return window
- `/shipping-policy`: Campus doorstep delivery timeline & guidelines

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite 7
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Animations**: Framer Motion
- **Data Fetching**: TanStack React Query v5
- **Routing**: React Router DOM v7
- **Authentication**: `@react-oauth/google`
- **Styling**: Vanilla CSS with Neobrutalist Design System

### Backend
- **Runtime**: Node.js + Express 5
- **Database**: MongoDB via Mongoose 9
- **Authentication**: JSON Web Token (`jsonwebtoken`), Bcrypt.js, Cookie Parser, Google Auth Library
- **Payments**: Razorpay Node SDK (`razorpay`)
- **Email Delivery (Dual Architecture)**:
  - **Google Gmail API** via `googleapis` (OAuth 2.0 with auto token refresh) — **Default**
  - **Nodemailer 10** (SMTP / Custom Domain Mailer) — **Preserved**
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
│   ├── scripts/            # Diagnostic & test scripts (testGmailApi, testEmail, etc.)
│   ├── services/           # External services (Cloudinary, Catalog Seeder)
│   ├── utils/              # Email service (dispatch switch) & Discord webhook service
│   │   └── gmail/          # Dedicated Gmail API modules (gmailAuth.js, gmailSender.js)
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

### Backend Configuration (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/campusmart
JWT_SECRET=your_jwt_super_secret_key
URL=http://localhost:5173
CLIENT_URL=http://localhost:5173

# Razorpay Payments
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Cloudinary (Product Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google Sign-In (Frontend Customer Authentication)
GOOGLE_CLIENT_ID=your_google_signin_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_signin_client_secret

# -------------------------------------------------------------
# EMAIL PROVIDER SWITCH ('gmail_api' vs 'nodemailer')
# -------------------------------------------------------------
EMAIL_PROVIDER=gmail_api

# 1. Google Gmail API (OAuth 2.0) — Active Default
GMAIL_CLIENT_ID=your_gmail_mailer_client_id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_gmail_mailer_client_secret
GMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground
GMAIL_REFRESH_TOKEN=your_oauth_refresh_token
GMAIL_FROM_NAME=Cartsy
GMAIL_FROM_EMAIL=your_store_email@gmail.com

# 2. Nodemailer / SMTP (Preserved for Custom Business Domain Mailers)
EMAIL_SERVICE=gmail
EMAIL_USER=your_store_email@gmail.com
EMAIL_PASS=your_16_character_app_password
EMAIL_FROM="Cartsy <your_store_email@gmail.com>"
ADMIN_EMAIL=your_admin_inbox@gmail.com

# Discord Webhooks (Optional but Recommended)
DISCORD_STOCK_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_ORDER_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_CONTACT_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### Frontend Configuration (`frontend/.env`)

```env
VITE_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_signin_client_id.apps.googleusercontent.com
```

---

## 📬 Email Provider Guide: Gmail API vs. Nodemailer

Cartsy implements a **dual-provider email architecture** managed by the `EMAIL_PROVIDER` environment variable.

### Option A: Using Google Gmail API (OAuth 2.0) — Active Default

#### Why Gmail API?
- **Cloud-Ready**: Cloud hosting providers (Render, Railway, Koyeb, Vercel, AWS EC2) frequently block outbound SMTP ports (`25`, `465`, `587`) or hit `ENETUNREACH` network errors. The Gmail API sends messages over standard HTTPS (`port 443`), making it 100% reliable anywhere.
- **High Security**: Uses OAuth 2.0 tokens rather than storing static passwords on servers.

#### Setup Instructions:
1. **Google Cloud Console**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/) and open your project.
   - Navigate to **APIs & Services > Library**, search for **Gmail API**, and click **Enable**.
   - Navigate to **APIs & Services > OAuth consent screen > Scopes**:
     - Click **Add or Remove Scopes**.
     - Add `https://www.googleapis.com/auth/gmail.send` (or `https://mail.google.com/`) and save.
   - Under **Test users**, add your store email (e.g. `your_store_email@gmail.com`).
2. **Create OAuth Client ID**:
   - Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
   - Application Type: **Web application**.
   - Add Authorized redirect URI: `https://developers.google.com/oauthplayground`.
   - Copy the Client ID & Secret to `backend/.env`:
     ```env
     GMAIL_CLIENT_ID=your_client_id.apps.googleusercontent.com
     GMAIL_CLIENT_SECRET=your_client_secret
     ```
3. **Generate Refresh Token**:
   Run the interactive helper in the `backend/` directory:
   ```bash
   cd backend
   npm run auth:gmail
   ```
   - Open the generated link in your browser.
   - Log in with your store Gmail.
   - **Crucial**: Check the permission box (**☑ "Send email on your behalf"** or **☑ "Read, compose, send, and permanently delete all your email from Gmail"**).
   - Copy the authorization code and paste it back into your terminal.
   - The script will automatically save `GMAIL_REFRESH_TOKEN` to your `backend/.env`.
4. **Test Delivery**:
   ```bash
   node scripts/testGmailApi.js your_personal_email@gmail.com
   ```

---

### Option B: Enabling Nodemailer (SMTP / Custom Domain)

The Nodemailer integration is 100% preserved and ready to use whenever you set up a custom business domain (e.g., `orders@yourdomain.com`) or want standard SMTP.

#### How to Switch to Nodemailer:
1. Open `backend/.env` and change `EMAIL_PROVIDER`:
   ```env
   EMAIL_PROVIDER=nodemailer
   ```
2. Configure your SMTP credentials in `backend/.env`:
   - **For Gmail App Password**:
     ```env
     EMAIL_SERVICE=gmail
     EMAIL_USER=your_email@gmail.com
     EMAIL_PASS=your_16_character_google_app_password
     EMAIL_FROM="Cartsy <your_email@gmail.com>"
     ```
   - **For Custom SMTP (SendGrid, Amazon SES, Mailgun, Postmark, etc.)**:
     ```env
     EMAIL_SERVICE=custom
     SMTP_HOST=smtp.sendgrid.net
     SMTP_PORT=587
     EMAIL_USER=apikey
     EMAIL_PASS=your_sendgrid_api_key
     EMAIL_FROM="Cartsy <support@yourdomain.com>"
     ```
3. **Test Delivery**:
   ```bash
   node scripts/testEmail.js your_personal_email@gmail.com
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

The `backend/scripts/` directory provides standalone diagnostic scripts to verify integrations without triggering live user flows:

| Command | Purpose |
|---|---|
| `npm run auth:gmail` | Interactive Google OAuth2 helper to authorize & generate `GMAIL_REFRESH_TOKEN`. |
| `node backend/scripts/testGmailApi.js [email]` | Verifies Gmail API OAuth scopes and sends a test order receipt. |
| `node backend/scripts/testEmail.js [email]` | Verifies Nodemailer SMTP connectivity and sends a test order receipt. |
| `node backend/scripts/testWelcomeEmail.js` | Previews and verifies the student welcome email template. |
| `node backend/scripts/testPasswordResetEmail.js` | Previews and tests the OTP/Reset link password reset email. |
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
- Allows administrators to view details, update statuses, and quick-reply directly to students.

### 5. ⭐ Verified Product Reviews & Ratings
- Allow verified student buyers to post authentic product reviews and 1–5 star ratings.
- Display "Verified Campus Buyer" trust badges.
- Include aggregate rating distribution bars, photo reviews, and community feedback on product detail pages.

---

## 📜 License

This project is licensed under the [ISC License](LICENSE).
