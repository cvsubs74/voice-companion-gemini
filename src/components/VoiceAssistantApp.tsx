
import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings, InfoIcon, Volume2 } from 'lucide-react';
import VoiceInput from './VoiceInput';
import ConversationBubble from './ConversationBubble';
import StatusIndicator from './StatusIndicator';
import voiceAssistant from '@/services/voiceAssistant';

type ConversationEntry = {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
};

type ProcessingState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

const VoiceAssistantApp: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [statusMessage, setStatusMessage] = useState('Ready');
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [debug, setDebug] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  
  // Initialize voice assistant
  useEffect(() => {
    voiceAssistant.setCallbacks({
      onStatusChange: (status) => {
        setStatusMessage(status);
        
        if (status.includes('Listening')) {
          setProcessingState('listening');
        } else if (status.includes('Processing')) {
          setProcessingState('processing');
        } else if (status.includes('Speaking')) {
          setProcessingState('speaking');
        } else if (status.includes('Error')) {
          setProcessingState('error');
        } else {
          setProcessingState('idle');
        }
        
        addDebugMessage(`Status changed: ${status}`);
      },
      onTranscript: (text) => {
        addConversationEntry('user', text);
        addDebugMessage(`Transcript: ${text}`);
      },
      onAIResponse: (text) => {
        addConversationEntry('ai', text);
        addDebugMessage(`AI Response: ${text}`);
        voiceAssistant.textToSpeech(text);
      },
      onError: (error) => {
        setProcessingState('error');
        setStatusMessage(error);
        addDebugMessage(`Error: ${error}`);
      }
    });
    
    // Register voices when they're loaded (this helps with TTS voice selection)
    window.speechSynthesis.onvoiceschanged = () => {
      addDebugMessage(`Voices loaded: ${window.speechSynthesis.getVoices().length}`);
    };
    
    // Clean up on unmount
    return () => {
      voiceAssistant.stopListening();
    };
  }, []);
  
  // Auto-scroll to the latest message
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [conversation]);
  
  const handleStartListening = () => {
    setIsListening(true);
    addDebugMessage('Start listening requested');
    voiceAssistant.startListening();
  };
  
  const handleStopListening = () => {
    setIsListening(false);
    addDebugMessage('Stop listening requested');
    voiceAssistant.stopListening();
  };
  
  const addConversationEntry = (type: 'user' | 'ai', message: string) => {
    setConversation(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type,
        message,
        timestamp: new Date()
      }
    ]);
  };
  
  const addDebugMessage = (message: string) => {
    setDebug(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };
  
  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <header className="flex justify-between items-center p-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Voice Assistant</h1>
          <Badge variant="outline" className="bg-primary/10 text-primary">
            Demo
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDebug(prev => !prev)}
            className="text-muted-foreground hover:text-foreground"
          >
            <InfoIcon className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      <div className="flex-1 px-4">
        <Tabs defaultValue="chat" className="h-full flex flex-col">
          <TabsList className="mx-auto mb-4">
            <TabsTrigger value="chat">Conversation</TabsTrigger>
            {showDebug && (
              <TabsTrigger value="debug">Debug</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="chat" className="flex-1 flex flex-col">
            <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4 -mr-4">
              <div className="space-y-4 min-h-[calc(100%-120px)]">
                {conversation.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-8">
                    <div className="max-w-sm mx-auto space-y-4">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <Volume2 className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium">Your Voice Assistant</h3>
                      <p className="text-muted-foreground text-sm">
                        Click the microphone button below and start speaking.
                        Try asking for information, help, or just chat!
                      </p>
                    </div>
                  </div>
                ) : (
                  conversation.map((entry, index) => (
                    <ConversationBubble
                      key={entry.id}
                      type={entry.type}
                      message={entry.message}
                      isLatest={index === conversation.length - 1}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {showDebug && (
            <TabsContent value="debug" className="flex-1">
              <ScrollArea className="h-full pr-4 -mr-4">
                <div className="space-y-2 pb-4 text-xs font-mono">
                  {debug.length === 0 ? (
                    <p className="text-muted-foreground">No debug messages yet.</p>
                  ) : (
                    debug.map((msg, i) => (
                      <div key={i} className="p-2 border bg-muted/50 rounded">
                        {msg}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </div>
      
      <div className="p-4 flex flex-col items-center gap-2">
        <StatusIndicator status={processingState} message={statusMessage} />
        <VoiceInput
          isListening={isListening}
          onStartListening={handleStartListening}
          onStopListening={handleStopListening}
          processingState={processingState}
        />
      </div>
    </div>
  );
};

export default VoiceAssistantApp;
