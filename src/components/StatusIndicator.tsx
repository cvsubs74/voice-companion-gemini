
import React from 'react';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

interface StatusIndicatorProps {
  status: Status;
  message: string;
}

const getStatusColor = (status: Status) => {
  switch (status) {
    case 'listening':
      return 'text-green-500';
    case 'processing':
      return 'text-amber-500';
    case 'speaking':
      return 'text-blue-500';
    case 'error':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

const getStatusText = (status: Status) => {
  switch (status) {
    case 'idle':
      return 'Ready';
    case 'listening':
      return 'Listening';
    case 'processing':
      return 'Processing';
    case 'speaking':
      return 'Speaking';
    case 'error':
      return 'Error';
  }
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, message }) => {
  return (
    <div className="flex items-center gap-2 text-sm animate-in">
      <div className="flex items-center gap-1.5">
        <div 
          className={cn(
            "w-2 h-2 rounded-full",
            getStatusColor(status)
          )}
        />
        <span className="font-medium">
          {getStatusText(status)}
        </span>
      </div>
      {message && (
        <>
          <span className="text-muted-foreground mx-1">•</span>
          <span className="text-muted-foreground truncate max-w-[200px]">
            {message}
          </span>
        </>
      )}
    </div>
  );
};

export default StatusIndicator;
