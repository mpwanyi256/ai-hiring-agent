import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'Jane (HR)',
    text: 'I think this candidate is a great fit for the team!',
    timestamp: '2025-07-01T13:00:00Z',
  },
  {
    id: '2',
    sender: 'Alex (Engineering)',
    text: 'Agreed, strong technical skills.',
    timestamp: '2025-07-01T13:05:00Z',
  },
  {
    id: '3',
    sender: 'Sam (Recruiter)',
    text: 'Should we move to the next round?',
    timestamp: '2025-07-01T13:10:00Z',
  },
];

const MessagesTab: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([
      ...messages,
      {
        id: (messages.length + 1).toString(),
        sender: 'You',
        text: input,
        timestamp: new Date().toISOString(),
      },
    ]);
    setInput('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-300px)] min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto px-0 pb-2">
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex flex-col bg-gray-50 rounded-lg p-3 border border-gray-100"
            >
              <span className="text-xs font-semibold text-primary-700 mb-0.5">{msg.sender}</span>
              <span className="text-gray-800 text-sm mb-0.5">{msg.text}</span>
              <span className="text-xs text-gray-400">
                {new Date(msg.timestamp).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <input
          type="text"
          className="flex-1 border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          className="bg-primary text-white px-3 py-1.5 rounded-md text-sm font-semibold shadow"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default MessagesTab;
