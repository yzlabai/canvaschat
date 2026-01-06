"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { AIMessage } from '@/types/ideas';

interface ChatHistoryProps {
  messages: AIMessage[];
}

export function ChatHistory({ messages }: ChatHistoryProps) {
  return (
    <ScrollArea className="flex-1 p-4 overflow-auto">
      <div className="space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id}
            className="flex justify-start"
          >
            <div className={`max-w-[80%] p-3 rounded-lg ${
              message.isFromUser 
                ? ' text-gray-900' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
