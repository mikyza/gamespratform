"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://gamespratform.onrender.com';

interface UserAccount {
  _id: string;
  username: string;
  email: string;
  real_balance: number;
  status?: 'active' | 'banned' | 'suspended';
  role?: string;
}

interface FinancialAnalytics {
  totalSystemFloat: number;
  totalUsers: number;
  estimatedPlatformCut: number;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'finances'>('users');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [analytics, setAnalytics] = useState<FinancialAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Balance Edit Modal State
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [newBalance, setNewBalance] = useState<string>('');

  const getAuthToken = () => localStorage.getItem('token') || '';

  // Fetch All Users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch user list');
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Financial Stats
  const fetchFinances = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/finances`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      if (res.ok) setAnalytics(data.analytics);
    } catch (err: any) {
      console.error('Failed fetching analytics:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchFinances();
  }, []);

  // Modify User Status (Ban / Unban)
  const handleToggleStatus = async (userId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'banned' ? 'active' : 'banned';
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      
      if (!res.ok) throw new Error('Status update rejected');
      
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: nextStatus } : u));
    } catch (err: any) {
      alert(`⚠️ Action Failed: ${err.message}`);
    }
  };

  // Submit Balance Override
  const handleSaveBalance = async () => {
    if (!editingUser) return;
    const numericBalance = parseFloat(newBalance);
    if (isNaN(numericBalance) || numericBalance < 0) return alert('Enter a valid amount');

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${editingUser._id}/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ balance: numericBalance })
      });

      if (!res.ok) throw new Error('Balance update failed');

      setUsers(prev => prev.map(u => u._id === editingUser._id ? { ...u, real_balance: numericBalance } : u));
      setEditingUser(null);
      setNewBalance('');
    } catch (err: any) {
      alert(`⚠️ Error updating balance: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans p-4 sm:p-8 flex flex-col items-center">
      
      {/* Top Bar */}
      <header className="w-full max-w-7xl flex items-center justify-between bg-slate-900/80 border border-rose-500/20 p-4 rounded-2xl shadow-xl mb-8">
        <div>
          <h1 className="text-2xl font-black text-rose-500">System Command Center</h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest">Master Admin Override</p>
        </div>
        <Link href="/" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold transition-all">
          ⬅ Back to Lobby
        </Link>
      </header>

      {error && (
        <div className="w-full max-w-7xl mb-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
          <strong>Authentication / Network Error:</strong> {error}
        </div>
      )}

      {/* Main Grid */}
      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2 h-fit">
          <button 
            onClick={() => setActiveTab('users')}
            className={`p-4 rounded-xl text-left font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
          >
            👥 User Registry ({users.length})
          </button>
          <button 
            onClick={() => setActiveTab('finances')}
            className={`p-4 rounded-xl text-left font-bold transition-all ${activeTab === 'finances' ? 'bg-emerald-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
          >
            💰 Revenue Analytics
          </button>
        </div>

        {/* Content Viewport */}
        <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          
          {/* USER MANAGEMENT TAB */}
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">User Accounts</h2>
                <button onClick={fetchUsers} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs">🔄 Refresh</button>
              </div>

              {loading ? (
                <p className="text-slate-500 py-8 text-center animate-pulse">Loading core system registry...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 text-sm uppercase tracking-wider">
                        <th className="p-3">User</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Balance (KES)</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                          <td className="p-3 font-semibold text-slate-200">
                            {u.username}
                            {u.role === 'admin' && <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30">ADMIN</span>}
                          </td>
                          <td className="p-3 text-sm text-slate-400">{u.email}</td>
                          <td className="p-3 text-emerald-400 font-mono font-bold">
                            KES {(u.real_balance || 0).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-xs rounded border ${u.status === 'banned' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                              {u.status || 'active'}
                            </span>
                          </td>
                          <td className="p-3 flex justify-end gap-2">
                            <button 
                              onClick={() => { setEditingUser(u); setNewBalance(String(u.real_balance || 0)); }}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-bold transition-all"
                            >
                              Edit Balance
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(u._id, u.status)}
                              className={`px-3 py-1 rounded text-xs font-bold transition-all ${u.status === 'banned' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white' : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white'}`}
                            >
                              {u.status === 'banned' ? 'Unban' : 'Ban'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* FINANCIAL ANALYTICS TAB */}
          {activeTab === 'finances' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-bold">Financial Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Vault Deposits</p>
                  <p className="text-3xl font-black text-white">
                    KES {(analytics?.totalSystemFloat || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Platform Accounts</p>
                  <p className="text-3xl font-black text-indigo-400">
                    {analytics?.totalUsers || 0}
                  </p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Estimated Rake Revenue</p>
                  <p className="text-3xl font-black text-emerald-400">
                    KES {(analytics?.estimatedPlatformCut || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* BALANCE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold">Override Balance: {editingUser.username}</h3>
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase block mb-1">New Balance (KES)</label>
              <input 
                type="number" 
                value={newBalance} 
                onChange={(e) => setNewBalance(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditingUser(null)} className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={handleSaveBalance} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
