import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VideoIcon, Mic, MicOff, VideoOff, Phone, CheckCircle, X, User, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { joinSignalingChannel, sendSignal, leaveSignalingChannel } from '@/utils/webrtcSignaling';
import { generateJitsiKycLink } from '@/utils/jitsiUtils';

export const VideoKYCVerification = ({ users, onUpdate }) => {
  const [activeCall, setActiveCall] = useState(null);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [pendingUsers, setPendingUsers] = useState([]);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);
  const [peerConnection, setPeerConnection] = useState(null);
  const [callId, setCallId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [disconnected, setDisconnected] = useState(false);
  const [authError, setAuthError] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  const [showPickCallDialog, setShowPickCallDialog] = useState(false);
  const { data: user } = supabase.auth.getUser();
  const [pendingVideoKYCRequests, setPendingVideoKYCRequests] = useState([]);
  const [adminConnected, setAdminConnected] = useState(false);

  useEffect(() => {
    // Filter users with pending KYC
    const pending = users.filter(user => 
      user.kyc_status === 'pending' || user.kyc_status === 'not_verified'
    );
    setPendingUsers(pending);
  }, [users]);

  // Real-time subscription for incoming calls (admin side)
  useEffect(() => {
    if (user?.id) {
      const channel = supabase
        .channel('video_calls_realtime_admin')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'video_calls',
          filter: `status=eq.waiting_admin`
        }, payload => {
          // Only show for real users, not admin
          if (payload.new && payload.new.user_id && payload.new.user_id !== user?.id) {
            setIncomingCall(payload.new);
            setShowPickCallDialog(true);
          }
          if (payload.new.status === 'completed') {
            endVideoCall();
          }
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, [user]);

  // Fetch all pending video KYC requests for admin
  useEffect(() => {
    async function fetchPendingVideoKYC() {
      const { data, error } = await supabase
        .from('video_calls')
        .select(`
          id, 
          user_id, 
          status, 
          created_at, 
          call_link
        `)
        .eq('status', 'waiting_admin')
        .order('created_at', { ascending: false });
      
      // If we have data, fetch the related profile information separately
      if (data && !error) {
        const userIds = data.map(call => call.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone, kyc_status')
            .in('id', userIds);
          
          if (!profilesError && profilesData) {
            // Merge the profile data with video calls data
            const enrichedData = data.map(call => {
              const profile = profilesData.find(p => p.id === call.user_id);
              return {
                ...call,
                profile: profile || null
              };
            });
            setPendingVideoKYCRequests(enrichedData);
            return;
          }
        }
      }
      
      if (!error) setPendingVideoKYCRequests(data || []);
    }
    fetchPendingVideoKYC();
    // Subscribe to real-time changes in video_calls
    const channel = supabase
      .channel('video_calls_pending_kyc')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_calls' }, fetchPendingVideoKYC)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' }
      ],
    });
    pc.onicecandidate = (event) => {
      if (event.candidate && callId) {
        console.log('[Admin] Sending ICE candidate:', event.candidate);
        sendSignal(callId, { type: 'ice-candidate', candidate: event.candidate });
      }
    };
    pc.ontrack = (event) => {
      console.log('[Admin] ontrack event:', event);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        console.log('[Admin] Remote stream set');
      }
    };
    pc.onconnectionstatechange = () => {
      console.log('[Admin] Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setStatusMessage('Admin Connected');
        setAdminConnected(true);
      }
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        endVideoCall();
      }
    };
    return pc;
  };



  const handleAcceptCall = async (req) => {
    try {
      await supabase
        .from('video_calls')
        .update({ status: 'in_call' })
        .eq('id', req.id);
      setShowPickCallDialog(false);
      setCallId(req.id);
      setShowVideoDialog(true);
      // Get admin media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      const pc = createPeerConnection();
      setPeerConnection(pc);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      joinSignalingChannel(req.id, async (msg) => {
        if (msg.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
          setStatusMessage('User connected. In Call.');
          toast({ title: 'User Connected', description: 'The user has joined the call.' });
        } else if (msg.type === 'ice-candidate' && msg.candidate) {
          try { await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)); } catch {}
        }
      });
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setStatusMessage('Admin Connected');
          setAdminConnected(true);
        }
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          endVideoCall();
        }
      };
      // Create offer and send to user
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal(req.id, { type: 'offer', offer });
      sendSignal(req.id, { type: 'admin-joined' });
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to start video call', variant: 'destructive' });
    }
  };

  const handleRejectCall = async () => {
    if (!incomingCall) return;
    await supabase
      .from('video_calls')
      .update({ status: 'rejected' })
      .eq('id', incomingCall.id);
    setShowPickCallDialog(false);
    setIncomingCall(null);
  };

  const endVideoCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    leaveSignalingChannel();
    setShowVideoDialog(false);
    setActiveCall(null);
    setVerificationNotes("");
    setShowPickCallDialog(false);
    setIncomingCall(null);
    setAdminConnected(false);
  };

  const approveKYC = async () => {
    if (!activeCall) return;
    setActionLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'verified',
          kyc_verified_at: new Date().toISOString(),
          kyc_notes: verificationNotes
        })
        .eq('id', activeCall.id);

      if (error) throw error;

      // Update video call record
      await supabase
        .from('video_calls')
        .update({ 
          status: 'completed',
          verification_result: 'approved',
          admin_notes: verificationNotes
        })
        .eq('user_id', activeCall.id);

      toast({
        title: "KYC Approved",
        description: `${activeCall.full_name || activeCall.email} has been verified successfully.`,
      });
      
      endVideoCall();
      onUpdate();
    } catch (error) {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const rejectKYC = async () => {
    if (!activeCall) return;
    setActionLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'rejected',
          kyc_notes: verificationNotes
        })
        .eq('id', activeCall.id);

      if (error) throw error;

      // Update video call record
      await supabase
        .from('video_calls')
        .update({ 
          status: 'completed',
          verification_result: 'rejected',
          admin_notes: verificationNotes
        })
        .eq('user_id', activeCall.id);

      toast({
        title: "KYC Rejected",
        description: `${activeCall.full_name || activeCall.email} verification has been rejected.`,
        variant: "destructive",
      });
      
      endVideoCall();
      onUpdate();
    } catch (error) {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const viewDocument = async (user) => {
    if (user.kyc_document_url) {
      const { data } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(user.kyc_document_url, 60);
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    }
  };

  const handleSendVideoCallLink = async (user) => {
    const link = generateJitsiKycLink();
    const subject = 'Your Video KYC Call Link';
    const body = `Dear ${user.full_name || user.email},\n\nYour video KYC verification call is ready. Please join the call at your scheduled time using the link below:\n\n${link}\n\nThank you,\nTicketSwapper Team`;
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: { to: user.email, subject, body }
      });
      if (error) throw error;
      toast({ title: 'Video Call Link Sent', description: `Link sent to ${user.email}` });
    } catch (err) {
      toast({ title: 'Failed to Send Email', description: err.message, variant: 'destructive' });
    }
  };

  const filteredPendingUsers = pendingUsers.filter(u => u.user_type !== 'admin');

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Video KYC Verification</CardTitle>
            <CardDescription>
              Conduct video verification for pending KYC applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* UI: List all pending video KYC requests */}
              {pendingVideoKYCRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No pending KYC verifications</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingVideoKYCRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{req.profile?.full_name || req.profile?.email || 'Unknown User'}</h4>
                          <p className="text-sm text-gray-500">{req.profile?.phone || 'No phone'}</p>
                          <Badge variant="outline" className="text-orange-700 bg-orange-100">Pending Review</Badge>
                          {req.call_link && (
                            <div className="mt-2">
                              <span className="text-xs text-blue-700 break-all">Video Link: </span>
                              <a href={req.call_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 underline">{req.call_link}</a>
                              <Button size="sm" className="ml-2 px-2 py-1" onClick={() => window.open(req.call_link, '_blank')}>Join</Button>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Banner */}
        {statusMessage && (
          <div role="status" aria-live="polite" className={`mb-4 p-2 rounded text-center font-medium ${disconnected ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'} focus:outline-none focus:ring-2 focus:ring-blue-500`}>{statusMessage}</div>
        )}
        {authError && (
          <div className="mb-2 p-2 rounded bg-red-100 text-red-800 text-center font-medium" role="alert">
            {authError}
          </div>
        )}
        {/* Video Call Dialog */}
        <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
          <DialogContent className="max-w-6xl h-[90vh]">
            <DialogHeader>
              <DialogTitle>KYC Video Verification - {activeCall?.profile?.full_name || activeCall?.profile?.email || 'Unknown User'}</DialogTitle>
              <DialogDescription>
                Verify the user's identity by examining their Aadhaar card
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              {/* User Video */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="User video preview"
                />
                <div className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
                  User: {activeCall?.profile?.full_name || activeCall?.profile?.email || 'Unknown User'}
                </div>
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <VideoIcon className="h-12 w-12 text-gray-400 mb-2 mx-auto" />
                    <span className="text-gray-400 text-sm">User Camera</span>
                  </div>
                </div>
              </div>

              {/* Admin Video */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Admin video preview"
                />
                <div className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
                  You (Admin)
                </div>
                {isVideoOff && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <VideoOff className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Verification Panel */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Verification Checklist</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Verify face matches Aadhaar photo</li>
                    <li>• Check Aadhaar card authenticity</li>
                    <li>• Confirm personal details</li>
                    <li>• Ensure clear document visibility</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Verification Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add verification notes here..."
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={approveKYC}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Approving...' : <CheckCircle className="h-4 w-4 mr-2" />}
                    {actionLoading ? '' : 'Approve'}
                  </Button>
                  <Button
                    onClick={rejectKYC}
                    variant="destructive"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Rejecting...' : <X className="h-4 w-4 mr-2" />}
                    {actionLoading ? '' : 'Reject'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Call Controls */}
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={`rounded-full h-12 w-12 flex items-center justify-center ${isMuted ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    tabIndex={0}
                    onClick={toggleMute}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{isMuted ? 'Unmute Microphone' : 'Mute Microphone'}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={`rounded-full h-12 w-12 flex items-center justify-center ${isVideoOff ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    aria-label={isVideoOff ? 'Turn on video' : 'Turn off video'}
                    tabIndex={0}
                    onClick={toggleVideo}
                  >
                    {isVideoOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{isVideoOff ? 'Turn On Video' : 'Turn Off Video'}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full h-12 w-12 flex items-center justify-center bg-red-100 text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    aria-label="End call"
                    tabIndex={0}
                    onClick={endVideoCall}
                  >
                    <Phone className="h-5 w-5 rotate-45" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>End Call</TooltipContent>
              </Tooltip>
            </div>
            {/* Loading overlays */}
            {actionLoading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
                  <span className="text-blue-700 font-medium text-lg">
                    Processing...
                  </span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {showPickCallDialog && (
          <Dialog open={showPickCallDialog} onOpenChange={setShowPickCallDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Incoming Video Call</DialogTitle>
                <DialogDescription>
                  Video KYC call is incoming. Would you like to pick the call?
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-4 mt-4">
                <Button onClick={handleAcceptCall}>Pick Call</Button>
                <Button variant="outline" onClick={handleRejectCall}>Reject</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
};