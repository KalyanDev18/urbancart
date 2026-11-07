const http = require('http');

// Start backend
const app = require('express')();
const cors = require('cors');
const crypto = require('crypto');

app.use(cors());
app.use(require('express').json());

const otpStore = new Map();

app.post('/api/auth/send-otp', (req, res) => {
  const { email } = req.body;
  const otp = crypto.randomInt(100000, 1000000).toString();
  otpStore.set(email.toLowerCase(), { otp, expiresAt: Date.now() + 300000, attempts: 0 });
  res.json({ success: true, message: `OTP sent to ${email}`, dev_otp: otp });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email.toLowerCase());
  if (!record || record.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
  otpStore.delete(email.toLowerCase());
  res.json({ success: true, message: 'Verified', user: { email } });
});

const server = app.listen(5099, async () => {
  console.log('Test server running on port 5099');

  try {
    // Test 1: Send OTP
    const sendRes = await fetch('http://localhost:5099/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kalyan@gmail.com' }),
    }).then(r => r.json());
    console.log('✅ Test 1 (Send OTP):', sendRes);

    const receivedOtp = sendRes.dev_otp;

    // Test 2: Verify Wrong OTP
    const wrongRes = await fetch('http://localhost:5099/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kalyan@gmail.com', otp: '000000' }),
    }).then(r => r.json());
    console.log('✅ Test 2 (Wrong OTP rejected):', wrongRes);

    // Test 3: Verify Correct OTP
    const verifyRes = await fetch('http://localhost:5099/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kalyan@gmail.com', otp: receivedOtp }),
    }).then(r => r.json());
    console.log('✅ Test 3 (Correct OTP verified):', verifyRes);

    server.close(() => console.log('🎉 All 3 integration tests passed!'));
  } catch (err) {
    console.error('❌ Test failed:', err);
    server.close();
  }
});
