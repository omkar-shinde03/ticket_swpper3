# Combined Verification System

## Overview

The TicketSwapper application now uses a **combined verification system** that sends both email verification links and phone verification codes in a single email. This approach:

- **Reduces costs** by eliminating the need for SMS services
- **Simplifies the user experience** with a single verification flow
- **Maintains security** with both email and phone verification
- **Improves reliability** by using email as the primary communication channel

## How It Works

### 1. User Registration
When a user signs up:
1. Account is created in the database
2. A single email is sent containing:
   - **Email verification link** (click to verify email)
   - **Phone verification code** (6-digit OTP to enter in dashboard)

### 2. Verification Process
The user completes verification in two steps:

#### Step 1: Email Verification
- User clicks the email verification link in the email
- Email is marked as verified in the system
- User is redirected to the dashboard

#### Step 2: Phone Verification
- User enters the 6-digit phone verification code from the email
- Phone number is marked as verified
- Account is fully activated

### 3. Email Template
The combined verification email includes:
- Clear sections for both email and phone verification
- Email verification button
- Phone verification code display
- Instructions for each step
- Dashboard link for easy access

## Technical Implementation

### New Files Created
- `supabase/functions/send-combined-verification/index.js` - Edge function for combined verification
- `src/utils/combinedVerification.js` - Frontend utility functions
- `src/utils/combinedVerification.test.js` - Test suite

### Updated Files
- `supabase/functions/send-email/index.js` - Added combined verification template
- `src/components/auth/SignupForm.jsx` - Updated to use combined verification
- `src/components/auth/EmailVerification.jsx` - Enhanced to handle both verifications
- `src/utils/emailVerification.js` - Deprecated, redirects to combined system
- `src/utils/phoneVerification.js` - Deprecated, redirects to combined system

### Database Requirements
The system requires these tables:
- `profiles` - User profile information including phone verification status
- `phone_verification_otps` - Stored phone OTP codes with expiration
- `email_verification_logs` - Email verification activity logs
- `phone_verification_logs` - Phone verification activity logs

## API Endpoints

### Send Combined Verification
```
POST /functions/v1/send-combined-verification
Body: { email: string, phone?: string, isResend?: boolean }
```

### Verify Email Token
```
POST /functions/v1/verify-email-token
Body: { email: string, token: string }
```

### Verify Phone OTP
```
POST /functions/v1/verify-phone-otp
Body: { phone: string, email: string, otp: string }
```

## Frontend Usage

### Basic Usage
```javascript
import { sendCombinedVerification, getCombinedVerificationStatus } from '@/utils/combinedVerification';

// Send verification email
const result = await sendCombinedVerification('1234567890');

// Check verification status
const status = await getCombinedVerificationStatus();
console.log(`Email: ${status.emailVerified}, Phone: ${status.phoneVerified}`);
```

### Available Functions
- `sendCombinedVerification(phone?, isResend?)` - Send combined verification email
- `verifyEmailToken(email, token)` - Verify email with token
- `verifyPhoneOtp(phone, email, otp)` - Verify phone with OTP
- `isEmailVerified()` - Check if email is verified
- `isPhoneVerified()` - Check if phone is verified
- `getCombinedVerificationStatus()` - Get complete verification status
- `resendCombinedVerification(phone?)` - Resend verification email

## Migration from Old System

### For Existing Code
The old verification functions still work but show deprecation warnings:
- `sendVerificationEmail()` → `sendCombinedVerification()`
- `sendPhoneVerification()` → `sendCombinedVerification(phone)`
- `getVerificationStatus()` → `getCombinedVerificationStatus()`

### Recommended Changes
1. Update imports to use `combinedVerification.js`
2. Replace individual verification calls with combined functions
3. Update UI to show both verification steps
4. Test the new verification flow

## Benefits

