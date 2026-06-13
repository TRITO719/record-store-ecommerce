# Classic Records — Frontend

Single-page application for **Classic Records**, an e-commerce platform for vinyl records, CDs, and music merchandise. Built with React 19, Vite 8, Redux Toolkit, and Tailwind CSS 4.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Features](#4-features)
5. [State Management](#5-state-management)
6. [API Integration](#6-api-integration)
7. [Folder Structure](#7-folder-structure)
8. [Environment Variables](#8-environment-variables)
9. [Running Locally](#9-running-locally)
10. [Build & Deployment](#10-build--deployment)
11. [Scripts](#11-scripts)
12. [Future Improvements](#12-future-improvements)

---

## 1. Project Overview

Classic Records is a full-featured record store storefront and admin panel where:

**Customers can:**
- Browse vinyl records, CDs, and merchandise with search, sort, and filter
- View detailed product pages with stock awareness
- Add products to a persistent shopping cart with quantity control
- Checkout with form validation (supports guest and authenticated users)
- Register/login with OTP email verification
- View order history, manage addresses, and update profiles
- Toggle between light and dark themes
- Chat with an AI assistant that can search products and add items to cart

**Admins can:**
- Manage products (CRUD with image upload)
- Manage orders (view, update status)
- Manage users (list, role management)
- View analytics dashboards with interactive charts (revenue, orders, products, users, inventory)
- Export statistics data to CSV/Excel

**Target audience:** Music enthusiasts in Vietnam looking for vinyl records, CDs, and music merchandise. The UI is bilingual (Vietnamese labels, English product content).

---

## 2. Tech Stack

| Category             | Technology                                                          |
| -------------------- | ------------------------------------------------------------------- |
| **UI Library**       | React 19 (with React DOM 19)                                       |
| **Language**          | TypeScript 6.x (strict mode, ES2023 target)                       |
| **Build Tool**       | Vite 8 (`@vitejs/plugin-react`)                                   |
| **Styling**          | Tailwind CSS 4 (Vite plugin) + CSS custom properties design system |
| **State Management** | Redux Toolkit 2 + React-Redux 9                                   |
| **Routing**          | React Router DOM 7 (BrowserRouter)                                 |
| **HTTP Client**      | Axios 1.14 (with interceptors)                                    |
| **Charts**           | Recharts 2.15 (LineChart, BarChart, PieChart, AreaChart)           |
| **Icons**            | Lucide React + React Icons (Font Awesome subset)                   |
| **Notifications**    | React Hot Toast 2.6                                                |
| **Fonts**            | Google Fonts: Inter, Plus Jakarta Sans, DM Sans                    |
| **Linting**          | ESLint 9 + typescript-eslint + react-hooks + react-refresh         |
| **Deployment**       | Docker (multi-stage: Node builder → Nginx)                         |

---

## 3. Frontend Architecture

### Architectural Layers

The frontend follows a **layered component architecture** with unidirectional data flow:

```
                    ┌────────────────────────────────┐
                    │         React Router           │
                    │    (App.tsx — route config)     │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │          Layouts               │
                    │  MainLayout / AdminLayout      │
                    │  (shell: navbar, footer,       │
                    │   sidebar, outlet)             │
                    └───────────────┬────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │           Pages                │
                    │  (route-level components)      │
                    │  Home, Cart, Checkout, etc.    │
                    └───────────────┬────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
┌──────────────────┐   ┌──────────────────┐     ┌──────────────────┐
│   Components     │   │    Redux Store   │     │    Contexts      │
│  (reusable UI)   │   │ (global state)   │     │ (scoped state)   │
│  ProductCard,    │   │ cartSlice        │     │ ThemeContext      │
│  Navbar, Footer  │   │ productSlice     │     │ AccountContext    │
│  ChatBot, etc.   │   │ userSlice        │     │                  │
└──────────────────┘   └────────┬─────────┘     └──────────────────┘
                                │
                    ┌───────────▼────────────────┐
                    │     Services (API Layer)   │
                    │   Axios instance with      │
                    │   interceptors, retry,     │
                    │   auto-logout              │
                    └───────────────┬────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │       Backend REST API         │
                    │     (Express + PostgreSQL)     │
                    └────────────────────────────────┘
```

### Data Flow

1. **App bootstrap** → `main.tsx` initializes Redux Provider, ThemeProvider, and subscribes to cart state changes for localStorage persistence.
2. **Product fetch** → `App.tsx` dispatches `fetchProducts()` on mount via `createAsyncThunk`, populating the global store.
3. **User interaction** → Components dispatch Redux actions (e.g., `addToCart`, `login`) or call the API service directly.
4. **API calls** → The Axios instance injects auth tokens, handles retries, and auto-logs out on 401.
5. **State updates** → Redux reducers update slices → React re-renders connected components.
6. **Persistence** → Cart state and user sessions are synchronized to `localStorage` on every change.

### Key Design Decisions

- **Dual session architecture** — User and admin sessions are stored separately (`token`/`user` vs `admin_token`/`admin_user`) to prevent conflicts when admin opens the storefront in another tab.
- **CSS design system over utility-only** — A full design token system (CSS custom properties for colors, radii, shadows, fonts) is defined in `index.css`, providing theme-aware styling across both Tailwind and inline styles.
- **Context for local state, Redux for global** — Redux manages the three cross-cutting concerns (cart, products, auth). React Context handles theme toggling and account page state that doesn't need to be globally shared.

---

## 4. Features

### Customer Features

#### Product Browsing & Search
- **Home page** with hero banner carousel (5 slides, auto-play, pause on hover), category cards, trending section, featured collections, and promotional banner
- **Category pages** (Vinyl, CD, Merch) with search, sort (featured/price/alphabetical), and filter bars
- **Product detail page** with full-size image, stock display, quantity selector, and add-to-cart
- **Instant search** in navbar with product suggestions (title + artist matching, max 6 results)
- **Intersection Observer** scroll-triggered fade-up animations on the home page

#### Shopping Cart
- **Persistent cart** — survives page refreshes via localStorage + Redux subscription
- **Quick-add modal** — select quantity before adding, with real-time stock and in-cart quantity checks
- **Cart page** — quantity adjustment, item removal, item selection for partial checkout
- **Stock validation** — prevents adding items beyond available stock (`maxAddable = stock − inCartQty`)
- **Wishlist toggle** (UI-only, heart icon on product cards)

#### Checkout
- **Guest and authenticated checkout** — autofills name, email, phone, address from user profile when logged in
- **Selective checkout** — choose which cart items to include in the order (passed via React Router state)
- **Form validation** — email regex, Vietnamese phone number pattern (`0|+84` prefix), required fields
- **Post-checkout** — clears cart, refreshes product stock, syncs profile data, navigates to success page

#### Authentication & Account
- **Multi-tab auth** — OTP verification flow (register → verify OTP → auto-login)
- **Account page** with tab navigation: Profile, Orders, Addresses, Security (password change), Settings
- **Order history** — fetched via `AccountContext`, displays items with product images, status badges, and totals
- **Address management** — CRUD with default address selection, persisted to localStorage
- **Forgot/reset password** — OTP-based password reset flow

#### Theme & UX
- **Dark/light theme** — toggleable via context, persisted to localStorage, respects system preference on first visit
- **Glassmorphism navbar** — transparent on top, blurred glass effect on scroll
- **Toast notifications** — positioned bottom-right, 2-second duration
- **Scroll to top** on route change
- **Mobile responsive** — hamburger menu, responsive grid breakpoints

#### AI Chatbot
- **Floating chat widget** — fixed position, minimizable, closable, unread count badge
- **DeepSeek V3.2 integration** — sends message + conversation history + cart context + current path
- **Cart actions** — AI can add products to cart via action payloads dispatched to Redux
- **Quick reply buttons** — preset suggestions for common queries
- **Session persistence** — chat history saved to localStorage, auto-clears after 30 minutes of inactivity
- **Markdown formatting** — bold text and line breaks rendered in messages

---

### Admin Features

> All admin routes are protected by `ProtectedRoute` which checks `isAdminLoggedIn` + role from Redux.

#### Dashboard
- **Summary cards** — total revenue, order count, user count, product count
- **Recent orders table** — clickable order ID (copies to clipboard), customer, date, total, status

#### Product Management
- **CRUD interface** — create/edit products with title, artist, price, stock, category, description, image URL
- **Image upload** — via admin upload endpoint
- **Delete protection** — blocked if product has order items (error toast)

#### Order Management
- **Paginated order list** — with user details, product line items, totals
- **Status updates** — change order status (PENDING / COMPLETED / CANCELLED)

#### User Management
- **User list** — name, email, role, registration date
- **Role management** — promote/demote users (USER ↔ ADMIN)

#### Statistics Dashboard (5 modules)
All statistics pages share common infrastructure from `StatsUtils.tsx`:

| Module       | Charts                                     | Features                           |
| ------------ | ------------------------------------------ | ---------------------------------- |
| **Revenue**  | Line chart (daily trend), Bar chart (daily) | Summary cards, data table, export |
| **Orders**   | Line chart, status breakdown               | Period filtering, export           |
| **Products** | Bar chart (top sellers), Pie chart (category) | Category performance, export    |
| **Users**    | Area chart (registrations), top customers  | User growth analysis, export       |
| **Inventory**| Stock levels, low-stock alerts             | Category breakdown, valuation      |

**Shared utilities:**
- `useStatsData<T>` — custom hook for fetching statistics with period-based filtering (`today`, `week`, `month`, `year`, `custom` date range)
- `exportToExcel()` — generates CSV with BOM for Excel UTF-8 compatibility, triggered via download button
- `StatCard`, `ChartCard`, `StatsSkeleton`, `EmptyState`, `OrderStatusBadge` — reusable presentation components

---

## 5. State Management

### Redux Toolkit Store

The store is configured in `store/index.ts` with three slices:

```
┌──────────────────────────────────────────┐
│              Redux Store                 │
├──────────────────────────────────────────┤
│                                          │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │  cartSlice   │  │  productSlice    │  │
│  │  ─────────── │  │  ────────────    │  │
│  │  items[]     │  │  items[]         │  │
│  │              │  │  stock{}         │  │
│  │  addToCart   │  │  status          │  │
│  │  remove      │  │                  │  │
│  │  updateQty   │  │  fetchProducts() │  │
│  │  clearCart   │  │  (async thunk)   │  │
│  └─────────────┘  └──────────────────┘  │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │          userSlice               │   │
│  │  ────────────────────            │   │
│  │  isLoggedIn / profile            │   │
│  │  isAdminLoggedIn / adminProfile  │   │
│  │                                  │   │
│  │  login / logout / updateProfile  │   │
│  │  adminLogin / adminLogout        │   │
│  │  updateAdminProfile              │   │
│  └──────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

### Slice Details

| Slice          | State                          | Persistence Strategy                     |
| -------------- | ------------------------------ | ---------------------------------------- |
| **cartSlice**  | `items: CartItem[]`            | Read from `localStorage('cart')` on init. Saved on every change via `store.subscribe()` in `main.tsx`. |
| **productSlice** | `items`, `stock`, `status`   | Not persisted — fetched from API on app mount via `createAsyncThunk`. Stock map is derived from the product list for O(1) lookups. |
| **userSlice**  | User + Admin sessions          | Read from `localStorage('token'/'user'/'admin_token'/'admin_user')` on init. Written by login/logout handlers in components (not via subscribe). |

### Dual Session Architecture

The `userSlice` maintains **two independent sessions**:

| Session | localStorage Keys          | Redux State                  | Purpose                        |
| ------- | -------------------------- | ---------------------------- | ------------------------------ |
| User    | `token`, `user`            | `isLoggedIn`, `profile`      | Storefront pages (`/account`)  |
| Admin   | `admin_token`, `admin_user` | `isAdminLoggedIn`, `adminProfile` | Admin panel (`/admin/*`)  |

This prevents the admin session from being overwritten when an admin also browses the storefront as a regular user.

---

## 6. API Integration

### Axios Configuration (`services/api.ts`)

The API layer is a single Axios instance with comprehensive middleware:

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
```

### Token Handling

The request interceptor resolves the correct token based on the current URL path:

- Pages under `/admin/*` → use `admin_token` from localStorage
- All other pages → use `token` from localStorage

This ensures admin API calls use the admin JWT while storefront calls use the user JWT.

### Automatic Retry

The response interceptor implements exponential backoff retry for transient failures:

| Config                    | Value                                                          |
| ------------------------- | -------------------------------------------------------------- |
| **Retryable statuses**    | `500`, `502`, `503`, `504`                                     |
| **Network errors**        | Retried (except `ECONNABORTED` timeouts)                       |
| **Max attempts**          | 3                                                              |
| **Backoff formula**       | `min(500ms × 2^(attempt-1), 8000ms)` → 500ms, 1s, 2s          |
| **Non-retryable**         | `401` (auth), `429` (rate limit), `4xx` (client errors)        |

### Session Expiry Handling

On `401` response:

- If on an admin page → clears `admin_token`/`admin_user`, dispatches `adminLogout()`, shows toast
- If on a storefront page → clears `token`/`user`, dispatches `logout()`, shows toast
- Uses unique toast IDs (`admin-session-expired-toast`, `session-expired-toast`) to prevent duplicate notifications

### Rate Limit Handling

On `429` response → shows a user-friendly "too many requests" toast without retrying.

### Response Unwrapping

The response interceptor returns `response.data` directly (not the Axios response wrapper), so all API calls receive the parsed JSON body.

---

## 7. Folder Structure

```
frontend/
├── public/
│   ├── cd-icon.svg                 # Favicon
│   ├── favicon.svg                 # Alternate favicon
│   └── icons.svg                   # SVG sprite sheet
├── src/
│   ├── main.tsx                    # React entry — Redux Provider, ThemeProvider, cart persistence
│   ├── App.tsx                     # Route definitions (BrowserRouter, MainLayout, AdminLayout)
│   ├── App.css                     # Legacy Vite scaffold styles (mostly unused)
│   ├── index.css                   # Design system — tokens, components, animations, theme (600+ lines)
│   ├── assets/
│   │   ├── hero.png                # Hero image asset
│   │   ├── react.svg               # React logo
│   │   └── vite.svg                # Vite logo
│   ├── components/
│   │   ├── Navbar.tsx              # Glassmorphism fixed navbar with search, theme toggle, mobile menu
│   │   ├── Footer.tsx              # 4-column footer with newsletter, social links, contact info
│   │   ├── HeroBanner.tsx          # Auto-rotating carousel with vinyl disc animation
│   │   ├── ProductCard.tsx         # Product card with quick-add modal, wishlist, stock awareness
│   │   ├── ProductFilterBar.tsx    # Search + sort dropdown + filter pills
│   │   ├── FeaturedProducts.tsx    # Configurable product grid section with staggered animations
│   │   ├── ChatBot.tsx             # AI chat widget with DeepSeek integration + cart actions
│   │   ├── AccountDropdown.tsx     # User menu dropdown with order badge + admin link
│   │   ├── ProtectedRoute.tsx      # Role-based route guard (checks Redux admin session)
│   │   ├── ScrollToTop.tsx         # Scrolls to top on route change
│   │   └── admin/
│   │       └── StatsUtils.tsx      # Shared stats components: cards, charts, filters, export, skeleton
│   ├── pages/
│   │   ├── Home.tsx                # Landing page — hero, categories, featured, trending, promo
│   │   ├── Vinyl.tsx               # Vinyl records catalog page
│   │   ├── CD.tsx                  # CDs catalog page
│   │   ├── Merch.tsx               # Merchandise catalog page
│   │   ├── ProductDetail.tsx       # Single product page with add-to-cart
│   │   ├── Cart.tsx                # Shopping cart with quantity controls and selective checkout
│   │   ├── Checkout.tsx            # Checkout form with validation and order submission
│   │   ├── OrderSuccess.tsx        # Post-checkout success page
│   │   ├── User.tsx                # Account page (tabbed: profile, orders, addresses, security, settings)
│   │   ├── Contact.tsx             # Contact information page
│   │   ├── ShippingReturns.tsx     # Shipping policy page
│   │   ├── FAQ.tsx                 # FAQ page
│   │   ├── PageHeader.tsx          # Reusable page header component
│   │   └── admin/
│   │       ├── AdminDashboard.tsx  # Overview — stat cards + recent orders table
│   │       ├── AdminProducts.tsx   # Product CRUD interface
│   │       ├── AdminOrders.tsx     # Order management with status updates
│   │       ├── AdminUsers.tsx      # User list and role management
│   │       └── statistics/
│   │           ├── RevenueStats.tsx    # Revenue charts + data table + export
│   │           ├── OrderStats.tsx      # Order analytics + status breakdown
│   │           ├── ProductStats.tsx    # Top sellers + category performance
│   │           ├── UserStats.tsx       # User growth + top customers
│   │           └── InventoryStats.tsx  # Stock levels + alerts + valuation
│   ├── store/
│   │   ├── index.ts                # Store configuration (combineReducers)
│   │   ├── cartSlice.ts            # Cart state — localStorage persistence, add/remove/update/clear
│   │   ├── productSlice.ts         # Product catalog — async fetch, stock map
│   │   └── userSlice.ts            # User + admin sessions — dual localStorage persistence
│   ├── services/
│   │   └── api.ts                  # Axios instance — token injection, retry, auto-logout, rate limiting
│   ├── context/
│   │   ├── ThemeContext.tsx         # Dark/light theme — localStorage + system preference
│   │   └── AccountContext.tsx       # Account page state — profile, orders, addresses
│   └── types/
│       └── index.ts                # Product and CartItem interfaces
├── Dockerfile                      # Multi-stage: Node 20 build → Nginx serve
├── index.html                      # HTML entry point
├── vite.config.ts                  # Vite + React + Tailwind plugins
├── tsconfig.json                   # TypeScript project references
├── tsconfig.app.json               # App TypeScript config (ES2023, strict)
├── eslint.config.js                # Flat ESLint config (TS + React hooks + React Refresh)
└── package.json
```

### Naming Conventions

| Convention           | Example                                    | Purpose                                              |
| -------------------- | ------------------------------------------ | ---------------------------------------------------- |
| PascalCase files     | `ProductCard.tsx`, `AdminDashboard.tsx`     | React components (one component per file)            |
| camelCase files      | `cartSlice.ts`, `api.ts`                   | Non-component modules (slices, services, types)      |
| Context suffix       | `ThemeContext.tsx`, `AccountContext.tsx`     | React Context providers with `useXxx()` hook exports |
| Slice suffix         | `cartSlice.ts`, `userSlice.ts`             | Redux Toolkit slices                                 |

---

## 8. Environment Variables

| Variable         | Description                                         | Required | Default                         |
| ---------------- | --------------------------------------------------- | -------- | ------------------------------- |
| `VITE_API_URL`   | Backend API base URL (must include `/api` prefix)   | No       | `http://localhost:3000/api`     |

**Docker Compose:** Sets `VITE_API_URL=/api` at build time, so all API calls go through the Nginx gateway on the same origin — no CORS needed.

**Local development:** If the backend runs on `localhost:3000`, the default works out of the box. No `.env` file is required.

**Example `.env` file:**

```env
VITE_API_URL=http://localhost:3000/api
```

> **Note:** Vite injects environment variables at build time. Changes to `VITE_API_URL` require a rebuild to take effect.

---

## 9. Running Locally

### Prerequisites

- Node.js ≥ 20
- Backend API running on `http://localhost:3000`

### Installation

```bash
cd frontend
npm install
```

### Development Server

```bash
npm run dev
```

Starts the Vite dev server with Hot Module Replacement (HMR). Default URL: `http://localhost:5173`.

### Production Preview

```bash
npm run build
npm run preview
```

Builds the production bundle to `dist/` and serves it locally for testing.

---

## 10. Build & Deployment

### Production Build

```bash
npm run build
```

This runs:
1. `tsc -b` — TypeScript type checking (no emit, project references)
2. `vite build` — Bundles, tree-shakes, minifies, and outputs to `dist/`

### Docker Deployment

The Dockerfile uses a **multi-stage build**:

```
┌─────────────────────────────────┐
│  Stage 1: Builder (node:20-alpine) │
│  ─────────────────────────────── │
│  1. npm install                  │
│  2. VITE_API_URL=/api            │
│  3. npm run build → dist/       │
└─────────────────┬───────────────┘
                  │ COPY dist/
                  ▼
┌─────────────────────────────────┐
│  Stage 2: Runtime (nginx:alpine) │
│  ─────────────────────────────── │
│  1. Serve /usr/share/nginx/html │
│  2. SPA fallback (try_files)    │
│  3. Expose port 80              │
└─────────────────────────────────┘
```

**Key details:**
- The Nginx config includes `try_files $uri /index.html` for React Router client-side routing support
- Static assets are hashed by Vite for cache-busting
- Final image is ~30MB (nginx:alpine + built assets)

### Full-Stack Docker Compose

From the project root:

```bash
docker-compose up -d --build
```

The frontend is accessible through the Nginx API gateway at `http://localhost:8080`. API requests to `/api/*` are proxied to the backend container.

---

## 11. Scripts

| Script              | Command          | Purpose                                            |
| ------------------- | ---------------- | -------------------------------------------------- |
| `npm run dev`       | `vite`           | Start Vite dev server with HMR                     |
| `npm run build`     | `tsc -b && vite build` | Type-check + production bundle to `dist/`    |
| `npm run lint`      | `eslint .`       | Lint all TypeScript/TSX files                      |
| `npm run preview`   | `vite preview`   | Serve the production build locally for testing     |

---

## 12. Future Improvements

| Priority | Improvement                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------- |
| 🔴 High  | **Lazy loading** — Code-split routes with `React.lazy()` + `Suspense` to reduce initial bundle size. |
| 🔴 High  | **Error boundaries** — Add React Error Boundaries to prevent full-app crashes from component errors. |
| 🔴 High  | **Accessibility (a11y)** — Add ARIA labels, keyboard navigation, focus management, and screen reader support. |
| 🟡 Med   | **Product pagination** — Replace loading all products at once with paginated/infinite scroll.       |
| 🟡 Med   | **Image optimization** — Use responsive `srcset`, lazy loading attributes, and WebP format.         |
| 🟡 Med   | **Form library** — Replace manual form validation with React Hook Form + Zod for declarative schemas. |
| 🟡 Med   | **Wishlist persistence** — Store wishlist state server-side instead of component-local state.        |
| 🟡 Med   | **SEO** — Add React Helmet for meta tags, Open Graph data, and structured data markup.              |
| 🟡 Med   | **Internationalization (i18n)** — Formalize the bilingual UI with a library like `react-i18next`.   |
| 🟡 Med   | **Unit tests** — Add Vitest + Testing Library for component and hook testing.                       |
| 🟢 Low   | **PWA support** — Add service worker and manifest for offline capability and install prompts.        |
| 🟢 Low   | **State persistence library** — Replace manual localStorage sync with `redux-persist`.              |
| 🟢 Low   | **Admin responsive layout** — The admin panel sidebar is fixed-width and not mobile-friendly.        |
| 🟢 Low   | **Storybook** — Create a component library with Storybook for isolated development and documentation. |
| 🟢 Low   | **E2E tests** — Add Playwright or Cypress for end-to-end user flow testing.                         |

---

*Last updated: June 2026*
