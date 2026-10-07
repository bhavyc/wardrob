# 👗 WARDROB — Complete Project Setup & QA Testing Master Guide

> **Version:** 1.0.0  
> **Target Audience:** QA Engineers, Manual Testers, Developers, Product Managers  
> **Platforms Covered:** Web Application (Next.js), Mobile App (Flutter Android/iOS), Admin Portal, Hub Partner Portal

---

## 📋 Table of Contents
1. [Platform Architecture & Port Matrix](#1-platform-architecture--port-matrix)
2. [Prerequisites & System Requirements](#2-prerequisites--system-requirements)
3. [Step-by-Step Setup & How to Run](#3-step-by-step-setup--how-to-run)
   - [3.1 Web & Backend Setup (`wardrob`)](#31-web--backend-setup-wardrob)
   - [3.2 Database & One-Click Data Seeding](#32-database--one-click-data-seeding)
   - [3.3 Mobile App Setup (`wardrob_mobile`)](#33-mobile-app-setup-wardrob_mobile)
4. [Test Credentials & Default Accounts](#4-test-credentials--default-accounts)
5. [User Roles & Access Permissions](#5-user-roles--access-permissions)
6. [Complete Step-by-Step QA Testing Checklists](#6-complete-step-by-step-qa-testing-checklists)
   - [Module 1: Authentication, OTP & Profiles](#module-1-authentication-otp--profiles)
   - [Module 2: Lister Onboarding & KYC Verification](#module-2-lister-onboarding--kyc-verification)
   - [Module 3: Catalog, Search, Filters & Product Details](#module-3-catalog-search-filters--product-details)
   - [Module 4: Listing Creation & Management (Lister)](#module-4-listing-creation--management-lister)
   - [Module 5: Booking, Cart & Payment Checkout](#module-5-booking-cart--payment-checkout)
   - [Module 6: Hub Operations & Intake Inspection (Drop-off)](#module-6-hub-operations--intake-inspection-drop-off)
   - [Module 7: Outward Dispatch & Renter Handover](#module-7-outward-dispatch--renter-handover)
   - [Module 8: Return to Hub & Post-Return Inspection (Damage Grading)](#module-8-return-to-hub--post-return-inspection-damage-grading)
   - [Module 9: Damage Disputes, Deductions & Deposit Refunds](#module-9-damage-disputes-deductions--deposit-refunds)
   - [Module 10: Rental Extensions & Additional Charges](#module-10-rental-extensions--additional-charges)
   - [Module 11: Lister Earnings, Wallet Ledger & Payouts](#module-11-lister-earnings-wallet-ledger--payouts)
   - [Module 12: Admin Management Portal](#module-12-admin-management-portal)
   - [Module 13: Mobile App Specific QA (Flutter)](#module-13-mobile-app-specific-qa-flutter)
7. [Critical Edge Cases & Boundary Conditions](#7-critical-edge-cases--boundary-conditions)
8. [Standard Bug Report Template](#8-standard-bug-report-template)

---

## 1. Platform Architecture & Port Matrix

| Component | Technology | Default URL / Port | Repository Folder |
| :--- | :--- | :--- | :--- |
| **Web Frontend & API** | Next.js 16 (App Router) + React 19 + TypeScript | `http://localhost:3000` | `wardrob/` |
| **Admin Panel** | Next.js (`/admin`) | `http://localhost:3000/admin` | `wardrob/src/app/admin` |
| **Hub Partner Portal** | Next.js (`/hub`) | `http://localhost:3000/hub` | `wardrob/src/app/hub` |
| **Lister Portal** | Next.js (`/lister`) | `http://localhost:3000/lister` | `wardrob/src/app/lister` |
| **Database** | PostgreSQL (Prisma ORM v7) | Configured in `.env` (`DATABASE_URL`) | PostgreSQL instance |
| **Mobile App** | Flutter 3.x (Dart) | Android APK / Emulator / iOS | `wardrob_mobile/` |

---

## 2. Prerequisites & System Requirements

Make sure the following tools are installed on the tester's machine:
- **Node.js**: `v20.x` or `v22.x` LTS
- **npm**: `v10.x` or higher
- **PostgreSQL**: Local PostgreSQL running or Cloud PostgreSQL connection string (Neon / Supabase / AWS RDS)
- **Flutter SDK**: `v3.24+` (Only needed if testing mobile source code)
- **Android Studio / VS Code**: With Flutter & Dart plugins
- **Browser**: Google Chrome / Firefox / Safari (latest versions)

---

## 3. Step-by-Step Setup & How to Run

### 3.1 Web & Backend Setup (`wardrob`)

1. **Open Terminal / Command Prompt** in the project directory:
   ```bash
   cd e:\projects\wardrob
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (`.env`):**  
   Ensure a `.env` file exists in `wardrob/` with the following keys:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/wardrob_db?schema=public"
   JWT_SECRET="your_secure_jwt_secret_key_here"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   RAZORPAY_KEY_ID="rzp_test_xxxxxx"
   RAZORPAY_KEY_SECRET="your_razorpay_secret"
   NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxx"
   ADMIN_EMAIL="admin@wardrob.in"
   ```

4. **Generate Prisma Client & Run Migrations:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *The web platform will now be running at `http://localhost:3000`.*

---

### 3.2 Database & One-Click Data Seeding

To test with ready-made products, users, bookings, and disputes without creating everything from scratch:

1. **Run Full System Seeder:**
   ```bash
   npx tsx scripts/seed_full_system.ts
   ```
   *This automatically generates:*
   - Super Admin account (`admin@wardrob.in`)
   - 2 Active Listers (`ananya@lister.com`, `rohan@lister.com`)
   - 3 Renters (`priya@renter.com`, `sneha@renter.com`, `aditi@renter.com`)
   - 10 Luxury ethnic listings (Lehengas, Sarees, Gowns, Anarkalis)
   - 6 Bookings in different states: `PENDING`, `CONFIRMED`, `IN_USE`, `RETURNED_TO_HUB`, `COMPLETED`
   - Active Damage Reports & Disputes for testing hub & admin flows.

2. **Create / Reset Admin Account (Alternative):**
   ```bash
   npx tsx scripts/create_admin.ts inwardrob@gmail.com admin123
   ```

---

### 3.3 Mobile App Setup (`wardrob_mobile`)

1. **Navigate to Mobile App Directory:**
   ```bash
   cd e:\projects\wardrob_mobile
   ```

2. **Fetch Flutter Dependencies:**
   ```bash
   flutter pub get
   ```

3. **Configure Base API URL:**  
   Open `lib/core/constants/api_constants.dart` or `.env` in mobile app:
   - For **Android Emulator**: Set base URL to `http://10.0.2.2:3000/api`
   - For **Physical Android Device**: Connect phone to same Wi-Fi as laptop and use your laptop's local IP (e.g. `http://192.168.1.15:3000/api`)
   - For **Production / Staging**: `https://wardrob.in/api`

4. **Launch Mobile App:**
   ```bash
   flutter run
   ```
   *(Or install the release APK directly: `flutter build apk --release`)*

---

## 4. Test Credentials & Default Accounts

| Role | Email | Password | Phone | Description / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@wardrob.in` | `admin123` | `0000000000` | Full admin privileges at `/admin` |
| **Super Admin (2)**| `inwardrob@gmail.com` | `admin123` | N/A | Secondary master admin account |
| **Lister 1** | `ananya@lister.com` | `admin123` | `9999900001` | KYC Approved, 5 active listings |
| **Lister 2** | `rohan@lister.com` | `admin123` | `9999900002` | KYC Approved, 5 active listings |
| **Renter 1** | `priya@renter.com` | `admin123` | `8888800001` | Has active bookings and wallet balance |
| **Renter 2** | `sneha@renter.com` | `admin123` | `8888800002` | Has confirmed booking awaiting intake |
| **Renter 3** | `aditi@renter.com` | `admin123` | `8888800003` | Has ongoing active rental (`IN_USE`) |
| **Hub Operator** | Hub account or login via `/hub/login` | Credentials as assigned in DB | Operator for QR scan & intake |

---

## 5. User Roles & Access Permissions

```mermaid
graph TD
    Renter[Renter / Customer] -->|Browse & Book| Catalog[Wardrob Catalog]
    Renter -->|Pay Deposit & Rent| Payment[Razorpay Checkout]
    Renter -->|Pick up or Deliver| Order[Order Tracking]
    
    Lister[Lister / Owner] -->|Submit KYC| ListerKYC[KYC Verification]
    Lister -->|Upload Item| ListerListings[Product Catalog]
    Lister -->|Drop Item to Hub| Hub[Wardrob Hub Portal]
    Lister -->|Request Payout| Payouts[Lister Wallet / Payouts]
    
    Hub -->|Scan & Quality Check Inward| HubInward[Inward Inspection]
    Hub -->|Dispatch to Renter| Dispatch[Outward Shipment]
    Hub -->|Receive Return & Grade A/B/C| HubReturn[Return Quality Inspection]
    
    Admin[Super Admin] -->|Approve/Reject| KYCReview[KYC Moderation]
    Admin -->|Resolve Claims| DisputeReview[Damage Disputes]
    Admin -->|Approve Payouts| PayoutApproval[Bank Payouts]
```

---

## 6. Complete Step-by-Step QA Testing Checklists

### Module 1: Authentication, OTP & Profiles
- [ ] **Renter Registration:** Test registration via `/register` with Name, Email, Phone, and Password. Verify validation for existing emails/phone numbers.
- [ ] **Lister Registration:** Visit `/lister/register`. Verify registration flow and auto-assignment of `LISTER` role.
- [ ] **Login (Email & Password):** Test `/login` with correct and incorrect credentials. Verify error messages.
- [ ] **Admin Login:** Go to `/admin/login`. Ensure non-admin users cannot access `/admin` dashboard.
- [ ] **Hub Login:** Go to `/hub/login`. Verify hub operator login and session persistence.
- [ ] **Password Reset:** Test `/forgot-password` and `/reset-password` flow with valid token.
- [ ] **Session Expiry / Logout:** Click logout and verify user is redirected to login and protected routes are blocked.

---

### Module 2: Lister Onboarding & KYC Verification
- [ ] **KYC Form Submission:** Log in as Lister and go to `/lister/kyc`.
- [ ] **Identity Details:** Submit Aadhaar / PAN card number and upload document images.
- [ ] **Bank Details:** Enter Account Holder Name, Account Number, and IFSC code. Ensure IFSC formatting regex works.
- [ ] **Status Badge:** Verify status shows `PENDING_VERIFICATION` immediately after submission.
- [ ] **Admin Review:** Log in as Admin at `/admin/id-verifications`.
  - [ ] Test **Approve KYC**: Lister status should update to `APPROVED`.
  - [ ] Test **Reject KYC**: Enter rejection reason; verify Lister sees rejection feedback.

---

### Module 3: Catalog, Search, Filters & Product Details
- [ ] **Home Page (`/`):** Verify hero banner, featured designer collections, trending rentals, and testimonial carousels.
- [ ] **Catalog Page (`/catalog`):**
  - [ ] **Category Filter:** Filter by Lehenga, Saree, Gown, Anarkali, Sherwani, Kurta Set.
  - [ ] **Size Filter:** Filter by XS, S, M, L, XL, Free Size.
  - [ ] **Price Slider:** Filter by minimum and maximum daily rental fee.
  - [ ] **Search Bar:** Search by designer name, title, or keywords.
- [ ] **Product Details Page (`/product/[id]`):**
  - [ ] Verify image gallery (main view + thumbnails).
  - [ ] Verify rental price, security deposit, size, condition, and designer details.
  - [ ] **Date Picker:** Select 3-day, 7-day, or custom rental dates. Verify pricing recalculates dynamically.
  - [ ] Check already booked dates are disabled/greyed out.

---

### Module 4: Listing Creation & Management (Lister)
- [ ] **Create New Listing:** Go to `/lister/listings` -> Click **Add New Listing**.
- [ ] **Mandatory Fields:** Title, Category, Size, Condition, Retail Price, Rental Fee, Security Deposit.
- [ ] **Image Upload:** Upload at least 3 baseline photos (Front, Back, Detail/Tag). Verify image preview.
- [ ] **Edit Listing:** Edit price or description of an existing listing; verify changes reflect on catalog.
- [ ] **Delete / Pause Listing:** Toggle availability switch or unpublish item; verify it disappears from public catalog.

---

### Module 5: Booking, Cart & Payment Checkout
- [ ] **Cart / Direct Checkout:** Click **Rent Now** on product page -> Redirect to `/checkout`.
- [ ] **Order Breakdown:**
  - [ ] Rental fee × duration
  - [ ] Security deposit (100% refundable)
  - [ ] Cleaning & logistics fee
  - [ ] Taxes (GST if applicable)
  - [ ] Total payable calculation check
- [ ] **Delivery Address:** Enter shipping address with PIN code validation.
- [ ] **ID Verification Prompt:** If renter has not verified ID, ensure prompt appears.
- [ ] **Razorpay Integration:**
  - [ ] Test successful payment with test card / UPI.
  - [ ] Test payment failure / modal dismissal (order should not be marked as paid).
  - [ ] Verify confirmation page displays Booking ID and Order Summary.

---

### Module 6: Hub Operations & Intake Inspection (Drop-off)
- [ ] **Hub Dashboard (`/hub`):** Verify incoming orders list and items awaiting intake.
- [ ] **QR / Barcode Scan (`/hub/scan`):** Scan or enter Booking ID.
- [ ] **Lister Inward Intake:**
  - [ ] Hub inspects item brought by Lister.
  - [ ] Capture/upload 4 intake baseline photos (Front, Back, Zips/Embellishments, Fabric tag).
  - [ ] Mark item condition as `VERIFIED_OK` or `REJECTED_DEFECTIVE`.
- [ ] **Booking Status Transition:** On successful intake, booking status moves to `READY_FOR_DISPATCH`.

---

### Module 7: Outward Dispatch & Renter Handover
- [ ] **Dispatch Order (`/hub/shipments`):** Assign delivery partner / rider or self-pickup.
- [ ] **Tracking Update:** Status updates to `DISPATCHED` / `OUT_FOR_DELIVERY`.
- [ ] **Renter Delivery OTP / Confirmation:** Renter receives item; status moves to `IN_USE`.
- [ ] **Rental Clock:** Verify rental period start date is active and countdown timer functions.

---

### Module 8: Return to Hub & Post-Return Inspection (Damage Grading)
- [ ] **Renter Initiates Return:** On rental completion date, renter drops off at hub or schedules return pickup.
- [ ] **Hub Return Scan:** Hub operator scans Booking ID at `/hub/scan`.
- [ ] **Post-Return Inspection (`/hub/inspections`):**
  - [ ] Upload 4 post-return condition photos.
  - [ ] **Grade Assignment:**
    - `Grade A - No Issue / Minor Normal Wear`: ₹0 deduction. Full deposit refundable.
    - `Grade B - Minor Stains / Repairable Tear`: ₹300 - ₹1,500 deduction.
    - `Grade C - Severe Damage / Irreparable`: Full security deposit forfeiture + dispute.
- [ ] **Submit Inspection:** Report saved in database; booking status moves to `INSPECTION_COMPLETED`.

---

### Module 9: Damage Disputes, Deductions & Deposit Refunds
- [ ] **Clean Return Refund Flow:**
  - [ ] If Grade A: System automatically queues full security deposit refund.
  - [ ] Verify refund status under `/admin/refunds`.
- [ ] **Damage Deduction Flow:**
  - [ ] If Grade B/C: Renter receives SMS/Notification with damage report and deducted amount.
  - [ ] Remaining deposit is credited back.
- [ ] **Dispute Raising:**
  - [ ] Renter visits order details -> clicks **Raise Dispute**.
  - [ ] Renter submits explanation and photo proof.
  - [ ] Dispute status changes to `OPEN`.
- [ ] **Admin Dispute Resolution (`/admin/disputes`):**
  - [ ] Admin reviews both Hub intake photos and post-return photos side-by-side.
  - [ ] Option 1: Rule in favor of Renter (Waive deduction, refund full deposit).
  - [ ] Option 2: Rule in favor of Lister/Hub (Uphold deduction, credit lister compensation).

---

### Module 10: Rental Extensions & Additional Charges
- [ ] **Extension Request:** While booking is `IN_USE`, renter requests +2 days extension.
- [ ] **Availability Check:** System checks whether item is booked by another customer for overlapping dates.
  - [ ] If booked: Extension blocked with error message.
  - [ ] If available: Extension approved, calculates extra per-day rental fee.
- [ ] **Extension Payment:** Renter pays extension fee; return date automatically extends.

---

### Module 11: Lister Earnings, Wallet Ledger & Payouts
- [ ] **Commission Split Calculation:**
  - [ ] Rental Price: e.g. ₹4,000
  - [ ] Platform Commission: 35% (₹1,400)
  - [ ] Lister Share: 65% (₹2,600)
- [ ] **Lister Wallet (`/lister/payouts`):**
  - [ ] Lister sees updated pending balance after order completion.
  - [ ] Transaction history ledger lists order ID, gross rent, platform fee, and net earnings.
- [ ] **Payout Request:** Lister clicks **Request Payout**.
- [ ] **Admin Payout Processing (`/admin/payouts`):**
  - [ ] Admin verifies bank details and approves payout.
  - [ ] Enters UTR / UPI reference ID (`batchRef`).
  - [ ] Lister wallet balance deducts; status updates to `PAID`.

---

### Module 12: Admin Management Portal
- [ ] **Dashboard Metrics (`/admin`):** Total revenue, active rentals, total listers, pending KYC, open disputes.
- [ ] **User & Lister Management (`/admin/listers`):** View lister details, listings count, total earned, ban/unban user.
- [ ] **Listings Moderation (`/admin/listings`):** Review pending listings, feature listings on homepage, suspend spam listings.
- [ ] **Bookings Monitor (`/admin/bookings`):** Filter bookings by status (`PENDING`, `CONFIRMED`, `IN_USE`, `RETURNED_TO_HUB`, `COMPLETED`, `CANCELLED`).
- [ ] **Shipments & Logistics (`/admin/shipments`):** Track all hub movements and courier pickups.
- [ ] **Transactions & Refunds (`/admin/transactions` & `/admin/refunds`):** Real-time payment logs with Razorpay transaction IDs.

---

### Module 13: Mobile App Specific QA (Flutter)
- [ ] **Splash Screen & App Launch:** Verify smooth launch without white flicker.
- [ ] **Bottom Navigation Bar:**
  - [ ] Switch tabs: Home -> Catalog -> My Orders -> Profile.
  - [ ] Lister mode switch (if user is both Lister and Renter).
- [ ] **Image Caching & Performance:** Scroll through 50+ catalog items; verify lazy loading and placeholder transitions.
- [ ] **Camera & Gallery Permissions:**
  - [ ] In Lister KYC: Allow camera permission -> Capture Aadhaar photo.
  - [ ] In Lister New Listing: Pick photos from gallery.
- [ ] **Push & In-App Notifications (`/notifications_screen.dart`):** Order confirmed, delivery dispatched, return reminder.
- [ ] **Offline / Network Loss Handling:** Disconnect internet; verify graceful "No Internet Connection" banner without app crashing.

---

## 7. Critical Edge Cases & Boundary Conditions

| Test Case ID | Scenario | Expected Behavior |
| :--- | :--- | :--- |
| **TC-EDGE-01** | Two users attempt to book the exact same dress for overlapping dates at the same second. | First payment gets confirmed; second payment throws "Dates no longer available" and triggers auto-refund. |
| **TC-EDGE-02** | Renter does not return dress by due date (Overdue item). | Late fee calculation begins (Per day penalty rate); daily automated WhatsApp/SMS alerts sent. |
| **TC-EDGE-03** | Lister attempts to upload listing with 0 images or negative rental price. | Form validation error stops submission with clear error messages. |
| **TC-EDGE-04** | User tampers with Razorpay payment modal or signature verification. | Backend rejects webhook/callback if signature verification fails; order stays unpaid. |
| **TC-EDGE-05** | Hub operator marks item Grade C without uploading proof photos. | Form rejects submission requiring minimum 2 damage photo uploads. |
| **TC-EDGE-06** | Lister with unverified KYC tries to request bank payout. | Payout button disabled with tooltip "Complete bank KYC first". |

---

## 8. Standard Bug Report Template

When a bug or anomaly is detected, report it using the following format:

```markdown
### [BUG-ID] Short, descriptive summary of the issue

- **Severity:** [Blocker / Critical / Major / Minor / Cosmetic]
- **Module:** [Auth / KYC / Catalog / Checkout / Hub / Admin / Mobile]
- **Platform / Device:** [e.g. Chrome 124 Desktop / Pixel 7 Android 14]
- **User Role Tested:** [Renter / Lister / Hub Operator / Admin]

#### Steps to Reproduce:
1. Go to '...'
2. Click on '...'
3. Enter '...'
4. Observe the behavior

#### Expected Result:
What should have happened according to specs.

#### Actual Result:
What actually happened (include error message or unexpected behavior).

#### Screenshots / Video / Logs:
[Attach screenshot or terminal error log snippet]
```

---

*Document compiled and verified for Wardrob ecosystem.*
