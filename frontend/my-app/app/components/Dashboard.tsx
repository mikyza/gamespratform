"use client";
import { useState } from 'react';

interface DashboardProps {
  user: any;
  onJoinMatch: (gameType: string, mode: string, entryFee: number) => void;
}

export default function Dashboard({ user, onJoinMatch }: DashboardProps) {
  const [mode, setMode] = useState('demo');
  const [category, setCategory] = useState('board');
  const [game, setGame] = useState('chess');
  const [stake, setStake] = useState('100');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    onJoinMatch(game, mode, Number(stake));
  };

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Wallet Balance Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl"></div>
          <p className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">Demo Credits</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              🪙 {user?.demo_balance?.toLocaleString() ?? 10000}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Practice funds for testing strategy</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl"></div>
          <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Real Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              KES {user?.real_balance?.toLocaleString() ?? 0}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Withdrawable cash balance</p>
        </div>
      </section>

      {/* Match Configuration Section */}
      <section className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 sm:p-8 shadow-2xl">
        <div className="mb-6 border-b border-slate-800 pb-4">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Find a Match</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Select your mode, title, and entry stake to find an opponent.</p>
        </div>

        <form onSubmit={handleJoin} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-end">
          
          {/* Mode Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Mode</label>
            <div className="relative">
              <select 
                value={mode} 
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm appearance-none cursor-pointer"
              >
                <option value="demo">Demo Mode (Free)</option>
                <option value="real">Real Cash Mode</option>
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</div>
            </div>
          </div>

          {/* Category Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Category</label>
            <div className="relative">
              <select 
                value={category} 
                onChange={(e) => {
                  const cat = e.target.value;
                  setCategory(cat);
                  if (cat === 'board') setGame('chess');
                  if (cat === 'card') setGame('blackjack');
                  if (cat === 'arcade') setGame('shooter');
                }}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm appearance-none cursor-pointer"
              >
                <option value="board">Board Games</option>
                <option value="card">Card Games</option>
                <option value="arcade">Arcade & Action</option>
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</div>
            </div>
          </div>

          {/* Game Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Game</label>
            <div className="relative">
              <select 
                value={game} 
                onChange={(e) => setGame(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm appearance-none cursor-pointer"
              >
                {category === 'board' && (
                  <>
                    <option value="chess">Chess 1v1</option>
                    <option value="checkers">Checkers</option>
                    <option value="connect4">Connect 4</option>
                  </>
                )}
                {category === 'card' && (
                  <>
                    <option value="blackjack">Blackjack</option>
                    <option value="poker">Texas Hold'em</option>
                  </>
                )}
                {category === 'arcade' && (
                  <>
                    <option value="shooter">Target Shooter</option>
                    <option value="runner">Endless Runner</option>
                  </>
                )}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</div>
            </div>
          </div>

          {/* Stake Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Entry Stake</label>
            <div className="relative">
              <select 
                value={stake} 
                onChange={(e) => setStake(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-sm appearance-none cursor-pointer"
              >
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="250">250</option>
                <option value="500">500</option>
                <option value="1000">1,000</option>
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">▼</div>
            </div>
          </div>

          {/* Submit CTA Button */}
          <div className="sm:col-span-2 lg:col-span-4 mt-2">
            <button 
              type="submit"
              className="w-full py-4 rounded-xl font-black text-white text-base sm:text-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 shadow-xl shadow-indigo-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <span>⚔️</span>
              Join {mode === 'real' ? 'CASH' : 'DEMO'} Match ({stake} {mode === 'real' ? 'KES' : 'Credits'})
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
