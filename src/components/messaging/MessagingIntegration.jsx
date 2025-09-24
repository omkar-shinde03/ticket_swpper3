import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare } from "lucide-react";
import { EnhancedMessagingSystem } from "./EnhancedMessagingSystem";

export const MessagingIntegration = ({ 
  ticket, 
  currentUserId, 
  triggerText = "Message Seller",
  triggerVariant = "outline",
  triggerSize = "sm"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!ticket || !currentUserId || !ticket.seller_id || ticket.seller_id === currentUserId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            Message about {ticket.bus_operator} - {ticket.from_location} → {ticket.to_location}
          </DialogTitle>
          <DialogDescription>
            PNR: {ticket.pnr_number} • Departure: {ticket.departure_date} at {ticket.departure_time}
          </DialogDescription>
        </DialogHeader>
        <div className="h-[600px]">
          <EnhancedMessagingSystem
            ticketId={ticket.id}
            currentUserId={currentUserId}
            otherUserId={ticket.seller_id}
            otherUserName={ticket.seller_name || "Seller"}
            otherUserAvatar={ticket.seller_avatar}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};