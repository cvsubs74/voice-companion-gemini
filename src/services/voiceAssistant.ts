// Voice Assistant Service
import geminiService from './geminiService';

class VoiceAssistantService {
  private isListening: boolean = false;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private audioQueue: Array<Float32Array> = [];
  private recognitionTimeoutId: number | null = null;
  private recognition: any = null; // Store recognition instance
  
  // Event callbacks
  private onStatusChange: ((status: string) => void) | null = null;
  private onTranscript: ((text: string) => void) | null = null;
  private onAIResponse: ((text: string) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  
  constructor() {
    this.setupAudioContext();
  }
  
  // Initialize audio context
  private setupAudioContext() {
    try {
      window.AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContext();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser");
    }
  }
  
  // Set up event callbacks
  public setCallbacks({
    onStatusChange,
    onTranscript,
    onAIResponse,
    onError
  }: {
    onStatusChange?: (status: string) => void;
    onTranscript?: (text: string) => void;
    onAIResponse?: (text: string) => void;
    onError?: (error: string) => void;
  }) {
    if (onStatusChange) this.onStatusChange = onStatusChange;
    if (onTranscript) this.onTranscript = onTranscript;
    if (onAIResponse) this.onAIResponse = onAIResponse;
    if (onError) this.onError = onError;
  }
  
  // Start listening
  public async startListening() {
    if (this.isListening) return;
    
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (this.onStatusChange) {
        this.onStatusChange('Listening...');
      }
      
      this.isListening = true;
      this.processAudio();
      
      // Use browser's SpeechRecognition
      this.useSpeechRecognition();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      if (this.onError) {
        this.onError('Microphone access denied. Please grant permission.');
      }
    }
  }
  
  // Use browser's SpeechRecognition API
  private useSpeechRecognition() {
    // Use the type-safe way to access the SpeechRecognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      if (this.onError) {
        this.onError('Speech recognition not supported in this browser');
      }
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    
    this.recognition.onstart = () => {
      if (this.onStatusChange) {
        this.onStatusChange('Listening...');
      }
      console.log('Speech recognition started');
    };
    
    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('Recognized:', transcript);
      
      // Check if the user said "stop" or "stop talking"
      if (
        transcript.toLowerCase().includes('stop') || 
        transcript.toLowerCase().includes('stop talking') || 
        transcript.toLowerCase().includes('shut up')
      ) {
        console.log('Stop command detected');
        
        // Stop the current speech
        window.speechSynthesis.cancel();
        
        if (this.onStatusChange) {
          this.onStatusChange('Stopped by voice command');
          setTimeout(() => {
            if (this.onStatusChange && this.isListening) {
              this.onStatusChange('Listening...');
            }
          }, 1500);
        }
        
        // Don't process this as a query to Gemini
        return;
      }
      
      if (this.onStatusChange) {
        this.onStatusChange('Processing...');
      }
      
      if (this.onTranscript) {
        this.onTranscript(transcript);
      }
      
