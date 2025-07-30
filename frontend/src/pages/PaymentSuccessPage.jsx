// frontend/src/pages/PaymentSuccessPage.jsx

import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentSuccessPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  // Get details directly from the URL. The backend has already verified them.
  const bookingId = queryParams.get('bookingId');
  const txnid = queryParams.get('txnid');
  const status = queryParams.get('status');

  useEffect(() => {
    toast.success('Payment confirmed! Thank you for your booking.');
  }, []);

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
            <CardTitle className="text-3xl font-bold text-green-500">
              Payment Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">Thank you for your booking!</p>
            <div className="bg-muted p-4 rounded-lg space-y-2 text-left">
              {bookingId && <p><strong>Booking ID:</strong> {bookingId}</p>}
              {txnid && <p><strong>Transaction ID:</strong> {txnid}</p>}
              {status && <p><strong>Status:</strong> {status.toUpperCase()}</p>}
            </div>
            <p className="text-muted-foreground">
              Your booking has been confirmed and details have been sent to your email.
            </p>
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
