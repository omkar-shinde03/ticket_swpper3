/**
 * Background PNR validation utility
 * Automatically validates PNR when tickets are created
 */

// Enhanced logging for debugging
const DEBUG_MODE = import.meta.env.DEV || false;

const debugLog = (message, data = null) => {
  if (DEBUG_MODE) {
    console.log(`[PNR Debug] ${message}`, data || '');
  }
};

const debugError = (message, error = null) => {
  console.error(`[PNR Error] ${message}`, error || '');
};

const BUS_OPERATORS = [
  { id: 'redbus', name: 'RedBus', apiEndpoint: 'https://api.redbus.in/verify' },
  { id: 'abhibus', name: 'AbhiBus', apiEndpoint: 'https://api.abhibus.com/verify' },
  { id: 'makemytrip', name: 'MakeMyTrip', apiEndpoint: 'https://api.makemytrip.com/bus/verify' },
  { id: 'paytm', name: 'Paytm', apiEndpoint: 'https://api.paytm.com/bus/verify' },
  { id: 'ksrtc', name: 'KSRTC', apiEndpoint: 'https://ksrtc.in/api/verify' },
  { id: 'msrtc', name: 'MSRTC', apiEndpoint: 'https://msrtc.gov.in/api/verify' },
  { id: 'tsrtc', name: 'TSRTC', apiEndpoint: 'https://tsrtc.telangana.gov.in/api/verify' }
];

// Test API connectivity
export const testApiConnectivity = async () => {
  const API_URL = 'https://ftsboryogzngqfarbbgu.supabase.co/rest/v1/bus_tickets';
  const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0c2JvcnlvZ3puZ3FmYXJiYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzM0NTEsImV4cCI6MjA2ODkwOTQ1MX0.idJ82x2P4BqQ1VffwQ5nnFYWtGIIo_H8kTidAGhwV0A';
  debugLog('Testing API connectivity to:', API_URL);
  
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      },
      mode: 'cors'
    });
    
    debugLog('API Response Status:', response.status);
    debugLog('API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    debugLog('API Response Data:', data);
    
    return {
      success: true,
      status: response.status,
      data: data,
      message: `API is accessible. Found ${data?.length || 0} tickets.`
    };
  } catch (error) {
    debugError('API Connectivity Test Failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'API is not accessible or returning invalid data.'
    };
  }
};

/**
 * Validate PNR with API in background
 * @param {string} pnr - PNR number to validate
 * @param {string} operator - Bus operator
 * @param {Object} ticketData - Additional ticket data for verification
 * @returns {Promise<{isValid: boolean, confidence?: number, apiProvider?: string, error?: string}>}
 */
