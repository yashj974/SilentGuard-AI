import React, { useState } from 'react';
import { SentinelLauncher } from './SentinelLauncher';
import { SentinelChatPanel } from './SentinelChatPanel';
import type { ChatMessage } from './sentinelKnowledge';
import {
  INITIAL_SENTINEL_MESSAGE,
  SUGGESTED_QUESTIONS,
  getSentinelResponse,
} from './sentinelKnowledge';

export const SentinelWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [INITIAL_SENTINEL_MESSAGE];
  });
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) setUnreadCount(0);
      return next;
    });
  };

  const handleSendMessage = (userText: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Realistic typing delay (450ms)
    setTimeout(() => {
      const response = getSentinelResponse(userText);
      const sentinelMsg: ChatMessage = {
        id: `sentinel-${Date.now()}`,
        sender: 'sentinel',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionButton: response.actionButton,
        quickReplies: response.quickReplies,
      };

      setMessages((prev) => [...prev, sentinelMsg]);
      setIsTyping(false);

      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    }, 450);
  };

  const handleResetChat = () => {
    setMessages([
      {
        ...INITIAL_SENTINEL_MESSAGE,
        id: `welcome-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      <SentinelLauncher
        isOpen={isOpen}
        onToggle={handleToggle}
        unreadCount={unreadCount}
      />

      <SentinelChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onMinimize={() => setIsOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        onResetChat={handleResetChat}
        isTyping={isTyping}
        suggestedQuestions={SUGGESTED_QUESTIONS}
      />
    </>
  );
};
