import React from 'react';

interface TicketFormProps {
  onSubmitSuccess: () => void;
}

const TicketForm: React.FC<TicketFormProps> = ({ onSubmitSuccess }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle ticket request logic here
    onSubmitSuccess();
  };

  return (
    <div>
      <h2 className="font-serif-display text-3xl text-white text-center mb-2">Request an Invitation</h2>
      <p className="text-center text-gray-400 mb-6 text-sm">
        Please note: Completing your request and payment is an application. It does not guarantee entry. Final confirmation is granted only by The Circle. Unsuccessful applications will be fully refunded.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-400">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          />
        </div>
        <div>
          {/* FIX: Corrected closing tag typo from </desciption> to </label> */}
          <label htmlFor="request-email" className="block text-sm font-medium text-gray-400">Email</label>
          <input
            type="email"
            id="request-email"
            name="email"
            required
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-400">
            Tell us why you wish to attend (Optional)
          </label>
          <textarea
            id="message"
            name="message"
            rows={3}
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          ></textarea>
        </div>
        <div>
          <button type="submit" className="w-full bg-white text-black py-3 px-4 hover:bg-gray-200 transition-colors duration-300 font-semibold tracking-wider">
            Request Invitation
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm;