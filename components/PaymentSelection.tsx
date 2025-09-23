import React from 'react';

const StripeIcon = () => (
  <svg width="48" height="20" viewBox="0 0 48 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
    <path d="M40.33 4.129c-.283-.05-.591-.077-.92-.077-1.442 0-2.585.59-3.43 1.772-.845 1.181-1.267 2.71-1.267 4.587 0 1.62.373 2.91 1.12 3.87.747.96 1.796 1.44 3.149 1.44.527 0 .99-.05 1.39-.15v-2.22c-.373.227-.796.34-1.267.34-.698 0-1.218-.283-1.56-.85-.342-.565-.513-1.39-.513-2.477h4.63v-.85c0-1.747-.318-3.12-1.006-4.13-.64-1.006-1.535-1.51-2.678-1.51zm-1.218 5.48c.025-.934.227-1.646.605-2.136.377-.49.88-.735 1.506-.735.698 0 1.218.245 1.56.735.342.49.513 1.202.513 2.136h-4.184zM27.098 15.77V4.33h2.344v1.673c.422-1.258 1.417-1.887 2.986-1.887.697 0 1.317.123 1.86.37V6.9c-.473-.202-1.023-.303-1.65-.303-1.047 0-1.84.4-2.378 1.197-.538.796-.807 1.95-.807 3.46v4.516h-2.355zm-10.155.123c-1.34 0-2.45-.448-3.33-1.343C12.722 13.65 12.28 12.4 12.28 10.8c0-1.6.442-2.85 1.328-3.75.886-.9 1.99-1.35 3.31-1.35 1.344 0 2.454.45 3.33 1.35.875.9 1.312 2.15 1.312 3.75 0 1.6-.437 2.85-1.312 3.75-.875.9-1.986 1.35-3.33 1.35zm0-2.22c.747 0 1.332-.284 1.754-.85.422-.566.633-1.418.633-2.557 0-1.14-.21-1.99-.633-2.556-.422-.566-1.007-.85-1.754-.85-.747 0-1.332.284-1.754.85-.422.565-.633 1.417-.633 2.556 0 1.14.21 1.99.633 2.557.422.566 1.007.85 1.754.85zM9.904 15.77V.13h-2.43L4.234 9.14c-.1.202-.176.478-.227.828H4c.05-.35.075-.626.075-.828L.886.13H0v15.64h2.24V4.71c0-.527.025-.977.075-1.35h.025c.075.4.175.8.298 1.2L6.1 15.77h1.4l3.4-11.21c.125-.4.225-.8.3-1.2h.05c.05.373.075.823.075 1.35v11.06h-2.24z" fill="#635BFF"/></svg>
);

const PayPalIcon = () => (
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
      <path d="M4.21 23.335L0 1.415h5.18l.81 5.95c.1.78.2 1.57.28 2.36h.05c.23-1.04.88-2.07 1.96-3.11C9.6 5.425 10.98 4.755 12.7 4.755c3.2 0 5.4 1.7 6.6 4.96.94 2.57 1.01 5.3 1.01 8.18v.13h-4.49v-.32c0-2.35-.07-4.5-1.01-6.43-1.1-2.29-3.05-3.44-5.85-3.44-1.44 0-2.5.42-3.18 1.25-.68.83-.96 1.96-.86 3.39.07 1.11.4 2.19.98 3.23l2.25 3.99H4.21z" fill="#253B80"/>
      <path d="M10.95.125L8.24 2.055c3.55 1.55 5.57 3.95 6.04 7.2h4.48c-.4-4.82-2.88-8.1-8.81-9.13z" fill="#179BD7"/>
    </svg>
);


interface PaymentSelectionProps {
  onPaymentSuccess: () => void;
}

const PaymentSelection: React.FC<PaymentSelectionProps> = ({ onPaymentSuccess }) => {
  const handlePayment = (provider: string) => {
    // In a real app, this would trigger the payment flow.
    // For this simulation, we'll just proceed to the success state.
    console.log(`Simulating payment with ${provider}...`);
    onPaymentSuccess();
  };

  return (
    <div>
      <h2 className="font-serif-display text-3xl text-white text-center mb-6">Complete Your Reservation</h2>
      <p className="text-center text-gray-400 mb-8 text-sm">Please select a payment method to secure your place.</p>
      <div className="space-y-4">
        <button 
          onClick={() => handlePayment('Stripe')}
          className="w-full flex items-center justify-center bg-white text-black py-3 px-4 hover:bg-gray-200 transition-colors duration-300 font-semibold tracking-wider rounded-md">
          <StripeIcon />
          <span>Pay with Stripe</span>
        </button>
        <button 
          onClick={() => handlePayment('PayPal')}
          className="w-full flex items-center justify-center bg-[#003087] text-white py-3 px-4 hover:bg-[#00296b] transition-colors duration-300 font-semibold tracking-wider rounded-md">
          <PayPalIcon />
          <span>Pay with PayPal</span>
        </button>
      </div>
    </div>
  );
};

export default PaymentSelection;