export const validatePNRInBackground = async (pnr, operator, ticketData = {}) => {
  debugLog('Starting PNR validation', { pnr, operator, ticketData });
  
  try {
    // Basic format validation
    if (!pnr || pnr.length < 6 || pnr.length > 15) {
      debugError('Invalid PNR format', { pnr, length: pnr?.length });
      return {
        isValid: false,
        error: "Invalid PNR format"
      };
    }

    const cleanPNR = pnr.toUpperCase().replace(/[^A-Z0-9]/g, '');
    debugLog('Cleaned PNR:', cleanPNR);
    
    // Detect operator from PNR if not provided
    let detectedOperator = detectOperatorFromPNR(cleanPNR);
    if (operator && operator !== 'auto') {
      detectedOperator = operator.toLowerCase();
    }
    debugLog('Detected operator:', detectedOperator);

    debugLog('Validating PNR with API:', cleanPNR);
    debugLog('Expected passenger name:', ticketData.passengerName);
    
    // Direct API call to ticket verification API
    try {
      const API_URL = 'https://ftsboryogzngqfarbbgu.supabase.co/rest/v1/bus_tickets';
      const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0c2JvcnlvZ3puZ3FmYXJiYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzM0NTEsImV4cCI6MjA2ODkwOTQ1MX0.idJ82x2P4BqQ1VffwQ5nnFYWtGIIo_H8kTidAGhwV0A';
      debugLog('Making API request to:', API_URL);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`
        },
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      debugLog('API Response status:', response.status);
      debugLog('API Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        debugError('API Error Response:', { status: response.status, statusText: response.statusText, body: errorText });
        throw new Error(`API responded with status: ${response.status} - ${response.statusText}. Body: ${errorText}`);
      }
      
      const tickets = await response.json();
      debugLog('API Connected! Total tickets received:', tickets.length);
      debugLog('Available PNRs:', tickets.map(t => t.pnr_number));
      
      // Validate response structure
      if (!Array.isArray(tickets)) {
        debugError('Invalid API response: Expected array, got:', typeof tickets);
        throw new Error('Invalid API response format: Expected array of tickets');
      }
      
      // Find matching ticket by PNR
      const matchingTicket = tickets.find(ticket => {
        const ticketPNR = ticket.pnr_number ? ticket.pnr_number.toString().trim().toUpperCase() : '';
        debugLog(`Comparing PNR: "${cleanPNR}" === "${ticketPNR}"`);
        return ticketPNR === cleanPNR;
      });
      
      if (matchingTicket) {
        debugLog('Found matching ticket:', matchingTicket);
        
        // Simple exact name validation (case-insensitive)
        const apiName = (matchingTicket.passenger_name || '').toString().toLowerCase().trim();
        const userProvidedName = (ticketData.passengerName || '').toString().toLowerCase().trim();
        
        debugLog('Name validation:', {
          apiName,
          userProvidedName,
          namesMatch: !userProvidedName || apiName === userProvidedName || apiName.includes(userProvidedName) || userProvidedName.includes(apiName)
        });
        
        // If passenger name is provided, it must match
        const nameMatches = !userProvidedName || 
                           apiName === userProvidedName || 
                           apiName.includes(userProvidedName) || 
                           userProvidedName.includes(apiName);
        
        if (nameMatches) {
          // Use separate date and time fields from API
          const formattedDate = matchingTicket.departure_date || new Date().toISOString().split('T')[0];
          const formattedTime = matchingTicket.departure_time || '00:00';
          
          debugLog('✅ PNR Validation SUCCESS');
          
          return {
            isValid: true,
            confidence: 100,
            apiProvider: 'api_verified',
            ticketData: {
              bus_operator: matchingTicket.bus_operator || detectedOperator || 'API_VERIFIED',
              departure_date: formattedDate,
              departure_time: formattedTime,
              from_location: matchingTicket.source_location || 'Unknown',
              to_location: matchingTicket.destination_location || 'Unknown',
              passenger_name: matchingTicket.passenger_name || 'Unknown',
              seat_number: matchingTicket.seat_number || 'Unknown',
              ticket_price: matchingTicket.ticket_price || 0
            }
          };
        } else {
          debugError('❌ Name mismatch', { apiName, userProvidedName });
          return {
            isValid: false,
            error: `PNR found but passenger name doesn't match. Expected: "${matchingTicket.passenger_name}", Got: "${ticketData.passengerName}". Please verify your details.`
          };
        }
      } else {
        debugError('❌ PNR not found in API response', { 
          searchedPNR: cleanPNR, 
          availablePNRs: tickets.map(t => t.pnr_number) 
        });
        return {
          isValid: false,
          error: `PNR "${cleanPNR}" not found in the ticket database. Available PNRs: ${tickets.map(t => t.pnr_number).join(', ')}`
        };
      }
      
    } catch (apiError) {
      debugError('API Error:', apiError);
      
      // Check if it's a network/CORS error
      if (apiError.name === 'AbortError') {
        return {
          isValid: false,
          error: `API request timed out after 10 seconds. The API server might be slow or unresponsive.`
        };
      } else if (apiError.name === 'TypeError' && apiError.message.includes('fetch')) {
        return {
          isValid: false,
          error: `Cannot connect to ticket validation API. The API server might be down or not accessible. Error: ${apiError.message}`
        };
      }
      
      return {
        isValid: false,
        error: `API Error: ${apiError.message}. Please check if the API is running and accessible.`
      };
    }

  } catch (error) {
    debugError('PNR Validation Error:', error);
    return {
      isValid: false,
      error: `Validation failed: ${error.message}`
    };
  }
};

/**
 * Auto-detect bus operator from PNR
 * @param {string} pnr - PNR number
 * @returns {string} - Detected operator ID or 'unknown'
 */
export const detectOperatorFromPNR = (pnr) => {
  const cleanPNR = pnr.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  const patterns = {
    redbus: /^[A-Z]{2}\d{8,10}$/,
    abhibus: /^[A-Z]{3}\d{6,8}$/,
    makemytrip: /^MMT\d{8}$/,
    paytm: /^PTM[A-Z0-9]{8}$/,
    ksrtc: /^KA\d{8}$/,
    msrtc: /^MH\d{8}$/,
    tsrtc: /^TS\d{8}$/
  };

  for (const [operatorId, pattern] of Object.entries(patterns)) {
    if (pattern.test(cleanPNR)) {
      return operatorId;
    }
  }

  return 'unknown';
};

// Helper function to format PNR
export const formatPNR = (pnr) => {
  return pnr.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

// Backward compatibility
export const validatePNR = validatePNRInBackground;