
// Voice Assistant Service
import geminiService from './geminiService';

class VoiceAssistantService {
  private isListening: boolean = false;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private audioQueue: Array<Float32Array> = [];
  private recognitionTimeoutId: number | null = null;
  
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
      
      // Simulate speech recognition after a delay
      this.simulateRecognition();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      if (this.onError) {
        this.onError('Microphone access denied. Please grant permission.');
      }
    }
  }
  
  // Stop listening
  public stopListening() {
    if (!this.isListening) return;
    
    // Stop any pending recognition
    if (this.recognitionTimeoutId) {
      window.clearTimeout(this.recognitionTimeoutId);
      this.recognitionTimeoutId = null;
    }
    
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
  
  // Simulate speech recognition (in a real app, this would use a proper API)
  private simulateRecognition() {
    // Random recognition time between 2-5 seconds
    const recognitionTime = 2000 + Math.random() * 3000;
    
    this.recognitionTimeoutId = window.setTimeout(() => {
      if (!this.isListening) return;
      
      if (this.onStatusChange) {
        this.onStatusChange('Processing...');
      }
      
      // Get a random example query
      const exampleQueries = [
        "What's the weather like today?",
        "Tell me about the latest technology news",
        "How does artificial intelligence work?",
        "What are the best restaurants nearby?",
        "Can you explain quantum computing?",
        "What's your favorite movie?"
      ];
      
      const randomQuery = exampleQueries[Math.floor(Math.random() * exampleQueries.length)];
      
      // Send the transcript
      if (this.onTranscript) {
        this.onTranscript(randomQuery);
      }
      
      // Get AI response using Gemini
      setTimeout(() => {
        this.getAIResponse(randomQuery);
      }, 1500);
      
      // Continue listening if still active
      if (this.isListening) {
        this.simulateRecognition();
      }
    }, recognitionTime);
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
      
      const response = responses[query] || "I'm not sure how to respond to that. Could you ask something else?";
      
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
    
    // Use the Web Speech API for text-to-speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Get a nice voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') && voice.name.includes('Female') ||
      voice.name.includes('Samantha') ||
      voice.name.includes('Daniel')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onend = () => {
      if (this.onStatusChange) {
        this.onStatusChange('Idle');
      }
    };
    
    window.speechSynthesis.speak(utterance);
  }
}

export default new VoiceAssistantService();
