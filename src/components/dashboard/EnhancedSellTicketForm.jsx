
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validatePNRInBackground, formatPNR } from "@/utils/pnrValidation";
import { Loader, CheckCircle, XCircle } from "lucide-react";
import FileUpload from "@/components/ui/file-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


/**
 * @typedef {Object} EnhancedSellTicketFormProps
 * @property {any} user
 */

export const EnhancedSellTicketForm = ({ user }) => {
  const [formData, setFormData] = useState({
    ticket_type: "bus",
    pnr_number: "",
    bus_operator: "",
    passenger_name: "",
    // Auto-filled fields after validation
    departure_date: "",
    departure_time: "",
    from_location: "",
    to_location: "",
    seat_number: "",
    ticket_price: "",
    selling_price: "",
  });
  
  const [pnrValidation, setPnrValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  const { toast } = useToast();

  const handlePNRValidation = async () => {
    if (!formData.pnr_number || !formData.passenger_name) {
      toast({
        title: "Required Fields",
        description: "Please enter PNR number and passenger name",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    setPnrValidation(null);
    
    try {
      // Validate with only PNR, operator, and passenger name
      const result = await validatePNRInBackground(formData.pnr_number, formData.bus_operator, {
        passengerName: formData.passenger_name
      });
      
      console.log('PNR Validation Result:', result);
      setPnrValidation(result);
      
      if (result.isValid && result.details) {
        // Auto-fill ALL fields from API response and set selling price same as ticket price
        setFormData(prev => ({
          ...prev,
          pnr_number: result.details.pnr,
          passenger_name: result.details.passengerName,
          from_location: result.details.from,
          to_location: result.details.to,
          departure_date: result.details.dateOfJourney,
          departure_time: result.details.departureTime || '00:00',
          bus_operator: result.details.busOperator,
          seat_number: result.details.seatNumber,
          ticket_price: result.details.ticketPrice || '',
          selling_price: result.details.ticketPrice || '' // Same as API price
        }));
        
        toast({
          title: "Ticket Verified Successfully",
          description: "All details auto-filled from API. Price set to original ticket price.",
        });
      } else {
        toast({
          title: "Invalid Ticket",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Failed to validate ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const uploadFilesToStorage = async (ticketId, files) => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${ticketId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('ticket-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Record file metadata in database
      await (supabase).from('ticket_documents').insert({
        ticket_id: ticketId,
        file_name: file.name,
        file_path: fileName,
        file_type: file.type
      });

      return fileName;
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!pnrValidation?.isValid) {
      toast({
        title: "PNR Validation Required",
        description: "Please validate your PNR before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Save to Supabase with verification status based on API validation
      const { data: insertedTicket, error } = await supabase.from('tickets').insert({
        ...formData,
        pnr_number: formatPNR(formData.pnr_number),
        ticket_price: parseFloat(formData.ticket_price),
        selling_price: parseFloat(formData.selling_price),
        seller_id: user.id,
        status: 'available',
        verification_status: pnrValidation.isValid ? 'verified' : 'invalid',
        api_provider: pnrValidation.apiProvider || 'unknown',
        verification_confidence: pnrValidation.confidence || 0
      }).select().single();

      if (error) throw error;

      // Upload files if any
      if (uploadedFiles.length > 0 && insertedTicket) {
        try {
          await uploadFilesToStorage(insertedTicket.id, uploadedFiles);
          toast({
            title: "Files Uploaded",
            description: `${uploadedFiles.length} document(s) uploaded successfully`,
          });
        } catch (uploadError) {
          toast({
            title: "File Upload Warning",
            description: "Ticket listed but some files failed to upload",
            variant: "destructive",
          });
        }
      } else if (result.isValid && result.ticketData) {
        // Handle the actual API response structure
        setFormData(prev => ({
          ...prev,
          pnr_number: formData.pnr_number,
          passenger_name: result.ticketData.passenger_name || formData.passenger_name,
          from_location: result.ticketData.from_location,
          to_location: result.ticketData.to_location,
          departure_date: result.ticketData.departure_date,
          departure_time: result.ticketData.departure_time || '00:00',
          bus_operator: result.ticketData.bus_operator,
          seat_number: result.ticketData.seat_number,
          ticket_price: result.ticketData.ticket_price || '',
          selling_price: result.ticketData.ticket_price || ''
        }));
        
        toast({
          title: "Ticket Verified Successfully",
          description: `Verified with ${result.apiProvider} (${result.confidence}% confidence)`,
        });
      }

      toast({
        title: pnrValidation.isValid ? "Ticket Verified & Listed" : "Ticket Listed as Unverified",
        description: pnrValidation.isValid 
          ? "Your ticket has been validated and is now available for purchase" 
          : "Your ticket credentials could not be verified with the API",
        variant: pnrValidation.isValid ? "default" : "destructive"
      });

      // Reset form
      setFormData({
        pnr_number: "",
        bus_operator: "",
        passenger_name: "",
        departure_date: "",
        departure_time: "",
        from_location: "",
        to_location: "",
        seat_number: "",
        ticket_price: "",
        selling_price: "",
      });
      setPnrValidation(null);
      
    } catch (error) {
      console.error('PNR Validation Error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to list your ticket. Please try again.",
        variant: "destructive",
      });
      setPnrValidation({
        isValid: false,
        error: `Validation failed: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Debug Panel Toggle */}
      {import.meta.env.DEV && (
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
          >
            {showDebugPanel ? 'Hide' : 'Show'} Debug Panel
          </Button>
        </div>
      )}
      
      
      <Card>
        <CardHeader>
          <CardTitle>Sell Your Ticket</CardTitle>
          <CardDescription>List your ticket for sale with PNR validation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ticket Type Dropdown */}
            <div>
              <Label htmlFor="ticket_type">Ticket Type *</Label>
              <Select
                value={formData.ticket_type}
                onValueChange={(value) => setFormData({ ...formData, ticket_type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ticket type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bus">Bus</SelectItem>
                  <SelectItem value="train">Train</SelectItem>
                  <SelectItem value="plane">Plane</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Simplified Input Section - Only 3 required fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="pnr">PNR Number</Label>
                <Input
                  id="pnr"
                  value={formData.pnr_number}
                  onChange={(e) => setFormData({...formData, pnr_number: e.target.value.toUpperCase()})}
                  placeholder="Enter PNR number"
                  className={pnrValidation?.isValid ? "border-green-500" : pnrValidation?.error ? "border-red-500" : ""}
                  required
                />
              </div>
              <div>
                <Label htmlFor="passenger_name">Passenger Name</Label>
                <Input
                  id="passenger_name"
                  value={formData.passenger_name}
                  onChange={(e) => setFormData({...formData, passenger_name: e.target.value})}
                  placeholder="Passenger name on ticket"
                  required
                />
              </div>
              <div>
                <Label htmlFor="bus_operator">Bus Operator (Optional)</Label>
                <Input
                  id="bus_operator"
                  value={formData.bus_operator}
                  onChange={(e) => setFormData({...formData, bus_operator: e.target.value})}
                  placeholder="e.g., RedBus, KSRTC"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handlePNRValidation}
              disabled={isValidating || !formData.pnr_number || !formData.passenger_name}
              className="w-full"
            >
              {isValidating ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Validating Ticket...
                </>
              ) : pnrValidation?.isValid ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Ticket Verified
                </>
              ) : pnrValidation?.error ? (
                <>
                  <XCircle className="h-4 w-4 mr-2 text-red-600" />
                  Validation Failed - Try Again
                </>
              ) : (
                "Validate & Verify Ticket"
              )}
            </Button>

            {pnrValidation?.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{pnrValidation.error}</p>
                {import.meta.env.DEV && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">Debug Info</summary>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify(pnrValidation, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {pnrValidation?.isValid && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-3">
                <p className="text-sm text-green-600 font-medium">✓ Ticket verified successfully!</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div><strong>From:</strong> {formData.from_location}</div>
                  <div><strong>To:</strong> {formData.to_location}</div>
                  <div><strong>Date:</strong> {formData.departure_date}</div>
                  <div><strong>Price:</strong> ₹{formData.ticket_price}</div>
                </div>
                <p className="text-xs text-green-600">All details auto-filled from verified ticket data.</p>
                {import.meta.env.DEV && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">Debug Info</summary>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify(pnrValidation, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={!pnrValidation?.isValid || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Listing Ticket...
                </>
              ) : (
                "List Ticket for Sale"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
