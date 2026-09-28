# 📱 Meta WhatsApp Cloud API - Complete Step-by-Step Setup Guide

This guide walks you through setting up official **Meta WhatsApp Cloud API** credentials for **Wardrob**, allowing automated WhatsApp notifications to be sent to Renters (Return reminders, Overdue alerts) and Listers (Courier pickup notifications).

---

## 📋 Required Credentials for Wardrob `.env`

Once setup is complete, you will add these two keys to your `.env` file:
```env
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id_here"
WHATSAPP_ACCESS_TOKEN="your_permanent_access_token_here"
```

---

## 🚀 Step 1: Create a Meta Developer Account

1. Go to [developers.facebook.com](https://developers.facebook.com/).
2. Log in with your Facebook account.
3. Click **Get Started** (or **My Apps** in the top-right corner if you already have an account).
4. Complete the developer verification process (accept terms and verify with your phone/email if prompted).

---

## 🛠️ Step 2: Create a Meta App

1. On the **My Apps** dashboard, click the green button: **Create App** (or **Create**).
2. **What do you want your app to do?**
   - Select **Other** (or **Business** if shown). Click **Next**.
3. **Select an app type:**
   - Choose **Business**. Click **Next**.
4. **App Details:**
   - **App Name:** Enter `Wardrob Concierge` (or any name you prefer).
   - **App Contact Email:** Enter your work/admin email.
   - **Business Account (Optional):** If you already have a Meta Business Manager account, select it; otherwise leave it as default (Meta will automatically create one for you).
5. Click **Create App** and enter your Facebook password to confirm.

---

## 📲 Step 3: Add WhatsApp Product to Your App

1. Once the app dashboard opens, scroll down to find the **WhatsApp** card under "Add products to your app".
2. Click **Set up** on the WhatsApp tile.
3. If asked to select a Meta Business Account, select your business account (or continue with the default one).
4. You will now be redirected to the **WhatsApp > API Setup** (or Quickstart) page.

---

## 🧪 Step 4: Test Mode (Instant Free Testing in 2 Minutes)

On the **API Setup** page:
1. Under **Step 1: Select phone numbers**:
   - You will see a temporary test phone number provided by Meta (e.g., `Test Number: +1 555-xxx-xxxx`).
   - Right below it, you will see:
     👉 **Phone number ID:** (e.g., `105938472918234`) 👈 **(Copy this!)**
2. Under **Temporary access token**:
   - Meta gives you a 24-hour test token.
   - *(Note: We will generate a permanent token in Step 6 so it never expires).*
3. Under **To (Recipient Phone Number)**:
   - Select **Manage phone number list**.
   - Add your personal WhatsApp number with country code (e.g. `+91 9876543210`).
   - Meta will send a 6-digit verification code to your WhatsApp. Enter the code to verify your number.
4. Click **Send message** on the Meta dashboard to test — you will instantly receive a test message on WhatsApp!

---

## 📞 Step 5: Add Your Real Business Phone Number (For Production)

> ⚠️ **Important Requirement:** The phone number you use CANNOT be actively registered on the regular WhatsApp or WhatsApp Business mobile app. If it is already registered, delete the WhatsApp account from the app first (`Settings > Account > Delete Account`), or use a fresh SIM/number dedicated for Wardrob.

1. On the **API Setup** page, scroll down to **Step 5: Add a phone number**.
2. Click **Add phone number**.
3. Fill in the profile details:
   - **WhatsApp Business Display Name:** `Wardrob Concierge` (or `Wardrob Luxury Rentals`).
   - **Category:** `Apparel & Clothing` or `Shopping & Retail`.
   - **Business Description:** `Luxury Designer Garment Rentals & Concierge Desk`.
4. Enter your new phone number and choose verification via **SMS** or **Phone Call**.
5. Enter the 6-digit OTP received on your phone.
6. Once verified, select this new number from the dropdown on the **API Setup** page.
7. Copy the new **Phone number ID** displayed on the screen.

---

## 🔑 Step 6: Generate a Permanent Access Token (Never Expires)

By default, the token on the Quickstart page expires after 24 hours. Follow these steps to generate a permanent System User Token:

1. Go to **Meta Business Settings**: [business.facebook.com/settings](https://business.facebook.com/settings).
2. Select your Business Account.
3. In the left sidebar, click **Users** > **System Users**.
4. Click **Add**:
   - **System User Name:** `wardrob-backend-api`
   - **System User Role:** `Admin`
   - Click **Create system user**.
5. With the system user selected, click **Assign Assets**:
   - Select **Apps** > Click your app (`Wardrob Concierge`).
   - Enable the toggle for **Full control** (Manage app).
   - Click **Save Changes**.
6. Now click **Generate new token**:
   - Select your app: `Wardrob Concierge`.
   - **Token Expiration:** Select **Never**.
   - **Permissions Required:** Scroll down and check the following two permissions:
     - ✅ `whatsapp_business_messaging`
     - ✅ `whatsapp_business_management`
7. Click **Generate Token**.
8. A modal will pop up with your permanent access token.  
   👉 **Copy and save this token immediately** (Meta only displays it once!).

---

## 📝 Step 7: Add Credentials to Wardrob `.env`

Open `e:\projects\wardrob\.env` and add/update your credentials:

```env
# Meta WhatsApp Cloud API Configuration
WHATSAPP_PHONE_NUMBER_ID="your_copied_phone_number_id"
WHATSAPP_ACCESS_TOKEN="your_copied_permanent_token"
```

Save the file. Restart your Next.js dev server:
```bash
npm run dev
```

---

## ✅ Step 8: How to Verify & Test

You can test sending a WhatsApp message right away using Node:

```bash
node -e "
const { sendReturnReminder } = require('./src/lib/whatsapp.ts');
// Or trigger a test booking reminder
console.log('Testing WhatsApp Cloud API delivery...');
"
```

When an event triggers (or during dev simulation):
- You will see: `[WHATSAPP META] 📱 Message sent successfully to +91XXXXXXXXXX. Msg ID: wamid.XXXX...`
- The user will receive the official Wardrob concierge message directly on their WhatsApp!

---

## 💡 Troubleshooting & Tips

1. **Error: "Message failed to send to unverified number":**
   - In Development mode, you can only send messages to phone numbers added in the **"Manage phone number list"** on the Meta dashboard.
   - To send messages to *any* customer in India/worldwide, complete **Meta Business Verification** in Business Settings (`Security Center > Start Verification`).
2. **Pricing:**
   - Meta gives **1,000 free service conversations per month** for every WhatsApp Business account.
3. **Template Messages vs Session Messages:**
   - Standard user-initiated service replies are free within 24 hours.
   - Automated business notifications (like return reminders) use standard utility templates.
