# SMS OTP Verification Backend (Traccer SMS Gateway)

## Setup

1. Copy `.env.sample` to `.env` and fill in your Traccer SMS credentials and settings.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node index.js
   ```

## Environment Variables
- `TRACCER_API_KEY`: Your Traccer API key
- `TRACCER_API_URL`: Traccer SMS API endpoint (e.g., https://api.traccer.com/sms/send)
- `TRACCER_SENDER_ID`: Sender ID for SMS
- `OTP_EXPIRY_MINUTES`: OTP expiry time in minutes (default: 5)
- `OTP_LENGTH`: Number of digits in OTP (default: 6)

## Endpoints

### POST `/send-otp`
- Body: `{ "phone": "+911234567890" }`
- Sends an OTP to the given phone number.

### POST `/verify-otp`
- Body: `{ "phone": "+911234567890", "otp": "123456" }`
- Verifies the OTP for the given phone number.

---
**Note:** This backend uses in-memory OTP storage for development. For production, use Redis or a database.
