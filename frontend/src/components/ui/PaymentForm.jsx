import React from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button } from './ui/button';

const PaymentForm = ({ onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded. Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    const cardElement = elements.getElement(CardElement);

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      // clientSecret will be passed as an option to Elements provider
      // and can be accessed via useStripe hook
      stripe.clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'John Doe', // Replace with actual user name from form
          },
        },
      }
    );

    if (error) {
      console.error('[Stripe error]', error);
      // Show error to your customer (e.g., insufficient funds, card declined)
    } else {
      console.log('[PaymentIntent]', paymentIntent);
      if (paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id);
      }
      // The payment has been processed!
      // You can now redirect your customer to a success page
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <CardElement />
      </div>
      <Button type="submit" disabled={!stripe}>Pay</Button>
    </form>
  );
};

export default PaymentForm;
