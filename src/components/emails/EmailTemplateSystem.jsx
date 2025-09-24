import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EmailTemplateSystem = () => {
  const [emailData, setEmailData] = useState({
    to: '',
    template: '',
    subject: '',
    customMessage: ''
  });
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const emailTemplates = [
    { id: 'verification', name: 'Email Verification', icon: Mail },
    { id: 'ticket_confirmation', name: 'Ticket Purchase Confirmation', icon: CheckCircle },
    { id: 'kyc_approved', name: 'KYC Approved', icon: CheckCircle },
    { id: 'kyc_rejected', name: 'KYC Rejected', icon: XCircle },
    { id: 'payment_success', name: 'Payment Success', icon: CheckCircle },
    { id: 'custom', name: 'Custom Email', icon: FileText }
  ];

  const sendEmail = async () => {
    if (!emailData.to || !emailData.template) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailData.to,
          template: emailData.template === 'custom' ? undefined : emailData.template,
          subject: emailData.template === 'custom' ? emailData.subject : undefined,
          html: emailData.template === 'custom' ? emailData.customMessage : undefined,
          templateData: {
            name: emailData.to.split('@')[0],
            verificationUrl: `${window.location.origin}/verify-email`,
            dashboardUrl: `${window.location.origin}/dashboard`,
            reason: emailData.customMessage
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: "Email has been sent successfully",
      });

      setEmailData({ to: '', template: '', subject: '', customMessage: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Recipient Email</label>
          <Input
            type="email"
            placeholder="user@example.com"
            value={emailData.to}
            onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Email Template</label>
          <Select 
            value={emailData.template} 
            onValueChange={(value) => setEmailData(prev => ({ ...prev, template: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              {emailTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    <template.icon className="h-4 w-4" />
                    {template.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {emailData.template === 'custom' && (
          <>
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Email subject"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Email content..."
                value={emailData.customMessage}
                onChange={(e) => setEmailData(prev => ({ ...prev, customMessage: e.target.value }))}
                rows={6}
              />
            </div>
          </>
        )}

        {emailData.template && emailData.template !== 'custom' && (
          <div>
            <label className="text-sm font-medium">Additional Notes (Optional)</label>
            <Textarea
              placeholder="Additional information for the template..."
              value={emailData.customMessage}
              onChange={(e) => setEmailData(prev => ({ ...prev, customMessage: e.target.value }))}
              rows={3}
            />
          </div>
        )}

        <Button 
          onClick={sendEmail} 
          disabled={sending || !emailData.to || !emailData.template}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {sending ? 'Sending...' : 'Send Email'}
        </Button>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Available Templates:</h4>
          <div className="flex flex-wrap gap-2">
            {emailTemplates.map((template) => (
              <Badge key={template.id} variant="outline" className="flex items-center gap-1">
                <template.icon className="h-3 w-3" />
                {template.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTemplateSystem;