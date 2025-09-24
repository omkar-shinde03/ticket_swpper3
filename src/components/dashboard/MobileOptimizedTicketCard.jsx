
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, IndianRupee, User, Bus, Loader2, MessageSquare, Heart, Share2, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

/**
 * @typedef {Object} MobileOptimizedTicketCardProps
 * @property {any} ticket
 * @property {(ticket: any, action: string) => void} [onAction]
 * @property {boolean} [showActions]
 * @property {boolean} [isProcessing]
 * @property {boolean} [isFavorite]
 * @property {(ticket: any) => void} [onFavorite]
 */

export const MobileOptimizedTicketCard = ({ 
  ticket, 
  onAction, 
  showActions = true,
  isProcessing = false,
  isFavorite = false,
  onFavorite
}) => {
  const [isLiked, setIsLiked] = useState(isFavorite);
  const [showMenu, setShowMenu] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sold': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return '🟢';
      case 'pending': return '🟡';
      case 'sold': return '🔵';
      case 'cancelled': return '🔴';
      default: return '⚪';
    }
  };

  // Touch/swipe handling for mobile
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleTouchStart = (e) => {
      startX.current = e.touches[0].clientX;
      currentX.current = startX.current;
      setIsDragging(true);
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      currentX.current = e.touches[0].clientX;
      const offset = currentX.current - startX.current;
      setSwipeOffset(Math.max(0, Math.min(offset, 80)));
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      if (swipeOffset > 40) {
        // Swipe right - show quick actions
        setSwipeOffset(80);
      } else {
        setSwipeOffset(0);
      }
    };

    card.addEventListener('touchstart', handleTouchStart, { passive: true });
    card.addEventListener('touchmove', handleTouchMove, { passive: true });
    card.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      card.removeEventListener('touchstart', handleTouchStart);
      card.removeEventListener('touchmove', handleTouchMove);
      card.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, swipeOffset]);

  const handleFavorite = () => {
    setIsLiked(!isLiked);
    onFavorite?.(ticket);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Ticket: ${ticket.from_location} to ${ticket.to_location}`,
        text: `Check out this ticket from ${ticket.bus_operator}`,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="relative w-full" ref={cardRef}>
      {/* Quick Actions on Swipe */}
      <div 
        className={`absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-l-lg flex items-center justify-center transition-transform duration-200 ${
          swipeOffset > 0 ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '80px', transform: `translateX(${swipeOffset - 80}px)` }}
      >
        <div className="flex flex-col items-center space-y-3">
          <Button
            size="sm"
            variant="secondary"
            className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white border-0"
            onClick={() => {
              setSwipeOffset(0);
              handleFavorite();
            }}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white border-0"
            onClick={() => {
              setSwipeOffset(0);
              handleShare();
            }}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card 
        className={`w-full transition-all duration-200 hover:shadow-lg cursor-pointer ${
          isDragging ? 'scale-[0.98]' : 'scale-100'
        }`}
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <CardTitle className="text-lg font-bold truncate text-gray-900">
                  PNR: {ticket.pnr_number}
                </CardTitle>
                <Badge className={`${getStatusColor(ticket.status)} text-xs font-medium px-2 py-1`}>
                  {getStatusIcon(ticket.status)} {ticket.status}
                </Badge>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Bus className="h-4 w-4 mr-2 flex-shrink-0 text-blue-600" />
                <span className="truncate font-medium">{ticket.bus_operator}</span>
              </div>
            </div>
            
            {/* Action Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto hover:bg-gray-100"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </Button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 animate-scale-in">
                  <div className="py-1">
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      onClick={() => {
                        setShowMenu(false);
                        handleFavorite();
                      }}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current text-red-500' : 'text-gray-500'}`} />
                      {isLiked ? 'Remove from Favorites' : 'Add to Favorites'}
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      onClick={() => {
                        setShowMenu(false);
                        handleShare();
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-2 text-gray-500" />
                      Share Ticket
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Enhanced Route Information */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate text-gray-900">
                    {ticket.from_location}
                  </div>
                  <div className="text-xs text-gray-500">From</div>
                </div>
              </div>
              <div className="flex flex-col items-center px-3">
                <div className="w-8 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-1"></div>
              </div>
              <div className="flex items-center space-x-3 flex-1 min-w-0 justify-end">
                <div className="flex-1 min-w-0 text-right">
                  <div className="text-sm font-semibold truncate text-gray-900">
                    {ticket.to_location}
                  </div>
                  <div className="text-xs text-gray-500">To</div>
                </div>
                <div className="w-3 h-3 bg-purple-600 rounded-full flex-shrink-0"></div>
              </div>
            </div>
          </div>

          {/* Enhanced Journey Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">{ticket.departure_date}</div>
                  <div className="text-xs text-gray-500">Departure Date</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">{ticket.departure_time}</div>
                  <div className="text-xs text-gray-500">Departure Time</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Passenger & Seat */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate text-gray-900">{ticket.passenger_name}</div>
                  <div className="text-xs text-gray-500">Passenger</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex-shrink-0 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">S</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{ticket.seat_number}</div>
                  <div className="text-xs text-gray-500">Seat</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Price Information */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <IndianRupee className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-green-700">
                    ₹{ticket.selling_price || ticket.ticket_price}
                  </div>
                  {ticket.selling_price && ticket.ticket_price !== ticket.selling_price && (
                    <div className="text-sm text-gray-500 line-through">
                      Original: ₹{ticket.ticket_price}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                  Listed {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          {showActions && onAction && (
            <div className="flex gap-3 pt-2">
              {ticket.status === 'available' && (
                <>
                  <Button 
                    size="lg" 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3"
                    onClick={() => onAction(ticket, 'buy')}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Buy Now"
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="px-6 py-3 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => onAction(ticket, 'message')}
                    disabled={isProcessing}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                </>
              )}
              {ticket.status === 'pending' && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 py-3"
                  onClick={() => onAction(ticket, 'view')}
                >
                  View Details
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};
