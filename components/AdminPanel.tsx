import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface User {
  id: number;
  full_name: string;
  email: string;
  is_referrer: boolean;
  created_at: string;
  referral_count?: number;
}

interface ReferralCode {
  id: number;
  code: string;
  user_id: number;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface EventStats {
  total_applications: number;
  pending_payments: number;
  pending_review: number;
  approved: number;
  total_revenue: number;
  remaining_tickets: number;
}

const AdminPanel: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'users' | 'referrals' | 'analytics' | 'scarcity'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data based on active tab
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      switch (activeTab) {
        case 'users':
          const usersResponse = await fetch('/api/admin/users', { headers });
          const usersData = await usersResponse.json();
          setUsers(usersData);
          break;
        case 'referrals':
          const referralsResponse = await fetch('/api/admin/referral-codes', { headers });
          const referralsData = await referralsResponse.json();
          setReferralCodes(referralsData);
          break;
        case 'analytics':
          const statsResponse = await fetch('/api/admin/stats', { headers });
          const statsData = await statsResponse.json();
          setStats(statsData);
          break;
        case 'scarcity':
          const scarcityResponse = await fetch('/api/admin/stats', { headers });
          const scarcityData = await scarcityResponse.json();
          setStats(scarcityData);
          break;
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createReferralCode = async (userId: number, maxUses: number, expiresAt?: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/referral-codes', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ userId, maxUses, expiresAt })
      });
      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error creating referral code:', err);
    }
  };

  const updateScarcity = async (remainingTickets: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/scarcity', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ remainingTickets })
      });
      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error updating scarcity:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-300 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-serif-display text-4xl text-white mb-8">Admin Panel</h1>
        
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 border-b border-gray-800">
          {[
            { key: 'users', label: 'Users' },
            { key: 'referrals', label: 'Referral Codes' },
            { key: 'analytics', label: 'Analytics' },
            { key: 'scarcity', label: 'Scarcity Management' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`btn-exclusive px-6 py-3 text-sm font-medium transition-all duration-300 ${
                activeTab === tab.key
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-gray-900 rounded-lg p-6">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && !loading && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif-display text-2xl text-white">Users</h2>
                <button className="btn-exclusive bg-white text-black px-4 py-2 text-sm">
                  Export Users
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-left py-3 px-4">Referrals</th>
                      <th className="text-left py-3 px-4">Joined</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800">
                        <td className="py-3 px-4">{user.full_name}</td>
                        <td className="py-3 px-4">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.is_referrer ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'
                          }`}>
                            {user.is_referrer ? 'Referrer' : 'User'}
                          </span>
                        </td>
                        <td className="py-3 px-4">{user.referral_count || 0}</td>
                        <td className="py-3 px-4">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <button 
                            onClick={() => createReferralCode(user.id, 10)}
                            className="btn-exclusive bg-gray-700 hover:bg-gray-600 px-3 py-1 text-xs"
                          >
                            Create Code
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Referral Codes Tab */}
          {activeTab === 'referrals' && !loading && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif-display text-2xl text-white">Referral Codes</h2>
                <button className="btn-exclusive bg-white text-black px-4 py-2 text-sm">
                  Generate Code
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">Code</th>
                      <th className="text-left py-3 px-4">Owner</th>
                      <th className="text-left py-3 px-4">Uses</th>
                      <th className="text-left py-3 px-4">Max Uses</th>
                      <th className="text-left py-3 px-4">Expires</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralCodes.map(code => (
                      <tr key={code.id} className="border-b border-gray-800 hover:bg-gray-800">
                        <td className="py-3 px-4 font-mono">{code.code}</td>
                        <td className="py-3 px-4">{code.user_id}</td>
                        <td className="py-3 px-4">{code.used_count}</td>
                        <td className="py-3 px-4">{code.max_uses}</td>
                        <td className="py-3 px-4">{code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Never'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            code.is_active ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                          }`}>
                            {code.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button className="btn-exclusive bg-gray-700 hover:bg-gray-600 px-3 py-1 text-xs mr-2">
                            Edit
                          </button>
                          <button className="btn-exclusive bg-red-700 hover:bg-red-600 px-3 py-1 text-xs">
                            Deactivate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && !loading && stats && (
            <div>
              <h2 className="font-serif-display text-2xl text-white mb-6">Analytics Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-sm text-gray-400 mb-2">Total Applications</h3>
                  <p className="text-3xl font-bold text-white">{stats.total_applications}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-sm text-gray-400 mb-2">Pending Payments</h3>
                  <p className="text-3xl font-bold text-yellow-400">{stats.pending_payments}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-sm text-gray-400 mb-2">Approved</h3>
                  <p className="text-3xl font-bold text-green-400">{stats.approved}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-sm text-gray-400 mb-2">Total Revenue</h3>
                  <p className="text-3xl font-bold text-white">€{stats.total_revenue}</p>
                </div>
              </div>
            </div>
          )}

          {/* Scarcity Management Tab */}
          {activeTab === 'scarcity' && !loading && (
            <div>
              <h2 className="font-serif-display text-2xl text-white mb-6">Scarcity Management</h2>
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center space-x-4 mb-4">
                  <label className="text-white font-medium">Remaining Tickets:</label>
                  <input
                    type="number"
                    value={stats?.remaining_tickets || 0}
                    onChange={(e) => setStats(prev => prev ? {...prev, remaining_tickets: parseInt(e.target.value)} : null)}
                    className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                  />
                  <button 
                    onClick={() => stats && updateScarcity(stats.remaining_tickets)}
                    className="btn-exclusive bg-white text-black px-4 py-2"
                  >
                    Update
                  </button>
                </div>
                <p className="text-gray-400 text-sm">
                  This number will be displayed to users to create urgency. 
                  It decreases automatically when tickets are purchased.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;