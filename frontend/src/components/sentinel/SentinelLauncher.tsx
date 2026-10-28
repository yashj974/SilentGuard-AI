import React from 'react';
import { ShieldCheck, MessageSquare, X } from 'lucide-react';

interface SentinelLauncherProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
}

export const SentinelLauncher: React.FC<SentinelLauncherProps> = ({
  isOpen,
  onToggle,
  unreadCount = 0,
}) => {
  return (
    <button
      onClick={onToggle}
      aria-label={isOpen ? 'Close Sentinel Assistant' : 'Open Sentinel AI Assistant'}
      aria-expanded={isOpen}
      className={`fixed bottom-6 right-6 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-[#FF5722] hover:bg-[#e64a19] text-white shadow-xl shadow-orange-950/60 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-400/40 active:scale-95 group ${
        isOpen ? 'rotate-90' : 'rotate-0'
      }`}
    >
      {/* Subtle outer pulse glow */}
      <span className="absolute -inset-1 rounded-full bg-orange-500/20 blur-md opacity-75 group-hover:opacity-100 transition-opacity" />

      {/* Launcher Icon */}
      <div className="relative z-10 flex items-center justify-center">
        {isOpen ? (
          <X className="h-6 w-6 text-white transition-transform duration-200" />
        ) : (
          <div className="relative">
            <ShieldCheck className="h-6 w-6 text-white" />
            <MessageSquare className="absolute -bottom-1 -right-1 h-3 w-3 text-orange-200 fill-orange-950" />
          </div>
        )}
      </div>

      {/* Notification badge when closed and has unread */}
      {!isOpen && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md">
          {unreadCount}
        </span>
      )}
    </button>
  );
};
