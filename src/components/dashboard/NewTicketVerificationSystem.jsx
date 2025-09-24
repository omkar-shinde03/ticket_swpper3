import React, { useState } from 'react';
import { TicketVerificationForm } from './TicketVerificationForm';
import { VerifiedTicketListing } from './VerifiedTicketListing';

export const NewTicketVerificationSystem = ({ onComplete }) => {
  const [verifiedTicketData, setVerifiedTicketData] = useState(null);
  const [step, setStep] = useState('verify');

  const handleVerificationComplete = (ticketData) => {
    setVerifiedTicketData(ticketData);
    setStep('list');
  };

  const handleListingComplete = (listedTicket) => {
    if (onComplete) {
      onComplete(listedTicket);
    }
    setStep('verify');
    setVerifiedTicketData(null);
  };

  if (step === 'list' && verifiedTicketData) {
    return (
      <VerifiedTicketListing
        verifiedTicketData={verifiedTicketData}
        onListingComplete={handleListingComplete}
      />
    );
  }

  return (
    <TicketVerificationForm onVerificationComplete={handleVerificationComplete} />
  );
};