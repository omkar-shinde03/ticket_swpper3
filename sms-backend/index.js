const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const { setOTP, getOTP, deleteOTP } = require('./otpStore');
const { sendSMS } = require('./smsService');

function generateOTP(length = 6) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6', 10);

// Send OTP endpoint
app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  const otp = generateOTP(OTP_LENGTH);
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
  setOTP(phone, otp, expiresAt);
  try {
    await sendSMS(phone, `Your verification code is: ${otp}`);
    res.json({ success: true });
  } catch (e) {
    deleteOTP(phone);
    res.status(500).json({ error: e.message });
  }
});

// Verify OTP endpoint
app.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });
  const record = getOTP(phone);
  if (!record) return res.status(400).json({ error: 'No OTP sent or expired' });
  if (Date.now() > record.expiresAt) {
    deleteOTP(phone);
    return res.status(400).json({ error: 'OTP expired' });
  }
  if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });
  deleteOTP(phone);
  res.json({ success: true });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SMS backend running on port ${PORT}`);
});
