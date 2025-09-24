/**
 * Indian phone number validation and formatting utilities
 */

// Indian mobile number patterns
const INDIAN_MOBILE_PATTERNS = {
  // +91 98765 43210
  WITH_COUNTRY_CODE: /^\+91[6-9]\d{9}$/,
  // 91 98765 43210
  WITH_COUNTRY_CODE_NO_PLUS: /^91[6-9]\d{9}$/,
  // 98765 43210
  WITHOUT_COUNTRY_CODE: /^[6-9]\d{9}$/,
  // 098765 43210 (with leading 0)
  WITH_LEADING_ZERO: /^0[6-9]\d{9}$/
};

/**
 * Validate if a phone number is a valid Indian mobile number
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - True if valid Indian mobile number
 */
export const isValidIndianMobile = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  // Remove all spaces and special characters except + and digits
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  
  return Object.values(INDIAN_MOBILE_PATTERNS).some(pattern => 
    pattern.test(cleaned)
  );
};

/**
 * Format phone number to standard Indian format (+91 XXXXXXXXXX)
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} - Formatted phone number
 */
export const formatIndianPhone = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all spaces and special characters except + and digits
  let cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  
  // Handle different input formats
  if (cleaned.startsWith('+91')) {
    // Already has +91
    return cleaned;
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    // Has 91 but no +
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    // Has leading 0, remove it and add +91
    return `+91${cleaned.substring(1)}`;
  } else if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    // 10 digits starting with 6-9, add +91
    return `+91${cleaned}`;
  }
  
  // If none of the above patterns match, return as is
  return cleaned;
};

/**
 * Extract the 10-digit mobile number from formatted phone
 * @param {string} phoneNumber - Formatted phone number
 * @returns {string} - 10-digit mobile number
 */
export const extractMobileNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  
  if (cleaned.startsWith('+91')) {
    return cleaned.substring(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    return cleaned.substring(1);
  } else if (cleaned.length === 10) {
    return cleaned;
  }
  
  return cleaned;
};

/**
 * Get display format for phone number (+91 98765 43210)
 * @param {string} phoneNumber - Phone number to format for display
 * @returns {string} - Display formatted phone number
 */
export const getDisplayFormat = (phoneNumber) => {
  const formatted = formatIndianPhone(phoneNumber);
  if (!formatted) return '';
  
  if (formatted.startsWith('+91')) {
    const mobile = formatted.substring(3);
    return `+91 ${mobile.substring(0, 5)} ${mobile.substring(5)}`;
  }
  
  return formatted;
};

/**
 * Validate and format phone number for Firebase
 * @param {string} phoneNumber - Phone number to validate and format
 * @returns {object} - Validation result with formatted number
 */
export const validateAndFormatForFirebase = (phoneNumber) => {
  if (!phoneNumber) {
    return {
      isValid: false,
      error: 'Phone number is required',
      formatted: ''
    };
  }

  const formatted = formatIndianPhone(phoneNumber);
  
  if (!isValidIndianMobile(formatted)) {
    return {
      isValid: false,
      error: 'Please enter a valid Indian mobile number (10 digits starting with 6-9)',
      formatted: ''
    };
  }

  return {
    isValid: true,
    error: null,
    formatted: formatted
  };
};

/**
 * Get common Indian mobile prefixes
 * @returns {string[]} - Array of common mobile prefixes
 */
export const getCommonMobilePrefixes = () => {
  return [
    '6', '7', '8', '9' // All valid starting digits for Indian mobile
  ];
};

/**
 * Check if number starts with valid Indian mobile prefix
 * @param {string} phoneNumber - Phone number to check
 * @returns {boolean} - True if starts with valid prefix
 */
export const hasValidMobilePrefix = (phoneNumber) => {
  if (!phoneNumber) return false;
  
  const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
  const mobilePart = cleaned.startsWith('+91') ? cleaned.substring(3) : 
                     cleaned.startsWith('91') ? cleaned.substring(2) :
                     cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;
  
  return /^[6-9]/.test(mobilePart);
};
