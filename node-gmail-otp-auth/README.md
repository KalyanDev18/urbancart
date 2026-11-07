# 📧 Login with Gmail OTP — Express.js + React

A complete, production-ready implementation of **Passwordless Authentication using Gmail OTP**, powered by **Node.js, Express, Nodemailer, and React (Vite)**.

---

## 📁 Project Structure

```text
node-gmail-otp-auth/
├── backend/
│   ├── package.json        # Express, Nodemailer, Cors, Dotenv
│   ├── .env                # Gmail SMTP Credentials
│   ├── .env.example        # Environment variable template
│   └── server.js           # REST API: /send-otp & /verify-otp
│
├── frontend/
│   ├── package.json        # React 19, Vite, Lucide-React
│   ├── vite.config.js      # Port 5174
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx         # App state & user dashboard
│       └── components/
│           └── GmailOtpLogin.jsx # 2-step OTP UI
│
└── README.md
```

---

## ⚡ Quick Start (Running Locally)

### 1. Backend Setup (Port 5000)

```bash
cd backend
npm install
node server.js
```

Server starts on: `http://localhost:5000`

---

### 2. Frontend Setup (Port 5174)

```bash
cd frontend
npm install
npm run dev
```

Open browser at: `http://localhost:5174`

---

## 🔑 How to Configure Real Gmail Inbox Delivery

To allow Nodemailer to send real emails to your Gmail inbox, you need a 16-character **Google App Password**:

1. Open your **[Google Account Security](https://myaccount.google.com/security)** page.
2. Ensure **2-Step Verification** is turned **ON**.
3. Visit the **[Google App Passwords](https://myaccount.google.com/apppasswords)** page.
4. In the App name input, type `UrbanCartOTP` and click **Create**.
5. Google will generate a 16-character password (e.g., `abcd efgh ijkl mnop`).
6. Open `backend/.env` and paste your details:

```env
PORT=5000
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

7. Restart the backend: `node server.js`. Real OTP emails will now land directly in your Gmail inbox!

---

## 🧪 Developer Mode (No Gmail Credentials Needed)

If you haven't set up your Google App Password yet, the backend operates in **Dev Mode**:
- The OTP code is printed directly to the backend terminal console.
- The frontend displays an instant `[Dev Mode OTP: XXXXXX]` badge with auto-fill so you can test the full flow immediately.

---

## 🛠️ API Reference

### `POST /api/auth/send-otp`
**Request Body:**
```json
{
  "email": "user@gmail.com"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "A 6-digit verification code has been sent to user@gmail.com. Please check your inbox!",
  "email": "user@gmail.com",
  "emailSent": true
}
```

---

### `POST /api/auth/verify-otp`
**Request Body:**
```json
{
  "email": "user@gmail.com",
  "otp": "123456"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful! Verification complete.",
  "user": {
    "id": "e8d91b4278fa",
    "email": "user@gmail.com",
    "name": "user"
  },
  "token": "mock_jwt_token_..."
}
```

---

## 🛡️ Security Features
- **Cryptographically Secure OTP:** Generated using Node's `crypto.randomInt(100000, 1000000)`.
- **5-Minute Expiry:** OTP expires strictly after 300 seconds.
- **Brute-Force Protection:** Automatically invalidates the OTP after 5 consecutive incorrect attempts.
- **Single-Use Invalidation:** OTP is destroyed immediately upon successful verification.

---
Designed & Developed with ❤️ by **Kalyan Dev**.
