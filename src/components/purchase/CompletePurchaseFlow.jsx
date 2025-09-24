import React from 'react';
import { RazorpayEscrowPayment } from '@/components/payments/RazorpayEscrowPayment';

export const CompletePurchaseFlow = ({ ticket, isOpen, onClose, onSuccess }) => {
  return (
    <RazorpayEscrowPayment
      ticket={ticket}
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};