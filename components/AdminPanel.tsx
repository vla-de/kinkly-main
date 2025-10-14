import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  message?: string;
  tier: string;
  status: string;
  is_referrer: boolean;
  created_at: string;
  referral_count?: number;
  role?: string; // super_admin, admin, elite, circle, anwerber, warteliste
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
  owner_name: string;
}

interface EventStats {
  total_applications: number;
  pending_payments: number;
  pending_review: number;
  approved: number;
  total_revenue: number;
  invitation_tickets: number;
  circle_tickets: number;
  sanctum_tickets: number;
}

const AdminPanel: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'users' | 'referrals' | 'waitlist' | 'analytics' | 'scarcity'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('admin'); // Get from auth

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
        case 'waitlist':
          // Try admin endpoint first, fallback to direct database query
          try {
            const waitlistResponse = await fetch('/api/admin/waitlist', { headers });
            if (waitlistResponse.ok) {
              const waitlistData = await waitlistResponse.json();
              setWaitlist(waitlistData);
            } else {
              // Fallback: Get waitlist from users with tier 'waitlist'
              const usersResponse = await fetch('/api/admin/users', { headers });
              const usersData = await usersResponse.json();
              const waitlistData = usersData.filter((user: any) => user.tier === 'waitlist');
              setWaitlist(waitlistData);
            }
          } catch (error) {
            console.error('Error fetching waitlist:', error);
            setWaitlist([]);
          }
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

  const updateScarcity = async (invitationTickets: number, circleTickets: number, sanctumTickets: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/scarcity', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ invitationTickets, circleTickets, sanctumTickets })
      });
      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error updating scarcity:', err);
    }
  };

  const createUser = async (userData: { firstName: string; lastName: string; email: string; message?: string; tier: string }) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(userData)
      });
      if (response.ok) {
        setShowNewUserForm(false);
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };

  const updateUser = async (userId: number, userData: { firstName: string; lastName: string; email: string; message?: string; tier: string }) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(userData)
      });
      if (response.ok) {
        setEditingUser(null);
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete user');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  const updateReferralCode = async (codeId: number, maxUses: number, expiresAt?: string, isActive?: boolean) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/referral-codes/${codeId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ maxUses, expiresAt, isActive })
      });
      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error updating referral code:', err);
    }
  };

  const deactivateReferralCode = async (codeId: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/referral-codes/${codeId}/deactivate`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });
      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error deactivating referral code:', err);
    }
  };

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [inviteMessage, setInviteMessage] = useState('');
  const [useTemplate, setUseTemplate] = useState(false);

  const sendEventInvite = async (person: any) => {
    setSelectedPerson(person);
    setShowInviteModal(true);
  };

  const handleSendInvite = async () => {
    if (!selectedPerson) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/send-invite', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          email: selectedPerson.email,
          firstName: selectedPerson.first_name,
          lastName: selectedPerson.last_name,
          referralCode: selectedPerson.referral_code,
          customMessage: inviteMessage || undefined
        })
      });
      
      if (response.ok) {
        alert('Invite sent successfully!');
        setShowInviteModal(false);
        setInviteMessage('');
        setSelectedPerson(null);
      } else {
        alert('Failed to send invite');
      }
    } catch (err) {
      console.error('Error sending invite:', err);
      alert('Error sending invite');
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
            { key: 'referrals', label: 'Elite Passcodes' },
            { key: 'waitlist', label: 'Waitlist' },
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
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setShowNewUserForm(true)}
                    className="btn-exclusive bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
                  >
                    New User
                  </button>
                  <button className="btn-exclusive bg-white text-black px-4 py-2 text-sm">
                    Export Users
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">First Name</th>
                      <th className="text-left py-3 px-4">Last Name</th>
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
                        <td className="py-3 px-4">{user.first_name}</td>
                        <td className="py-3 px-4">{user.last_name}</td>
                        <td className="py-3 px-4">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.is_referrer ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'
                          }`}>
                            {user.is_referrer ? 'Referrer' : 'User'}
                          </span>
                        </td>
                        <td className="py-3 px-4">{user.referral_count || 0} Codes/Logins</td>
                        <td className="py-3 px-4">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-1">
                            <button 
                              onClick={() => setEditingUser(user)}
                              className="btn-exclusive bg-blue-600 hover:bg-blue-700 px-3 py-1 text-xs"
                            >
                              Edit
                            </button>
                            {currentUserRole === 'super_admin' && (
                              <button 
                                onClick={() => deleteUser(user.id)}
                                className="btn-exclusive bg-red-600 hover:bg-red-700 px-3 py-1 text-xs"
                              >
                                Delete
                              </button>
                            )}
                            <button 
                              onClick={() => createReferralCode(user.id, 10)}
                              className="btn-exclusive bg-gray-700 hover:bg-gray-600 px-3 py-1 text-xs"
                            >
                              Create Code
                            </button>
                          </div>
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
                <h2 className="font-serif-display text-2xl text-white">Elite Passcodes</h2>
                <button 
                  onClick={() => {
                    const userId = prompt('Enter User ID to generate code for:');
                    if (userId) {
                      createReferralCode(parseInt(userId), 10);
                    }
                  }}
                  className="btn-exclusive bg-white text-black px-4 py-2 text-sm"
                >
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
                        <td className="py-3 px-4">{code.owner_name || 'Unknown'}</td>
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
                          <button 
                            onClick={() => {
                              const maxUses = prompt('Enter new max uses:', code.max_uses.toString());
                              const expiresAt = prompt('Enter expiration date (YYYY-MM-DD) or leave empty:', code.expires_at ? code.expires_at.split('T')[0] : '');
                              if (maxUses) {
                                updateReferralCode(code.id, parseInt(maxUses), expiresAt || undefined, code.is_active);
                              }
                            }}
                            className="btn-exclusive bg-gray-700 hover:bg-gray-600 px-3 py-1 text-xs mr-2"
                          >
                            Edit
                          </button>
                          {code.is_active ? (
                            <button 
                              onClick={() => {
                                if (confirm('Are you sure you want to deactivate this code?')) {
                                  deactivateReferralCode(code.id);
                                }
                              }}
                              className="btn-exclusive bg-red-700 hover:bg-red-600 px-3 py-1 text-xs"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button 
                              onClick={() => {
                                if (confirm('Are you sure you want to reactivate this code?')) {
                                  updateReferralCode(code.id, code.max_uses, code.expires_at, true);
                                }
                              }}
                              className="btn-exclusive bg-green-700 hover:bg-green-600 px-3 py-1 text-xs"
                            >
                              Reactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Waitlist Tab */}
          {activeTab === 'waitlist' && !loading && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif-display text-2xl text-white">Waitlist</h2>
                <div className="text-sm text-gray-400">
                  {waitlist.length} people on waitlist
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">First Name</th>
                      <th className="text-left py-3 px-4">Last Name</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Elite Passcode</th>
                      <th className="text-left py-3 px-4">Joined</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.map((person) => (
                      <tr key={person.id} className="border-b border-gray-800 hover:bg-gray-800">
                        <td className="py-3 px-4">{person.first_name}</td>
                        <td className="py-3 px-4">{person.last_name}</td>
                        <td className="py-3 px-4">{person.email}</td>
                        <td className="py-3 px-4">
                          {person.referral_code ? (
                            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                              {person.referral_code}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {new Date(person.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => sendEventInvite(person)}
                            className="btn-exclusive bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                          >
                            Send Invite
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
              
              {/* Current Status */}
              <div className="bg-gray-800 p-4 rounded-lg mb-6">
                <h3 className="text-white font-medium mb-3">Aktueller Status:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-gray-300">
                    <span className="text-white font-medium">The Invitation:</span><br />
                    {stats?.invitation_sold || 0} verkauft
                  </div>
                  <div className="text-gray-300">
                    <span className="text-white font-medium">The Circle:</span><br />
                    {stats?.circle_sold || 0} verkauft
                  </div>
                  <div className="text-gray-300">
                    <span className="text-white font-medium">The Inner Sanctum:</span><br />
                    {stats?.sanctum_sold || 0} verkauft
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-lg space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-white font-medium block mb-2">
                      The Invitation Tickets:
                      <span className="text-gray-400 text-sm ml-2">
                        (Aktuell: {stats?.invitation_tickets || 0} verfügbar)
                      </span>
                    </label>
                    <input
                      type="number"
                      value={stats?.invitation_tickets || 0}
                      onChange={(e) => setStats(prev => prev ? {...prev, invitation_tickets: parseInt(e.target.value)} : null)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-white font-medium block mb-2">
                      The Circle Tickets:
                      <span className="text-gray-400 text-sm ml-2">
                        (Aktuell: {stats?.circle_tickets || 0} verfügbar)
                      </span>
                    </label>
                    <input
                      type="number"
                      value={stats?.circle_tickets || 0}
                      onChange={(e) => setStats(prev => prev ? {...prev, circle_tickets: parseInt(e.target.value)} : null)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-white font-medium block mb-2">
                      The Inner Sanctum Tickets:
                      <span className="text-gray-400 text-sm ml-2">
                        (Aktuell: {stats?.sanctum_tickets || 0} verfügbar)
                      </span>
                    </label>
                    <input
                      type="number"
                      value={stats?.sanctum_tickets || 0}
                      onChange={(e) => setStats(prev => prev ? {...prev, sanctum_tickets: parseInt(e.target.value)} : null)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={() => stats && updateScarcity(stats.invitation_tickets, stats.circle_tickets, stats.sanctum_tickets)}
                    className="btn-exclusive bg-white text-black px-6 py-2"
                  >
                    Update All Tickets
                  </button>
                </div>
                <p className="text-gray-400 text-sm">
                  These numbers will be displayed to users to create urgency. 
                  They decrease automatically when tickets are purchased for each tier.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New User Modal */}
      {showNewUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold text-white mb-4">Create New User</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget as HTMLFormElement);
              createUser({
                firstName: formData.get('firstName') as string,
                lastName: formData.get('lastName') as string,
                email: formData.get('email') as string,
                message: formData.get('message') as string,
                tier: formData.get('tier') as string
              });
            }}>
              <div className="space-y-4">
                <input
                  name="firstName"
                  placeholder="First Name"
                  required
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded"
                />
                <input
                  name="lastName"
                  placeholder="Last Name"
                  required
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded"
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded"
                />
                <select
                  name="tier"
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded"
                >
                  <option value="">Select Tier (optional)</option>
                  <option value="waitlist">Waitlist</option>
                  <option value="The Invitation">The Invitation</option>
                  <option value="The Circle">The Circle</option>
                  <option value="The Inner Sanctum">The Inner Sanctum</option>
                </select>
                <textarea
                  name="message"
                  placeholder="Message (optional)"
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowNewUserForm(false)}
                  className="btn-exclusive bg-gray-600 hover:bg-gray-700 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-exclusive bg-green-600 hover:bg-green-700 px-4 py-2"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold text-white mb-4">Edit User</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget as HTMLFormElement);
              updateUser(editingUser.id, {
                firstName: formData.get('firstName') as string,
                lastName: formData.get('lastName') as string,
                email: formData.get('email') as string,
                message: formData.get('message') as string,
                tier: formData.get('tier') as string
              });
            }}>
              <div className="space-y-4">
                <input
                  name="firstName"
                  defaultValue={editingUser.first_name}
                  placeholder="First Name"
                  required
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded"
                />
                <input
                  name="lastName"
                  defaultValue={editingUser.last_name}
                  placeholder="Last Name"
                  required
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded"
                />
                <input
                  name="email"
                  type="email"
                  defaultValue={editingUser.email}
                  placeholder="Email"
                  required
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded"
                />
                <select
                  name="tier"
                  defaultValue={editingUser.tier}
                  required
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded"
                >
                  <option value="The Invitation">The Invitation</option>
                  <option value="The Circle">The Circle</option>
                  <option value="The Inner Sanctum">The Inner Sanctum</option>
                </select>
                <textarea
                  name="message"
                  defaultValue={editingUser.message || ''}
                  placeholder="Message (optional)"
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn-exclusive bg-gray-600 hover:bg-gray-700 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-exclusive bg-blue-600 hover:bg-blue-700 px-4 py-2"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-96 max-w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Send Invite to {selectedPerson.first_name} {selectedPerson.last_name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email: {selectedPerson.email}
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Custom Message (optional):
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Add a personal message to the invite..."
                  className="w-full bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded"
                  rows={4}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useTemplate"
                  checked={useTemplate}
                  onChange={(e) => setUseTemplate(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="useTemplate" className="text-sm text-gray-300">
                  Save as template for future use
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedPerson(null);
                  setInviteMessage('');
                }}
                className="btn-exclusive bg-gray-600 hover:bg-gray-700 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                className="btn-exclusive bg-white text-black px-4 py-2"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
