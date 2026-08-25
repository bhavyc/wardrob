# 1.5 Months Daily Implementation Schedule (45 Days)

This roadmap outlines a day-by-day development schedule to build the complete multi-vendor clothing marketplace ("Wardrob"), including database design, web storefront, admin/seller dashboards, and API support for the Flutter app.

---

## Phase 1: Database Setup, ORM & Authentication (Days 1–7)
**Goal:** Initialize database, models, and establish secure multi-role auth (Admin, Seller, Customer).

- **Day 1**: Initialize Prisma ORM, connect to PostgreSQL, and verify connection.
- **Day 2**: Implement the complete `schema.prisma` models (User, SellerProfile, Product, Order, OrderItem, Payout, ReturnRequest, PlatformSettings).
- **Day 3**: Write database seeding script (`prisma/seed.ts`) to create default settings and admin credentials.
- **Day 4**: Build backend authentication API (`/api/auth/register` and `/api/auth/login`) with JWT.
- **Day 5**: Build `/api/auth/me` and `/api/auth/logout` endpoints.
- **Day 6**: Set up Next.js Edge Middleware for route protection (`/admin/*` and `/seller/*`).
- **Day 7**: Design the Web login/register forms and verify auth status checks.

---

## Phase 2: Seller Onboarding & KYC (Days 8–14)
**Goal:** Allow artisans to register, upload KYC details, and let Admins review/approve them.

- **Day 8**: Create Seller Register UI (collect Shop Name, Bio).
- **Day 9**: Design KYC Details Form (collect Aadhaar, PAN, Bank Details).
- **Day 10**: Build API endpoint `POST /api/seller/kyc` to save KYC details to database.
- **Day 11**: Create Admin Dashboard Shell layout with statistics charts (using Tailwind).
- **Day 12**: Build Admin API and UI to list all pending sellers.
- **Day 13**: Build Admin Approve/Reject API (updates `SellerProfile.status` and `isVerified`).
- **Day 14**: End-to-end testing of seller signup, KYC upload, and admin approval.

---

## Phase 3: Product Listing & Admin Review (Days 15–21)
**Goal:** Approved sellers can list clothing products; Admins review listings before they go live.

- **Day 15**: Create Seller Product Listing UI (inputs for title, price, stock, description).
- **Day 16**: Add Multi-select components for Sizes (`S, M, L, XL`) and Colors.
- **Day 17**: Set up image upload handler (local directory or Cloud storage) and display previews.
- **Day 18**: Build Product Creation API `POST /api/products` (stores sizes/colors array and image URLs).
- **Day 19**: Create Admin Product Approval UI (tables showing products with status).
- **Day 20**: Build Admin Product Approve/Reject API `POST /api/admin/products/approve`.
- **Day 21**: Create Seller Inventory Management UI (edit stock, update price, view active/pending items).

---

## Phase 4: Customer Storefront & Multi-Vendor Cart (Days 22–28)
**Goal:** Build the catalog, details page, and shopping cart containing items from multiple sellers.

- **Day 22**: Design premium fashion homepage header, banners, and collection sections.
- **Day 23**: Build Product Listing Catalog Grid with search and category filters.
- **Day 24**: Create Product Detail Page (`/products/[id]`) with size, color selectors, and stock validation.
- **Day 25**: Implement Multi-Vendor Cart state management (persist items, sizes, colors in LocalStorage).
- **Day 26**: Build Cart Summary UI showing items grouped/flagged by individual sellers.
- **Day 27**: Design Checkout Address Form page & mock payment UI.
- **Day 28**: Build Checkout API `POST /api/orders/checkout`. It creates an `Order` and splits items into distinct `OrderItem` records mapped to their sellers.

---

## Phase 5: Seller Order Management & Tracking (Days 29–35)
**Goal:** Sellers process and ship their items; customers track their delivery status.

- **Day 29**: Create Customer Order History and tracking page UI.
- **Day 30**: Create Seller Orders List UI (displays only `OrderItem` entries belonging to the logged-in seller).
- **Day 31**: Add seller actions to mark order items as `PROCESSING` and print package slip.
- **Day 32**: Build "Ship Item" form: Seller adds tracking number, courier partner name, and updates status to `SHIPPED`.
- **Day 33**: Build "Mark Delivered" action for Sellers, which saves `deliveredAt = now`.
- **Day 34**: Design Customer Return Request form (valid for 7 days post-delivery).
- **Day 35**: Build Return Request submission API (checks delivery timestamp and creates `ReturnRequest` record).

---

## Phase 6: Payouts, Cron Job & Platform Commission (Days 36–42)
**Goal:** Automate payout eligibility calculations, process settlements, and control commission rates.

- **Day 36**: Build a cron-triggered endpoint `GET /api/cron/payout-eligibility` to flag OrderItems as `payoutEligible` after 7 days without return requests.
- **Day 37**: Create Admin Payouts settlement page showing accrued earnings per seller.
- **Day 38**: Build Payout creation API (batch process eligible items, records amount, commission cut, and updates status).
- **Day 39**: Build PlatformSettings Schema and Admin form to adjust the default commission rate (e.g. default 10%).
- **Day 40**: Add per-seller custom override field (`commissionOverride`) in Admin Seller profile editor.
- **Day 41**: Perform integration tests: Order placement -> Shipping -> Delivery -> Return-window -> Payout calculation.
- **Day 42**: Refactor routes, optimize database queries using index parameters, and clean up code.

---

## Phase 7: Mobile API & Production Deployment (Days 43–45)
**Goal:** Prepare REST APIs for Flutter companion app integration, secure the endpoints, and launch.

- **Day 43**: Document and verify REST endpoints for Flutter app integration (Login, Browse, Cart Checkout, Order Tracking).
- **Day 44**: Perform security auditing (validate CORS, token expiries, secure request rate-limiting).
- **Day 45**: Production deployment to Vercel/Render (database on Supabase or AWS RDS) and verify live project runs perfectly.
