// test/frontend/shape-of-you-frontend/src/pages/PaymentFailurePage.jsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentFailurePage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const txnid = queryParams.get('txnid'); // Example: PayU might return your transaction ID
  const status = queryParams.get('status'); // Example: PayU might return status
  const errorMessage = queryParams.get('error_message') || 'Payment failed due to an unknown error.'; // PayU might provide an error message

  useEffect(() => {
    toast.error('Payment failed. Please try again.');
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
            <XCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
            <CardTitle className="text-3xl font-bold text-destructive">Payment Failed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">We're sorry, your payment could not be processed.</p>
            {txnid && <p><strong>Transaction ID:</strong> {txnid}</p>}
            {status && <p><strong>Status:</strong> {status.toUpperCase()}</p>}
            <p className="text-destructive font-medium">{errorMessage}</p>
            <p className="text-muted-foreground">Please try again or contact support if the issue persists.</p>
            <div className="mt-6 flex flex-col space-y-3">
              <Button asChild>
                <Link to="/booking">Try Booking Again</Link>
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

export default PaymentFailurePage;