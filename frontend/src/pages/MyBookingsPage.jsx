import { useState, useEffect } from 'react';
import { bookingsAPI } from '../lib/api'; //
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react'; // For loading spinner

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchMyBookings = async () => {
      if (!isAuthenticated || !user?._id) {
        setLoading(false);
        setError('Please log in to view your bookings.');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // CHANGED: Now calls the specific 'getMyBookings' method from bookingsAPI
        const response = await bookingsAPI.getMyBookings(); // Changed from bookingsAPI.get('/my-bookings')
        setBookings(response.data.data || []); // Assuming response.data.data contains an array of bookings
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to fetch bookings. Please try again later.');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBookings();
  }, [isAuthenticated, user?._id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading your bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-destructive text-center">
        <p>{error}</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <h2 className="text-2xl font-bold mb-4">No Bookings Found</h2>
        <p className="text-muted-foreground">It looks like you haven't booked any tickets yet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gradient">My Bookings</h1>
          <p className="text-lg text-muted-foreground">View your past and upcoming event tickets</p>
        </div>

        <div className="space-y-6">
          {bookings.map((booking) => (
            <Card key={booking._id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-semibold">
                  {booking.eventName || 'Fitness Entrepreneur Event'}
                </CardTitle>
                <Badge 
                  variant={booking.paymentStatus === 'succeeded' ? 'default' : 'destructive'}
                  className="capitalize"
                >
                  {booking.paymentStatus}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Ticket Type:</p>
                    <p className="font-medium">{booking.ticketType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Amount:</p>
                    <p className="font-medium">₹{booking.totalAmount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Method:</p>
                    <p className="font-medium">{booking.paymentMethod || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment ID:</p>
                    <p className="font-medium break-all">{booking.paymentId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Booking Status:</p>
                    <p className="font-medium capitalize">{booking.status || 'Confirmed'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Booked On:</p>
                    <p className="font-medium">
                      {booking.createdAt ? format(new Date(booking.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                    </p>
                  </div>
                </div>
                {booking.eventDate && (
                  <>
                    <Separator />
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>Event Date:</span>
                      <span className="font-medium text-foreground">{booking.eventDate}</span>
                    </div>
                  </>
                )}
                {booking.eventLocation && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>Location:</span>
                    <span className="font-medium text-foreground">{booking.eventLocation}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyBookingsPage;