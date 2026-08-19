"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'finances' | 'games'>('users');
  const [users, setUsers] = useState([]); // Will hold data from /api/admin/users
  
  // Example mock data for preview
  const mockUsers = [
    { id: '1', username: 'player_one', email: 'p1@test.com', real_balance: 1500, status: 'active' },
    { id: '2', username: 'crypto_king', email: 'king@test.com', real_balance: 12000, status: 'banned' },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans p-4 sm:p-8 flex flex-col items-center">
      
      {/* Header */}
      <header className="w-full max-w-7xl flex items-center justify-between bg-slate-900/80 border border-rose-500/20 p-4 rounded-2xl shadow-xl mb-8">
        <div>
          <h1 className="text-2xl font-black text-rose-500">System Override</h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest">Master Admin Control Panel</p>
        </div>
        <Link href="/" className="px-4 py-2 bg-slate-800 rounded-lg text-sm font-bold hover:bg-slate-700 transition-all">
          ⬅ Return to Arena
        </Link>
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2 h-fit">
          <button 
            onClick={() => setActiveTab('users')}
            className={`p-4 rounded-xl text-left font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
          >
            👥 User Management
          </button>
          <button 
            onClick={() => setActiveTab('finances')}
            className={`p-4 rounded-xl text-left font-bold transition-all ${activeTab === 'finances' ? 'bg-emerald-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
          >
            💰 Financial Ledger
          </button>
          <button 
            onClick={() => setActiveTab('games')}
            className={`p-4 rounded-xl text-left font-bold transition-all ${activeTab === 'games' ? 'bg-rose-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'}`}
          >
            ⚔️ Active Matches
          </button>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          
          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Registered Accounts</h2>
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
                    {mockUsers.map((u) => (
                      <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                        <td className="p-3 font-semibold">{u.username}</td>
                        <td className="p-3 text-sm text-slate-400">{u.email}</td>
                        <td className="p-3 text-emerald-400 font-mono">{u.real_balance.toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 text-xs rounded border ${u.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3 flex justify-end gap-2">
                          <button className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs font-bold transition-all">Edit Balance</button>
                          <button className="px-3 py-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded text-xs font-bold transition-all">Ban</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Finances Tab */}
          {activeTab === 'finances' && (
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-bold">Platform Revenue & Payouts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Platform Float</p>
                  <p className="text-3xl font-black text-white">KES 450,200</p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Pending Withdrawals</p>
                  <p className="text-3xl font-black text-amber-400">KES 12,500</p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Platform Commission</p>
                  <p className="text-3xl font-black text-emerald-400">KES 84,000</p>
                </div>
              </div>
            </div>
          )}

          {/* Active Matches Tab */}
          {activeTab === 'games' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Live Socket Connections</h2>
                <button className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-sm">Force Stop All Games</button>
              </div>
              <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-8 text-center text-slate-400 flex flex-col items-center">
                <span className="text-4xl mb-2">📡</span>
                <p>Socket listener required to view real-time lobbies.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
