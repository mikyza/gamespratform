"use client";
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from "socket.io-client";
import Auth from './components/Auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://gamespratform.onrender.com';

// Fully interactive game types with categories and selectable max player slots
const GAME_CATALOG: Record<string, { name: string, category: string, maxPlayers: number, img: string }> = {
  checkers: { name: 'Interactive Checkers', category: 'Board Strategy', maxPlayers: 2, img: 'https://images.unsplash.com/photo-1610892244243-98bb4b9c595d?w=500&q=80' },
  tictactoe: { name: 'Ultimate Tic-Tac-Toe', category: 'Quick Match', maxPlayers: 2, img: 'https://images.unsplash.com/photo-1651586733979-91cece135111?w=500&q=80' },
  chess_duel: { name: 'Clickable Chess Arena', category: 'Grandmaster', maxPlayers: 2, img: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=500&q=80' }
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [viewState, setViewState] = useState<'dashboard' | 'room_waiting' | 'playing'>('dashboard');
  const [selectedGame, setSelectedGame] = useState<string>('checkers');
  const [entryAmount, setEntryAmount] = useState<number>(100);
  
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [currentRoom, setCurrentRoom] = useState<any>(null);

  // Interactive Live Game States
  const [boardState, setBoardState] = useState<string[]>(Array(9).fill('')); // For Tic-Tac-Toe / Grid click testing
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);
  const [matchPool, setMatchPool] = useState<number>(0);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user && !socketRef.current) {
      socketRef.current = io(BACKEND_URL, { transports: ['websocket'], withCredentials: true });

      socketRef.current.on('connect', () => {
        socketRef.current?.emit('register_presence', {
          userId: user.id,
          username: user.mobileUsername || user.username || 'MobilePlayer_' + Math.floor(Math.random() * 900),
          country: user.country || 'Kenya'
        });
      });

      socketRef.current.on('online_users_update', (users) => setOnlineUsers(users));
      socketRef.current.on('rooms_list_update', (rooms) => setActiveRooms(rooms));
      socketRef.current.on('room_joined', (room) => { setCurrentRoom(room); setViewState('room_waiting'); });
      socketRef.current.on('room_update', (room) => setCurrentRoom(room));
      
      socketRef.current.on('game_started', ({ gameType, pool, players }) => {
        setSelectedGame(gameType);
        setMatchPool(pool);
        setBoardState(Array(9).fill(''));
        // Host goes first
        const hostSocket = players[0]?.socketId;
        setIsMyTurn(socketRef.current?.id === hostSocket);
        setViewState('playing');
      });

      socketRef.current.on('opponent_moved', ({ newBoard, nextTurnSocket }) => {
        setBoardState(newBoard);
        setIsMyTurn(socketRef.current?.id === nextTurnSocket);
      });

      socketRef.current.on('match_ended', ({ winnerId, isDraw, payout }) => {
        if (isDraw) alert('🤝 Match ended in a draw! Stakes refunded.');
        else alert(winnerId === socketRef.current?.id ? `🏆 Victory! KES ${payout} allocated to your account!` : '💀 Defeat!');
        setViewState('dashboard');
        setCurrentRoom(null);
      });
    }

    return () => { socketRef.current?.disconnect(); };
  }, [user]);

  const handleCreateRoom = (gameKey: string) => {
    setSelectedGame(gameKey);
    socketRef.current?.emit('create_room', {
      gameType: gameKey,
      entryFee: entryAmount,
      maxPlayers: GAME_CATALOG[gameKey].maxPlayers
    });
  };

  const handleJoinRoom = (roomId: string) => {
    socketRef.current?.emit('join_room', { roomId });
  };

  // Clickable Board Move handler for real-time play
  const handleCellClick = (index: number) => {
    if (!isMyTurn || boardState[index] !== '') return;

    const newBoard = [...boardState];
    const myMark = socketRef.current?.id === currentRoom?.hostSocketId ? 'X' : 'O';
    newBoard[index] = myMark;
    setBoardState(newBoard);
    setIsMyTurn(false);

    // Transmit click to opponent through websocket room
    socketRef.current?.emit('make_move', {
      roomId: currentRoom.roomId,
      moveData: {
        newBoard,
        nextTurnSocket: currentRoom.players.find((p: any) => p.socketId !== socketRef.current?.id)?.socketId
      }
    });

    // Check simple win condition for demonstration
    if (newBoard.every(cell => cell !== '')) {
      socketRef.current?.emit('conclude_match', {
        roomId: currentRoom.roomId,
        isDraw: true,
        payout: entryAmount
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 p-4 lg:p-8 flex flex-col items-center font-sans">
      <main className="w-full max-w-5xl mt-4">
        {!user ? (
          <Auth onLogin={setUser} />
        ) : viewState === 'dashboard' ? (
          
          <div className="space-y-8">
            {/* Header info & stakes */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">📱 {user.mobileUsername || user.username || 'Mobile Player'}</h2>
                <p className="text-xs text-indigo-400 font-bold">Expertise Badge: 💎 Elite Master (Hard Unlocked)</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 uppercase font-bold">Stake (KES):</span>
                <input 
                  type="number" 
                  value={entryAmount} 
                  onChange={(e) => setEntryAmount(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 px-4 py-2 rounded-xl text-emerald-400 font-black w-28 text-center"
                />
              </div>
            </div>

            {/* Game Categories with Clickable Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(GAME_CATALOG).map(([key, game]) => (
                <div key={key} className="bg-slate-900/60 rounded-3xl overflow-hidden border border-slate-800 flex flex-col justify-between group hover:border-indigo-500 transition-all shadow-xl">
                  <div className="relative h-40">
                    <img src={game.img} alt={game.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" />
                    <span className="absolute top-3 right-3 bg-slate-950/80 text-[10px] font-black px-3 py-1 rounded-full text-indigo-300 border border-slate-800">
                      {game.category}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    <h3 className="text-lg font-black text-white">{game.name}</h3>
                    <button 
                      onClick={() => handleCreateRoom(key)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-extrabold text-white rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/20"
                    >
                      Create Room (KES {entryAmount})
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Open Rooms to Join Handpicked Peers */}
            <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
              <h3 className="text-lg font-black text-white mb-4">🚪 Active Rooms & Waiting Peers ({activeRooms.length})</h3>
              <div className="space-y-3">
                {activeRooms.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No active rooms found. Create one above to host real players!</p>
                ) : (
                  activeRooms.map((room) => (
                    <div key={room.roomId} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white text-sm">{GAME_CATALOG[room.gameType]?.name} Room</p>
                        <p className="text-xs text-indigo-400">Host: {room.players[0]?.username} | Stake: KES {room.entryFee}</p>
                      </div>
                      <button 
                        onClick={() => handleJoinRoom(room.roomId)}
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
        ) : viewState === 'room_waiting' && currentRoom ? (
          
          // Waiting Room & Handpicked Slot Lobby
          <div className="w-full max-w-xl mx-auto bg-slate-900/80 p-8 rounded-3xl border border-slate-800 text-center space-y-6">
            <h2 className="text-2xl font-black text-white">Room Lobby</h2>
            <p className="text-xs text-slate-400">Waiting for invited players to occupy slots ({currentRoom.players.length} / {currentRoom.maxPlayers})</p>

            <div className="space-y-2 text-left bg-slate-950 p-4 rounded-2xl border border-slate-800">
              {currentRoom.players.map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                  <span className="font-bold text-white">📱 {p.username}</span>
                  <span className="text-indigo-400 font-semibold">{p.country}</span>
                </div>
              ))}
            </div>

            {currentRoom.hostSocketId === socketRef.current?.id ? (
              <button 
                onClick={() => socketRef.current?.emit('start_match', { roomId: currentRoom.roomId })}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 font-black text-white rounded-2xl text-sm shadow-xl uppercase tracking-wider"
              >
                Launch Game Now
              </button>
            ) : (
              <p className="text-xs text-amber-400 animate-pulse font-semibold">Waiting for host to launch match...</p>
            )}
          </div>

        ) : (
          
          // Clickable Real-Time Interactive Playing Board
          <div className="w-full flex flex-col items-center space-y-6">
            <div className="w-full flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <div>
                <h3 className="font-black text-sm text-indigo-400 uppercase tracking-widest">🎮 Live Interactive Match</h3>
                <p className="text-xs text-slate-400">Prize Pool: <span className="text-emerald-400 font-bold">KES {matchPool}</span></p>
              </div>
              <div className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-950 border border-slate-800">
                {isMyTurn ? <span className="text-emerald-400 animate-pulse">🟢 Your Turn! Click Board</span> : <span className="text-amber-400">⏳ Opponent's Turn</span>}
              </div>
            </div>

            {/* Clickable Grid Matrix for Real-Time Play */}
            <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center">
              <div className="grid grid-cols-3 gap-4 w-72 h-72">
                {boardState.map((cell, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCellClick(idx)}
                    className={`h-20 rounded-2xl text-3xl font-black flex items-center justify-center border transition-all ${
                      cell === '' ? 'bg-slate-950 border-slate-800 hover:border-indigo-500 cursor-pointer' : 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300'
                    }`}
                  >
                    {cell}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => socketRef.current?.emit('conclude_match', { roomId: currentRoom.roomId, isDraw: false, winnerId: socketRef.current?.id, payout: matchPool })}
                className="mt-8 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 font-extrabold text-white rounded-xl text-xs shadow-lg uppercase tracking-wider"
              >
                🏆 Claim Win & Allocate Funds
              </button>
            </div>
          </div>

        )}
      </main>
    </div>
  );
}