### Cost Savings
- **No SMS costs** - All verification codes sent via email
- **Reduced infrastructure** - Single email service instead of email + SMS
- **Lower maintenance** - One verification system to maintain

### User Experience
- **Single email** - Users don't need to check multiple places
- **Clear instructions** - Step-by-step verification process
- **Consistent interface** - Same verification flow for all users

### Security
- **Dual verification** - Both email and phone must be verified
- **Email security** - Email verification provides account ownership proof
- **Phone verification** - Additional layer of security and contact verification
- **Real SMS verification** - Phone verification codes sent via actual SMS (not email)
- **Anti-fraud protection** - Prevents users from using fake/dummy phone numbers
- **Phone ownership proof** - User must have access to the actual phone to receive SMS

## 🔒 **Enhanced Security Features**

### Real Phone Verification
The system now sends phone verification codes via **actual SMS** instead of just email:

- **SMS Delivery**: Verification codes sent to real phone numbers via SMS
- **Phone Ownership**: User must have access to the actual phone to receive codes
- **Anti-Fraud**: Prevents verification with fake/dummy phone numbers
- **Compliance**: Meets security standards for phone verification

### Supported SMS Services
- **Twilio** - International SMS service
- **MSG91** - Popular in India, cost-effective
- **AWS SNS** - Integrated with AWS ecosystem
- **Generic HTTP** - Any SMS provider with HTTP API

### Security Measures
- **Phone Validation**: Ensures valid Indian mobile number format
- **Rate Limiting**: Prevents spam and abuse
- **OTP Expiration**: 10-minute validity period
- **One-Time Use**: Each OTP can only be used once
- **Delivery Tracking**: Monitor SMS success/failure rates

## Testing
In development, the system returns verification codes in the API response for testing:
```json
{
  "success": true,
  "message": "Combined verification email sent successfully",
  "emailToken": "123456",
  "phoneOtp": "789012"
}
```

### Production Mode
In production, only success/error messages are returned for security.

## Troubleshooting

### Common Issues
1. **Email not received** - Check spam folder and email service configuration
2. **Phone verification fails** - Ensure OTP hasn't expired (10 minutes)
3. **Verification stuck** - Check if both email and phone are properly verified

### Debug Information
- Check browser console for verification status
- Verify database records for verification status
- Check email logs for delivery confirmation

## Future Enhancements

### Potential Improvements
1. **Email templates** - Customizable email designs
2. **Verification reminders** - Automatic follow-up emails
3. **Bulk verification** - Batch verification for multiple users
4. **Analytics** - Verification success rates and user behavior tracking

### Integration Opportunities
1. **Marketing emails** - Include promotional content in verification emails
2. **Onboarding flow** - Guide users through post-verification steps
3. **Multi-language support** - Localized verification emails
4. **Accessibility** - Screen reader friendly email templates

## 📱 **SMS Service Setup**

### Quick Configuration
1. **Choose SMS Service**: Select from supported providers
2. **Get API Credentials**: Sign up and get authentication keys
3. **Set Environment Variables**: Configure in Supabase dashboard
4. **Test Integration**: Verify SMS delivery and verification flow

### Environment Variables Required
```bash
# Required for all services
SMS_SERVICE_TYPE=twilio|msg91|aws_sns|generic

# Service-specific variables (see SMS_SERVICE_SETUP.md for details)
TWILIO_ACCOUNT_SID=your_account_sid
MSG91_AUTH_KEY=your_auth_key
AWS_ACCESS_KEY_ID=your_access_key
SMS_SERVICE_API_KEY=your_api_key
```

### Development vs Production
- **Development**: SMS codes logged to console (no costs)
- **Production**: Real SMS sent to actual phone numbers

## Support

For technical support or questions about the combined verification system:
- Check the test files for usage examples
- Review the database schema requirements
- Test the verification flow in development mode
- Contact the development team for assistance
- **SMS Setup**: See `SMS_SERVICE_SETUP.md` for detailed configuration
