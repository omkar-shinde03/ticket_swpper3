const axios = require('axios');

const TRACCER_API_KEY = process.env.TRACCER_API_KEY;
const TRACCER_API_URL = process.env.TRACCER_API_URL;
const TRACCER_SENDER_ID = process.env.TRACCER_SENDER_ID;

async function sendSMS(phone, message) {
  // TODO: Update payload as per Traccer API docs
  const payload = {
    to: phone,
    message,
    sender: TRACCER_SENDER_ID,
  };
  const headers = {
    'Authorization': `Bearer ${TRACCER_API_KEY}`,
    'Content-Type': 'application/json',
  };
  try {
    const response = await axios.post(TRACCER_API_URL, payload, { headers });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to send SMS');
  }
}

module.exports = { sendSMS };
