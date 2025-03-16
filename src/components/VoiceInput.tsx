
import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProcessingState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

type VoiceInputProps = {
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  processingState: ProcessingState;
};

const VoiceInput: React.FC<VoiceInputProps> = ({
  isListening,
  onStartListening,
  onStopListening,
  processingState
}) => {
  const [animateWave, setAnimateWave] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setAnimateWave(processingState === 'listening');
  }, [processingState]);

  useEffect(() => {
    // If isListening is false but the UI still shows active states,
    // ensure the UI reflects the correct state
    if (!isListening && (processingState === 'listening')) {
      // Force reset if there's a mismatch
      setAnimateWave(false);
    }
  }, [isListening, processingState]);

  const handleClick = () => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }

    // Add button press effect
    if (buttonRef.current) {
      buttonRef.current.classList.add('scale-95');
      setTimeout(() => {
        if (buttonRef.current) {
          buttonRef.current.classList.remove('scale-95');
        }
      }, 150);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={cn(
          "relative w-16 h-16 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 ease-in-out",
          isListening 
            ? "bg-red-500 text-white hover:bg-red-600" 
            : "bg-primary text-white hover:bg-primary/90",
          processingState === 'processing' && "opacity-70"
        )}
        disabled={processingState === 'processing' || processingState === 'speaking'}
      >
        {processingState === 'processing' || processingState === 'speaking' ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : isListening ? (
          <MicOff className="h-8 w-8" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
        {isListening && processingState === 'listening' && (
          <span className="absolute inset-0 rounded-full pulse-ring"></span>
        )}
      </button>
      
      {isListening && processingState === 'listening' && (
        <div className="waveform-container mt-4 text-primary opacity-80">
          <div className={`waveform-bar ${animateWave ? 'animate-waveform-1' : ''}`}></div>
          <div className={`waveform-bar ${animateWave ? 'animate-waveform-2' : ''}`}></div>
          <div className={`waveform-bar ${animateWave ? 'animate-waveform-3' : ''}`}></div>
          <div className={`waveform-bar ${animateWave ? 'animate-waveform-4' : ''}`}></div>
          <div className={`waveform-bar ${animateWave ? 'animate-waveform-5' : ''}`}></div>
          <div className={`waveform-bar ${animateWave ? 'animate-waveform-4' : ''}`}></div>
          <div className={`waveform-bar ${animateWave ? 'animate-waveform-3' : ''}`}></div>
          <div className={`waveform-bar ${animateWave ? 'animate-waveform-2' : ''}`}></div>
          <div className={`waveform-bar ${animateWave ? 'animate-waveform-1' : ''}`}></div>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
