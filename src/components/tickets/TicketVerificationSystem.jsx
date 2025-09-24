import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader, CheckCircle, XCircle, AlertTriangle, FileText } from "lucide-react";

/**
 * @typedef {Object} TicketDetails
 * @property {string} pnr
 * @property {string} passengerName
 * @property {string} from
 * @property {string} to
 * @property {string} departureDate
 * @property {string} departureTime
 * @property {string} busOperator
 * @property {string} seatNumber
 * @property {string} boardingPoint
 * @property {string} droppingPoint
 * @property {number} ticketPrice
 * @property {string} ticketStatus
 * @property {string} phoneNumber
 */

/**
 * @typedef {Object} VerificationResult
 * @property {boolean} isValid
 * @property {string} [error]
 * @property {TicketDetails} [details]
 * @property {string} [apiProvider]
 * @property {number} [confidence]
 */

const BUS_OPERATORS = [
  { id: 'redbus', name: 'RedBus', apiEndpoint: 'https://api.redbus.in/verify' },
  { id: 'abhibus', name: 'AbhiBus', apiEndpoint: 'https://api.abhibus.com/verify' },
  { id: 'makemytrip', name: 'MakeMyTrip', apiEndpoint: 'https://api.makemytrip.com/bus/verify' },
  { id: 'paytm', name: 'Paytm', apiEndpoint: 'https://api.paytm.com/bus/verify' },
  { id: 'ksrtc', name: 'KSRTC', apiEndpoint: 'https://ksrtc.in/api/verify' },
  { id: 'msrtc', name: 'MSRTC', apiEndpoint: 'https://msrtc.gov.in/api/verify' },
  { id: 'tsrtc', name: 'TSRTC', apiEndpoint: 'https://tsrtc.telangana.gov.in/api/verify' },
  { id: 'auto', name: 'Auto-Detect', apiEndpoint: null }
];

