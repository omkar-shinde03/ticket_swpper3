
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Ticket, MessageSquare, CreditCard, Search } from "lucide-react";

/**
 * @typedef {Object} EmptyStateProps
 * @property {"tickets" | "available-tickets" | "messages" | "transactions" | "search"} type
 * @property {string} title
 * @property {string} description
 * @property {string} [actionLabel]
 * @property {() => void} [onAction]
 */

export const EmptyState = ({ type, title, description, actionLabel, onAction }) => {
  const getIcon = () => {
    switch (type) {
      case "tickets":
        return <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />;
      case "available-tickets":
        return <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />;
      case "messages":
        return <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />;
      case "transactions":
        return <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />;
      case "search":
        return <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />;
      default:
        return <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />;
    }
  };

  return (
    <Card>
      <CardContent className="text-center py-12">
        {getIcon()}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-500 mb-4">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="outline">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
