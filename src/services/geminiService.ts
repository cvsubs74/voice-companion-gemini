
// Gemini AI service
import { toast } from "sonner";

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  error?: {
    message: string;
  };
}

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

class GeminiService {
  private apiKey: string | null = null;
  
  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('gemini_api_key', key);
  }
  
  getApiKey(): string | null {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('gemini_api_key');
    }
    return this.apiKey;
  }
  
  clearApiKey() {
    this.apiKey = null;
    localStorage.removeItem('gemini_api_key');
  }
  
  async generateResponse(prompt: string): Promise<string> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      throw new Error("API key not set. Please provide your Gemini API key.");
    }
    
    try {
      const reqBody: GeminiRequest = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      };
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reqBody),
        }
      );
      
      const data: GeminiResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response received from Gemini API");
      }
      
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Gemini API error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Gemini API error: ${errorMessage}`);
      throw error;
    }
  }
}

export default new GeminiService();
