require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// In-Memory OTP Store: Map<email, { otp, expiresAt, attempts }>
// In production, this can be swapped with Redis or MongoDB
const otpStore = new Map();

// Helper: Check if live Gmail credentials are configured
function isGmailConfigured() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  return Boolean(user && pass && !user.includes('your_email') && !pass.includes('xxxx'));
}

// 1. Initialize Nodemailer Transporter with Gmail Service
let transporter = null;
if (isGmailConfigured()) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // 16-character Google App Password
    },
  });

  transporter.verify((error) => {
    if (error) {
      console.warn('⚠️ [Gmail SMTP Warning] Could not connect to Gmail SMTP:', error.message);
    } else {
      console.log('✅ [Gmail SMTP] Connected successfully! Ready to send real OTP emails.');
    }
  });
} else {
  console.log('ℹ️ [Dev Notice] EMAIL_USER / EMAIL_PASS not set in .env. OTP will be printed to console & returned in dev_otp response.');
}

// Helper: Generates a cryptographically secure 6-digit random OTP
function generateSecureOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

// Helper: High-End Branded HTML Email Template
function buildOtpEmailTemplate(otp) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Verification Code</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
    <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);">
      <div style="background: #090d16; padding: 28px 24px; text-align: center;">
        <div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
          Urban<span style="color: #f59e0b;">Cart</span> Authentication
        </div>
        <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; font-weight: 600;">
          One-Time Password Verification
        </div>
      </div>
      <div style="padding: 36px 28px; text-align: center;">
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">
          Your Login Verification Code
        </h2>
        <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px 0;">
          Use the 6-digit OTP code below to securely sign into your account.
        </p>
        <div style="background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 14px; padding: 18px 24px; margin: 20px auto; display: inline-block;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #b45309; display: block; margin-left: 12px;">
            ${otp}
          </span>
        </div>
        <div style="font-size: 13px; color: #64748b; margin-top: 14px;">
          ⏳ This code will expire in <strong style="color: #0f172a;">5 minutes</strong>.
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin-top: 28px; text-align: left; font-size: 12px; color: #475569; line-height: 1.5;">
          🔒 <strong>Security Warning:</strong> Never share this code with anyone. UrbanCart will never ask for your OTP. If you did not request this code, you can safely ignore this email.
        </div>
      </div>
      <div style="background: #070b12; color: #94a3b8; font-size: 11px; text-align: center; padding: 20px; border-top: 1px solid #1e293b; line-height: 1.6;">
        © 2026 UrbanCart. All Rights Reserved.<br>
        Designed &amp; Developed with ❤️ by <strong style="color: #f59e0b;">Kalyan Dev</strong>.
      </div>
    </div>
  </body>
  </html>
  `;
}

// ===================================================================
// API 1: POST /api/auth/send-otp
// Accepts: { email: "user@example.com" }
// ===================================================================
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Generate 6-digit OTP & 5-minute expiry
    const otp = generateSecureOTP();
    const expiryMinutes = 5;
    const expiresAt = Date.now() + expiryMinutes * 60 * 1000;

    // 2. Save in memory store (overwrites any previous pending OTP for this email)
    otpStore.set(cleanEmail, { otp, expiresAt, attempts: 0 });

    let emailSent = false;
    let emailError = null;

    // 3. Attempt to dispatch real email via Nodemailer
    if (transporter && isGmailConfigured()) {
      try {
        await transporter.sendMail({
          from: `"UrbanCart Login" <${process.env.EMAIL_USER}>`,
          to: cleanEmail,
          subject: `Your Login OTP: ${otp}`,
          text: `Your 6-digit login verification code is ${otp}. Valid for ${expiryMinutes} minutes.`,
          html: buildOtpEmailTemplate(otp),
        });
        emailSent = true;
        console.log(`✉️ [Email Sent] Successfully delivered OTP to: ${cleanEmail}`);
      } catch (err) {
        emailError = err.message;
        console.error(`❌ [SMTP Error] Failed to send email to ${cleanEmail}:`, err.message);
      }
    } else {
      console.log(`[Dev Simulation] OTP for ${cleanEmail}: ${otp}`);
    }

    // 4. Response Payload
    const responsePayload = {
      success: true,
      message: emailSent
        ? `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox!`
        : `OTP generated for ${cleanEmail}!`,
      email: cleanEmail,
      emailSent,
    };

    // If SMTP not active or in dev mode, include dev_otp so testing is instant
    if (!emailSent) {
      responsePayload.dev_otp = otp;
      responsePayload.message = `OTP generated! [Dev Mode Code: ${otp}] (Configure Gmail SMTP in .env for real inbox delivery)`;
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error('[send-otp Error]:', error);
    return res.status(500).json({ success: false, message: 'Internal server error while sending OTP.' });
  }
});

// ===================================================================
// API 2: POST /api/auth/verify-otp
// Accepts: { email: "user@example.com", otp: "123456" }
// ===================================================================
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Both email address and 6-digit OTP are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    const record = otpStore.get(cleanEmail);

    // 1. Check if OTP exists
    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No OTP code found for this email. Please click "Send OTP" first.',
      });
    }

    // 2. Check if OTP is expired
    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        message: 'The OTP code has expired (5-minute limit). Please request a new code.',
      });
    }

    // 3. Prevent brute-force guessing (max 5 failed attempts)
    if (record.attempts >= 5) {
      otpStore.delete(cleanEmail);
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. For security, this OTP is invalidated. Please request a new one.',
      });
    }

    // 4. Validate OTP code
    if (record.otp !== cleanOtp) {
      record.attempts += 1;
      const remainingAttempts = 5 - record.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP code. Please double check (${remainingAttempts} attempts remaining).`,
      });
    }

    // 5. Successful Verification -> Delete used OTP
    otpStore.delete(cleanEmail);

    const user = {
      id: crypto.randomBytes(6).toString('hex'),
      email: cleanEmail,
      name: cleanEmail.split('@')[0],
      loggedInAt: new Date().toISOString(),
    };

    console.log(`🎉 [Login Success] User verified and logged in: ${cleanEmail}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful! Verification complete.',
      user,
      token: `mock_jwt_token_${crypto.randomBytes(16).toString('hex')}`,
    });
  } catch (error) {
    console.error('[verify-otp Error]:', error);
    return res.status(500).json({ success: false, message: 'Internal server error while verifying OTP.' });
  }
});

// Root Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Gmail OTP Authentication Service',
    gmailConfigured: isGmailConfigured(),
    endpoints: {
      sendOtp: 'POST /api/auth/send-otp',
      verifyOtp: 'POST /api/auth/verify-otp',
    },
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Node.js OTP Server listening on http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
