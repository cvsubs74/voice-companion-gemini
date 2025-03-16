
import React from 'react';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationBubbleProps {
  type: 'user' | 'ai';
  message: string;
  isLatest?: boolean;
}

const ConversationBubble: React.FC<ConversationBubbleProps> = ({ 
  type, 
  message,
  isLatest = false
}) => {
  return (
    <div 
      className={cn(
        "flex gap-3 max-w-full animate-in group transition-all",
        type === 'user' ? "flex-row" : "flex-row",
        isLatest && "animate-fade-in"
      )}
    >
      <div className="flex-shrink-0">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          type === 'user' 
            ? "bg-blue-100 text-primary" 
            : "bg-primary/10 text-primary"
        )}>
          {type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className={cn(
          "rounded-2xl px-4 py-2.5 text-sm overflow-hidden break-words",
          type === 'user' 
            ? "bg-secondary text-foreground" 
            : "bg-primary/5 text-foreground border border-primary/10"
        )}>
          {message}
        </div>
      </div>
    </div>
  );
};

export default ConversationBubble;
