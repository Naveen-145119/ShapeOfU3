// test/frontend/shape-of-you-frontend/src/pages/PaymentSuccessPage.jsx

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { bookingsAPI } from '@/lib/api'; // Assuming you import api like this
import toast from 'react-hot-toast';

const PaymentSuccessPage = () => {
  const location = useLocation();
  const [bookingStatus, setBookingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // PayU often sends parameters back in the URL (query string or hash) or as a POST request.
    // For simplicity, we'll assume the backend callback has already updated the DB.
    // Here, you might want to fetch the booking details using a booking ID if PayU passes it back
    // or rely on the backend to have fully processed the payment.

    const queryParams = new URLSearchParams(location.search);
    const txnid = queryParams.get('txnid'); // Example: PayU might return your transaction ID
    const status = queryParams.get('status'); // Example: PayU might return status

    if (txnid) {
        // Option 1: Fetch booking status from your backend using txnid
        const fetchBookingStatus = async () => {
            try {
                // You might need a new backend endpoint like /api/bookings/status/:txnid
                // or /api/bookings/by-txnid which returns the booking details
                // For now, let's just use the received status and indicate that backend has handled it.
                // In a real app, you'd make an API call to your backend here to confirm the status from your DB.
                // e.g., const res = await bookingsAPI.getBookingStatusByTxnId(txnid);
                // setBookingStatus(res.data.data);
                
                setBookingStatus({ txnid, status: status || 'confirmed', message: 'Your payment was successful!' });
                toast.success('Payment confirmed! Thank you for your booking.');

            } catch (err) {
                console.error("Error fetching booking status:", err);
                setError('Could not confirm booking status. Please check My Bookings.');
                toast.error('Could not confirm booking status.');
            } finally {
                setLoading(false);
            }
        };
        fetchBookingStatus();
    } else {
        setLoading(false);
        setError('No transaction ID found in URL. Please check My Bookings.');
        toast.error('Payment callback incomplete.');
    }
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg">Loading payment confirmation...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center py-20">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="text-center p-8">
          <CardHeader>
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-3xl font-bold text-green-500">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">Thank you for your booking!</p>
            {bookingStatus && (
              <>
                <p><strong>Transaction ID:</strong> {bookingStatus.txnid}</p>
                <p><strong>Status:</strong> {bookingStatus.status.toUpperCase()}</p>
              </>
            )}
            {error && <p className="text-destructive">{error}</p>}
            <p className="text-muted-foreground">Your booking has been confirmed and details sent to your email.</p>
            <div className="mt-6 flex flex-col space-y-3">
              <Button asChild>
                <Link to="/my-bookings">View My Bookings</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentSuccessPage;