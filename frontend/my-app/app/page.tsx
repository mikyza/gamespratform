"use client";
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from "socket.io-client";
import Auth from './components/Auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://gamespratform.onrender.com';

// Expanded Categories & Multi-player capacity configurations
const GAME_CATALOG: Record<string, { name: string, category: string, minPlayers: number, maxPlayers: number, url: string, img: string }> = {
  chess: { name: 'Grandmaster Chess', category: 'Strategy', minPlayers: 2, maxPlayers: 2, url: 'https://lichess.org/tv/frame?theme=brown&bg=dark', img: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=500&q=80' },
  checkers: { name: 'Classic Checkers', category: 'Board', minPlayers: 2, maxPlayers: 2, url: 'https://html5.gamedistribution.com/rvvASSmo/checkers/', img: 'https://images.unsplash.com/photo-1610892244243-98bb4b9c595d?w=500&q=80' },
  poker: { name: 'Texas Holdem Poker', category: 'Card', minPlayers: 2, maxPlayers: 4, url: 'https://html5.gamedistribution.com/poker/', img: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=500&q=80' },
  speed_trivia: { name: 'Trivia Battle Royale', category: 'Quiz', minPlayers: 2, maxPlayers: 6, url: 'https://opentdb.com/', img: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=500&q=80' },
  arcade_runner: { name: 'Cyber Runner 3D', category: 'Arcade', minPlayers: 1, maxPlayers: 3, url: 'https://playcanv.as/p/2O2R206U/', img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&q=80' }
};

interface RoomData {
  roomId: string;
  gameType: string;
  entryFee: number;
  maxPlayers: number;
  hostSocketId: string;
  players: Array<{ socketId: string, username: string, country: string, badge: string }>;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [matchState, setMatchState] = useState<'dashboard' | 'room_lobby' | 'playing'>('dashboard');
  const [activeGame, setActiveGame] = useState<string>('chess');
  const [entryAmount, setEntryAmount] = useState<number>(100);
  
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [activeRooms, setActiveRooms] = useState<RoomData[]>([]);
  const [currentRoom, setCurrentRoom] = useState<RoomData | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user && !socketRef.current) {
      socketRef.current = io(BACKEND_URL, { transports: ['websocket'], withCredentials: true });

      socketRef.current.on('connect', () => {
        socketRef.current?.emit('register_presence', {
          userId: user.id,
          username: user.mobileUsername || user.username || 'MobileUser_' + Math.floor(Math.random() * 1000),
          country: user.country || 'Kenya',
          badge: '💎 Elite Expert' // Hard-to-achieve expertise badge
        });
      });

      socketRef.current.on('online_users_update', (users) => setOnlineUsers(users));
      socketRef.current.on('rooms_list_update', (rooms) => setActiveRooms(rooms));
      socketRef.current.on('room_created', (room) => { setCurrentRoom(room); setMatchState('room_lobby'); });
      socketRef.current.on('room_update', (room) => setCurrentRoom(room));
      
      socketRef.current.on('game_start', () => setMatchState('playing'));
      socketRef.current.on('match_settled', ({ payout, isDraw, winnerId }) => {
        if (isDraw) alert('🤝 Match resulted in a draw! Funds fully refunded.');
        else alert(winnerId === user.id ? `🏆 Victory! KES ${payout} credited to your mobile account.` : '💀 Defeat. Better luck next game.');
        setMatchState('dashboard');
        setCurrentRoom(null);
      });
    }

    return () => { socketRef.current?.disconnect(); };
  }, [user]);

  const handleCreateRoom = (gameKey: string) => {
    const gameConfig = GAME_CATALOG[gameKey];
    setActiveGame(gameKey);
    socketRef.current?.emit('create_custom_room', {
      gameType: gameKey,
      entryFee: entryAmount,
      maxPlayers: gameConfig.maxPlayers
    });
  };

  const handleJoinRoom = (roomId: string, gameKey: string) => {
    setActiveGame(gameKey);
    socketRef.current?.emit('join_custom_room', { roomId });
    // Find room locally for immediate view
    const room = activeRooms.find(r => r.roomId === roomId);
    if (room) { setCurrentRoom(room); setMatchState('room_lobby'); }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-4 lg:p-8 flex flex-col items-center font-sans">
      
      <main className="w-full max-w-6xl mt-4">
        {!user ? (
          <Auth onLogin={setUser} />
        ) : matchState === 'dashboard' ? (
          
          <div className="space-y-8">
            {/* Top Bar with Mobile Username Identification */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📱</span>
                <div>
                  <h2 className="text-lg font-black text-white">{user.mobileUsername || user.username || 'Mobile User'}</h2>
                  <p className="text-xs text-indigo-400 font-bold">Badge: 💎 Elite Expert (High Difficulty Unlocked)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Stake: KES</span>
                <input 
                  type="number" 
                  value={entryAmount} 
                  onChange={(e) => setEntryAmount(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 px-4 py-2 rounded-xl text-emerald-400 font-black w-28 text-center"
                />
              </div>
            </div>

            {/* Game Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(GAME_CATALOG).map(([key, game]) => (
                <div key={key} className="bg-slate-900/60 rounded-3xl overflow-hidden border border-slate-800 flex flex-col justify-between group hover:border-indigo-500 transition-all shadow-xl">
                  <div className="relative h-44">
                    <img src={game.img} alt={game.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" />
                    <span className="absolute top-3 right-3 bg-slate-950/80 text-[10px] font-black px-3 py-1 rounded-full text-indigo-300 border border-slate-800">
                      {game.category} ({game.maxPlayers} Players Max)
                    </span>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    <div>
                      <h3 className="text-xl font-black text-white">{game.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">Requires selecting up to {game.maxPlayers} players manually before launching.</p>
                    </div>
                    <button 
                      onClick={() => handleCreateRoom(key)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-extrabold text-white rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all"
                    >
                      Create Custom Room (KES {entryAmount})
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Rooms List To Join Handpicked Games */}
            <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
              <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <span>🚪</span> Open Rooms & Waiting Lobbies ({activeRooms.length})
              </h3>
              <div className="space-y-3">
                {activeRooms.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No active rooms open. Create one above to invite players!</p>
                ) : (
                  activeRooms.map((room) => (
                    <div key={room.roomId} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-white text-sm">{GAME_CATALOG[room.gameType]?.name} Room</p>
                        <p className="text-xs text-indigo-400">Slots Filled: {room.players.length} / {room.maxPlayers} | Fee: KES {room.entryFee}</p>
                      </div>
                      <button 
                        onClick={() => handleJoinRoom(room.roomId, room.gameType)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl text-white transition-all"
                      >
                        Join Room
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        ) : matchState === 'room_lobby' && currentRoom ? (
          
          // Room Waiting & Slot Handpicking Screen (3+ Player Enforcement)
          <div className="w-full max-w-xl mx-auto bg-slate-900/80 p-8 rounded-3xl border border-slate-800 text-center space-y-6">
            <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center text-2xl mx-auto border border-indigo-500/30">
              👥
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Room Lobby: {GAME_CATALOG[currentRoom.gameType]?.name}</h2>
              <p className="text-xs text-slate-400 mt-1">Waiting for players to join slots ({currentRoom.players.length} / {currentRoom.maxPlayers})</p>
            </div>

            <div className="space-y-2 text-left bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Selected Players in Room:</p>
              {currentRoom.players.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800/80 text-xs">
                  <span className="font-bold text-white">📱 {p.username}</span>
                  <span className="text-indigo-400 font-semibold">{p.badge}</span>
                </div>
              ))}
            </div>

            {currentRoom.hostSocketId === socketRef.current?.id ? (
              <button 
                onClick={() => socketRef.current?.emit('start_custom_match', { roomId: currentRoom.roomId })}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 font-black text-white rounded-2xl text-sm shadow-xl tracking-wider uppercase"
              >
                Start Match Now ({currentRoom.players.length}/{currentRoom.maxPlayers} Ready)
              </button>
            ) : (
              <p className="text-xs text-amber-400 animate-pulse font-semibold">Waiting for the host to launch the game session...</p>
            )}
          </div>

        ) : (
          
          // Active Gameplay Frame (Players play manually by themselves)
          <div className="w-full flex flex-col items-center space-y-4">
            <div className="w-full flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <h3 className="font-black text-sm text-indigo-400 uppercase tracking-widest">🎮 Live Interactive Match</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => socketRef.current?.emit('match_end', { isDraw: true, payout: entryAmount })}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-slate-200"
                >
                  🤝 Declare Draw
                </button>
                <button 
                  onClick={() => socketRef.current?.emit('match_end', { isDraw: false, winnerId: user.id, payout: entryAmount * 2 })}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold rounded-xl text-white shadow-lg"
                >
                  🏆 Claim Win & Allocate Funds
                </button>
              </div>
            </div>

            <div className="w-full bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
              <iframe 
                src={GAME_CATALOG[activeGame]?.url || GAME_CATALOG.chess.url} 
                className="w-full h-[75vh] border-none" 
                title="Interactive Match Window"
              />
            </div>
          </div>

        )}
      </main>
    </div>
  );
}