      // Send to Gemini API
      this.getAIResponse(transcript);
    };
    
    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (this.onError) {
        this.onError(`Speech recognition error: ${event.error}`);
      }
    };
    
    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      // Only restart if we're still supposed to be listening
      if (this.isListening) {
        console.log('Restarting speech recognition');
        try {
          this.recognition.start();
        } catch (err) {
          console.error('Error restarting recognition:', err);
        }
      }
    };
    
    try {
      this.recognition.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      if (this.onError) {
        this.onError(`Error starting speech recognition: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  }
  
  // Stop listening
  public stopListening() {
    if (!this.isListening) return;
    
    console.log('Stopping listening');
    
    // Stop any pending recognition
    if (this.recognitionTimeoutId) {
      window.clearTimeout(this.recognitionTimeoutId);
      this.recognitionTimeoutId = null;
    }
    
    // Stop the speech recognition
    if (this.recognition) {
      try {
        this.recognition.stop();
        console.log('Recognition stopped');
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
      this.recognition = null;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    this.isListening = false;
    
    // Stop microphone
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // Clean up audio processing
    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }
    
    this.audioQueue = [];
    
    if (this.onStatusChange) {
      this.onStatusChange('Idle');
    }
  }
  
  // Process audio from microphone
  private processAudio() {
    if (!this.audioContext || !this.mediaStream) return;
    
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    this.audioProcessor.onaudioprocess = (e) => {
      if (!this.isListening) return;
      
      const input = e.inputBuffer.getChannelData(0);
      this.audioQueue.push(new Float32Array(input));
      
      // Check audio level for visualization
      const audioLevel = this.calculateAudioLevel(input);
      console.log('Audio level:', audioLevel);
    };
    
    source.connect(this.audioProcessor);
    this.audioProcessor.connect(this.audioContext.destination);
  }
  
  // Calculate audio level for visualization
  private calculateAudioLevel(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += Math.abs(audioData[i]);
    }
    return sum / audioData.length;
  }
  
  // Get AI response from Gemini API
  private async getAIResponse(query: string) {
    if (this.onStatusChange) {
      this.onStatusChange('Getting AI response...');
    }
    
    try {
      // Check if we have a Gemini API key
      if (!geminiService.getApiKey()) {
        // Fallback to mock responses if no API key
        this.getMockAIResponse(query);
        return;
      }
      
      // Use Gemini for a real response
      const response = await geminiService.generateResponse(query);
      
      if (this.onAIResponse) {
        this.onAIResponse(response);
      }
      
      if (this.onStatusChange) {
        this.onStatusChange('Idle');
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Fallback to mock responses on error
      this.getMockAIResponse(query);
      
      if (this.onError) {
        this.onError(`Error getting AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
  
  // Fallback to mock responses if Gemini is unavailable
  private getMockAIResponse(query: string) {
    // Simulate AI response time
    setTimeout(() => {
      const responses: Record<string, string> = {
        "What's the weather like today?": "I don't have access to real-time weather data, but I'd recommend checking a weather app or website for the most accurate forecast for your location.",
        "Tell me about the latest technology news": "I don't have access to the latest news, but major tech developments recently have included advances in AI, quantum computing, and sustainable energy technologies.",
        "How does artificial intelligence work?": "AI works by using algorithms to analyze data, learn from it, and make decisions or predictions. Modern AI often uses neural networks to simulate human-like learning processes.",
        "What are the best restaurants nearby?": "I don't have access to your location or real-time restaurant data. I'd recommend using a service like Google Maps, Yelp, or TripAdvisor to find highly-rated restaurants in your area.",
        "Can you explain quantum computing?": "Quantum computing uses quantum bits or 'qubits' that can exist in multiple states simultaneously, unlike classical bits. This allows quantum computers to solve certain complex problems much faster than traditional computers.",
        "What's your favorite movie?": "As an AI, I don't watch movies or have personal preferences. But I'd be happy to discuss popular films or recommend something based on genres you enjoy!"
      };
      
      let response = "I'm not sure how to respond to that. Could you ask something else?";
      
      // If query matches exactly (unlikely but checking anyway)
      if (responses[query]) {
        response = responses[query];
      } else {
        // Check for similar queries (more likely case)
        for (const key in responses) {
          if (query.toLowerCase().includes(key.toLowerCase()) || 
              key.toLowerCase().includes(query.toLowerCase())) {
            response = responses[key];
            break;
          }
        }
      }
      
      if (this.onAIResponse) {
        this.onAIResponse(response);
      }
      
      if (this.onStatusChange) {
        this.onStatusChange('Idle');
      }
    }, 2000);
  }
  
  // Convert response text to speech
  public textToSpeech(text: string) {
    if (this.onStatusChange) {
      this.onStatusChange('Speaking...');
    }
    
    // Cancel any ongoing speech before starting new one
    window.speechSynthesis.cancel();
    
    // Use the Web Speech API for text-to-speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Make the voice sound more like a small kid or teddy bear
    utterance.rate = 0.85;     // Even slower rate for child-like speech
    utterance.pitch = 1.8;     // Much higher pitch for a child's voice
    utterance.volume = 1.0;    // Full volume
    
    // Get the available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Try to find voices that sound child-like
    const preferredVoice = voices.find(voice => 
      // Look specifically for child voices first
      voice.name.includes('Kid') || 
      voice.name.includes('Child') || 
      voice.name.includes('Junior') || 
      // Then try higher pitched voices
      voice.name.includes('girl') ||
      // Then fall back to female voices that might be pitched up
      voice.name.includes('female') || 
      voice.name.includes('Female') ||
      voice.name.includes('Samantha') || 
      voice.name.includes('Karen') ||
      voice.name.includes('Tessa')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log(`Using voice: ${preferredVoice.name}`);
    } else {
      console.log('No preferred voice found, using default voice with child-like settings');
    }
    
    // Add frequent gentle pauses between phrases for a more child-like speech pattern
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    
    if (sentences.length > 1) {
      // If we have multiple sentences, add more pauses and make them sound more child-like
      text = sentences.join('! ');
    }
    
    // Add some child-like expressions and speaking style
    text = text.replace(/\b(I am)\b/gi, "I'm");
    text = text.replace(/\b(cannot)\b/gi, "can't");
    text = text.replace(/\b(will not)\b/gi, "won't");
    
    utterance.text = text;
    
    utterance.onend = () => {
      if (this.onStatusChange) {
        this.onStatusChange('Idle');
      }
    };
    
    window.speechSynthesis.speak(utterance);
  }
}

export default new VoiceAssistantService();