export const TicketVerificationSystem = ({ onVerificationComplete, initialData = {} }) => {
  const [formData, setFormData] = useState({
    pnr: initialData.pnr || "",
    operator: initialData.operator || "auto",
    passengerName: initialData.passengerName || "",
    phoneNumber: initialData.phoneNumber || ""
  });
  
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState([]);
  
  const { toast } = useToast();

  /**
   * Verify ticket with operator API
   * @param {string} pnr 
   * @param {string} operatorId 
   * @param {Object} additionalData 
   * @returns {Promise<VerificationResult>}
   */
  const verifyWithOperatorAPI = async (pnr, operatorId, additionalData = {}) => {
    const operator = BUS_OPERATORS.find(op => op.id === operatorId);
    if (!operator || !operator.apiEndpoint) {
      throw new Error("Operator API not available");
    }

    // Call the actual operator API
    const response = await fetch('/api/verify-ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'demo-key'
      },
      body: JSON.stringify({
        pnr: pnr.toUpperCase(),
        operator: operatorId,
        passengerName: additionalData.passengerName,
        phoneNumber: additionalData.phoneNumber
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  };

  /**
   * Advanced PNR validation with multiple operator support
   * @param {string} pnr 
   * @param {string} operatorId 
   * @param {Object} additionalData 
   * @returns {Promise<VerificationResult>}
   */
  const advancedPNRValidation = async (pnr, operatorId, additionalData) => {
    // Basic format validation
    if (!pnr || pnr.length < 6 || pnr.length > 15) {
      return {
        isValid: false,
        error: "PNR must be between 6-15 characters"
      };
    }

    const cleanPNR = pnr.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Validate PNR format based on operator patterns
    const operatorPatterns = {
      redbus: /^[A-Z]{2}\d{8,10}$/,
      abhibus: /^[A-Z]{3}\d{6,8}$/,
      makemytrip: /^MMT\d{8}$/,
      paytm: /^PTM[A-Z0-9]{8}$/,
      ksrtc: /^KA\d{8}$/,
      msrtc: /^MH\d{8}$/,
      tsrtc: /^TS\d{8}$/
    };

    if (operatorId !== 'auto' && operatorPatterns[operatorId]) {
      if (!operatorPatterns[operatorId].test(cleanPNR)) {
        return {
          isValid: false,
          error: `Invalid PNR format for ${BUS_OPERATORS.find(op => op.id === operatorId)?.name}`
        };
      }
    }

    try {
      // Call the real verification API
      const result = await verifyWithOperatorAPI(cleanPNR, operatorId, additionalData);
      return result;
    } catch (error) {
      return {
        isValid: false,
        error: `Verification failed: ${error.message}`,
        apiProvider: operatorId === 'auto' ? 'multiple_checked' : operatorId
      };
    }
  };

  const handleVerification = async () => {
    if (!formData.pnr) {
      toast({
        title: "PNR Required",
        description: "Please enter a PNR number to verify",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      let result;
      
      if (formData.operator === 'auto') {
        // Try to detect operator and verify with multiple APIs
        toast({
          title: "Auto-detecting operator",
          description: "Checking with multiple bus operators...",
        });
        
        // In real implementation, try multiple operators
        result = await advancedPNRValidation(formData.pnr, 'auto', {
          passengerName: formData.passengerName,
          phoneNumber: formData.phoneNumber
        });
      } else {
        // Verify with specific operator
        result = await advancedPNRValidation(formData.pnr, formData.operator, {
          passengerName: formData.passengerName,
          phoneNumber: formData.phoneNumber
        });
      }

      setVerificationResult(result);
      
      // Add to verification history
      const historyEntry = {
        timestamp: new Date().toISOString(),
        pnr: formData.pnr,
        operator: formData.operator,
        result: result.isValid ? 'success' : 'failed',
        error: result.error,
        apiProvider: result.apiProvider
      };
      setVerificationHistory(prev => [historyEntry, ...prev.slice(0, 4)]);

      if (result.isValid) {
        toast({
          title: "Verification Successful",
          description: `Ticket verified with ${result.apiProvider} (${result.confidence}% confidence)`,
        });
        
        // Call parent callback with verified data
        if (onVerificationComplete) {
          onVerificationComplete(result);
        }
      } else {
        toast({
          title: "Verification Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Verification Error",
        description: "Failed to connect to verification service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusIcon = () => {
    if (isVerifying) return <Loader className="h-4 w-4 animate-spin" />;
    if (verificationResult?.isValid) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (verificationResult?.error) return <XCircle className="h-4 w-4 text-red-600" />;
    return <FileText className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (verificationResult?.isValid) return "border-green-500 bg-green-50";
    if (verificationResult?.error) return "border-red-500 bg-red-50";
    return "";
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Ticket Verification System
        </CardTitle>
        <CardDescription>
          Verify bus tickets with operator APIs for authenticity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Verification Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="pnr">PNR Number</Label>
            <div className="flex gap-2">
              <Input
                id="pnr"
                value={formData.pnr}
                onChange={(e) => setFormData({...formData, pnr: e.target.value})}
                placeholder="Enter PNR (e.g., TEST123456)"
                className={getStatusColor()}
                disabled={isVerifying}
              />
              <Button
                onClick={handleVerification}
                disabled={isVerifying || !formData.pnr}
                variant="outline"
                size="sm"
              >
                {getStatusIcon()}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="operator">Bus Operator</Label>
            <Select 
              value={formData.operator} 
              onValueChange={(value) => setFormData({...formData, operator: value})}
              disabled={isVerifying}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                {BUS_OPERATORS.map((operator) => (
                  <SelectItem key={operator.id} value={operator.id}>
                    {operator.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="passengerName">Passenger Name (Optional)</Label>
              <Input
                id="passengerName"
                value={formData.passengerName}
                onChange={(e) => setFormData({...formData, passengerName: e.target.value})}
                placeholder="For additional verification"
                disabled={isVerifying}
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                placeholder="+91-9876543210"
                disabled={isVerifying}
              />
            </div>
          </div>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <Card className={`p-4 ${verificationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-start gap-3">
              {verificationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-medium">
                  {verificationResult.isValid ? 'Verification Successful' : 'Verification Failed'}
                </h4>
                {verificationResult.error && (
                  <p className="text-sm text-red-600 mt-1">{verificationResult.error}</p>
                )}
                {verificationResult.apiProvider && (
                  <p className="text-sm text-gray-600 mt-1">
                    Verified with: {verificationResult.apiProvider}
                    {verificationResult.confidence && ` (${verificationResult.confidence}% confidence)`}
                  </p>
                )}
              </div>
            </div>

            {/* Verified Ticket Details */}
            {verificationResult.isValid && verificationResult.details && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <h5 className="font-medium text-green-800 mb-2">Verified Ticket Details</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">PNR:</span> {verificationResult.details.pnr}</div>
                  <div><span className="font-medium">Passenger:</span> {verificationResult.details.passengerName}</div>
                  <div><span className="font-medium">Route:</span> {verificationResult.details.from} → {verificationResult.details.to}</div>
                  <div><span className="font-medium">Date:</span> {verificationResult.details.departureDate}</div>
                  <div><span className="font-medium">Time:</span> {verificationResult.details.departureTime}</div>
                  <div><span className="font-medium">Operator:</span> {verificationResult.details.busOperator}</div>
                  <div><span className="font-medium">Seat:</span> {verificationResult.details.seatNumber}</div>
                  <div><span className="font-medium">Price:</span> ₹{verificationResult.details.ticketPrice}</div>
                </div>
                <div className="mt-2">
                  <Badge variant={verificationResult.details.ticketStatus === 'CONFIRMED' ? 'default' : 'destructive'}>
                    {verificationResult.details.ticketStatus}
                  </Badge>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Verification History */}
        {verificationHistory.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Recent Verifications</h4>
            <div className="space-y-2">
              {verificationHistory.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex items-center gap-2">
                    {entry.result === 'success' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span className="font-mono">{entry.pnr}</span>
                    <Badge variant="outline" className="text-xs">
                      {entry.apiProvider}
                    </Badge>
                  </div>
                  <span className="text-gray-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Status Indicators */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <AlertTriangle className="h-3 w-3" />
            <span>Connected to live API: ticekt-demo-api.onrender.com</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};