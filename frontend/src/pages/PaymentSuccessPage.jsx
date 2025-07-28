// PaymentSuccessPage.jsx - Enhanced version
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { bookingsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookingStatus, setBookingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const txnid = queryParams.get('txnid');
    const status = queryParams.get('status');
    const hash = queryParams.get('hash');
    
    // Handle both GET and POST data from PayU
    const urlHash = window.location.hash;
    if (urlHash && urlHash.includes('txnid')) {
      const hashParams = new URLSearchParams(urlHash.substring(1));
      txnid = txnid || hashParams.get('txnid');
      status = status || hashParams.get('status');
    }

    console.log('Payment callback received:', { txnid, status, hash });

    if (txnid) {
      fetchBookingStatus(txnid, status);
    } else {
      // If no transaction ID, try to get from backend session or redirect
      setTimeout(() => {
        setLoading(false);
        setError('Payment details not found. Redirecting to bookings...');
        toast.error('Payment verification incomplete.');
        setTimeout(() => navigate('/my-bookings'), 3000);
      }, 1000);
    }
  }, [location, navigate]);

  const fetchBookingStatus = async (txnid, payuStatus) => {
    try {
      // Call your backend to verify payment status
      const response = await bookingsAPI.verifyPayment(txnid);
      
      if (response.data.success) {
        setBookingStatus({
          txnid,
          status: response.data.data.status,
          bookingId: response.data.data.bookingId,
          amount: response.data.data.amount,
          message: 'Payment verified successfully!'
        });
        toast.success('Payment confirmed! Thank you for your booking.');
      } else {
        throw new Error(response.data.message || 'Payment verification failed');
      }
    } catch (err) {
      console.error("Error verifying payment:", err);
      setError('Could not verify payment status. Please check My Bookings or contact support.');
      toast.error('Payment verification failed.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Verifying payment...</p>
        </div>
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
            {error ? (
              <AlertCircle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
            ) : (
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
            )}
            <CardTitle className={`text-3xl font-bold ${error ? 'text-yellow-500' : 'text-green-500'}`}>
              {error ? 'Payment Processing' : 'Payment Successful!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <>
                <p className="text-destructive">{error}</p>
                <p className="text-muted-foreground">
                  We're processing your payment. You'll receive a confirmation email shortly.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg">Thank you for your booking!</p>
                {bookingStatus && (
                  <>
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <p><strong>Transaction ID:</strong> {bookingStatus.txnid}</p>
                      <p><strong>Status:</strong> {bookingStatus.status.toUpperCase()}</p>
                      {bookingStatus.amount && (
                        <p><strong>Amount:</strong> ₹{bookingStatus.amount}</p>
                      )}
                    </div>
                  </>
                )}
                <p className="text-muted-foreground">
                  Your booking has been confirmed and details sent to your email.
                </p>
              </>
            )}
            
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
