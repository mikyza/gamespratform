'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import CallModal from '@/components/CallModal';
import { ChatRoom, CallState } from '@/shared/types';

export default function WhatsAppWeb() {
  const [activeTab, setActiveTab] = useState<'chats'|'status'|'communities'|'calls'>('chats');
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [callState, setCallState] = useState<{ status: CallState; type?: 'audio' | 'video' }>({ status: 'idle' });

  return (
    <div className="flex h-screen w-full bg-wa-bg text-wa-text overflow-hidden font-sans selection:bg-wa-green/30">
      {/* Main Container */}
      <div className="flex w-full h-full max-w-[1600px] mx-auto shadow-2xl border-x border-wa-border">
        
        {/* Left Navigation Column */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onSelectRoom={setActiveRoom} 
        />

        {/* Rich Chat Area */}
        {activeRoom ? (
          <ChatArea 
            room={activeRoom} 
            onInitiateCall={(type) => setCallState({ status: 'ringing', type })}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-wa-panel border-l border-wa-border">
            <h1 className="text-3xl font-light text-wa-text mb-4">WhatsApp Web</h1>
            <p className="text-wa-muted">Send and receive messages without keeping your phone online.</p>
          </div>
        )}
      </div>

      {/* WebRTC Call Overlay */}
      {callState.status !== 'idle' && (
        <CallModal state={callState} onClose={() => setCallState({ status: 'idle' })} />
      )}
    </div>
  );
}
