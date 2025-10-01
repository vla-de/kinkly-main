import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { type StripeCardElement } from '@stripe/stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useLanguage } from '../contexts/LanguageContext';

const stripePromise = loadStripe('pk_test_D0yGFsSbMLDTGbr3nhQshR7400Xrp59x45');
const API_BASE_URL = 'https://kinkly-backend.onrender.com';

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
  applicationId: string | null;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onPaymentSuccess, selectedTier, applicationId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLanguage();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!applicationId) {
      setError("Application ID is missing. Please go back and fill out the form.");
      return;
    }
    setProcessing(true);
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe.js has not loaded. Please wait a moment and try again.");
      setProcessing(false);
      return;
    }

    const cardElement = elements.getElement('card');
    if (!cardElement) {
        setError("Card element not found.");
        setProcessing(false);
        return;
    }
    
    const response = await fetch(`${API_BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: selectedTier?.price, applicationId })
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
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? "An unknown error occurred.");
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      // The backend will handle saving to DB via webhook
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
        disabled={!stripe || processing || !applicationId}
        className="w-full bg-white text-black py-3 px-4 hover:bg-gray-200 transition-colors duration-300 font-semibold tracking-wider rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {processing ? t.payment_processing : `${t.payment_button} ${selectedTier?.price}`}
      </button>
    </form>
  );
};


interface PaymentSelectionProps {
  onPaymentSuccess: () => void;
  selectedTier: { title: string; price: string } | null;
  applicationId: string | null;
}

const PAYPAL_CLIENT_ID = "YOUR_PAYPAL_SANDBOX_CLIENT_ID"; // Replace with your actual ID

const PaymentSelection: React.FC<PaymentSelectionProps> = ({ onPaymentSuccess, selectedTier, applicationId }) => {
  const { t } = useLanguage();
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const createPayPalOrder = async (data: CreateOrderData, actions: any): Promise<string> => {
    if (!applicationId) {
      setPaymentError("Application ID is missing. Please go back and fill out the form.");
      return Promise.reject(new Error("Missing application ID"));
    }
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
      const message = err instanceof Error ? err.message : 'An unexpected error occurred with PayPal.';
      setPaymentError(message);
      return Promise.reject(new Error(message));
    }
  };

  const onPayPalApprove = async (data: OnApproveData, actions: any): Promise<void> => {
    if (!applicationId) {
      setPaymentError("Application ID is missing and cannot capture payment.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderID: data.orderID, applicationId }),
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
        <h2 className="font-serif-display text-3xl text-white text-center mb-2">{t.payment_title}</h2>
        
        {selectedTier && (
          <div className="text-center my-6">
            <p className="text-lg text-gray-400">{selectedTier.title}</p>
            <p className="text-5xl font-serif-display text-white mt-2">{selectedTier.price}</p>
          </div>
        )}
        
        <p className="text-center text-gray-400 mb-8 text-sm">{t.payment_paragraph}</p>
        
        <Elements stripe={stripePromise}>
          <CheckoutForm 
            onPaymentSuccess={onPaymentSuccess} 
            selectedTier={selectedTier}
            applicationId={applicationId}
          />
        </Elements>
        
        <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-xs">{t.payment_or_divider}</span>
            <div className="flex-grow border-t border-gray-700"></div>
        </div>
        
        {paymentError && <div className="text-red-500 text-xs text-center mb-4">{paymentError}</div>}
        
        {!applicationId && <div className="text-yellow-400 text-xs text-center mb-4">{t.payment_paypal_error}</div>}

        <PayPalButtons 
          style={{ layout: 'horizontal', color: 'white', shape: 'rect', label: 'paypal', tagline: false }}
          createOrder={createPayPalOrder}
          onApprove={onPayPalApprove}
          onError={(err) => setPaymentError(err.toString())}
          disabled={!applicationId}
        />
      </div>
    </PayPalScriptProvider>
  );
};

export default PaymentSelection;