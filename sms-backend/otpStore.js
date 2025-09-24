// Simple in-memory OTP store (for development only)
const otpMap = new Map();

function setOTP(phone, otp, expiresAt) {
  otpMap.set(phone, { otp, expiresAt });
}

function getOTP(phone) {
  return otpMap.get(phone);
}

function deleteOTP(phone) {
  otpMap.delete(phone);
}

module.exports = { setOTP, getOTP, deleteOTP };
