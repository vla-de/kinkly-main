import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LoginForm: React.FC = () => {
  const { t } = useLanguage();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    alert('Login functionality to be implemented.');
  };

  return (
    <div>
      <h2 className="font-serif-display text-3xl text-white text-center mb-6">{t.login_title}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-400">{t.login_email_label}</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-400">{t.login_password_label}</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          />
        </div>
        <div>
          <button type="submit" className="w-full bg-white text-black py-3 px-4 hover:bg-gray-200 transition-colors duration-300 font-semibold tracking-wider">
            {t.login_button}
          </button>
        </div>
        <div className="text-center">
          <a href="#" className="text-xs text-gray-500 hover:text-gray-300">{t.login_forgot_password}</a>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;