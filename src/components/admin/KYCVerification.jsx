
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Mail, UserCheck } from "lucide-react";

/**
 * @typedef {Object} Profile
 * @property {string} id
 * @property {string|null} full_name
 * @property {string|null} phone
 * @property {string} user_type
 * @property {string} kyc_status
 * @property {string} created_at
 */

/**
 * @typedef {Object} KYCVerificationProps
 * @property {Profile[]} users
 * @property {Function} onUpdate
 */

export const KYCVerification = ({ users, onUpdate }) => {
  const [loading, setLoading] = useState(null);
  const { toast } = useToast();

  // Filter users who need KYC verification (not verified)
  const pendingUsers = users.filter(user => 
    user.kyc_status !== 'verified' && user.user_type !== 'admin'
  );

  const verifiedUsers = users.filter(user => 
    user.kyc_status === 'verified' && user.user_type !== 'admin'
  );

  const sendVerificationEmail = async (userEmail, userName, status) => {
    try {
      // Import the email service dynamically
      const { sendEmail } = await import('@/utils/emailService');
      
      const subject = status === 'verified' 
        ? '🎉 Your KYC Verification is Complete!' 
        : 'KYC Verification Update';
      
      const body = status === 'verified'
        ? `Dear ${userName || 'User'},

🎉 Congratulations! Your KYC verification has been successfully completed.

Your account is now fully verified and you can:
• Access all platform features
• Buy and sell tickets without restrictions
• Enjoy enhanced security and trust

Thank you for your patience during the verification process.

Best regards,
TicketSwapper Team`
        : `Dear ${userName || 'User'},

Your KYC verification has been ${status}.

${status === 'rejected' 
  ? 'Please review your submitted documents and try again with correct information. If you have any questions, please contact our support team.'
  : 'Your verification is currently being processed. We will notify you once it is complete.'
}

Best regards,
TicketSwapper Team`;

      const emailResult = await sendEmail({
        to: userEmail,
        subject: subject,
        body: body
      });

      if (emailResult.success) {
        console.log('Verification email sent successfully');
        return true;
      } else {
        console.error('Failed to send verification email:', emailResult.error);
        return false;
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  };

  const handleVerifyKYC = async (user) => {
    setLoading(user.id);
    try {
      console.log('🔍 Starting KYC verification for user:', user.id);
      console.log('📊 Current user data:', user);
      
      // First, verify that the current user is an admin
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', currentUser.id)
        .single();
      
      if (adminError || adminProfile?.user_type !== 'admin') {
        console.error('❌ Current user is not an admin:', adminProfile?.user_type);
        throw new Error('Admin privileges required for KYC verification');
      }
      
      console.log('✅ Admin privileges confirmed');
      
      // Update user's KYC status to verified
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select();

      if (updateError) {
        console.error('❌ Failed to update profile KYC status:', updateError);
        console.error('❌ Error details:', updateError);
        throw updateError;
      }

      console.log('✅ Profile KYC status updated successfully:', updateData);
      console.log('✅ Updated user data:', updateData);

      // Verify the update by fetching the user again
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (verifyError) {
        console.error('❌ Failed to verify update:', verifyError);
      } else {
        console.log('✅ Verification - User KYC status is now:', verifyData.kyc_status);
      }

      // Update video_calls status if there are pending calls
      const { error: callsError } = await supabase
        .from('video_calls')
        .update({ 
          status: 'completed',
          verification_result: 'approved',
          verification_notes: 'KYC verified by admin',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .in('status', ['waiting_admin', 'admin_connected', 'in_call']);

      if (callsError) {
        console.warn('⚠️ Failed to update video calls:', callsError);
      } else {
        console.log('✅ Video calls updated to completed');
      }

      // Update user_documents verification status
      try {
        console.log('🔍 Checking user documents for user:', user.id);
        
        // First check if user has any documents
        const { data: existingDocs, error: checkError } = await supabase
          .from('user_documents')
          .select('*')
          .eq('user_id', user.id);

        if (checkError) {
          console.warn('⚠️ Failed to check user documents:', checkError);
          console.warn('⚠️ Check error details:', checkError);
        } else {
          console.log('📄 Found documents:', existingDocs);
          
          if (existingDocs && existingDocs.length > 0) {
            console.log('📄 Found', existingDocs.length, 'documents for user');
            console.log('📄 Document structure:', existingDocs[0]);
            
            // Update only documents that are pending
            const { error: docsError } = await supabase
              .from('user_documents')
              .update({ 
                verification_status: 'verified'
              })
              .eq('user_id', user.id)
              .eq('verification_status', 'pending');

            if (docsError) {
              console.warn('⚠️ Failed to update user documents:', docsError);
              console.warn('⚠️ Update error details:', docsError);
            } else {
              console.log('✅ User documents marked as verified');
            }
          } else {
            console.log('ℹ️ No documents found for user, skipping document update');
          }
        }
      } catch (docsUpdateError) {
        console.warn('⚠️ Error in document update process:', docsUpdateError);
        console.warn('⚠️ Error stack:', docsUpdateError.stack);
      }

      // Send verification confirmation email
      const emailSent = await sendVerificationEmail(
        user.email, 
        user.full_name, 
        'verified'
      );

      console.log('📧 Verification email result:', emailSent ? 'Sent' : 'Failed');

      toast({
        title: "KYC Verified Successfully! 🎉",
        description: `User ${user.full_name || user.email} has been verified. ${emailSent ? 'Confirmation email sent.' : 'Email notification failed.'}`,
      });

      // Force refresh the data to update the UI
      console.log('🔄 Calling onUpdate to refresh data...');
      onUpdate();
      
      // Also force a direct refresh after a short delay
      setTimeout(() => {
        console.log('🔄 Force refreshing data after delay...');
        onUpdate();
      }, 1000);
      
      console.log('✅ KYC verification process completed successfully');
    } catch (error) {
      console.error('❌ KYC verification failed:', error);
      console.error('❌ Error stack:', error.stack);
      toast({
        title: "KYC Verification Failed",
        description: error.message || "Failed to verify KYC. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleRejectKYC = async (user) => {
    setLoading(user.id);
    try {
      console.log('🔍 Starting KYC rejection for user:', user.id);
      
      // Update user's KYC status to rejected
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Failed to update profile KYC status:', updateError);
        throw updateError;
      }

      console.log('✅ Profile KYC status updated to rejected');

      // Update video_calls status if there are pending calls
      const { error: callsError } = await supabase
        .from('video_calls')
        .update({ 
          status: 'completed',
          verification_result: 'rejected',
          verification_notes: 'KYC rejected by admin',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .in('status', ['waiting_admin', 'admin_connected', 'in_call']);

      if (callsError) {
        console.warn('⚠️ Failed to update video calls:', callsError);
      } else {
        console.log('✅ Video calls updated to completed');
      }

      // Update user_documents verification status
      const { error: docsError } = await supabase
        .from('user_documents')
        .update({ 
          verification_status: 'rejected',
          uploaded_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('verification_status', 'pending');

      if (docsError) {
        console.warn('⚠️ Failed to update user documents:', docsError);
      } else {
        console.log('✅ User documents marked as rejected');
      }

      // Send rejection email
      const emailSent = await sendVerificationEmail(
        user.email, 
        user.full_name, 
        'rejected'
      );

      console.log('📧 Rejection email result:', emailSent ? 'Sent' : 'Failed');

      toast({
        title: "KYC Rejected",
        description: `User ${user.full_name || user.email} KYC has been rejected. ${emailSent ? 'Rejection email sent.' : 'Email notification failed.'}`,
        variant: "destructive",
      });

      // Refresh the data to update the UI
      onUpdate();
      
      console.log('✅ KYC rejection process completed successfully');
    } catch (error) {
      console.error('❌ KYC rejection failed:', error);
      toast({
        title: "KYC Rejection Failed",
        description: error.message || "Failed to reject KYC. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            KYC Verification
          </CardTitle>
          <CardDescription>Review and approve pending KYC verifications</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found for KYC verification
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg mb-2 bg-card">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{user.full_name || 'Unknown User'}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                    {user.phone && (
                      <p className="text-sm text-muted-foreground mb-2">📱 {user.phone}</p>
                    )}
                    <Badge 
                      variant="outline" 
                      className={
                        user.kyc_status === 'pending' 
                          ? 'text-orange-700 bg-orange-100 border-orange-300' 
                          : user.kyc_status === 'verified' 
                          ? 'text-green-700 bg-green-100 border-green-300' 
                          : 'text-red-700 bg-red-100 border-red-300'
                      }
                    >
                      {user.kyc_status === 'pending' ? '⏳ Pending' : 
                       user.kyc_status === 'verified' ? '✅ Verified' : 
                       '❌ Rejected'}
                    </Badge>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button 
                      onClick={() => handleVerifyKYC(user)} 
                      disabled={user.kyc_status === 'verified' || loading === user.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading === user.id ? (
                        'Verifying...'
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleRejectKYC(user)} 
                      disabled={user.kyc_status === 'verified' || user.kyc_status === 'rejected' || loading === user.id}
                    >
                      {loading === user.id ? (
                        'Processing...'
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verified Users Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Verified Users ({verifiedUsers.length})
          </CardTitle>
          <CardDescription>
            Users who have completed KYC verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verifiedUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No verified users yet
            </div>
          ) : (
            <div className="space-y-4">
              {verifiedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg mb-2 bg-green-50 border-green-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {user.full_name || 'Unknown User'}
                        </h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">{user.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-100 text-green-700 border-green-300">
                      Verified
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
