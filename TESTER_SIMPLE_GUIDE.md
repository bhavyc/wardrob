# 👗 WARDROB — Simple Tester Guide (आसान टेस्टिंग गाइड)

Yeh document tester ko directly bhejne ke liye hai. Isme technical jargon ke bina bilkul simple steps hain.

---

## ⚡ Step 0: Project Chalu Kaise Karein (Run the Project)

Terminal / Command Prompt kholein aur yeh 3 commands chalayein:

```bash
# 1. Project folder mein jaayein
cd e:\projects\wardrob

# 2. Saare ready-made test kapde aur accounts create karein
npx tsx scripts/seed_full_system.ts

# 3. Website start karein
npm run dev
```

Browser mein open karein: **`http://localhost:3000`**

---

## 🔑 Login ID aur Passwords

| Role | Kahan Login Karna Hai | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin (Owner)** | `http://localhost:3000/admin/login` | `admin@wardrob.in` | `admin123` |
| **Lister (Dukandar)** | `http://localhost:3000/lister/login` | `ananya@lister.com` | `admin123` |
| **Renter (Customer)** | `http://localhost:3000/login` | `priya@renter.com` | `admin123` |
| **Hub Partner** | `http://localhost:3000/hub/login` | Hub Account | `admin123` |

---

## 🧪 4 Easy Test Steps (Flows)

---

### Flow 1: Customer Ban Kar Dress Rent Pe Lena 🛍️
1. Kholein: `http://localhost:3000/catalog`
2. **Filters check karein:**
   - Category (Lehenga, Saree, Gown) pe click karein.
   - Size (S, M, L) aur price filter check karein.
3. **Dress select karein:**
   - Kisi bhi dress pe click karke open karein.
   - Calendar mein rental dates (3 din ya 7 din) select karein.
   - Verify karein ki jo date already booked hai wo select na ho sake.
4. **Rent Now:**
   - `Rent Now` dabakar checkout page par jaayein.
   - Address daalein aur Payment complete karein.
5. **My Orders:**
   - Profile -> `My Orders` mein jaakar check karein ki booking status **CONFIRMED** dikha raha hai ya nahi.

---

### Flow 2: Dukandar (Lister) Ban Kar Kapda Upload Karna 👗
1. Kholein: `http://localhost:3000/lister/login`
   - Email: `ananya@lister.com` | Password: `admin123`
2. **KYC Check:**
   - `/lister/kyc` par jaakar Bank details aur Aadhaar check karein.
3. **Naya Kapda Add Karein:**
   - `Add Listing` button dabayein.
   - Title (e.g. "Bridal Red Lehenga"), Category, Size, Rent (e.g. ₹2500), Deposit (e.g. ₹1500) bharein.
   - 2-3 photos upload karein aur save karein.
4. **Catalog mein check karein:**
   - Main website (`/catalog`) par jaakar check karein ki aapka naya kapda list ho gaya ya nahi.

---

### Flow 3: Hub Partner Ban Kar Parcel Handle Karna 📦
1. Kholein: `http://localhost:3000/hub`
2. **Order Inward (Dukandar se kapda lena):**
   - Order ID scan/type karein.
   - Dress ki photo upload karke **Receive** mark karein.
3. **Order Return (Customer se dress wapas aane par):**
   - Dress wapas aane par check karein:
     - **Grade A (Theek hai):** Full deposit wapas.
     - **Grade B/C (Kharab/Daag):** ₹500 damage deduction daalein aur submit karein.

---

### Flow 4: Admin Ban Kar Sab Control Karna 👑
1. Kholein: `http://localhost:3000/admin/login`
   - Email: `admin@wardrob.in` | Password: `admin123`
2. **Check karne waali cheezein:**
   - **Listers:** Naye dukandaro ki list aur unka KYC approve/reject karna.
   - **Listings:** Kapde approve ya hide karna.
   - **Disputes (Lafde):** Agar customer bole "daag pehle se tha", toh photos dekh kar faisla karna.
   - **Payouts:** Dukandar ke bank account mein paise approve karna.

---

## 📱 Mobile App Testing (Agar Android App Test Karni Hai)

1. Mobile project folder: `e:\projects\wardrob_mobile`
2. Run command:
   ```bash
   flutter pub get
   flutter run
   ```
3. Test karein:
   - App open ho rahi hai bina crash ke.
   - Bottom navigation tabs (Home, Catalog, Orders, Profile) smooth chal rahe hain.
   - Camera se photo lene par permission prompt sahi aa raha hai.

---

## 🐛 Bug Report Kaise Karein?

Agar koi error ya dikkat aaye, toh bas yeh 4 cheezein note karein:

1. **Page URL:** (e.g. `/checkout`)
2. **Kya kiya:** (e.g. 'Pay Now' dabaya)
3. **Kya galat hua:** (e.g. Button freeze ho gaya ya error message aaya)
4. **Screenshot:** Screen ka screenshot le lein.
