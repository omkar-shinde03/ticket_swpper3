import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Star, User, MessageSquare } from 'lucide-react';

export const ReviewSystem = ({ userId, ticketId, transactionId, currentUserId }) => {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 0, review_text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
    loadUserProfile();
  }, [userId]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:reviewer_id(email),
          reviewer_profile:reviewer_id(*)
        `)
        .eq('reviewed_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (newReview.rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a rating before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          reviewer_id: currentUserId,
          reviewed_user_id: userId,
          ticket_id: ticketId,
          transaction_id: transactionId,
          rating: newReview.rating,
          review_text: newReview.review_text,
          is_verified: true
        });

      if (error) throw error;

      toast({
        title: 'Review Submitted',
        description: 'Thank you for your feedback!',
      });

      setNewReview({ rating: 0, review_text: '' });
      loadReviews();
      loadUserProfile();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, readonly = false }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 cursor-pointer ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
            onClick={() => !readonly && onRatingChange(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* User Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>User Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <StarRating rating={userProfile?.rating || 0} readonly />
                <span className="text-lg font-semibold">
                  {userProfile?.rating?.toFixed(1) || '0.0'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {userProfile?.total_transactions || 0} total transactions
              </p>
              <div className="flex space-x-4 mt-2">
                <Badge variant="secondary">
                  {userProfile?.successful_sales || 0} sales
                </Badge>
                <Badge variant="secondary">
                  {userProfile?.successful_purchases || 0} purchases
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                KYC Status: 
                <Badge 
                  variant={userProfile?.kyc_status === 'verified' ? 'default' : 'secondary'}
                  className="ml-1"
                >
                  {userProfile?.kyc_status === 'verified' ? 'Verified' :
                   userProfile?.kyc_status === 'pending' ? 'Under Review' :
                   userProfile?.kyc_status === 'rejected' ? 'Rejected' :
                   'Not Started'}
                </Badge>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Review Form */}
      {currentUserId && currentUserId !== userId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Leave a Review</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Rating</label>
                <StarRating
                  rating={newReview.rating}
                  onRatingChange={(rating) => setNewReview({ ...newReview, rating })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Review (Optional)</label>
                <Textarea
                  value={newReview.review_text}
                  onChange={(e) => setNewReview({ ...newReview, review_text: e.target.value })}
                  placeholder="Share your experience with this user..."
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No reviews yet</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <StarRating rating={review.rating} readonly />
                      <span className="text-sm text-gray-600">
                        by {review.reviewer?.email?.split('@')[0] || 'Anonymous'}
                      </span>
                      {review.is_verified && (
                        <Badge variant="outline" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {review.review_text && (
                    <p className="text-gray-700">{review.review_text}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};