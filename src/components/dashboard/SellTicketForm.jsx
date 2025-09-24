import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmailVerificationGuard from "./EmailVerificationGuard";
import { NewTicketVerificationSystem } from "./NewTicketVerificationSystem";

export const SellTicketForm = ({ user, onTicketAdded }) => {
  return (
    <EmailVerificationGuard requiredFor="sell tickets">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2 text-2xl">
            <span>Sell Your Ticket</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NewTicketVerificationSystem onComplete={onTicketAdded} />
        </CardContent>
      </Card>
    </EmailVerificationGuard>
  );
};