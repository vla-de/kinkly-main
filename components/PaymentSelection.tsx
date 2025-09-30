import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
// FIX: OnApproveData and CreateOrderData are not exported from this package.
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';


// **WICHTIG**: Ersetzen Sie dies durch Ihren PUBLISHABLE Stripe Key.
const stripePromise = loadStripe('pk_test_D0yGFsSbMLDTGbr3nhQshR7400Xrp59x45');

// **WICHTIG**: Ersetzen Sie dies mit der öffentlichen URL Ihres Backends auf Render.
const API_BASE_URL = 'https://kinkly-backend.onrender.com/';

// FIX: Define missing types for PayPal callbacks locally.
interface OnApproveData {
  orderID: string;
}
type CreateOrderData = Record<string, unknown>;


const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#E0E0E0",
      fontFamily: '"Inter", sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#6b7280",
      },
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  },
};


interface CheckoutFormProps {
  onPaymentSuccess: () => void;
  selectedTier: { title: string; price: string } | null;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onPaymentSuccess, selectedTier }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProcessing(true);
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe.js has not loaded. Please wait a moment and try again.");
      setProcessing(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
        setError("Card element not found.");
        setProcessing(false);
        return;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: selectedTier?.price })
    });

    if (!response.ok) {
      const { error } = await response.json();
      setError(error || 'Failed to create payment intent.');
      setProcessing(false);
      return;
    }

    const { clientSecret } = await response.json();
    
    if (!clientSecret) {
      setError('Could not retrieve payment information from server.');
      setProcessing(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: 'Kinkly Guest', // You can collect this from a form field
        },
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "An unknown error occurred.");
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      onPaymentSuccess();
    } else {
        setError(`Payment status: ${paymentIntent?.status}`);
    }
    
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
       <div className="p-3 bg-gray-800 border border-gray-700 rounded-md mb-6">
         <CardElement options={CARD_ELEMENT_OPTIONS} />
       </div>
       {error && <div className="text-red-500 text-xs text-center mb-4">{error}</div>}
      <button 
        type="submit" 
        disabled={!stripe || processing}
        className="w-full bg-white text-black py-3 px-4 hover:bg-gray-200 transition-colors duration-300 font-semibold tracking-wider rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {processing ? 'Processing...' : `Pay ${selectedTier?.price}`}
      </button>
    </form>
  );
};


interface PaymentSelectionProps {
  onPaymentSuccess: () => void;
  selectedTier: { title: string; price: string } | null;
}

// **WICHTIG**: Ersetzen Sie dies durch Ihre PayPal Client ID.
const PAYPAL_CLIENT_ID = "YOUR_PAYPAL_SANDBOX_CLIENT_ID";

const PaymentSelection: React.FC<PaymentSelectionProps> = ({ onPaymentSuccess, selectedTier }) => {
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const createPayPalOrder = async (data: CreateOrderData): Promise<string> => {
    setPaymentError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: selectedTier?.price }),
      });
      const orderData = await response.json();
      if (!response.ok || !orderData.orderID) {
        throw new Error(orderData.error || 'Could not create PayPal order.');
      }
      return orderData.orderID;
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'An unexpected error occurred with PayPal.');
      return '';
    }
  };

  const onPayPalApprove = async (data: OnApproveData): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: data.orderID }),
      });
      if (!response.ok) {
         const errorData = await response.json();
        throw new Error(errorData.error || 'Could not capture PayPal payment.');
      }
      onPaymentSuccess();
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'An error occurred while finalizing your payment.');
    }
  };


  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "EUR", "disable-funding": "card" }}>
      <div>
        <h2 className="font-serif-display text-3xl text-white text-center mb-2">Complete Your Reservation</h2>
        
        {selectedTier && (
          <div className="text-center my-6">
            <p className="text-lg text-gray-400">{selectedTier.title}</p>
            <p className="text-5xl font-serif-display text-white mt-2">{selectedTier.price}</p>
          </div>
        )}
        
        <p className="text-center text-gray-400 mb-8 text-sm">Please enter your payment details to secure your place.</p>
        
        <Elements stripe={stripePromise}>
          <CheckoutForm onPaymentSuccess={onPaymentSuccess} selectedTier={selectedTier} />
        </Elements>
        
        <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-xs">OR</span>
            <div className="flex-grow border-t border-gray-700"></div>
        </div>
        
        {paymentError && <div className="text-red-500 text-xs text-center mb-4">{paymentError}</div>}

        <PayPalButtons 
          style={{ layout: 'horizontal', color: 'white', shape: 'rect', label: 'paypal', tagline: false }}
          createOrder={createPayPalOrder}
          onApprove={onPayPalApprove}
          onError={(err) => setPaymentError(err.toString())}
        />
      </div>
    </PayPalScriptProvider>
  );
};

export default PaymentSelection;