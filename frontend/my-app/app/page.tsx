"use client";
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from "socket.io-client";
import Auth from './components/Auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://gamespratform.onrender.com';

const GAME_DATA: Record<string, { url: string, img: string, name: string }> = {
  chess: { name: 'Pro Chess', url: 'https://lichess.org/tv/frame?theme=brown&bg=dark', img: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=500&q=80' },
  checkers: { name: 'Checkers', url: 'https://html5.gamedistribution.com/rvvASSmo/checkers/', img: 'https://images.unsplash.com/photo-1610892244243-98bb4b9c595d?w=500&q=80' },
  connect4: { name: 'Connect 4', url: 'https://html5.gamedistribution.com/connect-4/', img: 'https://images.unsplash.com/photo-1651586733979-91cece135111?w=500&q=80' }
};

interface OnlineUser {
  socketId: string;
  username: string;
  country: string;
  badge: string;
  status: 'Lobby' | 'Waiting' | 'Playing';
  gameType?: string;
  entryFee?: number;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [matchState, setMatchState] = useState<'dashboard' | 'waiting' | 'playing'>('dashboard');
  const [activeGame, setActiveGame] = useState<string>('chess');
  const [entryAmount, setEntryAmount] = useState<number>(100);
  
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [incomingChallenge, setIncomingChallenge] = useState<any>(null);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user && !socketRef.current) {
      socketRef.current = io(BACKEND_URL, {
        transports: ['websocket'],
        withCredentials: true,
      });

      socketRef.current.on('connect', () => {
        socketRef.current?.emit('register_presence', {
          userId: user.id,
          username: user.username || 'Player',
          country: user.country || 'Kenya',
          badge: user.rating > 2000 ? '⭐ Grandmaster' : '🔥 Veteran'
        });
      });

      socketRef.current.on('online_users_update', (users: OnlineUser[]) => {
        setOnlineUsers(users);
      });

      socketRef.current.on('waiting_for_opponent', () => setMatchState('waiting'));
      socketRef.current.on('game_start', () => {
        setMatchState('playing');
        setIncomingChallenge(null);
      });

      socketRef.current.on('receive_challenge', (challengeData) => {
        setIncomingChallenge(challengeData);
      });
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user]);

  const handleSendChallenge = (targetSocketId: string, gameType: string) => {
    if (socketRef.current) {
      socketRef.current.emit('send_challenge', {
        targetSocketId,
        gameType,
        entryFee: entryAmount
      });
      alert('🎯 Remote challenge sent successfully! Waiting for opponent response...');
    }
  };

  const handleAcceptChallenge = () => {
    if (socketRef.current && incomingChallenge) {
      setActiveGame(incomingChallenge.gameType);
      socketRef.current.emit('accept_challenge', {
        challengerSocketId: incomingChallenge.challengerSocketId,
        gameType: incomingChallenge.gameType,
        entryFee: incomingChallenge.entryFee
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-4 lg:p-8 flex flex-col items-center">
      
      {/* Incoming Challenge Popup Banner */}
      {incomingChallenge && (
        <div className="fixed top-6 z-50 bg-indigo-600 border border-indigo-400 p-5 rounded-2xl shadow-2xl flex items-center gap-6 animate-bounce">
          <div>
            <p className="font-black text-lg">⚔️ Direct Challenge Received!</p>
            <p className="text-sm text-indigo-100">{incomingChallenge.challengerName} ({incomingChallenge.country}) challenges you to {incomingChallenge.gameType.toUpperCase()} for KES {incomingChallenge.entryFee}!</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAcceptChallenge} className="px-4 py-2 bg-emerald-500 font-bold rounded-xl text-white">Accept</button>
            <button onClick={() => setIncomingChallenge(null)} className="px-4 py-2 bg-rose-500 font-bold rounded-xl text-white">Decline</button>
          </div>
        </div>
      )}

      <main className="w-full max-w-6xl mt-6">
        {!user ? (
          <Auth onLogin={setUser} />
        ) : matchState === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Center: Game Selection & Stakes */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
                <h3 className="text-lg font-bold mb-3">Set Match Stakes (KES)</h3>
                <input 
                  type="number" 
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl text-xl text-emerald-400 font-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(GAME_DATA).map(([key, game]) => (
                  <div key={key} onClick={() => { setActiveGame(key); socketRef.current?.emit('join_match', { gameType: key, entryFee: entryAmount }); }} className="group cursor-pointer relative rounded-2xl overflow-hidden border border-slate-800 hover:border-indigo-500 transition-all">
                    <img src={game.img} alt={game.name} className="w-full h-40 object-cover opacity-50 group-hover:opacity-90 transition-all" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent flex flex-col justify-end p-4">
                      <h4 className="text-xl font-black text-white">{game.name}</h4>
                      <p className="text-indigo-400 text-xs font-bold mt-0.5">Quick Queue (KES {entryAmount})</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel: Global Online Community & Devices */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl flex flex-col h-[600px]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <h3 className="font-black text-base flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Online Players & Rooms
                </h3>
                <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-full font-bold text-slate-300">
                  {onlineUsers.length} Active
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {onlineUsers.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">No other devices online.</p>
                ) : (
                  onlineUsers.map((p, idx) => (
                    <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{p.country === 'Kenya' ? '🇰🇪' : '🌍'}</span>
                        <div>
                          <p className="font-bold text-xs text-white">{p.username}</p>
                          <p className="text-[10px] text-indigo-400 font-semibold">{p.badge}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          p.status === 'Lobby' ? 'bg-emerald-500/10 text-emerald-400' :
                          p.status === 'Waiting' ? 'bg-amber-500/10 text-amber-400' : 'bg-purple-500/10 text-purple-400'
                        }`}>
                          {p.status}
                        </span>

                        {p.socketId !== socketRef.current?.id && p.status === 'Lobby' && (
                          <button 
                            onClick={() => handleSendChallenge(p.socketId, activeGame)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold shadow-md transition-all"
                          >
                            Challenge
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        ) : matchState === 'waiting' ? (
          <div className="w-full max-w-xl mx-auto bg-slate-900/60 p-8 rounded-3xl border border-slate-800 text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-black mb-2">Waiting in Queue</h2>
            <p className="text-slate-400 text-sm mb-6">Looking for a matched player betting KES {entryAmount}...</p>
            <button onClick={() => setMatchState('dashboard')} className="px-6 py-2.5 bg-slate-800 rounded-xl font-bold text-sm">Cancel & Return</button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <iframe src={GAME_DATA[activeGame]?.url || GAME_DATA.chess.url} className="w-full h-[72vh] border-none rounded-2xl shadow-2xl" />
            <div className="flex gap-4 mt-6">
              <button onClick={() => { socketRef.current?.emit('match_end', { matchId: socketRef.current.id, isDraw: true }); setMatchState('dashboard'); }} className="px-6 py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700">🤝 Declare Draw</button>
              <button onClick={() => { socketRef.current?.emit('match_end', { matchId: socketRef.current.id, isDraw: false }); setMatchState('dashboard'); }} className="px-8 py-3 rounded-xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white">🏆 Claim Victory</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
