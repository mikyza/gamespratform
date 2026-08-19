"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { io, Socket } from "socket.io-client";

import Auth from './components/Auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://gamespratform.onrender.com';

const GAME_DATA: Record<string, { url: string, img: string, name: string }> = {
  chess: { name: 'Pro Chess', url: 'https://lichess.org/tv/frame?theme=brown&bg=dark', img: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=500&q=80' },
  checkers: { name: 'Checkers', url: 'https://html5.gamedistribution.com/rvvASSmo/checkers/', img: 'https://images.unsplash.com/photo-1610892244243-98bb4b9c595d?w=500&q=80' },
  connect4: { name: 'Connect 4', url: 'https://html5.gamedistribution.com/connect-4/', img: 'https://images.unsplash.com/photo-1651586733979-91cece135111?w=500&q=80' }
};

interface WaitingPlayer {
  username: string;
  country: string;
  badge: string;
  entryFee: number;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [matchState, setMatchState] = useState<'dashboard' | 'waiting' | 'playing'>('dashboard');
  const [activeGame, setActiveGame] = useState<string>('chess');
  const [entryAmount, setEntryAmount] = useState<number>(100);
  
  const [waitingPlayers, setWaitingPlayers] = useState<WaitingPlayer[]>([]);
  const [roomWarning, setRoomWarning] = useState<string>('');
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user && !socketRef.current) {
      socketRef.current = io(BACKEND_URL, {
        transports: ['websocket'],
        withCredentials: true,
      });

      socketRef.current.on('waiting_for_opponent', () => setMatchState('waiting'));
      socketRef.current.on('game_start', () => setMatchState('playing'));
      
      socketRef.current.on('waiting_room_update', (players: WaitingPlayer[]) => {
        setWaitingPlayers(players);
        // Check if there's anyone with the exact money
        const exactMatch = players.some(p => p.entryFee === entryAmount);
        if (!exactMatch && players.length > 0 && matchState === 'waiting') {
            setRoomWarning(`No players currently betting KES ${entryAmount}. Consider changing your bet amount to find a match faster!`);
        } else {
            setRoomWarning('');
        }
      });

      socketRef.current.on('match_settled', ({ payout, isDraw, winnerId }: { payout: number, isDraw: boolean, winnerId: string }) => {
        if (isDraw) {
            alert('🤝 Game Drawn! Bets fully refunded to your account.');
        } else {
            const isWinner = winnerId === user.id;
            alert(isWinner ? `🏆 VICTORY! KES ${payout} has been meaningfully allocated to your account.` : `💀 Defeat. Better luck next time.`);
        }
        setMatchState('dashboard');
      });
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user, entryAmount, matchState]);

  const handleJoinMatch = (gameType: string) => {
    setActiveGame(gameType);
    if (socketRef.current && user) {
      socketRef.current.emit('join_match', { 
        userId: user.id,
        username: user.username || 'Player',
        gameType, 
        entryFee: entryAmount,
        country: user.country || 'Kenya', // Dynamically pull from user data
        badge: user.rating > 2000 ? '⭐ Grandmaster' : '🔥 Veteran'
      });
    }
  };

  const handleFinishMatch = (isDraw = false) => {
    if (socketRef.current && user) {
      socketRef.current.emit('match_end', { 
        matchId: socketRef.current.id, 
        winnerId: user.id, 
        isDraw 
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-4 lg:p-8 flex flex-col items-center">
      {/* Header logic remains the same */}
      
      <main className="w-full max-w-6xl mt-8">
        {!user ? (
          <Auth onLogin={setUser} />
        ) : matchState === 'dashboard' ? (
          
          <div className="space-y-8">
             <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                <h3 className="text-xl font-bold mb-4">Select Bet Amount</h3>
                <input 
                    type="number" 
                    value={entryAmount}
                    onChange={(e) => setEntryAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-xl text-emerald-400 font-bold"
                    placeholder="Enter KES amount..."
                />
             </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(GAME_DATA).map(([key, game]) => (
                    <div key={key} onClick={() => handleJoinMatch(key)} className="group cursor-pointer relative rounded-2xl overflow-hidden border border-slate-800 hover:border-indigo-500 transition-all">
                        <img src={game.img} alt={game.name} className="w-full h-48 object-cover opacity-60 group-hover:opacity-100 transition-all" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent flex flex-col justify-end p-5">
                            <h3 className="text-2xl font-black text-white">{game.name}</h3>
                            <p className="text-indigo-400 font-bold mt-1">Play for KES {entryAmount}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>

        ) : matchState === 'waiting' ? (
            <div className="w-full max-w-3xl mx-auto bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-2xl font-black">Waiting Room</h2>
                    <p className="text-slate-400">Looking for a KES {entryAmount} match in {GAME_DATA[activeGame].name}</p>
                </div>

                {roomWarning && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl mb-6 text-sm font-semibold text-center">
                        ⚠️ {roomWarning}
                    </div>
                )}

                <div className="space-y-4">
                    <h4 className="font-bold text-slate-300 uppercase text-sm tracking-wider border-b border-slate-800 pb-2">Active Players Online</h4>
                    {waitingPlayers.length === 0 ? (
                        <p className="text-slate-500 text-center py-4">It's quiet here. You are the first in the lobby.</p>
                    ) : (
                        waitingPlayers.map((p, i) => (
                            <div key={i} className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl" title={p.country}>{p.country === 'Kenya' ? '🇰🇪' : '🌍'}</span>
                                    <div>
                                        <p className="font-bold text-white">{p.username}</p>
                                        <p className="text-xs text-indigo-400 font-bold">{p.badge} 🎖️</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-400">Betting</p>
                                    <p className="font-black text-emerald-400">KES {p.entryFee}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        ) : (
          <div className="w-full flex flex-col items-center">
             <iframe src={GAME_DATA[activeGame].url} className="w-full h-[70vh] border-none rounded-2xl" />
             <div className="flex gap-4 mt-6">
                <button onClick={() => handleFinishMatch(true)} className="px-6 py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700">🤝 Draw</button>
                <button onClick={() => handleFinishMatch(false)} className="px-8 py-3 rounded-xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600">🏆 Claim Win</button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
