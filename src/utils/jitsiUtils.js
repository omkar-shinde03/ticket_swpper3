// Utility to generate a unique Jitsi Meet link for KYC video calls
export function generateJitsiKycLink() {
  const random = Math.random().toString(36).substring(2, 10);
  return `https://meet.jit.si/kyc-${random}`;
}
