import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PaymentStatusPage = () => {
  const location = useLocation();
  const [paymentStatus, setPaymentStatus] = useState('pending'); // success, failure, pending
  const [transactionDetails, setTransactionDetails] = useState(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const status = queryParams.get('status');
    const txnid = queryParams.get('txnid');
    const bookingId = queryParams.get('bookingId');

    setPaymentStatus(status);
    setTransactionDetails({ txnid, bookingId });

    const updateBookingStatus = async () => {
      try {
        await bookingsAPI.updatePaymentStatus(bookingId, { txnid, status });
        toast.success('Booking status updated successfully!');
      } catch (error) {
        console.error('Error updating booking status:', error);
        toast.error('Failed to update booking status.');
      }
    };

    if (bookingId && txnid && status) {
      // No need to call updateBookingStatus here, as the backend handles it.
    }
  }, [location]);

  const renderContent = () => {
    if (paymentStatus === 'success') {
      return (
        <Card className="w-full max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center justify-center gap-2">
              <CheckCircle className="h-8 w-8" /> Payment Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Your booking has been confirmed.</p>
            {transactionDetails.txnid && (
              <p><strong>Transaction ID:</strong> {transactionDetails.txnid}</p>
            )}
            {transactionDetails.bookingId && (
              <p><strong>Booking ID:</strong> {transactionDetails.bookingId}</p>
            )}
            <Button asChild>
              <Link to="/my-bookings">View My Bookings</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      );
    } else if (paymentStatus === 'failure') {
      return (
        <Card className="w-full max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center justify-center gap-2">
              <XCircle className="h-8 w-8" /> Payment Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Unfortunately, your payment could not be processed.</p>
            {transactionDetails.txnid && (
              <p><strong>Transaction ID:</strong> {transactionDetails.txnid}</p>
            )}
            <p>Please try again or contact support if the issue persists.</p>
            <Button asChild>
              <Link to="/booking">Try Again</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      );
    } else {
      return (
        <Card className="w-full max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-blue-600 flex items-center justify-center gap-2">
              <Loader className="h-8 w-8 animate-spin" /> Processing Payment...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please do not close this window. We are confirming your transaction.</p>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      {renderContent()}
    </div>
  );
};

export default PaymentStatusPage;
